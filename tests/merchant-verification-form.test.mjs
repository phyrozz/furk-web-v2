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
const draftHelpers = pureModule(await compile('verification-draft.ts'));
const formCode = await compile('MerchantVerificationForm.tsx');
const cardCode = await compile('VerificationUploadCard.tsx');
const jsx = (type, props) => ({ type, props });

async function makeForm({ profile, profileFails = false, uploadFailure, deferredUpload, mobile = false, savedDraft = null, draftLoadFails = false, saveFails = false } = {}) {
  const slots = [];
  const effects = [];
  const calls = { submissions: [], drafts: [], uploads: [], navigation: [], revoked: [], messages: [], searches: [], storage: new Map(), uploadFailure };
  const navigate = path => calls.navigation.push(path);
  let cursor = 0;
  let tree;
  let urlCount = 0;
  let dirty = false;
  const mediaListeners = new Set();
  const media = { matches: mobile, addEventListener: (_, listener) => mediaListeners.add(listener), removeEventListener: (_, listener) => mediaListeners.delete(listener) };
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], value => {
        const next = typeof value === 'function' ? value(slots[index]) : value;
        if (next !== slots[index]) { slots[index] = next; dirty = true; }
      }];
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
    window: { matchMedia: () => media, addEventListener() {}, removeEventListener() {}, confirm: () => true },
    URL: { createObjectURL: () => `blob:preview-${++urlCount}`, revokeObjectURL: url => calls.revoked.push(url) },
    requestAnimationFrame: callback => callback(),
    localStorage: { setItem: (key, value) => calls.storage.set(key, value) },
    require(name) {
      if (name === 'react') return react;
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (name === 'lucide-react') return new Proxy({}, { get: (_, key) => String(key) });
      if (name === 'axios') return { isAxiosError: () => false };
      if (name === 'react-router-dom') return { Link: 'Link', useLocation: () => ({ state: profile || profileFails ? { isForReapplying: true } : null }), useNavigate: () => navigate };
      if (name === './types') return requirements;
      if (name === './verification-form') return helpers;
      if (name === './verification-draft') return draftHelpers;
      if (name.endsWith('.module.css')) return { default: new Proxy({}, { get: (_, key) => String(key) }) };
      if (name.endsWith('/merchant-verification-service')) return { MerchantVerificationService: class {
        async getDraft() { if (draftLoadFails) throw new Error('Offline'); return { data: savedDraft }; }
        async getOwnApplication() { return { data: null }; }
        async saveDraft(payload, version) {
          if (saveFails) throw new Error('Offline');
          calls.drafts.push({ payload, version });
          return { data: { version: (version ?? 0) + 1, modified_at: '2026-10-24T08:00:00Z' } };
        }
        async submitMerchantApplicationDetails(data) { calls.submissions.push(data); return { data: { application_id: 902 } }; }
        async listServiceGroups(...args) { calls.searches.push(args); return { data: [] }; }
        async uploadDraftFile(provider, id, file) {
          const key = `merchant-verification-drafts/17/${provider}/${id}/unique-${file.name}`;
          calls.uploads.push({ file, key });
          if (file.name === calls.uploadFailure) throw new Error('Upload failed');
          if (file.name === deferredUpload?.name) await deferredUpload.promise;
          return { requirement_id: id, key, name: file.name };
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
      if (name.includes('/common/') || name === './VerificationUploadCard' || name === './AddressSelect') return { default: name.split('/').at(-1) };
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  function render() {
    let count = 0;
    do {
      dirty = false;
      cursor = 0;
      tree = exports.default();
      for (const effect of effects.splice(0)) effect();
      assert.ok(++count < 20, 'render converges');
    } while (dirty);
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
  function fillProviderDetails() {
    nodes('Input').find(node => node.props.id === 'businessName').props.onChange({ target: { value: 'Paws & Care' } });
    nodes('MultipleAutocomplete')[0].props.onChange([{ id: '3', name: 'Grooming' }]);
    render();
  }
  function fillLocation() {
    nodes('Input').find(node => node.props.id === 'address').props.onChange({ target: { value: '12 Main Street' } });
    for (const [id, value] of [['province', 'Metro Manila'], ['city', 'Manila'], ['barangay', 'Central']]) nodes('AddressSelect').find(node => node.props.id === id).props.onChange(value);
    nodes('LocationPicker')[0].props.onChange(14.5, 121);
    render();
    nodes('input').find(node => node.props.id === 'confirm-location').props.onChange({ target: { checked: true } });
    render();
  }
  function fillDetails() { fillProviderDetails(); fillLocation(); }
  function click(id) { nodes('Button').find(node => node.props.id === id).props.onClick(); render(); }
  function resize(matches) { media.matches = matches; mediaListeners.forEach(listener => listener()); render(); }
  function selectFile(id, file) { card(id).props.onFileChange(card(id).props.requirement, file); render(); }
  function fillFiles() {
    for (const node of nodes('VerificationUploadCard').filter(node => node.props.requirement.required)) {
      const req = node.props.requirement;
      selectFile(req.id, { name: req.id + req.acceptedFormats[0], size: 1024, type: req.type === 'photo' ? 'image/jpeg' : req.type === 'video' ? 'video/mp4' : 'application/pdf' });
    }
  }
  async function submit() { const result = nodes('form')[0].props.onSubmit({ preventDefault() {} }); render(); await result; render(); }
  async function settle() { await new Promise(setImmediate); render(); }
  async function save() {
    const result = nodes().find(node => node.props.children === 'Save & finish later' && node.props.onClick).props.onClick();
    render(); await result; render();
  }
  render();
  await settle();
  return { calls, nodes, render, card, selectProvider, fillDetails, fillProviderDetails, fillLocation, selectFile, fillFiles, submit, save, settle, click, resize };
}

test('mobile displays one step at a time and validates only the current step before advancing', async () => {
  const form = await makeForm({ mobile: true });
  assert.deepEqual(form.nodes('section').map(node => node.props.id), ['provider-details']);
  assert.equal(form.nodes('VerificationUploadCard').length, 0);
  assert.equal(form.nodes('Button').some(node => node.props.type === 'submit'), false);
  form.click('verification-next');
  assert.deepEqual(form.nodes('section').map(node => node.props.id), ['provider-details']);
  const errorLinks = form.nodes('a').map(node => node.props.href);
  assert.ok(errorLinks.includes('#businessName'));
  assert.ok(errorLinks.includes('#serviceGroups'));
  assert.equal(errorLinks.includes('#address'), false);
  assert.equal(errorLinks.some(href => href?.startsWith('#upload-')), false);
  form.fillProviderDetails();
  form.click('verification-next');
  assert.deepEqual(form.nodes('section').map(node => node.props.id), ['provider-location']);
  form.click('verification-next');
  assert.deepEqual(form.nodes('section').map(node => node.props.id), ['provider-location']);
  form.fillLocation();
  form.nodes('input').find(node => node.props.id === 'confirm-location').props.onChange({ target: { checked: false } }); form.render();
  form.click('verification-next');
  assert.ok(form.nodes('a').some(node => node.props.href === '#confirm-location'));
  assert.deepEqual(form.nodes('section').map(node => node.props.id), ['provider-location']);
  form.nodes('input').find(node => node.props.id === 'confirm-location').props.onChange({ target: { checked: true } }); form.render();
  form.click('verification-next');
  assert.deepEqual(form.nodes('section').map(node => node.props.id), ['verification-uploads']);
  assert.equal(form.calls.submissions.length, 0);
  assert.equal(form.calls.uploads.length, 0);
  assert.equal(form.nodes('Button').find(node => node.props.id === 'verification-submit').props.type, 'submit');
});

test('mobile preserves details, the confirmed pin, and selected files across Back and Next', async () => {
  const form = await makeForm({ mobile: true });
  form.fillProviderDetails(); form.click('verification-next');
  form.fillLocation(); form.click('verification-next');
  form.fillFiles();
  const preview = form.card('bank_details').props.upload.preview;
  form.click('verification-back');
  assert.equal(form.nodes('input').find(node => node.props.id === 'confirm-location').props.checked, true);
  assert.equal(form.nodes('LocationPicker')[0].props.initialLat, 14.5);
  assert.equal(form.nodes('Input').find(node => node.props.id === 'address').props.value, '12 Main Street');
  form.click('verification-back');
  assert.equal(form.nodes('Input').find(node => node.props.id === 'businessName').props.value, 'Paws & Care');
  assert.equal(form.nodes('MultipleAutocomplete')[0].props.values[0].name, 'Grooming');
  form.click('verification-next'); form.click('verification-next');
  assert.equal(form.card('bank_details').props.upload.preview, preview);
  assert.equal(form.calls.revoked.length, 0);
  await form.submit();
  assert.equal(form.calls.submissions.length, 1);
  assert.equal(form.calls.drafts[0].payload.lat, 14.5);
});

test('Enter on an early mobile step advances without submitting and final submission checks documents', async () => {
  const form = await makeForm({ mobile: true });
  form.fillProviderDetails();
  await form.submit();
  assert.deepEqual(form.nodes('section').map(node => node.props.id), ['provider-location']);
  assert.equal(form.calls.submissions.length, 0);
  form.fillLocation();
  await form.submit();
  assert.deepEqual(form.nodes('section').map(node => node.props.id), ['verification-uploads']);
  assert.equal(form.calls.submissions.length, 0);
  await form.submit();
  assert.equal(form.calls.submissions.length, 0);
  assert.ok(form.nodes('a').some(node => node.props.href?.startsWith('#upload-')));
});

test('switching between mobile and desktop preserves the current step and all entered values', async () => {
  const form = await makeForm({ mobile: true });
  form.fillProviderDetails(); form.click('verification-next'); form.fillLocation();
  form.resize(false);
  assert.deepEqual(form.nodes('section').map(node => node.props.id), ['provider-details', 'provider-location', 'verification-uploads']);
  assert.equal(form.nodes('Input').find(node => node.props.id === 'businessName').props.value, 'Paws & Care');
  assert.equal(form.nodes('Button').some(node => node.props.id === 'verification-back'), false);
  form.resize(true);
  assert.deepEqual(form.nodes('section').map(node => node.props.id), ['provider-location']);
  assert.equal(form.nodes('input').find(node => node.props.id === 'confirm-location').props.checked, true);
});

test('final mobile validation opens an earlier step if desktop edits made it incomplete', async () => {
  const form = await makeForm({ mobile: true });
  form.fillProviderDetails(); form.click('verification-next');
  form.fillLocation(); form.click('verification-next'); form.fillFiles();
  form.resize(false);
  form.nodes('Input').find(node => node.props.id === 'businessName').props.onChange({ target: { value: '' } }); form.render();
  form.resize(true);
  await form.submit();
  assert.equal(form.calls.submissions.length, 0);
  assert.deepEqual(form.nodes('section').map(node => node.props.id), ['provider-details']);
  assert.ok(form.nodes('a').some(node => node.props.href === '#businessName'));
});

test('businesses and freelancers save their uploaded requirements before submitting the saved version', async () => {
  for (const provider of ['BUSINESS', 'FREELANCE']) {
    const form = await makeForm();
    form.selectProvider(provider);
    form.fillDetails();
    form.fillFiles();
    await form.submit();
    assert.equal(form.calls.submissions.length, 1);
    assert.equal(form.calls.submissions[0], 1);
    const submitted = form.calls.drafts[0].payload;
    assert.equal(submitted.merchant_type, provider);
    assert.equal(submitted.business_name, 'Paws & Care');
    assert.equal(submitted.service_group_ids[0], 3);
    assert.equal(submitted.province, 'Metro Manila');
    assert.equal(submitted.lat, 14.5);
    assert.equal(submitted.long, 121);
    const expected = (provider === 'BUSINESS' ? requirements.businessMerchantRequirements : requirements.freelanceMerchantRequirements).filter(req => req.required);
    assert.equal(form.calls.uploads.length, expected.length);
    for (const req of expected) assert.ok(form.calls.uploads.some(upload => upload.key.startsWith(`merchant-verification-drafts/17/${provider}/${req.id}/`)));
    assert.equal(form.calls.storage.get('merchantStatus'), 'pending');
    assert.deepEqual(form.calls.navigation, ['/merchant/verification']);
  }
});

test('missing fields and invalid optional files block submission before any external call', async () => {
  const form = await makeForm();
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

test('changing provider preserves selections for each checklist and releases replaced previews', async () => {
  const form = await makeForm();
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
  const form = await makeForm({ profile: { business_name: 'Saved professional', merchant_type: 'FREELANCE', province: 'Metro Manila', city: 'Manila', barangay: 'Central', address: '12 Saved St', latitude: 14.6, longitude: 121.1 } });
  await form.settle();
  assert.equal(form.nodes('input').find(node => node.props.checked).props.value, 'FREELANCE');
  const name = form.nodes('Input').find(node => node.props.id === 'businessName');
  assert.equal(name.props.value, 'Saved professional');
  assert.equal(name.props.disabled, true);
  assert.equal(form.nodes('AddressSelect').find(node => node.props.id === 'city').props.value, 'Manila');
  assert.equal(form.nodes('LocationPicker')[0].props.initialLng, 121.1);
});

test('a profile load failure shows retry rather than a locked empty form', async () => {
  const form = await makeForm({ profileFails: true });
  await form.settle();
  assert.equal(form.nodes('form').length, 0);
  assert.ok(form.nodes('div').some(node => node.props.role === 'alert'));
  assert.equal(form.nodes('Button').length, 1);
});

test('new applications cannot submit the default map center as a confirmed location', async () => {
  const form = await makeForm();
  assert.equal(form.nodes('LocationPicker')[0].props.showMarker, false);
  assert.equal(form.nodes('LocationPicker')[0].props.addressQuery, '');
  assert.equal(form.nodes('input').find(node => node.props.id === 'confirm-location').props.disabled, true);
  form.fillDetails();
  form.fillFiles();
  form.nodes('input').find(node => node.props.id === 'confirm-location').props.onChange({ target: { checked: false } });
  form.render();
  await form.submit();
  assert.equal(form.calls.submissions.length, 0);
  assert.ok(form.nodes('a').some(node => node.props.href === '#confirm-location'));
});

test('address changes clear dependent selections and require pin confirmation again', async () => {
  const form = await makeForm();
  form.fillDetails();
  assert.equal(form.nodes('LocationPicker')[0].props.addressQuery, '12 Main Street, Central, Manila, Metro Manila, Philippines');
  form.nodes('AddressSelect').find(node => node.props.id === 'province').props.onChange('Cavite');
  form.render();
  assert.equal(form.nodes('AddressSelect').find(node => node.props.id === 'city').props.value, '');
  assert.equal(form.nodes('AddressSelect').find(node => node.props.id === 'barangay').props.value, '');
  assert.equal(form.nodes('LocationPicker')[0].props.addressQuery, '');
  const confirm = form.nodes('input').find(node => node.props.id === 'confirm-location');
  assert.equal(confirm.props.checked, false);
  assert.equal(confirm.props.disabled, true);
});

test('moving the pin keeps the address and invalidates the previous confirmation', async () => {
  const form = await makeForm();
  form.fillDetails();
  form.nodes('LocationPicker')[0].props.onChange(15, 122);
  form.render();
  assert.equal(form.nodes('input').find(node => node.props.id === 'confirm-location').props.checked, false);
  assert.equal(form.nodes('Input').find(node => node.props.id === 'address').props.value, '12 Main Street');
  assert.equal(form.nodes('LocationPicker')[0].props.initialLat, 15);
});

test('failed uploads wait for remaining transfers before allowing retry and retain selected files', async () => {
  let finish;
  const promise = new Promise(resolve => { finish = resolve; });
  const form = await makeForm({ uploadFailure: 'company_profile.pdf', deferredUpload: { name: 'bank_details.jpg', promise } });
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

test('incomplete mobile details can be saved without submitting an application', async () => {
  const form = await makeForm({ mobile: true });
  form.fillProviderDetails();
  await form.save();
  assert.equal(form.calls.drafts.length, 1);
  assert.equal(form.calls.drafts[0].version, null);
  assert.equal(form.calls.drafts[0].payload.business_name, 'Paws & Care');
  assert.equal(form.calls.drafts[0].payload.address, '');
  assert.equal(form.calls.drafts[0].payload.current_step, 1);
  assert.equal(form.calls.submissions.length, 0);
  assert.equal(form.calls.storage.has('merchantStatus'), false);
  assert.deepEqual(form.calls.navigation, ['/merchant/verification']);
});

const savedDraft = {
  business_name: 'Saved pet business', merchant_type: 'BUSINESS',
  province: 'Metro Manila', city: 'Manila', barangay: 'Central', address: '12 Saved St',
  lat: 14.6, long: 121.1, pin_placed: true, pin_confirmed: true, current_step: 3,
  service_group_ids: [3], service_groups: [{ id: 3, name: 'Grooming', description: '' }],
  version: 7, modified_at: '2026-10-24T08:00:00Z',
  files_by_type: { BUSINESS: [{ requirement_id: 'bank_details', key: 'draft/bank.jpg', name: 'saved-bank.jpg', url: 'https://files.invalid/bank.jpg', media_type: 'image' }], FREELANCE: [] },
};

test('a saved draft resumes its mobile step, pin, services, and remote files without reuploading', async () => {
  const form = await makeForm({ mobile: true, savedDraft });
  assert.deepEqual(form.nodes('section').map(node => node.props.id), ['verification-uploads']);
  assert.equal(form.card('bank_details').props.upload.saved.key, 'draft/bank.jpg');
  assert.equal(form.card('bank_details').props.upload.file, undefined);
  form.click('verification-back');
  assert.equal(form.nodes('input').find(node => node.props.id === 'confirm-location').props.checked, true);
  assert.equal(form.nodes('LocationPicker')[0].props.initialLng, 121.1);
  form.click('verification-back');
  assert.equal(form.nodes('Input').find(node => node.props.id === 'businessName').props.value, 'Saved pet business');
  assert.equal(form.nodes('MultipleAutocomplete')[0].props.values[0].id, '3');
  await form.save();
  assert.equal(form.calls.uploads.length, 0);
  assert.equal(form.calls.drafts[0].version, 7);
  assert.equal(form.calls.drafts[0].payload.files_by_type.BUSINESS[0].key, 'draft/bank.jpg');
});

test('removing a saved document updates the draft manifest without revoking remote URLs', async () => {
  const form = await makeForm({ savedDraft });
  form.card('bank_details').props.onRemove('bank_details'); form.render();
  await form.save();
  assert.equal(form.calls.drafts[0].payload.files_by_type.BUSINESS.length, 0);
  assert.equal(form.calls.revoked.length, 0);
});

test('a partially failed save keeps successful uploads and retries only unsaved files', async () => {
  const form = await makeForm({ uploadFailure: 'company_profile.pdf' });
  form.selectFile('company_profile', { name: 'company_profile.pdf', size: 100, type: 'application/pdf' });
  form.selectFile('bank_details', { name: 'bank.jpg', size: 100, type: 'image/jpeg' });
  await form.save();
  assert.equal(form.calls.navigation.length, 0);
  assert.equal(form.calls.drafts[0].payload.files_by_type.BUSINESS.length, 1);
  assert.ok(form.card('bank_details').props.upload.saved);
  assert.ok(form.card('company_profile').props.upload.file);
  assert.equal(form.calls.submissions.length, 0);
  form.calls.uploadFailure = null;
  await form.save();
  assert.equal(form.calls.uploads.filter(upload => upload.file.name === 'bank.jpg').length, 1);
  assert.equal(form.calls.drafts[1].version, 1);
  assert.equal(form.calls.drafts[1].payload.files_by_type.BUSINESS.length, 2);
  assert.deepEqual(form.calls.navigation, ['/merchant/verification']);
});

test('draft load and save failures keep the merchant from overwriting or leaving unsaved work', async () => {
  const unavailable = await makeForm({ draftLoadFails: true });
  assert.equal(unavailable.nodes('form').length, 0);
  assert.ok(unavailable.nodes('div').some(node => node.props.role === 'alert'));
  const form = await makeForm({ saveFails: true });
  form.fillProviderDetails();
  await form.save();
  assert.equal(form.calls.navigation.length, 0);
  assert.equal(form.nodes('Input').find(node => node.props.id === 'businessName').props.value, 'Paws & Care');
  assert.ok(form.nodes('div').some(node => node.props.role === 'alert'));
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
