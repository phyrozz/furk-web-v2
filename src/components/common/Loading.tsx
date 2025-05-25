import { Loader2 } from 'lucide-react';

interface LoadingProps {
  fullPage?: boolean;
  size?: number;
  className?: string;
  text?: string;
}

const Loading = ({ fullPage = false, size = 24, className = '', text = 'Loading...' }: LoadingProps) => {
  const baseClasses = 'flex items-center justify-center gap-2 text-gray-500';
  const fullPageClasses = fullPage ? 'min-h-[200px]' : '';
  const combinedClasses = `${baseClasses} ${fullPageClasses} ${className}`;

  return (
    <div className={combinedClasses}>
      <Loader2 size={size} className="animate-spin" />
      {text && <span>{text}</span>}
    </div>
  );
};

export default Loading;