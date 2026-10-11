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
    location: 'Remote, US',
    stipend_or_salary: '$45/hr or $110,000/yr',
    experience_level: 'Entry Level',
    skills_required: '',
    description: '',
    responsibilities: '',
    requirements: '',
    apply_url: 'https://careers.company.com',
    is_active: true,
    is_featured: false,
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
  const [templateFormSubmitting, setTemplateFormSubmitting] = useState(false);
  const [templateActionFeedback, setTemplateActionFeedback] = useState(null);

  const initialTemplateFormData = {
    id: '',
    name: '',
    tagline: '',
    description: '',
    badge: 'Popular',
    ats_score: '96/100',
    best_for: 'Full Stack, Cloud & AI Developers',
    preview_accent: '#3B82F6',
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
    setJobFormData({
      title: job.title || '',
      company_name: job.company_name || '',
      company_logo_url: job.company_logo_url || '',
      company_website: job.company_website || '',
      domain: job.domain || 'Software Engineering',
      job_type: job.job_type || 'Full-time',
      work_mode: job.work_mode || 'Remote',
      location: job.location || '',
      stipend_or_salary: job.stipend_or_salary || '',
      experience_level: job.experience_level || 'Entry Level',
      skills_required: Array.isArray(job.skills_required) ? job.skills_required.join(', ') : job.skills_required || '',
      description: job.description || '',
      responsibilities: Array.isArray(job.responsibilities) ? job.responsibilities.join('\n') : job.responsibilities || '',
      requirements: Array.isArray(job.requirements) ? job.requirements.join('\n') : job.requirements || '',
      apply_url: job.apply_url || '',
      is_active: job.is_active ?? true,
      is_featured: job.is_featured ?? false,
      deadline: job.deadline ? job.deadline.split('T')[0] : '',
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

    const payload = {
      ...jobFormData,
      skills_required: jobFormData.skills_required
        ? jobFormData.skills_required.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      responsibilities: jobFormData.responsibilities
        ? jobFormData.responsibilities.split('\n').map((s) => s.trim()).filter(Boolean)
        : [],
      requirements: jobFormData.requirements
        ? jobFormData.requirements.split('\n').map((s) => s.trim()).filter(Boolean)
        : [],
      deadline: jobFormData.deadline ? new Date(jobFormData.deadline).toISOString() : null,
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
    setTemplateFormData(initialTemplateFormData);
    setTemplateActionFeedback(null);
    setIsTemplateModalOpen(true);
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    if (!templateFormData.id.trim() || !templateFormData.name.trim() || !templateFormData.description.trim()) {
      setTemplateActionFeedback({ type: 'error', text: 'Template ID, Name, and Description are required.' });
      return;
    }

    try {
      setTemplateFormSubmitting(true);
      await adminService.createTemplate({
        ...templateFormData,
        id: templateFormData.id.trim().toLowerCase().replace(/\s+/g, '-'),
      });
      setTemplateActionFeedback({ type: 'success', text: 'Template registered into the catalog!' });
      fetchTemplates();
      setTimeout(() => {
        setIsTemplateModalOpen(false);
        setTemplateActionFeedback(null);
      }, 1000);
    } catch (err) {
      console.error('Template save failed:', err);
      setTemplateActionFeedback({
        type: 'error',
        text: err?.response?.data?.detail || 'Failed to register template.',
      });
    } finally {
      setTemplateFormSubmitting(false);
    }
  };

  const handleDeleteTemplate = async (templateId, name) => {
    if (!window.confirm(`Remove template '${name}' (${templateId})?`)) return;
    try {
      await adminService.deleteTemplate(templateId);
      setTemplatesList((prev) => prev.filter((t) => t.id !== templateId));
    } catch (err) {
      console.error('Delete template failed:', err);
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
                          {job.stipend_or_salary || 'Competitive'}
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
                            {s.is_verified ? 'Verified' : 'Pending OTP'}
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="font-display font-bold text-xl text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-primary" />
                ATS Resume Templates Catalog
              </h2>
              <p className="text-xs text-slate-500">
                Manage and add new single-column ATS resume layouts available to students in the Resume Builder.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              leftIcon={Plus}
              onClick={handleOpenCreateTemplate}
              className="shadow-sm"
            >
              Add New Resume Template
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templatesList.map((tpl) => (
              <div
                key={tpl.id}
                className="bg-white rounded-2xl border border-brand-border p-6 shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden"
              >
                <div
                  className="absolute top-0 inset-x-0 h-1.5"
                  style={{ backgroundColor: tpl.preview_accent || '#3B82F6' }}
                />

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {tpl.badge || 'Template'}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ATS {tpl.ats_score || '95/100'}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-lg text-slate-900">{tpl.name}</h3>
                  <div className="text-[11px] font-mono text-slate-400">ID: {tpl.id}</div>
                  <p className="text-xs text-brand-primary font-medium">{tpl.tagline}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{tpl.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">Best for: {tpl.best_for}</span>
                  {tpl.is_custom && (
                    <button
                      type="button"
                      onClick={() => handleDeleteTemplate(tpl.id, tpl.name)}
                      className="text-rose-600 hover:text-rose-800 text-xs font-semibold p-1 hover:bg-rose-50 rounded"
                      title="Remove Template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
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
                  placeholder="e.g. Remote (US / Global)"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Stipend or Salary</label>
                <input
                  type="text"
                  value={jobFormData.stipend_or_salary}
                  onChange={(e) => setJobFormData({ ...jobFormData, stipend_or_salary: e.target.value })}
                  placeholder="e.g. $45/hr or $110,000/yr"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                />
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
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Application Deadline</label>
                <input
                  type="date"
                  value={jobFormData.deadline}
                  onChange={(e) => setJobFormData({ ...jobFormData, deadline: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                />
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
      {/* MODAL 3: ADD RESUME TEMPLATE */}
      {/* ========================================================================= */}
      {isTemplateModalOpen && (
        <Modal
          isOpen={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          title="Register New ATS Resume Template"
          size="md"
        >
          <form onSubmit={handleSaveTemplate} className="space-y-4 text-xs">
            {templateActionFeedback && (
              <Alert variant={templateActionFeedback.type} className="mb-3">
                {templateActionFeedback.text}
              </Alert>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Template Identifier ID *</label>
              <input
                type="text"
                required
                value={templateFormData.id}
                onChange={(e) => setTemplateFormData({ ...templateFormData, id: e.target.value })}
                placeholder="e.g. silicon-valley, clean-academic"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Unique machine identifier (hyphen-separated)</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Display Name *</label>
              <input
                type="text"
                required
                value={templateFormData.name}
                onChange={(e) => setTemplateFormData({ ...templateFormData, name: e.target.value })}
                placeholder="e.g. Silicon Valley Executive"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Badge Tag</label>
                <input
                  type="text"
                  value={templateFormData.badge}
                  onChange={(e) => setTemplateFormData({ ...templateFormData, badge: e.target.value })}
                  placeholder="e.g. Executive, New"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ATS Score Benchmark</label>
                <input
                  type="text"
                  value={templateFormData.ats_score}
                  onChange={(e) => setTemplateFormData({ ...templateFormData, ats_score: e.target.value })}
                  placeholder="e.g. 98/100"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tagline</label>
              <input
                type="text"
                value={templateFormData.tagline}
                onChange={(e) => setTemplateFormData({ ...templateFormData, tagline: e.target.value })}
                placeholder="Ultra-clean single column layout optimized for FAANG applicant systems."
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Detailed Description *</label>
              <textarea
                rows={3}
                required
                value={templateFormData.description}
                onChange={(e) => setTemplateFormData({ ...templateFormData, description: e.target.value })}
                placeholder="High-density section layout with structured technical skills categorization..."
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Best For Roles</label>
                <input
                  type="text"
                  value={templateFormData.best_for}
                  onChange={(e) => setTemplateFormData({ ...templateFormData, best_for: e.target.value })}
                  placeholder="e.g. Backend Engineers, DevOps"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Accent Color Hex</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={templateFormData.preview_accent}
                    onChange={(e) => setTemplateFormData({ ...templateFormData, preview_accent: e.target.value })}
                    className="w-8 h-8 rounded border p-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={templateFormData.preview_accent}
                    onChange={(e) => setTemplateFormData({ ...templateFormData, preview_accent: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={templateFormSubmitting}
                className="px-5 py-2 rounded-xl bg-brand-primary text-white font-bold hover:bg-brand-primary-hover shadow-sm disabled:opacity-50"
              >
                {templateFormSubmitting ? 'Registering...' : 'Add Template'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
