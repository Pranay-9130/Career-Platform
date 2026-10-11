import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  FileArchive,
  Code2,
  Image,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ArrowLeft,
  FileText,
  Lock,
  Sparkles,
  Info
} from 'lucide-react';
import { Button, Card, Badge } from '@/components/common';
import { useAuth } from '@/context/AuthContext';

const FAQS = [
  {
    question: 'Why must I remove .env files and API keys before uploading?',
    answer:
      'Student projects uploaded to the platform are published for peer learning and recruiter showcases. Leaving secrets, AWS credentials, or OpenAI keys in your archive exposes your personal accounts to compromise. We scan archives automatically and immediately reject submissions with detected credentials.',
  },
  {
    question: 'What happens if my project needs environment variables to run?',
    answer:
      'Provide a `.env.example` file with placeholder values (e.g. `GEMINI_API_KEY=your_key_here`). In your README.md, document the required environment variables and how someone setting up the project locally should populate them.',
  },
  {
    question: 'Why are node_modules and virtual environments forbidden in the ZIP?',
    answer:
      'Dependency folders inflate the archive file size from ~500 KB to over 300 MB and frequently cause upload timeouts. Users downloading your starter kit will run `npm install` or `pip install -r requirements.txt` to install their own dependencies.',
  },
  {
    question: 'How does the administrative review process work?',
    answer:
      'Once submitted, your project enters the moderation queue. Platform reviewers verify the code structure, check that setup instructions work, and inspect UI presentation. If approved, your project becomes public with author attribution. If adjustments are needed, you receive actionable feedback.',
  },
  {
    question: 'Who owns the intellectual property of my submitted code?',
    answer:
      'You retain 100% intellectual property ownership of your code. By submitting, you grant the platform a license to showcase and index your project for prospective employers, student portfolios, and community learning.',
  },
];

const CHECKLIST_ITEMS = [
  {
    id: 'no_secrets',
    title: 'Zero Secrets & Credentials Policy',
    description: 'I have verified that all .env files, private keys (*.pem), tokens, and hardcoded passwords have been completely removed.',
  },
  {
    id: 'clean_archive',
    title: 'Clean Source Code Archive (< 50 MB)',
    description: 'My ZIP file contains only source code and static assets, without compiled binaries (.exe, .dll, .so) or oversized media.',
  },
  {
    id: 'excluded_deps',
    title: 'Bulky Dependencies Excluded',
    description: 'I have excluded node_modules/, .venv/, dist/, build/, and .git/ directories prior to compressing my project.',
  },
  {
    id: 'readme_present',
    title: 'Complete Setup README Included',
    description: 'I have included a README.md detailing project background, prerequisites, step-by-step setup, and usage commands.',
  },
  {
    id: 'code_of_conduct',
    title: 'Originality & Code of Conduct Agreement',
    description: 'I am the author or authorized contributor of this project, external open-source packages are credited, and the code contains no malicious routines.',
  },
];

export default function SubmissionGuidelinesPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [acknowledged, setAcknowledged] = useState({
    no_secrets: false,
    clean_archive: false,
    excluded_deps: false,
    readme_present: false,
    code_of_conduct: false,
  });

  const [expandedFaq, setExpandedFaq] = useState(null);

  const toggleCheck = (id) => {
    setAcknowledged((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const acknowledgedCount = Object.values(acknowledged).filter(Boolean).length;
  const isAllAcknowledged = acknowledgedCount === CHECKLIST_ITEMS.length;

  const handleSelectAll = () => {
    const nextState = !isAllAcknowledged;
    const updated = {};
    CHECKLIST_ITEMS.forEach((item) => {
      updated[item.id] = nextState;
    });
    setAcknowledged(updated);
  };

  const handleProceed = () => {
    if (!isAllAcknowledged) return;

    // Persist acknowledgement flag in localStorage
    localStorage.setItem('student_guidelines_acknowledged', 'true');
    localStorage.setItem('student_guidelines_acknowledged_at', new Date().toISOString());

    if (isAuthenticated) {
      navigate('/projects/submit');
    } else {
      navigate('/login?redirect=/projects/submit');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-24">
      {/* Hero Header */}
      <section className="bg-gradient-to-b from-blue-50/80 via-white to-slate-50/60 border-b border-brand-border py-12 lg:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-veryLight border border-brand-border text-brand-primary text-xs font-semibold uppercase tracking-wider mb-4 shadow-xs">
            <Lock className="w-3.5 h-3.5" />
            <span>Platform Compliance & Standards</span>
          </div>

          <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-brand-text tracking-tight">
            Project Submission Guidelines
          </h1>

          <p className="mt-4 text-base sm:text-lg text-brand-muted leading-relaxed max-w-2xl mx-auto">
            Please review our security protocols, packaging standards, and evaluation criteria before submitting your software architecture to the community catalog.
          </p>

          {/* Quick Stats Pills */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <div className="bg-white border border-brand-border rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-slate-400">Max Archive Size</span>
              <p className="font-display font-bold text-lg text-brand-text mt-0.5">50 MB</p>
              <span className="text-[11px] text-brand-muted">ZIP format only</span>
            </div>
            <div className="bg-white border border-brand-border rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-slate-400">Magic Number</span>
              <p className="font-display font-bold text-lg text-brand-primary mt-0.5 font-mono">PK\x03\x04</p>
              <span className="text-[11px] text-brand-muted">Binary verified</span>
            </div>
            <div className="bg-white border border-brand-border rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-slate-400">Secrets Policy</span>
              <p className="font-display font-bold text-lg text-emerald-600 mt-0.5">Zero .env</p>
              <span className="text-[11px] text-brand-muted">Automated scan</span>
            </div>
            <div className="bg-white border border-brand-border rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-slate-400">Moderation</span>
              <p className="font-display font-bold text-lg text-brand-text mt-0.5">Peer Review</p>
              <span className="text-[11px] text-brand-muted">24-48 hr review</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Body */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-10">
        {/* Section 1: Security Alert Callout */}
        <div className="bg-amber-50/70 border-2 border-amber-200/80 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xs">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="changesRequested" size="sm">
                  Crucial Security Warning
                </Badge>
                <span className="text-xs font-bold text-amber-900">Never upload live credentials</span>
              </div>
              <h3 className="font-display font-bold text-lg text-slate-900">
                Stripping Private Keys & Configuration Secrets
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                Before compressing your codebase, double-check that you have not bundled any <code className="bg-amber-100/80 text-amber-900 px-1 py-0.5 rounded font-mono text-xs">.env</code> files, cloud access tokens (AWS, GCP, Azure), database passwords, or private SSH keys. Any submission containing sensitive tokens will be automatically flagged and discarded.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Detailed Rules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card: ZIP Rules */}
          <div className="bg-white border border-brand-border rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center">
              <FileArchive className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-base text-brand-text">
              1. ZIP Packaging Specifications
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Maximum compressed file size is strictly <strong>50 MB</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Uncompressed ratio must not exceed <strong>10:1</strong> (max 250 MB extracted).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Files must begin with standard ZIP header bytes (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono">PK\x03\x04</code>).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>No path traversal sequences (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono">../</code>) allowed.</span>
              </li>
            </ul>
          </div>

          {/* Card: Code Standards */}
          <div className="bg-white border border-brand-border rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Code2 className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-base text-brand-text">
              2. Code Quality & README Structure
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Include a root <strong>README.md</strong> with clear overview and setup steps.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Specify dependencies in standard manifests (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono">package.json</code> or <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">requirements.txt</code>).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Ensure local instructions work from a clean clone/unzip.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Maintain descriptive function and variable naming standards.</span>
              </li>
            </ul>
          </div>

          {/* Card: Visual Demos */}
          <div className="bg-white border border-brand-border rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Image className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-base text-brand-text">
              3. Visual Demos & Screenshots
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Upload <strong>1 to 5 screenshots</strong> showcasing actual application UI.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Widescreen 16:9 ratio preferred (min. 1280x720 resolution).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Supported formats: PNG, JPG, WebP under 5 MB per image.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Provide short, meaningful captions for each screenshot.</span>
              </li>
            </ul>
          </div>

          {/* Card: Forbidden Files */}
          <div className="bg-white border border-brand-border rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <XCircle className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-base text-brand-text">
              4. Strictly Prohibited File Types
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
              <li className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>No compiled executables (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono">.exe</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">.dll</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">.so</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">.msi</code>).</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>No execution scripts (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono">.bat</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">.cmd</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">.vbs</code>).</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>No credentials (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono">.env</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">*.pem</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">id_rsa</code>).</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>No copyright-infringing commercial source code.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Section 3: Visual Do's & Don'ts Checklist */}
        <div className="bg-white border border-brand-border rounded-3xl p-6 sm:p-8 shadow-xs">
          <h3 className="font-display font-bold text-lg text-brand-text mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-primary" />
            File Tree Checklist: What to Include vs Exclude
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Include */}
            <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Always Include (Source & Docs)</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                <li className="font-mono bg-white/80 p-2 rounded-lg border border-emerald-100">
                  📁 src/ or app/ (Core source code)
                </li>
                <li className="font-mono bg-white/80 p-2 rounded-lg border border-emerald-100">
                  📄 README.md (Setup & architecture guide)
                </li>
                <li className="font-mono bg-white/80 p-2 rounded-lg border border-emerald-100">
                  📄 .env.example (Template variables without secrets)
                </li>
                <li className="font-mono bg-white/80 p-2 rounded-lg border border-emerald-100">
                  📄 package.json or requirements.txt (Dependencies)
                </li>
                <li className="font-mono bg-white/80 p-2 rounded-lg border border-emerald-100">
                  📁 public/ or assets/ (Icons and UI media)
                </li>
              </ul>
            </div>

            {/* Exclude */}
            <div className="bg-red-50/50 border border-red-200/80 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-red-800 font-bold text-xs uppercase tracking-wider">
                <XCircle className="w-4 h-4 text-red-600" />
                <span>Must Exclude (Bulky or Sensitive)</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                <li className="font-mono bg-white/80 p-2 rounded-lg border border-red-100 line-through text-red-800/80">
                  ❌ node_modules/ or .venv/ (Re-installed locally)
                </li>
                <li className="font-mono bg-white/80 p-2 rounded-lg border border-red-100 line-through text-red-800/80">
                  ❌ .env or .env.local (Live private secrets)
                </li>
                <li className="font-mono bg-white/80 p-2 rounded-lg border border-red-100 line-through text-red-800/80">
                  ❌ dist/, build/, or .next/ (Build outputs)
                </li>
                <li className="font-mono bg-white/80 p-2 rounded-lg border border-red-100 line-through text-red-800/80">
                  ❌ .git/ (Version control commit history)
                </li>
                <li className="font-mono bg-white/80 p-2 rounded-lg border border-red-100 line-through text-red-800/80">
                  ❌ .DS_Store or Thumbs.db (OS cache files)
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Section 4: Expandable FAQ Accordion */}
        <div className="bg-white border border-brand-border rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
          <h3 className="font-display font-bold text-lg text-brand-text flex items-center gap-2 mb-4">
            <HelpCircle className="w-5 h-5 text-brand-primary" />
            Frequently Asked Questions
          </h3>

          <div className="divide-y divide-brand-border">
            {FAQS.map((faq, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <div key={idx} className="py-3.5 first:pt-0 last:pb-0">
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between text-left text-sm font-semibold text-brand-text hover:text-brand-primary transition-colors py-1"
                  >
                    <span>{faq.question}</span>
                    <span className="text-slate-400 shrink-0 ml-4">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>
                  {isOpen && (
                    <p className="mt-2 text-xs sm:text-sm text-brand-muted leading-relaxed pr-6">
                      {faq.answer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 5: Mandatory Acknowledgement Gate */}
        <div className="bg-white border-2 border-brand-primary/40 rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-border">
            <div>
              <h3 className="font-display font-bold text-lg text-brand-text flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-brand-primary" />
                Pre-Submission Compliance Acknowledgement
              </h3>
              <p className="text-xs text-brand-muted mt-1">
                You must confirm all 5 statements below to unlock the project submission form.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-veryLight text-brand-primary border border-brand-border">
                {acknowledgedCount} / {CHECKLIST_ITEMS.length} Confirmed
              </span>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-brand-primary hover:underline font-semibold"
              >
                {isAllAcknowledged ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>

          {/* Interactive Checkbox Items */}
          <div className="space-y-3">
            {CHECKLIST_ITEMS.map((item) => {
              const isChecked = acknowledged[item.id];
              return (
                <label
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-blue-50/50 border-brand-primary/60 shadow-xs'
                      : 'bg-slate-50/70 border-brand-border hover:bg-slate-100/60'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}} // handled by parent label click
                    className="mt-0.5 w-4 h-4 text-brand-primary rounded border-slate-300 focus:ring-brand-primary"
                  />
                  <div className="space-y-0.5 select-none">
                    <span className={`text-xs font-bold ${isChecked ? 'text-brand-primary' : 'text-slate-800'}`}>
                      {item.title}
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Action Button Row */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link to="/projects">
              <Button variant="outline" size="md" leftIcon={ArrowLeft}>
                Back to Projects
              </Button>
            </Link>

            <Button
              variant="primary"
              size="lg"
              disabled={!isAllAcknowledged}
              onClick={handleProceed}
              rightIcon={ArrowRight}
              className={`w-full sm:w-auto font-bold px-8 py-3 transition-all ${
                isAllAcknowledged ? 'shadow-md shadow-brand-primary/20 scale-100' : 'opacity-50 cursor-not-allowed'
              }`}
            >
              Continue to Project Submission
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
