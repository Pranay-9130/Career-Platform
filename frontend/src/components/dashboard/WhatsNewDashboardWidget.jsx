import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Compass,
  BrainCircuit,
  Calculator,
  Briefcase,
  FileText,
  Layers,
  CheckCircle2,
  Clock,
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

export default function WhatsNewDashboardWidget({
  announcements = [],
  unreadCount = 0,
  onExplore,
}) {
  const [filter, setFilter] = useState('all'); // 'all' | 'unexplored'

  if (!announcements || announcements.length === 0) return null;

  const displayedList = filter === 'unexplored'
    ? announcements.filter((a) => a.user_status !== 'SEEN')
    : announcements;

  return (
    <div className="bg-white rounded-3xl border border-blue-100 shadow-card p-5 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                What's New in AspirePath
              </h2>
              {unreadCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Latest tools, features, and platform updates designed for your career journey.
            </p>
          </div>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-xl text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg transition-all ${
              filter === 'all'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Updates ({announcements.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unexplored')}
            className={`px-3 py-1 rounded-lg transition-all ${
              filter === 'unexplored'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Unexplored ({unreadCount})
          </button>
        </div>
      </div>

      {/* Announcements List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
        {displayedList.map((ann) => {
          const IconComp = (ann.icon_or_image && iconMap[ann.icon_or_image]) || Sparkles;
          const isExplored = ann.user_status === 'SEEN';
          const isDeferred = ann.user_status === 'DEFERRED';

          return (
            <div
              key={ann.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden group ${
                isExplored
                  ? 'bg-slate-50/60 border-slate-200/80 hover:border-slate-300'
                  : 'bg-gradient-to-b from-blue-50/40 via-white to-white border-blue-200/90 hover:border-blue-300 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-100/70 text-blue-700 flex items-center justify-center shrink-0">
                    <IconComp className="w-4 h-4" />
                  </div>

                  <div>
                    {isExplored ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Explored
                      </span>
                    ) : isDeferred ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Deferred
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-md">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        New Feature
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-1 mb-1">
                  {ann.title}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                  {ann.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between">
                {ann.link_url ? (
                  <Link
                    to={ann.link_url}
                    onClick={() => onExplore?.(ann)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 transition-colors"
                  >
                    <span>{ann.link_label || 'Explore Feature'}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">Platform Upgrade</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {displayedList.length === 0 && (
        <div className="text-center py-6 text-xs text-slate-500">
          All feature updates have been explored! Check back soon for new platform tools.
        </div>
      )}
    </div>
  );
}
