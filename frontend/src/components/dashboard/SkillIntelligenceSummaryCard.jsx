import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BrainCircuit,
  Compass,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
  AlertTriangle,
  RefreshCw,
  Target,
  ExternalLink,
} from 'lucide-react';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import Skeleton from '@/components/common/Skeleton';
import { skillIntelligenceService } from '@/services/skillIntelligenceService';

export default function SkillIntelligenceSummaryCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const summary = await skillIntelligenceService.getDashboardSummary();
      setData(summary);
    } catch (err) {
      console.error('Failed to load Skill Intelligence summary:', err);
      setError('Unable to load skill metrics right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Loading State
  if (loading) {
    return (
      <div className="p-6 bg-white rounded-3xl border border-brand-border shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-2xl" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-56" />
            </div>
          </div>
          <Skeleton className="h-8 w-28 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      </div>
    );
  }

  // Error State
  if (error && !data) {
    return (
      <div className="p-5 bg-blue-50/50 border border-blue-200/60 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-blue-900">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{error}</span>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSummary} leftIcon={RefreshCw}>
          Retry
        </Button>
      </div>
    );
  }

  const hasTargetRole = data?.has_target_role && data?.target_role;
  const topRecs = data?.top_recommendations || [];
  const progSummary = data?.progress_summary || {};
  const hasSavedProgress = (progSummary.completed || 0) + (progSummary.learning || 0) + (progSummary.practiced || 0) > 0;
  const completionPct = data?.completion_percentage || 0;

  // Unconfigured Onboarding State
  if (!hasTargetRole) {
    return (
      <div className="p-6 bg-gradient-to-br from-blue-50/80 via-white to-cyan-50/40 rounded-3xl border border-blue-100 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-primary text-white flex items-center justify-center shadow-md shrink-0">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-display text-brand-text">Skill Intelligence</h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-brand-primary font-bold text-[10px] uppercase tracking-wide">
                  New Feature
                </span>
              </div>
              <p className="text-xs text-brand-muted max-w-xl leading-relaxed">
                Build the exact high-demand skills required for your target engineering role. Extract competencies from your resume, identify gaps, and unlock a personalized learning roadmap.
              </p>
            </div>
          </div>

          <Link to="/skill-intelligence" className="shrink-0 w-full sm:w-auto">
            <Button variant="primary" size="sm" rightIcon={ArrowRight} className="w-full font-bold shadow-sm">
              Personalize My Skills
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Configured State
  return (
    <div className="p-6 bg-white rounded-3xl border border-brand-border shadow-card hover:border-brand-primary/30 transition-all space-y-5">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-brand-primary flex items-center justify-center shrink-0 border border-blue-100">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold font-display text-brand-text">Skill Intelligence</h3>
              <span className="text-xs text-brand-muted">•</span>
              <span className="text-xs font-semibold text-brand-primary flex items-center gap-1">
                <Target className="w-3.5 h-3.5" />
                Target Role: <strong className="text-brand-text">{data.target_role}</strong>
              </span>
              {data.experience_level && (
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                  {data.experience_level}
                </span>
              )}
            </div>
            <p className="text-xs text-brand-muted mt-0.5">
              Focus on {data.recommended_skills_count} curated competencies to maximize your job market readiness.
            </p>
          </div>
        </div>

        <Link to="/skill-intelligence" className="shrink-0">
          <Button variant="primary" size="sm" rightIcon={ArrowRight} className="font-bold shadow-sm">
            View Skill Roadmap
          </Button>
        </Link>
      </div>

      {/* Progress Metric if exists */}
      {hasSavedProgress ? (
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1 w-full sm:max-w-md">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-brand-text">Competency Progress</span>
              <span className="text-brand-primary font-bold">{completionPct}% Completed</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-brand-primary h-full rounded-full transition-all duration-700"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span><strong>{progSummary.completed || 0}</strong> completed</span>
            <span>•</span>
            <span><strong>{(progSummary.learning || 0) + (progSummary.practiced || 0)}</strong> in progress</span>
            <span>•</span>
            <span><strong>{progSummary.not_started || 0}</strong> remaining</span>
          </div>
        </div>
      ) : null}

      {/* Recommended Priority Skills Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-brand-muted font-bold uppercase tracking-wider">
          <span>Priority Focus Skills</span>
          <Link to="/skill-intelligence" className="hover:text-brand-primary transition-colors lowercase font-medium">
            view all ({data.recommended_skills_count}) &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {topRecs.map((rec, idx) => {
            const isCompleted = rec.current_status === 'Completed';
            const isLearning = rec.current_status === 'Learning';
            const isPracticed = rec.current_status === 'Practiced';

            return (
              <div
                key={rec.skill_name || idx}
                className="p-3.5 bg-slate-50/70 hover:bg-blue-50/40 rounded-2xl border border-slate-200/70 hover:border-brand-primary/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold text-slate-400">
                      #{idx + 1}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                        rec.priority === 'High'
                          ? 'bg-rose-50 text-rose-600 border border-rose-100'
                          : rec.priority === 'Medium'
                          ? 'bg-amber-50 text-amber-700 border border-amber-100'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {rec.priority} Priority
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-brand-text truncate">
                    {rec.skill_name}
                  </h4>
                  <p className="text-[11px] text-brand-muted mt-1 line-clamp-2 leading-relaxed">
                    {rec.reason}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/50 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium truncate max-w-[140px]">
                    {rec.category}
                  </span>
                  <span
                    className={`font-semibold shrink-0 ${
                      isCompleted
                        ? 'text-emerald-600 flex items-center gap-1'
                        : isLearning
                        ? 'text-brand-primary'
                        : isPracticed
                        ? 'text-cyan-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {isCompleted && <CheckCircle2 className="w-3 h-3" />}
                    {rec.current_status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
