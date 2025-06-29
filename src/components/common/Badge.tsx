import React from 'react';

interface BadgeProps {
  status: string;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ status, className }) => {
  const statusColorMap: Record<string, string> = {
    yellow: 'bg-yellow-600 text-white',
    green: 'bg-green-600 text-white',
    blue: 'bg-blue-600 text-white',
    gray: 'bg-gray-600 text-white',
    red: 'bg-red-600 text-white',
    purple: 'bg-purple-600 text-white'
  };

  const statusGroups = {
    yellow: ['pending'],
    green: ['completed'],
    blue: ['confirmed'],
    gray: [''],
    red: ['cancelled'],
    purple: ['in_progress']
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