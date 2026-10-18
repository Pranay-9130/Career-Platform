import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  FolderGit2,
  Briefcase,
  Search,
  ExternalLink,
  Trash2,
  ArrowRight,
  Eye,
  Star,
  MapPin,
  DollarSign,
  Calendar,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import projectService from '../../services/projectService';
import jobService from '../../services/jobService';

export default function SavedWorkspacePage() {
  const [activeTab, setActiveTab] = useState('projects'); // 'projects' | 'jobs'
  const [savedProjects, setSavedProjects] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadSavedData = useCallback(async () => {
    try {
      setLoading(true);
      const [projectsData, jobsData] = await Promise.all([
        projectService.getMyBookmarks(),
        jobService.getMySavedJobs(),
      ]);
      setSavedProjects(projectsData || []);
      setSavedJobs(jobsData || []);
    } catch (err) {
      console.error('Failed to load saved items:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSavedData();
  }, [loadSavedData]);

  const handleRemoveProject = async (projectId) => {
    try {
      await projectService.toggleBookmark(projectId);
      setSavedProjects((prev) => prev.filter((p) => p.id !== projectId));
      window.dispatchEvent(new CustomEvent('workspace-counts-updated'));
    } catch (err) {
      console.error('Failed to remove project bookmark:', err);
    }
  };

  const handleRemoveJob = async (jobId) => {
    try {
      await jobService.toggleJobBookmark(jobId);
      setSavedJobs((prev) => prev.filter((j) => j.id !== jobId));
      window.dispatchEvent(new CustomEvent('workspace-counts-updated'));
    } catch (err) {
      console.error('Failed to remove job bookmark:', err);
    }
  };

  const filteredProjects = savedProjects.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.domain.toLowerCase().includes(q) ||
      (p.tech_stack && p.tech_stack.some((t) => t.toLowerCase().includes(q)))
    );
  });

  const filteredJobs = savedJobs.filter((j) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      j.title.toLowerCase().includes(q) ||
      j.company_name.toLowerCase().includes(q) ||
      j.domain.toLowerCase().includes(q) ||
      (j.skills_required && j.skills_required.some((s) => s.toLowerCase().includes(q)))
    );
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-brand-primary/10 text-brand-primary">
              Personal Workspace
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-800 mt-1">
            Saved Items & Bookmarks
          </h1>
          <p className="text-sm text-slate-500">
            Access your curated collection of inspiring project blueprints and career opportunities.
          </p>
        </div>

        <button
          onClick={loadSavedData}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-brand-border rounded-xl shadow-xs hover:bg-slate-50 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Tabs & Search Bar */}
      <div className="bg-white rounded-2xl border border-brand-border shadow-card p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex w-full min-w-0 items-center gap-2 overflow-x-auto pb-1 md:w-auto md:pb-0">
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex shrink-0 items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'projects'
                ? 'bg-brand-primary text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FolderGit2 className="w-4 h-4" />
            Saved Projects
            <span
              className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'projects' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {savedProjects.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('jobs')}
            className={`flex shrink-0 items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'jobs'
                ? 'bg-brand-primary text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Saved Jobs & Internships
            <span
              className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'jobs' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {savedJobs.length}
            </span>
          </button>
        </div>

        <div className="relative w-full min-w-0 md:w-auto md:min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Search saved ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-brand-border rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-primary"
          />
        </div>
      </div>

      {/* Main Content View */}
      {loading ? (
        <div className="p-16 text-center">
          <RefreshCw className="w-6 h-6 text-brand-primary animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading your saved items...</p>
        </div>
      ) : activeTab === 'projects' ? (
        /* Projects View */
        filteredProjects.length === 0 ? (
          <div className="bg-white rounded-3xl border border-brand-border shadow-card p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No saved projects found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Browse student submissions and blueprint guides in the discovery catalog and click the
              bookmark icon to collect inspiration for your portfolio.
            </p>
            <Link
              to="/projects"
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand-primary hover:bg-brand-primaryDark rounded-xl transition shadow-xs"
            >
              Explore Projects Catalog <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-2xl border border-brand-border shadow-card hover:shadow-md transition p-5 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-brand-primary/10 text-brand-primary">
                      {project.domain}
                    </span>
                    <button
                      onClick={() => handleRemoveProject(project.id)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition"
                      title="Remove bookmark"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="font-display font-bold text-base text-slate-900 group-hover:text-brand-primary transition line-clamp-1">
                    <Link to={`/projects/${project.slug}`}>{project.title}</Link>
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {project.short_description}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-slate-500">
                    <span className="font-medium text-slate-700">{project.difficulty}</span>
                    <span>•</span>
                    <span>{project.estimated_duration || '2-3 weeks'}</span>
                  </div>

                  {project.tech_stack && project.tech_stack.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {project.tech_stack.slice(0, 3).map((t, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600"
                        >
                          {t}
                        </span>
                      ))}
                      {project.tech_stack.length > 3 && (
                        <span className="text-[10px] text-slate-400 self-center">
                          +{project.tech_stack.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-brand-border flex items-center justify-between mt-4 text-xs">
                  <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> {project.views_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />{' '}
                      {project.stars_count || 0}
                    </span>
                  </div>

                  <Link
                    to={`/projects/${project.slug}`}
                    className="inline-flex items-center gap-1 font-bold text-brand-primary hover:underline"
                  >
                    View Project <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Jobs View */
        filteredJobs.length === 0 ? (
          <div className="bg-white rounded-3xl border border-brand-border shadow-card p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No saved job postings found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Browse verified software engineering positions, internships, and remote roles in the
              jobs catalog to bookmark opportunities you want to apply for later.
            </p>
            <Link
              to="/jobs"
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand-primary hover:bg-brand-primaryDark rounded-xl transition shadow-xs"
            >
              Explore Jobs Catalog <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-2xl border border-brand-border shadow-card hover:shadow-md transition p-5 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-brand-veryLight border border-brand-border flex items-center justify-center font-bold text-sm text-brand-primary overflow-hidden shrink-0">
                        {job.company_logo_url ? (
                          <img
                            src={job.company_logo_url}
                            alt={job.company_name}
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          job.company_name?.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-500 block">
                          {job.company_name}
                        </span>
                        <h3 className="font-display font-bold text-sm text-slate-900 group-hover:text-brand-primary transition line-clamp-1">
                          <Link to={`/jobs/${job.id}`}>{job.title}</Link>
                        </h3>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveJob(job.id)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition"
                      title="Remove bookmark"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-primary/10 text-brand-primary">
                      {job.job_type}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                      {job.work_mode}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 ml-auto">
                      {job.stipend_or_salary}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-3">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {job.location}
                    </span>
                    {job.deadline && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> Deadline:{' '}
                        {new Date(job.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {job.skills_required && job.skills_required.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {job.skills_required.slice(0, 3).map((s, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-50 border border-brand-border text-slate-600"
                        >
                          {s}
                        </span>
                      ))}
                      {job.skills_required.length > 3 && (
                        <span className="text-[10px] text-slate-400 self-center">
                          +{job.skills_required.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-brand-border flex items-center justify-between mt-4">
                  <Link
                    to={`/jobs/${job.id}`}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    View Details
                  </Link>

                  <a
                    href={job.apply_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-brand-primary hover:bg-brand-primaryDark rounded-lg transition shadow-xs"
                  >
                    Apply Now <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
