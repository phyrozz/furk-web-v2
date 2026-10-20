import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

// Load only state helpers and storage cleanup. No app, authentication, or API imports.
async function moduleUrl(path, imports = {}) {
  let source = await readFile(new URL(path, import.meta.url), 'utf8');
  for (const [from, to] of Object.entries(imports)) source = source.replace(`'${from}'`, JSON.stringify(to));
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
  });
  return `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`;
}

const utilsUrl = await moduleUrl('../src/utils/pet-owner-tour.ts');
const { PET_OWNER_TOUR_PREFIX, PET_OWNER_TOUR_STEP_COUNT, readPetOwnerTour, savePetOwnerTour } = await import(utilsUrl);
const { petOwnerTourSteps } = await import(await moduleUrl('../src/data/pet-owner-tour.ts'));
const { LocalStorageService } = await import(await moduleUrl('../src/services/local-storage/local-storage-service.ts', { '../../utils/pet-owner-tour': utilsUrl }));

function memoryStorage() {
  return Object.defineProperties(Object.create(null), {
    getItem: { value(key) { return this[key] ?? null; } },
    setItem: { value(key, value) { this[key] = String(value); } },
    clear: { value() { for (const key of Object.keys(this)) delete this[key]; } },
  });
}

test('new owners start with wallet preparation before pets and booking', () => {
  assert.deepEqual(readPetOwnerTour(memoryStorage(), 'new-owner'), { status: 'active', step: 0 });
  assert.equal(petOwnerTourSteps.length, PET_OWNER_TOUR_STEP_COUNT);
  assert.equal(petOwnerTourSteps[1].route, '/profile?tab=profile');
  assert.equal(petOwnerTourSteps[2].route, '/profile?tab=pets');
  assert.equal(petOwnerTourSteps[3].action.targetId, 'pet-owner-add-pet');
  assert.equal(petOwnerTourSteps.at(-1).route, '/services');
});

test('one account completing or pausing the tour does not suppress another account', () => {
  const storage = memoryStorage();
  savePetOwnerTour(storage, 'owner-a', { status: 'completed', step: 5 });
  savePetOwnerTour(storage, 'owner-b', { status: 'paused', step: 3 });
  assert.deepEqual(readPetOwnerTour(storage, 'owner-a'), { status: 'completed', step: 5 });
  assert.deepEqual(readPetOwnerTour(storage, 'owner-b'), { status: 'paused', step: 3 });
  assert.deepEqual(readPetOwnerTour(storage, 'owner-c'), { status: 'active', step: 0 });
});

test('legacy completion is respected, while a fresh signup can explicitly start its own tour', () => {
  const storage = memoryStorage();
  storage.setItem('furk_pet_owner_tour_seen', 'true');
  assert.equal(readPetOwnerTour(storage, 'existing-owner').status, 'completed');
  savePetOwnerTour(storage, 'new-owner', { status: 'active', step: 0 });
  assert.equal(readPetOwnerTour(storage, 'new-owner').status, 'active');
});

test('corrupt or out of range progress cannot produce a broken tour step', () => {
  const storage = memoryStorage();
  for (const value of ['{bad json', 'null', '{"status":"active","step":99}', '{"status":"active","step":-1}', '{"status":"active","step":1.5}', '{"status":"unknown","step":0}']) {
    storage.setItem(PET_OWNER_TOUR_PREFIX + 'owner', value);
    assert.deepEqual(readPetOwnerTour(storage, 'owner'), { status: 'active', step: 0 });
  }
  const blockedStorage = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } };
  assert.doesNotThrow(() => savePetOwnerTour(blockedStorage, 'owner', { status: 'paused', step: 1 }));
  assert.deepEqual(readPetOwnerTour(blockedStorage, 'owner'), { status: 'active', step: 0 });
});

test('logout preserves account-scoped tour progress while clearing authentication data', () => {
  const previous = globalThis.localStorage;
  const storage = memoryStorage();
  globalThis.localStorage = storage;
  try {
    savePetOwnerTour(storage, 'owner', { status: 'paused', step: 3 });
    storage.setItem('cognitoIdToken', 'fixture-token');
    storage.setItem('roleName', 'user');
    new LocalStorageService().clearAll();
    assert.equal(storage.getItem('cognitoIdToken'), null);
    assert.equal(storage.getItem('roleName'), null);
    assert.deepEqual(readPetOwnerTour(storage, 'owner'), { status: 'paused', step: 3 });
  } finally {
    globalThis.localStorage = previous;
  }
});
