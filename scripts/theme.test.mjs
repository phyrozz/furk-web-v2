import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import resolveConfig from 'tailwindcss/resolveConfig.js';
import config from '../tailwind.config.js';
import { themedColors } from '../theme-colors.js';

const source = (file) => readFileSync(new URL(file, import.meta.url), 'utf8');
const themeSource = ts.transpileModule(source('../src/theme/theme.ts'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const bootScript = source('../index.html').match(/<script>([\s\S]*?)<\/script>/)[1];

function environment(saved, systemDark = false, blocked = false) {
  const state = { dark: false, color: '' };
  const document = {
    documentElement: { classList: { toggle: (_, enabled) => { state.dark = enabled; } }, style: {} },
    querySelector: () => ({ setAttribute: (_, value) => { state.color = value; }, set content(value) { state.color = value; } }),
  };
  const context = vm.createContext({
    exports: {}, document,
    localStorage: { getItem() { if (blocked) throw new Error('Storage disabled'); return saved; } },
    matchMedia: () => ({ matches: systemDark }),
  });
  vm.runInContext(themeSource, context);
  return { context, state, document, theme: context.exports };
}

test('saved preferences, invalid values and unavailable storage resolve safely', () => {
  for (const [stored, expected] of [[null, 'system'], ['light', 'light'], ['dark', 'dark'], ['system', 'system'], ['invalid', 'system']]) {
    assert.equal(environment(stored).theme.getThemePreference(), expected);
  }
  assert.equal(environment('dark', false, true).theme.getThemePreference(), 'system');
});

test('explicit choices override the device; system follows device changes', () => {
  const { theme } = environment(null);
  assert.equal(theme.resolveTheme('light', true), 'light');
  assert.equal(theme.resolveTheme('dark', false), 'dark');
  assert.equal(theme.resolveTheme('system', true), 'dark');
  assert.equal(theme.resolveTheme('system', false), 'light');
});

test('first paint and runtime agree for every preference and device appearance', () => {
  for (const saved of [null, 'light', 'dark', 'system', 'invalid']) {
    for (const systemDark of [false, true]) {
      for (const blocked of [false, true]) {
        const env = environment(saved, systemDark, blocked);
        vm.runInContext(bootScript, env.context);
        const expected = env.theme.resolveTheme(env.theme.getThemePreference(), systemDark);
        assert.equal(env.state.dark, expected === 'dark');
        assert.equal(env.document.documentElement.style.colorScheme, expected);
        env.theme.applyTheme(expected === 'dark' ? 'light' : 'dark');
        assert.equal(env.state.dark, expected !== 'dark');
        assert.equal(env.state.color, expected === 'dark' ? '#F8F7F5' : '#191714');
      }
    }
  }
});

test('login, logout and session cleanup preserve the browser appearance preference', () => {
  const compiled = ts.transpileModule(source('../src/services/local-storage/local-storage-service.ts'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  for (const preference of ['light', 'dark', 'system', null]) {
    const data = new Map([['token', 'mock-session']]);
    if (preference) data.set('furk-theme', preference);
    const context = vm.createContext({
      exports: {},
      require: (name) => name.endsWith('/theme') ? { THEME_STORAGE_KEY: 'furk-theme' } : { PET_OWNER_TOUR_PREFIX: 'furk_pet_owner_tour:' },
      localStorage: { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), clear: () => data.clear() },
    });
    vm.runInContext(compiled, context);
    new context.exports.LocalStorageService().clearAll();
    assert.equal(data.get('furk-theme') ?? null, preference);
    assert.equal(data.has('token'), false);
  }
});

test('the palette themes surfaces and foregrounds while preserving button contrast', () => {
  const { colors } = resolveConfig(config).theme;
  const variables = {};
  const backgrounds = themedColors(colors, 'bg', variables);
  const text = themedColors(colors, 'text', variables);
  assert.match(backgrounds.white, /--furk-bg-white/);
  assert.match(backgrounds.gray[50], /--furk-bg-gray-50/);
  assert.match(backgrounds.primary[100], /--furk-bg-primary-100/);
  assert.match(text.gray[900], /--furk-text-gray-900/);
  assert.match(text.error[800], /--furk-text-error-800/);
  assert.equal(text.white, '#fff');
  assert.equal(backgrounds.primary[600], colors.primary[600]);
  assert.equal(backgrounds.gray[900], colors.gray[900]);
  assert.equal(variables['--furk-bg-white'], '36 33 29');
});

test('generated Tailwind styles cover alpha, interaction states, gradients and shared components', async () => {
  const result = await postcss([tailwindcss({ ...config, content: [{ raw: '<div class="bg-white/95 hover:bg-primary-50 focus:text-primary-700 disabled:bg-gray-100 border-gray-200 divide-gray-200 from-primary-50 to-white ring-primary-100 furk-panel"></div>' }] })]).process(source('../src/index.css'), { from: undefined });
  assert.match(result.css, /html\.dark\s*\{/);
  for (const token of ['--furk-bg-white', '--furk-bg-primary-50', '--furk-text-primary-700', '--furk-border-gray-200']) assert.ok(result.css.includes(token));
  assert.match(result.css, /\.hover\\:bg-primary-50:hover/);
  assert.match(result.css, /\.focus\\:text-primary-700:focus/);
  assert.match(result.css, /--furk-bg-white, 255 255 255\) \/ 0\.95/);
  assert.match(result.css, /\.furk-panel\s*\{[^}]*--furk-bg-white/s);
});
