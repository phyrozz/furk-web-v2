import { motion, AnimatePresence } from 'framer-motion';
import React, { useEffect, useState, useRef } from 'react';

interface MenuItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

interface ContextMenuProps {
  items: MenuItem[];
  triggerOn: 'right' | 'left';
  containerRef?: React.RefObject<HTMLElement>;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ items, triggerOn, containerRef }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef?.current || document;
    
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      const isClickInsideMenu = menuRef.current?.contains(target);
      const isClickInsideContainer = containerRef?.current?.contains(target);

      // Handle right click inside container
      if (triggerOn === 'right' && e.button === 2 && isClickInsideContainer) {
        e.preventDefault();
        setIsOpen(true);
        setPosition({ x: e.pageX, y: e.pageY });
      }
      // Handle left click inside container
      else if (triggerOn === 'left' && e.button === 0 && isClickInsideContainer && !isClickInsideMenu) {
        e.preventDefault();
        setIsOpen((prev) => !prev); // Toggle menu state
        setPosition({ x: e.pageX, y: e.pageY });
      }
      // Close menu when clicking outside container and menu
      else if (!isClickInsideMenu && !isClickInsideContainer) {
        setIsOpen(false);
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (triggerOn === 'right') {
        e.preventDefault();
      }
    };

    document.addEventListener('mousedown', handleClick);
    container.addEventListener('contextmenu', handleContextMenu as EventListener);

    return () => {
      document.removeEventListener('mousedown', handleClick);
      container.removeEventListener('contextmenu', handleContextMenu as EventListener);
    };
  }, [triggerOn, containerRef]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.1 }}
          style={{
            position: 'fixed',
            left: position.x,
            top: position.y,
          }}
          className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 min-w-[160px] z-50"
        >
          {items.map((item, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                item.onClick();
                setIsOpen(false);
              }}
              className="w-full px-2 py-2 hover:bg-gray-100 rounded flex items-center text-right gap-3"
            >
              <div className="w-6 flex items-center">
                {item.icon}
              </div>
              <span>{item.label}</span>
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
