import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = await readFile(new URL('../src/components/common/TutorialVideo.tsx', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
});

// Exercise the player with isolated media, visibility, and React hook stubs.
// No application entry point, API clients, or external video sources are loaded.
function createPlayer(props = {}) {
  const slots = [];
  const effects = [];
  let cursor = 0;
  let mounted = false;
  let tree;
  let observer;
  const document = new EventTarget();
  document.hidden = false;
  document.fullscreenEnabled = false;
  const video = {
    paused: true, muted: true, volume: 1, currentTime: 0, duration: 90, playbackRate: 1,
    readyState: 4, HAVE_FUTURE_DATA: 3, playCalls: 0, rejectPlay: false,
    play() {
      this.playCalls++;
      if (this.rejectPlay) return Promise.reject(new Error('Playback blocked'));
      this.paused = false;
      find('video').props.onPlaying();
      return Promise.resolve();
    },
    pause() {
      this.paused = true;
      find('video').props.onPause();
    },
  };
  const react = {
    useRef(initial) {
      const index = cursor++;
      return slots[index] ??= { current: initial };
    },
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], (value) => { slots[index] = value; }];
    },
    useCallback: (callback) => callback,
    useEffect(effect) { if (!mounted) effects.push(effect); },
  };
  const jsx = (type, props) => ({ type, props });
  const module = { exports: {} };
  vm.runInNewContext(outputText, {
    exports: module.exports,
    require(name) {
      if (name === 'react') return react;
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (name === 'lucide-react') return {};
      return { default: {} };
    },
    document,
    window: { setTimeout, clearTimeout },
    IntersectionObserver: class {
      constructor(callback) { observer = callback; }
      observe() {}
      disconnect() {}
    },
  });
  function render() {
    cursor = 0;
    tree = module.exports.default({ src: 'mock-video', title: 'Book a service', onError() {}, ...props });
    find('video').props.ref.current = video;
    tree.props.ref.current = {};
    return tree;
  }
  function find(type, label) {
    function visit(node) {
      if (!node || typeof node !== 'object') return undefined;
      if (node.type === type && (!label || node.props['aria-label'] === label)) return node;
      return [node.props?.children].flat().map(visit).find(Boolean);
    }
    const element = visit(tree);
    assert.ok(element, `Missing ${type}: ${label ?? ''}`);
    return element;
  }
  render();
  const cleanups = effects.map((effect) => effect());
  mounted = true;
  render();
  return {
    video, find, render,
    get aspectRatio() { return tree.props.style['--tutorial-video-ratio']; },
    dimensions(width, height, event = 'onLoadedMetadata') {
      video.videoWidth = width;
      video.videoHeight = height;
      find('video').props[event]({ currentTarget: video });
      render();
    },
    inView(visible) { observer([{ isIntersecting: visible, intersectionRatio: visible ? 1 : 0 }]); render(); },
    hidden(hidden) { document.hidden = hidden; document.dispatchEvent(new Event('visibilitychange')); render(); },
    click(label) { find('button', label).props.onClick(); render(); },
    ready() { find('video').props.onDurationChange({ currentTarget: video }); render(); },
    cleanup() { cleanups.forEach((cleanup) => cleanup?.()); },
  };
}

test('manual pause survives visibility changes; user play and restart resume playback', () => {
  const player = createPlayer();
  player.inView(true);
  assert.equal(player.video.paused, false);
  player.click('Pause video');
  player.hidden(true);
  player.hidden(false);
  player.inView(false);
  player.inView(true);
  assert.equal(player.video.paused, true);
  assert.equal(player.video.playCalls, 1);
  player.click('Play video');
  assert.equal(player.video.paused, false);
  player.video.currentTime = 25;
  player.click('Pause video');
  player.click('Restart video');
  assert.equal(player.video.currentTime, 0);
  assert.equal(player.video.paused, false);
  player.cleanup();
  assert.equal(player.video.paused, true);
});

test('video metadata detects portrait, landscape, and square recordings at their original ratios', () => {
  const ratios = [];
  const player = createPlayer({ onAspectRatioChange: (ratio) => ratios.push(ratio) });
  assert.equal(player.aspectRatio, 9 / 16);
  player.dimensions(1080, 1920);
  assert.equal(player.aspectRatio, 9 / 16);
  player.dimensions(1920, 1080);
  assert.equal(player.aspectRatio, 16 / 9);
  player.dimensions(1440, 1080);
  assert.equal(player.aspectRatio, 4 / 3);
  player.dimensions(1080, 1080);
  assert.equal(player.aspectRatio, 1);
  assert.deepEqual(ratios, [9 / 16, 16 / 9, 4 / 3, 1]);
  player.cleanup();
});

test('intrinsic video resize updates the layout and ignores unavailable dimensions', () => {
  const player = createPlayer();
  player.dimensions(1920, 1080);
  for (const [width, height] of [[0, 0], [1920, 0], [NaN, 1080], [Infinity, 1080]]) {
    player.dimensions(width, height, 'onResize');
    assert.equal(player.aspectRatio, 16 / 9);
  }
  player.dimensions(1080, 1920, 'onResize');
  assert.equal(player.aspectRatio, 9 / 16);
  player.cleanup();
});

test('automatic pauses resume when the player returns to view or the tab returns', () => {
  const player = createPlayer();
  player.inView(true);
  player.inView(false);
  assert.equal(player.video.paused, true);
  player.inView(true);
  assert.equal(player.video.paused, false);
  player.hidden(true);
  assert.equal(player.video.paused, true);
  player.hidden(false);
  assert.equal(player.video.paused, false);
  player.cleanup();
});

test('seeking, speed, and mute controls update the media element', () => {
  const player = createPlayer();
  assert.equal(player.find('input', 'Seek video').props.disabled, true);
  player.ready();
  const seek = player.find('input', 'Seek video');
  assert.equal(seek.props.max, 90);
  seek.props.onChange({ target: { value: '45' } });
  player.render();
  assert.equal(player.video.currentTime, 45);
  assert.equal(player.find('input', 'Seek video').props['aria-valuetext'], '0:45 of 1:30');
  player.find('select', 'Playback speed').props.onChange({ target: { value: '0.5' } });
  assert.equal(player.video.playbackRate, 0.5);
  player.click('Unmute video');
  assert.equal(player.video.muted, false);
  player.find('video').props.onVolumeChange({ currentTarget: player.video });
  player.render();
  player.click('Mute video');
  assert.equal(player.video.muted, true);
  player.cleanup();
});

test('rejected playback stays paused and gives a retry message', async () => {
  const player = createPlayer();
  player.video.rejectPlay = true;
  player.click('Play video');
  await Promise.resolve();
  player.render();
  assert.equal(player.video.paused, true);
  assert.match(player.find('p').props.children, /Please try again/);
  player.video.rejectPlay = false;
  player.click('Play video');
  assert.equal(player.video.paused, false);
  player.cleanup();
});
