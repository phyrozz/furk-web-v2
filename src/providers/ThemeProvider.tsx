import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import { ThemeContext } from './ThemeContext';
import { applyTheme, DARK_MODE_QUERY, getThemePreference, resolveTheme, THEME_STORAGE_KEY, type ThemePreference } from '../theme/theme';

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setThemePreference] = useState(getThemePreference);
  const [systemDark, setSystemDark] = useState(() => window.matchMedia(DARK_MODE_QUERY).matches);
  const resolvedTheme = resolveTheme(preference, systemDark);

  useLayoutEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    const query = window.matchMedia(DARK_MODE_QUERY);
    const handleChange = () => setSystemDark(query.matches);
    handleChange();
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY || event.key === null) {
        setThemePreference(getThemePreference());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const setPreference = (next: ThemePreference) => {
    setThemePreference(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Keep the preference usable for this session when storage is unavailable.
    }
  };

  return <ThemeContext.Provider value={{ preference, resolvedTheme, setPreference }}>{children}</ThemeContext.Provider>;
}
