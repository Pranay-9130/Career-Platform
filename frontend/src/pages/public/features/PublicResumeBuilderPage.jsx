import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Download,
  Eye,
  Sliders,
  Award,
  Layers,
  Check,
  ShieldCheck,
  Lock,
  Printer,
  Info,
  BookOpen,
} from 'lucide-react';
import { Button, Card, Badge } from '@/components/common';
import { useAuth } from '@/context/AuthContext';
import SEO from '@/components/common/SEO';
import { getBreadcrumbListSchema } from '@/utils/seoSchemas';

const SAMPLE_TEMPLATES = [
  {
    id: 'modern-tech',
    name: 'Modern Tech Standard',
    tag: 'Popular for Tech & Software Roles',
    badge: 'ATS-Optimized',
    description: 'Clean single-column layout prioritizing technical skills, GitHub repositories, and quantifiable project metrics.',
    previewHighlights: ['Prominent Skills Grid', 'Tech Stack Badges', 'Repository Links'],
  },
  {
    id: 'minimal-executive',
    name: 'Minimal Clean',
    tag: 'Classic Engineering & Academic',
    badge: 'Universal ATS Score: 98%',
    description: 'Minimalist typography, structured headings, and high contrast designed to pass all automated parsers without formatting traps.',
    previewHighlights: ['Zero Parser Traps', 'Clean Hierarchies', 'Compact Spacing'],
  },
  {
    id: 'full-stack-showcase',
    name: 'Project-First Showcase',
    tag: 'Designed for Student Portfolios',
    badge: 'Portfolio Ready',
    description: 'Emphasizes practical development blueprints, deployed web demo links, and architecture decisions before work history.',
    previewHighlights: ['Live Demo Links', 'Architecture Callouts', 'Impact Points'],
  },
];

export default function PublicResumeBuilderPage() {
  const { isAuthenticated } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState(SAMPLE_TEMPLATES[0]);

  const workflowSteps = [
    {
      step: '01',
      title: 'Pick an ATS-Vetted Template',
      desc: 'Select from standardized, clean templates tested against leading Applicant Tracking Systems with zero table or column parsing traps.',
    },
    {
      step: '02',
      title: 'Auto-Fill from Profile or Projects',
      desc: 'Sync verified skills and published project blueprints directly from your AspirePath profile with a single click.',
    },
    {
      step: '03',
      title: 'Real-Time Split Screen Preview',
      desc: 'Edit contact information, work experience, and bullet points on the left while observing the pixel-perfect PDF rendering on the right.',
    },
    {
      step: '04',
      title: 'One-Click Vector PDF Export',
      desc: 'Generate lightweight, selectable vector PDF documents formatted to industry recruitment standards ready to submit anywhere.',
    },
  ];

  return (
    <div className="space-y-20 pb-24 overflow-hidden">
      <SEO
        title="Resume Builder | AspirePath"
        description="Build ATS-friendly, professional resumes with split-screen live preview, standardized templates, and one-click PDF export."
        canonical="/features/resume-builder"
        schema={[getBreadcrumbListSchema([
          { name: 'Home', item: '/' },
          { name: 'Features', item: '/features/resume-builder' },
          { name: 'Resume Builder', item: '/features/resume-builder' },
        ])]}
      />

      {/* Hero Header */}
      <section className="relative pt-10 sm:pt-16 lg:pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[320px] bg-gradient-to-tr from-blue-200/40 via-indigo-100/30 to-transparent blur-3xl pointer-events-none -z-10 rounded-full" />

        <div className="text-center max-w-3xl mx-auto">
          <Badge variant="primary" size="sm" className="mb-4">
            <FileText className="w-3.5 h-3.5 mr-1 text-brand-primary" />
            ATS-Engineered Resumes
          </Badge>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-extrabold text-brand-text tracking-tight leading-[1.15]">
            Professional Resume Builder
          </h1>

          <p className="mt-5 text-base sm:text-xl text-brand-muted leading-relaxed">
            Create, customize, and maintain ATS-compliant technical resumes. Leverage split-screen editing, verified templates, and one-click PDF generation.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link to="/resume-builder">
                <Button size="lg" variant="gradient" rightIcon={ArrowRight} className="font-bold px-8 shadow-card">
                  Open Resume Builder
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register?redirect=/resume-builder">
                  <Button size="lg" variant="gradient" rightIcon={ArrowRight} className="font-bold px-8 shadow-card">
                    Get Started Free
                  </Button>
                </Link>
                <Link to="/login?redirect=/resume-builder">
                  <Button size="lg" variant="outline" className="font-semibold px-6 bg-white">
                    Sign In to Build
                  </Button>
                </Link>
              </>
            )}
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-brand-muted">
            <ShieldCheck className="w-4 h-4 text-brand-primary" />
            <span>Tested against Greenhouse, Lever & Workday • Selectable PDF text • Zero watermarks</span>
          </div>
        </div>
      </section>

      {/* Interactive Demonstration Section: Split-Screen Editor Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-brand-border shadow-card overflow-hidden">
          {/* Header Bar */}
          <div className="bg-slate-50 border-b border-brand-border px-6 py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              <span>Interactive Split-Screen Editor Simulation</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-brand-border text-[11px] font-bold text-brand-primary">
              <Info className="w-3.5 h-3.5" />
              <span>Sample Demonstration</span>
            </div>
          </div>

          <div className="p-6 sm:p-10 space-y-8">
            {/* Template Selector Bar */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                Choose a Template to Preview:
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {SAMPLE_TEMPLATES.map((tmpl) => {
                  const active = selectedTemplate.id === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => setSelectedTemplate(tmpl)}
                      className={`text-left p-4 rounded-2xl border transition-all ${
                        active
                          ? 'border-brand-primary bg-brand-veryLight ring-2 ring-brand-primary/20 shadow-xs'
                          : 'border-brand-border bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-brand-text">{tmpl.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-brand-primary">
                          {tmpl.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-brand-muted line-clamp-2">
                        {tmpl.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Split Screen Simulation */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Form Controls (Mocked) */}
              <div className="lg:col-span-5 bg-slate-50/70 border border-slate-200/90 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Editor Form Sections
                  </span>
                  <Badge variant="cyan" size="sm">Auto-Sync</Badge>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Full Name</label>
                    <input
                      type="text"
                      readOnly
                      value="Alex Rivera"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-brand-border text-slate-800 font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Professional Title</label>
                    <input
                      type="text"
                      readOnly
                      value="Full Stack Software Engineer"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-brand-border text-slate-800 font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Verified Technical Skills</label>
                    <div className="flex flex-wrap gap-1 p-2 rounded-xl bg-white border border-brand-border">
                      {['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Tailwind CSS', 'Docker'].map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded-md bg-blue-50 text-brand-primary text-[11px] font-semibold">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Showcase Project</label>
                    <div className="p-3 rounded-xl bg-white border border-brand-border space-y-1">
                      <p className="font-bold text-brand-text text-xs">E-Commerce Microservices Platform</p>
                      <p className="text-[11px] text-brand-muted">
                        • Built event-driven checkout processing 1,200 requests/sec with Redis queue.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-slate-500 italic">
                  * Authenticated student accounts can auto-populate projects and confirmed skills from their workspace with one click.
                </div>
              </div>

              {/* Right Column: Live PDF Document Paper Preview */}
              <div className="lg:col-span-7 bg-white border border-slate-300 rounded-2xl p-6 sm:p-8 shadow-md space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-slate-700">Live Vector PDF Render</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-brand-primary">
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF Export Ready</span>
                  </div>
                </div>

                {/* Paper Content */}
                <div className="space-y-5 text-slate-800 text-xs">
                  {/* Header */}
                  <div className="text-center space-y-1 border-b border-slate-200 pb-4">
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">Alex Rivera</h2>
                    <p className="text-xs text-brand-primary font-semibold">Full Stack Software Engineer</p>
                    <p className="text-[11px] text-slate-500">
                      San Francisco, CA • alex.rivera@example.com • github.com/alexrivera • linkedin.com/in/alexrivera
                    </p>
                  </div>

                  {/* Summary */}
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5">
                      Professional Summary
                    </h3>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      Results-oriented Software Engineer with practical experience designing resilient microservices, responsive web frontends, and automated testing suites. Proven capability building real-world projects with clean architecture.
                    </p>
                  </div>

                  {/* Technical Skills */}
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5">
                      Technical Skills
                    </h3>
                    <p className="text-[11px] text-slate-700">
                      <strong className="text-slate-900">Languages & Frameworks:</strong> React, TypeScript, JavaScript (ES6+), Node.js, Express, Python, Tailwind CSS
                    </p>
                    <p className="text-[11px] text-slate-700">
                      <strong className="text-slate-900">Databases & Tools:</strong> PostgreSQL, MongoDB, Redis, Docker, Git, REST APIs, Jest
                    </p>
                  </div>

                  {/* Featured Projects */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5">
                      Featured Software Projects
                    </h3>
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>E-Commerce Microservices Platform</span>
                        <span className="text-slate-500 font-normal">React, Node.js, Redis, Docker</span>
                      </div>
                      <ul className="list-disc list-inside text-slate-600 space-y-0.5 pl-1">
                        <li>Architected event-driven order processing handling 1,200+ requests/minute with 99.9% uptime.</li>
                        <li>Implemented JWT session token renewal and role-based access control protecting critical endpoints.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Authenticated CTA Prompt */}
            <div className="rounded-2xl bg-brand-veryLight border border-brand-border p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white text-brand-primary border border-brand-border flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 text-brand-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-brand-text">
                    Create and download your own ATS resume
                  </h4>
                  <p className="text-xs text-brand-muted">
                    Sign in to customize your profile, store multiple resume versions, and export high-res vector PDFs instantly.
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-3 w-full sm:w-auto">
                <Link to="/register?redirect=/resume-builder" className="w-full sm:w-auto">
                  <Button variant="gradient" size="sm" rightIcon={ArrowRight} className="w-full sm:w-auto font-bold px-6">
                    Create My Resume Free
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How the Resume Builder Works Workflow */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="primary" size="sm" className="mb-2">
            Structured Workflow
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-brand-text">
            How the Resume Builder Works
          </h2>
          <p className="mt-2 text-sm text-brand-muted">
            From initial draft to recruiter-ready vector PDF in four deliberate steps.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {workflowSteps.map((step) => (
            <Card key={step.step} className="p-6 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-brand-primary border border-brand-border font-bold text-xs flex items-center justify-center">
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
        <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-brand-primary to-cyan-600 p-8 sm:p-12 text-center text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-5">
            <h2 className="text-2xl sm:text-4xl font-display font-extrabold">
              Build an ATS-Approved Resume Today
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              Never get filtered out by outdated formatting again. 100% free for all students and developers.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <Link to="/register?redirect=/resume-builder">
                <Button size="lg" variant="white" className="!bg-white !text-blue-700 font-bold px-8">
                  Get Started Free
                </Button>
              </Link>
              <Link to="/templates">
                <Button size="lg" variant="outline" className="text-white border-white/60 hover:bg-white/10 px-6">
                  Browse All Templates
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

