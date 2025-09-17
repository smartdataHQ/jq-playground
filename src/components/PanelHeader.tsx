import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PanelHeaderProps {
  icon: LucideIcon;
  title: string;
  iconColor?: string;
  status?: {
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    icon?: LucideIcon;
  };
  actions?: React.ReactNode;
  subtitle?: string;
}

export function PanelHeader({ 
  icon: Icon, 
  title, 
  iconColor = 'text-blue-400',
  status,
  actions,
  subtitle
}: PanelHeaderProps) {
  const getStatusColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'info': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex items-center justify-between min-h-[52px]">
      <div className="flex items-center space-x-3 flex-1">
        <div className="flex items-center space-x-2">
          <Icon className={`w-4 h-4 ${iconColor}`} />
          <span className="font-medium text-white">{title}</span>
        </div>
        
        {subtitle && (
          <span className="text-sm text-gray-400">{subtitle}</span>
        )}
        
        {status && (
          <div className="flex items-center space-x-1">
            {status.icon && <status.icon className={`w-4 h-4 ${getStatusColor(status.type)}`} />}
            <span className={`text-sm ${getStatusColor(status.type)}`}>
              {status.message}
            </span>
          </div>
        )}
      </div>
      
      {actions && (
        <div className="flex items-center space-x-2">
          {actions}
        </div>
      )}
    </div>
  );
}