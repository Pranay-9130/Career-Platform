import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  FileCheck,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FileText,
  UploadCloud,
  Check,
  ShieldCheck,
  TrendingUp,
  Sliders,
  Layers,
  Award,
  Lock,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Button, Card, Badge } from '@/components/common';
import { useAuth } from '@/context/AuthContext';
import SEO from '@/components/common/SEO';
import { getBreadcrumbListSchema } from '@/utils/seoSchemas';

export default function PublicAtsAnalyzerPage() {
  const { isAuthenticated } = useAuth();

  const sampleMatchedSkills = [
    'React.js',
    'JavaScript (ES6+)',
    'Tailwind CSS',
    'RESTful APIs',
    'Git & GitHub',
    'Responsive Web Design',
    'HTML5 & CSS3',
  ];

  const sampleMissingSkills = [
    'TypeScript',
    'Unit Testing (Jest/RTL)',
    'Docker Containerization',
    'CI/CD Pipelines',
  ];

  const sampleSuggestions = [
    {
      title: 'Include High-Impact Metrics',
      desc: 'Add quantifiable results to your project bullet points (e.g., "reduced initial load times by 42% using lazy-loading").',
      impact: 'High Impact',
    },
    {
      title: 'Target Core Technology Gaps',
      desc: 'TypeScript is required by 85% of modern Frontend Engineer openings. Add verified TypeScript projects to your portfolio.',
      impact: 'High Impact',
    },
    {
      title: 'ATS Formatting Standard',
      desc: 'Ensure section headings strictly follow industry conventions ("Experience", "Education", "Projects", "Skills").',
      impact: 'Medium Impact',
    },
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'Upload Resume PDF or Text',
      desc: 'Securely upload your current PDF resume or paste raw text. Our parser extracts text while maintaining structural integrity.',
    },
    {
      step: '02',
      title: 'Provide Target Job Description',
      desc: 'Paste any job posting from LinkedIn, Indeed, or your target company to compare requirements against your qualifications.',
    },
    {
      step: '03',
      title: 'Deterministic Match Evaluation',
      desc: 'Our scoring engine computes your ATS compatibility percentage, matching essential keywords and noting missing competencies.',
    },
    {
      step: '04',
      title: 'Actionable Improvement Roadmap',
      desc: 'Receive tailored, step-by-step suggestions to optimize keywords, improve phrasing, and maximize your interview callback rate.',
    },
  ];

  return (
    <div className="space-y-20 pb-24 overflow-hidden">
      <SEO
        title="ATS Resume Analyzer | AspirePath"
        description="Analyze resumes, evaluate ATS compatibility, identify missing skills, and receive actionable improvement suggestions before applying to tech roles."
        canonical="/features/ats-analyzer"
        schema={[getBreadcrumbListSchema([
          { name: 'Home', item: '/' },
          { name: 'Features', item: '/features/ats-analyzer' },
          { name: 'ATS Resume Analyzer', item: '/features/ats-analyzer' },
        ])]}
      />

      {/* Hero Header */}
      <section className="relative pt-10 sm:pt-16 lg:pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[320px] bg-gradient-to-tr from-blue-200/40 via-cyan-100/30 to-transparent blur-3xl pointer-events-none -z-10 rounded-full" />

        <div className="text-center max-w-3xl mx-auto">
          <Badge variant="cyan" size="sm" className="mb-4">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-brand-primary animate-pulse" />
            AI-Assisted Career Tool
          </Badge>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-extrabold text-brand-text tracking-tight leading-[1.15]">
            ATS Resume Analyzer
          </h1>

          <p className="mt-5 text-base sm:text-xl text-brand-muted leading-relaxed">
            Evaluate your resume against target job requirements, discover missing keywords, and ensure your credentials pass through Applicant Tracking Systems.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link to="/ats-analyzer">
                <Button size="lg" variant="gradient" rightIcon={ArrowRight} className="font-bold px-8 shadow-card">
                  Open ATS Resume Analyzer
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register?redirect=/ats-analyzer">
                  <Button size="lg" variant="gradient" rightIcon={ArrowRight} className="font-bold px-8 shadow-card">
                    Get Started Free
                  </Button>
                </Link>
                <Link to="/login?redirect=/ats-analyzer">
                  <Button size="lg" variant="outline" className="font-semibold px-6 bg-white">
                    Sign In to Analyze
                  </Button>
                </Link>
              </>
            )}
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-brand-muted">
            <ShieldCheck className="w-4 h-4 text-brand-primary" />
            <span>Private & secure resume parsing • Zero data sharing with third parties</span>
          </div>
        </div>
      </section>

      {/* Preview Interactive Demonstration Box */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-brand-border shadow-card overflow-hidden">
          {/* Header pill banner */}
          <div className="bg-slate-50 border-b border-brand-border px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Interactive Interface Preview</span>
              <span className="text-slate-300">|</span>
              <span className="text-brand-muted font-normal">Sample Job: "Frontend React Engineer"</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-brand-border text-[11px] font-bold text-brand-primary">
              <Info className="w-3.5 h-3.5" />
              <span>Sample Demonstration</span>
            </div>
          </div>

          <div className="p-6 sm:p-10 space-y-8">
            {/* Score & Metrics Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Score Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50/80 via-white to-cyan-50/50 border border-brand-border flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-muted">
                    ATS Compatibility
                  </span>
                  <Badge variant="success" size="sm">High Match</Badge>
                </div>

                <div className="flex items-baseline gap-3 my-2">
                  <span className="text-5xl font-display font-extrabold text-brand-text">82</span>
                  <span className="text-lg font-bold text-slate-400">/ 100</span>
                </div>

                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-brand-primary to-brand-cyan h-full rounded-full w-[82%]" />
                </div>

                <p className="text-xs text-brand-muted leading-relaxed">
                  Strong keyword alignment for modern frontend stacks. Adding TypeScript and testing coverage will bring this score above 90.
                </p>
              </div>

              {/* Matched Skills Pill Card */}
              <div className="p-6 rounded-2xl bg-white border border-brand-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Matched Keywords ({sampleMatchedSkills.length})
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Verified
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {sampleMatchedSkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50/80 border border-emerald-200 text-xs font-medium text-emerald-800"
                    >
                      <Check className="w-3 h-3 text-emerald-600" />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Missing Skills Pill Card */}
              <div className="p-6 rounded-2xl bg-white border border-brand-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Missing Keywords ({sampleMissingSkills.length})
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                    Recommended
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {sampleMissingSkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50/80 border border-amber-200 text-xs font-medium text-amber-800"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Improvement Suggestions Breakdown */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-primary" />
                <h3 className="text-sm font-bold text-brand-text uppercase tracking-wider">
                  Sample Resume Improvement Suggestions
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sampleSuggestions.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-brand-text">{item.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-brand-primary">
                        {item.impact}
                      </span>
                    </div>
                    <p className="text-xs text-brand-muted leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Locked feature banner with CTA */}
            <div className="rounded-2xl bg-brand-veryLight border border-brand-border p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white text-brand-primary border border-brand-border flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 text-brand-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-brand-text">
                    Want to analyze your actual resume?
                  </h4>
                  <p className="text-xs text-brand-muted">
                    Sign in or create a free student profile to upload your PDF, compare target job descriptions, and save your results.
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-3 w-full sm:w-auto">
                <Link to="/register?redirect=/ats-analyzer" className="w-full sm:w-auto">
                  <Button variant="gradient" size="sm" rightIcon={ArrowRight} className="w-full sm:w-auto font-bold px-6">
                    Create Free Account
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How the ATS Analysis Works Workflow */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="primary" size="sm" className="mb-2">
            Deterministic Workflow
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-brand-text">
            How the ATS Resume Analyzer Works
          </h2>
          <p className="mt-2 text-sm text-brand-muted">
            Four systematic steps to ensure your technical skills and accomplishments resonate with recruiters and automated filters.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {workflowSteps.map((step) => (
            <Card key={step.step} className="p-6 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-brand-veryLight text-brand-primary border border-brand-border font-bold text-xs flex items-center justify-center">
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
              Ready to Test Your Resume?
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              Join thousands of aspiring developers optimizing their applications with AspirePath. Completely free for students.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <Link to="/register?redirect=/ats-analyzer">
                <Button size="lg" variant="white" className="!bg-white !text-blue-700 font-bold px-8">
                  Get Started Free
                </Button>
              </Link>
              <Link to="/features/skill-intelligence">
                <Button size="lg" variant="outline" className="text-white border-white/60 hover:bg-white/10 px-6">
                  Explore Skill Intelligence
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

