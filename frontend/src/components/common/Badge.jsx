import React from 'react';

export default function Badge({
  children,
  variant = 'primary',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 font-medium',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold',
  };

  const variantStyles = {
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
    underReview: 'bg-amber-50 text-amber-800 border-amber-200',
    approved: 'bg-green-50 text-green-800 border-green-200',
    published: 'bg-blue-50 text-blue-800 border-blue-200',
    changesRequested: 'bg-orange-50 text-orange-800 border-orange-200',
    rejected: 'bg-red-50 text-red-800 border-red-200',
    primary: 'bg-brand-veryLight text-brand-primary border-brand-border',
    cyan: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    neutral: 'bg-slate-50 text-slate-600 border-slate-200',
  };

  const dotColors = {
    draft: 'bg-slate-400',
    underReview: 'bg-amber-500',
    approved: 'bg-green-500',
    published: 'bg-blue-500',
    changesRequested: 'bg-orange-500',
    rejected: 'bg-red-500',
    primary: 'bg-brand-primary',
    cyan: 'bg-cyan-500',
    neutral: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border transition-colors select-none ${
        sizeStyles[size] || sizeStyles.md
      } ${variantStyles[variant] || variantStyles.primary} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            dotColors[variant] || 'bg-brand-primary'
          }`}
        />
      )}
      <span>{children}</span>
    </span>
  );
}
