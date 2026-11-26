import React, { useEffect, useRef } from 'react';
import {
  Compass,
  Sparkles,
  Clock,
  ArrowRight,
  CheckCircle2,
  X,
  Target,
  BrainCircuit,
  TrendingUp,
} from 'lucide-react';
import Button from '@/components/common/Button';

export default function CareerGuidanceWelcomeModal({
  isOpen,
  onClose,
  onStart,
}) {
  const closeButtonRef = useRef(null);
  const modalSurfaceRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const benefits = [
    {
      title: 'Discover career paths matching your interests',
      desc: 'Connect your passions to in-demand industry roles and verified market opportunities.',
      icon: Target,
    },
    {
      title: 'Understand your current technical skills',
      desc: 'Benchmark your current foundational readiness through a quick indicative check.',
      icon: BrainCircuit,
    },
    {
      title: 'Identify skills you need to improve',
      desc: 'Spot critical skill gaps early and target precisely what hiring managers look for.',
      icon: TrendingUp,
    },
    {
      title: 'Receive a personalized learning and career roadmap',
      desc: 'Get an actionable 7-stage roadmap tailored to your specific graduation timeline.',
      icon: Compass,
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="career-guidance-welcome-title"
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Surface */}
      <div
        ref={modalSurfaceRef}
        tabIndex={-1}
        className="relative w-full max-w-xl bg-white rounded-3xl border border-blue-100 shadow-2xl p-6 sm:p-8 my-auto z-10 transition-all transform animate-in fade-in zoom-in-95 duration-200 outline-none overflow-hidden"
      >
        {/* Decorative ambient gradient backdrop */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-blue-400/15 via-indigo-400/15 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-gradient-to-tr from-cyan-400/15 to-transparent rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close welcome modal"
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Badge */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <Compass className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Welcome to AspirePath
            </span>
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-2 mb-6">
          <h2
            id="career-guidance-welcome-title"
            className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight"
          >
            Your Career Journey Starts Here!
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Discover your strengths, explore career opportunities and get a personalized roadmap based on your interests and skills.
          </p>
        </div>

        {/* Key Benefits */}
        <div className="space-y-2.5 mb-6">
          {benefits.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50/80 border border-slate-100 hover:bg-blue-50/50 hover:border-blue-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-100/70 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    {b.title}
                  </p>
                  <p className="text-xs text-slate-500 line-clamp-1">
                    {b.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Estimated Duration & Assessment Highlights */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-white border border-blue-200/60 mb-6 text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-semibold text-slate-800">
              Estimated duration: <span className="text-blue-700 font-bold">3–5 minutes</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold text-slate-800">
              Assessment: <span className="text-emerald-700 font-bold">5-question indicative assessment</span>
            </span>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Button
            variant="gradient"
            size="lg"
            rightIcon={ArrowRight}
            onClick={onStart}
            className="w-full sm:flex-1 justify-center py-3 text-sm font-bold shadow-lg shadow-blue-500/25"
          >
            Discover My Career Path
          </Button>

          <Button
            variant="ghost"
            size="lg"
            onClick={onClose}
            className="w-full sm:w-auto text-slate-500 hover:text-slate-800 text-sm font-medium"
          >
            I'll Explore AspirePath First
          </Button>
        </div>
      </div>
    </div>
  );
}
