import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  CheckCircle,
  Eye,
  ArrowRight,
  Sparkles,
  Zap,
  Award,
  Layers,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  BookOpen,
  Filter,
  Download,
} from 'lucide-react';
import { resumeService } from '../../services/resumeService';
import { useAuth } from '../../context/AuthContext';
import SEO from '@/components/common/SEO';
import { getSoftwareApplicationSchema, getBreadcrumbListSchema } from '@/utils/seoSchemas';

export default function TemplatesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [previewTemplate, setPreviewTemplate] = useState(null);

  useEffect(() => {
    async function loadTemplates() {
      try {
        const data = await resumeService.getTemplates();
        setTemplates(data);
      } catch (err) {
        console.error('Failed to load templates:', err);
        // Fallback default templates
        setTemplates([
          {
            id: 'classic-tech',
            name: 'Classic Tech',
            tagline: 'Ivy-league single column layout standard preferred by FAANG recruiters and ATS systems.',
            description: 'Standardized, highly parseable ATS layout with clean serif/sans typography, prominent technical skills matrix, and bullet-point impact metrics.',
            badge: 'Highest ATS Score',
            ats_score: '98/100',
            best_for: 'Software Engineers, Backend Developers, DevOps',
            preview_accent: '#0284c7',
          },
          {
            id: 'modern-minimal',
            name: 'Modern Minimal',
            tagline: 'Sleek, contemporary aesthetic featuring subtle dividers and structured section blocks.',
            description: 'Clean modern hierarchy with subtle slate dividers and high-readability typography designed for high-growth tech companies.',
            badge: 'Popular',
            ats_score: '95/100',
            best_for: 'Full Stack Engineers, Frontend Developers, Product Designers',
            preview_accent: '#2563eb',
          },
          {
            id: 'research-academic',
            name: 'Research & Academic',
            tagline: 'Curated for students highlighting publications, capstones, thesis, and university honors.',
            description: 'Structured academic format highlighting education, coursework, publications, laboratory experience, and open-source contributions.',
            badge: 'Academic',
            ats_score: '94/100',
            best_for: 'Data Scientists, ML/AI Researchers, Graduate Applicants',
            preview_accent: '#0d9488',
          },
          {
            id: 'compact-dense',
            name: 'Compact Executive',
            tagline: 'Dense, single-page powerhouse layout maximizing impact per square inch without clutter.',
            description: 'Tight margins and compact spacing specifically calibrated to fit extensive internship experience and multiple flagship projects onto 1 page.',
            badge: 'High Density',
            ats_score: '96/100',
            best_for: 'Multi-internship candidates, Senior students, Career switchers',
            preview_accent: '#4f46e5',
          },
        ]);
      } finally {
        setLoading(false);
      }
    }
    loadTemplates();
  }, []);

  const [downloadingSampleId, setDownloadingSampleId] = useState(null);

  const handleUseTemplate = (templateId) => {
    if (!user) {
      navigate(`/login?redirect=/resume-builder?template=${templateId}`);
    } else {
      navigate(`/resume-builder?template=${templateId}`);
    }
  };

  const handleDownloadSamplePdf = async (templateId) => {
    try {
      setDownloadingSampleId(templateId);
      const payload = {
        title: `Sample ATS Resume (${templateId})`,
        template_id: templateId,
        personal_info: {
          full_name: 'Alex Rivera',
          headline: 'Software Engineer',
          email: 'alex.rivera@example.com',
          phone: '+1 (555) 019-2834',
          location: 'San Francisco, CA',
          github: 'github.com/developer',
          linkedin: 'linkedin.com/in/developer',
        },
        summary:
          'High-performing computer science graduate with proven experience architecting high-throughput distributed backends and reactive client dashboards. Passionate about automated testing and clean systems architecture.',
        education: [
          {
            institution: 'University of Washington',
            degree: 'B.S. in Computer Science',
            end_date: 'May 2025',
            gpa: '3.88 / 4.0',
            highlights: 'Distributed Systems, Operating Systems, Algorithms & Data Structures',
          },
        ],
        experience: [
          {
            role: 'Software Engineering Intern',
            company: 'CloudNova Systems',
            start_date: 'May 2024',
            end_date: 'Aug 2024',
            location: 'Remote',
            bullets: [
              'Designed microservice endpoints processing 45k+ daily telemetry pings using FastAPI and Redis caching, cutting P95 latency by 38%.',
              'Automated end-to-end integration test runners in GitHub Actions, slashing deployment cycle times from 25 to 7 minutes.',
            ],
          },
        ],
        projects: [
          {
            name: 'NexusFlow: Real-Time Event Dispatcher',
            tech_stack: 'Python, FastAPI, WebSocket, Redis',
            link: 'github.com/developer/nexusflow',
            bullets: [
              'Constructed high-speed pub/sub message broadcaster handling 2,000 concurrent socket connections.',
              'Engineered automatic reconnection fallbacks and JWT session authentication.',
            ],
          },
        ],
        skills: ['Python', 'FastAPI', 'React', 'Docker', 'PostgreSQL', 'Git', 'TypeScript', 'Tailwind CSS'],
        certifications: [
          { name: 'AWS Certified Cloud Practitioner', issuer: 'Amazon Web Services', date: '2024' },
        ],
      };

      const blob = await resumeService.previewPdf(payload);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${templateId}_ATS_Sample.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download sample ATS PDF:', err);
      alert('Could not download sample PDF. Please check server connection.');
    } finally {
      setDownloadingSampleId(null);
    }
  };

  const sampleResumeData = {
    full_name: 'Alex Rivera',
    headline: 'Software Engineer (Cloud & Systems)',
    email: 'alex.rivera@cs.edu',
    phone: '+1 (555) 349-2810',
    location: 'Seattle, WA',
    links: 'github.com/alexrivera • linkedin.com/in/alexrivera',
    summary:
      'High-performing computer science graduate with proven experience architecting high-throughput distributed backends and reactive client dashboards. Passionate about automated testing, systems reliability, and scalable API engineering.',
    skills: [
      { category: 'Languages', items: 'Python, TypeScript, Go, SQL, HTML5/CSS3' },
      { category: 'Frameworks & Libs', items: 'FastAPI, React, Node.js, Express, Tailwind CSS, Pytest' },
      { category: 'Cloud & Infrastructure', items: 'PostgreSQL, Redis, Docker, AWS (S3, EC2, Lambda), Git CI/CD' },
    ],
    experience: [
      {
        role: 'Software Engineering Intern',
        company: 'CloudNova Systems',
        period: 'May 2024 – Aug 2024',
        location: 'Remote',
        bullets: [
          'Designed microservice endpoints processing 45k+ daily telemetry pings using FastAPI and Redis caching, cutting P95 latency by 38%.',
          'Automated end-to-end integration test runners in GitHub Actions, slashing deployment cycle times from 25 to 7 minutes.',
          'Collaborated with senior architects to migrate synchronous batch jobs to event-driven message queues.',
        ],
      },
    ],
    projects: [
      {
        name: 'NexusFlow: Real-Time Event Dispatcher',
        tech: 'Python, FastAPI, WebSocket, Redis',
        bullets: [
          'Constructed high-speed pub/sub message broadcaster handling 2,000 concurrent socket connections.',
          'Engineered automatic reconnection fallbacks and JWT session authentication.',
        ],
      },
      {
        name: 'DevPortfolio & ATS Scanner',
        tech: 'React, Tailwind CSS, PostgreSQL',
        bullets: [
          'Engineered ATS-compliant resume builder parsing standard resume sections with real-time scoring feedback.',
          'Implemented instant A4 export formatting compliant with Workday and Greenhouse parser criteria.',
        ],
      },
    ],
    education: {
      degree: 'B.S. in Computer Science (GPA: 3.88/4.0)',
      institution: 'University of Washington',
      grad_date: 'Expected May 2025',
      coursework: 'Distributed Systems, Operating Systems, Algorithms & Data Structures, Cloud Computing',
    },
  };

  return (
    <div className="min-h-screen bg-brand-surface py-12 px-4 sm:px-6 lg:px-8">
      <SEO
        title="ATS-Compliant Resume Templates for Tech Careers"
        description="Free ATS-optimized single-column resume templates designed to pass Greenhouse, Lever, and Workday parsing systems. One-click export to PDF."
        canonical="/resumes"
        schema={[
          getSoftwareApplicationSchema(
            "ATS Resume Builder",
            "Single-column ATS-compliant resume builder and PDF exporter for developers and students.",
            "/resumes"
          ),
          getBreadcrumbListSchema([
            { name: "Home", path: "/" },
            { name: "Resume Templates", path: "/resumes" },
          ]),
        ]}
      />
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            ATS-Optimized Resumes
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-extrabold text-brand-text tracking-tight">
            Resume Templates That Beat The ATS
          </h1>
          <p className="text-lg text-brand-muted leading-relaxed">
            Crafted strictly to standard single-column parsing algorithms used by Greenhouse, Lever, Workday, and Taleo.
            Never get disqualified by automated bots again.
          </p>

          <div className="pt-2 flex flex-wrap justify-center gap-4 text-xs font-medium text-brand-muted">
            <span className="inline-flex items-center gap-1.5 bg-brand-surface-card px-3 py-1.5 rounded-md border border-brand-border">
              <CheckCircle className="w-4 h-4 text-emerald-500" /> 100% Robot Parseable
            </span>
            <span className="inline-flex items-center gap-1.5 bg-brand-surface-card px-3 py-1.5 rounded-md border border-brand-border">
              <CheckCircle className="w-4 h-4 text-emerald-500" /> One-Click Profile Sync
            </span>
            <span className="inline-flex items-center gap-1.5 bg-brand-surface-card px-3 py-1.5 rounded-md border border-brand-border">
              <CheckCircle className="w-4 h-4 text-emerald-500" /> Free PDF & Print Export
            </span>
          </div>
        </div>

        {/* Template Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="group relative flex flex-col bg-brand-surface-card rounded-2xl border border-brand-border hover:border-brand-primary/40 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              {/* Header Visual Mockup */}
              <div className="h-56 bg-slate-100 p-4 relative overflow-hidden flex flex-col justify-between border-b border-brand-border group-hover:bg-slate-50 transition-colors">
                {/* Mini Resume Visual Representation */}
                <div className="w-full h-full bg-white rounded-lg shadow-sm border border-slate-200 p-3 text-[7px] text-slate-600 space-y-1.5 pointer-events-none select-none">
                  <div className="text-center pb-1 border-b border-slate-200">
                    <div className="font-bold text-[9px] text-slate-800 tracking-tight">ALEX RIVERA</div>
                    <div className="text-slate-400 text-[6px]">alex@example.com • github.com/alex • (555) 019-2834</div>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-700 uppercase tracking-wider text-[6px] text-sky-700">
                      TECHNICAL SKILLS
                    </div>
                    <div className="text-slate-500 text-[6px]">Python, FastAPI, React, PostgreSQL, Docker, Git</div>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-700 uppercase tracking-wider text-[6px] text-sky-700">
                      EXPERIENCE
                    </div>
                    <div className="font-medium text-slate-800 text-[6px]">Software Engineer Intern • CloudNova</div>
                    <div className="text-slate-400 text-[5.5px]">• Built high-speed REST APIs reducing latency by 35%</div>
                    <div className="text-slate-400 text-[5.5px]">• Automated CI pipelines with 94% unit test coverage</div>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-700 uppercase tracking-wider text-[6px] text-sky-700">
                      PROJECTS & EDUCATION
                    </div>
                    <div className="text-slate-500 text-[5.5px]">B.S. in Computer Science — GPA: 3.88/4.0</div>
                  </div>
                </div>

                {/* Badges on mockup */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-white/90 backdrop-blur shadow-sm text-xs font-semibold text-brand-primary border border-brand-border">
                    {tpl.badge}
                  </span>
                </div>
              </div>

              {/* Body Info */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-brand-text group-hover:text-brand-primary transition-colors">
                      {tpl.name}
                    </h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ATS: {tpl.ats_score}
                    </span>
                  </div>
                  <p className="text-xs text-brand-muted mt-2 line-clamp-2 leading-relaxed">
                    {tpl.description}
                  </p>
                  <div className="mt-3 text-[11px] text-brand-muted bg-brand-surface px-2.5 py-1.5 rounded-lg border border-brand-border/60">
                    <span className="font-semibold text-brand-text">Best for: </span>
                    {tpl.best_for}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2 border-t border-brand-border/60">
                  <button
                    onClick={() => handleUseTemplate(tpl.id)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-primary text-white font-medium text-sm hover:bg-brand-primary-hover shadow-sm hover:shadow transition-all"
                  >
                    Use This Template
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPreviewTemplate(tpl)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-brand-muted hover:text-brand-text hover:bg-brand-surface rounded-lg transition-colors border border-brand-border/60"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Preview
                    </button>
                    <button
                      onClick={() => handleDownloadSamplePdf(tpl.id)}
                      disabled={downloadingSampleId === tpl.id}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors border border-brand-primary/30"
                      title="Download sample vector ATS PDF"
                    >
                      <Download className={`w-3.5 h-3.5 ${downloadingSampleId === tpl.id ? 'animate-bounce' : ''}`} />
                      {downloadingSampleId === tpl.id ? 'PDF...' : 'Sample PDF'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ATS Guidelines Breakdown Section */}
        <div className="bg-brand-surface-card rounded-2xl border border-brand-border p-8 shadow-sm">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold text-brand-text">Why We Strictly Use Single-Column ATS Layouts</h2>
            <p className="mt-2 text-sm text-brand-muted leading-relaxed">
              Recruiting platforms like Taleo and Greenhouse use text extractors that read resumes left-to-right, top-to-bottom.
              Multi-column tables, text boxes, and SVG graphics scramble your sections into gibberish.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl bg-brand-surface border border-brand-border space-y-2">
              <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-brand-text text-sm">Linear Text Stream</h4>
              <p className="text-xs text-brand-muted leading-relaxed">
                Single-column document hierarchy ensures zero parsing collisions between your job titles, company dates, and bullet points.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-brand-surface border border-brand-border space-y-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-brand-text text-sm">Standard Section Headings</h4>
              <p className="text-xs text-brand-muted leading-relaxed">
                Headers like "Experience", "Education", and "Technical Skills" allow bots to index your credentials without tagging them as unclassified text.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-brand-surface border border-brand-border space-y-2">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-brand-text text-sm">Action-Metric Bullets</h4>
              <p className="text-xs text-brand-muted leading-relaxed">
                Structured bullet slots encourage quantifiable impact metrics (e.g. "Reduced latency by 35%") that score higher in semantic recruiter queries.
              </p>
            </div>
          </div>
        </div>

        {/* Live Preview Modal */}
        {previewTemplate && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-brand-surface-card rounded-2xl max-w-4xl w-full border border-brand-border shadow-2xl overflow-hidden my-8">
              <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-surface">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-brand-text">{previewTemplate.name} Spec</h3>
                    <p className="text-xs text-brand-muted">Targeted format preview for ATS evaluation</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleUseTemplate(previewTemplate.id)}
                    className="px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary-hover transition-colors inline-flex items-center gap-1.5"
                  >
                    Open in Builder
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setPreviewTemplate(null)}
                    className="p-1.5 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-border transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* A4 Preview Canvas */}
              <div className="p-8 bg-slate-200 flex justify-center max-h-[70vh] overflow-y-auto">
                <div className="w-full max-w-2xl bg-white p-10 rounded shadow-md text-slate-800 font-sans text-xs space-y-4">
                  {/* Name and Contact */}
                  <div className="text-center border-b pb-3 border-slate-300">
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">{sampleResumeData.full_name}</h1>
                    <p className="text-slate-600 text-xs mt-0.5">{sampleResumeData.headline}</p>
                    <p className="text-slate-500 text-[11px] mt-1">
                      {sampleResumeData.email} • {sampleResumeData.phone} • {sampleResumeData.location}
                    </p>
                    <p className="text-sky-700 text-[11px] mt-0.5">{sampleResumeData.links}</p>
                  </div>

                  {/* Summary */}
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">
                      Professional Summary
                    </h2>
                    <p className="text-slate-700 leading-relaxed text-[11px]">{sampleResumeData.summary}</p>
                  </div>

                  {/* Skills */}
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">
                      Technical Skills
                    </h2>
                    <div className="space-y-1 text-[11px]">
                      {sampleResumeData.skills.map((s, idx) => (
                        <div key={idx}>
                          <span className="font-semibold text-slate-800">{s.category}: </span>
                          <span className="text-slate-700">{s.items}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Experience */}
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">
                      Professional Experience
                    </h2>
                    {sampleResumeData.experience.map((exp, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-bold text-slate-800">
                            {exp.role} — <span className="font-semibold text-slate-700">{exp.company}</span>
                          </span>
                          <span className="text-slate-500">{exp.period}</span>
                        </div>
                        <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-700">
                          {exp.bullets.map((b, bIdx) => (
                            <li key={bIdx}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  {/* Projects */}
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">
                      Flagship Projects
                    </h2>
                    <div className="space-y-2">
                      {sampleResumeData.projects.map((proj, idx) => (
                        <div key={idx} className="space-y-0.5">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="font-bold text-slate-800">{proj.name}</span>
                            <span className="text-slate-500 italic text-[10px]">{proj.tech}</span>
                          </div>
                          <ul className="list-disc list-inside text-[11px] text-slate-700">
                            {proj.bullets.map((b, bIdx) => (
                              <li key={bIdx}>{b}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Education */}
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">
                      Education
                    </h2>
                    <div className="flex justify-between items-start text-[11px]">
                      <div>
                        <div className="font-bold text-slate-800">{sampleResumeData.education.institution}</div>
                        <div className="text-slate-700">{sampleResumeData.education.degree}</div>
                        <div className="text-slate-500 text-[10px]">Coursework: {sampleResumeData.education.coursework}</div>
                      </div>
                      <div className="text-slate-500 text-[10px]">{sampleResumeData.education.grad_date}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div className="px-6 py-4 bg-brand-surface border-t border-brand-border flex justify-between items-center">
                <span className="text-xs text-brand-muted">
                  ATS Parse Confidence: <span className="font-bold text-emerald-600">{previewTemplate.ats_score}</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadSamplePdf(previewTemplate.id)}
                    disabled={downloadingSampleId === previewTemplate.id}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 border border-brand-primary/30 transition-colors inline-flex items-center gap-1.5"
                  >
                    <Download className={`w-3.5 h-3.5 ${downloadingSampleId === previewTemplate.id ? 'animate-bounce' : ''}`} />
                    {downloadingSampleId === previewTemplate.id ? 'Generating...' : 'Download Sample PDF'}
                  </button>
                  <button
                    onClick={() => setPreviewTemplate(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-brand-text hover:bg-brand-border transition-colors"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
