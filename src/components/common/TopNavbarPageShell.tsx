import React from 'react';
import Navbar from './Navbar';

interface TopNavbarPageShellProps {
  children: React.ReactNode;
  className?: string;
}

const TopNavbarPageShell: React.FC<TopNavbarPageShellProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`min-h-screen bg-gray-50 pb-[calc(5rem_+_env(safe-area-inset-bottom))] pt-16 lg:pb-0 ${className}`}>
      <Navbar />
      {children}
    </div>
  );
};

export default TopNavbarPageShell;
