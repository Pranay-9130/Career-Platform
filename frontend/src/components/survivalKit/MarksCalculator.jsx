import React, { useState } from 'react';
import {
  Percent,
  Plus,
  Trash2,
  Sparkles,
  Award,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BarChart3,
  Target,
  BookOpen,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { Button, Card, Badge } from '@/components/common';

export default function MarksCalculator() {
  const [activeTab, setActiveTab] = useState('single'); // 'single', 'multi', 'target'

  // Mode 1: Single exam percentage
  const [singleObtained, setSingleObtained] = useState('465');
  const [singleMax, setSingleMax] = useState('500');

  // Mode 2: Multi-subject aggregator
  const [subjects, setSubjects] = useState([
    { id: '1', name: 'Data Structures & Algorithms', obtained: 88, max: 100 },
    { id: '2', name: 'Database Management Systems', obtained: 82, max: 100 },
    { id: '3', name: 'Computer Networks', obtained: 76, max: 100 },
    { id: '4', name: 'Operating Systems', obtained: 91, max: 100 },
    { id: '5', name: 'Software Engineering', obtained: 85, max: 100 },
  ]);

  // Mode 3: Target marks planner
  const [internalObtained, setInternalObtained] = useState('34');
  const [internalMax, setInternalMax] = useState('40');
  const [externalMax, setExternalMax] = useState('60');
  const [targetPercent, setTargetPercent] = useState('80');

  // Calculations for Mode 1
  const obtainedNum = Math.max(0, parseFloat(singleObtained) || 0);
  const maxNum = Math.max(1, parseFloat(singleMax) || 100);
  const singlePercentage = Math.min(100, (obtainedNum / maxNum) * 100);
  const singleCgpaEq = (singlePercentage / 9.5).toFixed(2);

  const getDivision = (pct) => {
    if (pct >= 75) return { label: 'Distinction / First Class with Distinction', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (pct >= 60) return { label: 'First Class / Grade A', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    if (pct >= 50) return { label: 'Second Class / Grade B', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    if (pct >= 40) return { label: 'Pass Class / Third Class', color: 'text-orange-700 bg-orange-50 border-orange-200' };
    return { label: 'Need Improvement / Below Passing Threshold', color: 'text-red-700 bg-red-50 border-red-200' };
  };

  // Calculations for Mode 2 (Multi-subject)
  const totalSubObtained = subjects.reduce((sum, s) => sum + (parseFloat(s.obtained) || 0), 0);
  const totalSubMax = subjects.reduce((sum, s) => sum + (parseFloat(s.max) || 0), 0);
  const multiPercentage = totalSubMax > 0 ? (totalSubObtained / totalSubMax) * 100 : 0;
  const multiAverage = subjects.length > 0 ? totalSubObtained / subjects.length : 0;

  const validSubjects = subjects.filter((s) => (parseFloat(s.max) || 0) > 0);
  const sortedByPct = [...validSubjects].sort(
    (a, b) => ((b.obtained || 0) / (b.max || 1)) - ((a.obtained || 0) / (a.max || 1))
  );
  const bestSubject = sortedByPct[0];
  const lowestSubject = sortedByPct[sortedByPct.length - 1];

  const handleAddSubject = () => {
    setSubjects((prev) => [
      ...prev,
      { id: Date.now().toString(), name: `Subject ${prev.length + 1}`, obtained: 80, max: 100 },
    ]);
  };

  const handleRemoveSubject = (id) => {
    if (subjects.length <= 1) return;
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  };

  const handleUpdateSubject = (id, field, value) => {
    setSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  // Calculations for Mode 3 (Target score finder)
  const intObt = parseFloat(internalObtained) || 0;
  const intMx = parseFloat(internalMax) || 0;
  const extMx = parseFloat(externalMax) || 0;
  const tgtPct = parseFloat(targetPercent) || 0;

  const totalCourseMax = intMx + extMx;
  const totalMarksNeeded = (tgtPct / 100) * totalCourseMax;
  const externalMarksNeeded = Math.ceil(totalMarksNeeded - intObt);
  const isTargetAchievable = externalMarksNeeded <= extMx;
  const externalNeededPct = extMx > 0 ? ((externalMarksNeeded / extMx) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Sub-Tabs / Mode Selector */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-xl max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab('single')}
          className={`flex-1 min-w-[120px] py-2 px-3 text-xs sm:text-sm font-medium rounded-lg transition-all ${
            activeTab === 'single'
              ? 'bg-white text-brand-primary shadow-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Quick Percentage
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('multi')}
          className={`flex-1 min-w-[120px] py-2 px-3 text-xs sm:text-sm font-medium rounded-lg transition-all ${
            activeTab === 'multi'
              ? 'bg-white text-brand-primary shadow-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All Subjects
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('target')}
          className={`flex-1 min-w-[120px] py-2 px-3 text-xs sm:text-sm font-medium rounded-lg transition-all ${
            activeTab === 'target'
              ? 'bg-white text-brand-primary shadow-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Target Finder
        </button>
      </div>

      {/* Mode 1: Quick Single Percentage */}
      {activeTab === 'single' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-6 p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Marks to Percentage Converter</h3>
              <p className="text-xs text-slate-500 mt-1">
                Calculate overall percentage, division classification, and standard 9.5x CGPA equivalence.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Total Marks Obtained
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max={singleMax || 1000}
                    value={singleObtained}
                    onChange={(e) => setSingleObtained(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                    placeholder="e.g. 465"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-semibold text-slate-400">
                    Marks
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Maximum / Total Marks
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={singleMax}
                    onChange={(e) => setSingleMax(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                    placeholder="e.g. 500 or 600"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-semibold text-slate-400">
                    Max
                  </span>
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  Standard Max Presets:
                </label>
                <div className="flex flex-wrap gap-2">
                  {[100, 500, 600, 800, 1000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setSingleMax(preset.toString())}
                      className={`px-3 py-1 text-xs rounded-md border font-medium transition-colors ${
                        parseFloat(singleMax) === preset
                          ? 'bg-brand-primary text-white border-brand-primary'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset} Marks
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100 flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
              <div className="text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-900">Standard Conversion Formula</p>
                <p>
                  Percentage = <code className="bg-white px-1 py-0.5 rounded text-brand-primary font-mono">(Obtained / Maximum) × 100</code>
                </p>
                <p>
                  AICTE / CBSE Equivalent CGPA ≈ <code className="bg-white px-1 py-0.5 rounded text-brand-primary font-mono">Percentage ÷ 9.5</code>
                </p>
              </div>
            </div>
          </Card>

          {/* Results Card */}
          <Card className="lg:col-span-6 p-6 flex flex-col justify-between space-y-6 bg-gradient-to-br from-white to-slate-50">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-900">Academic Standing</h3>
                <Badge variant="outline" className="text-xs font-semibold">
                  Result Overview
                </Badge>
              </div>

              <div className="mt-6 text-center py-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Calculated Percentage
                </p>
                <div className="text-5xl font-black text-brand-primary mt-1 tracking-tight">
                  {singlePercentage.toFixed(2)}
                  <span className="text-2xl text-slate-400 font-bold ml-1">%</span>
                </div>
                <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getDivision(singlePercentage).color}">
                  {getDivision(singlePercentage).label}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-xs">
                  <p className="text-xs text-slate-500 font-medium">Marks Gap</p>
                  <p className="text-xl font-bold text-slate-900 mt-0.5">
                    {Math.max(0, maxNum - obtainedNum)}
                  </p>
                  <p className="text-[11px] text-slate-400">Marks lost from total</p>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-xs">
                  <p className="text-xs text-slate-500 font-medium">Approx. CGPA</p>
                  <p className="text-xl font-bold text-brand-primary mt-0.5">
                    {singleCgpaEq} <span className="text-xs font-normal text-slate-500">/ 10</span>
                  </p>
                  <p className="text-[11px] text-slate-400">9.5x scale benchmark</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600">
              <span className="font-semibold text-slate-900">Placement Benchmark:</span> Most Tier-1 tech companies and top campus recruitment drives require at least <strong className="text-brand-primary font-bold">60% or 65% aggregate</strong> with no active backlogs.
            </div>
          </Card>
        </div>
      )}

      {/* Mode 2: Multi-Subject Aggregator */}
      {activeTab === 'multi' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-8 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Semester Course-Wise Marks</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add all subjects to calculate overall aggregate, subject ranking, and average score.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddSubject}
                className="inline-flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Subject
              </Button>
            </div>

            <div className="space-y-3">
              {subjects.map((sub, index) => (
                <div
                  key={sub.id}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 bg-slate-50/70 rounded-xl border border-slate-200/70 hover:border-slate-300 transition-colors"
                >
                  <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={sub.name}
                      onChange={(e) => handleUpdateSubject(sub.id, 'name', e.target.value)}
                      placeholder="Course name"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24">
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max={sub.max || 100}
                          value={sub.obtained}
                          onChange={(e) => handleUpdateSubject(sub.id, 'obtained', e.target.value)}
                          placeholder="Obt"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-primary text-right pr-6"
                        />
                        <span className="absolute right-2 top-1.5 text-[10px] text-slate-400">pts</span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 font-semibold">/</span>
                    <div className="w-20">
                      <input
                        type="number"
                        min="1"
                        value={sub.max}
                        onChange={(e) => handleUpdateSubject(sub.id, 'max', e.target.value)}
                        placeholder="Max"
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-primary text-center"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubject(sub.id)}
                      disabled={subjects.length <= 1}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                      title="Remove subject"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Aggregator Results */}
          <Card className="lg:col-span-4 p-6 space-y-6 flex flex-col justify-between bg-gradient-to-br from-white to-slate-50">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Total Aggregate</h3>
                <span className="text-xs font-semibold text-slate-500">
                  {subjects.length} Subjects
                </span>
              </div>

              <div className="mt-6 text-center py-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Overall Aggregate
                </p>
                <div className="text-4xl font-black text-brand-primary mt-1">
                  {multiPercentage.toFixed(2)}
                  <span className="text-xl text-slate-400 font-bold ml-1">%</span>
                </div>
                <p className="text-xs font-medium text-slate-600 mt-2">
                  {totalSubObtained} / {totalSubMax} Marks Total
                </p>
              </div>

              <div className="space-y-3 mt-6">
                <div className="p-3 bg-white rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Subject Average:</span>
                  <span className="font-bold text-slate-800">{multiAverage.toFixed(1)} / subject</span>
                </div>

                {bestSubject && (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-xs flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-emerald-800">Top Performing Subject</p>
                      <p className="text-[11px] text-emerald-600 truncate max-w-[160px]">{bestSubject.name}</p>
                    </div>
                    <span className="font-bold text-emerald-700">
                      {(((bestSubject.obtained || 0) / (bestSubject.max || 1)) * 100).toFixed(0)}%
                    </span>
                  </div>
                )}

                {lowestSubject && (
                  <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl text-xs flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-amber-800">Focus Subject</p>
                      <p className="text-[11px] text-amber-600 truncate max-w-[160px]">{lowestSubject.name}</p>
                    </div>
                    <span className="font-bold text-amber-700">
                      {(((lowestSubject.obtained || 0) / (lowestSubject.max || 1)) * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSubjects([
                  { id: '1', name: 'Subject 1', obtained: 80, max: 100 },
                  { id: '2', name: 'Subject 2', obtained: 75, max: 100 },
                  { id: '3', name: 'Subject 3', obtained: 85, max: 100 },
                  { id: '4', name: 'Subject 4', obtained: 70, max: 100 },
                ]);
              }}
              className="w-full text-xs text-slate-500 hover:text-slate-700"
            >
              Reset Subjects
            </Button>
          </Card>
        </div>
      )}

      {/* Mode 3: Target Marks Planner */}
      {activeTab === 'target' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-6 p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">End-Semester Target Finder</h3>
              <p className="text-xs text-slate-500 mt-1">
                Determine the exact marks needed in your upcoming external / final exam to secure your targeted percentage or grade.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Internal Obtained
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={internalMax}
                    value={internalObtained}
                    onChange={(e) => setInternalObtained(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    placeholder="e.g. 34"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Internal Max
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={internalMax}
                    onChange={(e) => setInternalMax(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    placeholder="e.g. 40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  End-Sem / External Max Marks
                </label>
                <input
                  type="number"
                  min="1"
                  value={externalMax}
                  onChange={(e) => setExternalMax(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  placeholder="e.g. 60 or 100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Target Course Percentage
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="40"
                    max="100"
                    value={targetPercent}
                    onChange={(e) => setTargetPercent(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    placeholder="e.g. 80"
                  />
                  <span className="absolute right-3.5 top-2 text-xs font-bold text-slate-400">%</span>
                </div>
              </div>

              {/* Quick Target Presets */}
              <div className="flex flex-wrap gap-2 pt-1">
                {['60', '70', '75', '80', '85', '90'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTargetPercent(preset)}
                    className={`px-3 py-1 text-xs rounded-md border font-medium transition-colors ${
                      targetPercent === preset
                        ? 'bg-brand-primary text-white border-brand-primary'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Target {preset}%
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Target Result */}
          <Card className="lg:col-span-6 p-6 space-y-6 flex flex-col justify-between bg-gradient-to-br from-white to-slate-50">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Required Exam Score</h3>
                <Badge
                  variant={isTargetAchievable ? 'success' : 'danger'}
                  className="text-xs font-semibold"
                >
                  {isTargetAchievable ? 'Achievable' : 'Target Exceeds Max Marks'}
                </Badge>
              </div>

              <div className="mt-6 text-center py-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Marks Needed in End-Semester
                </p>
                <div className="text-5xl font-black text-brand-primary mt-1">
                  {Math.max(0, externalMarksNeeded)}
                  <span className="text-2xl text-slate-400 font-bold ml-1">/ {extMx}</span>
                </div>
                <p className="text-xs font-medium text-slate-600 mt-2">
                  Need to score at least <strong className="text-slate-900 font-bold">{externalNeededPct}%</strong> in the final examination.
                </p>
              </div>

              <div className="mt-6 p-4 rounded-xl border space-y-2 text-xs ${
                isTargetAchievable ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-red-50/60 border-red-200 text-red-900'
              }">
                {isTargetAchievable ? (
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p>
                      Scoring <strong>{Math.max(0, externalMarksNeeded)} out of {extMx}</strong> will bring your combined total to <strong>{totalMarksNeeded} out of {totalCourseMax}</strong>, successfully securing your <strong>{tgtPct}%</strong> goal.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <p>
                      Even with full 100% marks ({extMx}/{extMx}) in the end-sem, your maximum possible score is <strong>{intObt + extMx} out of {totalCourseMax} ({(((intObt + extMx) / totalCourseMax) * 100).toFixed(1)}%)</strong>. Consider setting a target of {Math.floor(((intObt + extMx) / totalCourseMax) * 100)}%.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-500 border border-slate-200/60">
              💡 Tip: Prioritize scoring high in internal quizzes and continuous assessments early in the semester to reduce end-sem stress.
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
