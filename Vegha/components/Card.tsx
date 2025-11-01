import React from 'react';
import { LucideIcon } from 'lucide-react';

interface CardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
    icon: LucideIcon;
  };
  status?: {
    text: string;
    color: string;
    dotColor: string;
  };
  badge?: {
    text: string;
    color: string;
    bgColor: string;
  };
  className?: string;
  onClick?: () => void;
}

export default function Card({
  title,
  value,
  icon: Icon,
  iconColor = 'text-blue-500',
  iconBgColor = 'bg-gradient-to-br from-blue-500 to-blue-600',
  subtitle,
  trend,
  status,
  badge,
  className = '',
  onClick
}: CardProps) {
  return (
    <div 
      className={`group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {value}
          </p>
          
          {/* Subtitle */}
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
          
          {/* Status */}
          {status && (
            <div className="flex items-center mt-2">
              <div className={`w-2 h-2 rounded-full mr-2 ${status.dotColor}`}></div>
              <span className={`text-xs font-medium ${status.color}`}>
                {status.text}
              </span>
            </div>
          )}
          
          {/* Trend */}
          {trend && (
            <div className="flex items-center mt-2">
              <trend.icon className={`w-4 h-4 mr-1 ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`} />
              <span className={`text-xs ${trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {trend.value}
              </span>
            </div>
          )}
        </div>
        
        <div className="relative">
          <div className={`w-16 h-16 ${iconBgColor} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-blue-500/25 transition-shadow duration-300`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
          
          {/* Badge */}
          {badge && (
            <div className={`absolute -top-2 -right-2 w-6 h-6 ${badge.bgColor} rounded-full flex items-center justify-center`}>
              <span className={`text-xs font-bold ${badge.color}`}>
                {badge.text}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
