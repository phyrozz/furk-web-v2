import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = await readFile(new URL('../src/services/merchant-verification/merchant-verification-service.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;

function service(http, put = async () => {}) {
  const exports = {};
  vm.runInNewContext(code, { exports, require(name) {
    if (name === 'axios') return { default: { put } };
    if (name.endsWith('/http')) return { http };
    throw new Error(`Unexpected import: ${name}`);
  } });
  return new exports.MerchantVerificationService();
}

test('API service IDs match the string IDs restored from drafts, so selected services stay filtered out', async () => {
  const client = service({ post: async () => ({ data: [{ id: 3, name: 'Grooming', description: '' }] }) });
  const { data } = await client.listServiceGroups(20, 0, '');
  assert.equal(data[0].id, '3');
});

test('document uploads use the server-owned key and returned content type when the browser MIME type is empty', async () => {
  const file = { name: 'profile.pdf', size: 100, type: '' };
  const calls = [];
  const client = service({ post: async (url, body) => {
    calls.push({ url, body });
    return { data: { key: 'merchant-verification-drafts/17/BUSINESS/company_profile/owned.pdf', upload_url: 'https://upload.invalid', content_type: 'application/pdf' } };
  } }, async (...args) => calls.push(args));
  const saved = await client.uploadDraftFile('BUSINESS', 'company_profile', file);
  assert.equal(calls[0].url, '/merchant-application/draft/upload-url');
  assert.equal(calls[0].body.requirement_id, 'company_profile');
  assert.equal(calls[1][0], 'https://upload.invalid');
  assert.equal(calls[1][1], file);
  assert.equal(calls[1][2].headers['Content-Type'], 'application/pdf');
  assert.equal(saved.key, 'merchant-verification-drafts/17/BUSINESS/company_profile/owned.pdf');
});
