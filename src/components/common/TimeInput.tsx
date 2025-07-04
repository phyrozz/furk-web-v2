import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { createPortal } from 'react-dom';

interface TimeInputProps {
  value: Date | null;
  onChange: (value: Date | null) => void;
  placeholder?: string;
  className?: string;
  minuteStep?: number;
  min?: Date;
  max?: Date;
  disabled?: boolean;
}

const TimeInput = ({
  value,
  onChange,
  placeholder = 'Select time...',
  className = '',
  minuteStep = 15,
  min,
  max,
  disabled = false
}: TimeInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    if (isOpen && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [isOpen]);

  const formatTime = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const generateTimeSlots = () => {
    const slots = [];
    const totalMinutesInDay = 24 * 60;
    
    for (let minutes = 0; minutes < totalMinutesInDay; minutes += minuteStep) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const date = new Date();
      date.setHours(hours, mins, 0, 0);
      if (min && date < min) continue;
      if (max && date > max) continue;
      slots.push(date);
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const isCurrentTime = (timeSlot: Date) => {
    return value && 
      timeSlot.getHours() === value.getHours() && 
      timeSlot.getMinutes() === value.getMinutes();
  };

  useEffect(() => {
    if (focusedIndex !== null && optionRefs.current[focusedIndex]) {
      optionRefs.current[focusedIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [focusedIndex]);  

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div
        tabIndex={disabled ? -1 : 0}
        className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent flex justify-between items-center ${
          disabled ? 'cursor-not-allowed bg-gray-100 opacity-60' : 'cursor-pointer'
        }`}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
          }
        }}
        onKeyDown={(e) => {
          if (disabled) return;
          
          if (!isOpen) {
            if (e.key === 'Enter' || e.key === ' ') {
              setIsOpen(true);
              setFocusedIndex(0);
              e.preventDefault();
            }
            return;
          }
        
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setFocusedIndex((prev) => {
              const next = prev === null ? 0 : Math.min(prev + 1, timeSlots.length - 1);
              return next;
            });
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setFocusedIndex((prev) => {
              const next = prev === null ? 0 : Math.max(prev - 1, 0);
              return next;
            });
          } else if (e.key === 'Enter') {
            if (focusedIndex !== null) {
              const selectedTime = timeSlots[focusedIndex];
              const newDate = value ? new Date(value) : new Date();
              newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
              onChange(newDate);
              setIsOpen(false);
            }
          } else if (e.key === 'Escape') {
            setIsOpen(false);
          }
        }}        
      >
        <span className={`${value ? 'text-gray-900' : 'text-gray-500'} ${disabled ? 'opacity-60' : ''}`}>
          {value ? formatTime(value) : placeholder}
        </span>
        <ChevronDown
          className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''} ${disabled ? 'opacity-60' : ''}`}
          size={20}
        />
      </div>

      {isOpen && !disabled && createPortal(
        <div 
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
          }}
          className="z-50 bg-white rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          <div className="py-1">
          {timeSlots.map((timeSlot, index) => (
            <div
              key={index}
              ref={(el) => optionRefs.current[index] = el}
              className={`
                px-4 py-2 cursor-pointer hover:bg-gray-100
                ${isCurrentTime(timeSlot) ? 'bg-primary-100' : ''}
                ${focusedIndex === index ? 'bg-blue-100' : ''}
              `}
              onMouseEnter={() => setFocusedIndex(index)}
              onClick={() => {
                const newDate = value ? new Date(value) : new Date();
                newDate.setHours(timeSlot.getHours(), timeSlot.getMinutes(), 0, 0);
                onChange(newDate);
                setIsOpen(false);
              }}
            >
              {formatTime(timeSlot)}
            </div>
          ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default TimeInput;
