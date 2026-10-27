import { createContext, useContext } from 'react';
import type { ResolvedTheme, ThemePreference } from '../theme/theme';

export const ThemeContext = createContext<{
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
} | null>(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
