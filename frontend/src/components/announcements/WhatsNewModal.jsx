import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  X,
  Compass,
  BrainCircuit,
  Calculator,
  Briefcase,
  FileText,
  Layers,
  ExternalLink,
} from 'lucide-react';
import Button from '@/components/common/Button';

const iconMap = {
  Compass,
  BrainCircuit,
  Calculator,
  Briefcase,
  FileText,
  Layers,
  Sparkles,
};

export default function WhatsNewModal({
  isOpen,
  announcements = [],
  onClose,
  onExplore,
  onMaybeLater,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const modalSurfaceRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    setCurrentIndex(0);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev + 1 < announcements.length ? prev + 1 : prev));
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const frameId = requestAnimationFrame(() => {
      modalSurfaceRef.current?.focus();
    });

    return () => {
      cancelAnimationFrame(frameId);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, announcements.length, onClose]);

  if (!isOpen || !announcements || announcements.length === 0) return null;

  const current = announcements[currentIndex] || announcements[0];
  const total = announcements.length;
  const IconComponent = (current.icon_or_image && iconMap[current.icon_or_image]) || Sparkles;

  const handleNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="whats-new-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={() => onClose?.(current)}
        aria-hidden="true"
      />

      {/* Modal Surface */}
      <div
        ref={modalSurfaceRef}
        tabIndex={-1}
        className="relative w-full max-w-lg bg-white rounded-3xl border border-blue-100 shadow-2xl p-6 sm:p-7 my-auto z-10 transition-all transform animate-in fade-in zoom-in-95 duration-200 outline-none overflow-hidden"
      >
        {/* Ambient background glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-gradient-to-br from-blue-400/15 via-indigo-400/15 to-transparent rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={() => onClose?.(current)}
          aria-label="Close feature announcements"
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge & Counter */}
        <div className="flex items-center justify-between mb-4 pr-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>What's New in AspirePath</span>
          </div>

          {total > 1 && (
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {currentIndex + 1} of {total}
            </span>
          )}
        </div>

        {/* Feature Announcement Card */}
        <div className="space-y-4 my-2">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0 mt-0.5">
              <IconComponent className="w-6 h-6" />
            </div>
            <div className="space-y-1 min-w-0">
              <h2
                id="whats-new-modal-title"
                className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight"
              >
                {current.title}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {current.description}
              </p>
            </div>
          </div>
        </div>

        {/* Pagination Dots if multiple */}
        {total > 1 && (
          <div className="flex items-center justify-center gap-1.5 py-3">
            {announcements.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to announcement ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentIndex ? 'w-6 bg-blue-600' : 'w-1.5 bg-slate-200 hover:bg-slate-300'
                }`}
              />
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 mt-2">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {total > 1 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="px-2.5 py-2 text-slate-600"
                  aria-label="Previous announcement"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={currentIndex === total - 1}
                  className="px-2.5 py-2 text-slate-600"
                  aria-label="Next announcement"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMaybeLater?.(current)}
              className="text-slate-500 hover:text-slate-800 text-xs font-medium ml-1"
            >
              Maybe Later
            </Button>
          </div>

          <Button
            variant="gradient"
            size="sm"
            rightIcon={ArrowRight}
            onClick={() => onExplore?.(current)}
            className="w-full sm:w-auto text-xs font-bold px-5 py-2.5 shadow-md shadow-blue-500/20"
          >
            {current.link_label || 'Explore Feature'}
          </Button>
        </div>
      </div>
    </div>
  );
}
