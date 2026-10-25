import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function AddressSelect({ id, label, options, value, onChange, disabled = false, hint }: {
  id: string;
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  hint?: string;
}) {
  const [query, setQuery] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const filtered = options.filter(option => option.toLowerCase().includes((query ?? '').toLowerCase()));
  const choose = (option: string) => { onChange(option); setQuery(null); setOpen(false); setActive(-1); };
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-2 block text-sm font-bold text-gray-700">{label} <span className="text-error-600">*</span></label>
      <div className="relative">
        <input id={id} role="combobox" autoComplete="off" aria-autocomplete="list" aria-expanded={open && !disabled} aria-controls={`${id}-options`} aria-required="true" aria-describedby={hint ? `${id}-hint` : undefined} aria-activedescendant={open && active >= 0 ? `${id}-option-${active}` : undefined}
          className="furk-field pr-10 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500" value={query ?? value} placeholder={`Select ${label.toLowerCase()}`} disabled={disabled}
          onFocus={event => { event.currentTarget.select(); setOpen(true); setActive(-1); }}
          onClick={() => setOpen(true)}
          onBlur={() => { setOpen(false); setQuery(null); setActive(-1); }}
          onChange={event => { setQuery(event.target.value); setOpen(true); setActive(-1); }}
          onKeyDown={event => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault(); setOpen(true);
              setActive(index => !filtered.length ? -1 : event.key === 'ArrowDown' ? Math.min(index + 1, filtered.length - 1) : Math.max(index - 1, 0));
            } else if (event.key === 'Enter') {
              event.preventDefault();
              if (open && filtered[active]) choose(filtered[active]);
            } else if (event.key === 'Escape') { setOpen(false); setQuery(null); setActive(-1); }
          }} />
        <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
        {open && !disabled && <ul id={`${id}-options`} role="listbox" aria-label={label} className="furk-dropdown absolute z-20 mt-2 max-h-60 w-full overflow-auto">
          {filtered.map((option, index) => <li key={option} id={`${id}-option-${index}`} role="option" aria-selected={value === option}>
            <button type="button" tabIndex={-1} onMouseDown={event => event.preventDefault()} onClick={() => choose(option)} ref={node => { if (index === active) node?.scrollIntoView({ block: 'nearest' }); }} className={`w-full rounded-lg px-3 py-2.5 text-left text-sm hover:bg-primary-50 ${index === active ? 'bg-primary-50' : ''}`}>{option}</button>
          </li>)}
          {!filtered.length && <li className="px-3 py-3 text-sm text-gray-500" role="presentation">No matches. Try another spelling.</li>}
        </ul>}
      </div>
      {hint && <p id={`${id}-hint`} className="mt-2 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}
