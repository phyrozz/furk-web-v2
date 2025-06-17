import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface DateInputProps {
  value: Date | null;
  onChange: (value: Date | null) => void;
  placeholder?: string;
  className?: string;
  min?: Date;
  max?: Date;
}

const DateInput = ({
  value,
  onChange,
  placeholder = 'Select date...',
  className = '',
  min,
  max
}: DateInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [selectedMonth, setSelectedMonth] = useState(() => value ? value.getMonth() : new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(() => value ? value.getFullYear() : new Date().getFullYear());
  const [focusedDate, setFocusedDate] = useState<Date | null>(value);

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

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        dropdownRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);  

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const isDateDisabled = (date: Date) => {
    if (min && date < new Date(min.setHours(0, 0, 0, 0))) return true;
    if (max && date > new Date(max.setHours(23, 59, 59, 999))) return true;
    return false;
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay();
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    // Add the days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const getYearRange = () => {
    let startYear = new Date().getFullYear() - 50;
    let endYear = new Date().getFullYear() + 10;

    if (min) startYear = Math.min(startYear, min.getFullYear());
    if (max) endYear = Math.max(endYear, max.getFullYear());

    return Array.from(
      { length: endYear - startYear + 1 },
      (_, i) => startYear + i
    );
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Space' || e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
            e.preventDefault();
            setIsOpen(true);
          }
          if (e.key === 'Escape' || e.key === 'Tab' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            setIsOpen(false);
          }
        }}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer flex justify-between items-center"
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {value ? formatDate(value) : placeholder}
        </span>
        <ChevronDown
          className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          size={20}
        />
      </div>

      {isOpen && (
        <div 
          ref={dropdownRef}
          tabIndex={0}
          onKeyDown={(e) => {
            if (!focusedDate) return;
        
            const newDate = new Date(focusedDate);
            switch (e.key) {
              case 'ArrowUp':
                newDate.setDate(focusedDate.getDate() - 7);
                break;
              case 'ArrowDown':
                newDate.setDate(focusedDate.getDate() + 7);
                break;
              case 'ArrowLeft':
                newDate.setDate(focusedDate.getDate() - 1);
                break;
              case 'ArrowRight':
                newDate.setDate(focusedDate.getDate() + 1);
                break;
              case 'Enter':
                if (!isDateDisabled(newDate)) {
                  onChange(newDate);
                  setIsOpen(false);
                }
                return;
              case 'Escape':
                setIsOpen(false);
                return;
              default:
                return;
            }
        
            if (
              newDate.getMonth() === selectedMonth &&
              newDate.getFullYear() === selectedYear
            ) {
              setFocusedDate(newDate);
            }
          }}
          className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg"
        >
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-2 py-1 border rounded"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>
                    {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-2 py-1 border rounded"
              >
                {getYearRange().map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-sm text-gray-500 font-medium">
                  {day}
                </div>
              ))}
              {generateCalendarDays().map((day, index) => {
                const currentDate = day !== null ? new Date(selectedYear, selectedMonth, day) : null;
                const isDisabled = currentDate ? isDateDisabled(currentDate) : false;

                const isFocused =
                  currentDate &&
                  focusedDate &&
                  currentDate.getDate() === focusedDate.getDate() &&
                  currentDate.getMonth() === focusedDate.getMonth() &&
                  currentDate.getFullYear() === focusedDate.getFullYear();

                const isSelected =
                  value &&
                  currentDate &&
                  currentDate.getDate() === value.getDate() &&
                  currentDate.getMonth() === value.getMonth() &&
                  currentDate.getFullYear() === value.getFullYear();

                return (
                  <div
                    key={index}
                    className={`
                      text-center p-2 rounded-lg
                      ${day === null ? 'invisible' : isDisabled ? 'cursor-not-allowed text-gray-300' : 'cursor-pointer hover:bg-gray-100'}
                      ${isSelected ? 'bg-primary-100' : ''}
                      ${isFocused ? 'outline outline-2 outline-primary-500' : ''}
                    `}
                    onClick={() => {
                      if (day !== null && !isDisabled) {
                        const selected = new Date(selectedYear, selectedMonth, day);
                        onChange(selected);
                        setIsOpen(false);
                      }
                    }}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateInput;
