import React, { useState, useEffect, useRef } from 'react';
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
  RotateCcw,
  UploadCloud,
  FileUp,
  FileCheck,
  Trash2,
  Eye,
  EyeOff,
  XCircle,
  Activity,
  Target,
  ShieldCheck,
  CheckCircle2,
  ListChecks,
} from 'lucide-react';
import { resumeService } from '../../services/resumeService';
import { userService } from '../../services/userService';
import SEO from '@/components/common/SEO';
import { getSoftwareApplicationSchema, getBreadcrumbListSchema } from '@/utils/seoSchemas';

export default function AtsAnalyzerPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Two Analysis Modes: 'health_check' (Mode 1, New) | 'job_match' (Mode 2, Existing)
  const [analysisMode, setAnalysisMode] = useState(() => {
    const queryMode = searchParams.get('mode');
    if (queryMode === 'job_match' || searchParams.get('job_id')) return 'job_match';
    if (queryMode === 'health_check') return 'health_check';
    return 'health_check';
  });

  // Resume Input tabs: 'upload' | 'paste' | 'saved'
  const [resumeMode, setResumeMode] = useState('upload');

  // File upload state
  const fileInputRef = useRef(null);
  const [uploadedFile, setUploadedFile] = useState(null); // { name, size }
  const [uploadedExtractedText, setUploadedExtractedText] = useState('');
  const [uploadPreview, setUploadPreview] = useState('');
  const [uploadStats, setUploadStats] = useState({ characterCount: 0, wordCount: 0 });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showExtractedPreview, setShowExtractedPreview] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Data lists
  const [resumes, setResumes] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState('');

  // Selections & inputs — Empty by default as required
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [pastedResumeText, setPastedResumeText] = useState('');
  const [pastedJobDescription, setPastedJobDescription] = useState('');

  // Analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);

  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoadingInitial(true);
        const resumeRes = await resumeService.getResumes().catch(() => ({ items: [] }));
        const resumeItems = resumeRes.items || [];
        setResumes(resumeItems);
        if (resumeItems.length > 0) {
          setSelectedResumeId(resumeItems[0].id);
        }

        // Query param overrides
        const queryResumeId = searchParams.get('resume_id');
        if (queryResumeId) {
          setSelectedResumeId(queryResumeId);
          setResumeMode('saved');
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

  // Populate resume from logged-in user's actual profile (no fabricated sample data)
  const handleLoadFromProfile = async () => {
    try {
      setLoadingProfile(true);
      setErrorMsg('');
      const profile = await userService.getProfile();

      const skillsStr = Array.isArray(profile.skills)
        ? profile.skills.filter(Boolean).join(', ')
        : (profile.skills || '');

      const projectsText = (profile.projects || [])
        .map((p) => `- ${p.title}${p.domain ? ` (${p.domain})` : ''}: ${p.short_description || ''}`)
        .filter((line) => line.trim().length > 3)
        .join('\n');

      const lines = [];
      if (profile.full_name) lines.push(profile.full_name);

      const contactParts = [];
      if (profile.email) contactParts.push(`Email: ${profile.email}`);
      if (profile.phone) contactParts.push(`Phone: ${profile.phone}`);
      if (profile.location) contactParts.push(`Location: ${profile.location}`);
      if (profile.github_url) contactParts.push(`GitHub: ${profile.github_url}`);
      if (profile.portfolio_url) contactParts.push(`Portfolio: ${profile.portfolio_url}`);
      if (contactParts.length > 0) lines.push(contactParts.join(' | '));

      if (profile.headline) lines.push(`\n${profile.headline}`);

      if (profile.university || profile.degree) {
        lines.push(
          `\nEDUCATION\n${profile.degree || 'Degree'} — ${profile.university || 'University'}${
            profile.graduation_year ? ` (${profile.graduation_year})` : ''
          }`
        );
      }

      if (profile.bio) {
        lines.push(`\nSUMMARY\n${profile.bio}`);
      }

      if (skillsStr) {
        lines.push(`\nTECHNICAL SKILLS\n${skillsStr}`);
      }

      if (projectsText) {
        lines.push(`\nPROJECTS\n${projectsText}`);
      }

      const formatted = lines.join('\n').trim();
      if (!formatted) {
        setErrorMsg('Your profile has no details filled yet. Please update your profile or paste your resume text directly.');
        return;
      }

      setPastedResumeText(formatted);
      setResumeMode('paste');
      showNotice('Loaded your verified student profile into the resume input!');
    } catch (err) {
      console.error('Failed to load profile:', err);
      setErrorMsg('Unable to load your profile details. Please paste your resume text directly.');
    } finally {
      setLoadingProfile(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    const validExtensions = /\.(pdf|docx)$/i;
    if (!validExtensions.test(file.name)) {
      setUploadError('Unsupported file format. Please upload a PDF (.pdf) or Word document (.docx).');
      return;
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`File is too large (${formatFileSize(file.size)}). Maximum allowed size is 5 MB.`);
      return;
    }

    if (file.size === 0) {
      setUploadError('The selected file is empty. Please upload a valid document.');
      return;
    }

    setUploadingFile(true);
    setUploadError('');

    try {
      const res = await resumeService.extractText(file);
      if (!res.extracted_text || !res.extracted_text.trim()) {
        setUploadError('No readable text could be extracted from this document. It may be scanned or empty.');
        return;
      }

      setUploadedFile({
        name: res.filename || file.name,
        size: res.file_size || file.size,
      });
      setUploadedExtractedText(res.extracted_text);
      setUploadPreview(res.preview || res.extracted_text.slice(0, 300));
      setUploadStats({
        characterCount: res.character_count || res.extracted_text.length,
        wordCount: res.word_count || res.extracted_text.split(/\s+/).filter(Boolean).length,
      });
      showNotice(`Successfully uploaded & extracted: ${res.filename || file.name}`);
    } catch (err) {
      console.error('Resume text extraction failed:', err);
      let detail =
        err.response?.data?.detail ||
        err.message ||
        'Failed to extract text from document. Please verify the file is not corrupted.';
      if (err.response?.status === 404 || detail === 'Not Found') {
        detail =
          'Resume extraction service is not available on the connected backend yet. Please switch to the "Paste Text" tab in the meantime.';
      }
      setUploadError(detail);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setUploadedExtractedText('');
    setUploadPreview('');
    setUploadStats({ characterCount: 0, wordCount: 0 });
    setUploadError('');
    setShowExtractedPreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFiles = e.dataTransfer?.files;
    if (droppedFiles && droppedFiles.length > 0) {
      handleFileUpload(droppedFiles[0]);
    }
  };

  // Run the analysis based on active mode
  const handleRunAnalysis = async () => {
    setErrorMsg('');
    setAnalysisResult(null);

    const payload = {
      analysis_mode: analysisMode,
    };

    if (resumeMode === 'upload') {
      if (!uploadedExtractedText.trim()) {
        setErrorMsg('Please upload a valid resume (PDF or DOCX) before running the analysis.');
        return;
      }
      payload.resume_text = uploadedExtractedText.trim();
    } else if (resumeMode === 'saved') {
      if (!selectedResumeId) {
        setErrorMsg('Please select a saved resume or switch to Upload / Paste to provide your resume.');
        return;
      }
      payload.resume_id = selectedResumeId;
    } else {
      if (!pastedResumeText.trim()) {
        setErrorMsg('Please provide your resume text before running the analysis.');
        return;
      }
      payload.resume_text = pastedResumeText.trim();
    }

    if (analysisMode === 'job_match') {
      if (!pastedJobDescription.trim()) {
        setErrorMsg('Please paste the target job description before running the job match analysis.');
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
      console.error('Analysis failed:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to complete analysis. Please verify your inputs.');
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

  const getStatusBadge = (status) => {
    if (status === 'Strong') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (status === 'Missing') {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  const isResumeReady =
    resumeMode === 'upload'
      ? Boolean(uploadedExtractedText.trim())
      : resumeMode === 'saved'
      ? Boolean(selectedResumeId)
      : pastedResumeText.trim().length > 0;
  const isJobReady = pastedJobDescription.trim().length > 0;
  const isAnalyzeDisabled =
    analyzing ||
    !isResumeReady ||
    (analysisMode === 'job_match' && !isJobReady);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <SEO
        title="AI ATS Resume Analyzer & Score Matcher"
        description="Comprehensive Resume Health Check and AI ATS Match Analysis. Evaluate document readability, technical skill coverage, and job alignment."
        canonical="/ats-analyzer"
        schema={[
          getSoftwareApplicationSchema(
            "ATS Resume Analyzer",
            "Two-mode resume evaluation engine offering standalone resume health check and target job description matching.",
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
            AI-Powered Resume Intelligence
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-tight">
            ATS Resume Analyzer & Health Checker
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Run a comprehensive resume health check or evaluate exact match compatibility against any target job opening.
          </p>
        </div>

        {/* Feedback Alert Notice */}
        {noticeMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{noticeMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setNoticeMessage('')}
              className="text-emerald-600 hover:text-emerald-800 font-bold text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 1. TWO ANALYSIS MODES SELECTOR */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* MODE 1: RESUME HEALTH CHECK */}
          <button
            type="button"
            onClick={() => {
              setAnalysisMode('health_check');
              setAnalysisResult(null);
              setErrorMsg('');
            }}
            className={`p-5 rounded-3xl border-2 text-left transition-all relative overflow-hidden flex items-start gap-4 ${
              analysisMode === 'health_check'
                ? 'border-brand-primary bg-blue-50/80 shadow-sm ring-1 ring-brand-primary/20'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                analysisMode === 'health_check'
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Activity className="w-6 h-6" />
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <span>Resume Health Check</span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    No JD Needed
                  </span>
                </h3>
                {analysisMode === 'health_check' && (
                  <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0" />
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Analyze your resume structure, ATS machine readability, skills depth, quantifiable metrics, and section-by-section improvements without needing a job description.
              </p>
            </div>
          </button>

          {/* MODE 2: JOB DESCRIPTION MATCH */}
          <button
            type="button"
            onClick={() => {
              setAnalysisMode('job_match');
              setAnalysisResult(null);
              setErrorMsg('');
            }}
            className={`p-5 rounded-3xl border-2 text-left transition-all relative overflow-hidden flex items-start gap-4 ${
              analysisMode === 'job_match'
                ? 'border-indigo-600 bg-indigo-50/80 shadow-sm ring-1 ring-indigo-500/20'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                analysisMode === 'job_match'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Target className="w-6 h-6" />
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <span>Job Description Match</span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                    Role Matcher
                  </span>
                </h3>
                {analysisMode === 'job_match' && (
                  <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0" />
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Compare your resume against a specific target job opening to uncover exact matched keywords, missing tech competencies, and AI bullet rewrites.
              </p>
            </div>
          </button>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div
            className={`grid gap-8 ${
              analysisMode === 'health_check' ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'
            }`}
          >
            {/* STEP 1: RESUME INPUT */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
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
                <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-medium gap-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setResumeMode('upload')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      resumeMode === 'upload'
                        ? 'bg-white text-slate-900 shadow-xs font-semibold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload Resume</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setResumeMode('paste')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      resumeMode === 'paste'
                        ? 'bg-white text-slate-900 shadow-xs font-semibold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Paste Text</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setResumeMode('saved')}
                    disabled={resumes.length === 0}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      resumeMode === 'saved'
                        ? 'bg-white text-slate-900 shadow-xs font-semibold'
                        : 'text-slate-500 hover:text-slate-800'
                    } disabled:opacity-50`}
                    title={resumes.length === 0 ? 'No saved resumes yet' : 'Select from your saved resumes'}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Saved Resumes ({resumes.length})</span>
                  </button>
                </div>
              </div>

              {resumeMode === 'upload' ? (
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />

                  {!uploadedFile ? (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => !uploadingFile && fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                        isDragging
                          ? 'border-brand-primary bg-blue-50/70 scale-[0.99]'
                          : 'border-slate-300 hover:border-brand-primary/80 bg-slate-50/50 hover:bg-blue-50/30'
                      } ${uploadingFile ? 'pointer-events-none opacity-80' : ''}`}
                    >
                      {uploadingFile ? (
                        <div className="flex flex-col items-center gap-2 py-4">
                          <RefreshCw className="w-8 h-8 text-brand-primary animate-spin" />
                          <p className="text-xs font-semibold text-slate-800">Extracting text from resume...</p>
                          <p className="text-[11px] text-slate-500">Reading document structure and skills</p>
                        </div>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-2xl bg-blue-100/70 text-brand-primary flex items-center justify-center shadow-xs">
                            <UploadCloud className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800">
                              <span className="text-brand-primary underline hover:text-brand-secondary">Click to browse</span> or drag and drop your resume
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">Supports PDF and Word (DOCX) files up to 5 MB</p>
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider text-slate-600 bg-slate-200/70 rounded-md">
                              PDF
                            </span>
                            <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider text-slate-600 bg-slate-200/70 rounded-md">
                              DOCX
                            </span>
                            <span className="text-[11px] text-slate-400">·</span>
                            <span className="text-[11px] text-slate-400 font-medium">Max 5 MB</span>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Uploaded File Card */}
                      <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <FileCheck className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate" title={uploadedFile.name}>
                              {uploadedFile.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-slate-500">{formatFileSize(uploadedFile.size)}</span>
                              <span className="text-[11px] text-slate-300">•</span>
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <Check className="w-3 h-3" />
                                Extracted & Ready ({uploadStats.wordCount} words)
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingFile}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors shadow-2xs"
                            title="Replace with another document"
                          >
                            <FileUp className="w-3.5 h-3.5 text-slate-500" />
                            <span>Replace</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveFile}
                            disabled={uploadingFile}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 rounded-lg border border-slate-200 hover:border-rose-200 transition-colors shadow-2xs"
                            title="Remove uploaded resume"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>

                      {/* Extracted preview toggle & display */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setShowExtractedPreview(!showExtractedPreview)}
                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-primary hover:text-brand-secondary transition-colors"
                          >
                            {showExtractedPreview ? (
                              <>
                                <EyeOff className="w-3.5 h-3.5" />
                                <span>Hide Extracted Text Preview</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                <span>Preview Extracted Text ({uploadStats.characterCount} chars)</span>
                              </>
                            )}
                          </button>
                          <span className="text-[11px] text-slate-400">
                            {analysisMode === 'health_check' ? 'Ready for Health Check' : 'Ready for ATS Matching'}
                          </span>
                        </div>

                        {showExtractedPreview && (
                          <div className="p-3 bg-slate-900 text-slate-200 rounded-xl text-[11px] font-mono leading-relaxed max-h-48 overflow-y-auto border border-slate-800 animate-in fade-in duration-200">
                            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 pb-1 border-b border-slate-800">
                              Extracted Text Snapshot
                            </div>
                            <pre className="whitespace-pre-wrap font-mono text-[11px] text-slate-300">
                              {uploadedExtractedText.slice(0, 800)}
                              {uploadedExtractedText.length > 800 ? '\n\n... [Truncated for preview]' : ''}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {uploadError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{uploadError}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUploadError('')}
                        className="text-rose-600 hover:text-rose-800 text-[11px] font-bold"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              ) : resumeMode === 'saved' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <label className="block text-xs font-medium text-slate-600">Select a saved resume from your account:</label>
                    <button
                      type="button"
                      onClick={handleLoadFromProfile}
                      disabled={loadingProfile}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-primary hover:text-brand-secondary bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200 transition-colors disabled:opacity-50"
                    >
                      <User className="w-3 h-3" />
                      <span>{loadingProfile ? 'Loading...' : 'Use My Profile'}</span>
                    </button>
                  </div>
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
                      onClick={() => navigate('/templates')}
                      className="text-brand-primary hover:underline font-semibold"
                    >
                      Browse Templates
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">Profile shortcut:</span>
                    <button
                      type="button"
                      onClick={handleLoadFromProfile}
                      disabled={loadingProfile}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-primary hover:text-brand-secondary bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors disabled:opacity-50"
                    >
                      <User className="w-3 h-3" />
                      <span>{loadingProfile ? 'Loading Profile...' : 'Use My Profile'}</span>
                    </button>
                  </div>

                  <textarea
                    rows={analysisMode === 'health_check' ? 10 : 8}
                    value={pastedResumeText}
                    onChange={(e) => setPastedResumeText(e.target.value)}
                    placeholder="Paste the full text of your resume here (Summary, Skills, Experience, Projects, Education)..."
                    className="w-full text-xs p-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-primary font-mono leading-relaxed"
                  />
                  <div className="flex justify-between items-center text-[11px] text-slate-400">
                    <span>Paste text or load your profile</span>
                    <span>{pastedResumeText.length} characters</span>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 2: JOB DESCRIPTION INPUT (Displayed only in Job Match Mode) */}
            {analysisMode === 'job_match' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
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
                  <span className="text-[11px] font-medium text-slate-400">Custom Role</span>
                </div>

                <div className="space-y-2.5">
                  <p className="text-[11px] text-slate-500">
                    Paste the target job description, responsibilities, and qualifications below:
                  </p>

                  <textarea
                    rows={8}
                    value={pastedJobDescription}
                    onChange={(e) => setPastedJobDescription(e.target.value)}
                    placeholder="Paste the target job description, responsibilities, and requirements here..."
                    className="w-full text-xs p-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono leading-relaxed"
                  />
                  <div className="flex justify-between items-center text-[11px] text-slate-400">
                    <span>Paste any external or target job spec</span>
                    <span>{pastedJobDescription.length} characters</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Trigger Bar */}
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              {analysisMode === 'health_check' ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Evaluates document readability, technical skill coverage, metrics & section completeness</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Evaluates semantic keyword overlap, ATS parsing filters & Google Gemini rewrites</span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={handleRunAnalysis}
              disabled={isAnalyzeDisabled}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl text-white font-bold text-sm shadow-md hover:shadow-lg hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-98 ${
                analysisMode === 'health_check'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/20'
                  : 'bg-gradient-to-r from-brand-primary to-brand-cyan shadow-teal-500/20'
              }`}
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>
                    {analysisMode === 'health_check'
                      ? 'Performing Resume Health Check...'
                      : 'Scanning ATS Match Score...'}
                  </span>
                </>
              ) : analysisMode === 'health_check' ? (
                <>
                  <Activity className="w-4 h-4" />
                  <span>Run Resume Health Check</span>
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

        {/* RESULTS PRESENTATION */}
        {analysisResult && (
          <div id="analysis-results-section" className="space-y-6 animate-in fade-in duration-300">
            {/* ------------------------------------------------------------- */}
            {/* VIEW A: RESUME HEALTH CHECK RESULTS (MODE 1)                   */}
            {/* ------------------------------------------------------------- */}
            {analysisResult.health_check ? (
              <div className="space-y-6">
                {/* 1. Top Score Dial & Health KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Overall Quality Score Dial */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col items-center justify-center text-center shadow-sm">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Overall Resume Quality
                    </span>
                    <div
                      className={`w-32 h-32 rounded-full border-8 flex flex-col items-center justify-center my-3 ${
                        analysisResult.health_check.overall_score >= 80
                          ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50'
                          : analysisResult.health_check.overall_score >= 60
                          ? 'border-amber-500 text-amber-700 bg-amber-50/50'
                          : 'border-rose-500 text-rose-700 bg-rose-50/50'
                      }`}
                    >
                      <span className="text-4xl font-extrabold tracking-tight">
                        {analysisResult.health_check.overall_score}
                      </span>
                      <span className="text-[10px] font-bold uppercase mt-0.5">/ 100</span>
                    </div>
                    <div className="mt-2">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getScoreColor(
                          analysisResult.health_check.overall_score
                        )}`}
                      >
                        {analysisResult.health_check.verdict}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-2">
                      Engine: <span className="font-semibold">{analysisResult.analyzed_with}</span>
                    </span>
                  </div>

                  {/* ATS Compatibility Score */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          ATS Readability Score
                        </span>
                        <ShieldCheck className="w-4 h-4 text-brand-primary" />
                      </div>
                      <div className="flex items-baseline gap-2 pt-1">
                        <span className="text-3xl font-extrabold text-slate-900">
                          {analysisResult.health_check.ats_compatibility_score}%
                        </span>
                        <span className="text-xs text-slate-500 font-medium">Machine Readability</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${getScoreBarColor(
                            analysisResult.health_check.ats_compatibility_score
                          )}`}
                          style={{ width: `${analysisResult.health_check.ats_compatibility_score}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Evaluates single-column parser friendliness, standard heading conventions, and contact data extractability.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                      <span>Single-Column Format</span>
                      <span className="font-bold text-emerald-600 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Optimal
                      </span>
                    </div>
                  </div>

                  {/* Content Quality Score */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Content Impact Score
                        </span>
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="flex items-baseline gap-2 pt-1">
                        <span className="text-3xl font-extrabold text-slate-900">
                          {analysisResult.health_check.content_quality_score}%
                        </span>
                        <span className="text-xs text-slate-500 font-medium">Depth & Action Impact</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${getScoreBarColor(
                            analysisResult.health_check.content_quality_score
                          )}`}
                          style={{ width: `${analysisResult.health_check.content_quality_score}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Measures action verb diversity, quantifiable accomplishment metrics (percentages, volume), and technical depth.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                      <span>Technical Skills Identified</span>
                      <span className="font-bold text-slate-900">
                        {analysisResult.health_check.technical_skills?.length || 0} Skills
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Executive Summary & Disclaimer Banner */}
                <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-white rounded-3xl border border-blue-200 p-6 space-y-3 shadow-xs">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-900 text-sm">Resume Health Executive Assessment</h3>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                        {analysisResult.health_check.summary}
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-blue-200/60 text-[11px] text-slate-500 italic">
                    {analysisResult.health_check.disclaimer}
                  </div>
                </div>

                {/* 3. Section-by-Section Health Cards */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                        <ListChecks className="w-5 h-5 text-brand-primary" />
                        <span>Section-by-Section Quality Assessment</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Granular inspection of every core resume component with strengths, weaknesses, and recommendations.
                      </p>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      {analysisResult.health_check.section_feedback?.length || 0} Sections Analyzed
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysisResult.health_check.section_feedback?.map((sec, idx) => (
                      <div
                        key={idx}
                        className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <h4 className="font-bold text-sm text-slate-900">{sec.section_name}</h4>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(
                              sec.status
                            )}`}
                          >
                            {sec.status} ({sec.score}%)
                          </span>
                        </div>

                        {/* Strengths */}
                        {sec.strengths && sec.strengths.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Strengths:
                            </span>
                            <ul className="space-y-1 text-xs text-slate-700">
                              {sec.strengths.map((s, sIdx) => (
                                <li key={sIdx} className="flex items-start gap-1.5">
                                  <span className="text-emerald-500 mt-0.5">•</span>
                                  <span>{s}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Weaknesses */}
                        {sec.weaknesses && sec.weaknesses.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" /> Areas to Improve:
                            </span>
                            <ul className="space-y-1 text-xs text-slate-700">
                              {sec.weaknesses.map((w, wIdx) => (
                                <li key={wIdx} className="flex items-start gap-1.5">
                                  <span className="text-amber-500 mt-0.5">•</span>
                                  <span>{w}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Recommendations */}
                        {sec.recommendations && sec.recommendations.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary">
                              Recommendation:
                            </span>
                            <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 leading-relaxed">
                              {sec.recommendations.join(' ')}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Skills Detected Showcase */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Technical Skills */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-brand-primary" />
                        <span>Technical Skills Detected</span>
                      </h4>
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        {analysisResult.health_check.technical_skills?.length || 0} Found
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Standard industry technologies, languages, and tools recognized from your document:
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {analysisResult.health_check.technical_skills?.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200"
                        >
                          {skill}
                        </span>
                      ))}
                      {(!analysisResult.health_check.technical_skills ||
                        analysisResult.health_check.technical_skills.length === 0) && (
                        <span className="text-xs text-slate-400 italic">No standard technical keywords recognized.</span>
                      )}
                    </div>
                  </div>

                  {/* Soft Skills */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <Award className="w-4 h-4 text-emerald-600" />
                        <span>Professional & Soft Skills Detected</span>
                      </h4>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {analysisResult.health_check.soft_skills?.length || 0} Found
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Demonstrated teamwork, leadership, and problem-solving attributes:
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {analysisResult.health_check.soft_skills?.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
                        >
                          {skill}
                        </span>
                      ))}
                      {(!analysisResult.health_check.soft_skills ||
                        analysisResult.health_check.soft_skills.length === 0) && (
                        <span className="text-xs text-slate-400 italic">No explicit soft skills detected. Consider integrating collaborative achievements.</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 5. Missing Information Alert (if any) */}
                {analysisResult.health_check.missing_sections &&
                  analysisResult.health_check.missing_sections.length > 0 && (
                    <div className="bg-amber-50/70 rounded-3xl border border-amber-200 p-6 shadow-sm space-y-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-700" />
                        <h4 className="font-bold text-sm text-amber-900">Missing Information & Formatting Gaps</h4>
                      </div>
                      <p className="text-xs text-amber-800">
                        These valuable elements are missing from your document and would significantly elevate your resume strength:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-xs text-amber-900">
                        {analysisResult.health_check.missing_sections.map((item, idx) => (
                          <li key={idx} className="font-medium">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* 6. Detailed Actionable Recommendations */}
                {analysisResult.health_check.actionable_recommendations &&
                  analysisResult.health_check.actionable_recommendations.length > 0 && (
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-brand-primary" />
                        <h4 className="font-bold text-slate-900 text-base">Priority Actionable Improvement Plan</h4>
                      </div>
                      <p className="text-xs text-slate-500">
                        Follow these direct revisions to maximize your recruiter readability and automated ATS compliance:
                      </p>
                      <div className="space-y-3 pt-1">
                        {analysisResult.health_check.actionable_recommendations.map((rec, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3"
                          >
                            <span className="w-6 h-6 rounded-lg bg-blue-100 text-brand-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <p className="text-xs font-medium text-slate-800 leading-relaxed">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* 7. Bullet Point Rewrites */}
                {analysisResult.bullet_recommendations && analysisResult.bullet_recommendations.length > 0 && (
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-brand-primary" />
                        <h4 className="font-bold text-slate-900 text-base">Metric-Driven Bullet Rewrites</h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Example high-impact revisions transforming passive work descriptions into quantifiable achievements.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {analysisResult.bullet_recommendations.map((rec, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 transition-colors hover:border-brand-primary/40"
                        >
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Original Resume Bullet:
                            </span>
                            <p className="text-xs text-slate-600 line-through italic">{rec.original_text}</p>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                                Recommended High-Impact Rewrite:
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
                            <p className="text-xs font-semibold text-slate-900 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed shadow-2xs">
                              {rec.improved_text}
                            </p>
                          </div>

                          <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                            <strong className="text-slate-700">Recruiter Rationale: </strong>
                            {rec.reason}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ------------------------------------------------------------- */
              /* VIEW B: JOB DESCRIPTION MATCH RESULTS (MODE 2, EXISTING)      */
              /* ------------------------------------------------------------- */
              <div className="space-y-6">
                {/* Top Score Banner & Breakdown Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Overall Score Dial Card */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col items-center justify-center text-center shadow-sm">
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
                  <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
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

                    <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-2xl border">
                      <strong>Executive Summary:</strong> {analysisResult.summary}
                    </div>
                  </div>
                </div>

                {/* Keyword Diagnostics (Matched vs Missing) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Matched Keywords */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
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
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
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
                  <div className="bg-amber-50/60 rounded-3xl border border-amber-200 p-6 shadow-sm space-y-3">
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
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
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
                          className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 transition-colors hover:border-brand-primary/40"
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
                            <p className="text-xs font-semibold text-slate-900 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed shadow-2xs">
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
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
