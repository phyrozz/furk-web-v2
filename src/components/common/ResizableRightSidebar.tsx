import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ResizableRightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  initialWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  title?: string;
  icon?: any;
}

const ResizableRightSidebar: React.FC<ResizableRightSidebarProps> = ({
  isOpen,
  onClose,
  children,
  initialWidth = 400,
  minWidth = 300,
  maxWidth = 800,
  title = 'Details',
  icon = undefined
}) => {
  const [width, setWidth] = useState(initialWidth);
  const isResizing = useRef(false);
  const isMobile = useRef(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      isMobile.current = mobile;
      if (mobile) {
        setWidth(window.innerWidth);
      } else {
        setWidth(initialWidth);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initialWidth]);

  const handleMouseDown = useCallback(() => {
    if (isMobile.current) return;
    isResizing.current = true;
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current || isMobile.current) return;
    const newWidth = window.innerWidth - e.clientX;
    setWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)));
  }, [minWidth, maxWidth]);

  const handleMouseUp = useCallback(() => {
    isResizing.current = false;
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{ width: `${width}px` }}
            className="fixed right-0 top-0 h-full bg-white shadow-lg flex flex-col z-50"
          >
            <div
              className={`absolute left-0 top-0 h-full w-2 ${isMobile.current ? '' : 'cursor-ew-resize'}`}
              onMouseDown={handleMouseDown}
            />
            <div className="flex justify-between items-center p-4 border-b">
              <div className="flex gap-3 justify-center items-center">
                {icon && <div>{icon}</div>}
                <h2 className="text-xl font-bold">{title}</h2>
              </div>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ResizableRightSidebar;