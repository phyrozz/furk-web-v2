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
  id?: string;
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
  id,
}) => {
  const baseStyles = 'font-bold rounded-xl transition-colors duration-200 inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 disabled:shadow-none';
  
  const getColorClasses = (color: ButtonColor) => {
    const colorMap = {
      primary: 'bg-primary-600 hover:bg-primary-700',
      secondary: 'bg-secondary-500 hover:bg-secondary-600',
      accent: 'bg-accent-500 hover:bg-accent-600',
      red: 'bg-red-500 hover:bg-red-600',
      yellow: 'bg-yellow-600 hover:bg-yellow-700'
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
      primary: 'border-primary-200 text-primary-700',
      secondary: 'border-secondary-500 text-secondary-500',
      accent: 'border-accent-500 text-accent-500',
      red: 'border-red-500 text-red-500',
      yellow: 'border-yellow-500 text-yellow-500'
    };
    return `bg-white border border-solid ${baseMap[color]} ${getHoverBg(color)}`;
  };
  
  const getGhostClasses = (color: ButtonColor) => {
    const textMap = {
      primary: 'text-primary-700',
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
    sm: 'min-h-9 text-sm py-1.5 px-3',
    md: 'min-h-11 text-sm py-2.5 px-4',
    lg: 'min-h-12 text-base py-3 px-5',
  };
  
  const widthStyle = fullWidth ? 'w-full' : '';
  const disabledStyle = (disabled || loading) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

  // drop shadow for primary, secondary, accent variants
  const shadowStyle =
    variant === 'primary' || variant === 'secondary' || variant === 'accent' ? 'shadow-sm' : '';

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
    <span className="mr-2 animate-pulse" aria-hidden="true">
      <Paw size={20} color="currentColor" />
    </span>
  );
  
  return (
    <button
      id={id}
      type={type}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${disabledStyle} ${shadowStyle} whitespace-nowrap ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {icon && !loading && <span className={children ? "mr-2" : ""}>{icon}</span>}
      {loading && <BouncingPaw />}
      {children}
    </button>
  );
};

export default Button;
