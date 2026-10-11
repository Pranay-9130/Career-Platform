import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    id,
    type = 'text',
    disabled = false,
    required = false,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    className = '',
    containerClassName = '',
    ...props
  },
  ref
) {
  const inputId = id || (props.name ? `input-${props.name}` : undefined);

  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-brand-text mb-1.5"
        >
          {label}
          {required && <span className="text-brand-error ml-1">*</span>}
        </label>
      )}

      <div className="relative rounded-lg">
        {LeftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-muted">
            <LeftIcon className="w-4 h-4" />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={disabled}
          required={required}
          className={`w-full text-sm bg-white border rounded-lg transition-colors duration-150 placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${
            LeftIcon ? 'pl-9' : 'pl-3.5'
          } ${RightIcon || error ? 'pr-9' : 'pr-3.5'} py-2.5 ${
            error
              ? 'border-brand-error text-brand-text focus:border-brand-error focus:ring-brand-error/20'
              : 'border-brand-border text-brand-text hover:border-blue-300 focus:border-brand-primary focus:ring-brand-primary/20'
          } ${className}`}
          {...props}
        />

        {error ? (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-brand-error">
            <AlertCircle className="w-4 h-4" />
          </div>
        ) : RightIcon ? (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-brand-muted">
            <RightIcon className="w-4 h-4" />
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="mt-1.5 text-xs text-brand-error flex items-center gap-1">
          {error}
        </p>
      ) : helperText ? (
        <p className="mt-1.5 text-xs text-brand-muted">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Input;
