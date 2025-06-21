import React from 'react';
import Button from './Button';
import { motion } from 'framer-motion';

interface TokenExpiredDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
}

const TokenExpiredDialog: React.FC<TokenExpiredDialogProps> = ({ isOpen, onConfirm }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white p-8 rounded-2xl shadow-xl max-w-sm mx-auto"
      >
        <h2 className="text-xl font-bold mb-4">Session Expired</h2>
        <p className="mb-6">Your session has expired. Please confirm to refresh the page.</p>
        <div className="flex justify-end">
          <Button
            variant='primary'
            onClick={onConfirm}
          >Confirm</Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TokenExpiredDialog;