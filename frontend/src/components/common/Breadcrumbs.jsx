import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home, ArrowLeft } from 'lucide-react';

/**
 * Breadcrumbs navigation component.
 *
 * @param {Array<{ label: string, path?: string, icon?: React.ComponentType }>} items
 * @param {{ label?: string, path: string }} [backLink]
 * @param {React.ReactNode} [actions]
 * @param {string} [className]
 */
export default function Breadcrumbs({
  items = [],
  backLink,
  actions,
  className = '',
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`border-b border-brand-border bg-white ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Breadcrumbs Trail */}
        <ol className="flex items-center flex-wrap gap-1.5 sm:gap-2 text-brand-muted min-w-0">
          {/* Home Link */}
          <li className="flex items-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-slate-500 hover:text-brand-primary transition-colors focus:outline-none focus:ring-1 focus:ring-brand-primary rounded px-1 py-0.5"
              title="Home"
            >
              <Home className="w-3.5 h-3.5 shrink-0" />
              <span className="sr-only sm:not-sr-only sm:inline font-medium">Home</span>
            </Link>
          </li>

          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            const Icon = item.icon;

            return (
              <li key={index} className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" aria-hidden="true" />

                {isLast || !item.path ? (
                  <span
                    aria-current="page"
                    className="font-semibold text-brand-text truncate max-w-[200px] sm:max-w-xs md:max-w-md flex items-center gap-1.5"
                    title={item.label}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5 text-brand-primary shrink-0" />}
                    <span className="truncate">{item.label}</span>
                  </span>
                ) : (
                  <Link
                    to={item.path}
                    className="hover:text-brand-primary text-brand-muted transition-colors truncate max-w-[150px] sm:max-w-[200px] flex items-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-brand-primary rounded px-1 py-0.5"
                  >
                    {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                    <span className="truncate">{item.label}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ol>

        {/* Right: Back Link or Action Slot */}
        <div className="flex items-center gap-3 shrink-0 ml-auto">
          {backLink && (
            <Link
              to={backLink.path}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:text-brand-dark transition-colors px-2 py-1 rounded-lg hover:bg-brand-veryLight"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{backLink.label || 'Back'}</span>
            </Link>
          )}

          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    </nav>
  );
}
