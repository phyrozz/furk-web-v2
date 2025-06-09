import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface TimeInputProps {
  value: Date | null;
  onChange: (value: Date | null) => void;
  placeholder?: string;
  className?: string;
  minuteStep?: number;
}

const TimeInput = ({
  value,
  onChange,
  placeholder = 'Select time...',
  className = '',
  minuteStep = 15
}: TimeInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
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
      slots.push(date);
    }
    
    return slots;
  };

  const isCurrentTime = (timeSlot: Date) => {
    return value && 
      timeSlot.getHours() === value.getHours() && 
      timeSlot.getMinutes() === value.getMinutes();
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {value ? formatTime(value) : placeholder}
        </span>
        <ChevronDown
          className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          size={20}
        />
      </div>

      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          <div className="py-1">
            {generateTimeSlots().map((timeSlot, index) => (
              <div
                key={index}
                className={`
                  px-4 py-2 cursor-pointer hover:bg-gray-100
                  ${isCurrentTime(timeSlot) ? 'bg-primary-100' : ''}
                `}
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
        </div>
      )}
    </div>
  );
};

export default TimeInput;
