import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  showConfirm?: boolean;
  showCancel?: boolean;
  confirmDisabled?: boolean;
  confirmButtonColor?: 'primary' | 'secondary' | 'accent' | 'red' | 'yellow';
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  showConfirm, 
  showCancel, 
  confirmDisabled,
  confirmButtonColor = 'primary',
  title, 
  children 
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    } else {
      document.removeEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex justify-center items-center select-none"
        >
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="relative p-5 sm:p-7 border border-gray-200 md:w-[42rem] w-full m-3 shadow-xl rounded-2xl bg-white"
          >
            <div className="flex justify-between items-center pb-3">
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
              <button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-2 text-gray-600">
              {children}
            </div>
            {(showCancel || showConfirm) && (
              <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-5">
                {showCancel && (
                  <Button onClick={onClose} variant="outline">
                    Cancel
                  </Button>
                )}
                {showConfirm && (
                  <Button
                    onClick={onConfirm}
                    variant="primary"
                    color={confirmButtonColor}
                    disabled={confirmDisabled}
                  >
                    Confirm
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;