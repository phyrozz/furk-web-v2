import React from 'react';

interface BadgeProps {
  status: string;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ status, className }) => {
  const statusColorMap: Record<string, string> = {
    yellow: 'bg-yellow-50 text-yellow-800 ring-yellow-200',
    green: 'bg-green-50 text-green-800 ring-green-200',
    blue: 'bg-blue-50 text-blue-800 ring-blue-200',
    gray: 'bg-gray-100 text-gray-700 ring-gray-200',
    red: 'bg-red-50 text-red-800 ring-red-200',
    purple: 'bg-purple-50 text-purple-800 ring-purple-200',
    orange: 'bg-orange-50 text-orange-800 ring-orange-200'
  };

  const statusGroups = {
    yellow: ['pending'],
    green: ['completed'],
    blue: ['confirmed'],
    gray: [''],
    red: ['cancelled'],
    purple: ['in_progress'],
    orange: ['cancelled_by_user']
  };

  const getStatusColor = (status: string) => {
    const colorKey = Object.entries(statusGroups).find(([, statuses]) =>
      statuses.includes(status)
    )?.[0];
    
    return colorKey ? statusColorMap[colorKey] : 'bg-gray-100 text-gray-700 ring-gray-200';
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ring-1 ring-inset capitalize ${getStatusColor(status)} ${className || ''}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
};

export default Badge;
