import React, { useState, useId } from 'react';
import {
  GraduationCap,
  Plus,
  Trash2,
  TrendingUp,
  RotateCcw,
  Sparkles,
  Calculator,
  Target,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button, Card, Badge } from '@/components/common';

const GRADE_POINTS = [
  { grade: 'O (Outstanding)', point: 10 },
  { grade: 'A+ (Excellent)', point: 9 },
  { grade: 'A (Very Good)', point: 8 },
  { grade: 'B+ (Good)', point: 7 },
  { grade: 'B (Above Average)', point: 6 },
  { grade: 'C (Average)', point: 5 },
  { grade: 'P (Pass)', point: 4 },
  { grade: 'F (Fail)', point: 0 },
];

export default function CgpaCalculator() {
  const [activeTab, setActiveTab] = useState('sgpa'); // 'sgpa' | 'cgpa_planner'
  const currentCgpaInputId = useId();
  const completedSemsInputId = useId();
  const targetCgpaInputId = useId();
  const totalSemsInputId = useId();

  // Mode 1: SGPA Courses State
  const [courses, setCourses] = useState([
    { id: 1, name: 'Data Structures & Algorithms', credits: 4, gradePoint: 9 },
    { id: 2, name: 'Database Management Systems', credits: 4, gradePoint: 8 },
    { id: 3, name: 'Computer Networks', credits: 3, gradePoint: 8 },
    { id: 4, name: 'Operating Systems', credits: 3, gradePoint: 9 },
    { id: 5, name: 'Web Technology Lab', credits: 2, gradePoint: 10 },
  ]);

  // Mode 2: CGPA & Target Planner State
  const [currentCgpa, setCurrentCgpa] = useState(7.8);
  const [completedSems, setCompletedSems] = useState(4);
  const [targetCgpa, setTargetCgpa] = useState(8.5);
  const [totalSems, setTotalSems] = useState(8);
  const [formulaMode, setFormulaMode] = useState('standard'); // 'standard' (-0.75)*10 | 'cbse' (*9.5) | 'direct' (*10)

  // SGPA Calculation
  const totalCredits = courses.reduce((sum, c) => sum + (parseFloat(c.credits) || 0), 0);
  const totalPoints = courses.reduce(
    (sum, c) => sum + (parseFloat(c.credits) || 0) * (parseFloat(c.gradePoint) || 0),
    0
  );
  const calculatedSgpa = totalCredits > 0 ? totalPoints / totalCredits : 0;

  // Percentage equivalents
  const getPercentage = (gpa) => {
    if (formulaMode === 'standard') return Math.max(0, (gpa - 0.75) * 10).toFixed(1);
    if (formulaMode === 'cbse') return Math.max(0, gpa * 9.5).toFixed(1);
    return Math.max(0, gpa * 10).toFixed(1);
  };

  // Target Planner Calculations
  const curGpa = Math.min(10, Math.max(0, parseFloat(currentCgpa) || 0));
  const compSems = Math.max(1, parseInt(completedSems, 10) || 1);
  const totSems = Math.max(compSems + 1, parseInt(totalSems, 10) || 8);
  const tgtGpa = Math.min(10, Math.max(0, parseFloat(targetCgpa) || 0));

  const remainingSems = totSems - compSems;
  // (curGpa * compSems + reqSgpa * remainingSems) / totSems = tgtGpa
  // reqSgpa * remainingSems = tgtGpa * totSems - curGpa * compSems
  const requiredSgpa =
    remainingSems > 0
      ? (tgtGpa * totSems - curGpa * compSems) / remainingSems
      : 0;

  const isTargetAchievable = requiredSgpa <= 10 && requiredSgpa >= 0;

  const handleAddCourse = () => {
    const nextId = courses.length > 0 ? Math.max(...courses.map((c) => c.id)) + 1 : 1;
    setCourses([...courses, { id: nextId, name: `Course ${nextId}`, credits: 3, gradePoint: 8 }]);
  };

  const handleRemoveCourse = (id) => {
    setCourses(courses.filter((c) => c.id !== id));
  };

  const handleCourseChange = (id, field, value) => {
    setCourses(
      courses.map((c) =>
        c.id === id ? { ...c, [field]: field === 'name' ? value : parseFloat(value) || 0 } : c
      )
    );
  };

  const handleResetCourses = () => {
    setCourses([
      { id: 1, name: 'Data Structures & Algorithms', credits: 4, gradePoint: 9 },
      { id: 2, name: 'Database Management Systems', credits: 4, gradePoint: 8 },
      { id: 3, name: 'Computer Networks', credits: 3, gradePoint: 8 },
      { id: 4, name: 'Operating Systems', credits: 3, gradePoint: 9 },
      { id: 5, name: 'Web Technology Lab', credits: 2, gradePoint: 10 },
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('sgpa')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'sgpa'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Semester SGPA Calculator</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('cgpa_planner')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'cgpa_planner'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Target CGPA & Degree Planner</span>
        </button>
      </div>

      {activeTab === 'sgpa' ? (
        /* ================= SGPA CALCULATOR ================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            <Card className="p-6 border-slate-200 shadow-card bg-white space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Course-Wise Grades</h4>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleResetCourses} leftIcon={RotateCcw}>
                    Reset
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleAddCourse} leftIcon={Plus}>
                    Add Course
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {courses.map((course, idx) => (
                  <div
                    key={course.id}
                    className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                  >
                    <div className="sm:col-span-6">
                      <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                        Course {idx + 1}
                      </label>
                      <input
                        type="text"
                        value={course.name}
                        onChange={(e) => handleCourseChange(course.id, 'name', e.target.value)}
                        placeholder="Subject / Lab name"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:ring-1 focus:ring-brand-primary outline-hidden bg-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-semibold text-slate-500 block mb-1">Credits</label>
                      <select
                        value={course.credits}
                        onChange={(e) => handleCourseChange(course.id, 'credits', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:ring-1 focus:ring-brand-primary outline-hidden bg-white"
                      >
                        {[1, 1.5, 2, 3, 4, 5].map((cr) => (
                          <option key={cr} value={cr}>
                            {cr} Cr
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <label className="text-[10px] font-semibold text-slate-500 block mb-1">Grade</label>
                      <select
                        value={course.gradePoint}
                        onChange={(e) => handleCourseChange(course.id, 'gradePoint', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:ring-1 focus:ring-brand-primary outline-hidden bg-white"
                      >
                        {GRADE_POINTS.map((g) => (
                          <option key={g.grade} value={g.point}>
                            {g.grade} ({g.point} pts)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-1 flex justify-end sm:pt-4">
                      {courses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCourse(course.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                          title="Remove course"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* SGPA Summary Right Column */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="p-6 border-blue-200 shadow-card bg-gradient-to-br from-blue-50/70 via-white to-cyan-50/50 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Semester SGPA</span>
                <Badge variant="primary" size="sm">
                  10-Point Scale
                </Badge>
              </div>

              <div>
                <span className="text-5xl font-extrabold font-display text-brand-primary">
                  {calculatedSgpa.toFixed(2)}
                </span>
                <span className="text-xs font-medium text-slate-500 block mt-1">
                  Equivalent to ~{getPercentage(calculatedSgpa)}% marks
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">Total Credits:</span>
                  <span className="font-bold text-slate-900">{totalCredits}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">Total Quality Points:</span>
                  <span className="font-bold text-slate-900">{totalPoints.toFixed(1)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">Academic Standing:</span>
                  <span className="font-bold text-emerald-700">
                    {calculatedSgpa >= 8.5
                      ? 'First Class with Distinction'
                      : calculatedSgpa >= 6.5
                      ? 'First Class'
                      : 'Second Class'}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        /* ================= CGPA TARGET PLANNER ================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <Card className="p-6 border-slate-200 shadow-card bg-white space-y-5">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Academic Standing & Target</h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor={currentCgpaInputId} className="text-xs font-semibold text-slate-700">Current CGPA</label>
                  <input
                    id={currentCgpaInputId}
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={currentCgpa}
                    onChange={(e) => setCurrentCgpa(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor={completedSemsInputId} className="text-xs font-semibold text-slate-700">Completed Semesters</label>
                  <input
                    id={completedSemsInputId}
                    type="number"
                    min="1"
                    max="7"
                    value={completedSems}
                    onChange={(e) => setCompletedSems(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor={targetCgpaInputId} className="text-xs font-semibold text-slate-700">Target Graduation CGPA</label>
                  <input
                    id={targetCgpaInputId}
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={targetCgpa}
                    onChange={(e) => setTargetCgpa(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor={totalSemsInputId} className="text-xs font-semibold text-slate-700">Total Program Semesters</label>
                  <input
                    id={totalSemsInputId}
                    type="number"
                    min="2"
                    max="10"
                    value={totalSems}
                    onChange={(e) => setTotalSems(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-hidden"
                  />
                </div>
              </div>

              {/* Formula Mode Toggle */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="text-xs font-semibold text-slate-700">Percentage Formula</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormulaMode('standard')}
                    className={`p-2 text-[11px] font-bold rounded-xl border transition-colors ${
                      formulaMode === 'standard'
                        ? 'bg-brand-veryLight border-brand-primary text-brand-primary'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    (CGPA - 0.75) × 10
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormulaMode('cbse')}
                    className={`p-2 text-[11px] font-bold rounded-xl border transition-colors ${
                      formulaMode === 'cbse'
                        ? 'bg-brand-veryLight border-brand-primary text-brand-primary'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    CGPA × 9.5
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormulaMode('direct')}
                    className={`p-2 text-[11px] font-bold rounded-xl border transition-colors ${
                      formulaMode === 'direct'
                        ? 'bg-brand-veryLight border-brand-primary text-brand-primary'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    CGPA × 10
                  </button>
                </div>
              </div>
            </Card>
          </div>

          {/* Target Planning Result */}
          <div className="lg:col-span-6 space-y-4">
            <Card
              className={`p-6 border ${
                isTargetAchievable ? 'border-emerald-200 bg-emerald-50/40' : 'border-rose-200 bg-rose-50/40'
              } shadow-card space-y-5`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Required Performance</span>
                <Badge variant={isTargetAchievable ? 'success' : 'danger'} size="sm">
                  {isTargetAchievable ? 'Mathematically Achievable' : 'Beyond 10.0 Maximum'}
                </Badge>
              </div>

              <div>
                <span
                  className={`text-4xl sm:text-5xl font-extrabold font-display ${
                    isTargetAchievable ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {isTargetAchievable ? requiredSgpa.toFixed(2) : '> 10.0'}
                </span>
                <span className="text-xs font-medium text-slate-600 block mt-1">
                  Required average SGPA across the remaining <strong>{remainingSems}</strong> semesters
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200/90 text-xs space-y-2">
                {isTargetAchievable ? (
                  <div className="flex items-start gap-2.5 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                    <span>
                      To achieve your target of <strong>{tgtGpa} CGPA</strong>, you must score an average of at least{' '}
                      <strong>{requiredSgpa.toFixed(2)} SGPA</strong> in each of your upcoming {remainingSems} semesters.
                    </span>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5 text-rose-800">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <span>
                      Reaching {tgtGpa} CGPA is mathematically not possible within the remaining {remainingSems} semesters, as it exceeds the 10.0 cap. Maximum achievable CGPA is{' '}
                      <strong>{(((curGpa * compSems) + (10 * remainingSems)) / totSems).toFixed(2)}</strong>.
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
