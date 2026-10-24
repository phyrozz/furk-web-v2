import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = await readFile(new URL('../src/components/common/LocationPicker.tsx', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: {
  jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
} }).outputText;
const result = { label: 'Paws & Care, Santa Rosa', lat: 14.3, lng: 121.1 };

function picker({ isMobile = false, ...initial } = {}) {
  const slots = [];
  const effects = [];
  const timers = new Map();
  const calls = { searches: [], changes: [], geo: [] };
  const mediaListeners = new Set();
  const media = {
    matches: isMobile,
    addEventListener: (_, listener) => mediaListeners.add(listener),
    removeEventListener: (_, listener) => mediaListeners.delete(listener),
  };
  let cursor = 0;
  let timerId = 0;
  let dirty = false;
  let tree;
  let props = { enableSearch: true, searchLocations: async query => { calls.searches.push(query); return [result]; }, onChange: (...args) => calls.changes.push(args), ...initial };
  const react = {
    useId: () => 'location',
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], value => {
        const next = typeof value === 'function' ? value(slots[index]) : value;
        if (next !== slots[index]) { slots[index] = next; dirty = true; }
      }];
    },
    useRef(initial) { return slots[cursor++] ??= { current: initial }; },
    useEffect(effect, deps) {
      const index = cursor++;
      if (!slots[index] || deps.some((value, i) => value !== slots[index].deps[i])) {
        slots[index]?.cleanup?.();
        slots[index] = { deps };
        effects.push(() => { slots[index].cleanup = effect(); });
      }
    },
  };
  const jsx = (type, props) => ({ type, props });
  const exports = {};
  vm.runInNewContext(code, {
    exports,
    window: { matchMedia: () => media, setTimeout: callback => { timers.set(++timerId, callback); return timerId; }, clearTimeout: id => timers.delete(id) },
    navigator: { geolocation: { getCurrentPosition: (success, error) => calls.geo.push({ success, error }) } },
    require(name) {
      if (name === 'react') return react;
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (name === 'leaflet') return { LatLng: class { constructor(lat, lng) { Object.assign(this, { lat, lng }); } } };
      if (name === 'react-leaflet') return { MapContainer: 'MapContainer', TileLayer: 'TileLayer', Marker: 'Marker' };
      if (name === 'lucide-react') return new Proxy({}, { get: (_, key) => String(key) });
      throw new Error(`Unexpected import ${name}`);
    },
  });
  function render() {
    let count = 0;
    do {
      dirty = false;
      cursor = 0;
      tree = exports.default(props);
      effects.splice(0).forEach(effect => effect());
      assert.ok(++count < 20, 'render converges');
    } while (dirty);
  }
  function nodes(type) {
    const found = [];
    function visit(node) {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) return node.forEach(visit);
      if (node.type === type || node.type?.name === type) found.push(node);
      visit(node.props?.children);
    }
    visit(tree);
    return found;
  }
  function click(label) {
    nodes('button').find(node => node.props.children?.includes(label)).props.onClick();
    render();
  }
  function type(query) { nodes('input')[0].props.onChange({ target: { value: query } }); render(); }
  async function flush() {
    const pending = [...timers.values()]; timers.clear();
    await Promise.all(pending.map(callback => callback())); render();
  }
  function startSearch() { const callback = timers.values().next().value; timers.clear(); return callback(); }
  function update(next) { props = { ...props, ...next }; render(); }
  function unmount() { slots.forEach(slot => slot?.cleanup?.()); }
  function updateMedia(matches) { media.matches = matches; mediaListeners.forEach(listener => listener()); render(); }
  render();
  return { calls, nodes, click, type, flush, render, startSearch, update, unmount, updateMedia };
}

test('mobile map preview ignores clicks until editing is activated and locks again when done', () => {
  const map = picker({ isMobile: true, mobileInteractionGuard: true });
  assert.equal(map.nodes('MapEvents')[0].props.readonly, true);
  assert.equal(map.nodes('Marker')[0].props.draggable, false);
  assert.equal(map.nodes('MapInteraction')[0].props.enabled, false);
  map.nodes('MapEvents')[0].props.onMapClick({ latlng: { lat: 15, lng: 122 } }); map.render();
  assert.equal(map.calls.changes.length, 0);
  map.click('Tap to adjust pin');
  assert.equal(map.nodes('Marker')[0].props.draggable, true);
  assert.equal(map.nodes('MapInteraction')[0].props.enabled, true);
  map.nodes('MapEvents')[0].props.onMapClick({ latlng: { lat: 15, lng: 122 } }); map.render();
  assert.deepEqual(map.calls.changes, [[15, 122]]);
  map.click('Done adjusting');
  assert.equal(map.nodes('Marker')[0].props.draggable, false);
  assert.equal(map.nodes('MapInteraction')[0].props.enabled, false);
  map.nodes('MapEvents')[0].props.onMapClick({ latlng: { lat: 14, lng: 121 } }); map.render();
  assert.deepEqual(map.calls.changes, [[15, 122]]);
});

test('desktop maps remain interactive and changing viewport resets mobile edit mode', () => {
  const map = picker({ mobileInteractionGuard: true });
  assert.equal(map.nodes('MapEvents')[0].props.readonly, false);
  assert.equal(map.nodes('button').some(node => node.props['aria-pressed'] !== undefined), false);
  map.updateMedia(true);
  assert.equal(map.nodes('MapEvents')[0].props.readonly, true);
  map.click('Tap to adjust pin');
  map.updateMedia(false);
  assert.equal(map.nodes('MapEvents')[0].props.readonly, false);
  map.updateMedia(true);
  assert.equal(map.nodes('MapEvents')[0].props.readonly, true);
});

test('read-only state disables pin editing even when mobile edit mode was active', () => {
  const map = picker({ isMobile: true, mobileInteractionGuard: true });
  map.click('Tap to adjust pin');
  map.update({ readonly: true });
  assert.equal(map.nodes('MapEvents')[0].props.readonly, true);
  assert.equal(map.nodes('Marker')[0].props.draggable, false);
  assert.equal(map.nodes('button').length, 0);
  map.update({ readonly: false });
  assert.equal(map.nodes('MapInteraction')[0].props.enabled, false);
});

test('address lookup is explicit and falls back to the selected area with clear guidance', async () => {
  const queries = [];
  const map = picker({ addressQuery: '12 Main Street, Central, Manila', areaQuery: 'Central, Manila', searchLocations: async query => {
    queries.push(query); return query.startsWith('12') ? [] : [result];
  } });
  await map.flush();
  assert.equal(queries.length, 0);
  map.click('Find address on map');
  await map.flush();
  assert.deepEqual(queries, ['12 Main Street, Central, Manila', 'Central, Manila']);
  assert.deepEqual(map.calls.changes, [[14.3, 121.1]]);
  assert.match(map.nodes('p').find(node => node.props.role === 'status').props.children, /found your area, but not the street address/);
});

test('manual results require selection and support keyboard selection without form submission', async () => {
  const map = picker();
  map.type('Paws');
  await map.flush();
  assert.equal(map.calls.changes.length, 0);
  assert.equal(map.nodes('ul').length, 1);
  let prevented = 0;
  map.nodes('input')[0].props.onKeyDown({ key: 'ArrowDown', preventDefault() { prevented++; } }); map.render();
  map.nodes('input')[0].props.onKeyDown({ key: 'Enter', preventDefault() { prevented++; } }); map.render();
  assert.equal(prevented, 2);
  assert.deepEqual(map.calls.changes, [[14.3, 121.1]]);
  assert.equal(map.nodes('input')[0].props.value, result.label);
  await map.flush();
  assert.deepEqual(map.calls.searches, ['Paws']);
});

test('a late search cannot overwrite a manually placed pin', async () => {
  let finish;
  const map = picker({ addressQuery: 'Main Street, Manila', searchLocations: () => new Promise(resolve => { finish = resolve; }) });
  map.click('Find address on map');
  const pending = map.startSearch();
  map.nodes('MapEvents')[0].props.onMapClick({ latlng: { lat: 15, lng: 122 } }); map.render();
  finish([result]); await pending; map.render();
  assert.deepEqual(map.calls.changes, [[15, 122]]);
});

test('changing the address, disabling editing, and unmounting invalidate pending results', async () => {
  for (const action of ['address', 'readonly', 'unmount']) {
    let finish;
    const map = picker({ addressQuery: 'Old address', searchLocations: () => new Promise(resolve => { finish = resolve; }) });
    map.click('Find address on map');
    const pending = map.startSearch();
    if (action === 'address') map.update({ addressQuery: 'New address' });
    if (action === 'readonly') map.update({ readonly: true });
    if (action === 'unmount') map.unmount();
    finish([result]); await pending;
    assert.equal(map.calls.changes.length, 0, action);
  }
});

test('search failures and empty matches give actionable feedback', async () => {
  for (const fail of [false, true]) {
    const map = picker({ searchLocations: async () => { if (fail) throw new Error('Offline'); return []; } });
    map.type('Unknown place'); await map.flush();
    assert.equal(map.calls.changes.length, 0);
    assert.match(map.nodes('p').find(node => node.props.role === 'status').props.children, fail ? /search is unavailable/ : /No matching places/);
  }
});

test('geolocation errors are visible and old geolocation cannot overwrite a newer map click', () => {
  const map = picker();
  map.click('Use my current location');
  map.calls.geo[0].error({ code: 1 }); map.render();
  assert.match(map.nodes('p').find(node => node.props.role === 'status').props.children, /access was denied/);
  map.click('Use my current location');
  map.nodes('MapEvents')[0].props.onMapClick({ latlng: { lat: 15, lng: 122 } }); map.render();
  map.calls.geo[1].success({ coords: { latitude: 14, longitude: 121 } }); map.render();
  assert.deepEqual(map.calls.changes, [[15, 122]]);
});

test('legacy address search skips mount and still updates on subsequent address changes', async () => {
  const map = picker({ searchValue: 'Saved address' });
  await map.flush();
  assert.equal(map.calls.searches.length, 0);
  map.update({ searchValue: 'New address' }); await map.flush();
  assert.deepEqual(map.calls.searches, ['New address']);
  assert.deepEqual(map.calls.changes, [[14.3, 121.1]]);
});
