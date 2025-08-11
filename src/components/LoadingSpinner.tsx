import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div className={`${sizeClasses[size]} relative`}>
        {/* Outer ring */}
        <div className="absolute inset-0 border-2 border-slate-200 dark:border-slate-600 rounded-full"></div>
        
        {/* Animated spinner */}
        <div className="absolute inset-0 border-2 border-transparent border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin"></div>
        
        {/* Inner pulse */}
        <div className="absolute inset-1 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse opacity-20"></div>
      </div>
    </div>
  );
} 