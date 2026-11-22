import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Eye,
  FileText,
  Mail,
  Database,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  Server,
  Share2,
  HelpCircle,
  AlertCircle,
} from 'lucide-react';
import { Button, Badge, Breadcrumbs } from '@/components/common';
import SEO from '@/components/common/SEO';

export default function PrivacyPage() {
  const lastUpdated = 'November 22, 2026';

  const sections = [
    {
      id: 'introduction',
      title: '1. Introduction & Commitment to Privacy',
      icon: ShieldCheck,
      content: (
        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <p>
            At AspirePath (&quot;Platform&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), we are deeply committed to protecting the privacy,
            security, and academic integrity of our student community, campus placement cells, and recruiters.
          </p>
          <p>
            This Privacy Policy explains how we collect, store, process, and protect your personal information when you use
            our web application (<a href="https://aspirepath.vercel.app" className="text-brand-primary underline">https://aspirepath.vercel.app</a>)
            and all associated career intelligence services.
          </p>
        </div>
      ),
    },
    {
      id: 'data-collected',
      title: '2. Information We Collect',
      icon: Database,
      content: (
        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <p>We collect information you provide directly to provide transparent, deterministic career tools:</p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>Account & Profile Information:</strong> Name, university email address, graduation year, university/college name,
              degree program, headline, biography, and profile avatar.
            </li>
            <li>
              <strong>External Links & Showcase Profiles:</strong> LinkedIn profile URL, GitHub profile URL, and personal portfolio URL
              which you explicitly choose to add to your student profile or public portfolio.
            </li>
            <li>
              <strong>Resumes & Career Artifacts:</strong> Resume text and document files (PDF/DOCX) you upload to the ATS Resume Analyzer
              or construct within the Resume Builder, including work experience, technical projects, education, and skill tags.
            </li>
            <li>
              <strong>Project Hub Submissions:</strong> Repository links, system architecture diagrams, live demo links, and descriptions
              submitted for verified showcase publication.
            </li>
            <li>
              <strong>Skill Intelligence Benchmarks:</strong> Your target career track (across our 13 engineering disciplines),
              confirmed skills, and self-paced milestone completions.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'how-we-use-data',
      title: '3. How We Use Your Information',
      icon: Eye,
      content: (
        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <p>Your data is used exclusively to deliver deterministic, helpful career tools. We use it to:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>Benchmark your resume against standard ATS rules and generate keyword gap analyses.</li>
            <li>Calculate verifiable role fit scores across our 13 technical engineering roadmaps.</li>
            <li>Publish and display your public student showcase portfolio (at <code>/u/:username</code>) to prospective recruiters.</li>
            <li>Filter and match entry-level jobs and campus internship opportunities suited to your qualifications.</li>
            <li>Provide university placement cells with aggregated, non-personally identifiable cohort readiness reports.</li>
            <li>Send critical transactional notifications, such as 6-digit password recovery OTPs and project review outcomes.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'no-sale',
      title: '4. Zero Sale of Student Data Policy',
      icon: Lock,
      content: (
        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs text-emerald-900 leading-relaxed">
              <span className="font-bold text-sm block">We Never Sell Your Personal Information</span>
              AspirePath will never sell, rent, monetize, or trade student personal records, resumes, or contact details to third-party data brokers, marketing agencies, or advertisers.
            </div>
          </div>
          <p>
            Your career documents are processed strictly to calculate your scores and render your portfolio for your own advancement.
          </p>
        </div>
      ),
    },
    {
      id: 'third-parties',
      title: '5. Third-Party Service Providers',
      icon: Server,
      content: (
        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <p>We partner with vetted, secure infrastructure providers solely to operate the platform:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li><strong>Email Services (Resend):</strong> We utilize the official Resend API to deliver secure transactional emails and single-use 6-digit password reset OTPs. Email addresses are transmitted over encrypted TLS.</li>
            <li><strong>Cloud Hosting & Database (Vercel & Render):</strong> Frontend client assets are hosted on Vercel; the FastAPI application server and PostgreSQL database run in isolated virtual environments on Render.</li>
            <li><strong>External Profile Services:</strong> Links to external platforms (LinkedIn, GitHub, personal sites) are opened in new tabs using secure <code>rel=&quot;noopener noreferrer&quot;</code> references and are never tracked via tracking pixels.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'security',
      title: '6. Cryptographic Security & Data Storage',
      icon: Lock,
      content: (
        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <p>We implement enterprise-grade technical safeguards to protect student data:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li><strong>Password & OTP Hashing:</strong> Passwords and one-time password (OTP) codes are hashed using industry-standard bcrypt before storage. Raw unhashed OTPs are never stored in the database.</li>
            <li><strong>Encryption in Transit:</strong> All web traffic and API calls are strictly encrypted over HTTPS using modern TLS 1.3/1.2 protocols.</li>
            <li><strong>Single-Use Tokens:</strong> Password reset tokens are short-lived (5-minute expiry) and invalidated immediately after use.</li>
            <li><strong>Rate Limiting:</strong> Authentication endpoints are rate-limited to prevent brute-force attacks on student accounts.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'rights',
      title: '7. Your Rights & Data Controls',
      icon: UserCheck,
      content: (
        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <p>As a student or registered user, you maintain total control over your career data:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li><strong>Access & Update:</strong> You can review and edit your personal details, external profile URLs, and skills at any time from your Profile settings.</li>
            <li><strong>Delete Resumes & Projects:</strong> You may delete uploaded resumes or draft projects directly from your dashboard.</li>
            <li><strong>Public Visibility:</strong> You choose what information appears on your public portfolio (<code>/u/:username</code>). Empty profile fields are never displayed.</li>
            <li><strong>Account Deletion:</strong> You may request complete erasure of your account and associated records by submitting a request to our support team.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'contact',
      title: '8. Privacy Questions & Data Protection Officer',
      icon: HelpCircle,
      content: (
        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <p>
            If you have questions about this Privacy Policy, wish to exercise your data rights, or have concerns regarding data handling, please contact our Data Protection team:
          </p>
          <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-xs space-y-1 text-slate-700">
            <div className="font-bold text-slate-900 text-sm">AspirePath Privacy & Security Office</div>
            <div>Email: <a href="mailto:privacy@aspirepath.dev" className="text-brand-primary underline font-medium">privacy@aspirepath.dev</a></div>
            <div>Support Desk: <Link to="/contact" className="text-brand-primary underline font-medium">Contact Center</Link></div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 sm:py-12">
      <SEO
        title="Privacy Policy — AspirePath"
        description="Learn how AspirePath protects student data, career documents, resume parsing information, and external portfolio showcases."
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Privacy Policy', active: true },
          ]}
        />

        {/* Hero Header */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-cyan-50/80 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-50 border border-cyan-200/80 text-cyan-800 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-cyan-700" />
              <span>Student Privacy & Data Security</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-tight">
              Privacy Policy
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              Your career journey belongs to you. Understand how AspirePath collects, encrypts, and processes your resume,
              skill benchmarks, and project showcases with absolute transparency.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Last Updated: {lastUpdated}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-cyan-700" />
                <span>Zero Data Selling Commitment</span>
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
                className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs hover:border-cyan-200 transition-colors space-y-4 scroll-mt-24"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold shrink-0">
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
        <div className="bg-gradient-to-r from-slate-900 to-blue-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="font-bold font-display text-base sm:text-lg">Looking for our Terms of Service?</h3>
            <p className="text-xs text-slate-300">Read our guidelines governing user accounts, submissions, and code ownership.</p>
          </div>
          <Link to="/terms">
            <Button variant="white" size="md" rightIcon={ArrowRight} className="!text-slate-900 font-bold">
              Read Terms of Service
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
