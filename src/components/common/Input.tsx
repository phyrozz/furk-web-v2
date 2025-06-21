import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  placeholder?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  id,
  value,
  onChange,
  className = "",
  placeholder = "",
  ...rest
}) => {
  const defaultClasses = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500";
  const combinedClasses = `${defaultClasses} ${className}`.trim();

  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={id} className="block text-gray-700 text-sm font-bold mb-2">
          {label}
        </label>
      )}
      <input
        type="text"
        id={id}
        className={combinedClasses}
        value={value}
        onChange={onChange}
        {...rest}
        placeholder={placeholder}
      />
    </div>
  );
};

export default Input;