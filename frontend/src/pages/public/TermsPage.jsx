import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  ShieldCheck,
  Scale,
  Lock,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  BookOpen,
  UserCheck,
  Briefcase,
  FolderGit2,
} from 'lucide-react';
import { Button, Badge, Breadcrumbs } from '@/components/common';
import SEO from '@/components/common/SEO';

export default function TermsPage() {
  const lastUpdated = 'November 22, 2026';

  const sections = [
    {
      id: 'acceptance',
      title: '1. Acceptance of Terms',
      icon: Scale,
      content: (
        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <p>
            Welcome to AspirePath (&quot;Platform&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). By creating an account,
            accessing, or using AspirePath through our website (<a href="https://aspirepath.vercel.app" className="text-brand-primary underline">https://aspirepath.vercel.app</a>)
            or associated services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service
            (&quot;Terms&quot;) and our Privacy Policy.
          </p>
          <p>
            These Terms apply to all registered students, job seekers, university placement coordinators, contributors,
            and visitors. If you do not agree with any part of these Terms, you must not use or access the Platform.
          </p>
        </div>
      ),
    },
    {
      id: 'eligibility',
      title: '2. User Accounts & Security',
      icon: UserCheck,
      content: (
        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <p>
            To access career development features, you must register an account with a valid email address and password.
            You agree to provide true, accurate, current, and complete information during registration and maintain its accuracy.
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li><strong>Credential Confidentiality:</strong> You are responsible for safeguarding your login credentials and for all activities that occur under your account.</li>
            <li><strong>Password Recovery & OTP:</strong> When initiating password recovery, identity verification is strictly enforced using single-use 6-digit cryptographic email OTPs. You must not share OTPs with third parties.</li>
            <li><strong>Account Transfer Prohibited:</strong> Accounts are personal to the registered student and cannot be transferred, leased, or assigned.</li>
            <li><strong>Notification of Breach:</strong> You must immediately notify AspirePath administrators if you suspect unauthorized access or security breaches.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'services',
      title: '3. Platform Services & Career Tools',
      icon: BookOpen,
      content: (
        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <p>
            AspirePath provides engineering students with deterministic career development tools designed to benchmark competencies,
            prepare for technical campus interviews, build ATS-optimized resumes, and publish verified projects.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="font-bold text-slate-800 block text-xs uppercase tracking-wide">ATS Resume Analyzer</span>
              <span className="text-xs text-slate-600">Deterministic keyword gap analysis and format compliance scoring against target job descriptions.</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="font-bold text-slate-800 block text-xs uppercase tracking-wide">Resume Builder</span>
              <span className="text-xs text-slate-600">Standardized ATS typography templates with direct export to ATS-readable vector PDFs.</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="font-bold text-slate-800 block text-xs uppercase tracking-wide">Skill Intelligence</span>
              <span className="text-xs text-slate-600">Mathematical role fit evaluation across 13 engineering disciplines with curated learning milestones.</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="font-bold text-slate-800 block text-xs uppercase tracking-wide">Placement Preparation</span>
              <span className="text-xs text-slate-600">Topic-wise practice questions and downloadable offline PDF interview revision guides.</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'intellectual-property',
      title: '4. Intellectual Property & Proof-of-Work Ownership',
      icon: FolderGit2,
      content: (
        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <p>
            <strong>You own your work.</strong> Students retain 100% intellectual property ownership of all source code, projects,
            resumes, documentation, and personal media uploaded or linked to AspirePath.
          </p>
          <p>
            By publishing a project in the Project Hub or enabling a public portfolio (e.g. <code>/u/username</code>), you grant
            AspirePath a non-exclusive, worldwide, royalty-free license to host, display, index, and showcase your project solely
            for the purposes of peer learning, employer recruitment showcases, and institutional placement reviews.
          </p>
          <p>
            You may remove or unpublish your projects from public visibility at any time through your student workspace.
          </p>
        </div>
      ),
    },
    {
      id: 'prohibited-conduct',
      title: '5. Prohibited Conduct & Submissions Policy',
      icon: AlertCircle,
      content: (
        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <p>To preserve integrity for all students and hiring recruiters, you agree NOT to:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li><strong>Hardcode Secrets or API Keys:</strong> Never submit project archives containing live API keys, AWS credentials, <code>.env</code> files, private certificates, or database passwords.</li>
            <li><strong>Plagiarize:</strong> Do not submit code or projects claiming sole authorship of work that is not yours. Third-party open-source libraries must be properly credited with their appropriate licenses.</li>
            <li><strong>Malicious Code:</strong> Do not upload malware, viruses, trojans, ransomware, or scripts designed to compromise systems.</li>
            <li><strong>Abuse Platform Infrastructure:</strong> Do not attempt to bypass rate limits, probe private APIs, perform denial-of-service attacks, or reverse-engineer the proprietary ATS parser.</li>
            <li><strong>Unsafe Links:</strong> Do not submit <code>javascript:</code>, phishing, or misleading external URLs in profile fields.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'disclaimers',
      title: '6. Recruitment & Placement Disclaimers',
      icon: Briefcase,
      content: (
        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <p>
            AspirePath provides tools to enhance career readiness, structure resumes, and benchmark competencies.
            While our ATS criteria and role matrices are engineered according to hiring standards, AspirePath does not
            guarantee employment, placement offers, or interview invitations from external employers.
          </p>
          <p>
            Job and internship listings featured on the Platform are curated from verified partner companies and public postings.
            We do not control the hiring decisions, application timelines, or interview processes of third-party employers.
          </p>
        </div>
      ),
    },
    {
      id: 'termination',
      title: '7. Account Termination & Suspension',
      icon: Lock,
      content: (
        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <p>
            AspirePath reserves the right to suspend or terminate accounts that violate these Terms, engage in fraudulent project
            claims, upload compromised software, or abuse platform resources.
          </p>
          <p>
            You may terminate your account at any time by contacting our support team. Upon termination, your private data and
            resumes will be purged according to our Privacy Policy.
          </p>
        </div>
      ),
    },
    {
      id: 'contact',
      title: '8. Modifications & Contact Information',
      icon: HelpCircle,
      content: (
        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <p>
            We may update these Terms periodically to reflect platform improvements or regulatory requirements. Continued use of
            AspirePath after any modifications constitutes acceptance of the revised Terms.
          </p>
          <p>
            For questions, legal inquiries, or grievance redressal regarding these Terms, please contact us at:
          </p>
          <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-xs space-y-1 text-slate-700">
            <div className="font-bold text-slate-900 text-sm">AspirePath Legal & Compliance Team</div>
            <div>Email: <a href="mailto:support@aspirepath.dev" className="text-brand-primary underline font-medium">support@aspirepath.dev</a></div>
            <div>Official Portal: <Link to="/contact" className="text-brand-primary underline font-medium">AspirePath Contact Center</Link></div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 sm:py-12">
      <SEO
        title="Terms of Service — AspirePath"
        description="Review the Terms of Service for AspirePath, outlining user accounts, intellectual property, proof-of-work guidelines, and placement disclaimers."
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Terms of Service', active: true },
          ]}
        />

        {/* Hero Header */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-blue-50/80 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-brand-primary text-xs font-bold uppercase tracking-wider">
              <Scale className="w-4 h-4" />
              <span>Legal & Platform Agreement</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-tight">
              Terms of Service
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              Please read these terms carefully. They govern your access and use of AspirePath&apos;s career development platform,
              ATS resume tools, skill intelligence roadmaps, placement preparation center, and project showcase hub.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Last Updated: {lastUpdated}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>100% Student Code Ownership</span>
              </span>
            </div>
          </div>
        </div>

        {/* Structured Sections */}
        <div className="space-y-6">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <div
                key={section.id}
                id={section.id}
                className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs hover:border-blue-200 transition-colors space-y-4 scroll-mt-24"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-brand-primary flex items-center justify-center font-bold shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-display font-bold text-slate-900">
                    {section.title}
                  </h2>
                </div>
                {section.content}
              </div>
            );
          })}
        </div>

        {/* Footer Navigation Action */}
        <div className="bg-gradient-to-r from-blue-900 to-brand-primary rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="font-bold font-display text-base sm:text-lg">Looking for our Privacy Policy?</h3>
            <p className="text-xs text-blue-100">Learn how your career data, resumes, and showcase projects are safeguarded.</p>
          </div>
          <Link to="/privacy">
            <Button variant="white" size="md" rightIcon={ArrowRight} className="!text-brand-primary font-bold">
              Read Privacy Policy
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
