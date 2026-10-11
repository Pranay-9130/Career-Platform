import React from 'react';

export function Card({
  children,
  className = '',
  hoverable = false,
  padding = 'md',
  ...props
}) {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`bg-white rounded-card border border-brand-border shadow-card transition-all duration-200 ${
        hoverable ? 'hover:-translate-y-1 hover:shadow-card-hover cursor-pointer' : ''
      } ${paddingStyles[padding] || paddingStyles.md} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', as: Component = 'h3', ...props }) {
  return (
    <Component
      className={`font-display font-bold text-lg text-brand-text tracking-tight ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={`mt-1 text-sm text-brand-muted ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`space-y-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={`mt-6 pt-4 border-t border-brand-border flex items-center justify-between ${className}`} {...props}>
      {children}
    </div>
  );
}

export default Card;
