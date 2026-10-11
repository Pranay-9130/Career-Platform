import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  FileText,
  Briefcase,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  TrendingUp,
  Sliders,
  Award,
  Zap,
  Info,
  Layers,
  ChevronRight,
  BookOpen,
  User,
  Play,
  RotateCcw,
} from 'lucide-react';
import { resumeService } from '../../services/resumeService';
import { jobService } from '../../services/jobService';
import { userService } from '../../services/userService';
import SEO from '@/components/common/SEO';
import { getSoftwareApplicationSchema, getBreadcrumbListSchema } from '@/utils/seoSchemas';

// Pre-defined realistic sample resumes for 1-click testing
const SAMPLE_BACKEND_RESUME = `Alex Student
Email: alex.student@university.edu | Phone: (555) 234-5678 | GitHub: github.com/alexstudent | Portfolio: alexstudent.dev
San Francisco, CA

PROFESSIONAL SUMMARY
Motivated Computer Science graduate with hands-on experience developing RESTful APIs, cloud microservices, and reactive web interfaces using Python (FastAPI), React, and PostgreSQL. Experienced in Docker containerization, CI/CD pipelines, and relational database design.

TECHNICAL SKILLS
Languages: Python, JavaScript, TypeScript, SQL, HTML/CSS
Backend & Frameworks: FastAPI, Node.js, Express, SQLAlchemy, Redis
Frontend: React, Tailwind CSS, Vite, Redux Toolkit
Databases & Cloud: PostgreSQL, SQLite, AWS (S3, EC2), Docker, Git, Linux
Testing & Methodologies: Pytest, Jest, CI/CD (GitHub Actions), RESTful APIs, Agile

PROJECTS
AI Resume Matcher & ATS Scorer (FastAPI, React, PostgreSQL, Gemini AI)
- Built automated resume evaluation pipeline comparing candidate resumes against job descriptions with semantic parsing and keyword analysis.
- Reduced API response latency by 45% using Redis query caching and asynchronous database sessions.
- Containerized application with Docker and deployed via GitHub Actions CI/CD pipeline.

Student Career & Hiring Portal (React, FastAPI, Tailwind CSS)
- Architected role-based authentication platform supporting students and admins with email OTP verification and JWT session tokens.
- Implemented responsive Kanban board for application tracking and ATS-compliant resume PDF builder.

EDUCATION
B.S. in Computer Science — Stanford University (Graduation: May 2026)
Relevant Coursework: Data Structures & Algorithms, Distributed Systems, Database Management Systems, Cloud Computing.`;

const SAMPLE_FRONTEND_RESUME = `Jordan Lee
Email: jordan.lee@university.edu | GitHub: github.com/jordanlee | Seattle, WA

PROFESSIONAL SUMMARY
Frontend engineer specializing in modern React ecosystems, responsive web design, and accessible component architectures. Experienced in building performant SPAs with TypeScript, Tailwind CSS, and REST API integrations.

TECHNICAL SKILLS
Languages: JavaScript (ES6+), TypeScript, HTML5, CSS3/PostCSS
Frameworks & Libraries: React, Next.js, Redux Toolkit, React Router, Vite
Styling: Tailwind CSS, CSS Modules, Responsive Design Systems
Tooling & Testing: Git, Webpack, Jest, Cypress, Figma, CI/CD Pipelines

PROJECTS
Interactive Analytics Dashboard (React, TypeScript, Tailwind CSS)
- Developed responsive dashboard with live charting, dynamic filtering, and dark mode theme toggling.
- Optimized Lighthouse performance score from 68 to 96 through code-splitting and asset minification.
- Implemented accessible keyboard navigation and ARIA landmarks conforming to WCAG 2.1 AA standards.`;

// Pre-defined realistic job descriptions for 1-click testing
const SAMPLE_BACKEND_JD = `Senior Backend Engineer — Cloud Platforms
Location: Remote (US / EMEA)
Company: NexusScale Systems

About The Role:
We are looking for a Software Engineer to design, build, and maintain our high-throughput distributed APIs and cloud microservices.

Requirements:
- 2+ years of professional experience with Python, FastAPI, or Node.js.
- Deep expertise in relational databases including PostgreSQL and Redis caching.
- Hands-on experience with Docker containerization, Kubernetes, and AWS cloud services (S3, EC2, Lambda).
- Solid grasp of CI/CD deployment pipelines, automated unit testing with Pytest, and RESTful API architecture.
- Demonstrated experience writing clean, scalable code and optimizing database query latency.`;

const SAMPLE_FRONTEND_JD = `Frontend Engineer (React / TypeScript)
Location: Remote / Hybrid
Company: Horizon Cloud Technologies

Responsibilities:
- Build accessible, lightning-fast UI components and client views using React, TypeScript, and Tailwind CSS.
- Collaborate with product designers and backend engineers to integrate REST APIs and state management.
- Ensure cross-browser consistency, 95+ Lighthouse performance, and responsive layout fidelity across mobile and desktop.

Requirements:
- Hands-on practical experience with React 18+, TypeScript, and modern state management.
- Strong knowledge of modern CSS, Tailwind CSS, and responsive design systems.
- Familiarity with build tools (Vite, Webpack) and automated testing using Jest or React Testing Library.`;

export default function AtsAnalyzerPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Mode toggles
  const [resumeMode, setResumeMode] = useState('paste'); // 'paste' | 'saved'
  const [jobMode, setJobMode] = useState('paste'); // 'paste' | 'platform'

  // Data lists
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState('');

  // Selections & inputs
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [pastedResumeText, setPastedResumeText] = useState(SAMPLE_BACKEND_RESUME);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [pastedJobDescription, setPastedJobDescription] = useState(SAMPLE_BACKEND_JD);

  // Analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);

  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoadingInitial(true);
        const [resumeRes, jobRes] = await Promise.all([
          resumeService.getResumes().catch(() => ({ items: [] })),
          jobService.getJobs({ limit: 20 }).catch(() => ({ items: [] })),
        ]);

        const resumeItems = resumeRes.items || [];
        setResumes(resumeItems);
        if (resumeItems.length > 0) {
          setSelectedResumeId(resumeItems[0].id);
        }

        const jobItems = jobRes.items || [];
        setJobs(jobItems);
        if (jobItems.length > 0) {
          setSelectedJobId(jobItems[0].id);
        }

        // Query param overrides
        const queryResumeId = searchParams.get('resume_id');
        if (queryResumeId) {
          setSelectedResumeId(queryResumeId);
          setResumeMode('saved');
        }
        const queryJobId = searchParams.get('job_id');
        if (queryJobId) {
          setSelectedJobId(queryJobId);
          setJobMode('platform');
        }
      } catch (err) {
        console.error('Failed to load initial analyzer data:', err);
      } finally {
        setLoadingInitial(false);
      }
    }
    loadInitialData();
  }, [searchParams]);

  const showNotice = (msg) => {
    setNoticeMessage(msg);
    setTimeout(() => setNoticeMessage(''), 4000);
  };

  // 1-Click Instant Demo: fills sample inputs & immediately executes analysis
  const handleInstantDemo = async (roleType = 'backend') => {
    setErrorMsg('');
    const targetResume = roleType === 'frontend' ? SAMPLE_FRONTEND_RESUME : SAMPLE_BACKEND_RESUME;
    const targetJd = roleType === 'frontend' ? SAMPLE_FRONTEND_JD : SAMPLE_BACKEND_JD;

    setPastedResumeText(targetResume);
    setPastedJobDescription(targetJd);
    setResumeMode('paste');
    setJobMode('paste');

    try {
      setAnalyzing(true);
      const result = await resumeService.analyzeAts({
        resume_text: targetResume,
        job_description: targetJd,
      });
      setAnalysisResult(result);
      showNotice(`Successfully evaluated ${roleType === 'frontend' ? 'Frontend' : 'Backend'} sample! Scroll down to view the match breakdown.`);
      setTimeout(() => {
        document.getElementById('analysis-results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } catch (err) {
      console.error('Instant demo analysis failed:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to complete analysis. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Auto-populate resume from logged-in user profile
  const handleLoadFromProfile = async () => {
    try {
      setLoadingProfile(true);
      const profile = await userService.getProfile();
      const skillsStr = Array.isArray(profile.skills) ? profile.skills.join(', ') : profile.skills || 'Python, React, FastAPI, SQL, Git';
      const projectsText = (profile.projects || [])
        .map((p) => `- ${p.title}: ${p.short_description || p.domain || 'Software Project'}`)
        .join('\n');

      const formatted = `${profile.full_name || 'Student Candidate'}
Email: ${profile.email || 'student@university.edu'} | Location: ${profile.location || 'Remote'}
${profile.headline || 'Software Engineering Student'}
${profile.university ? `Education: ${profile.degree || 'Degree'} — ${profile.university} (${profile.graduation_year || 2026})` : ''}

SUMMARY
${profile.bio || 'Motivated software engineering student with practical experience building modern web applications and cloud architectures.'}

TECHNICAL SKILLS
Skills: ${skillsStr}

PROJECTS & EXPERIENCE
${projectsText || '- AI Resume Matcher: Developed FastAPI and React application for ATS resume scoring and keyword extraction.\n- Web Portfolio: Built responsive showcase with Tailwind CSS and PostgreSQL.'}
`;

      setPastedResumeText(formatted);
      setResumeMode('paste');
      showNotice('Loaded your student profile into the resume input!');
    } catch (err) {
      console.error('Failed to load profile:', err);
      // Fallback to sample resume if profile fetch fails
      setPastedResumeText(SAMPLE_BACKEND_RESUME);
      setResumeMode('paste');
      showNotice('Sample resume loaded (Profile details unavailable).');
    } finally {
      setLoadingProfile(false);
    }
  };

  // Run the user's customized analysis
  const handleRunAnalysis = async () => {
    setErrorMsg('');
    setAnalysisResult(null);

    const payload = {};

    if (resumeMode === 'saved') {
      if (!selectedResumeId) {
        setErrorMsg('Please select a saved resume or switch to Paste text.');
        return;
      }
      payload.resume_id = selectedResumeId;
    } else {
      if (!pastedResumeText.trim()) {
        setErrorMsg('Please paste your resume text or click "Load Sample Resume" above.');
        return;
      }
      payload.resume_text = pastedResumeText.trim();
    }

    if (jobMode === 'platform') {
      if (!selectedJobId) {
        setErrorMsg('Please select a platform job listing or switch to Custom JD.');
        return;
      }
      payload.job_id = selectedJobId;
    } else {
      if (!pastedJobDescription.trim()) {
        setErrorMsg('Please paste the target job description or click "Load Sample JD" above.');
        return;
      }
      payload.job_description = pastedJobDescription.trim();
    }

    try {
      setAnalyzing(true);
      const result = await resumeService.analyzeAts(payload);
      setAnalysisResult(result);
      setTimeout(() => {
        document.getElementById('analysis-results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('ATS Analysis failed:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to complete ATS analysis. Please verify your inputs.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCopyBullet = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const getScoreBarColor = (score) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const isResumeReady = resumeMode === 'saved' ? Boolean(selectedResumeId) : pastedResumeText.trim().length > 50;
  const isJobReady = jobMode === 'platform' ? Boolean(selectedJobId) : pastedJobDescription.trim().length > 50;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <SEO
        title="AI ATS Resume Analyzer & Score Matcher"
        description="Analyze your resume compatibility against target job descriptions with Google Gemini AI. Identify keyword gaps and receive actionable suggestions."
        canonical="/ats-analyzer"
        schema={[
          getSoftwareApplicationSchema(
            "ATS Match Analyzer",
            "AI-powered applicant tracking system score evaluator and keyword analyzer for tech resumes.",
            "/ats-analyzer"
          ),
          getBreadcrumbListSchema([
            { name: "Home", path: "/" },
            { name: "ATS Analyzer", path: "/ats-analyzer" },
          ]),
        ]}
      />

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-brand-primary" />
            AI-Powered Applicant Tracking System
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-tight">
            ATS Match Analyzer & AI Optimizer
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Test your resume against any job description to discover exact keyword matches, missing qualifications,
            and AI-powered bullet point rewrites in seconds.
          </p>
        </div>

        {/* 1-CLICK INSTANT DEMO BANNER */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 rounded-2xl p-5 sm:p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="space-y-1 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold tracking-wide uppercase backdrop-blur-sm">
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              Instant 1-Click Demo
            </div>
            <h2 className="text-lg sm:text-xl font-bold font-display">
              Want to see how ATS scoring works right now?
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
              Click a demo role below to automatically fill sample data and run the Gemini AI analysis in 2 seconds.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 shrink-0">
            <button
              type="button"
              disabled={analyzing}
              onClick={() => handleInstantDemo('backend')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-brand-primary font-bold text-xs hover:bg-blue-50 transition-all shadow-sm active:scale-95 disabled:opacity-75"
            >
              <Play className="w-3.5 h-3.5 fill-brand-primary" />
              <span>Test Backend Role</span>
            </button>
            <button
              type="button"
              disabled={analyzing}
              onClick={() => handleInstantDemo('frontend')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 text-white border border-white/30 font-bold text-xs hover:bg-white/25 transition-all backdrop-blur-sm active:scale-95 disabled:opacity-75"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Test Frontend Role</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert Notice */}
        {noticeMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{noticeMessage}</span>
            </div>
            <button onClick={() => setNoticeMessage('')} className="text-emerald-600 hover:text-emerald-800 font-bold text-xs">
              Dismiss
            </button>
          </div>
        )}

        {/* Dual Input Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* STEP 1: RESUME INPUT */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-brand-primary flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      Candidate Resume
                      {isResumeReady && (
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                          Ready
                        </span>
                      )}
                    </h2>
                  </div>
                </div>

                {/* Mode Tabs */}
                <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setResumeMode('paste')}
                    className={`px-3 py-1 rounded-md transition-all ${
                      resumeMode === 'paste' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Resume Text
                  </button>
                  <button
                    type="button"
                    onClick={() => setResumeMode('saved')}
                    disabled={resumes.length === 0}
                    className={`px-3 py-1 rounded-md transition-all ${
                      resumeMode === 'saved' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    } disabled:opacity-50`}
                    title={resumes.length === 0 ? 'No saved resumes yet' : 'Select from your saved resumes'}
                  >
                    Saved Resumes ({resumes.length})
                  </button>
                </div>
              </div>

              {resumeMode === 'saved' ? (
                <div className="space-y-3">
                  <label className="block text-xs font-medium text-slate-600">Select a saved draft from your account:</label>
                  <select
                    value={selectedResumeId}
                    onChange={(e) => setSelectedResumeId(e.target.value)}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  >
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title} ({r.template_id}) {r.is_primary ? '★ Primary' : ''}
                      </option>
                    ))}
                  </select>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-500 flex justify-between items-center">
                    <span>Includes: Skills matrix, work history, projects & education.</span>
                    <button
                      type="button"
                      onClick={() => navigate(`/resume-builder`)}
                      className="text-brand-primary hover:underline font-semibold"
                    >
                      Edit in Builder
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {/* Quick Pre-fill Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-slate-500 text-[11px]">Quick helper pre-fills:</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleLoadFromProfile}
                        disabled={loadingProfile}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-primary hover:text-brand-secondary bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors"
                      >
                        <User className="w-3 h-3" />
                        <span>{loadingProfile ? 'Loading Profile...' : 'Use My Profile'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPastedResumeText(SAMPLE_BACKEND_RESUME);
                          showNotice('Sample backend developer resume loaded!');
                        }}
                        className="text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg transition-colors"
                      >
                        Sample Backend
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPastedResumeText(SAMPLE_FRONTEND_RESUME);
                          showNotice('Sample frontend developer resume loaded!');
                        }}
                        className="text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg transition-colors"
                      >
                        Sample Frontend
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={8}
                    value={pastedResumeText}
                    onChange={(e) => setPastedResumeText(e.target.value)}
                    placeholder="Paste the full text of your resume here (Summary, Skills, Experience, Projects, Education)..."
                    className="w-full text-xs p-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-primary font-mono leading-relaxed"
                  />
                  <div className="flex justify-between items-center text-[11px] text-slate-400">
                    <span>Paste text or click any helper above</span>
                    <span>{pastedResumeText.length} characters</span>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 2: JOB DESCRIPTION INPUT */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      Target Job Description
                      {isJobReady && (
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                          Ready
                        </span>
                      )}
                    </h2>
                  </div>
                </div>

                {/* Mode Tabs */}
                <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setJobMode('paste')}
                    className={`px-3 py-1 rounded-md transition-all ${
                      jobMode === 'paste' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Custom JD
                  </button>
                  <button
                    type="button"
                    onClick={() => setJobMode('platform')}
                    disabled={jobs.length === 0}
                    className={`px-3 py-1 rounded-md transition-all ${
                      jobMode === 'platform' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    } disabled:opacity-50`}
                    title={jobs.length === 0 ? 'No platform jobs found' : 'Select from curated catalog jobs'}
                  >
                    Platform Jobs ({jobs.length})
                  </button>
                </div>
              </div>

              {jobMode === 'platform' ? (
                <div className="space-y-3">
                  <label className="block text-xs font-medium text-slate-600">Select an active job posting:</label>
                  <select
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.title} — {j.company_name} ({j.work_mode})
                      </option>
                    ))}
                  </select>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-500 flex justify-between items-center">
                    <span>Extracts domain requirements, tech stack, and responsibilities.</span>
                    <button
                      type="button"
                      onClick={() => navigate(`/jobs`)}
                      className="text-indigo-600 hover:underline font-semibold"
                    >
                      Browse Jobs Catalog
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {/* Quick Pre-fill Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-slate-500 text-[11px]">Quick helper pre-fills:</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setPastedJobDescription(SAMPLE_BACKEND_JD);
                          showNotice('Sample backend job spec loaded!');
                        }}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors"
                      >
                        + Backend Cloud JD
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPastedJobDescription(SAMPLE_FRONTEND_JD);
                          showNotice('Sample frontend job spec loaded!');
                        }}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors"
                      >
                        + Frontend React JD
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={8}
                    value={pastedJobDescription}
                    onChange={(e) => setPastedJobDescription(e.target.value)}
                    placeholder="Paste the target job description, responsibilities, and requirements here..."
                    className="w-full text-xs p-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono leading-relaxed"
                  />
                  <div className="flex justify-between items-center text-[11px] text-slate-400">
                    <span>Paste text or click any helper above</span>
                    <span>{pastedJobDescription.length} characters</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 3: SUBMIT TRIGGER */}
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Evaluates semantic keyword overlap, ATS parsing filters & Google Gemini rewrites</span>
            </div>

            <button
              type="button"
              onClick={handleRunAnalysis}
              disabled={analyzing}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand-primary to-brand-cyan text-white font-bold text-sm shadow-md hover:shadow-lg hover:opacity-95 transition-all disabled:opacity-70 active:scale-98"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Scanning ATS Match Score...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run ATS Match Analysis</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Presentation */}
        {analysisResult && (
          <div id="analysis-results-section" className="space-y-6 animate-in fade-in duration-300">
            {/* Top Score Banner & Breakdown Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Overall Score Dial Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center justify-center text-center shadow-sm">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  ATS Match Score
                </span>
                <div
                  className={`w-32 h-32 rounded-full border-8 flex flex-col items-center justify-center my-3 ${
                    analysisResult.overall_score >= 80
                      ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50'
                      : analysisResult.overall_score >= 60
                      ? 'border-amber-500 text-amber-700 bg-amber-50/50'
                      : 'border-rose-500 text-rose-700 bg-rose-50/50'
                  }`}
                >
                  <span className="text-4xl font-extrabold tracking-tight">{analysisResult.overall_score}%</span>
                  <span className="text-[10px] font-bold uppercase mt-0.5">Match</span>
                </div>
                <div className="mt-2">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getScoreColor(
                      analysisResult.overall_score
                    )}`}
                  >
                    {analysisResult.verdict}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 mt-2">
                  Engine: <span className="font-semibold">{analysisResult.analyzed_with}</span>
                </span>
              </div>

              {/* Dimensional Breakdown Meters */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Dimensional ATS Breakdown</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Evaluated across semantic keywords, verifiable experience metrics, academic requirements, and single-column formatting.
                  </p>
                </div>

                <div className="space-y-3.5">
                  {/* Skills Score */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>Technical Skills Overlap</span>
                      <span>{analysisResult.breakdown?.skills_score || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${getScoreBarColor(
                          analysisResult.breakdown?.skills_score || 0
                        )}`}
                        style={{ width: `${analysisResult.breakdown?.skills_score || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Experience Score */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>Experience & Quantifiable Metrics</span>
                      <span>{analysisResult.breakdown?.experience_score || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${getScoreBarColor(
                          analysisResult.breakdown?.experience_score || 0
                        )}`}
                        style={{ width: `${analysisResult.breakdown?.experience_score || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Education Score */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>Education & Coursework Alignment</span>
                      <span>{analysisResult.breakdown?.education_score || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${getScoreBarColor(
                          analysisResult.breakdown?.education_score || 0
                        )}`}
                        style={{ width: `${analysisResult.breakdown?.education_score || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Formatting Score */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>ATS Layout & Machine Readability</span>
                      <span>{analysisResult.breakdown?.formatting_score || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${getScoreBarColor(
                          analysisResult.breakdown?.formatting_score || 0
                        )}`}
                        style={{ width: `${analysisResult.breakdown?.formatting_score || 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border">
                  <strong>Executive Summary:</strong> {analysisResult.summary}
                </div>
              </div>
            </div>

            {/* Keyword Diagnostics (Matched vs Missing) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Matched Keywords */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-bold text-slate-800 text-sm">Matched Role Keywords</h3>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {analysisResult.matched_skills.length} Found
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  These keywords appear in the job description and were detected on your resume:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {analysisResult.matched_skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
                    >
                      <Check className="w-3 h-3 text-emerald-600" />
                      {skill}
                    </span>
                  ))}
                  {analysisResult.matched_skills.length === 0 && (
                    <span className="text-xs text-slate-400 italic">No matching keywords detected.</span>
                  )}
                </div>
              </div>

              {/* Missing Keywords */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <h3 className="font-bold text-slate-800 text-sm">Missing Target Keywords</h3>
                  </div>
                  <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                    {analysisResult.missing_skills.length} Missing
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  These required or preferred technologies are in the job description but missing from your resume:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {analysisResult.missing_skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200"
                    >
                      + {skill}
                    </span>
                  ))}
                  {analysisResult.missing_skills.length === 0 && (
                    <span className="text-xs text-emerald-600 font-semibold">
                      Full keyword coverage! Great match.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Critical Missing Gaps (if any) */}
            {analysisResult.critical_gaps && analysisResult.critical_gaps.length > 0 && (
              <div className="bg-amber-50/60 rounded-2xl border border-amber-200 p-6 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-700" />
                  <h3 className="font-bold text-amber-900 text-sm">Critical Qualifications & Gaps</h3>
                </div>
                <ul className="list-disc list-inside space-y-1.5 text-xs text-amber-900 leading-relaxed">
                  {analysisResult.critical_gaps.map((gap, idx) => (
                    <li key={idx}>{gap}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* AI Bullet Rewrite Recommendations */}
            {analysisResult.bullet_recommendations && analysisResult.bullet_recommendations.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-brand-primary" />
                    <h3 className="font-bold text-slate-900 text-base">Gemini AI Bullet-Point Rewrites</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    AI-generated high-impact revisions transforming passive work descriptions into quantifiable achievements integrating your target keywords.
                  </p>
                </div>

                <div className="space-y-4">
                  {analysisResult.bullet_recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 transition-colors hover:border-brand-primary/40"
                    >
                      {/* Before / Original */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Original Resume Bullet:
                        </span>
                        <p className="text-xs text-slate-600 line-through italic">{rec.original_text}</p>
                      </div>

                      {/* After / Improved */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                            Recommended AI Rewrite:
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyBullet(rec.improved_text, idx)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-primary hover:text-brand-primary-hover transition-colors"
                          >
                            {copiedIndex === idx ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-600">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Rewrite</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-xs font-semibold text-slate-900 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed shadow-2xs">
                          {rec.improved_text}
                        </p>
                      </div>

                      {/* Logic Reason */}
                      <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                        <strong className="text-slate-700">Recruiter Rationale: </strong>
                        {rec.reason}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Direct Action Link */}
                <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-xs text-slate-500">
                    Apply these edits directly in the Live ATS Resume Builder to push your score to 90%+.
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate('/resume-builder')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary-hover transition-colors"
                  >
                    Open In Resume Builder
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
