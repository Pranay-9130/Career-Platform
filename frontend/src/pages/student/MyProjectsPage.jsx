import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FolderGit2,
  Plus,
  Search,
  ExternalLink,
  Edit3,
  Trash2,
  Eye,
  Star,
  Bookmark,
  Calendar,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  FileText,
  RotateCcw,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { projectService } from '@/services/projectService';
import { Button, Input, Badge, Card, Modal, Spinner } from '@/components/common';

export default function MyProjectsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Delete modal state
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchMyProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await projectService.getMySubmissions();
      setProjects(data || []);
    } catch (err) {
      console.error('Failed to load my projects:', err);
      setError('Unable to load your project portfolio. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyProjects();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    try {
      await projectService.deleteProject(projectToDelete.slug);
      setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));
      window.dispatchEvent(new CustomEvent('workspace-counts-updated'));
      showToast(`"${projectToDelete.title}" was successfully deleted.`);
      setProjectToDelete(null);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete project.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Metrics
  const stats = useMemo(() => {
    const total = projects.length;
    const drafts = projects.filter((p) => p.status === 'Draft').length;
    const submitted = projects.filter((p) => p.status === 'Submitted').length;
    const published = projects.filter((p) => p.status === 'Published').length;
    return { total, drafts, submitted, published };
  }, [projects]);

  // Filtered project list
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Tab filter
      if (activeTab === 'draft' && p.status !== 'Draft') return false;
      if (activeTab === 'submitted' && p.status !== 'Submitted') return false;
      if (activeTab === 'published' && p.status !== 'Published') return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchTitle = p.title?.toLowerCase().includes(query);
        const matchDomain = p.domain?.toLowerCase().includes(query);
        const matchTech = (p.tech_stack || []).some((t) => t.toLowerCase().includes(query));
        return matchTitle || matchDomain || matchTech;
      }
      return true;
    });
  }, [projects, activeTab, searchQuery]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Published':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Published
          </span>
        );
      case 'Submitted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-brand-primary border border-brand-primary/30">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
            Under Review
          </span>
        );
      case 'Draft':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Draft
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-medium border border-slate-700 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">
              Student Workspace
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500">Portfolio Manager</span>
          </div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-brand-text">
            My Projects & Submissions
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Track submission reviews, manage in-progress drafts, and showcase verified engineering artifacts.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link to="/submission-guidelines">
            <Button variant="outline" size="md" className="shadow-xs">
              Guidelines
            </Button>
          </Link>
          <Link to="/projects/submit">
            <Button variant="primary" size="md" leftIcon={Plus} className="shadow-xs">
              + Submit Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-brand-border rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block mb-1">Total Projects</span>
          <span className="font-display font-bold text-2xl text-brand-text">{stats.total}</span>
        </div>

        <div className="bg-white border border-brand-border rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-amber-700">Drafts In Progress</span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <span className="font-display font-bold text-2xl text-amber-900">{stats.drafts}</span>
        </div>

        <div className="bg-white border border-brand-border rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-blue-700">Under Review</span>
            <span className="w-2 h-2 rounded-full bg-brand-primary" />
          </div>
          <span className="font-display font-bold text-2xl text-blue-900">{stats.submitted}</span>
        </div>

        <div className="bg-white border border-brand-border rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-emerald-700">Published Showcase</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <span className="font-display font-bold text-2xl text-emerald-900">{stats.published}</span>
        </div>
      </div>

      {/* Filters & Search Control Bar */}
      <div className="bg-white border border-brand-border rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All Projects', count: stats.total },
            { id: 'draft', label: 'Drafts', count: stats.drafts },
            { id: 'submitted', label: 'Under Review', count: stats.submitted },
            { id: 'published', label: 'Published', count: stats.published },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  activeTab === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search my projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-brand-border bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-brand-primary transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Projects List Content */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Spinner size="lg" />
          <p className="text-xs text-slate-500 font-medium">Loading your projects...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <h3 className="font-display font-bold text-base text-red-900">{error}</h3>
          <Button variant="outline" size="sm" onClick={fetchMyProjects} leftIcon={RotateCcw}>
            Retry Loading
          </Button>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white border border-brand-border rounded-3xl p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-brand-primary mx-auto flex items-center justify-center">
            <FolderGit2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-bold text-lg text-brand-text">
              {searchQuery
                ? 'No matching projects found'
                : activeTab === 'draft'
                ? 'No active drafts in progress'
                : activeTab === 'submitted'
                ? 'No projects currently under review'
                : 'No projects in your showcase portfolio yet'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              {searchQuery
                ? 'Try adjusting your search keywords or clear the filter.'
                : 'Submit a project with architecture specs and code to get noticed by recruiters.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/submission-guidelines">
              <Button variant="outline" size="md">
                Submission Guidelines
              </Button>
            </Link>
            <Link to="/projects/submit">
              <Button variant="primary" size="md" leftIcon={Plus}>
                + Submit Project
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-white border border-brand-border rounded-3xl overflow-hidden shadow-xs hover:shadow-card transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Card Header & Cover */}
                <div className="relative h-40 bg-slate-100 overflow-hidden">
                  {project.cover_image_url ? (
                    <img
                      src={project.cover_image_url}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center text-slate-300">
                      <FolderGit2 className="w-10 h-10 text-brand-primary/40" />
                    </div>
                  )}

                  <div className="absolute top-3 left-3">
                    {getStatusBadge(project.status)}
                  </div>

                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-700 shadow-xs">
                    {project.difficulty}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-3">
                  <div>
                    <span className="text-[11px] font-bold text-brand-primary uppercase tracking-wider block">
                      {project.domain}
                    </span>
                    <h3 className="font-display font-bold text-base text-brand-text group-hover:text-brand-primary transition-colors line-clamp-1 mt-0.5">
                      {project.title}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {project.short_description}
                  </p>

                  {/* Tech stack pills */}
                  {project.tech_stack?.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {project.tech_stack.slice(0, 3).map((tech) => (
                        <span
                          key={tech}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700"
                        >
                          {tech}
                        </span>
                      ))}
                      {project.tech_stack.length > 3 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-400">
                          +{project.tech_stack.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-5 pt-0 border-t border-slate-100 mt-2">
                <div className="flex items-center justify-between text-xs text-slate-500 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1" title="Views">
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      {project.views_count || 0}
                    </span>
                    <span className="flex items-center gap-1" title="Stars">
                      <Star className="w-3.5 h-3.5 text-slate-400" />
                      {project.stars_count || 0}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(project.created_at).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <Link
                    to={`/projects/${project.slug}`}
                    className="w-full"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs py-1.5 text-slate-700"
                      leftIcon={Eye}
                    >
                      View
                    </Button>
                  </Link>

                  <Link
                    to={`/projects/${project.slug}/edit`}
                    className="w-full"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs py-1.5 text-brand-primary border-brand-primary/30 hover:bg-blue-50"
                      leftIcon={Edit3}
                    >
                      Edit
                    </Button>
                  </Link>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setProjectToDelete(project)}
                    className="w-full text-xs py-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50"
                    leftIcon={Trash2}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(projectToDelete)}
        onClose={() => setProjectToDelete(null)}
        title="Delete Project"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to delete{' '}
            <strong className="text-brand-text">"{projectToDelete?.title}"</strong>? This will permanently remove its code specs, gallery screenshots, and student submission record.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>This action cannot be undone. Any bookmarks by other students will be removed.</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setProjectToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              leftIcon={Trash2}
            >
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
