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
  XCircle,
  Clock,
  Layers,
} from 'lucide-react';
import { Button, Card, Badge } from '@/components/common';

export default function AttendanceCalculator() {
  // Input states: Total semester classes, conducted so far, attended so far, target percentage
  const [totalSemesterClasses, setTotalSemesterClasses] = useState(60);
  const [conductedClasses, setConductedClasses] = useState(30);
  const [attendedClasses, setAttendedClasses] = useState(20);
  const [targetPercentage, setTargetPercentage] = useState(75);

  const totalSemesterClassesInputId = useId();
  const conductedClassesInputId = useId();
  const attendedClassesInputId = useId();
  const targetPercentageInputId = useId();

  // Parsing & Non-negative whole number validation
  const totalPlanned = Math.max(0, parseInt(totalSemesterClasses, 10) || 0);
  const conductedRaw = Math.max(0, parseInt(conductedClasses, 10) || 0);
  const attendedRaw = Math.max(0, parseInt(attendedClasses, 10) || 0);
  const target = Math.min(100, Math.max(1, parseInt(targetPercentage, 10) || 75));

  // Validation checks
  const isAttendedExceedingConducted = conductedRaw > 0 && attendedRaw > conductedRaw;
  const isConductedExceedingTotal = totalPlanned > 0 && conductedRaw > totalPlanned;

  // Normalized values for safe calculation (avoids negative values or division errors)
  const validTotal = totalPlanned;
  const validConducted = Math.min(validTotal > 0 ? validTotal : Infinity, conductedRaw);
  const validAttended = Math.min(validConducted, attendedRaw);

  // Section 2: Current attendance calculations
  // Current Attendance = (Classes Attended / Classes Conducted) * 100
  const currentPercentage = validConducted > 0 ? (validAttended / validConducted) * 100 : 0;
  // Classes Missed = Classes Conducted - Classes Attended
  const classesMissed = Math.max(0, validConducted - validAttended);
  // Remaining Classes = Total Semester Classes - Classes Conducted
  const remainingClasses = Math.max(0, validTotal - validConducted);

  const isAboveTarget = currentPercentage >= target;

  // Section 3: Recovery calculation
  // (Attended Classes + x) / (Conducted Classes + x) * 100 = Target Percentage
  // x = ceil((Target * Conducted - 100 * Attended) / (100 - Target))
  let classesNeeded = 0;
  if (!isAboveTarget) {
    if (target < 100) {
      const numerator = target * validConducted - 100 * validAttended;
      const denominator = 100 - target;
      classesNeeded = Math.max(0, Math.ceil(numerator / denominator));
    } else {
      // 100% target is impossible once any class is missed
      classesNeeded = validConducted > validAttended ? Infinity : 0;
    }
  }

  // Safe buffer if above target: (100 * Attended - Target * Conducted) / Target
  let safeBunks = 0;
  if (isAboveTarget && target > 0) {
    const numerator = 100 * validAttended - target * validConducted;
    safeBunks = Math.max(0, Math.floor(numerator / target));
  }

  // Section 4: Feasibility check
  const isAchievable = isAboveTarget || classesNeeded <= remainingClasses;

  // Maximum possible final attendance if all remaining classes are attended:
  // ((Attended + Remaining) / Total Semester Classes) * 100
  const maxPossibleFinalAttendance =
    validTotal > 0
      ? ((validAttended + remainingClasses) / validTotal) * 100
      : 0;

  // Quick Daily Action Handlers
  const handleAttendedToday = () => {
    setConductedClasses((prev) => {
      const nextConducted = (parseInt(prev, 10) || 0) + 1;
      setTotalSemesterClasses((prevTotal) => {
        const curTotal = parseInt(prevTotal, 10) || 0;
        return nextConducted > curTotal ? nextConducted : curTotal;
      });
      return nextConducted;
    });
    setAttendedClasses((prev) => (parseInt(prev, 10) || 0) + 1);
  };

  const handleMissedToday = () => {
    setConductedClasses((prev) => {
      const nextConducted = (parseInt(prev, 10) || 0) + 1;
      setTotalSemesterClasses((prevTotal) => {
        const curTotal = parseInt(prevTotal, 10) || 0;
        return nextConducted > curTotal ? nextConducted : curTotal;
      });
      return nextConducted;
    });
  };

  const handleReset = () => {
    setTotalSemesterClasses(60);
    setConductedClasses(30);
    setAttendedClasses(20);
    setTargetPercentage(75);
  };

  // Status Theme
  const getStatusTheme = () => {
    if (!isAchievable) {
      return {
        badge: 'danger',
        color: 'text-rose-700',
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        bar: 'bg-rose-500',
        label: 'Target Unachievable',
      };
    }
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
            <h3 className="text-sm font-bold text-slate-900">Semester Attendance Calculator & Recovery Planner</h3>
            <p className="text-xs text-slate-600">Track current attendance, remaining semester classes, and recovery feasibility.</p>
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
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Semester Attendance Data</h4>

            {/* Target Percentage Chips */}
            <div className="space-y-1.5">
              <label htmlFor={targetPercentageInputId} className="text-xs font-semibold text-slate-700">
                Target Attendance Threshold
              </label>
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

            {/* Input 1: Total Classes in This Semester */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor={totalSemesterClassesInputId} className="text-xs font-semibold text-slate-700">
                  Total Classes in This Semester
                </label>
                <span className="text-xs font-mono font-bold text-slate-500">{totalPlanned} planned</span>
              </div>
              <input
                id={totalSemesterClassesInputId}
                type="number"
                min="1"
                max="1000"
                value={totalSemesterClasses}
                onChange={(e) => setTotalSemesterClasses(e.target.value)}
                placeholder="e.g. 60"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-hidden"
              />
              <p className="text-[11px] text-slate-400">Total number of classes scheduled across the full semester.</p>
            </div>

            {/* Input 2: Classes Conducted So Far */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor={conductedClassesInputId} className="text-xs font-semibold text-slate-700">
                  Classes Conducted So Far
                </label>
                <span className="text-xs font-mono font-bold text-slate-500">{conductedRaw} held</span>
              </div>
              <input
                id={conductedClassesInputId}
                type="number"
                min="0"
                max={totalPlanned || 1000}
                value={conductedClasses}
                onChange={(e) => setConductedClasses(e.target.value)}
                placeholder="e.g. 30"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-hidden"
              />
              <p className="text-[11px] text-slate-400">Classes conducted by faculty to date.</p>
            </div>

            {/* Input 3: Classes Attended So Far */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor={attendedClassesInputId} className="text-xs font-semibold text-slate-700">
                  Classes Attended So Far
                </label>
                <span className="text-xs font-mono font-bold text-slate-500">{attendedRaw} attended</span>
              </div>
              <input
                id={attendedClassesInputId}
                type="number"
                min="0"
                max={conductedRaw || totalPlanned || 1000}
                value={attendedClasses}
                onChange={(e) => setAttendedClasses(e.target.value)}
                placeholder="e.g. 20"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-hidden"
              />
              <p className="text-[11px] text-slate-400">Classes you were present for.</p>
            </div>

            {/* Validation Alerts */}
            {isAttendedExceedingConducted && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-800">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  <strong>Input Notice:</strong> Attended classes ({attendedRaw}) cannot exceed conducted classes ({conductedRaw}). Calculations have been capped to {conductedRaw}.
                </span>
              </div>
            )}
            {isConductedExceedingTotal && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-800">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  <strong>Input Notice:</strong> Conducted classes ({conductedRaw}) cannot exceed total semester classes ({totalPlanned}). Calculations have been capped to {totalPlanned}.
                </span>
              </div>
            )}

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
                {validConducted > 0 ? `${currentPercentage.toFixed(2)}%` : '0.00%'}
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
                  style={{ width: `${Math.min(100, Math.max(0, currentPercentage))}%` }}
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
              ) : isAchievable ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>Recovery Requirement: {classesNeeded} consecutive {classesNeeded === 1 ? 'class' : 'classes'}</span>
                  </div>
                  <p className="text-xs text-rose-700 leading-relaxed pl-6">
                    You must attend the next <strong>{classesNeeded}</strong> consecutive {classesNeeded === 1 ? 'class' : 'classes'} without missing any to restore your attendance to <strong>{target}%</strong>.
                  </p>
                  <p className="text-[11px] text-slate-600 pl-6 pt-1 font-medium">
                    Feasibility: <strong>Achievable</strong> — {classesNeeded} of {remainingClasses} remaining classes needed (margin: {remainingClasses - classesNeeded} classes).
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                    <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>Target Unachievable This Semester</span>
                  </div>
                  <p className="text-xs text-rose-700 leading-relaxed pl-6">
                    The selected target of <strong>{target}%</strong> cannot be reached within the remaining <strong>{remainingClasses}</strong> classes, even with perfect attendance.
                  </p>
                  <div className="mt-2 pl-6 pt-1 border-t border-rose-200/60 flex items-center justify-between text-xs font-semibold text-rose-900">
                    <span>Maximum Possible Final Attendance:</span>
                    <span className="font-extrabold text-sm">{maxPossibleFinalAttendance.toFixed(2)}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Summary Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 block mb-0.5">Classes Attended</span>
                <span className="text-sm font-bold text-slate-900">
                  {validAttended} / {validConducted}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">so far</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 block mb-0.5">Classes Missed</span>
                <span className="text-sm font-bold text-rose-600">{classesMissed}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">missed to date</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 block mb-0.5">Remaining Classes</span>
                <span className="text-sm font-bold text-slate-900">{remainingClasses}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">of {validTotal} total planned</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 block mb-0.5">Max Final Possible</span>
                <span className="text-sm font-bold text-brand-primary">
                  {maxPossibleFinalAttendance.toFixed(2)}%
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">with 100% future attendance</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
