import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Code2,
  FileText,
  CheckCircle2,
  Briefcase,
  Layers,
  Star,
  TrendingUp,
  Cpu,
  Smartphone,
  Cloud,
  Check,
  ChevronRight,
  Send,
  Award,
} from 'lucide-react';
import { Button, Card, Badge } from '@/components/common';
import { ProjectCard, JobCard } from '@/components/cards';
import { useAuth } from '@/context/AuthContext';
import SEO from '@/components/common/SEO';
import { getWebsiteSchema, getOrganizationSchema } from '@/utils/seoSchemas';
import { getDashboardPath } from '@/utils/navigation';

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const [selectedDomain, setSelectedDomain] = useState('all');

  const domainFilters = [
    { id: 'all', label: 'All Domains' },
    { id: 'web', label: 'Fullstack Web' },
    { id: 'ai', label: 'AI & Machine Learning' },
    { id: 'cloud', label: 'Cloud & DevOps' },
    { id: 'mobile', label: 'Mobile Apps' },
  ];

  const featuredProjects = [
    {
      id: '1',
      slug: 'ai-resume-matcher',
      domainKey: 'ai',
      title: 'AI Resume Matcher & ATS Scorer',
      domain: 'AI & Machine Learning',
      description: 'Extracts skills and keywords from student resumes, computes semantic cosine match against job descriptions using Google Gemini.',
      technologies: ['FastAPI', 'React', 'Gemini AI', 'PostgreSQL'],
      authorName: 'Alex Chen',
      authorAvatar: 'AC',
      difficulty: 'Intermediate',
      duration: '25 hrs',
    },
    {
      id: '2',
      slug: 'cloud-native-microservices',
      domainKey: 'cloud',
      title: 'Cloud-Native Observability Mesh',
      domain: 'Cloud & DevOps',
      description: 'Distributed microservice pipeline with Prometheus metrics, OpenTelemetry tracing, and Docker Compose orchestration.',
      technologies: ['Go', 'Docker', 'Kubernetes', 'Prometheus'],
      authorName: 'Sarah Lin',
      authorAvatar: 'SL',
      difficulty: 'Advanced',
      duration: '35 hrs',
    },
    {
      id: '3',
      slug: 'campus-marketplace-app',
      domainKey: 'mobile',
      title: 'Campus Peer Marketplace',
      domain: 'Mobile Apps',
      description: 'Cross-platform student marketplace for textbooks and electronics with authenticated university email verification.',
      technologies: ['React Native', 'TypeScript', 'Tailwind', 'Node.js'],
      authorName: 'Rahul Sharma',
      authorAvatar: 'RS',
      difficulty: 'Beginner',
      duration: '18 hrs',
    },
  ];

  const filteredProjects =
    selectedDomain === 'all'
      ? featuredProjects
      : featuredProjects.filter((p) => p.domainKey === selectedDomain);

  const featuredJobs = [
    {
      id: '1',
      slug: 'junior-fullstack-dev',
      companyName: 'DevScale Labs',
      role: 'Junior Fullstack Engineer',
      jobType: 'Job',
      workMode: 'Remote',
      location: 'San Francisco, CA (or Remote)',
      salary: '$68,000 – $82,000 / yr',
      skills: ['React', 'Python', 'FastAPI', 'PostgreSQL'],
      deadline: 'In 12 days',
    },
    {
      id: '2',
      slug: 'frontend-eng-intern',
      companyName: 'Nexa AI Systems',
      role: 'Frontend Engineering Intern',
      jobType: 'Internship',
      workMode: 'Hybrid',
      location: 'New York, NY',
      salary: '$42 / hour',
      skills: ['TypeScript', 'React', 'Tailwind CSS', 'Vite'],
      deadline: 'In 7 days',
    },
    {
      id: '3',
      slug: 'cloud-infrastructure-intern',
      companyName: 'Apex Cloud Tech',
      role: 'Cloud Operations Intern',
      jobType: 'Internship',
      workMode: 'Remote',
      location: 'Austin, TX (Remote)',
      salary: '$38 / hour',
      skills: ['Linux', 'Docker', 'AWS', 'Python'],
      deadline: 'In 18 days',
    },
  ];

  return (
    <div className="space-y-24 sm:space-y-32 pb-24 overflow-hidden">
      <SEO
        title="From Your First Project to Your First Job"
        description="Discover student project showcases, craft ATS-compliant resumes, analyze match scores with Gemini AI, and connect with hiring companies."
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
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-veryLight border border-brand-border text-brand-primary text-xs font-semibold uppercase tracking-wider mb-8 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-brand-primary animate-pulse" />
            <span>The End-to-End Student Career Platform</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold text-brand-text tracking-tight leading-[1.1]">
            Build Your Skills.{' '}
            <span className="bg-gradient-to-r from-brand-primary to-brand-cyan bg-clip-text text-transparent inline-block pb-1">
              Build Your Future.
            </span>
          </h1>

          {/* Subheading */}
          <p className="mt-6 sm:mt-8 text-base sm:text-xl text-brand-muted max-w-2xl mx-auto leading-relaxed">
            Discover guided projects, showcase verified software, generate ATS-ready resumes,
            and connect with entry-level opportunities — all in one unified pathway.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link to={getDashboardPath(user)} className="w-full sm:w-auto">
                <Button size="lg" variant="gradient" rightIcon={ArrowRight} className="w-full sm:w-auto text-base px-8 py-3.5 shadow-card hover:shadow-card-hover">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/register" className="w-full sm:w-auto">
                <Button size="lg" variant="gradient" rightIcon={ArrowRight} className="w-full sm:w-auto text-base px-8 py-3.5 shadow-card hover:shadow-card-hover">
                  Get Started Free
                </Button>
              </Link>
            )}
            <Link to="/projects" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8 py-3.5 bg-white">
                Explore Projects
              </Button>
            </Link>
          </div>

          {/* Social Proof Metric Pill */}
          <div className="mt-12 inline-flex flex-wrap items-center justify-center gap-3 px-5 py-2.5 rounded-full bg-white border border-brand-border shadow-sm text-xs text-brand-muted">
            <div className="flex -space-x-2">
              <div className="w-6 h-6 rounded-full bg-blue-500 text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-white">SL</div>
              <div className="w-6 h-6 rounded-full bg-cyan-500 text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-white">AC</div>
              <div className="w-6 h-6 rounded-full bg-indigo-500 text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-white">RS</div>
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-white">DM</div>
            </div>
            <div className="flex items-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-current" />
              ))}
            </div>
            <span className="font-semibold text-brand-text">10,000+ Students</span>
            <span className="text-slate-300">|</span>
            <span>From 150+ Universities worldwide</span>
          </div>
        </div>


      </section>

      {/* ========================================================================= */}
      {/* 2. THE 6-STEP CAREER PATHWAY */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="primary" size="sm" className="mb-3">
            The Student Career Pathway
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-brand-text">
            From Your First Project to Your First Job
          </h2>
          <p className="mt-3 text-sm sm:text-base text-brand-muted">
            A continuous, connected pathway replacing fragmented learning with real results.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Step 1: Discover */}
          <Card hoverable className="relative overflow-hidden group">
            <div className="w-10 h-10 rounded-xl bg-brand-veryLight text-brand-primary flex items-center justify-center font-bold text-sm mb-4">
              01
            </div>
            <h3 className="font-display font-bold text-lg text-brand-text group-hover:text-brand-primary transition-colors">
              Discover Project Ideas
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-brand-muted leading-relaxed">
              Explore curated, production-grade project specifications. No generic to-do apps — real architectures solving actual problems.
            </p>
            <div className="mt-4 text-xs font-semibold text-brand-primary flex items-center gap-1">
              <span>What should I build?</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Card>

          {/* Step 2: Build */}
          <Card hoverable className="relative overflow-hidden group">
            <div className="w-10 h-10 rounded-xl bg-brand-veryLight text-brand-primary flex items-center justify-center font-bold text-sm mb-4">
              02
            </div>
            <h3 className="font-display font-bold text-lg text-brand-text group-hover:text-brand-primary transition-colors">
              Build Practical Skills
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-brand-muted leading-relaxed">
              Step-by-step objectives, prerequisites, and resource links. Learn industry tech stacks (FastAPI, React, Docker, PostgreSQL) hands-on.
            </p>
            <div className="mt-4 text-xs font-semibold text-brand-primary flex items-center gap-1">
              <span>Guided objectives</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Card>

          {/* Step 3: Showcase */}
          <Card hoverable className="relative overflow-hidden group">
            <div className="w-10 h-10 rounded-xl bg-brand-veryLight text-brand-primary flex items-center justify-center font-bold text-sm mb-4">
              03
            </div>
            <h3 className="font-display font-bold text-lg text-brand-text group-hover:text-brand-primary transition-colors">
              Showcase Your Portfolio
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-brand-muted leading-relaxed">
              Upload screenshots and project ZIP archives to your public verified student URL (`/u/:username`). No mandatory git knowledge required.
            </p>
            <div className="mt-4 text-xs font-semibold text-brand-primary flex items-center gap-1">
              <span>Shareable profile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Card>

          {/* Step 4: Prepare */}
          <Card hoverable className="relative overflow-hidden group">
            <div className="w-10 h-10 rounded-xl bg-brand-veryLight text-brand-primary flex items-center justify-center font-bold text-sm mb-4">
              04
            </div>
            <h3 className="font-display font-bold text-lg text-brand-text group-hover:text-brand-primary transition-colors">
              Prepare ATS Resumes
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-brand-muted leading-relaxed">
              Build resumes using ATS-optimized templates in our split-screen editor. Directly import verified portfolio projects into your resume.
            </p>
            <div className="mt-4 text-xs font-semibold text-brand-primary flex items-center gap-1">
              <span>ATS-tested formats</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Card>

          {/* Step 5: Analyze */}
          <Card hoverable className="relative overflow-hidden group">
            <div className="w-10 h-10 rounded-xl bg-brand-veryLight text-brand-primary flex items-center justify-center font-bold text-sm mb-4">
              05
            </div>
            <h3 className="font-display font-bold text-lg text-brand-text group-hover:text-brand-primary transition-colors">
              AI ATS Scoring
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-brand-muted leading-relaxed">
              Compare your resume against any target Job Description using backend Gemini AI. Discover matched keywords and missing skills before applying.
            </p>
            <div className="mt-4 text-xs font-semibold text-brand-primary flex items-center gap-1">
              <span>Actionable insights</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Card>

          {/* Step 6: Apply & Get Hired */}
          <Card hoverable className="relative overflow-hidden group">
            <div className="w-10 h-10 rounded-xl bg-brand-veryLight text-brand-primary flex items-center justify-center font-bold text-sm mb-4">
              06
            </div>
            <h3 className="font-display font-bold text-lg text-brand-text group-hover:text-brand-primary transition-colors">
              Apply & Track Offers
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-brand-muted leading-relaxed">
              Find curated internships and entry-level positions. Track every application from Applied to Interview to Offer in your student workspace.
            </p>
            <div className="mt-4 text-xs font-semibold text-brand-primary flex items-center gap-1">
              <span>Kanban tracking</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Card>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. FEATURED PROJECT DISCOVERY SECTION */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <Badge variant="cyan" size="sm" className="mb-2">
              Curated Showcase
            </Badge>
            <h2 className="text-3xl font-display font-bold text-brand-text">
              What Should You Build Next?
            </h2>
            <p className="mt-2 text-sm text-brand-muted max-w-xl">
              Explore vetted projects with clear objectives, architecture guidelines, and tech stacks.
            </p>
          </div>

          <Link to="/projects">
            <Button variant="outline" rightIcon={ArrowRight} className="text-xs">
              View All 150+ Projects
            </Button>
          </Link>
        </div>

        {/* Domain Filter Pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {domainFilters.map((df) => (
            <button
              key={df.id}
              onClick={() => setSelectedDomain(df.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedDomain === df.id
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-brand-border hover:bg-slate-50'
              }`}
            >
              {df.label}
            </button>
          ))}
        </div>

        {/* Project Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} {...project} />
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. RESUME BUILDER & AI ATS ANALYZER FEATURETTE */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-brand-veryLight via-white to-sky-50 border border-brand-border shadow-card">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="primary" size="sm" className="mb-3">
              Career Preparation
            </Badge>
            <h2 className="text-3xl font-display font-extrabold text-brand-text">
              Build an ATS-Proof Resume with Live AI Feedback
            </h2>
            <p className="mt-3 text-sm text-brand-muted">
              Never guess whether your resume will pass applicant tracking systems again.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left: Resume Builder Preview Mockup */}
            <div className="bg-white rounded-2xl border border-brand-border p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-brand-border mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-brand-primary" />
                  <span className="font-semibold text-sm text-brand-text">Interactive Split-Pane Builder</span>
                </div>
                <Badge variant="approved" size="sm">
                  ATS Verified
                </Badge>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">1. Personal Info & Headline</span>
                  <Check className="w-4 h-4 text-brand-success" />
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">2. Highlighted Showcase Projects</span>
                  <span className="text-[11px] font-semibold text-brand-primary">Imported from Portfolio</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">3. Skills Matrix & Frameworks</span>
                  <Check className="w-4 h-4 text-brand-success" />
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-brand-border flex items-center justify-between">
                <span className="text-xs text-brand-muted">One-click clean PDF export</span>
                <Link to="/templates">
                  <Button size="sm" variant="outline" rightIcon={ArrowRight}>
                    Browse Templates
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right: AI ATS Analyzer Mockup */}
            <div className="bg-white rounded-2xl border border-brand-border p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-brand-border mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-primary" />
                  <span className="font-semibold text-sm text-brand-text">Google Gemini ATS Analyzer</span>
                </div>
                <span className="text-xs font-bold text-brand-primary bg-brand-veryLight px-2.5 py-1 rounded-full border border-brand-border">
                  Score: 84 / 100
                </span>
              </div>

              {/* Matched vs Missing */}
              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-success" />
                    <span>Matched Competencies (8)</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {['FastAPI', 'React', 'REST APIs', 'PostgreSQL', 'Docker'].map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200 text-[11px]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Missing Target Keywords (2)</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {['Redis Caching', 'CI/CD Pipeline'].map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[11px]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-brand-veryLight rounded-lg border border-brand-border text-xs text-brand-text leading-relaxed">
                  <strong>AI Suggestion:</strong> Add metrics to your "AI Resume Matcher" project (e.g. <em>"achieved 92% extraction accuracy"</em>).
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-brand-border flex items-center justify-between">
                <span className="text-xs text-brand-muted">Private backend analysis</span>
                <Link to="/login">
                  <Button size="sm" variant="primary" rightIcon={ArrowRight}>
                    Try ATS Scorer
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. CURATED JOBS & INTERNSHIPS SHOWCASE */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <Badge variant="primary" size="sm" className="mb-2">
              Verified Opportunities
            </Badge>
            <h2 className="text-3xl font-display font-bold text-brand-text">
              Jobs & Internships Tailored for Students
            </h2>
            <p className="mt-2 text-sm text-brand-muted max-w-xl">
              No senior roles disguised as entry-level. Every opportunity is curated for college students and recent grads.
            </p>
          </div>

          <Link to="/jobs">
            <Button variant="outline" rightIcon={ArrowRight} className="text-xs">
              Explore All Jobs
            </Button>
          </Link>
        </div>

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredJobs.map((job) => (
            <JobCard key={job.id} {...job} />
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. STUDENT SUCCESS STORIES / TESTIMONIALS */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="cyan" size="sm" className="mb-3">
            Real Student Outcomes
          </Badge>
          <h2 className="text-3xl font-display font-bold text-brand-text">
            Proven Results Across Campuses
          </h2>
          <p className="mt-2 text-sm text-brand-muted">
            See how students leveraged project showcases and ATS scoring to land real tech jobs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-amber-500 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 italic leading-relaxed">
                “Building the Cloud-Native Observability project and linking my verified showcase directly on my resume was the exact talking point that landed my Stripe interview.”
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-brand-border flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-500 text-white font-bold text-xs flex items-center justify-center">
                SL
              </div>
              <div>
                <div className="text-xs font-bold text-brand-text">Sarah Lin</div>
                <div className="text-[11px] text-brand-muted">Software Engineer @ Stripe (UC Berkeley '24)</div>
              </div>
            </div>
          </Card>

          <Card className="flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-amber-500 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 italic leading-relaxed">
                “The ATS Analyzer pointed out 4 critical missing keywords for entry-level React roles. After updating my resume bullets, I received 3 callback invitations in two weeks.”
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-brand-border flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-cyan-500 text-white font-bold text-xs flex items-center justify-center">
                AC
              </div>
              <div>
                <div className="text-xs font-bold text-brand-text">Alex Chen</div>
                <div className="text-[11px] text-brand-muted">Frontend Intern @ Nexa AI (UT Austin '25)</div>
              </div>
            </div>
          </Card>

          <Card className="flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-amber-500 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 italic leading-relaxed">
                “I didn't have a traditional target-school degree, but sharing my public profile link with verified code archives proved my competency immediately to recruiters.”
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-brand-border flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center">
                DM
              </div>
              <div>
                <div className="text-xs font-bold text-brand-text">David Miller</div>
                <div className="text-[11px] text-brand-muted">Junior Backend Dev @ CloudScale Labs</div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FINAL HIGH-CONVERTING CTA BANNER */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-600 p-8 sm:p-16 text-center text-white shadow-xl">
          {/* Subtle background circles */}
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 rounded-full bg-cyan-400/20 blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Start Your Journey
            </div>

            <h2 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight">
              Ready to move your career forward today?
            </h2>

            <p className="text-sm sm:text-lg text-blue-100 leading-relaxed">
              Join thousands of students turning practical projects into real job offers.
              Free for students worldwide.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              {isAuthenticated ? (
                <Link to={getDashboardPath(user)} className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto bg-white text-brand-primary hover:bg-slate-50 font-bold px-8 py-3.5 shadow-lg">
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <Link to="/register" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto bg-white text-brand-primary hover:bg-slate-50 font-bold px-8 py-3.5 shadow-lg">
                    Get Started Free
                  </Button>
                </Link>
              )}
              <Link to="/projects" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-white border-white/60 hover:bg-white/10 px-8 py-3.5">
                  Browse Project Showcase
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
