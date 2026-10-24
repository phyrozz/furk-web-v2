import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const directory = '../src/components/pages/Merchant/MerchantVerification/';
async function compile(name) {
  const source = await readFile(new URL(directory + name, import.meta.url), 'utf8');
  return ts.transpileModule(source, {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
}
function pureModule(code) {
  const exports = {};
  vm.runInNewContext(code, { exports });
  return exports;
}
const requirements = pureModule(await compile('types.ts'));
const statuses = pureModule(await compile('verification-status.ts'));
const pageCode = await compile('MerchantVerificationPage.tsx');

function makePage(initialData, fail = false) {
  const state = [];
  const effects = [];
  const requests = [];
  const navigation = [];
  const storage = new Map();
  let cursor = 0;
  let nextData = initialData;
  let failRequest = fail;
  let tree;
  const jsx = (type, props) => ({ type, props });
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in state)) state[index] = initial;
      return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }];
    },
    useEffect(effect, deps) {
      const index = cursor++;
      if (!state[index] || deps.some((value, i) => value !== state[index].deps[i])) {
        state[index]?.cleanup?.();
        state[index] = { deps };
        effects.push(() => { state[index].cleanup = effect(); });
      }
    },
  };
  const exports = {};
  vm.runInNewContext(pageCode, {
    exports, AbortController,
    localStorage: { setItem: (key, value) => storage.set(key, value) },
    require(name) {
      if (name === 'react') return react;
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: 'Fragment' };
      if (name === 'lucide-react') return new Proxy({}, { get: (_, key) => String(key) });
      if (name === 'react-router-dom') return { useNavigate: () => (...args) => navigation.push(args) };
      if (name.endsWith('/merchant-verification-service')) return { MerchantVerificationService: class {
        async getOwnApplication(signal) {
          requests.push(signal);
          if (failRequest) throw new Error('Offline');
          return { data: nextData };
        }
      } };
      if (name === './types') return requirements;
      if (name === './verification-status') return statuses;
      if (name.includes('/common/')) return { default: name.split('/').at(-1) };
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  function render() {
    cursor = 0;
    tree = exports.default();
    for (const effect of effects.splice(0)) effect();
  }
  function nodes(type) {
    const found = [];
    function visit(node) {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) { node.forEach(visit); return; }
      if (typeof node.type === 'function') { visit(node.type(node.props)); return; }
      if (!type || node.type === type) found.push(node);
      visit(node.props?.children);
    }
    visit(tree);
    return found;
  }
  function textContent(node) {
    if (node === null || node === undefined || typeof node === 'boolean') return '';
    if (typeof node !== 'object') return String(node);
    if (Array.isArray(node)) return node.map(textContent).join(' ');
    if (typeof node.type === 'function') return textContent(node.type(node.props));
    return textContent(node.props?.children);
  }
  async function settle() {
    await new Promise(setImmediate);
    render();
  }
  render();
  return { nodes, textContent: (node = tree) => textContent(node).replace(/\s+/g, ' ').trim(), settle, requests, navigation, storage, render,
    respond(data, failure = false) { nextData = data; failRequest = failure; },
  };
}

const application = {
  id: 42, status: 'pending', merchant_type: 'BUSINESS', business_name: 'Paws & Care',
  address: '12 Main St', barangay: 'Central', city: 'Manila', province: 'Metro Manila',
  modified_at: '2026-10-24T08:00:00Z', business_types: [{ id: 3, name: 'Grooming' }],
  attachments: [
    { requirement_id: 'company_profile', url: 'https://files.invalid/profile.pdf', media_type: 'document' },
    { requirement_id: 'bank_details', url: 'https://files.invalid/bank.jpg', media_type: 'image' },
    { requirement_id: 'service_video_1', url: 'https://files.invalid/service.mp4', media_type: 'video' },
  ],
};

test('submitted details, previews, and file links render from the merchant API response', async () => {
  const page = makePage(application);
  assert.match(page.textContent(), /Loading your verification/);
  await page.settle();
  for (const text of ['In review', 'Paws & Care', 'Grooming', '12 Main St', '3 files available']) assert.ok(page.textContent().includes(text), `Missing visible text: ${text}`);
  assert.equal(page.nodes('img')[0].props.src, application.attachments[1].url);
  assert.equal(page.nodes('video')[0].props.src, application.attachments[2].url);
  assert.equal(page.nodes('video')[0].props.preload, 'none');
  const fileLinks = page.nodes('a').filter(node => node.props.target === '_blank');
  assert.ok(fileLinks.some(node => node.props.href === application.attachments[0].url));
  assert.ok(fileLinks.every(node => node.props.rel === 'noopener noreferrer'));
  assert.equal(page.storage.get('merchantStatus'), 'pending');
});

test('refresh fetches the current review status and updates cached merchant status', async () => {
  const page = makePage(application);
  await page.settle();
  page.respond({ ...application, status: 'verified' });
  page.nodes('PageHeader')[0].props.actions.props.onClick();
  page.render();
  await page.settle();
  assert.match(page.textContent(), /Verified/);
  assert.equal(page.storage.get('merchantStatus'), 'verified');
  assert.equal(page.requests.length, 2);
  assert.equal(page.requests[0].aborted, true);
});

test('load failures show retry without claiming verification is not submitted', async () => {
  const page = makePage(null, true);
  await page.settle();
  assert.match(page.textContent(), /could not load your verification/);
  assert.ok(!page.textContent().includes('Not submitted'));
  assert.equal(page.storage.size, 0);
  page.respond(application);
  page.nodes('Button').find(node => page.textContent(node) === 'Try again').props.onClick();
  page.render();
  await page.settle();
  assert.match(page.textContent(), /In review/);
});

test('new merchants can begin verification and do not see fabricated submitted files', async () => {
  const page = makePage(null);
  await page.settle();
  assert.match(page.textContent(), /Not submitted/);
  assert.equal(page.nodes('img').length, 0);
  page.nodes('Button').find(node => page.textContent(node) === 'Start verification').props.onClick();
  assert.equal(page.navigation[0][0], '/merchant/verify');
});

test('rejected and suspended applications retain file access and appropriate next steps', async () => {
  const rejected = makePage({ ...application, status: 'rejected' });
  await rejected.settle();
  assert.match(rejected.textContent(), /Needs attention/);
  rejected.nodes('Button').find(node => rejected.textContent(node) === 'Resubmit verification').props.onClick();
  assert.equal(rejected.navigation[0][0], '/merchant/verify');
  assert.equal(rejected.navigation[0][1].state.isForReapplying, true);
  const suspended = makePage({ ...application, status: 'suspended' });
  await suspended.settle();
  assert.match(suspended.textContent(), /Suspended/);
  assert.ok(!suspended.textContent().includes('Resubmit verification'));
  assert.ok(suspended.nodes('a').some(node => node.props.href === application.attachments[0].url));
});

test('freelance requirements distinguish optional absent uploads from missing required files', async () => {
  const page = makePage({ ...application, merchant_type: 'FREELANCE', attachments: [] });
  await page.settle();
  assert.match(page.textContent(), /Freelancer/);
  assert.match(page.textContent(), /CV\/Professional Background/);
  assert.ok(!page.textContent().includes('Company Profile'));
  const optional = page.nodes('li').find(node => page.textContent(node).includes('Permanent Address Proof'));
  assert.match(page.textContent(optional), /Optional.*Not submitted/);
  assert.ok(!page.textContent(optional).includes('File not found'));
  assert.match(page.textContent(), /Some required files could not be found/);
});
