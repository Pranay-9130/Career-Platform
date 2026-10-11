import React, { useState, useEffect, useCallback } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  MapPin,
  ExternalLink,
  Trash2,
  Edit2,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Bookmark,
  RefreshCw,
  X,
} from 'lucide-react';
import applicationService from '../../services/applicationService';
import { Link } from 'react-router-dom';

const STATUS_CONFIG = {
  Saved: {
    label: 'Saved',
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  Applied: {
    label: 'Applied',
    bg: 'bg-sky-50 text-sky-700 border-sky-200',
    dot: 'bg-sky-500',
  },
  Interviewing: {
    label: 'Interviewing',
    bg: 'bg-purple-50 text-purple-700 border-purple-200',
    dot: 'bg-purple-500',
  },
  Offer: {
    label: 'Offer',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  Rejected: {
    label: 'Rejected',
    bg: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-400',
  },
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    saved: 0,
    applied: 0,
    interviewing: 0,
    offer: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [formData, setFormData] = useState({
    company_name: '',
    position_title: '',
    job_location: 'Remote',
    work_mode: 'Remote',
    salary_or_stipend: '',
    job_url: '',
    status: 'Applied',
    next_interview_date: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const data = await applicationService.getApplicationStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load application stats:', err);
    }
  }, []);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await applicationService.getApplications({
        status_filter: statusFilter,
        search,
      });
      setApplications(data);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleOpenAddModal = () => {
    setEditingApp(null);
    setFormData({
      company_name: '',
      position_title: '',
      job_location: 'Remote',
      work_mode: 'Remote',
      salary_or_stipend: '',
      job_url: '',
      status: 'Applied',
      next_interview_date: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (app) => {
    setEditingApp(app);
    setFormData({
      company_name: app.company_name,
      position_title: app.position_title,
      job_location: app.job_location || 'Remote',
      work_mode: app.work_mode || 'Remote',
      salary_or_stipend: app.salary_or_stipend || '',
      job_url: app.job_url || '',
      status: app.status || 'Applied',
      next_interview_date: app.next_interview_date
        ? app.next_interview_date.slice(0, 10)
        : '',
      notes: app.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.company_name.trim() || !formData.position_title.trim()) return;

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        next_interview_date: formData.next_interview_date
          ? new Date(formData.next_interview_date).toISOString()
          : null,
      };

      if (editingApp) {
        const updated = await applicationService.updateApplication(editingApp.id, payload);
        setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      } else {
        const created = await applicationService.createApplication(payload);
        setApplications((prev) => [created, ...prev]);
      }

      fetchStats();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save application:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (appId, newStatus) => {
    try {
      const updated = await applicationService.updateApplication(appId, { status: newStatus });
      setApplications((prev) => prev.map((a) => (a.id === appId ? updated : a)));
      fetchStats();
    } catch (err) {
      console.error('Failed to change status:', err);
    }
  };

  const handleDelete = async (appId) => {
    if (!window.confirm('Are you sure you want to remove this application from your tracker?')) {
      return;
    }
    try {
      await applicationService.deleteApplication(appId);
      setApplications((prev) => prev.filter((a) => a.id !== appId));
      fetchStats();
    } catch (err) {
      console.error('Failed to delete application:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-brand-primary/10 text-brand-primary">
              Student Career Pipeline
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-800 mt-1">
            Job Applications Tracker
          </h1>
          <p className="text-sm text-slate-500">
            Monitor and advance your active job applications, interview timelines, and job offers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/jobs"
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-brand-border rounded-xl shadow-xs hover:bg-slate-50 transition"
          >
            Explore Jobs
          </Link>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-brand-primary hover:bg-brand-primaryDark shadow-sm rounded-xl transition"
          >
            <Plus className="w-4 h-4" />
            Track New Application
          </button>
        </div>
      </div>

      {/* KPI Funnel Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Tracked', val: stats.total, color: 'text-slate-900', key: 'All' },
          { label: 'Saved Jobs', val: stats.saved, color: 'text-amber-600', key: 'Saved' },
          { label: 'Applied', val: stats.applied, color: 'text-sky-600', key: 'Applied' },
          {
            label: 'Interviewing',
            val: stats.interviewing,
            color: 'text-purple-600',
            key: 'Interviewing',
          },
          { label: 'Offers', val: stats.offer, color: 'text-emerald-600', key: 'Offer' },
          { label: 'Rejected', val: stats.rejected, color: 'text-red-500', key: 'Rejected' },
        ].map((item) => (
          <div
            key={item.label}
            onClick={() => setStatusFilter(item.key)}
            className={`p-4 rounded-2xl border transition cursor-pointer text-center ${
              statusFilter === item.key
                ? 'bg-brand-primary/5 border-brand-primary/40 ring-1 ring-brand-primary/30 shadow-xs'
                : 'bg-white border-brand-border shadow-card hover:border-slate-300'
            }`}
          >
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              {item.label}
            </span>
            <div className={`mt-1.5 text-2xl font-bold font-display ${item.color}`}>
              {item.val}
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-2xl border border-brand-border shadow-card overflow-hidden">
        <div className="p-4 border-b border-brand-border flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {['All', 'Saved', 'Applied', 'Interviewing', 'Offer', 'Rejected'].map((stage) => (
              <button
                key={stage}
                onClick={() => setStatusFilter(stage)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                  statusFilter === stage
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {stage}
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by company or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-brand-border rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>
        </div>

        {/* Applications List / Cards */}
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-6 h-6 text-brand-primary animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading application pipeline...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">No applications tracked yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {statusFilter === 'All'
                ? 'Start tracking your internships and full-time applications to keep interview stages and notes organized.'
                : `No applications found with status '${statusFilter}'.`}
            </p>
            <button
              onClick={handleOpenAddModal}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand-primary rounded-xl hover:bg-brand-primaryDark transition"
            >
              <Plus className="w-4 h-4" /> Track First Application
            </button>
          </div>
        ) : (
          <div className="divide-y divide-brand-border">
            {applications.map((app) => {
              const statusCfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.Applied;
              return (
                <div
                  key={app.id}
                  className="p-5 hover:bg-slate-50/60 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        {app.company_name}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusCfg.bg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                        {app.status}
                      </span>
                      {app.job_url && (
                        <a
                          href={app.job_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-brand-primary transition"
                          title="Open job link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{app.position_title}</h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      {app.job_location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {app.job_location} ({app.work_mode || 'Remote'})
                        </span>
                      )}
                      {app.salary_or_stipend && (
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                          {app.salary_or_stipend}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        Applied: {new Date(app.applied_date).toLocaleDateString()}
                      </span>
                      {app.next_interview_date && (
                        <span className="flex items-center gap-1 font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                          <Calendar className="w-3 h-3 text-purple-500" />
                          Interview: {new Date(app.next_interview_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {app.notes && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-brand-border mt-2 line-clamp-2">
                        {app.notes}
                      </p>
                    )}
                  </div>

                  {/* Quick Stage Transition Dropdown & Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusChange(app.id, e.target.value)}
                      className="text-xs font-semibold px-2.5 py-1.5 bg-slate-50 border border-brand-border rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    >
                      <option value="Saved">Move to Saved</option>
                      <option value="Applied">Move to Applied</option>
                      <option value="Interviewing">Move to Interviewing</option>
                      <option value="Offer">Move to Offer 🎉</option>
                      <option value="Rejected">Move to Rejected</option>
                    </select>

                    <button
                      onClick={() => handleOpenEditModal(app)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                      title="Edit application"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(app.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                      title="Delete application"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Application Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-brand-border overflow-hidden my-8">
            <div className="p-5 border-b border-brand-border flex items-center justify-between bg-slate-50">
              <h2 className="text-base font-bold font-display text-slate-900">
                {editingApp ? 'Edit Tracked Application' : 'Track New Application'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Google, Stripe"
                    value={formData.company_name}
                    onChange={(e) =>
                      setFormData({ ...formData, company_name: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-brand-border rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Position Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Software Engineer Intern"
                    value={formData.position_title}
                    onChange={(e) =>
                      setFormData({ ...formData, position_title: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-brand-border rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Pipeline Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-brand-border rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-primary font-medium"
                  >
                    <option value="Saved">Saved</option>
                    <option value="Applied">Applied</option>
                    <option value="Interviewing">Interviewing</option>
                    <option value="Offer">Offer</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Work Mode</label>
                  <select
                    value={formData.work_mode}
                    onChange={(e) => setFormData({ ...formData, work_mode: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-brand-border rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-primary font-medium"
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Onsite">Onsite</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. San Francisco, CA / Remote"
                    value={formData.job_location}
                    onChange={(e) =>
                      setFormData({ ...formData, job_location: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-brand-border rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Compensation / Stipend</label>
                  <input
                    type="text"
                    placeholder="e.g. $45/hr or $110k/yr"
                    value={formData.salary_or_stipend}
                    onChange={(e) =>
                      setFormData({ ...formData, salary_or_stipend: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-brand-border rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Job URL / Portal</label>
                  <input
                    type="url"
                    placeholder="https://careers.company.com/..."
                    value={formData.job_url}
                    onChange={(e) => setFormData({ ...formData, job_url: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-brand-border rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Next Interview Date</label>
                  <input
                    type="date"
                    value={formData.next_interview_date}
                    onChange={(e) =>
                      setFormData({ ...formData, next_interview_date: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-brand-border rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Interview Notes & Recruiter Contacts</label>
                <textarea
                  rows={3}
                  placeholder="Record referral contacts, interview stages, questions asked, or follow-up dates..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-brand-border rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              <div className="pt-3 border-t border-brand-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-primary hover:bg-brand-primaryDark rounded-lg transition shadow-xs disabled:opacity-60"
                >
                  {submitting ? 'Saving...' : editingApp ? 'Update Application' : 'Track Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
