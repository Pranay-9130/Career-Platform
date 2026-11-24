import React, { useState, useId } from 'react';
import {
  CalendarCheck,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  HelpCircle,
  RotateCcw,
  Plus,
  ArrowRight,
  Info,
  Sparkles,
} from 'lucide-react';
import { Button, Card, Badge } from '@/components/common';

export default function AttendanceCalculator() {
  const [totalClasses, setTotalClasses] = useState(48);
  const [attendedClasses, setAttendedClasses] = useState(38);
  const [targetPercentage, setTargetPercentage] = useState(75);

  const totalClassesInputId = useId();
  const attendedClassesInputId = useId();
  const targetPercentageInputId = useId();

  // Calculations
  const total = Math.max(0, parseInt(totalClasses, 10) || 0);
  const attended = Math.min(total, Math.max(0, parseInt(attendedClasses, 10) || 0));
  const target = Math.min(100, Math.max(1, parseInt(targetPercentage, 10) || 75));

  const currentPercentage = total > 0 ? (attended / total) * 100 : 0;
  const isAboveTarget = currentPercentage >= target;

  // If below target: classes needed to attend consecutively to reach target
  // (attended + x) / (total + x) >= target / 100
  // 100 * attended + 100x >= target * total + target * x
  // x * (100 - target) >= target * total - 100 * attended
  // x = ceil((target * total - 100 * attended) / (100 - target))
  let classesNeeded = 0;
  if (!isAboveTarget && target < 100) {
    const numerator = target * total - 100 * attended;
    const denominator = 100 - target;
    classesNeeded = Math.max(0, Math.ceil(numerator / denominator));
  }

  // If above target: safe classes to miss (bunk)
  // attended / (total + y) >= target / 100
  // 100 * attended >= target * total + target * y
  // target * y <= 100 * attended - target * total
  // y = floor((100 * attended - target * total) / target)
  let safeBunks = 0;
  if (isAboveTarget && target > 0) {
    const numerator = 100 * attended - target * total;
    safeBunks = Math.max(0, Math.floor(numerator / target));
  }

  const handleAttendedToday = () => {
    setTotalClasses((prev) => (parseInt(prev, 10) || 0) + 1);
    setAttendedClasses((prev) => (parseInt(prev, 10) || 0) + 1);
  };

  const handleMissedToday = () => {
    setTotalClasses((prev) => (parseInt(prev, 10) || 0) + 1);
  };

  const handleReset = () => {
    setTotalClasses(48);
    setAttendedClasses(38);
    setTargetPercentage(75);
  };

  // Status Theme
  const getStatusTheme = () => {
    if (currentPercentage >= target) {
      return {
        badge: 'success',
        color: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        bar: 'bg-emerald-500',
        label: 'Safe & On Track',
      };
    }
    if (currentPercentage >= target - 10) {
      return {
        badge: 'warning',
        color: 'text-amber-700',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        bar: 'bg-amber-500',
        label: 'Needs Attention',
      };
    }
    return {
      badge: 'danger',
      color: 'text-rose-700',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      bar: 'bg-rose-500',
      label: 'Critical Shortage',
    };
  };

  const status = getStatusTheme();

  return (
    <div className="space-y-6">
      {/* Top Banner / Purpose */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-blue-50/80 border border-blue-100 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Attendance Tracker & Recovery Planner</h3>
            <p className="text-xs text-slate-600">Calculate current attendance, planned leaves, and recovery targets.</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset} leftIcon={RotateCcw}>
          Reset Inputs
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Inputs */}
        <div className="lg:col-span-6 space-y-5">
          <Card className="p-6 border-slate-200 shadow-card space-y-5 bg-white">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attendance Data</h4>

            {/* Target Percentage Chips */}
            <div className="space-y-1.5">
              <label htmlFor={targetPercentageInputId} className="text-xs font-semibold text-slate-700">Target Attendance Threshold</label>
              <div className="grid grid-cols-4 gap-2">
                {[75, 80, 85, 90].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setTargetPercentage(pct)}
                    className={`py-2 text-xs font-bold rounded-xl transition-all ${
                      target === pct
                        ? 'bg-brand-primary text-white shadow-xs'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Total Classes */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor={totalClassesInputId} className="text-xs font-semibold text-slate-700">Total Classes Conducted</label>
                <span className="text-xs font-mono font-bold text-slate-500">{total}</span>
              </div>
              <input
                id={totalClassesInputId}
                type="number"
                min="1"
                max="500"
                value={totalClasses}
                onChange={(e) => setTotalClasses(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-hidden"
              />
            </div>

            {/* Attended Classes */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor={attendedClassesInputId} className="text-xs font-semibold text-slate-700">Classes Attended</label>
                <span className="text-xs font-mono font-bold text-slate-500">{attended}</span>
              </div>
              <input
                id={attendedClassesInputId}
                type="number"
                min="0"
                max={total}
                value={attendedClasses}
                onChange={(e) => setAttendedClasses(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-hidden"
              />
            </div>

            {/* Quick Daily Action Buttons */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Quick Daily Update</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleAttendedToday}
                  className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Attended Today</span>
                </button>
                <button
                  type="button"
                  onClick={handleMissedToday}
                  className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Missed Today</span>
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Calculations & Guidance */}
        <div className="lg:col-span-6 space-y-5">
          <Card className={`p-6 border ${status.border} shadow-card bg-white space-y-5`}>
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attendance Status</h4>
              <Badge variant={status.badge} size="sm">
                {status.label}
              </Badge>
            </div>

            {/* Percentage Big Number */}
            <div className="flex items-baseline gap-3">
              <span className={`text-4xl sm:text-5xl font-extrabold font-display ${status.color}`}>
                {currentPercentage.toFixed(1)}%
              </span>
              <span className="text-xs font-semibold text-slate-500">
                (Target: {target}%)
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden relative">
                <div
                  className={`h-full ${status.bar} transition-all duration-500 rounded-full`}
                  style={{ width: `${Math.min(100, currentPercentage)}%` }}
                />
                {/* Target threshold indicator line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-slate-800 z-10"
                  style={{ left: `${target}%` }}
                  title={`Target: ${target}%`}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                <span>0%</span>
                <span className="font-bold text-slate-700">Target Line: {target}%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Key Recommendation Box */}
            <div className={`p-4 rounded-2xl ${status.bg} border ${status.border} space-y-2`}>
              {isAboveTarget ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>Safe Leave Buffer: {safeBunks} {safeBunks === 1 ? 'class' : 'classes'}</span>
                  </div>
                  <p className="text-xs text-emerald-700 leading-relaxed pl-6">
                    You can miss the next <strong>{safeBunks}</strong> consecutive {safeBunks === 1 ? 'class' : 'classes'} without falling below your target threshold of <strong>{target}%</strong>.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>Recovery Requirement: {classesNeeded} consecutive {classesNeeded === 1 ? 'class' : 'classes'}</span>
                  </div>
                  <p className="text-xs text-rose-700 leading-relaxed pl-6">
                    You must attend the next <strong>{classesNeeded}</strong> {classesNeeded === 1 ? 'class' : 'classes'} consecutively without missing any to restore your attendance to <strong>{target}%</strong>.
                  </p>
                </div>
              )}
            </div>

            {/* Summary Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 block mb-0.5">Classes Attended</span>
                <span className="text-sm font-bold text-slate-900">{attended} / {total}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 block mb-0.5">Classes Missed</span>
                <span className="text-sm font-bold text-slate-900">{total - attended}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
