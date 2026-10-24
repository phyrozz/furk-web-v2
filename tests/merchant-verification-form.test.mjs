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
const helpers = pureModule(await compile('verification-form.ts'));
const formCode = await compile('MerchantVerificationForm.tsx');
const cardCode = await compile('VerificationUploadCard.tsx');
const jsx = (type, props) => ({ type, props });

function makeForm({ profile, profileFails = false, uploadFailure, deferredUpload } = {}) {
  const slots = [];
  const effects = [];
  const calls = { submissions: [], uploads: [], navigation: [], revoked: [], messages: [], searches: [], storage: new Map() };
  let cursor = 0;
  let tree;
  let urlCount = 0;
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
    },
    useRef(initial) { const index = cursor++; return slots[index] ??= { current: initial }; },
    useMemo(compute) { cursor++; return compute(); },
    useEffect(effect, deps) {
      const index = cursor++;
      if (!slots[index] || deps.some((value, i) => value !== slots[index].deps[i])) {
        slots[index]?.cleanup?.();
        slots[index] = { deps };
        effects.push(() => { slots[index].cleanup = effect(); });
      }
    },
  };
  const exports = {};
  vm.runInNewContext(formCode, {
    exports,
    URL: { createObjectURL: () => `blob:preview-${++urlCount}`, revokeObjectURL: url => calls.revoked.push(url) },
    requestAnimationFrame: callback => callback(),
    localStorage: { setItem: (key, value) => calls.storage.set(key, value) },
    require(name) {
      if (name === 'react') return react;
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (name === 'lucide-react') return new Proxy({}, { get: (_, key) => String(key) });
      if (name === 'axios') return { isAxiosError: () => false };
      if (name === 'react-router-dom') return { Link: 'Link', useLocation: () => ({ state: profile || profileFails ? { isForReapplying: true } : null }), useNavigate: () => path => calls.navigation.push(path) };
      if (name === './types') return requirements;
      if (name === './verification-form') return helpers;
      if (name.endsWith('.module.css')) return { default: new Proxy({}, { get: (_, key) => String(key) }) };
      if (name.endsWith('/merchant-verification-service')) return { MerchantVerificationService: class {
        async submitMerchantApplicationDetails(data) { calls.submissions.push(data); return { data: { application_id: 902 } }; }
        async listServiceGroups(...args) { calls.searches.push(args); return { data: [] }; }
      } };
      if (name.endsWith('/s3-upload-service')) return { S3UploadService: class {
        generateUniqueFileName(name) { return `unique-${name}`; }
        async uploadFile(file, key) {
          calls.uploads.push({ file, key });
          if (file.name === uploadFailure) throw new Error('Upload failed');
          if (file.name === deferredUpload?.name) await deferredUpload.promise;
        }
      } };
      if (name.endsWith('/merchant-profile-service')) return { MerchantProfileService: class {
        async getMerchantDetails() { if (profileFails) throw new Error('Offline'); return { data: profile }; }
      } };
      if (name.endsWith('/location-service')) return { LocationService: class {
        getProvinces() { return ['Metro Manila', 'Cavite']; }
        getCities() { return ['Manila']; }
        getBarangays() { return ['Central']; }
      } };
      if (name.endsWith('/toast-service')) return { ToastService: { show: message => calls.messages.push(message) } };
      if (name.includes('/common/') || name === './VerificationUploadCard') return { default: name.split('/').at(-1) };
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
      if (!type || node.type === type || node.type?.name === type) found.push(node);
      visit(node.props?.children);
    }
    visit(tree);
    return found;
  }
  const card = id => nodes('VerificationUploadCard').find(node => node.props.requirement.id === id);
  function selectProvider(value) { nodes('input').find(node => node.props.value === value).props.onChange(); render(); }
  function fillDetails() {
    nodes('Input').find(node => node.props.id === 'businessName').props.onChange({ target: { value: 'Paws & Care' } });
    nodes('Input').find(node => node.props.id === 'address').props.onChange({ target: { value: '12 Main Street' } });
    nodes('MultipleAutocomplete')[0].props.onChange([{ id: '3', name: 'Grooming' }]);
    for (const [id, value] of [['province', 'Metro Manila'], ['city', 'Manila'], ['barangay', 'Central']]) nodes('AddressSelect').find(node => node.props.id === id).props.onChange(value);
    nodes('LocationPicker')[0].props.onChange(14.5, 121);
    render();
  }
  function selectFile(id, file) { card(id).props.onFileChange(card(id).props.requirement, file); render(); }
  function fillFiles() {
    for (const node of nodes('VerificationUploadCard').filter(node => node.props.requirement.required)) {
      const req = node.props.requirement;
      selectFile(req.id, { name: req.id + req.acceptedFormats[0], size: 1024, type: req.type === 'photo' ? 'image/jpeg' : req.type === 'video' ? 'video/mp4' : 'application/pdf' });
    }
  }
  async function submit() { const result = nodes('form')[0].props.onSubmit({ preventDefault() {} }); render(); await result; render(); }
  async function settle() { await new Promise(setImmediate); render(); }
  render();
  return { calls, nodes, render, card, selectProvider, fillDetails, selectFile, fillFiles, submit, settle };
}

test('businesses and freelancers submit their own requirements with the existing API contract', async () => {
  for (const provider of ['BUSINESS', 'FREELANCE']) {
    const form = makeForm();
    form.selectProvider(provider);
    form.fillDetails();
    form.fillFiles();
    await form.submit();
    assert.equal(form.calls.submissions.length, 1);
    const submitted = form.calls.submissions[0];
    assert.equal(submitted.merchantType, provider);
    assert.equal(submitted.businessName, 'Paws & Care');
    assert.equal(submitted.serviceGroups[0].id, '3');
    assert.equal(submitted.province, 'Metro Manila');
    assert.equal(submitted.lat, 14.5);
    assert.equal(submitted.long, 121);
    const expected = (provider === 'BUSINESS' ? requirements.businessMerchantRequirements : requirements.freelanceMerchantRequirements).filter(req => req.required);
    assert.equal(form.calls.uploads.length, expected.length);
    for (const req of expected) assert.ok(form.calls.uploads.some(upload => upload.key.startsWith(`merchant-verification/902/${req.id}/`)));
    assert.equal(form.calls.storage.get('merchantStatus'), 'pending');
    assert.deepEqual(form.calls.navigation, ['/merchant/verification']);
  }
});

test('missing fields and invalid optional files block submission before any external call', async () => {
  const form = makeForm();
  await form.submit();
  assert.equal(form.calls.submissions.length, 0);
  assert.ok(form.nodes('a').some(node => node.props.href === '#businessName'));
  form.selectProvider('FREELANCE');
  form.fillDetails();
  form.fillFiles();
  form.selectFile('permanent_address_proof', { name: 'proof.exe', size: 10, type: 'application/octet-stream' });
  assert.equal(form.card('permanent_address_proof').props.upload.status, 'error');
  await form.submit();
  assert.equal(form.calls.submissions.length, 0);
  form.card('permanent_address_proof').props.onRemove('permanent_address_proof');
  form.render();
  await form.submit();
  assert.equal(form.calls.submissions.length, 1);
});

test('changing provider preserves selections for each checklist and releases replaced previews', () => {
  const form = makeForm();
  form.selectFile('bank_details', { name: 'bank.jpg', size: 100, type: 'image/jpeg' });
  const firstPreview = form.card('bank_details').props.upload.preview;
  form.selectProvider('FREELANCE');
  assert.equal(form.card('bank_details').props.upload, undefined);
  assert.equal(form.card('company_profile'), undefined);
  assert.ok(form.card('cv'));
  form.selectProvider('BUSINESS');
  assert.equal(form.card('bank_details').props.upload.preview, firstPreview);
  form.selectFile('bank_details', { name: 'replacement.jpg', size: 200, type: 'image/jpeg' });
  assert.deepEqual(form.calls.revoked, [firstPreview]);
  form.selectFile('bank_details', { name: 'large.jpg', size: 6 * 1024 * 1024, type: 'image/jpeg' });
  assert.equal(form.card('bank_details').props.upload.status, 'error');
  assert.match(form.card('bank_details').props.upload.error, /too large/);
  assert.equal(form.nodes('div').find(node => node.props.role === 'progressbar').props['aria-valuenow'], 0);
});

test('resubmission loads the existing freelancer type, name, and address', async () => {
  const form = makeForm({ profile: { business_name: 'Saved professional', merchant_type: 'FREELANCE', province: 'Metro Manila', city: 'Manila', barangay: 'Central', address: '12 Saved St', latitude: 14.6, longitude: 121.1 } });
  assert.equal(form.nodes('form').length, 0);
  await form.settle();
  assert.equal(form.nodes('input').find(node => node.props.checked).props.value, 'FREELANCE');
  const name = form.nodes('Input').find(node => node.props.id === 'businessName');
  assert.equal(name.props.value, 'Saved professional');
  assert.equal(name.props.disabled, true);
  assert.equal(form.nodes('AddressSelect').find(node => node.props.id === 'city').props.value, 'Manila');
  assert.equal(form.nodes('LocationPicker')[0].props.initialLng, 121.1);
});

test('a profile load failure shows retry rather than a locked empty form', async () => {
  const form = makeForm({ profileFails: true });
  await form.settle();
  assert.equal(form.nodes('form').length, 0);
  assert.ok(form.nodes('div').some(node => node.props.role === 'alert'));
  assert.equal(form.nodes('Button').length, 1);
});

test('failed uploads wait for remaining transfers before allowing retry and retain selected files', async () => {
  let finish;
  const promise = new Promise(resolve => { finish = resolve; });
  const form = makeForm({ uploadFailure: 'company_profile.pdf', deferredUpload: { name: 'bank_details.jpg', promise } });
  form.fillDetails();
  form.fillFiles();
  const submission = form.nodes('form')[0].props.onSubmit({ preventDefault() {} });
  await form.settle();
  assert.equal(form.nodes('fieldset')[0].props.disabled, true);
  assert.equal(form.calls.navigation.length, 0);
  finish();
  await submission;
  form.render();
  assert.equal(form.nodes('fieldset')[0].props.disabled, false);
  assert.ok(form.card('bank_details').props.upload);
  assert.equal(form.calls.storage.size, 0);
});

test('upload cards accept drops, support file selection, and ignore drops during submission', () => {
  const exports = {};
  const files = [];
  vm.runInNewContext(cardCode, { exports, require(name) {
    if (name === 'react') return { useState: initial => [initial, () => {}] };
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === 'lucide-react') return new Proxy({}, { get: (_, key) => String(key) });
    throw new Error(`Unexpected import: ${name}`);
  } });
  const requirement = requirements.businessMerchantRequirements[0];
  const file = { name: 'profile.pdf', size: 100, type: 'application/pdf' };
  for (const disabled of [false, true]) {
    const tree = exports.default({ requirement, disabled, onFileChange: (...args) => files.push(args), onRemove() {} });
    const label = tree.props.children.find(node => node?.type === 'label');
    label.props.onDrop({ preventDefault() {}, dataTransfer: { files: [file] } });
    const input = label.props.children.find(node => node?.type === 'input');
    assert.equal(input.props.disabled, disabled);
  }
  assert.equal(files.length, 1);
  assert.equal(files[0][0].id, 'company_profile');
  assert.equal(files[0][1], file);
});
