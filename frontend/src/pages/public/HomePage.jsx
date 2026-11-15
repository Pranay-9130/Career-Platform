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
  Smartphone,
  Download,
  QrCode,
  Layout,
  Terminal,
  Cpu,
  BarChart3,
  Star,
  Users,
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

  // Interactive Hero Preview Tab: 'ats' | 'skills' | 'projects'
  const [activeHeroTab, setActiveHeroTab] = useState('ats');

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
      {/* 1. HERO SECTION WITH SAAS DASHBOARD PREVIEW */}
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
            <span className="text-[11px] font-bold text-brand-primary">Deterministic Tech Pathways</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold text-slate-900 tracking-tight leading-[1.12]">
            From Your First Project{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent inline-block pb-1">
              to Your First Job.
            </span>
          </h1>

          {/* Description */}
          <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            Build your resume, discover your strengths, explore opportunities and become career-ready with AspirePath.
          </p>

          {/* Dual CTAs + Mobile App Pill */}
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
                  Get Started Free
                </Button>
              </Link>
            )}

            <a href="#features" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-base px-8 py-3.5 bg-white/90 font-semibold border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 shadow-xs"
              >
                Explore Features
              </Button>
            </a>

            <Link to="/download-app" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                leftIcon={Smartphone}
                className="w-full sm:w-auto text-base px-6 py-3.5 bg-blue-50/70 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300 font-semibold shadow-xs"
              >
                Download App
              </Button>
            </Link>
          </div>

          {/* Interactive Interactive Preview Mockup Window */}
          <div className="pt-10 max-w-4xl mx-auto">
            <div className="bg-white/95 rounded-3xl border border-slate-200/90 shadow-2xl shadow-blue-500/10 overflow-hidden backdrop-blur-md">
              {/* Window Title Bar */}
              <div className="bg-slate-50 border-b border-slate-200/80 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                  <span className="ml-2 text-xs font-semibold text-slate-500 hidden sm:inline">
                    AspirePath Career Readiness Console
                  </span>
                </div>

                {/* Tab switchers */}
                <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl">
                  <button
                    onClick={() => setActiveHeroTab('ats')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      activeHeroTab === 'ats'
                        ? 'bg-white text-brand-primary shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ATS Score
                  </button>
                  <button
                    onClick={() => setActiveHeroTab('skills')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      activeHeroTab === 'skills'
                        ? 'bg-white text-brand-primary shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Skill Matrix
                  </button>
                  <button
                    onClick={() => setActiveHeroTab('projects')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      activeHeroTab === 'projects'
                        ? 'bg-white text-brand-primary shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Portfolios
                  </button>
                </div>
              </div>

              {/* Tab Content Display */}
              <div className="p-6 sm:p-8 text-left">
                {activeHeroTab === 'ats' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/60 border border-blue-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                            Resume Analysis
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            ATS Compliant
                          </span>
                        </div>
                        <h4 className="text-xl font-bold text-slate-900 mt-1">
                          Frontend Developer Track
                        </h4>
                        <p className="text-xs text-slate-600 mt-1">
                          Evaluated against standard ATS parsing engines and verified keyword matrices.
                        </p>
                      </div>

                      <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-2xl border border-blue-100 shadow-xs">
                        <div className="text-right">
                          <p className="text-2xl font-black text-blue-600">88%</p>
                          <p className="text-[10px] text-slate-500 font-semibold">Match Score</p>
                        </div>
                        <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-cyan-400 flex items-center justify-center font-bold text-xs text-blue-600">
                          ✓
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                        <p className="font-bold text-slate-700">Verified Technical Skills</p>
                        <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                          ✓ React, TypeScript, HTML5, CSS3, REST
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                        <p className="font-bold text-slate-700">Format & Structure</p>
                        <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                          ✓ Vector PDF, Standard Sections, Single Column
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                        <p className="font-bold text-slate-700">Recommended Additions</p>
                        <p className="text-[11px] text-amber-600 font-semibold mt-1">
                          + Unit Testing (Jest), CI/CD Workflow
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeHeroTab === 'skills' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-cyan-50/80 to-blue-50/60 border border-cyan-100">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-cyan-800">
                          13-Role Engineering Framework
                        </span>
                        <h4 className="text-xl font-bold text-slate-900 mt-1">
                          Personalized Skill Gap Roadmaps
                        </h4>
                        <p className="text-xs text-slate-600 mt-1">
                          Real-time extraction from resumes with deterministic curriculum recommendations.
                        </p>
                      </div>
                      <Badge variant="cyan" size="md">Deterministic AI</Badge>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {['Frontend Developer (92%)', 'Full Stack Developer (78%)', 'Software Engineer (65%)', 'Backend Developer (55%)'].map((track, i) => (
                        <div key={i} className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-2 text-xs font-bold text-slate-800">
                          <span className="w-2 h-2 rounded-full bg-cyan-500" />
                          <span>{track}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeHeroTab === 'projects' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-50/80 to-teal-50/60 border border-emerald-100">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                          Peer Project Verification
                        </span>
                        <h4 className="text-xl font-bold text-slate-900 mt-1">
                          Architecture Blueprints & Git Proofs
                        </h4>
                        <p className="text-xs text-slate-600 mt-1">
                          Student projects accompanied by architecture diagrams, live demo URLs, and GitHub repos.
                        </p>
                      </div>
                      <Badge variant="success" size="md">Verified Code</Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <p className="font-bold text-slate-800">Career Development Microservices</p>
                        <p className="text-slate-500 text-[11px]">FastAPI • PostgreSQL • Redis • Docker</p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <p className="font-bold text-slate-800">Realtime Collaborative Code Editor</p>
                        <p className="text-slate-500 text-[11px]">React • WebSockets • Tailwind CSS • Node.js</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. CORE FEATURES (6 PREMIUM SAAS CAPABILITIES) */}
      {/* ========================================================================= */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="primary" size="sm" className="mb-3">
            Core Features
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-tight">
            Six Powerful Tools for Career Preparation
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600">
            Engineered specifically to solve the biggest challenges in entry-level hiring with deterministic rigor.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1: ATS Resume Analyzer */}
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
                  Analyze resumes, evaluate ATS compatibility, identify missing skills and receive improvement suggestions.
                </p>
              </div>
            </div>
            <div className="px-7 py-4 bg-slate-50/70 border-t border-slate-100">
              <Link
                to="/features/ats-analyzer"
                className="text-xs font-bold text-brand-primary flex items-center gap-1.5 group-hover:translate-x-1 transition-transform"
              >
                <span>Explore ATS Analyzer</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Feature 2: Resume Builder */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1.5 hover:border-indigo-300">
            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500" />
            <div className="p-7 space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Vector PDF
                </span>
              </div>
              <div>
                <h3 className="text-xl font-display font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Resume Builder
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Create, edit and customize professional, ATS-friendly resumes with live preview and instant vector export.
                </p>
              </div>
            </div>
            <div className="px-7 py-4 bg-slate-50/70 border-t border-slate-100">
              <Link
                to="/features/resume-builder"
                className="text-xs font-bold text-brand-primary flex items-center gap-1.5 group-hover:translate-x-1 transition-transform"
              >
                <span>Build Your Resume</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Feature 3: Skill Intelligence */}
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
                  Extract skills from resumes, identify skill gaps and understand suitability for a target job role.
                </p>
              </div>
            </div>
            <div className="px-7 py-4 bg-slate-50/70 border-t border-slate-100">
              <Link
                to="/features/skill-intelligence"
                className="text-xs font-bold text-brand-primary flex items-center gap-1.5 group-hover:translate-x-1 transition-transform"
              >
                <span>Analyze Skill Gaps</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Feature 4: Job Opportunities */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1.5 hover:border-amber-300">
            <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500" />
            <div className="p-7 space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                  <Briefcase className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  Verified Roles
                </span>
              </div>
              <div>
                <h3 className="text-xl font-display font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                  Job Opportunities
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Verified entry-level roles and internships from legitimate tech companies with direct official application portals.
                </p>
              </div>
            </div>
            <div className="px-7 py-4 bg-slate-50/70 border-t border-slate-100">
              <Link
                to="/jobs"
                className="text-xs font-bold text-brand-primary flex items-center gap-1.5 group-hover:translate-x-1 transition-transform"
              >
                <span>Browse Job Board</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Feature 5: Project Showcase */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1.5 hover:border-emerald-300">
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
            <div className="p-7 space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                  <FolderGit2 className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Portfolios
                </span>
              </div>
              <div>
                <h3 className="text-xl font-display font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Project Showcase
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Publish architectural blueprints, GitHub repositories, and live demo links to prove hands-on software engineering ability.
                </p>
              </div>
            </div>
            <div className="px-7 py-4 bg-slate-50/70 border-t border-slate-100">
              <Link
                to="/projects"
                className="text-xs font-bold text-brand-primary flex items-center gap-1.5 group-hover:translate-x-1 transition-transform"
              >
                <span>View Projects</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Feature 6: Career Readiness Analytics */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1.5 hover:border-purple-300">
            <div className="h-1.5 w-full bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500" />
            <div className="p-7 space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                  Readiness Score
                </span>
              </div>
              <div>
                <h3 className="text-xl font-display font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                  Career Readiness Analytics
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Comprehensive dashboard monitoring ATS scores, technical skills coverage, and active application pipelines.
                </p>
              </div>
            </div>
            <div className="px-7 py-4 bg-slate-50/70 border-t border-slate-100">
              <Link
                to={isAuthenticated ? getDashboardPath(user) : "/login"}
                className="text-xs font-bold text-brand-primary flex items-center gap-1.5 group-hover:translate-x-1 transition-transform"
              >
                <span>View Readiness Stats</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. HOW IT WORKS (5-STEP VISUAL WORKFLOW) */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50/90 border border-slate-200/90 rounded-3xl p-8 sm:p-12 space-y-12">
          <div className="text-center max-w-2xl mx-auto">
            <Badge variant="primary" size="sm" className="mb-2">
              Visual Workflow
            </Badge>
            <h2 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">
              How AspirePath Works
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Five deliberate steps designed to build tangible engineering evidence and career readiness.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Step 1 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between hover:shadow-sm transition-shadow">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  01
                </div>
                <h3 className="font-bold text-sm text-slate-900">Create your profile</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Establish your academic and engineering baseline.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between hover:shadow-sm transition-shadow">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  02
                </div>
                <h3 className="font-bold text-sm text-slate-900">Build or upload resume</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Generate vector ATS resumes or upload existing PDFs.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between hover:shadow-sm transition-shadow">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  03
                </div>
                <h3 className="font-bold text-sm text-slate-900">Analyze your skills</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Examine role gaps against 13 engineering tracks.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between hover:shadow-sm transition-shadow">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  04
                </div>
                <h3 className="font-bold text-sm text-slate-900">Explore jobs & projects</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Discover verified opportunities and architectural projects.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between hover:shadow-sm transition-shadow">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  05
                </div>
                <h3 className="font-bold text-sm text-slate-900">Land your first job</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Apply with confidence backed by verified evidence.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. DYNAMIC OPPORTUNITY BOARD (JOBS & INTERNSHIPS) */}
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
      {/* 5. DYNAMIC STUDENT PROJECT SHOWCASE */}
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

        {projectsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-label="Loading project showcases">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
                <Skeleton className="h-44 w-full rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-3/4 rounded-md" />
                  <Skeleton className="h-3.5 w-full rounded-md" />
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
      {/* 6. RESUME TEMPLATES PREVIEW */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <Badge variant="primary" size="sm" className="mb-2">
              ATS-Optimized Templates
            </Badge>
            <h2 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">
              Standardized Resume Formats
            </h2>
            <p className="mt-2 text-sm text-slate-600 max-w-xl">
              Clean single-column layouts engineered to pass Taleo, Workday, and Greenhouse automated parsers without formatting loss.
            </p>
          </div>

          <Link to="/templates">
            <Button variant="outline" rightIcon={ArrowRight} className="text-xs font-semibold bg-white border-slate-300 hover:border-slate-400">
              View All Templates
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Template Card 1 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 hover:shadow-card hover:-translate-y-1 transition-all group">
            <div className="h-44 rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2 overflow-hidden flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="h-3 w-1/3 bg-slate-800 rounded" />
                <div className="h-2 w-1/2 bg-slate-400 rounded" />
                <div className="h-px w-full bg-slate-200 my-2" />
                <div className="space-y-1">
                  <div className="h-2 w-full bg-slate-300 rounded" />
                  <div className="h-2 w-4/5 bg-slate-300 rounded" />
                  <div className="h-2 w-2/3 bg-slate-300 rounded" />
                </div>
              </div>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                Software Engineering Modern
              </span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 group-hover:text-brand-primary transition-colors">
                Classic Tech Minimalist
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Optimized for software engineers, backend specialists, and DevOps candidates.
              </p>
            </div>
            <Link to="/templates" className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary">
              <span>Preview Template</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Template Card 2 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 hover:shadow-card hover:-translate-y-1 transition-all group">
            <div className="h-44 rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2 overflow-hidden flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="h-3 w-2/5 bg-indigo-700 rounded" />
                <div className="h-2 w-3/5 bg-slate-400 rounded" />
                <div className="h-px w-full bg-slate-200 my-2" />
                <div className="space-y-1">
                  <div className="h-2 w-full bg-slate-300 rounded" />
                  <div className="h-2 w-5/6 bg-slate-300 rounded" />
                  <div className="h-2 w-3/4 bg-slate-300 rounded" />
                </div>
              </div>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                Executive & Lead Engineer
              </span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                Executive Professional
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Ideal for full-stack leads, cloud architects, and senior engineering roles.
              </p>
            </div>
            <Link to="/templates" className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary">
              <span>Preview Template</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Template Card 3 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 hover:shadow-card hover:-translate-y-1 transition-all group">
            <div className="h-44 rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2 overflow-hidden flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="h-3 w-1/3 bg-cyan-700 rounded" />
                <div className="h-2 w-1/2 bg-slate-400 rounded" />
                <div className="h-px w-full bg-slate-200 my-2" />
                <div className="space-y-1">
                  <div className="h-2 w-full bg-slate-300 rounded" />
                  <div className="h-2 w-4/5 bg-slate-300 rounded" />
                  <div className="h-2 w-2/3 bg-slate-300 rounded" />
                </div>
              </div>
              <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider">
                Entry-Level & Internships
              </span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 group-hover:text-cyan-700 transition-colors">
                Campus Graduate Starter
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Emphasizes coursework, academic achievements, and foundational GitHub projects.
              </p>
            </div>
            <Link to="/templates" className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary">
              <span>Preview Template</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. ANDROID MOBILE APP SHOWCASE */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-8 sm:p-14 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold">
                <Smartphone className="w-3.5 h-3.5" />
                <span>AspirePath for Android • Official APK v1.0.0</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight">
                Take Your Career Tools Everywhere.
              </h2>

              <p className="text-sm sm:text-base text-blue-200 leading-relaxed max-w-xl">
                Access your career readiness dashboard, upload PDF resumes, explore job openings, and practice placement question banks directly on your Android phone.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link to="/download-app">
                  <Button
                    size="lg"
                    variant="white"
                    leftIcon={Download}
                    className="!bg-white !text-blue-900 hover:!bg-blue-50 font-bold px-7 py-3 text-sm shadow-xl"
                  >
                    Download APK (65.4 MB)
                  </Button>
                </Link>
                <Link to="/download-app">
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-white border-blue-400/50 hover:bg-white/10 px-6 py-3 text-sm"
                  >
                    Installation Guide
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-6 pt-2 text-xs text-blue-200/90">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Direct FastAPI Integration
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Signed Release Build
                </span>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 text-center space-y-4 max-w-xs w-full shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-white/20 border border-white/30 mx-auto flex items-center justify-center text-white">
                  <Smartphone className="w-8 h-8 text-cyan-300" />
                </div>
                <div>
                  <p className="font-bold text-white text-base">AspirePath Android</p>
                  <p className="text-xs text-blue-200 mt-0.5">Version 1.0.0 • Released Nov 2026</p>
                </div>
                <div className="p-3 rounded-2xl bg-white text-slate-900 space-y-1">
                  <p className="text-xs font-bold">100% Free for Students</p>
                  <p className="text-[11px] text-slate-500">Requires Android 7.0+ (API 24+)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. FINAL REGISTRATION CTA */}
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
