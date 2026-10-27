export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = Exclude<ThemePreference, 'system'>;

export const THEME_STORAGE_KEY = 'furk-theme';
export const DARK_MODE_QUERY = '(prefers-color-scheme: dark)';

export function parseThemePreference(value: string | null): ThemePreference {
  return value === 'light' || value === 'dark' ? value : 'system';
}

export function getThemePreference(): ThemePreference {
  try {
    return parseThemePreference(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return 'system';
  }
}

export function resolveTheme(preference: ThemePreference, systemDark: boolean): ResolvedTheme {
  return preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;
}

export function applyTheme(theme: ResolvedTheme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#191714' : '#F8F7F5');
}
