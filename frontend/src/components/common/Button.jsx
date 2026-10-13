import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className = '',
  type = 'button',
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-button focus:outline-none focus:ring-2 focus:ring-offset-1 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 select-none';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-6 py-3 gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-brand-primary text-white hover:bg-blue-600 focus:ring-brand-primary shadow-sm hover:shadow',
    secondary:
      'bg-brand-veryLight text-brand-primary border border-brand-border hover:bg-brand-sky hover:border-blue-300 focus:ring-brand-primary',
    white:
      'bg-white text-brand-primary hover:bg-blue-50 focus:ring-white shadow-sm font-semibold',
    outline:
      'bg-transparent text-brand-text border border-brand-border hover:bg-brand-veryLight hover:text-brand-primary hover:border-brand-primary focus:ring-brand-primary',
    ghost:
      'bg-transparent text-brand-muted hover:bg-slate-100 hover:text-brand-text focus:ring-slate-400',
    destructive:
      'bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white focus:ring-red-500',
    gradient:
      'gradient-brand text-white hover:opacity-95 shadow-sm hover:shadow-card-hover focus:ring-brand-cyan',
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${
        variantStyles[variant] || variantStyles.primary
      } ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : LeftIcon ? (
        <LeftIcon className="w-4 h-4 shrink-0" />
      ) : null}

      <span>{children}</span>

      {!isLoading && RightIcon && <RightIcon className="w-4 h-4 shrink-0" />}
    </button>
  );
}
