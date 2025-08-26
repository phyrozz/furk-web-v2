import React from 'react';
import { motion } from 'framer-motion';
import Modal from './Modal';

interface SuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  points: number;
}

const SuccessDialog: React.FC<SuccessDialogProps> = ({ isOpen, onClose, points }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Booking Successful"
      showConfirm={true}
      onConfirm={onClose}
      showCancel={false}
    >
      <div className="flex flex-col items-center justify-center py-6 z-50">
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 260, 
            damping: 20,
            delay: 0.2 
          }}
          className="w-20 h-20 mb-6 text-8xl flex items-center justify-center relative"
        >
          <motion.span
            initial={{ scale: 1 }}
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, -10, 10, 0]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              repeatDelay: 2
            }}
          >
            🐶
          </motion.span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-2">Your booking has been submitted!</h3>
          <p className="text-gray-600 mb-4">We'll notify you once the merchant confirms your booking.</p>
          
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: [0.8, 1.1, 1] }}
            transition={{ 
              times: [0, 0.5, 1],
              duration: 0.8,
              delay: 0.8,
              ease: "easeInOut" 
            }}
            className="bg-primary-50 rounded-lg p-4 border border-primary-200"
          >
            <p className="text-primary-800 font-medium">
              You've earned <span className="font-bold text-xl">{points}</span> FURK points
            </p>
          </motion.div>
        </motion.div>
      </div>
    </Modal>
  );
};

export default SuccessDialog;