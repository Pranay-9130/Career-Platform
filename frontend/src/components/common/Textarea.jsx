import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

const Textarea = forwardRef(function Textarea(
  {
    label,
    error,
    helperText,
    id,
    rows = 4,
    disabled = false,
    required = false,
    className = '',
    containerClassName = '',
    ...props
  },
  ref
) {
  const textareaId = id || (props.name ? `textarea-${props.name}` : undefined);

  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-xs font-semibold text-brand-text mb-1.5"
        >
          {label}
          {required && <span className="text-brand-error ml-1">*</span>}
        </label>
      )}

      <div className="relative rounded-lg">
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          disabled={disabled}
          required={required}
          className={`w-full text-sm bg-white border rounded-lg p-3 transition-colors duration-150 placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${
            error
              ? 'border-brand-error text-brand-text focus:border-brand-error focus:ring-brand-error/20'
              : 'border-brand-border text-brand-text hover:border-blue-300 focus:border-brand-primary focus:ring-brand-primary/20'
          } ${className}`}
          {...props}
        />

        {error && (
          <div className="absolute top-3 right-3 pointer-events-none text-brand-error">
            <AlertCircle className="w-4 h-4" />
          </div>
        )}
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

export default Textarea;
