import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

// This module has no application, network, authentication, or database imports.
const source = await readFile(new URL('../src/utils/booking-request.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
});
const { bookingRequestStorageKey, confirmedBookingResult, persistBookingRequest, restoreBookingRequest, submitOrRecoverBooking } =
  await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

const request = () => ({
  request_id: '7403b930-4c6d-4fd4-ad42-5b2b947c709f', service_id: 5,
  booking_datetime: '2099-01-05T02:00:00.000Z', pet_ids: [1], coupon_codes: ['A'],
});
const result = () => ({ data: { request_id: request().request_id, booking_id: 100, added_points: 20, charged_furkredits: 25 } });
const storage = () => {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
};

test('saved attempts restore the original ID and immutable payload after edits or refresh', () => {
  const cache = storage();
  const key = bookingRequestStorageKey('customer', 5);
  const original = request();
  persistBookingRequest(cache, key, original);
  original.pet_ids.push(2);
  original.coupon_codes.push('B');
  assert.deepEqual(restoreBookingRequest(cache, key), request());
  assert.equal(restoreBookingRequest(cache, bookingRequestStorageKey('other-customer', 5)), null);
  assert.equal(restoreBookingRequest(cache, bookingRequestStorageKey('customer', 6)), null);
});

test('a lost create response reconciles the committed result without a second create', async () => {
  const calls = [];
  const api = {
    createBooking: async (body) => { calls.push(['create', body]); throw new Error('Response lost'); },
    getBookingRequest: async (id) => { calls.push(['lookup', id]); return result(); },
  };
  assert.deepEqual(await submitOrRecoverBooking(api, request()), result());
  assert.equal(calls.filter(([name]) => name === 'create').length, 1);
  assert.equal(calls[1][1], request().request_id);
});

test('404 reconciliation keeps the same saved attempt for a later retry', async () => {
  const cache = storage();
  const key = bookingRequestStorageKey('customer', 5);
  persistBookingRequest(cache, key, request());
  const failure = new Error('Timeout');
  const sent = [];
  let attempts = 0;
  const api = {
    createBooking: async (body) => {
      sent.push(body);
      if (attempts++ === 0) throw failure;
      return result();
    },
    getBookingRequest: async () => { throw Object.assign(new Error('Still in flight'), { status: 404 }); },
  };
  await assert.rejects(submitOrRecoverBooking(api, restoreBookingRequest(cache, key)), (error) => error === failure);
  assert.deepEqual(restoreBookingRequest(cache, key), request());
  assert.deepEqual(await submitOrRecoverBooking(api, restoreBookingRequest(cache, key)), result());
  assert.deepEqual(sent, [request(), request()]);
});

test('unavailable status lookup preserves the original create error', async () => {
  const failure = Object.assign(new Error('Insufficient funds'), { response: { data: { booking_request_status: 'not_created' } } });
  const api = {
    createBooking: async () => { throw failure; },
    getBookingRequest: async () => { throw new Error('Offline'); },
  };
  await assert.rejects(submitOrRecoverBooking(api, request()), (error) => error === failure);
});

test('malformed or mismatched successes cannot resolve the saved attempt', async () => {
  for (const value of [null, {}, { data: { booking_id: 100 } }, { data: { request_id: request().request_id, booking_id: 0 } }]) {
    assert.throws(() => confirmedBookingResult(value, request().request_id));
  }
  const api = {
    createBooking: async () => ({}),
    getBookingRequest: async () => result(),
  };
  assert.deepEqual(await submitOrRecoverBooking(api, request()), result());
});

test('storage failure or corrupted saved data is reported without discarding an existing attempt', () => {
  assert.throws(() => persistBookingRequest({ setItem() { throw new Error('Storage unavailable'); } }, 'key', request()));
  const cache = storage();
  cache.setItem('key', '{broken');
  assert.throws(() => restoreBookingRequest(cache, 'key'));
  assert.equal(cache.getItem('key'), '{broken');
});
