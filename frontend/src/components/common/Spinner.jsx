import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Spinner({ size = 'md', className = '', label = 'Loading...' }) {
  const sizeStyles = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  return (
    <div role="status" className="inline-flex items-center justify-center">
      <Loader2
        className={`animate-spin text-brand-primary ${sizeStyles[size] || sizeStyles.md} ${className}`}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
