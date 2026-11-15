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
  Target,
  Lock,
  ChevronRight,
  UserCheck,
  Compass,
  Zap,
} from 'lucide-react';
import { Button, Card, Badge, Skeleton } from '@/components/common';
import { ProjectCard, JobCard } from '@/components/cards';
import { useAuth } from '@/context/AuthContext';
import SEO from '@/components/common/SEO';
import { getWebsiteSchema, getOrganizationSchema } from '@/utils/seoSchemas';
import { getDashboardPath } from '@/utils/navigation';
import { projectService } from '@/services/projectService';
import { jobService } from '@/services/jobService';

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();

  // Dynamic public projects from backend
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState(null);

  // Dynamic public jobs / internships from backend
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchProjects() {
      try {
        const pRes = await projectService.getProjects({ limit: 3, sort: 'stars' });
        if (isMounted) {
          setProjects(pRes?.items || []);
          setProjectsError(null);
        }
      } catch (err) {
        console.warn('Unable to load live project showcases:', err?.message || err);
        if (isMounted) {
          setProjectsError('Unable to load live project showcases. Please check back shortly.');
        }
      } finally {
        if (isMounted) setProjectsLoading(false);
      }
    }

    async function fetchJobs() {
      try {
        const jRes = await jobService.getJobs({
          limit: 3,
          sort: 'newest',
          include_facets: false,
        });
        if (isMounted) {
          setJobs(jRes?.items || []);
          setJobsError(null);
        }
      } catch (err) {
        console.warn('Unable to load live job opportunities:', err?.message || err);
        if (isMounted) {
          setJobsError('Unable to load current job opportunities. Please visit the jobs board directly.');
        }
      } finally {
        if (isMounted) setJobsLoading(false);
      }
    }

    fetchProjects();
    fetchJobs();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-24 sm:space-y-32 pb-24 overflow-hidden">
      <SEO
        title="AspirePath | From Your First Project to Your First Job"
        description="Build your resume, discover your strengths, explore opportunities and become career-ready with AspirePath."
        canonical="/"
        schema={[getWebsiteSchema(), getOrganizationSchema()]}
      />

      {/* ========================================================================= */}
      {/* 1. PREMIUM HERO SECTION (CENTERED, MODERN SAAS AESTHETIC) */}
      {/* ========================================================================= */}
      <section className="relative pt-12 sm:pt-20 lg:pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Subtle grid background pattern with radial mask */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(#93c5fd_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_20%,#000_70%,transparent_100%)] opacity-35 pointer-events-none" />

        {/* Ambient background glow orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[360px] bg-gradient-to-tr from-blue-300/30 via-cyan-200/25 to-indigo-200/20 blur-3xl pointer-events-none -z-10 rounded-full" />

        <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50/90 border border-blue-200/80 text-blue-700 text-xs font-semibold tracking-wide shadow-xs backdrop-blur-xs transition-all hover:bg-blue-50 hover:border-blue-300">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
            <span>AI-Powered Career Development Platform</span>
            <span className="text-blue-300">•</span>
            <span className="text-[11px] font-bold text-brand-primary">AspirePath 2.0</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold text-slate-900 tracking-tight leading-[1.12]">
            Your Career Journey{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent inline-block pb-1">
              Starts Here.
            </span>
          </h1>

          {/* Description */}
          <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            Build your resume, discover your strengths, explore opportunities and become career-ready with AspirePath.
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

            <a href="#career-tools" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-base px-8 py-3.5 bg-white/90 font-semibold border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 shadow-xs"
              >
                Explore Features
              </Button>
            </a>
          </div>

          {/* Clean Floating Feature Ribbon */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-xs">
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/90 border border-slate-200 shadow-xs text-slate-700 font-medium backdrop-blur-xs hover:border-blue-300 transition-colors">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>ATS Resume Analyzer</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/90 border border-slate-200 shadow-xs text-slate-700 font-medium backdrop-blur-xs hover:border-cyan-300 transition-colors">
              <BrainCircuit className="w-3.5 h-3.5 text-cyan-600" />
              <span>13-Role Skill Matrix</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/90 border border-slate-200 shadow-xs text-slate-700 font-medium backdrop-blur-xs hover:border-indigo-300 transition-colors">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>Vector PDF Resume Builder</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/90 border border-slate-200 shadow-xs text-slate-700 font-medium backdrop-blur-xs hover:border-emerald-300 transition-colors">
              <FolderGit2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified Portfolios</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. MAIN CAREER TOOLS (PREMIUM BENTO FEATURE CARDS) */}
      {/* ========================================================================= */}
      <section id="career-tools" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="primary" size="sm" className="mb-3">
            Core AI Capabilities
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-tight">
            Three Powerful Tools for Career Preparation
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600">
            Engineered specifically to solve the biggest challenges in entry-level hiring with deterministic rigor.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: ATS Resume Analyzer */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1.5 hover:border-blue-300">
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500" />

            <div className="p-7 space-y-6">
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
                  Analyze resumes, evaluate ATS compatibility, identify missing skills and receive improvement suggestions.
                </p>
              </div>

              {/* Product UI Preview Snippet */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 text-xs">
                <div className="flex justify-between items-center font-bold text-slate-800">
                  <span>ATS Match Preview</span>
                  <span className="text-brand-primary font-bold">82% Match</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-cyan-500 h-full rounded-full w-[82%]" />
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ✓ React.js
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ✓ REST APIs
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                    ! TypeScript
                  </span>
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

          {/* Card 2: Skill Intelligence */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1.5 hover:border-cyan-300">
            <div className="h-1.5 w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600" />

            <div className="p-7 space-y-6">
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
                  Extract skills from resumes, identify skill gaps and understand suitability for a target job role.
                </p>
              </div>

              {/* Product UI Preview Snippet */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 text-xs">
                <div className="flex justify-between items-center font-bold text-slate-800">
                  <span>Role Fit Simulation</span>
                  <span className="text-cyan-700 font-bold">78% Frontend</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-white text-slate-700 border border-slate-200 text-[10px] font-semibold shadow-2xs">
                    Frontend
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white text-slate-700 border border-slate-200 text-[10px] font-semibold shadow-2xs">
                    Full Stack
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white text-slate-700 border border-slate-200 text-[10px] font-semibold shadow-2xs">
                    Data / ML
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Ordered learning milestones with official documentation
                </p>
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

          {/* Card 3: Resume Builder */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1.5 hover:border-indigo-300">
            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500" />

            <div className="p-7 space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Vector PDF Export
                </span>
              </div>

              <div>
                <h3 className="text-xl font-display font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Resume Builder
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Create, edit and customize professional, ATS-friendly resumes.
                </p>
              </div>

              {/* Product UI Preview Snippet */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs">
                <div className="flex justify-between items-center font-bold text-slate-800">
                  <span>Split-Screen Live Editor</span>
                  <span className="text-indigo-600 font-bold">Vector PDF</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-[11px] space-y-1 shadow-2xs">
                  <p className="font-bold text-slate-900">Alex Rivera • Software Engineer</p>
                  <p className="text-slate-500 line-clamp-1">Projects: Microservices Platform, Realtime Chat...</p>
                </div>
                <p className="text-[11px] text-slate-500">
                  1-click export to ATS-approved vector PDF
                </p>
              </div>
            </div>

            <div className="px-7 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
              <Link
                to="/features/resume-builder"
                className="text-xs font-bold text-brand-primary flex items-center gap-1.5 group-hover:translate-x-1 transition-transform"
              >
                <span>Explore Feature Details</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. WHY ASPIREPATH? */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="cyan" size="sm" className="mb-2">
            Platform Benefits
          </Badge>
          <h2 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">
            Why AspirePath?
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            A unified engineering ecosystem connecting preparation to verified opportunity.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Benefit 1 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Resume Preparation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Build ATS-friendly resumes that pass automated screenings with standardized typography, clear section hierarchies, and vector PDF exports.
            </p>
          </div>

          {/* Benefit 2 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100 flex items-center justify-center font-bold">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Skill Development</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Identify skill gaps with transparent scoring formulas and follow structured roadmaps with verified technical milestones.
            </p>
          </div>

          {/* Benefit 3 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold">
              <Briefcase className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Career Opportunities</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Explore authentic entry-level positions and internships tailored specifically for college learners, graduates, and junior engineers.
            </p>
          </div>

          {/* Benefit 4 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Project Showcase</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Publish practical software projects with architectural blueprints, GitHub repositories, and live demo links to prove your skills.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. HOW ASPIREPATH WORKS (FOUR-STEP STUDENT JOURNEY) */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50/90 border border-slate-200/90 rounded-3xl p-8 sm:p-12 space-y-12">
          <div className="text-center max-w-2xl mx-auto">
            <Badge variant="primary" size="sm" className="mb-2">
              Structured Pathway
            </Badge>
            <h2 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">
              How AspirePath Works
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Four deliberate steps designed to build tangible engineering evidence and career readiness.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between hover:shadow-sm transition-shadow">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  01
                </div>
                <h3 className="font-bold text-base text-slate-900">Create Your Profile</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Students create their profiles and enter their career interests.
                </p>
              </div>
              <div className="pt-2 text-[11px] font-semibold text-brand-primary">
                Establish Baseline &rarr;
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between hover:shadow-sm transition-shadow">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  02
                </div>
                <h3 className="font-bold text-base text-slate-900">Build Your Resume</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Students create and improve their resumes.
                </p>
              </div>
              <div className="pt-2 text-[11px] font-semibold text-brand-primary">
                ATS Optimization &rarr;
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between hover:shadow-sm transition-shadow">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  03
                </div>
                <h3 className="font-bold text-base text-slate-900">Understand Your Skills</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Students identify strengths, missing skills and career readiness.
                </p>
              </div>
              <div className="pt-2 text-[11px] font-semibold text-brand-primary">
                13-Role Assessment &rarr;
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between hover:shadow-sm transition-shadow">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  04
                </div>
                <h3 className="font-bold text-base text-slate-900">Explore Opportunities</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Students discover jobs, internships and projects.
                </p>
              </div>
              <div className="pt-2 text-[11px] font-semibold text-brand-primary">
                Apply with Confidence &rarr;
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
      {/* 7. FINAL REGISTRATION CTA (PREMIUM GRADIENT BANNER) */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-600 to-cyan-600 p-8 sm:p-16 text-center text-white shadow-xl">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-72 h-72 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight leading-tight">
              Ready to Take the Next Step in Your Career?
            </h2>

            <p className="text-sm sm:text-lg text-blue-100 leading-relaxed font-normal">
              Start building your career with AspirePath today.
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
              <Link to="/projects" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-white border-white/60 hover:bg-white/10 px-8 py-3.5 backdrop-blur-xs">
                  Explore Projects
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
