import React from 'react';

interface BadgeProps {
  status: string;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ status, className }) => {
  const statusColorMap: Record<string, string> = {
    yellow: 'bg-yellow-500 text-black',
    green: 'bg-green-500 text-black',
    blue: 'bg-blue-500 text-white',
    gray: 'bg-gray-500 text-white',
    red: 'bg-red-500 text-white',
  };

  const statusGroups = {
    yellow: ['pending'],
    green: ['confirmed'],
    blue: ['in_progress'],
    gray: ['completed'],
    red: ['cancelled'],
  };

  const getStatusColor = (status: string) => {
    const colorKey = Object.entries(statusGroups).find(([_, statuses]) =>
      statuses.includes(status)
    )?.[0];
    
    return colorKey ? statusColorMap[colorKey] : 'bg-gray-200 text-gray-800';
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium capitalize ${getStatusColor(status)} ${className || ''}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
};

export default Badge;