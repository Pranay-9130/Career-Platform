import React from 'react';
import { Loader2 } from 'lucide-react';

export default function PageLoadingFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-[60vh] w-full flex flex-col items-center justify-center p-8 space-y-4 text-center animate-in fade-in duration-300"
    >
      <div className="relative flex items-center justify-center">
        {/* Ambient pulse glow */}
        <div className="absolute w-12 h-12 rounded-full bg-brand-primary/20 blur-md animate-pulse" />
        <Loader2 className="w-8 h-8 text-brand-primary animate-spin" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-800">Loading experience...</p>
        <p className="text-xs text-slate-500">Preparing optimized assets and data</p>
      </div>
      <span className="sr-only">Loading page content, please wait...</span>
    </div>
  );
}
