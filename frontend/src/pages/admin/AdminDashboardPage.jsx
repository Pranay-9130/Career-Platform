import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Clock,
  Users,
  AlertCircle,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ExternalLink,
  Eye,
  RefreshCw,
  Search,
  Filter,
  Sparkles,
  FileText,
  Github,
  Globe,
  Download,
  Layers,
  ChevronRight,
  Briefcase,
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Mail,
  GraduationCap,
  Star,
  Palette,
  Check,
  X,
  Building,
  MapPin,
  DollarSign,
  Send,
} from 'lucide-react';
import adminService from '../../services/adminService';
import { Button, Badge, Modal, Input, Alert } from '@/components/common';
import { formatSalary, formatDeadline } from '@/utils/jobHelpers';

export default function AdminDashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Active Tab: overview | projects | jobs | students | templates
  const getTabFromPath = () => {
    if (location.pathname.includes('/admin/projects')) return 'projects';
    if (location.pathname.includes('/admin/jobs')) return 'jobs';
    if (location.pathname.includes('/admin/students')) return 'students';
    if (location.pathname.includes('/admin/templates')) return 'templates';
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState(getTabFromPath());

  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [location.pathname]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'overview') navigate('/admin/dashboard');
    else navigate(`/admin/${tabId}`);
  };

  // Global KPI Stats
  const [stats, setStats] = useState({
    pending_submissions: 0,
    published_projects: 0,
    total_students: 0,
    total_jobs: 0,
    flagged_reports: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // 1. Projects Queue State
  const [queue, setQueue] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [projectStatusFilter, setProjectStatusFilter] = useState('Submitted');
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [moderating, setModerating] = useState(false);
  const [moderationFeedback, setModerationFeedback] = useState(null);

  // 2. Jobs Management State
  const [jobsList, setJobsList] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState('all');
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [jobFormSubmitting, setJobFormSubmitting] = useState(false);
  const [jobActionFeedback, setJobActionFeedback] = useState(null);

  const initialJobFormData = {
    title: '',
    company_name: '',
    company_logo_url: '',
    company_website: '',
    domain: 'Software Engineering',
    job_type: 'Full-time',
    work_mode: 'Remote',
    location: 'Remote',
    has_salary: false,
    stipend_or_salary: '',
    experience_level: 'Entry Level',
    skills_required: '',
    description: '',
    responsibilities: '',
    requirements: '',
    apply_url: '',
    is_active: true,
    is_featured: false,
    no_deadline: true,
    deadline: '',
  };
  const [jobFormData, setJobFormData] = useState(initialJobFormData);

  // 3. Students Directory State
  const [studentsList, setStudentsList] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // 4. Resume Templates State
  const [templatesList, setTemplatesList] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateFormSubmitting, setTemplateFormSubmitting] = useState(false);
  const [templateActionFeedback, setTemplateActionFeedback] = useState(null);
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  const [templateStatusFilter, setTemplateStatusFilter] = useState('ALL');

  const initialTemplateFormData = {
    id: '',
    name: '',
    badge: 'Professional',
    description: '',
    tagline: '',
    preview_image_url: '',
    download_url: '',
    ats_score: '98/100',
    best_for: 'Software Engineers, Freshers, All Domains',
    preview_accent: '#F97316',
    is_active: true,
  };
  const [templateFormData, setTemplateFormData] = useState(initialTemplateFormData);

  // =========================================================================
  // API LOADERS
  // =========================================================================

  const fetchStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const data = await adminService.getAdminStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchQueue = useCallback(async () => {
    try {
      setLoadingQueue(true);
      const data = await adminService.getModerationQueue(projectStatusFilter);
      setQueue(data || []);
    } catch (err) {
      console.error('Failed to load moderation queue:', err);
    } finally {
      setLoadingQueue(false);
    }
  }, [projectStatusFilter]);

  const fetchJobs = useCallback(async () => {
    try {
      setLoadingJobs(true);
      const data = await adminService.getJobs({
        search: jobSearchQuery,
        status: jobStatusFilter,
      });
      setJobsList(data || []);
    } catch (err) {
      console.error('Failed to load admin jobs:', err);
    } finally {
      setLoadingJobs(false);
    }
  }, [jobSearchQuery, jobStatusFilter]);

  const fetchStudents = useCallback(async () => {
    try {
      setLoadingStudents(true);
      const data = await adminService.getStudents({
        search: studentSearchQuery,
      });
      setStudentsList(data || []);
    } catch (err) {
      console.error('Failed to load students directory:', err);
    } finally {
      setLoadingStudents(false);
    }
  }, [studentSearchQuery]);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoadingTemplates(true);
      const data = await adminService.getTemplates();
      setTemplatesList(data || []);
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (activeTab === 'overview' || activeTab === 'projects') {
      fetchQueue();
    }
    if (activeTab === 'jobs') {
      fetchJobs();
    }
    if (activeTab === 'students') {
      fetchStudents();
    }
    if (activeTab === 'templates') {
      fetchTemplates();
    }
  }, [activeTab, fetchQueue, fetchJobs, fetchStudents, fetchTemplates]);

  // =========================================================================
  // MODERATION ACTIONS (With automated student email notification)
  // =========================================================================

  const handleOpenReview = (project) => {
    setSelectedProject(project);
    setReviewerNotes(project.reviewer_notes || '');
    setModerationFeedback(null);
  };

  const handleModerate = async (action) => {
    if (!selectedProject) return;

    if ((action === 'reject' || action === 'request_changes') && !reviewerNotes.trim()) {
      setModerationFeedback({
        type: 'error',
        text: 'Please provide feedback comments so the student knows why their submission was rejected or what changes are needed.',
      });
      return;
    }

    try {
      setModerating(true);
      const updated = await adminService.moderateProject(selectedProject.id, {
        action,
        reviewer_notes: reviewerNotes.trim() || undefined,
      });

      const actionText =
        action === 'approve'
          ? 'approved & published to the showcase'
          : action === 'reject'
          ? 'rejected (feedback comments emailed to student)'
          : 'returned for revisions (instructions emailed to student)';

      setModerationFeedback({
        type: action === 'approve' ? 'success' : action === 'reject' ? 'error' : 'warning',
        text: `Project '${updated.title}' has been ${actionText}! Email notification dispatched.`,
      });

      // Update queue locally
      setQueue((prev) =>
        projectStatusFilter === 'All'
          ? prev.map((p) => (p.id === updated.id ? updated : p))
          : prev.filter((p) => p.id !== updated.id)
      );

      fetchStats();

      setTimeout(() => {
        setSelectedProject(null);
        setModerationFeedback(null);
      }, 1500);
    } catch (err) {
      console.error('Moderation action failed:', err);
      setModerationFeedback({
        type: 'error',
        text: err?.response?.data?.detail || 'Failed to apply moderation action. Please try again.',
      });
    } finally {
      setModerating(false);
    }
  };

  // =========================================================================
  // JOBS ACTIONS (Add, Edit, Toggle Publish, Delete)
  // =========================================================================

  const handleOpenCreateJob = () => {
    setEditingJob(null);
    setJobFormData(initialJobFormData);
    setJobActionFeedback(null);
    setIsJobModalOpen(true);
  };

  const handleOpenEditJob = (job) => {
    setEditingJob(job);
    const hasSalary = Boolean(
      job.stipend_or_salary &&
      job.stipend_or_salary.trim() &&
      job.stipend_or_salary.toLowerCase() !== 'competitive' &&
      job.stipend_or_salary.toLowerCase() !== 'not disclosed'
    );
    const hasDeadline = Boolean(job.deadline);

    setJobFormData({
      title: job.title || '',
      company_name: job.company_name || '',
      company_logo_url: job.company_logo_url || '',
      company_website: job.company_website || '',
      domain: job.domain || 'Software Engineering',
      job_type: job.job_type || 'Full-time',
      work_mode: job.work_mode || 'Remote',
      location: job.location || '',
      has_salary: hasSalary,
      stipend_or_salary: hasSalary ? job.stipend_or_salary : '',
      experience_level: job.experience_level || 'Entry Level',
      skills_required: Array.isArray(job.skills_required) ? job.skills_required.join(', ') : job.skills_required || '',
      description: job.description || '',
      responsibilities: Array.isArray(job.responsibilities) ? job.responsibilities.join('\n') : job.responsibilities || '',
      requirements: Array.isArray(job.requirements) ? job.requirements.join('\n') : job.requirements || '',
      apply_url: job.apply_url || '',
      is_active: job.is_active ?? true,
      is_featured: job.is_featured ?? false,
      no_deadline: !hasDeadline,
      deadline: hasDeadline ? job.deadline.split('T')[0] : '',
    });
    setJobActionFeedback(null);
    setIsJobModalOpen(true);
  };

  const handleSaveJob = async (e) => {
    e.preventDefault();
    if (!jobFormData.title.trim() || !jobFormData.company_name.trim() || !jobFormData.description.trim()) {
      setJobActionFeedback({ type: 'error', text: 'Job title, company name, and description are required.' });
      return;
    }

    const finalSalary = jobFormData.has_salary ? (jobFormData.stipend_or_salary || '').trim() : '';
    const finalDeadline = (!jobFormData.no_deadline && jobFormData.deadline) ? new Date(jobFormData.deadline).toISOString() : null;

    const { has_salary, no_deadline, ...cleanedData } = jobFormData;
    const payload = {
      ...cleanedData,
      stipend_or_salary: finalSalary,
      deadline: finalDeadline,
      skills_required: jobFormData.skills_required
        ? jobFormData.skills_required.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      responsibilities: jobFormData.responsibilities
        ? jobFormData.responsibilities.split('\n').map((s) => s.trim()).filter(Boolean)
        : [],
      requirements: jobFormData.requirements
        ? jobFormData.requirements.split('\n').map((s) => s.trim()).filter(Boolean)
        : [],
    };

    try {
      setJobFormSubmitting(true);
      if (editingJob) {
        await adminService.updateJob(editingJob.id, payload);
        setJobActionFeedback({ type: 'success', text: 'Job posting updated successfully!' });
      } else {
        await adminService.createJob(payload);
        setJobActionFeedback({ type: 'success', text: 'New job posting created successfully!' });
      }

      fetchJobs();
      fetchStats();
      setTimeout(() => {
        setIsJobModalOpen(false);
        setJobActionFeedback(null);
      }, 1000);
    } catch (err) {
      console.error('Job save failed:', err);
      setJobActionFeedback({
        type: 'error',
        text: err?.response?.data?.detail || 'Failed to save job posting.',
      });
    } finally {
      setJobFormSubmitting(false);
    }
  };

  const handleToggleJobStatus = async (jobId) => {
    try {
      const updated = await adminService.toggleJobStatus(jobId);
      setJobsList((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
      fetchStats();
    } catch (err) {
      console.error('Toggle job status failed:', err);
    }
  };

  const handleDeleteJob = async (jobId, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete '${title}'?`)) return;
    try {
      await adminService.deleteJob(jobId);
      setJobsList((prev) => prev.filter((j) => j.id !== jobId));
      fetchStats();
    } catch (err) {
      console.error('Delete job failed:', err);
    }
  };

  // =========================================================================
  // RESUME TEMPLATES ACTIONS
  // =========================================================================

  const handleOpenCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateFormData(initialTemplateFormData);
    setTemplateActionFeedback(null);
    setIsTemplateModalOpen(true);
  };

  const handleOpenEditTemplate = (tpl) => {
    setEditingTemplate(tpl);
    setTemplateFormData({
      id: tpl.id || '',
      name: tpl.name || '',
      badge: tpl.badge || 'Professional',
      description: tpl.description || '',
      tagline: tpl.tagline || '',
      preview_image_url: tpl.preview_image_url || '',
      download_url: tpl.download_url || '',
      ats_score: tpl.ats_score || '98/100',
      best_for: tpl.best_for || 'Software Engineers, Freshers, All Domains',
      preview_accent: tpl.preview_accent || '#F97316',
      is_active: tpl.is_active ?? true,
    });
    setTemplateActionFeedback(null);
    setIsTemplateModalOpen(true);
  };

  const handlePreFillSample = (sampleNum = 1) => {
    setTemplateFormData({
      id: `template-${sampleNum}`,
      name: `Template ${sampleNum}`,
      badge: 'Professional',
      description: 'Ready-to-use professional resume format',
      tagline: 'Standard single-column layout preferred by tech recruiters and ATS systems.',
      preview_image_url: '',
      download_url: '',
      ats_score: '98/100',
      best_for: 'Software Engineers, Backend Developers, DevOps',
      preview_accent: '#F97316',
      is_active: true,
    });
  };

  const handleTemplateImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Please upload an image smaller than 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setTemplateFormData((prev) => ({
        ...prev,
        preview_image_url: event.target.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    if (!templateFormData.name.trim() || !templateFormData.description.trim()) {
      setTemplateActionFeedback({ type: 'error', text: 'Template Name and Description are required.' });
      return;
    }

    try {
      setTemplateFormSubmitting(true);
      const generatedId = templateFormData.id.trim()
        ? templateFormData.id.trim().toLowerCase().replace(/\s+/g, '-')
        : templateFormData.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

      const payload = {
        ...templateFormData,
        id: generatedId,
        badge: templateFormData.badge.trim() || 'Professional',
      };

      if (editingTemplate) {
        await adminService.updateTemplate(editingTemplate.id, payload);
        setTemplateActionFeedback({ type: 'success', text: 'Template updated successfully!' });
      } else {
        await adminService.createTemplate(payload);
        setTemplateActionFeedback({ type: 'success', text: 'Template registered and published!' });
      }

      fetchTemplates();
      setTimeout(() => {
        setIsTemplateModalOpen(false);
        setTemplateActionFeedback(null);
        setEditingTemplate(null);
      }, 1000);
    } catch (err) {
      console.error('Template save failed:', err);
      setTemplateActionFeedback({
        type: 'error',
        text: err?.response?.data?.detail || 'Failed to save template. Please check the fields.',
      });
    } finally {
      setTemplateFormSubmitting(false);
    }
  };

  const handleToggleTemplateStatus = async (templateId) => {
    try {
      await adminService.toggleTemplateStatus(templateId);
      setTemplatesList((prev) =>
        prev.map((t) => (t.id === templateId ? { ...t, is_active: !t.is_active } : t))
      );
    } catch (err) {
      console.error('Failed to toggle template status:', err);
    }
  };

  const handleDeleteTemplate = async (templateId, name) => {
    if (!window.confirm(`Permanently remove template '${name}' (${templateId})?`)) return;
    try {
      await adminService.deleteTemplate(templateId);
      setTemplatesList((prev) => prev.filter((t) => t.id !== templateId));
    } catch (err) {
      console.error('Delete template failed:', err);
    }
  };

  const handleSeedScreenshotTemplates = async () => {
    try {
      setLoadingTemplates(true);
      await adminService.seedDefaultTemplates();
      await fetchTemplates();
    } catch (err) {
      console.error('Failed to seed templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleClearAllTemplates = async () => {
    if (!window.confirm('Are you sure you want to delete ALL templates? The catalog will be completely empty.')) return;
    try {
      setLoadingTemplates(true);
      await adminService.clearAllTemplates();
      setTemplatesList([]);
    } catch (err) {
      console.error('Failed to clear templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Filtered lists
  const filteredQueue = useMemo(() => {
    if (!projectSearchQuery.trim()) return queue;
    const q = projectSearchQuery.toLowerCase();
    return queue.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        p.domain?.toLowerCase().includes(q) ||
        p.author_name?.toLowerCase().includes(q)
    );
  }, [queue, projectSearchQuery]);

  const filteredStudents = useMemo(() => {
    if (!studentSearchQuery.trim()) return studentsList;
    const q = studentSearchQuery.toLowerCase();
    return studentsList.filter(
      (s) =>
        s.full_name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.university?.toLowerCase().includes(q)
    );
  }, [studentsList, studentSearchQuery]);

  const filteredTemplates = useMemo(() => {
    return templatesList.filter((t) => {
      if (templateStatusFilter === 'ACTIVE' && t.is_active === false) return false;
      if (templateStatusFilter === 'INACTIVE' && t.is_active !== false) return false;
      if (templateSearchQuery.trim()) {
        const q = templateSearchQuery.toLowerCase();
        const matchesName = (t.name || '').toLowerCase().includes(q);
        const matchesBadge = (t.badge || '').toLowerCase().includes(q);
        const matchesDesc = (t.description || '').toLowerCase().includes(q);
        return matchesName || matchesBadge || matchesDesc;
      }
      return true;
    });
  }, [templatesList, templateStatusFilter, templateSearchQuery]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Console Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-brand-primary/10 text-brand-primary">
              Admin Governance Console
            </span>
            <span className="text-xs text-slate-400">Live Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mt-1">
            Admin Control Center
          </h1>
          <p className="text-sm text-slate-500">
            Moderate student projects with email feedback, manage opportunities, inspect students, and configure ATS templates.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            fetchStats();
            if (activeTab === 'projects' || activeTab === 'overview') fetchQueue();
            if (activeTab === 'jobs') fetchJobs();
            if (activeTab === 'students') fetchStudents();
            if (activeTab === 'templates') fetchTemplates();
          }}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-brand-border rounded-xl shadow-xs hover:bg-slate-50 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingQueue || loadingJobs ? 'animate-spin' : ''}`} />
          Refresh Console
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Submissions */}
        <div
          onClick={() => handleTabChange('projects')}
          className={`p-5 rounded-2xl border transition cursor-pointer ${
            activeTab === 'projects'
              ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-200/50 shadow-md'
              : 'bg-white border-brand-border shadow-xs hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              Pending Submissions
            </span>
            <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-bold text-slate-900">
            {loadingStats ? '...' : stats.pending_submissions}
          </div>
          <span className="text-xs text-amber-700 font-medium mt-1 inline-block">
            Moderate & publish with comments
          </span>
        </div>

        {/* Published Projects */}
        <div
          onClick={() => {
            setProjectStatusFilter('Published');
            handleTabChange('projects');
          }}
          className="p-5 bg-white rounded-2xl border border-brand-border shadow-xs hover:border-emerald-200 cursor-pointer transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Published Projects
            </span>
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-bold text-slate-900">
            {loadingStats ? '...' : stats.published_projects}
          </div>
          <span className="text-xs text-slate-500 mt-1 inline-block">Live in student catalog</span>
        </div>

        {/* Total Students */}
        <div
          onClick={() => handleTabChange('students')}
          className={`p-5 rounded-2xl border transition cursor-pointer ${
            activeTab === 'students'
              ? 'bg-blue-50/60 border-blue-300 ring-2 ring-blue-200/50 shadow-md'
              : 'bg-white border-brand-border shadow-xs hover:border-blue-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-primary uppercase tracking-wider">
              Registered Students
            </span>
            <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-bold text-slate-900">
            {loadingStats ? '...' : stats.total_students}
          </div>
          <span className="text-xs text-slate-500 mt-1 inline-block">Learners & builders</span>
        </div>

        {/* Total Jobs */}
        <div
          onClick={() => handleTabChange('jobs')}
          className={`p-5 rounded-2xl border transition cursor-pointer ${
            activeTab === 'jobs'
              ? 'bg-indigo-50/60 border-indigo-300 ring-2 ring-indigo-200/50 shadow-md'
              : 'bg-white border-brand-border shadow-xs hover:border-indigo-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
              Total Opportunities
            </span>
            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-bold text-slate-900">
            {loadingStats ? '...' : stats.total_jobs}
          </div>
          <span className="text-xs text-slate-500 mt-1 inline-block">Jobs & internships</span>
        </div>
      </div>

      {/* Main Tabbed Interface Navigation */}
      <div className="border-b border-brand-border flex items-center gap-3 overflow-x-auto pb-px">
        {[
          { id: 'overview', label: 'Console Overview', icon: Sparkles },
          { id: 'projects', label: `Moderate Projects (${stats.pending_submissions})`, icon: Clock },
          { id: 'jobs', label: `Manage Jobs (${stats.total_jobs})`, icon: Briefcase },
          { id: 'students', label: `Students Directory (${stats.total_students})`, icon: Users },
          { id: 'templates', label: 'Resume Templates', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                active
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW & PROJECTS MODERATION QUEUE */}
      {/* ========================================================================= */}
      {(activeTab === 'overview' || activeTab === 'projects') && (
        <div className="bg-white rounded-2xl border border-brand-border shadow-xs overflow-hidden space-y-0">
          <div className="p-5 border-b border-brand-border flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50/50">
            <div>
              <h2 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Project Submission Review Queue
              </h2>
              <p className="text-xs text-slate-500">
                Audit student code, review demo links, publish projects, or reject with feedback notes sent directly to student email.
              </p>
            </div>

            {/* Status Tabs & Search */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
                {['Submitted', 'Changes Requested', 'Rejected', 'All'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setProjectStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-md transition-all ${
                      projectStatusFilter === s
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {s === 'Submitted' ? 'Pending' : s}
                  </button>
                ))}
              </div>

              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search submissions..."
                  value={projectSearchQuery}
                  onChange={(e) => setProjectSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-brand-border rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          {loadingQueue ? (
            <div className="p-12 text-center space-y-2">
              <RefreshCw className="w-6 h-6 text-brand-primary animate-spin mx-auto" />
              <p className="text-xs text-slate-500">Loading project queue...</p>
            </div>
          ) : filteredQueue.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-sm font-semibold text-slate-800">No project submissions in this view</p>
              <p className="text-xs text-slate-400">All submissions have been reviewed or no projects match filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-brand-border">
                  <tr>
                    <th className="px-5 py-3.5">Project Title</th>
                    <th className="px-5 py-3.5">Author</th>
                    <th className="px-5 py-3.5">Domain</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Submitted</th>
                    <th className="px-5 py-3.5 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredQueue.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900 line-clamp-1">{p.title}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">/{p.slug}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-800">{p.author_name || 'Student'}</div>
                        <div className="text-[11px] text-slate-400">{p.owner_email || 'student@university.edu'}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {p.domain}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          variant={
                            p.status === 'Published'
                              ? 'published'
                              : p.status === 'Submitted'
                              ? 'submitted'
                              : p.status === 'Changes Requested'
                              ? 'changesRequested'
                              : 'rejected'
                          }
                          size="sm"
                        >
                          {p.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-slate-500 text-[11px]">
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenReview(p)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary-hover shadow-2xs transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review & Moderate</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: JOBS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'jobs' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="font-display font-bold text-xl text-slate-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-600" />
                Opportunities & Job Postings
              </h2>
              <p className="text-xs text-slate-500">
                Post new roles with full requirements, edit listings, unpublish/publish, or delete opportunities.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              leftIcon={Plus}
              onClick={handleOpenCreateJob}
              className="shadow-sm"
            >
              Post New Opportunity
            </Button>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-brand-border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-500">Status:</span>
              <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
                {['all', 'active', 'inactive'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setJobStatusFilter(st)}
                    className={`px-3 py-1 rounded-md capitalize transition ${
                      jobStatusFilter === st ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500'
                    }`}
                  >
                    {st === 'active' ? 'Published' : st === 'inactive' ? 'Unpublished' : 'All'}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search jobs by title or company..."
                value={jobSearchQuery}
                onChange={(e) => setJobSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-brand-border rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />
            </div>
          </div>

          {/* Jobs Table */}
          <div className="bg-white rounded-2xl border border-brand-border shadow-xs overflow-hidden">
            {loadingJobs ? (
              <div className="p-12 text-center space-y-2">
                <RefreshCw className="w-6 h-6 text-brand-primary animate-spin mx-auto" />
                <p className="text-xs text-slate-500">Loading jobs catalog...</p>
              </div>
            ) : jobsList.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <Briefcase className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-800">No opportunities found</p>
                <p className="text-xs text-slate-400">Click "Post New Opportunity" above to create a listing.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-brand-border">
                    <tr>
                      <th className="px-5 py-3.5">Role & Company</th>
                      <th className="px-5 py-3.5">Domain</th>
                      <th className="px-5 py-3.5">Type & Mode</th>
                      <th className="px-5 py-3.5">Compensation</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {jobsList.map((job) => (
                      <tr key={job.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900">{job.title}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <Building className="w-3 h-3 text-slate-400" />
                            <span>{job.company_name}</span>
                            <span>•</span>
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{job.location || 'Remote'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                            {job.domain}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          <div>{job.job_type}</div>
                          <div className="text-[11px] text-slate-400">{job.work_mode}</div>
                        </td>
                        <td className="px-5 py-4 text-slate-700 font-medium">
                          {formatSalary(job.stipend_or_salary) ? (
                            <span className="text-emerald-700 font-semibold">{formatSalary(job.stipend_or_salary)}</span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Not Disclosed</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              job.is_active
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {job.is_active ? '● Published' : '○ Unpublished'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Toggle Publish / Unpublish */}
                            <button
                              type="button"
                              onClick={() => handleToggleJobStatus(job.id)}
                              className={`p-1.5 rounded-lg border transition ${
                                job.is_active
                                  ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                  : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                              }`}
                              title={job.is_active ? 'Unpublish Job' : 'Publish Job'}
                            >
                              {job.is_active ? (
                                <ToggleRight className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <ToggleLeft className="w-4 h-4 text-slate-400" />
                              )}
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditJob(job)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-brand-primary hover:border-brand-primary/40 transition"
                              title="Edit Job"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleDeleteJob(job.id, job.title)}
                              className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
                              title="Delete Job"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: STUDENTS DIRECTORY */}
      {/* ========================================================================= */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="font-display font-bold text-xl text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-primary" />
                Registered Students Directory
              </h2>
              <p className="text-xs text-slate-500">
                Inspect registered student accounts, universities, project portfolios, and verification clearance.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by student name, email, university..."
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-brand-border rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary shadow-xs"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-brand-border shadow-xs overflow-hidden">
            {loadingStudents ? (
              <div className="p-12 text-center space-y-2">
                <RefreshCw className="w-6 h-6 text-brand-primary animate-spin mx-auto" />
                <p className="text-xs text-slate-500">Loading students directory...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <Users className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-800">No students matched</p>
                <p className="text-xs text-slate-400">Try adjusting your search query.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-brand-border">
                    <tr>
                      <th className="px-5 py-3.5">Student Profile</th>
                      <th className="px-5 py-3.5">University & Degree</th>
                      <th className="px-5 py-3.5">Projects Submitted</th>
                      <th className="px-5 py-3.5">Top Skills</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Portfolio Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span>{s.full_name}</span>
                            {s.username && (
                              <span className="text-[11px] text-slate-400 font-normal">@{s.username}</span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{s.email}</span>
                          </div>
                          {s.headline && (
                            <div className="text-[11px] text-brand-primary font-medium mt-0.5 line-clamp-1">
                              {s.headline}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          <div className="font-medium flex items-center gap-1.5">
                            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                            <span>{s.university || 'University not specified'}</span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {s.degree || 'B.S. Computer Science'} {s.graduation_year ? `(${s.graduation_year})` : ''}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-brand-primary font-bold text-xs border border-blue-200">
                            {s.projects_count} {s.projects_count === 1 ? 'Project' : 'Projects'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {(s.skills || []).slice(0, 3).map((sk) => (
                              <span
                                key={sk}
                                className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px] font-medium"
                              >
                                {sk}
                              </span>
                            ))}
                            {(s.skills || []).length > 3 && (
                              <span className="text-[10px] text-slate-400">
                                +{(s.skills || []).length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              s.is_verified
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {s.is_verified ? 'Email verified' : 'Email not verified'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {s.username ? (
                            <Link
                              to={`/u/${s.username}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline"
                            >
                              <span>Public Portfolio</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          ) : (
                            <span className="text-slate-400 text-xs italic">No public handle</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: RESUME TEMPLATES MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          {/* Top Bar with Clear Header and Action Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-brand-veryLight text-brand-primary border border-brand-border">
                  Candidate Catalog
                </span>
                <span className="text-xs text-slate-400">Total: {templatesList.length} templates</span>
              </div>
              <h2 className="font-display font-bold text-2xl text-slate-900 flex items-center gap-2 mt-1">
                <FileText className="w-6 h-6 text-brand-primary" />
                Resume Templates Manager
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Add and customize the resume templates available to candidates. Each template card features a 
                <strong> Title</strong>, <strong>Category Badge</strong> (e.g. Professional), <strong>Description</strong>, 
                <strong>Preview Mockup</strong>, and download actions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                to="/templates"
                target="_blank"
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors inline-flex items-center gap-1.5"
                title="Open Candidate Resume Templates Page"
              >
                <span>View Candidate Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              <button
                type="button"
                onClick={handleSeedScreenshotTemplates}
                disabled={loadingTemplates}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-brand-primary bg-brand-veryLight hover:bg-blue-100 border border-brand-border transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
                title="Populate the 3 templates from the screenshot (Template 1, 2, 3)"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Seed (Template 1, 2, 3)</span>
              </button>

              {templatesList.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllTemplates}
                  disabled={loadingTemplates}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors inline-flex items-center gap-1"
                  title="Clear all templates to start completely fresh"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              )}

              <Button
                variant="primary"
                size="sm"
                leftIcon={Plus}
                onClick={handleOpenCreateTemplate}
                className="font-bold shadow-sm"
              >
                Add New Template
              </Button>
            </div>
          </div>

          {/* Quick Guide Card */}
          <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/50 p-5 rounded-2xl border border-brand-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-primary flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand-primary" />
                How to Add a Template with Clear Description
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                When adding a template, provide a recognizable <strong>Template Title</strong> (e.g. <em>Template 1</em>), 
                a <strong>Category Badge</strong> (e.g. <em>Professional</em>), and a <strong>Short Description</strong> 
                (e.g. <em>Ready-to-use professional resume format</em>). You can upload a preview image or let the platform auto-generate a document preview.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenCreateTemplate}
              className="shrink-0 px-4 py-2 bg-white text-brand-primary font-bold text-xs rounded-xl border border-brand-border shadow-xs hover:bg-brand-veryLight transition"
            >
              + Create Template
            </button>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={templateSearchQuery}
                onChange={(e) => setTemplateSearchQuery(e.target.value)}
                placeholder="Search templates by title, badge, or description..."
                className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Filter:</span>
              {['ALL', 'ACTIVE', 'INACTIVE'].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setTemplateStatusFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    templateStatusFilter === f
                      ? 'bg-brand-primary text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {f === 'ALL' ? 'All' : f === 'ACTIVE' ? 'Published' : 'Hidden'}
                </button>
              ))}
            </div>
          </div>

          {/* Loading Indicator */}
          {loadingTemplates && (
            <div className="py-16 text-center space-y-2">
              <div className="w-8 h-8 border-3 border-brand-border border-t-brand-primary rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Refreshing catalog...</p>
            </div>
          )}

          {/* Empty Catalog State */}
          {!loadingTemplates && filteredTemplates.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-4 max-w-xl mx-auto">
              <div className="w-14 h-14 bg-brand-veryLight text-brand-primary rounded-2xl flex items-center justify-center mx-auto">
                <FileText className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">No Templates Found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {templateSearchQuery.trim()
                    ? `No templates matching "${templateSearchQuery}". Try clearing search.`
                    : 'The resume templates catalog is currently empty. Add your own template or load default sample templates.'}
                </p>
              </div>

              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={handleSeedScreenshotTemplates}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-veryLight text-brand-primary hover:bg-blue-100 border border-brand-border transition"
                >
                  Load Sample Templates (1, 2, 3)
                </button>
                <button
                  type="button"
                  onClick={handleOpenCreateTemplate}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-primary text-white hover:bg-brand-primaryHover shadow-sm transition"
                >
                  + Add New Template
                </button>
              </div>
            </div>
          )}

          {/* Cards Grid */}
          {!loadingTemplates && filteredTemplates.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((tpl, index) => (
                <div
                  key={tpl.id || index}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-lg transition-all overflow-hidden flex flex-col justify-between"
                >
                  {/* Top Bar with Status and Action Buttons */}
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        tpl.is_active !== false
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-300'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${tpl.is_active !== false ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {tpl.is_active !== false ? 'Published' : 'Hidden Draft'}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleToggleTemplateStatus(tpl.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
                        title={tpl.is_active !== false ? 'Hide from candidates' : 'Publish to candidates'}
                      >
                        {tpl.is_active !== false ? <Eye className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-slate-300" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditTemplate(tpl)}
                        className="p-1 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition"
                        title="Edit template details"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(tpl.id, tpl.name)}
                        className="p-1 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition"
                        title="Delete template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Document Preview Mockup Box matching candidate view */}
                  <div className="h-64 bg-[#1e232a] relative overflow-hidden flex items-center justify-center p-3 border-b border-slate-200">
                    {tpl.preview_image_url ? (
                      <img
                        src={tpl.preview_image_url}
                        alt={tpl.name}
                        className="w-full h-full object-contain rounded shadow"
                      />
                    ) : (
                      <div className="w-full h-full bg-white rounded shadow-md p-3 text-[7px] text-slate-700 overflow-y-auto space-y-1.5 pointer-events-none select-none">
                        <div className="text-center pb-1 border-b border-slate-200">
                          <div className="font-extrabold text-[9px] text-slate-900 tracking-wider">
                            {tpl.name ? tpl.name.toUpperCase() : 'RESUME TEMPLATE'}
                          </div>
                          <div className="text-[6px] text-slate-500">
                            Mobile: +91 9391033355 | Email: student@example.com
                          </div>
                        </div>

                        <div>
                          <div className="font-bold text-[7px] uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5">
                            PROFILE SUMMARY
                          </div>
                          <div className="text-[6px] text-slate-500 mt-0.5 leading-tight">
                            {tpl.description || 'Ready-to-use professional resume format'}
                          </div>
                        </div>

                        <div>
                          <div className="font-bold text-[7px] uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5">
                            EDUCATION
                          </div>
                          <div className="flex justify-between items-center text-[6.5px] text-slate-800 font-semibold mt-0.5">
                            <span>University of Technology</span>
                            <span>CGPA: 8.5/10</span>
                          </div>
                        </div>

                        <div>
                          <div className="font-bold text-[7px] uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5">
                            TECHNICAL SKILLS
                          </div>
                          <div className="text-[6px] text-slate-600 mt-0.5">
                            Python, JavaScript, React, Node.js, SQL, Git
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Content Information */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-bold text-base text-slate-900">{tpl.name}</h3>
                      <div className="mt-1.5">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-veryLight text-brand-primary border border-brand-border">
                          {tpl.badge || 'Professional'}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500 leading-relaxed line-clamp-2">
                        {tpl.description || 'Ready-to-use professional resume format'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>ID: <code className="font-mono text-slate-600">{tpl.id}</code></span>
                      <button
                        type="button"
                        onClick={() => handleOpenEditTemplate(tpl)}
                        className="text-xs font-bold text-[#F97316] hover:underline"
                      >
                        Edit Details →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: PROJECT REVIEW & MODERATION (With Student Email Dispatch) */}
      {/* ========================================================================= */}
      {selectedProject && (
        <Modal
          isOpen={Boolean(selectedProject)}
          onClose={() => setSelectedProject(null)}
          title={`Review Submission: ${selectedProject.title}`}
          size="xl"
        >
          <div className="space-y-6 text-xs max-h-[75vh] overflow-y-auto pr-1">
            {moderationFeedback && (
              <Alert
                variant={moderationFeedback.type}
                title="Moderation Feedback Dispatched"
                className="mb-4"
              >
                {moderationFeedback.text}
              </Alert>
            )}

            {/* Email dispatch alert note */}
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-brand-primary shrink-0" />
              <span>
                <strong>Automated Notification:</strong> When you approve, reject, or request changes, your reviewer feedback comments will be automatically emailed to <strong>{selectedProject.owner_email || 'the student'}</strong>.
              </span>
            </div>

            {/* Metadata Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Author</span>
                <p className="font-semibold text-slate-800">{selectedProject.author_name || 'Student'}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Domain</span>
                <p className="font-semibold text-slate-800">{selectedProject.domain}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Difficulty</span>
                <p className="font-semibold text-slate-800">{selectedProject.difficulty}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Estimated Time</span>
                <p className="font-semibold text-slate-800">{selectedProject.estimated_duration || '2-3 weeks'}</p>
              </div>
            </div>

            {/* Problem Statement & Description */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-sm">Short Description</h4>
              <p className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                {selectedProject.short_description}
              </p>
            </div>

            {selectedProject.problem_statement && (
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">Problem Statement & Objectives</h4>
                <p className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                  {selectedProject.problem_statement}
                </p>
              </div>
            )}

            {/* Tech Stack */}
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-2">Technologies Used</h4>
              <div className="flex flex-wrap gap-1.5">
                {(selectedProject.tech_stack || []).map((t) => (
                  <span key={t} className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium text-xs">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Links and Code Verification */}
            <div className="flex flex-wrap gap-3 pt-2">
              {selectedProject.live_demo_url && (
                <a
                  href={selectedProject.live_demo_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 font-semibold"
                >
                  <Globe className="w-3.5 h-3.5 text-brand-primary" />
                  <span>Open Live Demo</span>
                </a>
              )}
              {selectedProject.github_url && (
                <a
                  href={selectedProject.github_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 font-semibold"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>Inspect GitHub Repository</span>
                </a>
              )}
              {selectedProject.zip_download_url && (
                <a
                  href={selectedProject.zip_download_url}
                  download
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-brand-primary border border-blue-200 font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Submitted Source ZIP</span>
                </a>
              )}
            </div>

            {/* Reviewer Comments & Feedback (REQUIRED FOR REJECTION) */}
            <div className="space-y-2 pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-slate-900 text-sm">
                  Reviewer Feedback / Rejection Comments
                </label>
                <span className="text-[11px] text-amber-600 font-medium">
                  *Required if rejecting or requesting changes
                </span>
              </div>
              <textarea
                rows={4}
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
                placeholder="Write specific feedback for the student (e.g., 'Please include unit tests and fix broken demo link before resubmitting')..."
                className="w-full text-xs p-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-primary leading-relaxed"
              />
            </div>

            {/* Actions Bar */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
              >
                Close Without Action
              </button>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  disabled={moderating}
                  onClick={() => handleModerate('reject')}
                  className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold border border-rose-200 disabled:opacity-50 transition"
                >
                  Reject & Email Feedback
                </button>

                <button
                  type="button"
                  disabled={moderating}
                  onClick={() => handleModerate('request_changes')}
                  className="px-4 py-2 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 font-bold border border-amber-200 disabled:opacity-50 transition"
                >
                  Request Changes
                </button>

                <button
                  type="button"
                  disabled={moderating}
                  onClick={() => handleModerate('approve')}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-bold shadow-sm disabled:opacity-50 transition"
                >
                  Publish & Approve
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CREATE / EDIT JOB OPPORTUNITY */}
      {/* ========================================================================= */}
      {isJobModalOpen && (
        <Modal
          isOpen={isJobModalOpen}
          onClose={() => setIsJobModalOpen(false)}
          title={editingJob ? `Edit Job: ${editingJob.title}` : 'Post New Job Opportunity'}
          size="lg"
        >
          <form onSubmit={handleSaveJob} className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
            {jobActionFeedback && (
              <Alert variant={jobActionFeedback.type} className="mb-3">
                {jobActionFeedback.text}
              </Alert>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Job Title *</label>
                <input
                  type="text"
                  required
                  value={jobFormData.title}
                  onChange={(e) => setJobFormData({ ...jobFormData, title: e.target.value })}
                  placeholder="e.g. Junior Backend Engineer (Python)"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={jobFormData.company_name}
                  onChange={(e) => setJobFormData({ ...jobFormData, company_name: e.target.value })}
                  placeholder="e.g. Stripe, Airbnb, NexusScale"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Domain</label>
                <input
                  type="text"
                  value={jobFormData.domain}
                  onChange={(e) => setJobFormData({ ...jobFormData, domain: e.target.value })}
                  placeholder="e.g. Web Development, AI/ML"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Job Type</label>
                <select
                  value={jobFormData.job_type}
                  onChange={(e) => setJobFormData({ ...jobFormData, job_type: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Internship">Internship</option>
                  <option value="Contract">Contract</option>
                  <option value="Part-time">Part-time</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Work Mode</label>
                <select
                  value={jobFormData.work_mode}
                  onChange={(e) => setJobFormData({ ...jobFormData, work_mode: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Onsite">Onsite</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Location</label>
                <input
                  type="text"
                  value={jobFormData.location}
                  onChange={(e) => setJobFormData({ ...jobFormData, location: e.target.value })}
                  placeholder="e.g. Bengaluru, India or Remote"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">Stipend or Salary</label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-brand-primary select-none">
                    <input
                      type="checkbox"
                      checked={jobFormData.has_salary}
                      onChange={(e) =>
                        setJobFormData({
                          ...jobFormData,
                          has_salary: e.target.checked,
                          stipend_or_salary: e.target.checked ? jobFormData.stipend_or_salary : '',
                        })
                      }
                      className="w-3.5 h-3.5 text-brand-primary rounded focus:ring-0"
                    />
                    <span>Disclose Salary</span>
                  </label>
                </div>
                {jobFormData.has_salary ? (
                  <div>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-500 font-bold text-xs select-none">
                        ₹
                      </span>
                      <input
                        type="text"
                        value={jobFormData.stipend_or_salary}
                        onChange={(e) => setJobFormData({ ...jobFormData, stipend_or_salary: e.target.value })}
                        placeholder="e.g. ₹50,000/mo or ₹8 - 12 LPA"
                        className="w-full text-xs pl-7 pr-2.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Amount in Indian Rupees (INR). Uncheck "Disclose Salary" to hide.
                    </p>
                  </div>
                ) : (
                  <div className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 flex items-center justify-between">
                    <span className="italic">Not Disclosed (Hidden from card)</span>
                    <button
                      type="button"
                      onClick={() => setJobFormData({ ...jobFormData, has_salary: true })}
                      className="text-brand-primary font-semibold text-[11px] hover:underline"
                    >
                      + Add Salary
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Skills Required (Comma separated)</label>
              <input
                type="text"
                value={jobFormData.skills_required}
                onChange={(e) => setJobFormData({ ...jobFormData, skills_required: e.target.value })}
                placeholder="Python, FastAPI, Docker, PostgreSQL, Redis"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Job Description *</label>
              <textarea
                rows={4}
                required
                value={jobFormData.description}
                onChange={(e) => setJobFormData({ ...jobFormData, description: e.target.value })}
                placeholder="Overview of the company, mission, and team context..."
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Responsibilities (One per line)</label>
                <textarea
                  rows={4}
                  value={jobFormData.responsibilities}
                  onChange={(e) => setJobFormData({ ...jobFormData, responsibilities: e.target.value })}
                  placeholder="Build high-throughput REST APIs&#10;Implement database query optimizations&#10;Collaborate with product designers"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Requirements (One per line)</label>
                <textarea
                  rows={4}
                  value={jobFormData.requirements}
                  onChange={(e) => setJobFormData({ ...jobFormData, requirements: e.target.value })}
                  placeholder="Hands-on experience with Python or Node.js&#10;Familiarity with Docker and Git&#10;Pursuing or completed B.S. in Computer Science"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Apply URL</label>
                <input
                  type="url"
                  value={jobFormData.apply_url}
                  onChange={(e) => setJobFormData({ ...jobFormData, apply_url: e.target.value })}
                  placeholder="https://company.com/apply"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">Application Deadline</label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-slate-600 select-none">
                    <input
                      type="checkbox"
                      checked={jobFormData.no_deadline}
                      onChange={(e) =>
                        setJobFormData({
                          ...jobFormData,
                          no_deadline: e.target.checked,
                          deadline: e.target.checked ? '' : jobFormData.deadline,
                        })
                      }
                      className="w-3.5 h-3.5 text-brand-primary rounded focus:ring-0"
                    />
                    <span>No Expiry (Rolling)</span>
                  </label>
                </div>
                {jobFormData.no_deadline ? (
                  <div className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 flex items-center justify-between">
                    <span className="italic">Rolling basis (No expiry date)</span>
                    <button
                      type="button"
                      onClick={() => setJobFormData({ ...jobFormData, no_deadline: false })}
                      className="text-brand-primary font-semibold text-[11px] hover:underline"
                    >
                      Set Date
                    </button>
                  </div>
                ) : (
                  <input
                    type="date"
                    value={jobFormData.deadline}
                    onChange={(e) => setJobFormData({ ...jobFormData, deadline: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                )}
              </div>
            </div>

            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={jobFormData.is_active}
                  onChange={(e) => setJobFormData({ ...jobFormData, is_active: e.target.checked })}
                  className="w-4 h-4 text-brand-primary rounded"
                />
                <span>Active & Published</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={jobFormData.is_featured}
                  onChange={(e) => setJobFormData({ ...jobFormData, is_featured: e.target.checked })}
                  className="w-4 h-4 text-brand-primary rounded"
                />
                <span>Featured Opportunity</span>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsJobModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={jobFormSubmitting}
                className="px-5 py-2 rounded-xl bg-brand-primary text-white font-bold hover:bg-brand-primary-hover shadow-sm disabled:opacity-50"
              >
                {jobFormSubmitting ? 'Saving Job...' : editingJob ? 'Update Opportunity' : 'Publish Opportunity'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADD / EDIT RESUME TEMPLATE (With Clear Field Descriptions & Live Card Preview) */}
      {/* ========================================================================= */}
      {isTemplateModalOpen && (
        <Modal
          isOpen={isTemplateModalOpen}
          onClose={() => {
            setIsTemplateModalOpen(false);
            setEditingTemplate(null);
          }}
          title={editingTemplate ? `Edit Template: ${editingTemplate.name}` : 'Add New Resume Template'}
          size="xl"
        >
          <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
            {templateActionFeedback && (
              <Alert variant={templateActionFeedback.type} className="mb-2">
                {templateActionFeedback.text}
              </Alert>
            )}

            {/* Quick pre-fill toolbar */}
            {!editingTemplate && (
              <div className="p-3 rounded-xl bg-brand-veryLight border border-brand-border flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-brand-text flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-primary" />
                  Need a quick start? Click an example to pre-fill:
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handlePreFillSample(1)}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white border border-brand-border text-brand-primary hover:bg-blue-50 transition"
                  >
                    Template 1
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePreFillSample(2)}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white border border-brand-border text-brand-primary hover:bg-blue-50 transition"
                  >
                    Template 2
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePreFillSample(3)}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white border border-brand-border text-brand-primary hover:bg-blue-50 transition"
                  >
                    Template 3
                  </button>
                </div>
              </div>
            )}

            {/* Two-Column Form & Live Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Form Fields with Clear Descriptions */}
              <form onSubmit={handleSaveTemplate} className="lg:col-span-7 space-y-4 text-xs">
                {/* 1. Template Title */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-800">
                      1. Template Title <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Card headline</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={templateFormData.name}
                    onChange={(e) => setTemplateFormData({ ...templateFormData, name: e.target.value })}
                    placeholder="e.g. Template 1, Modern Tech Resume, Executive Minimal"
                    className="mt-1 w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    The prominent bold title displayed directly below the preview mockup.
                  </span>
                </div>

                {/* 2. Category Badge Tag */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-800">
                      2. Category Badge (Card Tag) <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Pill tag under title</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={templateFormData.badge}
                    onChange={(e) => setTemplateFormData({ ...templateFormData, badge: e.target.value })}
                    placeholder="e.g. Professional"
                    className="mt-1 w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                  />

                  {/* Preset Badge Chips */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 font-medium">Suggestions:</span>
                    {['Professional', 'Entry-Level', 'Tech / IT', 'Executive', 'Academic', 'Creative'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setTemplateFormData({ ...templateFormData, badge: tag })}
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 hover:bg-brand-veryLight hover:text-brand-primary text-slate-600 transition"
                      >
                        +{tag}
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Displays as the styled badge (e.g. <em>Professional</em>) on the template card.
                  </span>
                </div>

                {/* 3. Short Description */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-800">
                      3. Short Description <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Card description</span>
                  </div>
                  <textarea
                    rows={2}
                    required
                    value={templateFormData.description}
                    onChange={(e) => setTemplateFormData({ ...templateFormData, description: e.target.value })}
                    placeholder="e.g. Ready-to-use professional resume format"
                    className="mt-1 w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Explains what the template is suited for (e.g. <em>Ready-to-use professional resume format</em>).
                  </span>
                </div>

                {/* 4. Document Mockup Preview Image */}
                <div>
                  <label className="block font-bold text-slate-800">
                    4. Template Preview Mockup (Image or Auto Document)
                  </label>
                  <span className="text-[11px] text-slate-500 mb-1.5 block">
                    Upload a screenshot image of the template or enter an image URL. If left empty, an automated clean document layout will be displayed.
                  </span>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition inline-flex items-center gap-1.5 border border-slate-200">
                        <Palette className="w-3.5 h-3.5 text-brand-primary" />
                        <span>Upload Screenshot Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleTemplateImageUpload}
                          className="hidden"
                        />
                      </label>
                      <span className="text-slate-400 text-xs">or paste image URL:</span>
                    </div>

                    <input
                      type="url"
                      value={templateFormData.preview_image_url}
                      onChange={(e) => setTemplateFormData({ ...templateFormData, preview_image_url: e.target.value })}
                      placeholder="https://example.com/resume-preview.png"
                      className="w-full text-xs p-2 border border-slate-200 rounded-xl"
                    />

                    {templateFormData.preview_image_url && (
                      <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                        <img
                          src={templateFormData.preview_image_url}
                          alt="Preview"
                          className="w-10 h-10 object-cover rounded border"
                        />
                        <span className="text-[10px] text-slate-500 truncate flex-1">
                          Image attached for preview mockup
                        </span>
                        <button
                          type="button"
                          onClick={() => setTemplateFormData({ ...templateFormData, preview_image_url: '' })}
                          className="text-rose-600 hover:text-rose-800 text-[10px] font-bold"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. Direct Download URL */}
                <div>
                  <label className="block font-bold text-slate-800">
                    5. Download File URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={templateFormData.download_url}
                    onChange={(e) => setTemplateFormData({ ...templateFormData, download_url: e.target.value })}
                    placeholder="https://example.com/template.pdf (optional)"
                    className="mt-1 w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Leave blank to automatically use the platform's ATS PDF generator when candidates click Download.
                  </span>
                </div>

                {/* 6. Template Machine Key */}
                <div>
                  <label className="block font-bold text-slate-800">
                    6. Machine Key / Slug ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={templateFormData.id}
                    onChange={(e) => setTemplateFormData({ ...templateFormData, id: e.target.value })}
                    placeholder="e.g. template-1 (auto-generated if empty)"
                    className="mt-1 w-full text-xs p-2 border border-slate-200 rounded-xl font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Unique identifier used for routing and compiler mapping.
                  </span>
                </div>

                {/* 7. Active Status Toggle */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">Published to Candidates</span>
                    <span className="text-[10px] text-slate-500">
                      When active, this template is immediately visible on the /templates page.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={templateFormData.is_active}
                      onChange={(e) => setTemplateFormData({ ...templateFormData, is_active: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary" />
                  </label>
                </div>

                {/* Form Buttons */}
                <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTemplateModalOpen(false);
                      setEditingTemplate(null);
                    }}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={templateFormSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-brand-primary text-white font-bold hover:bg-brand-primaryHover shadow-sm disabled:opacity-50 transition"
                  >
                    {templateFormSubmitting
                      ? 'Saving...'
                      : editingTemplate
                      ? 'Update Template'
                      : 'Publish Template'}
                  </button>
                </div>
              </form>

              {/* Right Column: Live Candidate Card Preview */}
              <div className="lg:col-span-5 bg-slate-50 p-4 rounded-2xl border border-slate-200 lg:sticky lg:top-0 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-brand-primary" />
                    Live Candidate Card Preview
                  </span>
                  <span className="text-[10px] text-slate-400">Updates as you type</span>
                </div>

                {/* Candidate Card Exact Rendering */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden flex flex-col justify-between">
                  {/* Top Document Mockup */}
                  <div className="h-60 bg-[#1e232a] relative overflow-hidden flex items-center justify-center p-3 border-b border-slate-200">
                    {templateFormData.preview_image_url ? (
                      <img
                        src={templateFormData.preview_image_url}
                        alt="Preview"
                        className="w-full h-full object-contain rounded shadow"
                      />
                    ) : (
                      <div className="w-full h-full bg-white rounded shadow-md p-3 text-[7px] text-slate-700 overflow-y-auto space-y-1.5 select-none pointer-events-none">
                        <div className="text-center pb-1 border-b border-slate-200">
                          <div className="font-extrabold text-[9px] text-slate-900 tracking-wider">
                            {templateFormData.name ? templateFormData.name.toUpperCase() : 'RESUME TEMPLATE'}
                          </div>
                          <div className="text-[6px] text-slate-500">
                            Mobile: +91 9391033355 | Email: student@example.com
                          </div>
                        </div>

                        <div>
                          <div className="font-bold text-[7px] uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5">
                            PROFILE SUMMARY
                          </div>
                          <div className="text-[6px] text-slate-500 mt-0.5 leading-tight">
                            {templateFormData.description || 'Ready-to-use professional resume format'}
                          </div>
                        </div>

                        <div>
                          <div className="font-bold text-[7px] uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5">
                            EDUCATION
                          </div>
                          <div className="flex justify-between items-center text-[6.5px] text-slate-800 font-semibold mt-0.5">
                            <span>University of Technology</span>
                            <span>CGPA: 8.5/10</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h4 className="font-bold text-lg text-slate-900 tracking-tight">
                        {templateFormData.name || 'Template Name'}
                      </h4>

                      <div className="mt-1.5">
                        <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-brand-veryLight text-brand-primary border border-brand-border">
                          {templateFormData.badge || 'Professional'}
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-slate-500 leading-relaxed line-clamp-2">
                        {templateFormData.description || 'Ready-to-use professional resume format'}
                      </p>
                    </div>

                    {/* Action Buttons Mock */}
                    <div className="flex items-center gap-2.5 pt-2">
                      <div className="flex-1 py-2 px-3 rounded-xl bg-brand-primary text-white font-semibold text-xs flex items-center justify-center gap-1 shadow-xs">
                        <Eye className="w-3.5 h-3.5" />
                        <span>ViewFull</span>
                      </div>
                      <div className="flex-1 py-2 px-3 rounded-xl border border-brand-primary text-brand-primary font-semibold text-xs flex items-center justify-center gap-1">
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 text-center">
                  This preview mirrors the candidate view on <code>/templates</code>.
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
