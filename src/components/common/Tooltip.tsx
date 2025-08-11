import React, { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = 'top',
  delay = 200,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  let timeout: NodeJS.Timeout;

  const showTooltip = () => {
    timeout = setTimeout(() => setIsVisible(true), delay);
  };

  const hideTooltip = () => {
    clearTimeout(timeout);
    setIsVisible(false);
  };

  const positions = {
    top: { y: -8 },
    bottom: { y: 8 },
    left: { x: -8 },
    right: { x: 8 },
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, ...positions[position] }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, ...positions[position] }}
            transition={{ duration: 0.2 }}
            className={`
              absolute z-50 px-2 py-1 text-sm text-white bg-gray-800 
              rounded shadow-lg whitespace-nowrap
              ${position === 'top' && 'bottom-full mb-2'}
              ${position === 'bottom' && 'top-full mt-2'}
              ${position === 'left' && 'right-full mr-2'}
              ${position === 'right' && 'left-full ml-2'}
              ${className}
            `}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
