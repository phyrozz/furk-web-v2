import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MenuDropdownProps {
  children: React.ReactNode;
  items: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    disabled?: boolean;
    danger?: boolean;
  }[];
  position?: 'left' | 'right';
}

const MenuDropdown: React.FC<MenuDropdownProps> = ({
  children,
  items,
  position = 'left'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (onClick: () => void, disabled?: boolean) => {
    if (!disabled) {
      onClick();
      setIsOpen(false);
    }
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      <div 
        className="cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        {children}
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`absolute top-full ${
              position === 'left' ? 'left-0' : 'right-0'
            } bg-white rounded-md shadow-lg min-w-[200px] z-[1000]`}
          >
            {items.map((item, index) => (
              <div
                key={index}
                className={`
                  flex items-center gap-2 px-4 py-2
                  ${item.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                  ${item.danger ? 'text-red-500' : ''}
                  ${!item.disabled && 'hover:bg-gray-100'}
                `}
                onClick={() => handleItemClick(item.onClick, item.disabled)}
              >
                {item.icon}
                {item.label}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MenuDropdown;
