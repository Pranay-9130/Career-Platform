import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Code2,
  FileText,
  CheckCircle2,
  Briefcase,
  Layers,
  TrendingUp,
  BrainCircuit,
  Award,
  BookOpen,
  FolderGit2,
  Sliders,
  ShieldCheck,
  Check,
  ExternalLink,
  RefreshCw,
  Search,
  Lock,
  GraduationCap,
  CalendarCheck2,
  IndianRupee,
  Percent,
  Building,
  Target,
  Compass,
  ChevronRight,
} from 'lucide-react';
import { Button, Card, Badge, Skeleton } from '@/components/common';
import { ProjectCard, JobCard } from '@/components/cards';
import { useAuth } from '@/context/AuthContext';
import SEO from '@/components/common/SEO';
import { getWebsiteSchema, getOrganizationSchema } from '@/utils/seoSchemas';
import { getDashboardPath } from '@/utils/navigation';
import { projectService } from '@/services/projectService';
import { jobService } from '@/services/jobService';
import HeroProductPreview from '@/components/home/HeroProductPreview';

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState(null);

  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState(null);

  // Fetch initial showcases and jobs concurrently
  useEffect(() => {
    let isMounted = true;

    async function loadSection(request, key, setItems, setError, setLoading, errorMessage) {
      try {
        const data = await request();
        if (!isMounted) return;
        const items = [data, data?.items, data?.[key]].find(Array.isArray) ?? [];
        setItems(items.slice(0, 3));
      } catch (error) {
        if (!isMounted) return;
        console.warn(errorMessage, error);
        setError(errorMessage);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadSection(() => projectService.getProjects({ limit: 3 }), 'projects', setProjects, setProjectsError,
      setProjectsLoading, 'Unable to load showcase projects. Please browse the project hub directly.');
    void loadSection(() => jobService.getJobs({ limit: 3, include_facets: false }), 'jobs', setJobs, setJobsError,
      setJobsLoading, 'Unable to load current job opportunities. Please visit the jobs board directly.');

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-24 sm:space-y-32 pb-24 overflow-hidden">
      <SEO
        title="AspirePath | From Your First Project to Your First Job"
        description="The modern student career development platform. ATS resume analysis, deterministic skill benchmarking, placement interview preparation, and real project blueprints."
        canonical="/"
        schema={[getWebsiteSchema(), getOrganizationSchema()]}
      />

      {/* ========================================================================= */}
      {/* 1. HERO SECTION (MODERN SAAS AESTHETIC WITH INTERACTIVE PRODUCT PREVIEW) */}
      {/* ========================================================================= */}
      <section className="relative pt-12 sm:pt-20 lg:pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Subtle grid background pattern with radial mask */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(#93c5fd_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_20%,#000_70%,transparent_100%)] opacity-35 pointer-events-none" />

        {/* Ambient background glow orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[360px] bg-gradient-to-tr from-blue-300/30 via-cyan-200/25 to-indigo-200/20 blur-3xl pointer-events-none -z-10 rounded-full" />

        <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50/90 border border-blue-200/80 text-blue-700 text-xs font-bold uppercase tracking-wider shadow-xs backdrop-blur-xs transition-all">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
            <span>YOUR CAREER STARTS HERE</span>
          </div>

          {/* Headline featuring the Tagline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold text-slate-900 tracking-tight leading-[1.12]">
            Build Your Skills.{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent inline-block pb-1">
              Prepare for Placements.
            </span>
          </h1>

          {/* Description */}
          <p className="text-base sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-normal">
            Everything you need to prepare for placements, improve your skills, build your resume, and discover opportunities — all in one place.
          </p>

          {/* Dual CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link to={getDashboardPath(user)} className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="gradient"
                  rightIcon={ArrowRight}
                  className="w-full sm:w-auto text-base px-8 py-3.5 shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 font-bold transition-all"
                >
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/register" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="gradient"
                  rightIcon={ArrowRight}
                  className="w-full sm:w-auto text-base px-8 py-3.5 shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 font-bold transition-all"
                >
                  Get Started
                </Button>
              </Link>
            )}

            <a href="#core-features" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-base px-8 py-3.5 bg-white/90 border-slate-300 hover:border-slate-400 text-slate-700 font-semibold backdrop-blur-xs transition-all"
              >
                Explore Features
              </Button>
            </a>
          </div>

          {/* Clean Floating Feature Ribbon */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-xs">
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/90 border border-slate-200 shadow-xs text-slate-700 font-medium backdrop-blur-xs hover:border-blue-300 transition-colors">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>ATS Resume Analyzer</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/90 border border-slate-200 shadow-xs text-slate-700 font-medium backdrop-blur-xs hover:border-cyan-300 transition-colors">
              <BrainCircuit className="w-3.5 h-3.5 text-cyan-600" />
              <span>13-Role Skill Matrix</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/90 border border-slate-200 shadow-xs text-slate-700 font-medium backdrop-blur-xs hover:border-emerald-300 transition-colors">
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              <span>Placement Prep Center</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/90 border border-slate-200 shadow-xs text-slate-700 font-medium backdrop-blur-xs hover:border-indigo-300 transition-colors">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>Vector PDF Resumes</span>
            </div>
          </div>
        </div>

        {/* Live Interactive Product Preview Component */}
        <div className="mt-12 sm:mt-16">
          <HeroProductPreview />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. WHY ASPIREPATH (VALUE PROPOSITION FOR STUDENTS & PLACEMENT CELLS) */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <Badge variant="cyan" size="sm" className="mb-2.5">
            Institutional & Student Excellence
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-tight">
            Why AspirePath for Engineering Careers?
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Eliminating guesswork for students and providing verifiable career readiness data for placement cells and hiring panels.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Benefit 1 */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all space-y-4">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold shadow-xs">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Deterministic Skill Scoring</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Transparent mathematical formulas evaluate your actual resume skills against standard industry criteria across 13 engineering tracks—no hallucinated match scores.
            </p>
          </div>

          {/* Benefit 2 */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all space-y-4">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Structured Placement Prep</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Curated technical interview question banks and verified downloadable PDF guides covering Python OOP, Exception Handling, Advanced Internals, and SQL.
            </p>
          </div>

          {/* Benefit 3 */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all space-y-4">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">ATS-Optimized Resumes</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Build clean, professional resumes with split-screen editing, tested ATS typography, and direct export to clean vector PDFs that parse seamlessly in hiring software.
            </p>
          </div>

          {/* Benefit 4 */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all space-y-4">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-bold shadow-xs">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Proof-of-Work Project Hub</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Publish production-ready engineering blueprints with architecture diagrams, GitHub repository links, and live demos to demonstrate practical capability.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SIX CORE PLATFORM PILLARS (COMPREHENSIVE FEATURES SHOWCASE) */}
      {/* ========================================================================= */}
      <section id="core-features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="primary" size="sm" className="mb-3">
            Platform Capabilities
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-tight">
            Six Powerful Tools for Career Preparation
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Every feature is engineered to solve a specific hurdle in college placement drives, technical screenings, and campus recruitment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Pillar 1: ATS Resume Analyzer */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1.5 hover:border-blue-300">
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500" />
            <div className="p-7 space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-brand-primary border border-blue-100 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  ATS Scoring
                </span>
              </div>

              <div>
                <h3 className="text-xl font-display font-bold text-slate-900 group-hover:text-brand-primary transition-colors">
                  ATS Resume Analyzer
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Improve your resume with actionable ATS-focused feedback.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Instant keyword gap and missing skill analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Bullet point impact & metric scoring suggestions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Single-click resume re-scan & verification</span>
                </div>
              </div>
            </div>

            <div className="px-7 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
              <Link
                to="/features/ats-analyzer"
                className="text-xs font-bold text-brand-primary flex items-center gap-1.5 group-hover:translate-x-1 transition-transform"
              >
                <span>Explore Feature Details</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Pillar 2: Resume Templates */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1.5 hover:border-indigo-300">
            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500" />
            <div className="p-7 space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Curated Formats
                </span>
              </div>

              <div>
                <h3 className="text-xl font-display font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Resume Templates
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Choose from professionally designed, ATS-ready resume templates.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>ATS-approved structural hierarchy and modern styling</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Interactive full-page PDF preview with zoom and fit controls</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Instant high-fidelity vector PDF template downloads</span>
                </div>
              </div>
            </div>

            <div className="px-7 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
              <Link
                to="/templates"
                className="text-xs font-bold text-brand-primary flex items-center gap-1.5 group-hover:translate-x-1 transition-transform"
              >
                <span>Browse Templates</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Pillar 3: Skill Intelligence */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1.5 hover:border-cyan-300">
            <div className="h-1.5 w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600" />
            <div className="p-7 space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 border border-cyan-100 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200">
                  13-Role Matrix
                </span>
              </div>

              <div>
                <h3 className="text-xl font-display font-bold text-slate-900 group-hover:text-cyan-700 transition-colors">
                  Skill Intelligence
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Understand your skills and identify areas to improve.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>13 standard roles from Frontend and AI to Cloud DevOps</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Transparent mathematical percentage role fit</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Ordered learning milestones with official documentation</span>
                </div>
              </div>
            </div>

            <div className="px-7 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
              <Link
                to="/features/skill-intelligence"
                className="text-xs font-bold text-brand-primary flex items-center gap-1.5 group-hover:translate-x-1 transition-transform"
              >
                <span>Explore Feature Details</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Pillar 4: Placement Preparation Center */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1.5 hover:border-emerald-300">
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500" />
            <div className="p-7 space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                  <BookOpen className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Interview Prep
                </span>
              </div>

              <div>
                <h3 className="text-xl font-display font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Placement Preparation
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Practice technical questions and prepare for interviews.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Python OOP concepts, GIL, and Exception Handling</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Complex SQL joins, indexing, and window functions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Authentic verified PDF guides downloadable offline</span>
                </div>
              </div>
            </div>

            <div className="px-7 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
              <Link
                to="/features/placement-preparation"
                className="text-xs font-bold text-brand-primary flex items-center gap-1.5 group-hover:translate-x-1 transition-transform"
              >
                <span>Explore Feature Details</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Pillar 5: Project Hub */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1.5 hover:border-amber-300">
            <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />
            <div className="p-7 space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                  <FolderGit2 className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  Proof of Work
                </span>
              </div>

              <div>
                <h3 className="text-xl font-display font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                  Project Hub
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Discover, create, and showcase projects.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Verified GitHub repository and demo link badges</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Curated multi-tier technical difficulty blueprints</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Direct project import into ATS resume builder</span>
                </div>
              </div>
            </div>

            <div className="px-7 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
              <Link
                to="/projects"
                className="text-xs font-bold text-brand-primary flex items-center gap-1.5 group-hover:translate-x-1 transition-transform"
              >
                <span>Browse Project Hub</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Pillar 6: Jobs & Internships */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1.5 hover:border-sky-300">
            <div className="h-1.5 w-full bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500" />
            <div className="p-7 space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                  <Briefcase className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
                  Verified Roles
                </span>
              </div>

              <div>
                <h3 className="text-xl font-display font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                  Jobs & Internships
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Explore opportunities that match your interests.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Filtered for college graduates and early career talent</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Experience-based candidate eligibility badges</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Integrated multi-stage application pipeline tracker</span>
                </div>
              </div>
            </div>

            <div className="px-7 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
              <Link
                to="/jobs"
                className="text-xs font-bold text-brand-primary flex items-center gap-1.5 group-hover:translate-x-1 transition-transform"
              >
                <span>Explore Opportunities</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3.5 COLLEGE SURVIVAL KIT (ACADEMIC & CAREER CALCULATORS) */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-b from-blue-50/70 via-white to-slate-50/60 border border-blue-100 rounded-3xl p-8 sm:p-12 space-y-10 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-blue-100/60">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/70 text-brand-primary text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>College Survival Kit</span>
              </div>
              <h2 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">
                College Survival Kit
              </h2>
              <p className="text-base font-semibold text-brand-primary">
                Your college life, simplified.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed pt-1">
                From tracking attendance and calculating CGPA to checking placement eligibility and understanding salary packages, get the essential tools you need to manage your college journey.
              </p>
            </div>

            <div className="shrink-0">
              <Link to="/features/college-survival-kit">
                <Button
                  size="md"
                  className="bg-brand-primary hover:bg-blue-700 text-white shadow-sm flex items-center gap-2 font-bold px-5"
                >
                  <span>Explore College Survival Kit</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Card 1: Attendance Calculator */}
            <Link
              to="/college-survival-kit/attendance"
              className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-brand-primary/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <CalendarCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-primary transition-colors">
                    Attendance Calculator
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Track attendance and plan your attendance recovery.
                  </p>
                </div>
              </div>
              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-brand-primary group-hover:translate-x-0.5 transition-transform">
                <span>Calculate now</span>
                <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </div>
            </Link>

            {/* Card 2: CGPA / SGPA Calculator */}
            <Link
              to="/college-survival-kit/cgpa"
              className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-brand-primary/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-primary transition-colors">
                    CGPA / SGPA Calculator
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Calculate academic performance.
                  </p>
                </div>
              </div>
              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-brand-primary group-hover:translate-x-0.5 transition-transform">
                <span>Calculate now</span>
                <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </div>
            </Link>

            {/* Card 3: Placement Eligibility Checker */}
            <Link
              to="/college-survival-kit/placement-eligibility"
              className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-brand-primary/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-primary transition-colors">
                    Placement Eligibility
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Understand whether you meet placement criteria.
                  </p>
                </div>
              </div>
              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-brand-primary group-hover:translate-x-0.5 transition-transform">
                <span>Check eligibility</span>
                <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </div>
            </Link>

            {/* Card 4: CTC to In-Hand Salary */}
            <Link
              to="/college-survival-kit/salary"
              className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-brand-primary/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <IndianRupee className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-primary transition-colors">
                    CTC to In-Hand Salary
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Estimate your monthly take-home salary.
                  </p>
                </div>
              </div>
              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-brand-primary group-hover:translate-x-0.5 transition-transform">
                <span>Estimate salary</span>
                <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </div>
            </Link>

            {/* Card 5: Marks & Percentage Calculator */}
            <Link
              to="/college-survival-kit/marks"
              className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-brand-primary/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-primary transition-colors">
                    Marks & Percentage
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Calculate marks and academic percentages.
                  </p>
                </div>
              </div>
              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-brand-primary group-hover:translate-x-0.5 transition-transform">
                <span>Calculate now</span>
                <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. HOW ASPIREPATH WORKS (FOUR-STEP STUDENT JOURNEY) */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50/90 border border-slate-200/90 rounded-3xl p-8 sm:p-14 space-y-12">
          <div className="text-center max-w-2xl mx-auto">
            <Badge variant="primary" size="sm" className="mb-2.5">
              Structured Pathway
            </Badge>
            <h2 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">
              How AspirePath Works
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Four deliberate steps designed to build tangible engineering evidence from day one.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between hover:shadow-sm transition-shadow">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                  01
                </div>
                <h3 className="font-bold text-base text-slate-900">Create Profile & Scan CV</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Establish your baseline, upload your student resume, and extract verified competencies automatically.
                </p>
              </div>
              <div className="pt-2 text-[11px] font-semibold text-brand-primary flex items-center gap-1">
                <span>Baseline Setup</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between hover:shadow-sm transition-shadow">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                  02
                </div>
                <h3 className="font-bold text-base text-slate-900">Benchmark Role Fit</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Select your target engineering discipline, view your mathematical percentage fit, and discover missing prerequisites.
                </p>
              </div>
              <div className="pt-2 text-[11px] font-semibold text-brand-primary flex items-center gap-1">
                <span>Skill Intelligence</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between hover:shadow-sm transition-shadow">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                  03
                </div>
                <h3 className="font-bold text-base text-slate-900">Master Placement Tracks</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Practice high-frequency interview questions and study with verified PDF guides for Python OOP, Exception Handling, and SQL.
                </p>
              </div>
              <div className="pt-2 text-[11px] font-semibold text-brand-primary flex items-center gap-1">
                <span>Interview Readiness</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between hover:shadow-sm transition-shadow">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                  04
                </div>
                <h3 className="font-bold text-base text-slate-900">Publish Proof & Apply</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Showcase production-grade projects on your portfolio and apply to curated student opportunities with confidence.
                </p>
              </div>
              <div className="pt-2 text-[11px] font-semibold text-brand-primary flex items-center gap-1">
                <span>Career Launch</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. JOBS AND OPPORTUNITIES */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <Badge variant="primary" size="sm" className="mb-2">
              Opportunity Board
            </Badge>
            <h2 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">
              Jobs & Internships
            </h2>
            <p className="mt-2 text-sm text-slate-600 max-w-xl">
              Authentic junior roles and internships curated for college learners and recent graduates.
            </p>
          </div>

          <Link to="/jobs">
            <Button variant="outline" rightIcon={ArrowRight} className="text-xs font-semibold bg-white border-slate-300 hover:border-slate-400">
              Explore All Jobs
            </Button>
          </Link>
        </div>

        {/* Dynamic Jobs Grid / Honest Empty State */}
        {jobsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-label="Loading opportunities">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-1/2 rounded-md" />
                    <Skeleton className="h-3 w-1/3 rounded-md" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3.5 w-full rounded-md" />
                  <Skeleton className="h-3.5 w-4/5 rounded-md" />
                </div>
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : jobsError ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
            <p className="text-xs text-slate-600 mb-3">{jobsError}</p>
            <Link to="/jobs">
              <Button size="sm" variant="outline">Open Jobs Board</Button>
            </Link>
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
            <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">No Open Postings Right Now</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              We constantly review and verify legitimate entry-level and internship listings. New opportunities appear as verified hiring partners post them.
            </p>
            <div className="pt-2">
              <Link to="/jobs">
                <Button size="sm" variant="outline">Visit Jobs Board</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <JobCard key={job.id} {...job} />
            ))}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 6. STUDENT PROJECT SHOWCASE */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <Badge variant="cyan" size="sm" className="mb-2">
              Showcase Blueprints
            </Badge>
            <h2 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">
              Student Project Showcase
            </h2>
            <p className="mt-2 text-sm text-slate-600 max-w-xl">
              Practical software projects published by students with architectural patterns, tech stacks, and source repositories.
            </p>
          </div>

          <Link to="/projects">
            <Button variant="outline" rightIcon={ArrowRight} className="text-xs font-semibold bg-white border-slate-300 hover:border-slate-400">
              Browse All Projects
            </Button>
          </Link>
        </div>

        {/* Dynamic Project Grid / Honest Empty State */}
        {projectsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-label="Loading project showcases">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
                <Skeleton className="h-44 w-full rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-3/4 rounded-md" />
                  <Skeleton className="h-3.5 w-full rounded-md" />
                  <Skeleton className="h-3.5 w-2/3 rounded-md" />
                </div>
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : projectsError ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
            <p className="text-xs text-slate-600 mb-3">{projectsError}</p>
            <Link to="/projects">
              <Button size="sm" variant="outline">Browse Projects Page</Button>
            </Link>
          </div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
            <FolderGit2 className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">No Published Showcases Yet</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Student showcases appear here as they are published and approved by our review team. You can submit your own project or browse the blueprints catalogue.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Link to="/projects">
                <Button size="sm" variant="outline">Explore Blueprints</Button>
              </Link>
              <Link to="/login">
                <Button size="sm" variant="primary">Submit a Project</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} {...project} />
            ))}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 7. CAMPUS PLACEMENT & INSTITUTIONAL EXCELLENCE SECTION */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-blue-200/80 bg-gradient-to-br from-blue-50/80 via-white to-cyan-50/60 p-8 sm:p-12 shadow-sm">
          <div className="max-w-3xl space-y-4">
            <Badge variant="primary" size="sm">
              <GraduationCap className="w-3.5 h-3.5 mr-1" />
              Engineered for College Placement Cells & Universities
            </Badge>

            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight">
              A Complete Solution for Institutional Career Preparation
            </h2>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              AspirePath helps university departments and placement officers track cohort-level career readiness, standardizing student preparation across core technical tracks and verified project portfolios.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                <div className="font-bold text-slate-900 text-sm">Standardized Benchmarks</div>
                <p className="text-xs text-slate-500">13 industry-vetted role criteria with transparent scoring math.</p>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                <div className="font-bold text-slate-900 text-sm">Verifiable Student Proof</div>
                <p className="text-xs text-slate-500">Live GitHub repositories, architecture blueprints, and verified ATS resumes.</p>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                <div className="font-bold text-slate-900 text-sm">Curated Revision PDF Library</div>
                <p className="text-xs text-slate-500">High-frequency interview question banks for Python, OOP, SQL, and algorithms.</p>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Link to="/contact">
                <Button size="sm" variant="primary" rightIcon={ArrowRight}>
                  Contact for Institutional Access
                </Button>
              </Link>
              <Link to="/about">
                <Button size="sm" variant="outline" className="bg-white">
                  Learn About Our Mission
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. FINAL REGISTRATION CTA (PREMIUM GRADIENT BANNER) */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-600 to-cyan-600 p-8 sm:p-16 text-center text-white shadow-xl">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-72 h-72 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <span className="inline-block px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-bold uppercase tracking-wider text-blue-100">
              Campus Placement Readiness
            </span>

            <h2 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight leading-tight">
              From Your First Project to Your First Job.
            </h2>

            <p className="text-sm sm:text-lg text-blue-100 leading-relaxed font-normal">
              Join thousands of engineering students preparing for technical interviews, optimizing resumes, and building verified careers with AspirePath.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              {isAuthenticated ? (
                <Link to={getDashboardPath(user)} className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="white"
                    className="w-full sm:w-auto !bg-white !text-blue-700 hover:!bg-blue-50 font-bold px-8 py-3.5 shadow-xl text-base transition-transform hover:scale-[1.02]"
                  >
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <Link to="/register" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="white"
                    className="w-full sm:w-auto !bg-white !text-blue-700 hover:!bg-blue-50 font-bold px-8 py-3.5 shadow-xl text-base transition-transform hover:scale-[1.02]"
                  >
                    Create Your Free Account
                  </Button>
                </Link>
              )}
              <Link to="/features/placement-preparation" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-white border-white/60 hover:bg-white/10 px-8 py-3.5 backdrop-blur-xs">
                  Explore Placement Guides
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
