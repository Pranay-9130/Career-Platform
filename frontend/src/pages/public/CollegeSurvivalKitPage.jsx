import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CalendarCheck2,
  GraduationCap,
  Briefcase,
  IndianRupee,
  Percent,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import SEO from '@/components/common/SEO';
import AttendanceCalculator from '@/components/survivalKit/AttendanceCalculator';
import CgpaCalculator from '@/components/survivalKit/CgpaCalculator';
import PlacementEligibilityChecker from '@/components/survivalKit/PlacementEligibilityChecker';
import SalaryCalculator from '@/components/survivalKit/SalaryCalculator';
import MarksCalculator from '@/components/survivalKit/MarksCalculator';

export const SURVIVAL_TOOLS = [
  {
    id: 'attendance',
    name: 'Attendance Calculator',
    shortName: 'Attendance',
    tagline: 'Track attendance, safe leaves, and recovery classes to stay above the 75% or 85% requirement.',
    icon: CalendarCheck2,
    badge: 'Essential',
    color: 'emerald',
    component: AttendanceCalculator,
  },
  {
    id: 'cgpa',
    name: 'CGPA / SGPA Calculator',
    shortName: 'CGPA / SGPA',
    tagline: 'Calculate semester SGPA with custom course credits and plan future targets to boost your CGPA.',
    icon: GraduationCap,
    badge: 'Academic',
    color: 'blue',
    component: CgpaCalculator,
  },
  {
    id: 'placement-eligibility',
    name: 'Placement Eligibility Checker',
    shortName: 'Placement Eligibility',
    tagline: 'Instantly check your eligibility criteria for Product Giants, FinTech, and Mass Recruiters.',
    icon: Briefcase,
    badge: 'Career',
    color: 'indigo',
    component: PlacementEligibilityChecker,
  },
  {
    id: 'salary',
    name: 'CTC to In-Hand Salary',
    shortName: 'In-Hand Salary',
    tagline: 'Break down your campus placement CTC offer into actual monthly take-home, PF, and tax deductions.',
    icon: IndianRupee,
    badge: 'Offer Letter',
    color: 'amber',
    component: SalaryCalculator,
  },
  {
    id: 'marks',
    name: 'Marks & Percentage Calculator',
    shortName: 'Marks & Percentage',
    tagline: 'Convert marks to percentage, aggregate multiple subjects, and calculate required end-sem scores.',
    icon: Percent,
    badge: 'Exam Prep',
    color: 'cyan',
    component: MarksCalculator,
  },
];

export default function CollegeSurvivalKitPage() {
  const { toolId } = useParams();
  const navigate = useNavigate();

  // Determine active tool or default to attendance
  const activeTool = useMemo(() => {
    if (!toolId) return SURVIVAL_TOOLS[0];
    const match = SURVIVAL_TOOLS.find((t) => t.id === toolId.toLowerCase());
    return match || SURVIVAL_TOOLS[0];
  }, [toolId]);

  // Synchronize URL if invalid toolId was provided
  useEffect(() => {
    if (toolId && !SURVIVAL_TOOLS.some((t) => t.id === toolId.toLowerCase())) {
      navigate('/college-survival-kit/attendance', { replace: true });
    }
  }, [toolId, navigate]);

  const handleSelectTool = (id) => {
    navigate(`/college-survival-kit/${id}`);
  };

  const ActiveComponent = activeTool.component;

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <SEO
        title={`${activeTool.name} – College Survival Kit | AspirePath`}
        description={activeTool.tagline}
        keywords="college survival kit, attendance calculator, cgpa calculator, sgpa calculator, placement eligibility checker, in hand salary calculator, marks to percentage"
      />

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link to="/" className="hover:text-brand-primary transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link to="/features/college-survival-kit" className="hover:text-brand-primary transition-colors">
            College Survival Kit
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-semibold">{activeTool.shortName}</span>
        </div>

        {/* Main Header */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold text-brand-primary">
                <Sparkles className="w-3.5 h-3.5" />
                <span>College Survival Kit</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-600 font-normal">Your college life, simplified.</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {activeTool.name}
              </h1>
              <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
                {activeTool.tagline}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/features/college-survival-kit"
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                Overview & Features
              </Link>
            </div>
          </div>

          {/* Tool Switcher Tabs Bar */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {SURVIVAL_TOOLS.map((tool) => {
                const IconComponent = tool.icon;
                const isSelected = tool.id === activeTool.id;

                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => handleSelectTool(tool.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'bg-blue-50/80 border-brand-primary/40 text-brand-primary shadow-xs font-semibold'
                        : 'bg-white hover:bg-slate-50 border-slate-200/70 text-slate-700 font-medium'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-brand-primary text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs truncate">{tool.shortName}</p>
                      <span className="text-[10px] text-slate-400 font-normal block truncate">
                        {tool.badge}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Active Calculator Component Canvas */}
        <div className="transition-all duration-200">
          <ActiveComponent />
        </div>

        {/* Bottom Quick Advice / Privacy Assurance */}
        <div className="rounded-xl p-4 bg-white border border-slate-200/70 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>100% Client-Side Calculations. Your academic details and salary queries are never stored or tracked.</span>
          </div>
          <Link
            to="/college-survival-kit"
            className="text-brand-primary hover:underline font-semibold shrink-0"
          >
            Explore all 5 tools
          </Link>
        </div>
      </div>
    </div>
  );
}
