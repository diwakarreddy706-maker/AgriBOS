import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'warning' | 'info' | 'danger' | 'outline';
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'info', children, ...props }) => {
  const variants = {
    success: 'bg-agri-100 dark:bg-agri-950 text-agri-800 dark:text-agri-300 border-agri-200 dark:border-agri-800',
    warning: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    info: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    danger: 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
    outline: 'bg-transparent text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
  };

  return (
    <div className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors', variants[variant], className)} {...props}>
      {children}
    </div>
  );
};
