import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  id: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  wrapperClassName?: string;
  placeholder?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  id,
  value,
  onChange,
  className = "",
  wrapperClassName = "",
  placeholder = "",
  ...rest
}) => {
  const defaultClasses = "furk-field";
  const combinedClasses = `${defaultClasses} ${className}`.trim();

  return (
    <div className={wrapperClassName || "mb-4"}>
      {label && (
        <label htmlFor={id} className="block text-gray-700 text-sm font-bold mb-2">
          {label}
          {rest.required && <span className="text-red-500 ml-1">*</span>}
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
