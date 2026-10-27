import plugin from 'tailwindcss/plugin.js';

const surface = { 50: '#191714', 100: '#2c2823', 200: '#38322b', 300: '#484036' };
const foreground = { 400: '#b4aba0', 500: '#bfb7ac', 600: '#cec7bd', 700: '#ddd7cf', 800: '#eae5de', 900: '#f5f1eb', 950: '#faf8f5' };
const outline = { 50: '#302b25', 100: '#38322b', 200: '#484036', 300: '#62574b', 400: '#817260' };
const neutral = new Set(['gray', 'slate', 'zinc', 'neutral', 'stone']);

function rgb(hex) {
  return hex.slice(1).match(/.{2}/g).map((part) => parseInt(part, 16));
}

function mix(first, second, weight) {
  return first.map((value, index) => Math.round(value * (1 - weight) + second[index] * weight));
}

function darkColor(kind, family, shade, palette) {
  if (neutral.has(family)) {
    const value = (kind === 'bg' ? surface : kind === 'text' ? foreground : outline)[shade];
    return value ? rgb(value) : null;
  }
  if (kind === 'text' && shade >= 500) return rgb(palette[shade === 500 ? 300 : 200]);
  if (kind === 'bg' && shade <= 300) return mix(rgb('#24211d'), rgb(palette[500]), shade / 1000 + 0.09);
  if (kind === 'border' && shade <= 400) return mix(rgb('#302b25'), rgb(palette[500]), shade / 1000 + 0.15);
  return null;
}

// Separate foreground/surface tokens retain white button labels and dark overlays.
// Using Tailwind's color configuration also covers opacity, hover, focus and @apply.
export function themedColors(colors, kind, variables) {
  return Object.fromEntries(Object.entries(colors).map(([family, palette]) => {
    if (family === 'white' && kind === 'bg') {
      if (variables) variables['--furk-bg-white'] = '36 33 29';
      return [family, 'rgb(var(--furk-bg-white, 255 255 255) / <alpha-value>)'];
    }
    if (family === 'black' && kind === 'text') {
      if (variables) variables['--furk-text-black'] = '245 241 235';
      return [family, 'rgb(var(--furk-text-black, 0 0 0) / <alpha-value>)'];
    }
    if (typeof palette !== 'object' || !palette[500]?.match(/^#[\da-f]{6}$/i)) return [family, palette];
    return [family, Object.fromEntries(Object.entries(palette).map(([shade, light]) => {
      const dark = darkColor(kind, family, Number(shade), palette);
      if (!dark || !/^#[\da-f]{6}$/i.test(light)) return [shade, light];
      const name = `--furk-${kind}-${family}-${shade}`;
      if (variables) variables[name] = dark.join(' ');
      return [shade, `rgb(var(${name}, ${rgb(light).join(' ')}) / <alpha-value>)`];
    }))];
  }));
}

export const themeColorsPlugin = plugin(({ addBase, theme }) => {
  const variables = {};
  for (const kind of ['bg', 'text', 'border']) themedColors(theme('colors'), kind, variables);
  addBase({ 'html.dark': variables });
});
