import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps<T> {
  options: T[];
  value: T | null;
  onChange: (value: T | null) => void;
  getOptionLabel: (option: T) => string;
  placeholder?: string;
  className?: string;
}

const Select = <T extends object>({
  options,
  value,
  onChange,
  getOptionLabel,
  placeholder = 'Select...',
  className = ''
}: SelectProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else if (focusedIndex >= 0) {
          onChange(options[focusedIndex]);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        }
        setFocusedIndex(prev => 
          prev < options.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : prev
        );
        break;
      case 'Tab':
        if (isOpen) {
          setIsOpen(false);
        }
        break;
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div
        ref={triggerRef}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        tabIndex={0}
        className="furk-field cursor-pointer flex justify-between items-center gap-3"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {value ? getOptionLabel(value) : placeholder}
        </span>
        <ChevronDown
          className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          size={20}
        />
      </div>

      {isOpen && (
        <div 
          ref={dropdownRef}
          role="listbox"
          className="furk-dropdown absolute z-10 w-full mt-2 max-h-60 overflow-auto"
        >
          {options.length > 0 ? (
            options.map((option, index) => (
              <div
                key={index}
                role="option"
                aria-selected={index === focusedIndex}
                className={`rounded-lg px-3 py-2.5 cursor-pointer hover:bg-primary-50 ${
                  index === focusedIndex ? 'bg-primary-50' : ''
                }`}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
              >
                {getOptionLabel(option)}
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">No options available</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Select;
