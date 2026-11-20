import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  BrainCircuit,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  FileText,
  Download,
  Layers,
  Award,
  ChevronRight,
  ShieldCheck,
  Send,
  Lock,
} from 'lucide-react';
import { Badge } from '@/components/common';

export default function HeroProductPreview() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Student Dashboard', icon: LayoutDashboard },
    { id: 'placement', label: 'Placement Preparation', icon: BookOpen },
    { id: 'skills', label: 'Skill Intelligence', icon: BrainCircuit },
    { id: 'ats', label: 'ATS Resume Match', icon: Sparkles },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto rounded-3xl border border-slate-200/90 bg-white shadow-2xl overflow-hidden transition-all duration-300">
      {/* Window Titlebar */}
      <div className="bg-slate-900 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 text-slate-300">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/90 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/90 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/90 inline-block" />
          </div>
          <span className="text-xs font-semibold text-slate-400 pl-2 hidden sm:inline">
            aspirepath.platform / workspace-preview
          </span>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  active
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="p-5 sm:p-8 bg-slate-50/50">
        {/* 1. STUDENT DASHBOARD PREVIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header / Greeting Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-black text-lg shadow-sm">
                  PS
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900">Priya Sharma</h3>
                    <Badge variant="cyan" size="sm">Final Year CSE</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Target Role: Python Developer • Campus Placement Batch 2027
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Readiness Score
                  </span>
                  <span className="text-xl font-extrabold text-blue-600 font-display">88%</span>
                </div>
                <div className="w-10 h-10 rounded-full border-4 border-blue-500 border-t-cyan-400 flex items-center justify-center text-[11px] font-extrabold text-slate-800">
                  88
                </div>
              </div>
            </div>

            {/* 4 Metric Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Showcase Projects
                </span>
                <p className="text-2xl font-extrabold text-slate-900">3</p>
                <span className="text-[11px] text-emerald-600 font-medium">✓ 2 Verified Blueprints</span>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Role Match Score
                </span>
                <p className="text-2xl font-extrabold text-blue-600">84%</p>
                <span className="text-[11px] text-blue-600 font-medium">Python Developer Track</span>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Verified Skills
                </span>
                <p className="text-2xl font-extrabold text-slate-900">14</p>
                <span className="text-[11px] text-slate-500 font-medium">Parsed from Resume</span>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Placement Guides
                </span>
                <p className="text-2xl font-extrabold text-emerald-600">4</p>
                <span className="text-[11px] text-emerald-600 font-medium">Downloaded & Practiced</span>
              </div>
            </div>

            {/* Action Bar Recommendation */}
            <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-blue-950 font-medium">
                <Award className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Recommended Action: Review the <strong>Python Exception Handling & OOP</strong> interview questions guide to reach 90%+ readiness.</span>
              </div>
              <Link to="/features/placement-preparation" className="shrink-0 font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1">
                <span>Open Prep Track</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* 2. PLACEMENT PREPARATION PREVIEW */}
        {activeTab === 'placement' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  Placement Preparation Center
                </span>
                <h4 className="text-base font-bold text-slate-900 mt-2">
                  Python Developer Technical Interview Track
                </h4>
              </div>
              <Link to="/features/placement-preparation" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                <span>View Full Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Authentic Card Design Replicating User Screenshot */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-red-50 text-red-600 font-bold text-xs">
                    PDF
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold text-[11px]">
                      Interview Questions
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium text-[11px]">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Verified Guide</span>
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900">Python concepts</h3>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400 font-mono truncate">
                    <FileText className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">AspirePath_Python_Developer_Interview_Questions.pdf</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Comprehensive technical question banks, interview frameworks, and domain preparation notes.
                </p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>509.8 KB</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>4 pages</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                    <span>148 downloads</span>
                  </span>
                </div>

                <Link to="/features/placement-preparation" className="block pt-2">
                  <button
                    type="button"
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF Guide</span>
                  </button>
                </Link>
              </div>

              {/* Second Card: OOP Concepts */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-red-50 text-red-600 font-bold text-xs">
                    PDF
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold text-[11px]">
                      OOP Concepts
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium text-[11px]">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Verified Guide</span>
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900">Python OOPs Concepts</h3>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400 font-mono truncate">
                    <FileText className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">AspirePath_Python_OOPs_Theory_Questions_and_Answers.pdf</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Deep dive into classes, encapsulation, inheritance patterns, polymorphism, abstract base classes, and dunder methods.
                </p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>1.3 MB</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>6 pages</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                    <span>210 downloads</span>
                  </span>
                </div>

                <Link to="/features/placement-preparation" className="block pt-2">
                  <button
                    type="button"
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF Guide</span>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 3. SKILL INTELLIGENCE PREVIEW */}
        {activeTab === 'skills' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Benchmarked Engineering Track
                  </span>
                  <h4 className="text-lg font-bold text-slate-900">Python Developer Track</h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-extrabold text-blue-600 font-display">84%</span>
                  <Badge variant="approved">Advanced Student Fit</Badge>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>Mathematical Competency Alignment</span>
                  <span>84% Complete</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-cyan-500 h-full rounded-full w-[84%]" />
                </div>
              </div>

              {/* Two columns: Extracted vs Gaps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-emerald-50/60 border border-emerald-200/70 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Confirmed Skills (8)</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['Python 3', 'FastAPI', 'PostgreSQL', 'SQL Queries', 'REST APIs', 'Git', 'OOP Patterns', 'Exception Handling'].map((sk) => (
                      <span key={sk} className="text-[11px] px-2 py-0.5 rounded-md bg-white border border-emerald-200 text-emerald-800 font-medium">
                        ✓ {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-amber-50/60 border border-amber-200/70 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Recommended Milestones (2)</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-xs text-amber-950 font-medium bg-white p-2 rounded-lg border border-amber-200">
                      • Docker & Containerized Python Deployment
                    </div>
                    <div className="text-xs text-amber-950 font-medium bg-white p-2 rounded-lg border border-amber-200">
                      • Redis Caching & Background Task Queues
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. ATS RESUME ANALYZER PREVIEW */}
        {activeTab === 'ats' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Target Job Description Match
                  </span>
                  <h4 className="text-lg font-bold text-slate-900">Software Engineer (Backend) — Campus Placement</h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-extrabold text-blue-600 font-display">86%</span>
                  <Badge variant="cyan">High Interview Likelihood</Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Matched Keywords</span>
                  <p className="text-xl font-bold text-emerald-600 mt-1">18 / 21</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Formatting Score</span>
                  <p className="text-xl font-bold text-blue-600 mt-1">100% ATS Safe</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Experience Impact</span>
                  <p className="text-xl font-bold text-indigo-600 mt-1">Strong Metrics</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-2">
                <div className="font-bold text-slate-800">ATS Optimization Suggestions:</div>
                <p className="text-slate-600 leading-relaxed">
                  Your project descriptions clearly demonstrate full-stack API development. To maximize ranking in applicant tracking systems, add specific metrics (e.g., query latency reductions or database schema size) to your bullet points.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview Footer Callout */}
      <div className="px-6 py-4 bg-white border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Interactive preview based on authentic student metrics and placement guides.</span>
        </div>
        <Link
          to="/register"
          className="font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
        >
          <span>Create Free Account to Explore Live</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
