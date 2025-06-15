import { motion } from 'framer-motion';
import React from 'react';

interface SwitchProps {
  isOn: boolean;
  handleToggle: () => void;
  className?: string;
}

const Switch: React.FC<SwitchProps> = ({ isOn, handleToggle, className }) => {
  const spring = {
    type: 'spring',
    stiffness: 700,
    damping: 30,
  };

  return (
    <div
      className={`flex-shrink-0 w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${isOn ? 'bg-primary-600 justify-end' : 'bg-gray-300 justify-start'} ${className}`}
      onClick={handleToggle}
    >
      <motion.div
        className="w-4 h-4 bg-white rounded-full shadow-md"
        layout
        transition={spring}
      />
    </div>
  );
};

export default Switch;