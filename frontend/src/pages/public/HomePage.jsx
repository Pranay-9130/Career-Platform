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
        title="AspirePath | Build Your Skills. Build Your Future."
        description="Discover your skill gaps, build ATS-ready resumes, learn through practical projects, and prepare for internships and jobs—all in one student career development platform."
        canonical="/"
        schema={[getWebsiteSchema(), getOrganizationSchema()]}
      />

      {/* ========================================================================= */}
      {/* 1. HERO SECTION */}
      {/* ========================================================================= */}
      <section className="relative pt-12 sm:pt-20 lg:pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Subtle decorative glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-200/40 via-cyan-100/30 to-transparent blur-3xl pointer-events-none -z-10 rounded-full" />

        <div className="text-center max-w-4xl mx-auto">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-veryLight border border-brand-border text-brand-primary text-xs font-semibold uppercase tracking-wider mb-8 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-brand-primary animate-pulse" />
            <span>AI-Powered Student Career Platform</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold text-brand-text tracking-tight leading-[1.1]">
            Build Your Skills.{' '}
            <span className="bg-gradient-to-r from-brand-primary to-brand-cyan bg-clip-text text-transparent inline-block pb-1">
              Build Your Future.
            </span>
          </h1>

          {/* Supporting Text */}
          <p className="mt-6 sm:mt-8 text-base sm:text-xl text-brand-muted max-w-3xl mx-auto leading-relaxed">
            Discover your skill gaps, build ATS-ready resumes, learn through practical projects, and prepare for internships and jobs—all in one career development platform.
          </p>

          {/* Primary & Secondary Call to Actions */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link to={getDashboardPath(user)} className="w-full sm:w-auto">
                <Button size="lg" variant="gradient" rightIcon={ArrowRight} className="w-full sm:w-auto text-base px-8 py-3.5 shadow-card hover:shadow-card-hover font-bold">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/register" className="w-full sm:w-auto">
                <Button size="lg" variant="gradient" rightIcon={ArrowRight} className="w-full sm:w-auto text-base px-8 py-3.5 shadow-card hover:shadow-card-hover font-bold">
                  Get Started Free
                </Button>
              </Link>
            )}
            <Link to="/projects" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8 py-3.5 bg-white font-semibold">
                Explore Projects
              </Button>
            </Link>
          </div>

          {/* Honest Value Proposition Pill */}
          <div className="mt-12 inline-flex flex-wrap items-center justify-center gap-2.5 px-4 py-2 rounded-full bg-white border border-brand-border shadow-xs text-xs text-brand-muted">
            <ShieldCheck className="w-4 h-4 text-brand-primary" />
            <span className="font-semibold text-brand-text">Deterministic Skill Intelligence</span>
            <span className="text-slate-300">•</span>
            <span>ATS Resume Parsing</span>
            <span className="text-slate-300">•</span>
            <span>Verified Project Blueprints</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. PLATFORM FEATURES SECTION */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="primary" size="sm" className="mb-3">
            Platform Capabilities
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-brand-text">
            Everything You Need for Career Readiness
          </h2>
          <p className="mt-3 text-sm sm:text-base text-brand-muted">
            AspirePath unifies the key stages of technical preparation into one cohesive experience.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature 1 */}
          <Card hoverable className="p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-base text-brand-text">Resume Builder</h3>
              <p className="text-xs text-brand-muted leading-relaxed">
                Build professional, clean resumes with accessible split-screen editing and direct template selection.
              </p>
            </div>
            <Link to="/templates" className="text-xs font-semibold text-brand-primary flex items-center gap-1 hover:underline">
              <span>View Templates</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Card>

          {/* Feature 2 */}
          <Card hoverable className="p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 text-brand-cyan flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-base text-brand-text">ATS Resume Analyzer</h3>
              <p className="text-xs text-brand-muted leading-relaxed">
                Compare your resume against any target job description. Identify matched keywords and missing criteria.
              </p>
            </div>
            <Link to="/login" className="text-xs font-semibold text-brand-primary flex items-center gap-1 hover:underline">
              <span>Scan Resume</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Card>

          {/* Feature 3 */}
          <Card hoverable className="p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-base text-brand-text">Skill Intelligence</h3>
              <p className="text-xs text-brand-muted leading-relaxed">
                Extract skills from your resume, choose from 13 standard roles, and assess role fit with transparent math.
              </p>
            </div>
            <Link to="/login" className="text-xs font-semibold text-brand-primary flex items-center gap-1 hover:underline">
              <span>Explore Roles</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Card>

          {/* Feature 4 */}
          <Card hoverable className="p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-base text-brand-text">AI Career Mentor</h3>
              <p className="text-xs text-brand-muted leading-relaxed">
                Conversational mentor grounded in your confirmed skills, learning roadmap, and project showcases.
              </p>
            </div>
            <Link to="/login" className="text-xs font-semibold text-brand-primary flex items-center gap-1 hover:underline">
              <span>Chat with Mentor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Card>

          {/* Feature 5 */}
          <Card hoverable className="p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-base text-brand-text">Personalized Roadmap</h3>
              <p className="text-xs text-brand-muted leading-relaxed">
                Follow an ordered sequence of technical milestones with verified official documentation and practice tasks.
              </p>
            </div>
            <Link to="/login" className="text-xs font-semibold text-brand-primary flex items-center gap-1 hover:underline">
              <span>Track Roadmap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Card>

          {/* Feature 6 */}
          <Card hoverable className="p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <FolderGit2 className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-base text-brand-text">Project Hub</h3>
              <p className="text-xs text-brand-muted leading-relaxed">
                Discover peer-submitted blueprints and publish your own verified full-stack, AI, or cloud applications.
              </p>
            </div>
            <Link to="/projects" className="text-xs font-semibold text-brand-primary flex items-center gap-1 hover:underline">
              <span>Browse Blueprints</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Card>

          {/* Feature 7 */}
          <Card hoverable className="p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-base text-brand-text">Jobs & Internships</h3>
              <p className="text-xs text-brand-muted leading-relaxed">
                Explore real, curated student opportunities. Track application progress from Applied to Interview and Offer.
              </p>
            </div>
            <Link to="/jobs" className="text-xs font-semibold text-brand-primary flex items-center gap-1 hover:underline">
              <span>Explore Listings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Card>

          {/* Feature 8 */}
          <Card hoverable className="p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-base text-brand-text">Career Readiness Track</h3>
              <p className="text-xs text-brand-muted leading-relaxed">
                Evaluate your holistic preparation across Profile, Resume, Confirmed Skills, Projects, and Applications.
              </p>
            </div>
            <Link to="/login" className="text-xs font-semibold text-brand-primary flex items-center gap-1 hover:underline">
              <span>View Criteria</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Card>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. HOW IT WORKS SECTION */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-8 sm:p-12 space-y-12">
          <div className="text-center max-w-2xl mx-auto">
            <Badge variant="cyan" size="sm" className="mb-2">
              Structured Pathway
            </Badge>
            <h2 className="text-3xl font-display font-bold text-brand-text">
              How AspirePath Works
            </h2>
            <p className="mt-2 text-sm text-brand-muted">
              Four deliberate steps designed to build tangible engineering evidence without guessing what recruiters expect.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-8 h-8 rounded-lg bg-brand-primary text-white font-bold text-xs flex items-center justify-center">
                01
              </div>
              <h3 className="font-bold text-base text-brand-text">Create Profile</h3>
              <p className="text-xs text-brand-muted leading-relaxed">
                Set up your student profile and establish your initial career development baseline.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-8 h-8 rounded-lg bg-brand-primary text-white font-bold text-xs flex items-center justify-center">
                02
              </div>
              <h3 className="font-bold text-base text-brand-text">Upload Resume & Pick Role</h3>
              <p className="text-xs text-brand-muted leading-relaxed">
                Scan your existing PDF resume and select your target career track across 13 engineering disciplines.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-8 h-8 rounded-lg bg-brand-primary text-white font-bold text-xs flex items-center justify-center">
                03
              </div>
              <h3 className="font-bold text-base text-brand-text">Identify Gaps & Learn</h3>
              <p className="text-xs text-brand-muted leading-relaxed">
                Review your role fit percentage, identify missing competencies, and follow structured roadmaps.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-8 h-8 rounded-lg bg-brand-primary text-white font-bold text-xs flex items-center justify-center">
                04
              </div>
              <h3 className="font-bold text-base text-brand-text">Practice & Discover Jobs</h3>
              <p className="text-xs text-brand-muted leading-relaxed">
                Build practical project showcases, track verified skills, and explore curated opportunities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. REAL PROJECTS SHOWCASE */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <Badge variant="cyan" size="sm" className="mb-2">
              Real Showcase Blueprints
            </Badge>
            <h2 className="text-3xl font-display font-bold text-brand-text">
              Practical Projects
            </h2>
            <p className="mt-2 text-sm text-brand-muted max-w-xl">
              Real projects published by students on AspirePath with architecture guidelines and tech stacks.
            </p>
          </div>

          <Link to="/projects">
            <Button variant="outline" rightIcon={ArrowRight} className="text-xs">
              Browse All Projects
            </Button>
          </Link>
        </div>

        {/* Dynamic Project Grid / Honest Empty State */}
        {projectsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-label="Loading project showcases">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-brand-border p-5 space-y-4 shadow-xs">
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
          <div className="p-8 text-center bg-white rounded-3xl border border-brand-border">
            <p className="text-xs text-slate-600 mb-3">{projectsError}</p>
            <Link to="/projects">
              <Button size="sm" variant="outline">Browse Projects Page</Button>
            </Link>
          </div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-brand-border space-y-3">
            <FolderGit2 className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-brand-text">No Published Showcases Yet</h3>
            <p className="text-xs text-brand-muted max-w-md mx-auto">
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
      {/* 5. JOBS & INTERNSHIPS SHOWCASE */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <Badge variant="primary" size="sm" className="mb-2">
              Opportunity Board
            </Badge>
            <h2 className="text-3xl font-display font-bold text-brand-text">
              Jobs & Internships
            </h2>
            <p className="mt-2 text-sm text-brand-muted max-w-xl">
              Authentic junior roles and internships verified for college learners and recent graduates.
            </p>
          </div>

          <Link to="/jobs">
            <Button variant="outline" rightIcon={ArrowRight} className="text-xs">
              Explore All Jobs
            </Button>
          </Link>
        </div>

        {/* Dynamic Jobs Grid / Honest Empty State */}
        {jobsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-label="Loading opportunities">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-brand-border p-5 space-y-4 shadow-xs">
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
          <div className="p-8 text-center bg-white rounded-3xl border border-brand-border">
            <p className="text-xs text-slate-600 mb-3">{jobsError}</p>
            <Link to="/jobs">
              <Button size="sm" variant="outline">Open Jobs Board</Button>
            </Link>
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-brand-border space-y-3">
            <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-brand-text">No Open Postings Right Now</h3>
            <p className="text-xs text-brand-muted max-w-md mx-auto">
              We are constantly reviewing and verifying legitimate entry-level and internship listings. New opportunities appear as verified hiring partners post them.
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
      {/* 6. LEARNING & AI MENTOR SPOTLIGHT */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-blue-900 via-brand-primary to-blue-700 text-white shadow-card relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold text-white tracking-wide uppercase inline-flex items-center gap-1.5">
                <BrainCircuit className="w-3.5 h-3.5 text-cyan-300" /> Grounded Mentorship
              </span>
              <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-white">
                Personalized Career Guidance Powered by Real Data
              </h2>
              <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
                Unlike generic AI chatbots, the AspirePath AI Mentor is grounded in your authenticated student data: your confirmed competencies, target career track, and verified project records.
              </p>
              <ul className="space-y-2 text-xs text-blue-100">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-300 shrink-0" />
                  <span>Explains role-match scoring and critical skill gaps without speculation.</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-300 shrink-0" />
                  <span>Clarifies technical prerequisites and structured learning milestones.</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-300 shrink-0" />
                  <span>Suggests practical portfolio projects from our real catalogue.</span>
                </li>
              </ul>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-5 space-y-3 text-xs text-white">
              <div className="flex items-center gap-2 font-bold text-cyan-300 pb-2 border-b border-white/10">
                <Sparkles className="w-4 h-4" />
                <span>AI Mentor Sample Conversation</span>
              </div>
              <div className="space-y-2.5">
                <div className="bg-white/15 p-3 rounded-xl">
                  <p className="font-semibold text-cyan-200 text-[11px] mb-1">Student:</p>
                  <p className="text-slate-100">"What should I prioritize first for Frontend Developer between TypeScript and Testing?"</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl border border-white/20">
                  <p className="font-semibold text-cyan-300 text-[11px] mb-1">Career Mentor:</p>
                  <p className="text-blue-50 leading-relaxed">
                    "Prioritize TypeScript first (Stage 1 prerequisite). 78% of modern frontend job listings require static typing before testing frameworks. Once you build a component with TypeScript, Jest and Playwright testing will be significantly more intuitive."
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-blue-200/80 italic pt-1">
                * Recommendations depend on your selected role and confirmed skills. AspirePath never guarantees employment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. TRUST AND PLATFORM VALUES */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="cyan" size="sm" className="mb-2">
            Why AspirePath
          </Badge>
          <h2 className="text-3xl font-display font-bold text-brand-text">
            Built on Honest Principles
          </h2>
          <p className="mt-2 text-sm text-brand-muted">
            We avoid fabricated statistics and inflated marketing claims to focus on real student growth.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center font-bold">
              <Code2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-brand-text">Demonstrated Evidence</h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              Real projects and runnable code speak louder than keyword-stuffed resumes or course completion certificates.
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-brand-cyan flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-brand-text">Transparent Math</h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              Deterministic skill-match scoring formulas that explain exactly which competencies were counted and why.
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-brand-text">Privacy & Security</h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              Your resume files, contact details, and learning progress are strictly protected and isolated per user.
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-brand-text">Continuous Journey</h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              A unified pathway connecting resume writing, gap detection, verified practice, and opportunity tracking.
            </p>
          </Card>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. FINAL HIGH-CONVERTING CTA BANNER */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-600 p-8 sm:p-16 text-center text-white shadow-xl">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 rounded-full bg-cyan-400/20 blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight">
              Your next career opportunity starts with preparation.
            </h2>

            <p className="text-sm sm:text-lg text-blue-100 leading-relaxed">
              Build your resume, understand your skill gaps, practice with projects, and take the next step toward your career goals.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              {isAuthenticated ? (
                <Link to={getDashboardPath(user)} className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="white"
                    className="w-full sm:w-auto !bg-white !text-blue-700 hover:!bg-blue-50 font-bold px-8 py-3.5 shadow-xl text-base"
                  >
                    <span className="text-blue-700 font-bold">Go to Dashboard</span>
                  </Button>
                </Link>
              ) : (
                <Link to="/register" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="white"
                    className="w-full sm:w-auto !bg-white !text-blue-700 hover:!bg-blue-50 font-bold px-8 py-3.5 shadow-xl text-base"
                  >
                    <span className="text-blue-700 font-bold">Get Started Free</span>
                  </Button>
                </Link>
              )}
              <Link to="/projects" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-white border-white/60 hover:bg-white/10 px-8 py-3.5">
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
