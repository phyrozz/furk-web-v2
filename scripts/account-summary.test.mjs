import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function load(file, imports = {}) {
  const source = readFileSync(new URL(file, import.meta.url), 'utf8').replace('import.meta.env.VITE_CDN_URL', "'https://cdn.example.test/'");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const context = vm.createContext({ exports: {}, console: { error() {} }, require(name) {
    if (!(name in imports)) throw new Error(`Unexpected dependency: ${name}`);
    return imports[name];
  } });
  vm.runInContext(compiled, context);
  return context.exports;
}

const { CachedResource } = load('../src/services/account-summary/cached-resource.ts');
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

test('navigation remounts reuse both the value and snapshot without another request', async () => {
  let requests = 0;
  const resource = new CachedResource(async () => { requests++; return 42; });
  const leave = resource.subscribe(() => {});
  await resource.load();
  const cached = resource.getSnapshot();
  leave();
  const leaveNext = resource.subscribe(() => {});
  assert.equal(await resource.load(), 42);
  assert.equal(resource.getSnapshot(), cached);
  assert.equal(requests, 1);
  leaveNext();
});

test('concurrent consumers and Strict Mode mounts share one in-flight request', async () => {
  let requests = 0;
  const response = deferred();
  const resource = new CachedResource(() => { requests++; return response.promise; });
  const first = resource.load();
  assert.equal(resource.load(), first);
  await Promise.resolve();
  response.resolve(10);
  assert.equal(await first, 10);
  assert.equal(requests, 1);
});

test('a balance change refreshes in the background while keeping the old amount visible', async () => {
  const next = deferred();
  let requests = 0;
  const resource = new CachedResource(() => ++requests === 1 ? Promise.resolve(100) : next.promise);
  resource.subscribe(() => {});
  await resource.load();
  resource.invalidate();
  assert.equal(resource.getSnapshot().data, 100);
  assert.equal(resource.getSnapshot().status, 'ready');
  next.resolve(75);
  await resource.load();
  assert.equal(resource.getSnapshot().data, 75);
  assert.equal(requests, 2);
});

test('changes while a request is running discard its stale result and fetch the new balance', async () => {
  const old = deferred();
  let requests = 0;
  const resource = new CachedResource(() => ++requests === 1 ? old.promise : Promise.resolve(60));
  const request = resource.load();
  await Promise.resolve();
  resource.invalidate();
  old.resolve(100);
  assert.equal(await request, 60);
  assert.equal(resource.getSnapshot().data, 60);
  assert.equal(requests, 2);
});

test('unmounted changes defer fetching until the next consumer', async () => {
  let requests = 0;
  const resource = new CachedResource(async () => ++requests);
  await resource.load();
  resource.invalidate();
  assert.equal(requests, 1);
  assert.equal(await resource.load(), 2);
});

test('unchanged avatar URLs keep the same snapshot and do not notify subscribers', () => {
  const resource = new CachedResource(async () => '/photo.png');
  resource.set('/photo.png');
  let changes = 0;
  resource.subscribe(() => changes++);
  const snapshot = resource.getSnapshot();
  resource.set('/photo.png');
  assert.equal(resource.getSnapshot(), snapshot);
  assert.equal(changes, 0);
  resource.set('/new-photo.png');
  assert.equal(changes, 1);
});

test('logout/account changes prevent old requests and profile responses from repopulating the cache', async () => {
  const old = deferred();
  const next = deferred();
  let requests = 0;
  const resource = new CachedResource(() => ++requests === 1 ? old.promise : next.promise);
  const oldSession = resource.getSession();
  const previousRequest = resource.load();
  await Promise.resolve();
  resource.reset();
  const nextRequest = resource.load();
  await Promise.resolve();
  old.resolve('previous account');
  await previousRequest;
  resource.set('previous profile response', oldSession);
  assert.equal(resource.getSnapshot().data, null);
  assert.equal(resource.load(), nextRequest);
  next.resolve('current account');
  await nextRequest;
  assert.equal(resource.getSnapshot().data, 'current account');
});

test('failed refreshes preserve the cached balance and allow a later retry', async () => {
  let requests = 0;
  const resource = new CachedResource(async () => {
    if (++requests === 2) throw new Error('offline');
    return requests * 10;
  });
  await resource.load();
  resource.invalidate();
  await assert.rejects(resource.load(), /offline/);
  assert.equal(resource.getSnapshot().data, 10);
  assert.equal(resource.getSnapshot().status, 'error');
  assert.equal(await resource.load(), 30);
});

test('profile and booking service writes invalidate only their affected resource after success', async () => {
  let walletChanges = 0, avatarChanges = 0, fail = false;
  const avatarUpdates = [];
  const summary = {
    accountAvatar: { getSession: () => 1, invalidate: () => avatarChanges++, set: (...args) => avatarUpdates.push(args) },
    accountWallet: { getSession: () => 1, invalidate: () => walletChanges++ },
    profileImageUrl: (value) => value || '/default_profile.png',
  };
  const http = {
    get: async () => ({ data: { image_url: '/photo.png' } }),
    put: async () => { if (fail) throw new Error('write failed'); return { success: true }; },
    post: async () => { if (fail) throw new Error('write failed'); return { data: { booking_id: 1 } }; },
  };
  const imports = { '../../utils/http': { http }, '../account-summary/account-summary': summary };
  const { UserProfileService } = load('../src/services/profile/user-profile-service.ts', imports);
  const { PetServicesService } = load('../src/services/pet-services/pet-services.ts', imports);
  const profile = new UserProfileService();
  await profile.getUserDetails();
  assert.equal(avatarUpdates[0][0], '/photo.png');
  await profile.updateUserDetails({ first_name: 'Example' });
  assert.equal(avatarChanges, 0);
  await profile.updateProfileImage('profile-images/new.png');
  assert.equal(avatarChanges, 1);
  assert.equal(walletChanges, 0);
  await profile.cancelBooking(1);
  await new PetServicesService().createBooking({ request_id: 'mock' });
  await new PetServicesService().getBookingRequest('mock');
  assert.equal(walletChanges, 3);
  fail = true;
  await assert.rejects(profile.updateProfileImage('profile-images/fail.png'));
  await assert.rejects(profile.cancelBooking(1));
  await assert.rejects(new PetServicesService().createBooking({ request_id: 'fail' }));
  assert.equal(avatarChanges, 1);
  assert.equal(walletChanges, 3);
});

test('the real summary adapter loads wallet/avatar once and normalizes avatar URLs', async () => {
  const requests = [];
  const http = { async get(path) {
    requests.push(path);
    return { data: path.endsWith('get-user-wallet') ? { furkredits: 12 } : { image_url: '/profile-images/photo.png' } };
  } };
  const summary = load('../src/services/account-summary/account-summary.ts', {
    '../../utils/http': { http }, './cached-resource': { CachedResource },
  });
  await Promise.all([summary.accountWallet.load(), summary.accountAvatar.load()]);
  await Promise.all([summary.accountWallet.load(), summary.accountAvatar.load()]);
  assert.equal(requests.length, 2);
  assert.equal(summary.accountWallet.getSnapshot().data.furkredits, 12);
  assert.equal(summary.accountAvatar.getSnapshot().data, 'https://cdn.example.test/profile-images/photo.png');
  assert.equal(summary.profileImageUrl('https://other.example.test/photo.png'), 'https://other.example.test/photo.png');
  assert.equal(summary.profileImageUrl(null), '/default_profile.png');
  summary.resetAccountSummary();
  assert.equal(summary.accountWallet.getSnapshot().data, null);
  assert.equal(summary.accountAvatar.getSnapshot().data, null);
});
