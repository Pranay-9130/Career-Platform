import React from 'react';
import { Info, CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';

export default function Alert({
  variant = 'info',
  title,
  children,
  onClose,
  className = '',
  ...props
}) {
  const configs = {
    info: {
      container: 'bg-brand-veryLight border-brand-border text-brand-text',
      iconColor: 'text-brand-primary',
      Icon: Info,
    },
    success: {
      container: 'bg-green-50 border-green-200 text-slate-800',
      iconColor: 'text-brand-success',
      Icon: CheckCircle2,
    },
    warning: {
      container: 'bg-amber-50 border-amber-200 text-slate-800',
      iconColor: 'text-brand-warning',
      Icon: AlertTriangle,
    },
    error: {
      container: 'bg-red-50 border-red-200 text-slate-800',
      iconColor: 'text-brand-error',
      Icon: AlertCircle,
    },
  };

  const { container, iconColor, Icon } = configs[variant] || configs.info;

  return (
    <div
      role="alert"
      className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${container} ${className}`}
      {...props}
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
      <div className="flex-1 text-sm">
        {title && <h5 className="font-semibold mb-0.5">{title}</h5>}
        <div className="text-slate-600 leading-relaxed">{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss alert"
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
