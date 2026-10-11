import React, { forwardRef } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';

const Select = forwardRef(function Select(
  {
    label,
    error,
    helperText,
    id,
    options = [],
    disabled = false,
    required = false,
    className = '',
    containerClassName = '',
    children,
    ...props
  },
  ref
) {
  const selectId = id || (props.name ? `select-${props.name}` : undefined);

  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold text-brand-text mb-1.5"
        >
          {label}
          {required && <span className="text-brand-error ml-1">*</span>}
        </label>
      )}

      <div className="relative rounded-lg">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          required={required}
          className={`w-full text-sm bg-white border rounded-lg py-2.5 pl-3.5 pr-10 appearance-none transition-colors duration-150 focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${
            error
              ? 'border-brand-error text-brand-text focus:border-brand-error focus:ring-brand-error/20'
              : 'border-brand-border text-brand-text hover:border-blue-300 focus:border-brand-primary focus:ring-brand-primary/20'
          } ${className}`}
          {...props}
        >
          {children
            ? children
            : options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
        </select>

        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-brand-muted">
          {error ? (
            <AlertCircle className="w-4 h-4 text-brand-error" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
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

export default Select;
