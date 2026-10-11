import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Save,
  Printer,
  Sparkles,
  Copy,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  ArrowLeft,
  ChevronDown,
  ExternalLink,
  Layers,
  Award,
  BookOpen,
  Briefcase,
  Code,
  User,
  RefreshCw,
  Sliders,
  Download,
} from 'lucide-react';
import { resumeService } from '../../services/resumeService';
import { useAuth } from '../../context/AuthContext';

export default function ResumeBuilderPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [resumesList, setResumesList] = useState([]);
  const [currentResumeId, setCurrentResumeId] = useState(null);

  // Resume form state
  const [title, setTitle] = useState('Software Engineering Resume');
  const [templateId, setTemplateId] = useState(searchParams.get('template') || 'classic-tech');
  const [personalInfo, setPersonalInfo] = useState({
    full_name: '',
    headline: '',
    email: '',
    phone: '',
    location: '',
    github: '',
    linkedin: '',
    portfolio: '',
  });
  const [summary, setSummary] = useState('');
  const [education, setEducation] = useState([]);
  const [experience, setExperience] = useState([]);
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [certifications, setCertifications] = useState([]);

  // Load existing resumes or initialize new
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const data = await resumeService.getResumes();
        setResumesList(data.items || []);

        if (data.items && data.items.length > 0) {
          // Load most recent or primary resume
          const target = data.items[0];
          loadResumeIntoState(target);
        } else {
          // Auto-seed initial from profile
          await handleAutoFillFromProfile(templateId);
        }
      } catch (err) {
        console.error('Failed to initialize resume builder:', err);
        // Fallback default state
        setDefaultFallbackData();
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const loadResumeIntoState = (r) => {
    setCurrentResumeId(r.id);
    setTitle(r.title || 'Software Engineering Resume');
    setTemplateId(r.template_id || 'classic-tech');
    setPersonalInfo(r.personal_info || {});
    setSummary(r.summary || '');
    setEducation(r.education || []);
    setExperience(r.experience || []);
    setProjects(r.projects || []);
    setSkills(Array.isArray(r.skills) ? r.skills : []);
    setCertifications(r.certifications || []);
  };

  const setDefaultFallbackData = () => {
    setPersonalInfo({
      full_name: user?.full_name || 'Alex Rivera',
      headline: 'Software Engineer',
      email: user?.email || 'alex.rivera@example.com',
      phone: '+1 (555) 019-2834',
      location: 'San Francisco, CA',
      github: 'github.com/developer',
      linkedin: 'linkedin.com/in/developer',
      portfolio: '',
    });
    setSummary(
      'Results-driven Software Engineer with hands-on experience building full-stack web applications and scalable APIs. Passionate about automated testing, performance optimization, and clean architecture.'
    );
    setEducation([
      {
        institution: 'University of Washington',
        degree: 'B.S. in Computer Science',
        location: 'Seattle, WA',
        start_date: '2021',
        end_date: '2025',
        gpa: '3.85 / 4.0',
        highlights: "Algorithms, Distributed Systems, Database Management, Dean's List",
      },
    ]);
    setExperience([
      {
        role: 'Software Engineering Intern',
        company: 'CloudNova Systems',
        location: 'Remote',
        start_date: 'May 2024',
        end_date: 'Aug 2024',
        current: false,
        bullets: [
          'Engineered asynchronous REST APIs utilizing FastAPI and PostgreSQL, cutting P95 response latency by 32%.',
          'Automated real-time event notifications via WebSockets with 99.9% delivery reliability.',
          'Built end-to-end integration test runners in GitHub Actions achieving 94% test coverage.',
        ],
      },
    ]);
    setProjects([
      {
        name: 'NexusFlow: Real-Time Event Dispatcher',
        tech_stack: 'Python, FastAPI, WebSocket, Redis, Docker',
        link: 'github.com/developer/nexusflow',
        bullets: [
          'Constructed high-speed pub/sub message broadcaster handling 2,000 concurrent socket connections.',
          'Designed fault-tolerant auto-reconnection and JWT authentication mechanisms.',
        ],
      },
    ]);
    setSkills([
      'Python',
      'FastAPI',
      'JavaScript',
      'React',
      'TypeScript',
      'PostgreSQL',
      'Docker',
      'Git',
      'REST APIs',
      'Tailwind CSS',
    ]);
    setCertifications([
      { name: 'AWS Certified Cloud Practitioner', issuer: 'Amazon Web Services', date: '2024' },
    ]);
  };

  const handleAutoFillFromProfile = async (targetTemplate = templateId) => {
    try {
      setSaving(true);
      const seeded = await resumeService.seedFromProfile(targetTemplate);
      loadResumeIntoState(seeded);
      setResumesList((prev) => [seeded, ...prev.filter((item) => item.id !== seeded.id)]);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to seed from profile:', err);
      setDefaultFallbackData();
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        title,
        template_id: templateId,
        personal_info: personalInfo,
        summary,
        education,
        experience,
        projects,
        skills,
        certifications,
        is_primary: true,
      };

      let updated;
      if (currentResumeId) {
        updated = await resumeService.updateResume(currentResumeId, payload);
      } else {
        updated = await resumeService.createResume(payload);
        setCurrentResumeId(updated.id);
      }
      setResumesList((prev) => [updated, ...prev.filter((item) => item.id !== updated.id)]);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save resume:', err);
      alert('Could not save resume. Please verify connectivity.');
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async () => {
    if (!currentResumeId) return;
    try {
      setSaving(true);
      const dup = await resumeService.duplicateResume(currentResumeId);
      loadResumeIntoState(dup);
      setResumesList((prev) => [dup, ...prev]);
    } catch (err) {
      console.error('Failed to duplicate resume:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      let targetId = currentResumeId;
      const payload = {
        title,
        template_id: templateId,
        personal_info: personalInfo,
        summary,
        education,
        experience,
        projects,
        skills,
        certifications,
        is_primary: true,
      };

      if (!targetId) {
        const saved = await resumeService.createResume(payload);
        targetId = saved.id;
        setCurrentResumeId(saved.id);
        setResumesList((prev) => [saved, ...prev]);
      } else {
        await resumeService.updateResume(targetId, payload);
      }

      const safeName = (personalInfo.full_name || 'Resume').replace(/[^a-zA-Z0-9_-]/g, '_');
      await resumeService.exportPdf(targetId, `${safeName}_ATS_Resume.pdf`);
    } catch (err) {
      console.error('Failed to export ATS PDF:', err);
      alert('Could not generate ATS PDF. Please check your network connection.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Education Helpers
  const addEducation = () => {
    setEducation([
      ...education,
      {
        institution: '',
        degree: '',
        location: '',
        start_date: '',
        end_date: '',
        gpa: '',
        highlights: '',
      },
    ]);
  };

  const updateEducation = (idx, field, val) => {
    const list = [...education];
    list[idx][field] = val;
    setEducation(list);
  };

  const removeEducation = (idx) => {
    setEducation(education.filter((_, i) => i !== idx));
  };

  // Experience Helpers
  const addExperience = () => {
    setExperience([
      ...experience,
      {
        role: '',
        company: '',
        location: '',
        start_date: '',
        end_date: '',
        current: false,
        bullets: [''],
      },
    ]);
  };

  const updateExperience = (idx, field, val) => {
    const list = [...experience];
    list[idx][field] = val;
    setExperience(list);
  };

  const addExperienceBullet = (expIdx) => {
    const list = [...experience];
    list[expIdx].bullets = [...(list[expIdx].bullets || []), ''];
    setExperience(list);
  };

  const updateExperienceBullet = (expIdx, bIdx, val) => {
    const list = [...experience];
    list[expIdx].bullets[bIdx] = val;
    setExperience(list);
  };

  const removeExperienceBullet = (expIdx, bIdx) => {
    const list = [...experience];
    list[expIdx].bullets = list[expIdx].bullets.filter((_, i) => i !== bIdx);
    setExperience(list);
  };

  const removeExperience = (idx) => {
    setExperience(experience.filter((_, i) => i !== idx));
  };

  // Project Helpers
  const addProject = () => {
    setProjects([
      ...projects,
      {
        name: '',
        tech_stack: '',
        link: '',
        bullets: [''],
      },
    ]);
  };

  const updateProject = (idx, field, val) => {
    const list = [...projects];
    list[idx][field] = val;
    setProjects(list);
  };

  const addProjectBullet = (pIdx) => {
    const list = [...projects];
    list[pIdx].bullets = [...(list[pIdx].bullets || []), ''];
    setProjects(list);
  };

  const updateProjectBullet = (pIdx, bIdx, val) => {
    const list = [...projects];
    list[pIdx].bullets[bIdx] = val;
    setProjects(list);
  };

  const removeProjectBullet = (pIdx, bIdx) => {
    const list = [...projects];
    list[pIdx].bullets = list[pIdx].bullets.filter((_, i) => i !== bIdx);
    setProjects(list);
  };

  const removeProject = (idx) => {
    setProjects(projects.filter((_, i) => i !== idx));
  };

  // Skill Helpers
  const handleAddSkill = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = skillInput.trim();
      if (val && !skills.includes(val)) {
        setSkills([...skills, val]);
      }
      setSkillInput('');
    }
  };

  const removeSkill = (skill) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  // Calculate ATS Quality Score
  const computeAtsScore = () => {
    let score = 0;
    const items = [];

    // 1. Personal info (max 20)
    if (personalInfo.full_name && personalInfo.email && personalInfo.phone) {
      score += 20;
      items.push({ text: 'Core contact information present', pass: true });
    } else {
      items.push({ text: 'Add name, email, and phone number', pass: false });
    }

    // 2. Summary (max 15)
    if (summary && summary.length >= 60) {
      score += 15;
      items.push({ text: 'Professional summary includes impact narrative', pass: true });
    } else {
      items.push({ text: 'Write a concise 2-3 sentence summary (60+ characters)', pass: false });
    }

    // 3. Education (max 15)
    if (education.length > 0 && education[0].institution && education[0].degree) {
      score += 15;
      items.push({ text: 'University credentials clearly formatted', pass: true });
    } else {
      items.push({ text: 'Include university and expected graduation degree', pass: false });
    }

    // 4. Experience & action bullets (max 20)
    const hasBullets = experience.some((e) => (e.bullets || []).some((b) => /\d+%|\d+x|\d+k/i.test(b)));
    if (experience.length > 0) {
      if (hasBullets) {
        score += 20;
        items.push({ text: 'Experience highlights quantifiable metrics (%, numbers)', pass: true });
      } else {
        score += 12;
        items.push({ text: 'Add quantifiable metrics (e.g. 35%, 10x) to experience bullets', pass: false });
      }
    } else {
      items.push({ text: 'Add at least one internship or work experience role', pass: false });
    }

    // 5. Projects (max 15)
    if (projects.length >= 1 && projects[0].name && projects[0].tech_stack) {
      score += 15;
      items.push({ text: 'Technical projects with stack and links', pass: true });
    } else {
      items.push({ text: 'Showcase at least 1-2 flagship engineering projects', pass: false });
    }

    // 6. Skills (max 15)
    if (skills.length >= 6) {
      score += 15;
      items.push({ text: 'Technical skills matrix contains 6+ target keywords', pass: true });
    } else {
      items.push({ text: 'List at least 6 technical skills/tools for ATS matching', pass: false });
    }

    return { score: Math.min(score, 100), items };
  };

  const { score: atsScore, items: checklistItems } = computeAtsScore();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Print Stylesheet Overrides */}
      <style>{`
        @media print {
          body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          nav, header, aside, .no-print {
            display: none !important;
          }
          .resume-preview-sheet {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          @page {
            size: A4;
            margin: 12mm 15mm;
          }
        }
      `}</style>

      {/* Top Application Bar */}
      <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Left: Back & Title Edit */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/templates')}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Back to Templates"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="font-bold text-slate-800 text-lg border-b border-transparent hover:border-slate-300 focus:border-brand-primary focus:outline-none px-1 py-0.5 rounded transition-all"
                placeholder="Resume Title"
              />
              <span className="text-xs text-slate-400 hidden sm:inline">• Live ATS Editor</span>
            </div>
          </div>

          {/* Center: Template Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium hidden md:inline">Template:</span>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="text-xs font-semibold bg-slate-100 hover:bg-slate-200/80 text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="classic-tech">Classic Tech (Ivy CS)</option>
              <option value="modern-minimal">Modern Minimal</option>
              <option value="research-academic">Research & Academic</option>
              <option value="compact-dense">Compact Executive</option>
            </select>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2.5">
            {/* ATS Score Indicator */}
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg border border-emerald-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>ATS Score: {atsScore}%</span>
            </div>

            <button
              onClick={() => handleAutoFillFromProfile()}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              title="Sync from Student Profile & Projects"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync Profile</span>
            </button>

            <button
              onClick={handleDuplicate}
              disabled={saving}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="Duplicate Resume"
            >
              <Copy className="w-4 h-4" />
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf || saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 rounded-lg transition-colors border border-brand-primary/20 shadow-sm"
              title="Download high-fidelity ATS-parsable PDF"
            >
              <Download className={`w-3.5 h-3.5 ${downloadingPdf ? 'animate-bounce' : ''}`} />
              <span>{downloadingPdf ? 'Generating...' : 'Download PDF'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print</span>
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-brand-primary hover:bg-brand-primary-hover rounded-lg shadow-sm transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Split-Pane Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto p-4 gap-6">
        {/* Left Pane: Interactive Structured Form Editor */}
        <div className="no-print w-full lg:w-1/2 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-[calc(100vh-5.5rem)]">
          {/* Section Navigation Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50/80 overflow-x-auto text-xs font-semibold text-slate-600 scrollbar-none">
            <button
              onClick={() => setActiveTab('personal')}
              className={`px-4 py-3 whitespace-nowrap flex items-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'personal'
                  ? 'border-brand-primary text-brand-primary bg-white'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Contact
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-4 py-3 whitespace-nowrap flex items-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'summary'
                  ? 'border-brand-primary text-brand-primary bg-white'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Summary
            </button>
            <button
              onClick={() => setActiveTab('skills')}
              className={`px-4 py-3 whitespace-nowrap flex items-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'skills'
                  ? 'border-brand-primary text-brand-primary bg-white'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              Skills
            </button>
            <button
              onClick={() => setActiveTab('experience')}
              className={`px-4 py-3 whitespace-nowrap flex items-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'experience'
                  ? 'border-brand-primary text-brand-primary bg-white'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              Experience
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-4 py-3 whitespace-nowrap flex items-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'projects'
                  ? 'border-brand-primary text-brand-primary bg-white'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Projects
            </button>
            <button
              onClick={() => setActiveTab('education')}
              className={`px-4 py-3 whitespace-nowrap flex items-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'education'
                  ? 'border-brand-primary text-brand-primary bg-white'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              Education
            </button>
            <button
              onClick={() => setActiveTab('checklist')}
              className={`px-4 py-3 whitespace-nowrap flex items-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'checklist'
                  ? 'border-brand-primary text-brand-primary bg-white'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              ATS Audit
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 p-5 overflow-y-auto space-y-5">
            {/* 1. PERSONAL INFO TAB */}
            {activeTab === 'personal' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800">Contact & Header Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={personalInfo.full_name || ''}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, full_name: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary"
                      placeholder="e.g. Alex Rivera"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Target Headline / Title</label>
                    <input
                      type="text"
                      value={personalInfo.headline || ''}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, headline: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary"
                      placeholder="e.g. Software Engineer (Cloud)"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={personalInfo.email || ''}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary"
                      placeholder="alex@university.edu"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={personalInfo.phone || ''}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary"
                      placeholder="+1 (555) 019-2834"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Location</label>
                    <input
                      type="text"
                      value={personalInfo.location || ''}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, location: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary"
                      placeholder="City, State / Country"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">GitHub URL</label>
                    <input
                      type="text"
                      value={personalInfo.github || ''}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, github: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary"
                      placeholder="github.com/alexrivera"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">LinkedIn URL</label>
                    <input
                      type="text"
                      value={personalInfo.linkedin || ''}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, linkedin: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary"
                      placeholder="linkedin.com/in/alexrivera"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Portfolio / Blog</label>
                    <input
                      type="text"
                      value={personalInfo.portfolio || ''}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, portfolio: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary"
                      placeholder="alexrivera.dev"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. SUMMARY TAB */}
            {activeTab === 'summary' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-800">Professional Summary</h3>
                  <span className="text-[11px] text-slate-400">{summary.length} characters</span>
                </div>
                <p className="text-xs text-slate-500">
                  Highlight your core technical strengths, relevant domain focus, and quantifiable achievements in 2–3
                  lines.
                </p>
                <textarea
                  rows={6}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary leading-relaxed"
                  placeholder="e.g. Versatile Software Engineer with strong background in distributed systems, backend APIs, and React interfaces..."
                />
              </div>
            )}

            {/* 3. SKILLS TAB */}
            {activeTab === 'skills' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800">Technical Skills & Technologies</h3>
                <p className="text-xs text-slate-500">
                  Type a programming language, framework, or cloud tool and press <strong>Enter</strong> or comma to add.
                </p>
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleAddSkill}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  placeholder="Type a skill (e.g. Python, Docker, PostgreSQL) and hit Enter..."
                />

                <div className="flex flex-wrap gap-2 pt-2">
                  {skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200"
                    >
                      {skill}
                      <button
                        onClick={() => removeSkill(skill)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                  {skills.length === 0 && (
                    <div className="text-xs text-slate-400 italic">No skills added yet.</div>
                  )}
                </div>
              </div>
            )}

            {/* 4. EXPERIENCE TAB */}
            {activeTab === 'experience' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-800">Work Experience & Internships</h3>
                  <button
                    onClick={addExperience}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-primary/10 text-brand-primary text-xs font-semibold hover:bg-brand-primary/20 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Experience
                  </button>
                </div>

                {experience.map((exp, expIdx) => (
                  <div key={expIdx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 relative">
                    <button
                      onClick={() => removeExperience(expIdx)}
                      className="absolute top-3 right-3 text-slate-400 hover:text-red-500 transition-colors"
                      title="Remove Role"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-6">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Role / Title</label>
                        <input
                          type="text"
                          value={exp.role || ''}
                          onChange={(e) => updateExperience(expIdx, 'role', e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                          placeholder="Software Engineer Intern"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Company</label>
                        <input
                          type="text"
                          value={exp.company || ''}
                          onChange={(e) => updateExperience(expIdx, 'company', e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                          placeholder="Acme Corp"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Location</label>
                        <input
                          type="text"
                          value={exp.location || ''}
                          onChange={(e) => updateExperience(expIdx, 'location', e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                          placeholder="Seattle, WA or Remote"
                        />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Start Date</label>
                          <input
                            type="text"
                            value={exp.start_date || ''}
                            onChange={(e) => updateExperience(expIdx, 'start_date', e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                            placeholder="May 2024"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-[11px] font-medium text-slate-600 mb-0.5">End Date</label>
                          <input
                            type="text"
                            value={exp.end_date || ''}
                            onChange={(e) => updateExperience(expIdx, 'end_date', e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                            placeholder="Aug 2024"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bullet Points */}
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-slate-700">Action Impact Bullets</span>
                        <button
                          onClick={() => addExperienceBullet(expIdx)}
                          className="text-[10px] text-brand-primary hover:underline font-semibold"
                        >
                          + Add Bullet
                        </button>
                      </div>
                      {(exp.bullets || []).map((bullet, bIdx) => (
                        <div key={bIdx} className="flex items-center gap-2">
                          <span className="text-slate-400 text-xs">•</span>
                          <input
                            type="text"
                            value={bullet}
                            onChange={(e) => updateExperienceBullet(expIdx, bIdx, e.target.value)}
                            className="flex-1 text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                            placeholder="Architected REST APIs reducing latency by 35%..."
                          />
                          <button
                            onClick={() => removeExperienceBullet(expIdx, bIdx)}
                            className="text-slate-400 hover:text-red-500"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 5. PROJECTS TAB */}
            {activeTab === 'projects' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-800">Flagship Projects</h3>
                  <button
                    onClick={addProject}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-primary/10 text-brand-primary text-xs font-semibold hover:bg-brand-primary/20 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Project
                  </button>
                </div>

                {projects.map((proj, pIdx) => (
                  <div key={pIdx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 relative">
                    <button
                      onClick={() => removeProject(pIdx)}
                      className="absolute top-3 right-3 text-slate-400 hover:text-red-500 transition-colors"
                      title="Remove Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-6">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Project Name</label>
                        <input
                          type="text"
                          value={proj.name || ''}
                          onChange={(e) => updateProject(pIdx, 'name', e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                          placeholder="NexusFlow: Real-Time Engine"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Tech Stack</label>
                        <input
                          type="text"
                          value={proj.tech_stack || ''}
                          onChange={(e) => updateProject(pIdx, 'tech_stack', e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                          placeholder="FastAPI, React, Redis, Docker"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Link / Repository</label>
                        <input
                          type="text"
                          value={proj.link || ''}
                          onChange={(e) => updateProject(pIdx, 'link', e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                          placeholder="github.com/developer/nexusflow"
                        />
                      </div>
                    </div>

                    {/* Bullet Points */}
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-slate-700">Project Highlights</span>
                        <button
                          onClick={() => addProjectBullet(pIdx)}
                          className="text-[10px] text-brand-primary hover:underline font-semibold"
                        >
                          + Add Bullet
                        </button>
                      </div>
                      {(proj.bullets || []).map((bullet, bIdx) => (
                        <div key={bIdx} className="flex items-center gap-2">
                          <span className="text-slate-400 text-xs">•</span>
                          <input
                            type="text"
                            value={bullet}
                            onChange={(e) => updateProjectBullet(pIdx, bIdx, e.target.value)}
                            className="flex-1 text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                            placeholder="Built pub/sub system handling 2k active socket clients..."
                          />
                          <button
                            onClick={() => removeProjectBullet(pIdx, bIdx)}
                            className="text-slate-400 hover:text-red-500"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 6. EDUCATION TAB */}
            {activeTab === 'education' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-800">Education & Degrees</h3>
                  <button
                    onClick={addEducation}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-primary/10 text-brand-primary text-xs font-semibold hover:bg-brand-primary/20 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Degree
                  </button>
                </div>

                {education.map((edu, eduIdx) => (
                  <div key={eduIdx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 relative">
                    <button
                      onClick={() => removeEducation(eduIdx)}
                      className="absolute top-3 right-3 text-slate-400 hover:text-red-500 transition-colors"
                      title="Remove Education"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-6">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Institution</label>
                        <input
                          type="text"
                          value={edu.institution || ''}
                          onChange={(e) => updateEducation(eduIdx, 'institution', e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                          placeholder="University of Washington"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Degree & Major</label>
                        <input
                          type="text"
                          value={edu.degree || ''}
                          onChange={(e) => updateEducation(eduIdx, 'degree', e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                          placeholder="B.S. in Computer Science"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-0.5">GPA (Optional)</label>
                        <input
                          type="text"
                          value={edu.gpa || ''}
                          onChange={(e) => updateEducation(eduIdx, 'gpa', e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                          placeholder="3.85 / 4.0"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Graduation Date</label>
                        <input
                          type="text"
                          value={edu.end_date || ''}
                          onChange={(e) => updateEducation(eduIdx, 'end_date', e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                          placeholder="May 2025"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Relevant Coursework</label>
                        <input
                          type="text"
                          value={edu.highlights || ''}
                          onChange={(e) => updateEducation(eduIdx, 'highlights', e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                          placeholder="Distributed Systems, Algorithms, Database Design"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 7. CHECKLIST TAB */}
            {activeTab === 'checklist' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">ATS Quality Audit</h3>
                    <p className="text-xs text-slate-500">
                      Evaluated against automated parsing standards for top enterprise recruiting bots.
                    </p>
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-600">{atsScore}%</div>
                </div>

                <div className="space-y-2">
                  {checklistItems.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border flex items-start gap-3 ${
                        item.pass ? 'bg-emerald-50/50 border-emerald-200' : 'bg-amber-50/50 border-amber-200'
                      }`}
                    >
                      {item.pass ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      )}
                      <span className={`text-xs ${item.pass ? 'text-emerald-900 font-medium' : 'text-amber-900'}`}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Live Real-Time A4 Document Preview */}
        <div className="w-full lg:w-1/2 flex flex-col items-center overflow-y-auto max-h-[calc(100vh-5.5rem)]">
          {/* Document Container */}
          <div
            className={`resume-preview-sheet w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 p-8 sm:p-12 rounded-xl shadow-lg border border-slate-200 font-sans transition-all duration-200 ${
              templateId === 'compact-dense' ? 'text-[11px] leading-tight' : 'text-xs leading-normal'
            }`}
          >
            {/* Header & Personal Info */}
            <div
              className={`text-center pb-3 border-b ${
                templateId === 'modern-minimal'
                  ? 'border-sky-500/40 text-left flex justify-between items-end'
                  : 'border-slate-800 text-center'
              }`}
            >
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">
                  {personalInfo.full_name || 'YOUR FULL NAME'}
                </h1>
                {personalInfo.headline && (
                  <p className="text-slate-600 font-medium text-xs mt-0.5">{personalInfo.headline}</p>
                )}
              </div>

              <div
                className={`text-[11px] text-slate-600 space-y-0.5 ${
                  templateId === 'modern-minimal' ? 'text-right' : 'mt-1.5'
                }`}
              >
                <div>
                  {personalInfo.email && <span>{personalInfo.email}</span>}
                  {personalInfo.phone && <span> • {personalInfo.phone}</span>}
                  {personalInfo.location && <span> • {personalInfo.location}</span>}
                </div>
                {(personalInfo.github || personalInfo.linkedin) && (
                  <div className="text-sky-700 font-medium">
                    {personalInfo.github && <span>{personalInfo.github}</span>}
                    {personalInfo.linkedin && <span> • {personalInfo.linkedin}</span>}
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            {summary && (
              <div className="mt-3.5">
                <h2
                  className={`font-bold uppercase tracking-wider text-slate-900 border-b pb-0.5 mb-1.5 ${
                    templateId === 'modern-minimal' ? 'border-sky-500/30 text-sky-800' : 'border-slate-300'
                  }`}
                >
                  Professional Summary
                </h2>
                <p className="text-slate-700 leading-relaxed text-[11px]">{summary}</p>
              </div>
            )}

            {/* Technical Skills */}
            {skills.length > 0 && (
              <div className="mt-3.5">
                <h2
                  className={`font-bold uppercase tracking-wider text-slate-900 border-b pb-0.5 mb-1.5 ${
                    templateId === 'modern-minimal' ? 'border-sky-500/30 text-sky-800' : 'border-slate-300'
                  }`}
                >
                  Technical Skills
                </h2>
                <div className="text-[11px] text-slate-700">
                  <span className="font-semibold text-slate-900">Languages & Tools: </span>
                  {skills.join(', ')}
                </div>
              </div>
            )}

            {/* Experience */}
            {experience.length > 0 && (
              <div className="mt-3.5">
                <h2
                  className={`font-bold uppercase tracking-wider text-slate-900 border-b pb-0.5 mb-1.5 ${
                    templateId === 'modern-minimal' ? 'border-sky-500/30 text-sky-800' : 'border-slate-300'
                  }`}
                >
                  Experience
                </h2>
                <div className="space-y-3">
                  {experience.map((exp, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-baseline text-[11px]">
                        <div>
                          <span className="font-bold text-slate-900">{exp.role || 'Role'}</span>
                          <span className="text-slate-600 font-medium"> — {exp.company || 'Company'}</span>
                          {exp.location && <span className="text-slate-500 italic"> ({exp.location})</span>}
                        </div>
                        <span className="text-slate-600 font-medium">
                          {exp.start_date} {exp.start_date && exp.end_date ? '–' : ''} {exp.end_date}
                        </span>
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-700">
                        {(exp.bullets || []).filter(Boolean).map((bullet, bIdx) => (
                          <li key={bIdx} className="leading-snug">
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Flagship Projects */}
            {projects.length > 0 && (
              <div className="mt-3.5">
                <h2
                  className={`font-bold uppercase tracking-wider text-slate-900 border-b pb-0.5 mb-1.5 ${
                    templateId === 'modern-minimal' ? 'border-sky-500/30 text-sky-800' : 'border-slate-300'
                  }`}
                >
                  Key Projects
                </h2>
                <div className="space-y-3">
                  {projects.map((proj, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="flex justify-between items-baseline text-[11px]">
                        <div>
                          <span className="font-bold text-slate-900">{proj.name || 'Project Name'}</span>
                          {proj.tech_stack && (
                            <span className="text-slate-600 italic"> | {proj.tech_stack}</span>
                          )}
                        </div>
                        {proj.link && <span className="text-sky-700 text-[10px]">{proj.link}</span>}
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-700">
                        {(proj.bullets || []).filter(Boolean).map((bullet, bIdx) => (
                          <li key={bIdx} className="leading-snug">
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {education.length > 0 && (
              <div className="mt-3.5">
                <h2
                  className={`font-bold uppercase tracking-wider text-slate-900 border-b pb-0.5 mb-1.5 ${
                    templateId === 'modern-minimal' ? 'border-sky-500/30 text-sky-800' : 'border-slate-300'
                  }`}
                >
                  Education
                </h2>
                <div className="space-y-2">
                  {education.map((edu, idx) => (
                    <div key={idx} className="flex justify-between items-start text-[11px]">
                      <div>
                        <div className="font-bold text-slate-900">{edu.institution || 'University'}</div>
                        <div className="text-slate-700">
                          {edu.degree || 'Degree'}
                          {edu.gpa && <span className="font-medium text-slate-600"> (GPA: {edu.gpa})</span>}
                        </div>
                        {edu.highlights && (
                          <div className="text-slate-500 text-[10px] mt-0.5">Coursework: {edu.highlights}</div>
                        )}
                      </div>
                      <span className="text-slate-600 font-medium">{edu.end_date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications (if any) */}
            {certifications.length > 0 && (
              <div className="mt-3.5">
                <h2
                  className={`font-bold uppercase tracking-wider text-slate-900 border-b pb-0.5 mb-1.5 ${
                    templateId === 'modern-minimal' ? 'border-sky-500/30 text-sky-800' : 'border-slate-300'
                  }`}
                >
                  Certifications & Honors
                </h2>
                <div className="space-y-1 text-[11px] text-slate-700">
                  {certifications.map((cert, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="font-medium text-slate-900">{cert.name}</span>
                      <span className="text-slate-500">{cert.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
