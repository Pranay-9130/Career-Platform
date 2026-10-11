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
} from 'lucide-react';
import { Button, Card, Badge } from '@/components/common';
import { useAuth } from '@/context/AuthContext';
import SEO from '@/components/common/SEO';
import { getOrganizationSchema, getBreadcrumbListSchema } from '@/utils/seoSchemas';

export default function AboutPage() {
  const { isAuthenticated } = useAuth();
  const personas = [
    {
      title: 'Students & Grads',
      badge: 'Primary Community',
      icon: GraduationCap,
      description:
        'College students, self-taught developers, and career switchers looking to break into technology without getting filtered out by keyword-only ATS screens.',
      bullet: 'Gain hands-on project blueprints, verified portfolios, and ATS-optimized resumes.',
    },
    {
      title: 'Technical Recruiters',
      badge: 'Talent Partners',
      icon: Users,
      description:
        'Talent acquisition teams seeking evidence of practical coding ability, structured problem-solving, and clean architectural design over buzzword-filled resumes.',
      bullet: 'Direct access to verified student code repositories and portfolio showcases.',
    },
    {
      title: 'Companies & Startups',
      badge: 'Hiring Providers',
      icon: Briefcase,
      description:
        'Forward-thinking companies looking to hire energetic junior engineers who have built real microservices, fullstack applications, and AI pipelines.',
      bullet: 'Transparent internship and entry-level job posting with qualified candidate matching.',
    },
    {
      title: 'Mentors & Alumni',
      badge: 'Future Ecosystem',
      icon: HeartHandshake,
      description:
        'Experienced engineers and alumni guiding the next generation of engineers through code reviews, architectural feedback, and career guidance.',
      bullet: 'Structured channels for constructive mentorship and mock interview preparation.',
    },
  ];

  const values = [
    {
      title: 'Practical Over Theoretical',
      desc: 'Classrooms teach theory; industry demands practical implementation. We prioritize runnable architectures, Docker containers, and clean APIs.',
    },
    {
      title: 'Institutional Equality',
      desc: 'Great engineering talent is everywhere. We level the playing field so your project quality and verified code speak louder than college pedigree.',
    },
    {
      title: 'Zero AI Gimmicks',
      desc: 'No fake scores or superficial keyword counters. Our ATS and career assistance runs deep backend analysis with transparent, actionable advice.',
    },
    {
      title: 'Security by Design',
      desc: 'Untrusted project archives are rigorously validated without server execution. Student credentials, API keys, and privacy are always safeguarded.',
    },
  ];

  return (
    <div className="py-12 sm:py-16 space-y-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <SEO
        title="About Our Mission & Platform"
        description="Learn about the Student Career Platform. Bridging the gap between university computer science education and practical engineering hiring."
        canonical="/about"
        schema={[
          getOrganizationSchema(),
          getBreadcrumbListSchema([
            { name: "Home", path: "/" },
            { name: "About Us", path: "/about" },
          ]),
        ]}
      />
      {/* 1. Header & Purpose */}
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-veryLight border border-brand-border text-brand-primary text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          Our Mission & Vision
        </div>
        <h1 className="text-4xl sm:text-5xl font-display font-extrabold text-brand-text tracking-tight">
          From Your First Project to Your{' '}
          <span className="text-transparent bg-clip-text gradient-brand">
            First Job.
          </span>
        </h1>
        <p className="text-base sm:text-lg text-brand-muted leading-relaxed">
          The Student Career Platform was founded to solve a single fundamental challenge:
          traditional computer science programs leave students stranded between theoretical homework
          and the demanding reality of industry engineering interviews.
        </p>
      </section>

      {/* 2. Mission & Vision Dual Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-8 sm:p-10 border-blue-200 bg-gradient-to-br from-white to-blue-50/40 shadow-card">
          <div className="w-12 h-12 rounded-2xl bg-brand-primary text-white flex items-center justify-center mb-6 shadow-sm">
            <Target className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-display font-bold text-brand-text mb-4">Our Mission</h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed italic">
            “To help every student discover their potential, build practical skills, showcase their work,
            and access better career opportunities regardless of their institutional background.”
          </p>
        </Card>

        <Card className="p-8 sm:p-10 border-cyan-200 bg-gradient-to-br from-white to-cyan-50/40 shadow-card">
          <div className="w-12 h-12 rounded-2xl bg-brand-cyan text-white flex items-center justify-center mb-6 shadow-sm">
            <Eye className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-display font-bold text-brand-text mb-4">Our Vision</h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed italic">
            “To become a trusted, world-class career development ecosystem where ambitious students build
            demonstrated engineering competence and transition seamlessly into high-impact tech careers.”
          </p>
        </Card>
      </section>

      {/* 3. The 6-Step Unified Journey */}
      <section className="p-8 sm:p-12 rounded-3xl bg-white border border-brand-border shadow-card space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-brand-text">
            The Continuous Pathway
          </h2>
          <p className="mt-2 text-sm text-brand-muted">
            Rather than treating projects, resumes, and job applications as isolated chores,
            we connect them into a single virtuous cycle.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
          {[
            { step: '01', title: 'Discover', desc: 'Curated ideas' },
            { step: '02', title: 'Build', desc: 'Guided specs' },
            { step: '03', title: 'Showcase', desc: 'Verified profile' },
            { step: '04', title: 'Prepare', desc: 'ATS resumes' },
            { step: '05', title: 'Apply', desc: 'Curated jobs' },
            { step: '06', title: 'Get Hired', desc: 'Track offers' },
          ].map((item) => (
            <div key={item.step} className="p-4 rounded-xl bg-brand-veryLight/60 border border-brand-border">
              <span className="text-xs font-bold text-brand-primary">{item.step}</span>
              <h3 className="mt-1 text-sm font-bold text-brand-text">{item.title}</h3>
              <p className="mt-1 text-[11px] text-brand-muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Target Personas */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <Badge variant="primary" size="sm" className="mb-2">
            Who We Serve
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-brand-text">
            Designed for the Entire Tech Career Community
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {personas.map((p) => {
            const Icon = p.icon;
            return (
              <Card key={p.title} className="p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-veryLight text-brand-primary flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <Badge variant="neutral" size="sm">
                      {p.badge}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-display font-bold text-brand-text mb-2">{p.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                    {p.description}
                  </p>
                </div>
                <div className="pt-3 border-t border-brand-border flex items-center gap-2 text-xs font-medium text-brand-primary">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{p.bullet}</span>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 5. Core Values */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <Badge variant="cyan" size="sm" className="mb-2">
            Guiding Principles
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-brand-text">
            Our Core Values
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((v, i) => (
            <Card key={v.title} className="p-6 space-y-3">
              <span className="text-xs font-bold text-brand-primary">0{i + 1}.</span>
              <h3 className="font-display font-bold text-base text-brand-text">{v.title}</h3>
              <p className="text-xs text-brand-muted leading-relaxed">{v.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* 6. Call to Action */}
      <section className="text-center p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-brand-primary to-brand-cyan text-white space-y-6 shadow-xl">
        <h2 className="text-2xl sm:text-4xl font-display font-extrabold">
          Ready to Start Your Career Journey?
        </h2>
        <p className="text-sm sm:text-base text-blue-100 max-w-xl mx-auto leading-relaxed">
          Explore curated projects, create your public portfolio, and prepare your ATS-proof resume today.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          {isAuthenticated ? (
            <Link to="/dashboard">
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
            <Button size="lg" variant="outline" className="text-white border-white/60 hover:bg-white/10 px-8">
              Contact Our Team
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
