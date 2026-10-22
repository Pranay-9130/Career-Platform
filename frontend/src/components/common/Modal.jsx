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
  const modalSurfaceRef = useRef(null);
  const previouslyFocusedRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();

  // Always keep the latest onClose callback available to event listeners
  // without triggering effect cleanup/re-run on parent re-renders.
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return undefined;

    // Remember the element that had focus before the modal was opened
    previouslyFocusedRef.current = document.activeElement;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCloseRef.current?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // On initial mount/open, direct initial focus to the modal surface
    // only if focus is not already inside the modal (e.g. via autoFocus).
    // NEVER steal focus from user-interactive inputs during typing!
    const frameId = requestAnimationFrame(() => {
      if (
        modalSurfaceRef.current &&
        !modalSurfaceRef.current.contains(document.activeElement)
      ) {
        modalSurfaceRef.current.focus();
      }
    });

    return () => {
      cancelAnimationFrame(frameId);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);

      // Return focus to the originating trigger element when modal closes
      const prev = previouslyFocusedRef.current;
      if (prev instanceof HTMLElement && prev.isConnected) {
        prev.focus();
      }
    };
  }, [isOpen]);

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
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCloseRef.current?.();
        }
      }}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={() => onCloseRef.current?.()}
        aria-hidden="true"
      />

      {/* Modal Surface */}
      <div
        ref={modalSurfaceRef}
        tabIndex={-1}
        className={`relative w-full max-h-[calc(100dvh-2rem)] overflow-y-auto bg-white rounded-card border border-brand-border shadow-modal p-4 sm:p-6 my-auto z-10 transition-all transform animate-in fade-in zoom-in-95 duration-150 outline-none ${
          sizeStyles[size] || sizeStyles.md
        } ${className}`}
        onClick={(e) => e.stopPropagation()}
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
            onClick={() => onCloseRef.current?.()}
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
