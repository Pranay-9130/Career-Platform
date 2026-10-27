import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Target,
  Eye,
  ShieldCheck,
  Users,
  Briefcase,
  GraduationCap,
  Layers,
  HeartHandshake,
  CheckCircle2,
  FileText,
  BrainCircuit,
  FolderGit2,
  Award,
  BookOpen,
  Check,
  Search,
  Code2,
  ChevronRight,
  Clock,
  Compass,
} from 'lucide-react';
import { Button, Card, Badge } from '@/components/common';
import { useAuth } from '@/context/AuthContext';
import SEO from '@/components/common/SEO';
import { getOrganizationSchema, getBreadcrumbListSchema } from '@/utils/seoSchemas';
import { getDashboardPath } from '@/utils/navigation';

export default function AboutPage() {
  const { isAuthenticated, user } = useAuth();

  const coreFeatures = [
    {
      id: 'resume-builder',
      title: 'Resume Builder',
      icon: FileText,
      color: 'bg-blue-50 text-brand-primary',
      badge: 'Interactive Editor',
      description:
        'Create clean, structured resumes designed specifically to be readable by Applicant Tracking Systems. Edit personal details, education, experience, and import verified portfolio projects directly with one-click PDF export.',
      route: '/resume-builder',
      actionText: 'Open Builder',
    },
    {
      id: 'ats-analyzer',
      title: 'ATS Resume Analyzer',
      icon: Sparkles,
      color: 'bg-cyan-50 text-brand-cyan',
      badge: 'Semantic Scoring',
      description:
        'Compare your resume against real job descriptions using Google Gemini AI. Receive a breakdown of matched keywords, missing competencies, and concrete advice on how to improve your bullet points before applying.',
      route: '/ats-analyzer',
      actionText: 'Scan a Resume',
    },
    {
      id: 'skill-intelligence',
      title: 'Skill Intelligence',
      icon: BrainCircuit,
      color: 'bg-indigo-50 text-indigo-600',
      badge: 'Deterministic Math',
      description:
        'Extract skills from your resume, choose from 13 standard engineering career tracks (Frontend, Backend, AI, Cloud, DevOps, etc.), and receive an objective match score evaluated against essential and complementary requirements.',
      route: '/login',
      actionText: 'Explore Roles',
    },
    {
      id: 'ai-mentor',
      title: 'AI Career Mentor',
      icon: Compass,
      color: 'bg-purple-50 text-purple-600',
      badge: 'Conversational Coach',
      description:
        'An authenticated multi-turn assistant grounded in your confirmed competencies, target role, and platform projects. Clarifies technical prerequisites, suggests study schedules, and helps navigate challenging architectural decisions.',
      route: '/login',
      actionText: 'Ask the Mentor',
    },
    {
      id: 'learning-roadmap',
      title: 'Personalized Roadmap',
      icon: Layers,
      color: 'bg-emerald-50 text-emerald-600',
      badge: 'Topological Sequencing',
      description:
        'An ordered 4-stage engineering roadmap respecting prerequisite tools before frameworks and testing. Features verified documentation links, practice tasks, and interactive status tracking (Not Started, Learning, Practiced, Completed).',
      route: '/login',
      actionText: 'View Roadmap',
    },
    {
      id: 'project-hub',
      title: 'Project Hub',
      icon: FolderGit2,
      color: 'bg-amber-50 text-amber-600',
      badge: 'Hands-On Code',
      description:
        'Discover production-grade project specifications and blueprints. Submit your own code showcases with live demos, tech stack tags, and architecture summaries to demonstrate practical ability over passive certificates.',
      route: '/projects',
      actionText: 'Browse Projects',
    },
    {
      id: 'jobs-internships',
      title: 'Jobs & Internships',
      icon: Briefcase,
      color: 'bg-sky-50 text-sky-600',
      badge: 'Curated Opportunities',
      description:
        'Discover verified entry-level and internship listings. Apply through legitimate employer destinations and organize your applications across Applied, Interview, and Offer stages in your student dashboard.',
      route: '/jobs',
      actionText: 'View Opportunities',
    },
    {
      id: 'resume-templates',
      title: 'Resume Templates',
      icon: BookOpen,
      color: 'bg-slate-100 text-slate-700',
      badge: 'ATS-Tested Layouts',
      description:
        'Choose from battle-tested single-column and dual-column layouts designed to parse cleanly in ATS systems without parsing errors or graphical column misalignments.',
      route: '/templates',
      actionText: 'Explore Templates',
    },
    {
      id: 'career-readiness',
      title: 'Career Readiness Track',
      icon: Award,
      color: 'bg-rose-50 text-rose-600',
      badge: 'Holistic Milestone',
      description:
        'Track your comprehensive career readiness across five transparent criteria: Complete Profile (20%), ATS Resume (20%), Confirmed Skills (20%), Verified Projects (25%), and Active Applications (15%).',
      route: '/login',
      actionText: 'Check Readiness',
    },
  ];

  const studentJourneySteps = [
    {
      num: '01',
      title: 'Create Profile',
      desc: 'Set up your student account, headline, and target career interests.',
    },
    {
      num: '02',
      title: 'Build or Upload Resume',
      desc: 'Import an existing PDF or create an ATS-friendly resume in our builder.',
    },
    {
      num: '03',
      title: 'Select Target Career Goal',
      desc: 'Pick your desired role (e.g. Frontend, Backend, Python, AI Engineer).',
    },
    {
      num: '04',
      title: 'Analyze Skills & Gaps',
      desc: 'Extract your competencies and calculate deterministic role alignment.',
    },
    {
      num: '05',
      title: 'Learn Missing Skills',
      desc: 'Follow an ordered roadmap with verified official documentation and tasks.',
    },
    {
      num: '06',
      title: 'Build Practical Projects',
      desc: 'Implement showcase applications to prove hands-on engineering ability.',
    },
    {
      num: '07',
      title: 'Explore Opportunities',
      desc: 'Find curated internships and junior positions matching your stack.',
    },
    {
      num: '08',
      title: 'Track Progress & Reassess',
      desc: 'Monitor application stages and reassess your career fit as you learn.',
    },
  ];

  const targetAudiences = [
    {
      title: 'College & University Students',
      badge: 'Undergraduate & Graduate',
      icon: GraduationCap,
      description:
        'Computer science, software engineering, and STEM students seeking to bridge the gap between academic theory and the practical demands of commercial engineering.',
    },
    {
      title: 'Students Preparing for Internships',
      badge: 'Summer & Co-op',
      icon: Briefcase,
      description:
        'Learners looking for structured guidance on what projects to build, how to format their resume bullets, and which technologies to prioritize before recruitment cycles.',
    },
    {
      title: 'Fresh Graduates & Entry-Level Job Seekers',
      badge: 'Early Career',
      icon: Award,
      description:
        'New graduates seeking full-time junior developer positions without getting lost in keyword-only ATS screens or ambiguous job requirements.',
    },
    {
      title: 'Self-Taught & Portfolio Builders',
      badge: 'Skill Switchers',
      icon: Code2,
      description:
        'Motivated developers looking to prove their technical capability through verified, runnable code showcases rather than relying solely on institutional prestige.',
    },
  ];

  const valueProps = [
    {
      title: 'Resume Improvement',
      desc: 'ATS-tested templates and semantic keyword matching to ensure your resume accurately represents your abilities.',
    },
    {
      title: 'Career-Focused Skill Discovery',
      desc: 'Objective, mathematical role fit analysis against verified industry competencies instead of vague guesses.',
    },
    {
      title: 'Practical Learning',
      desc: 'Curated references to official documentation and tutorials that teach industry standards.',
    },
    {
      title: 'Project-Based Development',
      desc: 'Blueprint specifications and showcase submissions that provide concrete proof of coding competence.',
    },
    {
      title: 'Opportunity Discovery',
      desc: 'Curated internships and junior roles specifically suited for students and early-career engineers.',
    },
    {
      title: 'Progress Tracking',
      desc: 'Integrated readiness criteria and persistent skill tracking that celebrate incremental milestones.',
    },
  ];

  return (
    <div className="py-12 sm:py-16 space-y-24 sm:space-y-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <SEO
        title="About AspirePath | Mission, Architecture & Features"
        description="AspirePath is a student-focused career development platform that brings resume building, ATS analysis, skill intelligence, learning roadmaps, practical projects, and opportunity discovery into one connected experience."
        canonical="/about"
        schema={[
          getOrganizationSchema(),
          getBreadcrumbListSchema([
            { name: 'Home', path: '/' },
            { name: 'About', path: '/about' },
          ]),
        ]}
      />

      {/* ========================================================================= */}
      {/* 1. HERO / ABOUT CAREERPLATFORM */}
      {/* ========================================================================= */}
      <section className="text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-veryLight border border-brand-border text-brand-primary text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>About AspirePath</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-brand-text tracking-tight leading-[1.15]">
          A Unified Platform for{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-cyan">
            Student Career Development.
          </span>
        </h1>
        <p className="text-base sm:text-lg text-brand-muted leading-relaxed max-w-3xl mx-auto">
          AspirePath is a student-focused career development platform designed to help learners prepare for internships and job opportunities. It brings resume building, ATS analysis, skill-gap discovery, personalized learning, practical projects, and opportunity discovery into one connected experience.
        </p>
      </section>

      {/* ========================================================================= */}
      {/* 2. MISSION & VISION */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-8 sm:p-10 border-blue-200 bg-gradient-to-br from-white via-white to-blue-50/40 shadow-card space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-primary text-white flex items-center justify-center shadow-sm">
            <Target className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-display font-bold text-brand-text">Our Mission</h2>
          <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
            Our mission is to make career preparation more accessible by helping students understand their current skills, identify gaps, and take practical steps toward their career goals.
          </p>
        </Card>

        <Card className="p-8 sm:p-10 border-cyan-200 bg-gradient-to-br from-white via-white to-cyan-50/40 shadow-card space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-cyan text-white flex items-center justify-center shadow-sm">
            <Eye className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-display font-bold text-brand-text">Our Vision</h2>
          <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
            Our vision is to create a connected career development experience where students can learn, practice, demonstrate their abilities, and discover opportunities.
          </p>
        </Card>
      </section>

      {/* ========================================================================= */}
      {/* 3. DEDICATED SECTIONS FOR EVERY MAJOR FEATURE */}
      {/* ========================================================================= */}
      <section className="space-y-12">
        <div className="text-center max-w-2xl mx-auto">
          <Badge variant="primary" size="sm" className="mb-2">
            Complete Architecture
          </Badge>
          <h2 className="text-3xl font-display font-extrabold text-brand-text">
            Core Platform Modules
          </h2>
          <p className="mt-2 text-sm text-brand-muted">
            Explore every major feature implemented in AspirePath and how each serves your career preparation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coreFeatures.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.id} hoverable className="p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${f.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <Badge variant="neutral" size="sm">
                      {f.badge}
                    </Badge>
                  </div>
                  <h3 className="font-display font-bold text-lg text-brand-text">{f.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {f.description}
                  </p>
                </div>
                <div className="pt-3 border-t border-brand-border">
                  <Link to={f.route} className="text-xs font-bold text-brand-primary flex items-center gap-1 hover:underline">
                    <span>{f.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. THE STUDENT JOURNEY */}
      {/* ========================================================================= */}
      <section className="bg-slate-50 border border-slate-200/80 rounded-3xl p-8 sm:p-12 space-y-10">
        <div className="text-center max-w-2xl mx-auto">
          <Badge variant="cyan" size="sm" className="mb-2">
            The Continuous Pathway
          </Badge>
          <h2 className="text-3xl font-display font-bold text-brand-text">
            The 8-Step Student Journey
          </h2>
          <p className="mt-2 text-sm text-brand-muted">
            From initial setup to job discovery, each step naturally reinforces the next.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {studentJourneySteps.map((step) => (
            <div key={step.num} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-bold text-brand-primary font-mono">{step.num}</span>
              <h3 className="text-sm font-bold text-brand-text">{step.title}</h3>
              <p className="text-xs text-brand-muted leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. WHO CAN USE CAREERPLATFORM */}
      {/* ========================================================================= */}
      <section className="space-y-10">
        <div className="text-center max-w-2xl mx-auto">
          <Badge variant="primary" size="sm" className="mb-2">
            Who It's For
          </Badge>
          <h2 className="text-3xl font-display font-bold text-brand-text">
            Built for Early-Career Engineers
          </h2>
          <p className="mt-2 text-sm text-brand-muted">
            Designed to empower students and technical learners at every stage of their transition into technology.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {targetAudiences.map((aud) => {
            const Icon = aud.icon;
            return (
              <Card key={aud.title} className="p-6 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <Badge variant="neutral" size="sm">
                      {aud.badge}
                    </Badge>
                  </div>
                  <h3 className="text-base font-display font-bold text-brand-text">{aud.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {aud.description}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. WHAT MAKES CAREERPLATFORM USEFUL */}
      {/* ========================================================================= */}
      <section className="space-y-10">
        <div className="text-center max-w-2xl mx-auto">
          <Badge variant="cyan" size="sm" className="mb-2">
            The Connected Value
          </Badge>
          <h2 className="text-3xl font-display font-bold text-brand-text">
            Why a Connected Workflow Matters
          </h2>
          <p className="mt-2 text-sm text-brand-muted">
            Most career tools exist in silos. AspirePath brings the entire process together.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {valueProps.map((vp) => (
            <Card key={vp.title} className="p-6 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-primary shrink-0" />
                <h3 className="font-bold text-sm text-brand-text">{vp.title}</h3>
              </div>
              <p className="text-xs text-brand-muted leading-relaxed pl-6">{vp.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. CONTACT & CALL TO ACTION */}
      {/* ========================================================================= */}
      <section className="text-center p-8 sm:p-14 rounded-3xl bg-gradient-to-r from-brand-primary to-brand-cyan text-white space-y-6 shadow-xl">
        <h2 className="text-2xl sm:text-4xl font-display font-extrabold tracking-tight">
          Ready to Start Your Career Journey?
        </h2>
        <p className="text-sm sm:text-base text-blue-100 max-w-xl mx-auto leading-relaxed">
          Create your profile, analyze your target role fit, practice with real project blueprints, and prepare for your next opportunity.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          {isAuthenticated ? (
            <Link to={getDashboardPath(user)}>
              <Button size="lg" className="bg-white text-brand-primary hover:bg-slate-50 font-bold px-8 shadow-md">
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <Link to="/register">
              <Button size="lg" className="bg-white text-brand-primary hover:bg-slate-50 font-bold px-8 shadow-md">
                Get Started Free
              </Button>
            </Link>
          )}
          <Link to="/contact">
            <Button size="lg" variant="outline" className="text-white border-white/60 hover:bg-white/10 px-8 font-semibold">
              Contact Our Team
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
