import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BrainCircuit,
  Target,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Code2,
  Layers,
  Award,
  Sliders,
  TrendingUp,
  ShieldCheck,
  Check,
  Lock,
  Info,
} from 'lucide-react';
import { Button, Card, Badge } from '@/components/common';
import { useAuth } from '@/context/AuthContext';
import SEO from '@/components/common/SEO';
import { getBreadcrumbListSchema } from '@/utils/seoSchemas';

const SAMPLE_ROLES = [
  {
    title: 'Frontend Developer',
    matchScore: 78,
    level: 'Advanced Student',
    levelClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    extractedSkills: ['React.js', 'JavaScript (ES6+)', 'HTML5 & CSS3', 'Tailwind CSS', 'Git & GitHub', 'RESTful APIs'],
    prerequisites: ['TypeScript', 'State Management (Redux/Zustand)'],
    nextMilestones: ['Unit Testing (Jest/RTL)', 'Next.js & SSR', 'Performance Optimization'],
    recommendation: 'Priority 1: Learn TypeScript to unlock 80%+ of modern frontend engineering positions.',
  },
  {
    title: 'Full Stack Developer',
    matchScore: 68,
    level: 'Intermediate Fit',
    levelClass: 'bg-blue-50 text-brand-primary border-blue-200',
    extractedSkills: ['React.js', 'Node.js', 'Express.js', 'MongoDB', 'JavaScript', 'Git'],
    prerequisites: ['PostgreSQL & SQL Schema Design', 'Authentication & JWT Best Practices'],
    nextMilestones: ['Docker Containerization', 'Cloud Deployment (AWS/GCP)', 'API Integration Testing'],
    recommendation: 'Priority 1: Strengthen relational database skills (PostgreSQL) alongside current NoSQL knowledge.',
  },
  {
    title: 'Data Analyst',
    matchScore: 62,
    level: 'Developing Competency',
    levelClass: 'bg-amber-50 text-amber-700 border-amber-200',
    extractedSkills: ['Python Basics', 'Pandas', 'Excel / Spreadsheets', 'Data Cleaning', 'Matplotlib'],
    prerequisites: ['Advanced SQL Queries & Window Functions', 'Business Intelligence (PowerBI / Tableau)'],
    nextMilestones: ['Statistical Modeling', 'Exploratory Data Analysis', 'Automated ETL Pipelines'],
    recommendation: 'Priority 1: Master complex SQL multi-table joins, CTEs, and window functions.',
  },
  {
    title: 'Machine Learning Engineer',
    matchScore: 54,
    level: 'Foundational Baseline',
    levelClass: 'bg-purple-50 text-purple-700 border-purple-200',
    extractedSkills: ['Python', 'NumPy', 'Scikit-Learn', 'Linear Algebra Basics', 'Jupyter Notebooks'],
    prerequisites: ['PyTorch or TensorFlow', 'Model Evaluation & Validation Metrics'],
    nextMilestones: ['MLOps & Pipeline Deployment', 'Feature Engineering at Scale', 'Vector Databases'],
    recommendation: 'Priority 1: Complete end-to-end model training in PyTorch and publish code to GitHub.',
  },
];

export default function PublicSkillIntelligencePage() {
  const { isAuthenticated } = useAuth();
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);

  const currentRole = SAMPLE_ROLES[selectedRoleIndex];

  const workflowSteps = [
    {
      step: '01',
      title: 'Automated Skill Extraction',
      desc: 'Our deterministic parsing engine extracts verified technical competencies, languages, frameworks, and tools directly from your student resume.',
    },
    {
      step: '02',
      title: 'Standard Role Benchmarking',
      desc: 'Benchmark your current profile against 13 industry-standard roles, from Frontend and Full Stack to Cloud, DevOps, and Machine Learning.',
    },
    {
      step: '03',
      title: 'Deterministic Match Scoring',
      desc: 'Transparent mathematical formulas calculate your percentage role fit without guessing, clearly separating core prerequisites from optional tools.',
    },
    {
      step: '04',
      title: 'Curated Learning Roadmaps',
      desc: 'Receive ordered, step-by-step milestones linking to official documentation and practical project blueprints to bridge every gap.',
    },
  ];

  return (
    <div className="space-y-20 pb-24 overflow-hidden">
      <SEO
        title="Skill Intelligence & Role Benchmarking | AspirePath"
        description="Extract skills from your resume, identify critical skill gaps, and benchmark your suitability across 13 engineering disciplines with transparent mathematical scoring."
        canonical="/features/skill-intelligence"
        schema={[getBreadcrumbListSchema([
          { name: 'Home', item: '/' },
          { name: 'Features', item: '/features/skill-intelligence' },
          { name: 'Skill Intelligence', item: '/features/skill-intelligence' },
        ])]}
      />

      {/* Hero Header */}
      <section className="relative pt-10 sm:pt-16 lg:pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[320px] bg-gradient-to-tr from-cyan-200/40 via-blue-100/30 to-transparent blur-3xl pointer-events-none -z-10 rounded-full" />

        <div className="text-center max-w-3xl mx-auto">
          <Badge variant="cyan" size="sm" className="mb-4">
            <BrainCircuit className="w-3.5 h-3.5 mr-1 text-brand-cyan animate-pulse" />
            Deterministic Competency Engine
          </Badge>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-extrabold text-brand-text tracking-tight leading-[1.15]">
            Skill Intelligence
          </h1>

          <p className="mt-5 text-base sm:text-xl text-brand-muted leading-relaxed">
            Extract skills from your resume, identify critical knowledge gaps, and understand your suitability for target engineering roles through transparent mathematical evaluation.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link to="/skill-intelligence">
                <Button size="lg" variant="gradient" rightIcon={ArrowRight} className="font-bold px-8 shadow-card">
                  Open Skill Intelligence
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register?redirect=/skill-intelligence">
                  <Button size="lg" variant="gradient" rightIcon={ArrowRight} className="font-bold px-8 shadow-card">
                    Get Started Free
                  </Button>
                </Link>
                <Link to="/login?redirect=/skill-intelligence">
                  <Button size="lg" variant="outline" className="font-semibold px-6 bg-white">
                    Sign In to Assess Skills
                  </Button>
                </Link>
              </>
            )}
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-brand-muted">
            <ShieldCheck className="w-4 h-4 text-brand-primary" />
            <span>Deterministic algorithms • No hallucinated match percentages • 13 Standard Disciplines</span>
          </div>
        </div>
      </section>

      {/* Interactive Demonstration Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-brand-border shadow-card overflow-hidden">
          {/* Top Bar */}
          <div className="bg-slate-50 border-b border-brand-border px-6 py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse" />
              <span>Interactive Role Benchmark Simulation</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-[11px] font-bold text-cyan-800">
              <Info className="w-3.5 h-3.5" />
              <span>Sample Demonstration</span>
            </div>
          </div>

          <div className="p-6 sm:p-10 space-y-8">
            {/* Target Role Selector Tabs */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                Select a Target Discipline to Preview:
              </label>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_ROLES.map((role, idx) => {
                  const active = selectedRoleIndex === idx;
                  return (
                    <button
                      key={role.title}
                      type="button"
                      onClick={() => setSelectedRoleIndex(idx)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        active
                          ? 'bg-brand-primary text-white shadow-card scale-102'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <Target className="w-3.5 h-3.5" />
                      <span>{role.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Role Fit Gauge & Breakdown Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Role Fit Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-50/70 via-white to-blue-50/50 border border-brand-border flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-muted">
                    Role Match Score
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${currentRole.levelClass}`}>
                    {currentRole.level}
                  </span>
                </div>

                <div className="flex items-baseline gap-3 my-2">
                  <span className="text-5xl font-display font-extrabold text-brand-text">
                    {currentRole.matchScore}%
                  </span>
                  <span className="text-xs font-bold text-slate-400">Match Readiness</span>
                </div>

                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-brand-cyan to-brand-primary h-full rounded-full transition-all duration-300"
                    style={{ width: `${currentRole.matchScore}%` }}
                  />
                </div>

                <p className="text-xs text-brand-muted leading-relaxed">
                  Based on verified resume skills compared against core criteria for {currentRole.title}.
                </p>
              </div>

              {/* Confirmed Skills in Profile */}
              <div className="p-6 rounded-2xl bg-white border border-brand-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Confirmed Skills ({currentRole.extractedSkills.length})
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Extracted
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {currentRole.extractedSkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800"
                    >
                      <Check className="w-3 h-3 text-emerald-600" />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Critical Gap Checklist */}
              <div className="p-6 rounded-2xl bg-white border border-brand-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Critical Prerequisites
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    Action Needed
                  </span>
                </div>

                <div className="space-y-2 pt-1">
                  {currentRole.prerequisites.map((gap, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-amber-50/60 border border-amber-200/70 text-xs font-semibold text-amber-900">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span>{gap}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Structured Next Milestones & Priority Action */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-primary" />
                <h3 className="text-xs font-bold text-brand-text uppercase tracking-wider">
                  Deterministic Priority Recommendation
                </h3>
              </div>
              <p className="text-xs text-brand-text font-medium leading-relaxed">
                {currentRole.recommendation}
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500">Subsequent Milestones:</span>
                {currentRole.nextMilestones.map((milestone) => (
                  <span key={milestone} className="text-xs px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-medium">
                    {milestone}
                  </span>
                ))}
              </div>
            </div>

            {/* Authenticated Callout Box */}
            <div className="rounded-2xl bg-brand-veryLight border border-brand-border p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white text-brand-primary border border-brand-border flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 text-brand-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-brand-text">
                    Benchmark your personal resume competencies
                  </h4>
                  <p className="text-xs text-brand-muted">
                    Authenticate to scan your actual resume, customize your tracked career role, and mark competencies as completed.
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-3 w-full sm:w-auto">
                <Link to="/register?redirect=/skill-intelligence" className="w-full sm:w-auto">
                  <Button variant="gradient" size="sm" rightIcon={ArrowRight} className="w-full sm:w-auto font-bold px-6">
                    Assess My Skills Free
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="cyan" size="sm" className="mb-2">
            Mathematical Precision
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-brand-text">
            How Skill Intelligence Operates
          </h2>
          <p className="mt-2 text-sm text-brand-muted">
            Eliminating guesswork with transparent formulas grounded in industry engineering requirements.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {workflowSteps.map((step) => (
            <Card key={step.step} className="p-6 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-50 text-brand-cyan border border-cyan-200 font-bold text-xs flex items-center justify-center">
                {step.step}
              </div>
              <h3 className="font-bold text-base text-brand-text">{step.title}</h3>
              <p className="text-xs text-brand-muted leading-relaxed">{step.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-brand-primary to-cyan-600 p-8 sm:p-12 text-center text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-5">
            <h2 className="text-2xl sm:text-4xl font-display font-extrabold">
              Discover Your Engineering Role Fit Today
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              Find out exactly what technical skills you need to build next before applying to competitive entry-level openings.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <Link to="/register?redirect=/skill-intelligence">
                <Button size="lg" variant="white" className="!bg-white !text-blue-700 font-bold px-8">
                  Get Started Free
                </Button>
              </Link>
              <Link to="/templates">
                <Button size="lg" variant="outline" className="text-white border-white/60 hover:bg-white/10 px-6">
                  Explore Resume Templates
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

