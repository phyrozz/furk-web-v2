import React from 'react';
import Paw from './Paw';

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonColor = 'primary' | 'secondary' | 'accent' | 'red' | 'yellow';

interface ButtonProps {
  children?: React.ReactNode;
  variant?: ButtonVariant;
  color?: ButtonColor;
  size?: ButtonSize;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  color = 'primary',
  className = '',
  onClick,
  type = 'button',
  disabled = false,
  icon,
  fullWidth = false,
  loading = false,
}) => {
  const baseStyles = 'font-medium rounded-lg transition-all duration-200 flex items-center justify-center';
  
  const getColorClasses = (color: ButtonColor) => {
    const colorMap = {
      primary: 'bg-primary-500 hover:bg-primary-600',
      secondary: 'bg-secondary-500 hover:bg-secondary-600',
      accent: 'bg-accent-500 hover:bg-accent-600',
      red: 'bg-red-500 hover:bg-red-600',
      yellow: 'bg-yellow-500 hover:bg-yellow-600'
    };
    return colorMap[color];
  };

  const getHoverBg = (color: ButtonColor) => {
    const hoverBgMap = {
      primary: 'hover:bg-primary-50',
      secondary: 'hover:bg-secondary-50',
      accent: 'hover:bg-accent-50',
      red: 'hover:bg-red-50',
      yellow: 'hover:bg-yellow-50'
    };
    return hoverBgMap[color];
  };
  
  const getOutlineClasses = (color: ButtonColor) => {
    const baseMap = {
      primary: 'border-primary-500 text-primary-500',
      secondary: 'border-secondary-500 text-secondary-500',
      accent: 'border-accent-500 text-accent-500',
      red: 'border-red-500 text-red-500',
      yellow: 'border-yellow-500 text-yellow-500'
    };
    return `bg-transparent border border-solid ${baseMap[color]} ${getHoverBg(color)}`;
  };
  
  const getGhostClasses = (color: ButtonColor) => {
    const textMap = {
      primary: 'text-primary-500',
      secondary: 'text-secondary-500',
      accent: 'text-accent-500',
      red: 'text-red-500',
      yellow: 'text-yellow-500'
    };
    return `bg-transparent ${textMap[color]} ${getHoverBg(color)}`;
  };

  const variantStyles = {
    primary: `${getColorClasses(color)} text-white`,
    secondary: `${getColorClasses(color)} text-white`,
    accent: `${getColorClasses(color)} text-white`,
    outline: getOutlineClasses(color),
    ghost: getGhostClasses(color),
  };  
  
  const sizeStyles = {
    sm: 'text-sm py-1.5 px-3',
    md: 'text-base py-2 px-4',
    lg: 'text-lg py-2.5 px-5',
  };
  
  const widthStyle = fullWidth ? 'w-full' : '';
  const disabledStyle = (disabled || loading) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

  // spinners are old school 🥹
  // const Spinner = () => (
  //   <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
  //     <circle
  //       className="opacity-25"
  //       cx="12"
  //       cy="12"
  //       r="10"
  //       stroke="currentColor"
  //       strokeWidth="4"
  //       fill="none"
  //     />
  //     <path
  //       className="opacity-75"
  //       fill="currentColor"
  //       d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
  //     />
  //   </svg>
  // );

  const BouncingPaw = () => (
    <div className="animate-bounce -mb-2">
      <Paw size={36} color="currentColor" />
    </div>
  );
  
  return (
    <button
      type={type}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${disabledStyle} whitespace-nowrap ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {icon && !loading && <span className={children ? "mr-2" : ""}>{icon}</span>}
      {loading && <BouncingPaw />}
      {children}
    </button>
  );
};

export default Button;
