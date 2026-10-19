import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

// Import only pure form logic; never load API clients or connect to a database.
const source = await readFile(new URL('../src/components/pages/Merchant/HoursEditor/hours.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
});
const hours = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const weekly = hours.normalizeBusinessHours([
  { day_of_week: 0, open_time: '09:00:00', close_time: '17:00:00' },
  { day_of_week: 3, open_time: '08:00:00', close_time: '20:00:00' },
]);
const makeBreak = (key, day, start, end) => ({ key, day_of_week: day, break_start: start, break_end: end, label: 'Lunch' });

const editorSource = await readFile(new URL('../src/components/pages/Merchant/HoursEditor/MerchantHoursEditor.tsx', import.meta.url), 'utf8');
const editorCode = ts.transpileModule(editorSource, {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;

async function createEditor(mode, { failLoad = false, failSave = false } = {}) {
  const slots = [];
  const effects = [];
  const calls = [];
  let cursor = 0;
  let mounted = false;
  let tree;
  const react = {
    useRef(initial) { return slots[cursor++] ??= { current: initial }; },
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], (value) => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
    },
    useEffect(effect) { if (!mounted) effects.push(effect); },
  };
  const jsx = (type, props) => ({ type, props });
  const module = { exports: {} };
  class MockService {
    async getMerchantDetails() {
      if (failLoad) throw new Error('Offline');
      return { data: { business_hours: weekly, break_hours: [makeBreak('ignored', 3, '12:00', '13:00')] } };
    }
    async updateMerchantBusinessHours(data) {
      calls.push(['business', data]);
      if (failSave) throw new Error('Save failed');
    }
    async updateMerchantBreakHours(data) {
      calls.push(['breaks', data]);
      if (failSave) throw new Error('Save failed');
    }
  }
  vm.runInNewContext(editorCode, {
    exports: module.exports,
    require(name) {
      if (name === 'react') return react;
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (name === './hours') return hours;
      if (name === './HoursDay') return { BusinessDay: 'BusinessDay', BreakDay: 'BreakDay' };
      if (name === 'react-router-dom') return { Link: 'Link', useNavigate: () => (path) => calls.push(['navigate', path]) };
      if (name === 'axios') return { isAxiosError: () => false };
      if (name.endsWith('/merchant-profile-service')) return { MerchantProfileService: MockService };
      if (name.endsWith('/toast-service')) return { ToastService: { show: (message) => calls.push(['toast', message]) } };
      if (name.endsWith('/local-storage-service')) return { LocalStorageService: class { setHasBusinessHours(value) { calls.push(['hasHours', value]); } } };
      if (name === 'lucide-react') return new Proxy({}, { get: (_, key) => String(key) });
      if (name.endsWith('/Button')) return { default: 'Button' };
      return { default: name };
    },
    requestAnimationFrame: (callback) => callback(),
  });
  function render() {
    cursor = 0;
    tree = module.exports.default({ mode });
  }
  function all(type) {
    const elements = [];
    function visit(node) {
      if (!node || typeof node !== 'object') return;
      if (node.type === type) elements.push(node);
      [node.props?.children].flat().forEach(visit);
    }
    visit(tree);
    return elements;
  }
  render();
  effects.forEach((effect) => effect());
  mounted = true;
  // Flush the mocked fetch chain, including its finally handler.
  await new Promise((resolve) => setImmediate(resolve));
  render();
  return {
    calls, render, all,
    day(index) { return all(mode === 'business' ? 'BusinessDay' : 'BreakDay')[index].props; },
    async save() {
      all('form')[0].props.onSubmit({ preventDefault() {} });
      await new Promise((resolve) => setImmediate(resolve));
      render();
    },
  };
}

test('partial saved schedules become a complete, ordered week without changing saved times', () => {
  assert.equal(weekly.length, 7);
  assert.deepEqual(weekly.map((entry) => entry.day_of_week), [0, 1, 2, 3, 4, 5, 6]);
  assert.equal(weekly[3].close_time, '20:00');
  assert.equal(weekly[1].open_time, null);
  assert.equal(hours.formatTime('00:00:00'), '12:00 AM');
  assert.equal(hours.formatTime('12:15:00'), '12:15 PM');
  assert.equal(hours.formatTime('20:45:00'), '8:45 PM');
});

test('business-hour payload retains the API time format and omits closed days', () => {
  assert.deepEqual(hours.businessHoursPayload(weekly), [
    { day_of_week: 0, open_time: '09:00:00', close_time: '17:00:00' },
    { day_of_week: 3, open_time: '08:00:00', close_time: '20:00:00' },
  ]);
});

test('business-hour validation detects incomplete, reversed, and zero-length ranges', () => {
  assert.deepEqual(hours.validateBusinessHours(weekly), {});
  for (const [open, close] of [['09:00', null], [null, '17:00'], ['18:00', '09:00'], ['09:00', '09:00']]) {
    const errors = hours.validateBusinessHours([{ day_of_week: 2, open_time: open, close_time: close }]);
    assert.ok(errors[2]);
  }
});

test('editing multiple breaks on a later day targets its stable key without mutating other rows', () => {
  const monday = makeBreak('monday', 0, '12:00', '13:00');
  const thursday = makeBreak('thursday', 3, '12:00', '13:00');
  const afternoon = makeBreak('afternoon', 3, '15:00', '15:30');
  const original = [monday, thursday, afternoon];
  const updated = hours.updateBreak(original, 'afternoon', { break_start: '16:00', label: 'Team time' });
  assert.equal(updated[2].break_start, '16:00');
  assert.equal(updated[2].label, 'Team time');
  assert.equal(original[2].break_start, '15:00');
  assert.equal(updated[0], monday);
  assert.equal(updated[1], thursday);
  const afterRemoval = updated.filter((entry) => entry.key !== 'thursday');
  assert.equal(hours.updateBreak(afterRemoval, 'afternoon', { break_end: '16:30' })[1].break_end, '16:30');
});

test('break validation enforces complete, increasing times on open days and inside business hours', () => {
  const valid = makeBreak('valid', 0, '12:00', '13:00');
  assert.deepEqual(hours.validateBreakHours([valid], weekly), {});
  for (const entry of [
    { ...valid, break_start: null }, { ...valid, break_end: null },
    { ...valid, break_end: '11:00' }, { ...valid, break_end: '12:00' },
    { ...valid, day_of_week: 1 }, { ...valid, break_start: '08:00' },
    { ...valid, break_end: '18:00' },
  ]) assert.ok(hours.validateBreakHours([entry], weekly).valid);
  assert.deepEqual(hours.validateBreakHours([makeBreak('whole-day', 0, '09:00', '17:00')], weekly), {});
});

test('break overlap checks match API boundaries, including contained and touching ranges', () => {
  const first = makeBreak('first', 0, '12:00', '13:00');
  for (const [start, end] of [['12:00', '13:00'], ['12:15', '12:45'], ['11:00', '14:00'], ['13:00', '14:00'], ['11:00', '12:00']]) {
    const errors = hours.validateBreakHours([first, makeBreak('second', 0, start, end)], weekly);
    assert.ok(errors.first);
    assert.ok(errors.second);
  }
  assert.deepEqual(hours.validateBreakHours([first, makeBreak('later', 0, '13:15', '14:00')], weekly), {});
  assert.deepEqual(hours.validateBreakHours([first, makeBreak('different-day', 3, '12:00', '13:00')], weekly), {});
});

test('break payload strips editor keys, supplies optional labels, and supports clearing all breaks', () => {
  assert.deepEqual(hours.breakHoursPayload([{ ...makeBreak('local-key', 3, '12:00:00', '13:00:00'), id: 42, label: '  Lunch  ' }]), [
    { day_of_week: 3, break_start: '12:00', break_end: '13:00', label: 'Lunch' },
  ]);
  assert.equal(hours.breakHoursPayload([{ ...makeBreak('blank-label', 0, '12:00', '13:00'), label: '  ' }])[0].label, 'Break');
  assert.deepEqual(hours.breakHoursPayload([]), []);
});

test('editor saves business hours in place, clears unsaved status, and allows further edits', async () => {
  const editor = await createEditor('business');
  editor.day(3).onChange('close_time', '19:00');
  editor.render();
  await editor.save();
  const payload = editor.calls.find(([type]) => type === 'business')[1];
  assert.equal(payload[1].close_time, '19:00:00');
  assert.ok(editor.calls.some(([type, value]) => type === 'hasHours' && value === true));
  assert.equal(editor.calls.some(([type]) => type === 'navigate'), false);
  assert.equal(editor.day(3).hours.close_time, '19:00');
  assert.equal(editor.all('Button').find((node) => node.props.type === 'submit').props.disabled, true);
  editor.day(3).onChange('close_time', '18:00');
  editor.render();
  assert.equal(editor.all('Button').find((node) => node.props.type === 'submit').props.disabled, false);
  await editor.save();
  assert.equal(editor.calls.filter(([type]) => type === 'business')[1][1][1].close_time, '18:00:00');
  assert.equal(editor.calls.some(([type]) => type === 'navigate'), false);
});

test('editor blocks partial and all-closed business schedules before calling the API', async () => {
  const editor = await createEditor('business');
  editor.day(3).onChange('close_time', '');
  editor.render();
  await editor.save();
  assert.equal(editor.calls.length, 0);
  assert.ok(editor.day(3).error);
  editor.day(3).onToggle();
  editor.render();
  editor.day(0).onToggle();
  editor.render();
  await editor.save();
  assert.equal(editor.calls.length, 0);
  assert.ok(editor.all('div').some((node) => node.props.role === 'alert'));
});

test('editor updates a Thursday break, preserves drafts after failed save, and allows removing all breaks', async () => {
  const editor = await createEditor('breaks', { failSave: true });
  const key = editor.day(3).breaks[0].key;
  editor.day(3).onChange(key, { break_end: '14:00' });
  editor.render();
  await editor.save();
  assert.equal(editor.calls[0][0], 'breaks');
  assert.equal(editor.calls[0][1][0].break_end, '14:00');
  assert.equal(editor.day(3).breaks[0].break_end, '14:00');
  assert.ok(editor.all('div').some((node) => node.props.role === 'alert'));
  assert.equal(editor.calls.some(([type]) => type === 'navigate'), false);
  editor.day(3).onRemove(key);
  editor.render();
  await editor.save();
  assert.deepEqual(editor.calls.filter(([type]) => type === 'breaks')[1][1], []);
});

test('load failure shows a retry action and does not expose an editable empty schedule', async () => {
  const editor = await createEditor('business', { failLoad: true });
  assert.equal(editor.all('form').length, 0);
  assert.equal(editor.all('BusinessDay').length, 0);
  assert.ok(editor.all('Button').some((node) => node.props.children === 'Try again'));
  assert.equal(editor.calls.length, 0);
});

test('saving the removal of the last break clears the schedule and resets unsaved status', async () => {
  const editor = await createEditor('breaks');
  editor.day(3).onRemove(editor.day(3).breaks[0].key);
  editor.render();
  await editor.save();
  assert.deepEqual(editor.calls.find(([type]) => type === 'breaks')[1], []);
  assert.equal(editor.all('Button').find((node) => node.props.type === 'submit').props.disabled, true);
  assert.equal(editor.calls.some(([type]) => type === 'navigate'), false);
});
