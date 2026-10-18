import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className = '',
}) {
  const closeButtonRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      className="fixed inset-0 z-50 overflow-y-auto flex items-start sm:items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Surface */}
      <div
        className={`relative w-full max-h-[calc(100dvh-2rem)] overflow-y-auto bg-white rounded-card border border-brand-border shadow-modal p-4 sm:p-6 my-auto z-10 transition-all transform animate-in fade-in zoom-in-95 duration-150 ${
          sizeStyles[size] || sizeStyles.md
        } ${className}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-brand-border">
          <div>
            {title && (
              <h3 id={titleId} className="text-lg font-display font-bold text-brand-text">
                {title}
              </h3>
            )}
            {description && (
              <p className="mt-1 text-xs text-brand-muted">{description}</p>
            )}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="text-slate-400 hover:text-brand-text p-1.5 rounded-lg hover:bg-slate-100 transition-colors -mr-1.5 -mt-1.5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-4 text-sm text-brand-text">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="pt-4 border-t border-brand-border flex flex-wrap items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
