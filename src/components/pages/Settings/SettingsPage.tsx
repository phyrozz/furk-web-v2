import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../../providers/ThemeContext';

const options = [
  { value: 'light', label: 'Light', description: 'A bright, warm look for your day.', icon: Sun },
  { value: 'dark', label: 'Dark', description: 'Softer colors for a darker screen.', icon: Moon },
  { value: 'system', label: 'System', description: 'Follow your device’s appearance.', icon: Monitor },
] as const;

export default function SettingsPage({ isMerchant = false }: { isMerchant?: boolean }) {
  const { preference, resolvedTheme, setPreference } = useTheme();

  return (
    <div className={`px-4 pb-10 pt-24 sm:px-6 lg:px-8 ${isMerchant ? 'lg:ml-[var(--merchant-navbar-width,18rem)] lg:pt-10' : ''}`}>
      <div className="mx-auto max-w-3xl">
        <header className="furk-page-header">
          <div>
            <h1 className="furk-page-title">Settings</h1>
          </div>
        </header>
        <section className="furk-panel p-5 sm:p-8" aria-labelledby="appearance-heading">
          <h2 id="appearance-heading" className="text-lg font-extrabold text-gray-900">Appearance</h2>
          <p id="appearance-description" className="mt-2 text-sm text-gray-600">Your theme applies across Furk and saves automatically on this browser.</p>
          <fieldset className="mt-6" aria-describedby="appearance-description">
            <legend className="sr-only">Color theme</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {options.map(({ value, label, description, icon: Icon }) => (
                <label key={value} className={`relative flex cursor-pointer flex-col gap-3 rounded-2xl border p-4 transition-colors hover:border-primary-500 ${preference === value ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : 'border-gray-200 bg-white'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <Icon size={24} className="text-primary-600" aria-hidden="true" />
                    <input type="radio" name="theme" value={value} checked={preference === value} onChange={() => setPreference(value)} className="h-4 w-4 accent-primary-600" />
                  </div>
                  <span className="font-bold text-gray-900">{label}</span>
                  <span className="text-sm text-gray-600">{description}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </section>
      </div>
    </div>
  );
}
