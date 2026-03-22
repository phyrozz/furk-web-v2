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
    <div className={`min-h-screen bg-gray-50 pt-16 ${className}`}>
      <Navbar />
      {children}
    </div>
  );
};

export default TopNavbarPageShell;
