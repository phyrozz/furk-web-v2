import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: any;
  disabled?: boolean;
  className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  className = '',
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled) {
      onChange(event.target.checked);
    }
  };

  return (
    <label className={`relative flex items-center gap-2 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className="sr-only peer"
      />
      <motion.span 
        className="w-5 h-5 border-2 border-gray-300 rounded flex items-center justify-center peer-checked:bg-primary-500 peer-checked:border-primary-500"
        whileHover={{ scale: 1.05 }}
        animate={{
          scale: checked ? [1, 1.1, 1] : 1,
          transition: { duration: 0.2 }
        }}
      >
        <AnimatePresence>
          {checked && (
            <motion.svg 
              className="w-3 h-3 text-white"
              viewBox="0 0 20 20"
              fill="currentColor"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.2 }}
            >
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.span>
      {label && <span className="select-none">{label}</span>}
    </label>
  );
};
