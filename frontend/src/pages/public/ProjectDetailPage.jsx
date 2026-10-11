import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  Share2,
  ExternalLink,
  Github,
  Download,
  Clock,
  Eye,
  Star,
  CheckCircle2,
  Code2,
  Layers,
  Sparkles,
  User,
  GraduationCap,
  Calendar,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  ShieldCheck,
  Users,
  Linkedin,
  Globe,
} from 'lucide-react';
import { Button, Badge, Card, Skeleton } from '@/components/common';
import ProjectCard from '@/components/cards/ProjectCard';
import { projectService } from '@/services/projectService';
import { useAuth } from '@/context/AuthContext';
import SEO from '@/components/common/SEO';
import { getProjectCreativeWorkSchema, getBreadcrumbListSchema } from '@/utils/seoSchemas';

export default function ProjectDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [project, setProject] = useState(null);
  const [relatedProjects, setRelatedProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Screenshot carousel & lightbox state
  const [activeScreenshotIdx, setActiveScreenshotIdx] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    async function loadProject() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await projectService.getProjectBySlug(slug);

        // Check local saved status if not logged in
        if (!isAuthenticated) {
          try {
            const localSaved = JSON.parse(localStorage.getItem('student_saved_projects') || '[]');
            data.is_bookmarked = localSaved.includes(data.slug) || localSaved.includes(data.id);
          } catch (e) {
            // ignore
          }
        }

        setProject(data);
        setActiveScreenshotIdx(0);

        // Fetch related projects
        try {
          const related = await projectService.getRelatedProjects(slug);
          setRelatedProjects(related || []);
        } catch (e) {
          setRelatedProjects([]);
        }
      } catch (err) {
        console.error('Failed to load project details:', err);
        setError(err.response?.status === 404 ? 'Project not found' : 'Failed to load project details');
      } finally {
        setIsLoading(false);
      }
    }

    if (slug) {
      loadProject();
      window.scrollTo(0, 0);
    }
  }, [slug, isAuthenticated]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleBookmarkToggle = async () => {
    if (!project) return;
    const nextSaved = !project.is_bookmarked;

    if (isAuthenticated) {
      try {
        const res = await projectService.toggleBookmark(project.slug);
        setProject((prev) => ({
          ...prev,
          is_bookmarked: res.bookmarked,
          bookmarks_count: res.bookmarks_count,
        }));
        showToast(res.message);
      } catch (err) {
        showToast('Failed to update bookmark.');
      }
    } else {
      try {
        let localSaved = JSON.parse(localStorage.getItem('student_saved_projects') || '[]');
        if (nextSaved) {
          if (!localSaved.includes(project.slug)) localSaved.push(project.slug);
          showToast('Saved to browser bookmarks! Sign in to sync across devices.');
        } else {
          localSaved = localSaved.filter((s) => s !== project.slug);
          showToast('Project removed from bookmarks.');
        }
        localStorage.setItem('student_saved_projects', JSON.stringify(localSaved));
        setProject((prev) => ({
          ...prev,
          is_bookmarked: nextSaved,
          bookmarks_count: nextSaved ? prev.bookmarks_count + 1 : Math.max(0, prev.bookmarks_count - 1),
        }));
      } catch (e) {
        // ignore
      }
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Project URL copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/60 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <Skeleton className="h-6 w-48" />
          <div className="bg-white border border-brand-border rounded-2xl p-8 space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-3 pt-4">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-80 w-full rounded-2xl" />
              <Skeleton className="h-48 w-full rounded-2xl" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50/60 py-16 px-4">
        <div className="max-w-md w-full bg-white border border-brand-border rounded-2xl p-8 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 mx-auto flex items-center justify-center mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="font-display font-bold text-xl text-brand-text">Project Not Found</h2>
          <p className="mt-2 text-sm text-brand-muted">
            The project blueprint you are looking for does not exist or has been unpublished by the author.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/projects">
              <Button variant="primary" leftIcon={ArrowLeft}>
                Explore All Projects
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Aggregate screenshots list
  const screenshots = (project.screenshots && project.screenshots.length > 0)
    ? project.screenshots
    : project.cover_image_url
    ? [{ image_url: project.cover_image_url, caption: project.title }]
    : [];

  const activeScreenshot = screenshots[activeScreenshotIdx] || null;

  const difficultyVariant =
    project.difficulty === 'Beginner' ? 'approved' : project.difficulty === 'Intermediate' ? 'published' : 'changesRequested';

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      <SEO
        title={project.title}
        description={project.short_description || `Explore ${project.title} on Student Career Platform.`}
        canonical={`/projects/${project.slug}`}
        ogType="article"
        ogImage={project.screenshots?.[0]?.image_url || undefined}
        schema={[
          getProjectCreativeWorkSchema(project),
          getBreadcrumbListSchema([
            { name: "Home", path: "/" },
            { name: "Projects", path: "/projects" },
            { name: project.title, path: `/projects/${project.slug}` },
          ]),
        ]}
      />
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-lg border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-brand-primary" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb Navigation Bar */}
      <div className="border-b border-brand-border bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-brand-muted">
            <Link to="/" className="hover:text-brand-primary transition-colors">Home</Link>
            <span>/</span>
            <Link to="/projects" className="hover:text-brand-primary transition-colors">Projects</Link>
            <span>/</span>
            <span className="text-slate-800 font-medium truncate max-w-[200px] sm:max-w-xs">{project.title}</span>
          </div>

          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 text-xs text-brand-primary hover:text-brand-secondary font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Discovery</span>
          </Link>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Project Header Banner Card */}
        <div className="bg-white border border-brand-border rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xs mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-primary bg-brand-veryLight px-2.5 py-1 rounded-md border border-brand-border">
                  {project.domain}
                </span>
                <Badge variant={difficultyVariant} size="sm">
                  {project.difficulty}
                </Badge>
              </div>

              <h1 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-brand-text tracking-tight leading-tight">
                {project.title}
              </h1>

              <p className="text-sm sm:text-base text-brand-muted leading-relaxed max-w-3xl">
                {project.short_description}
              </p>

              {/* Key Metrics Chips */}
              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Duration: {project.estimated_duration || '2-3 weeks'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-slate-400" />
                  <span>{project.views_count} views</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>{project.stars_count} stars</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4 text-brand-primary" />
                  <span>{project.bookmarks_count} saved</span>
                </div>
              </div>
            </div>

            {/* Top Action CTAs */}
            <div className="flex flex-row lg:flex-col gap-3 shrink-0">
              <Button
                variant={project.is_bookmarked ? 'primary' : 'outline'}
                onClick={handleBookmarkToggle}
                leftIcon={Bookmark}
                className="flex-1 lg:flex-initial justify-center"
              >
                {project.is_bookmarked ? 'Saved to Bookmarks' : 'Bookmark Project'}
              </Button>

              <div className="flex flex-wrap items-center gap-2">
                {project.zip_download_url && (
                  <a
                    href={project.zip_download_url}
                    download
                    className="flex-1 min-w-[130px]"
                  >
                    <Button variant="primary" size="md" leftIcon={Download} className="w-full justify-center">
                      Download ZIP
                    </Button>
                  </a>
                )}

                {project.live_demo_url && (
                  <a
                    href={project.live_demo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-[110px]"
                  >
                    <Button variant="secondary" size="md" rightIcon={ExternalLink} className="w-full justify-center">
                      Live Demo
                    </Button>
                  </a>
                )}

                {project.github_url && (
                  <a
                    href={project.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-[110px]"
                  >
                    <Button variant="outline" size="md" leftIcon={Github} className="w-full justify-center">
                      Code Repo
                    </Button>
                  </a>
                )}

                <button
                  type="button"
                  onClick={handleShare}
                  className="w-10 h-10 rounded-xl border border-brand-border bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors shrink-0"
                  title="Share project link"
                  aria-label="Share project"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Body Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main 2-Span Column: Specs, Gallery, Blueprints */}
          <div className="lg:col-span-2 space-y-8">
            {/* Screenshots Gallery & Lightbox Carousel */}
            {screenshots.length > 0 && (
              <div className="bg-white border border-brand-border rounded-3xl p-6 sm:p-8 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-base text-brand-text flex items-center gap-2">
                    <Layers className="w-4 h-4 text-brand-primary" />
                    Project Visuals & Demos
                  </h3>
                  <span className="text-xs text-brand-muted">
                    {activeScreenshotIdx + 1} of {screenshots.length}
                  </span>
                </div>

                {/* Main Preview */}
                <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 aspect-video group">
                  <img
                    src={activeScreenshot?.image_url}
                    alt={activeScreenshot?.caption || project.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />

                  {/* Caption Overlay */}
                  {activeScreenshot?.caption && (
                    <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-slate-950/80 to-transparent text-white text-xs sm:text-sm font-medium">
                      {activeScreenshot.caption}
                    </div>
                  )}

                  {/* Zoom Lightbox Trigger */}
                  <button
                    type="button"
                    onClick={() => setIsLightboxOpen(true)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-900/60 backdrop-blur text-white hover:bg-slate-900 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                    title="Open full size"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>

                  {/* Carousel Prev/Next Buttons */}
                  {screenshots.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveScreenshotIdx((prev) => (prev > 0 ? prev - 1 : screenshots.length - 1))
                        }
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/60 backdrop-blur text-white hover:bg-slate-900 flex items-center justify-center transition-all"
                        aria-label="Previous screenshot"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveScreenshotIdx((prev) => (prev < screenshots.length - 1 ? prev + 1 : 0))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/60 backdrop-blur text-white hover:bg-slate-900 flex items-center justify-center transition-all"
                        aria-label="Next screenshot"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnail Strip */}
                {screenshots.length > 1 && (
                  <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                    {screenshots.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveScreenshotIdx(idx)}
                        className={`relative rounded-xl overflow-hidden shrink-0 w-24 h-16 border-2 transition-all ${
                          activeScreenshotIdx === idx
                            ? 'border-brand-primary ring-2 ring-brand-primary/20 scale-105'
                            : 'border-brand-border opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={s.image_url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Problem Statement Card */}
            <div className="bg-white border border-brand-border rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
              <h2 className="font-display font-bold text-lg text-brand-text flex items-center gap-2">
                <Code2 className="w-5 h-5 text-brand-primary" />
                Problem Statement & Context
              </h2>
              <div className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed space-y-3">
                <p>{project.problem_statement || project.short_description}</p>
                {project.objectives && (
                  <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 mt-4">
                    <h4 className="font-semibold text-xs text-brand-primary uppercase tracking-wider mb-2">
                      Primary Engineering Objectives
                    </h4>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                      {project.objectives}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Core Features & Implementation Scope */}
            {project.features && project.features.length > 0 && (
              <div className="bg-white border border-brand-border rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
                <h2 className="font-display font-bold text-lg text-brand-text flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  Key Features & Architecture Capabilities
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {project.features.map((feature, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-brand-border/60 text-xs text-slate-700"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="font-medium leading-relaxed">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tech Stack & Architecture Badges */}
            <div className="bg-white border border-brand-border rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
              <h2 className="font-display font-bold text-lg text-brand-text flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-primary" />
                Technologies & Architecture Stack
              </h2>
              <div className="flex flex-wrap gap-2 pt-1">
                {(project.tech_stack || []).map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              {project.prerequisites && (
                <div className="mt-4 pt-4 border-t border-brand-border">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Recommended Prerequisites
                  </h4>
                  <p className="text-xs text-brand-muted leading-relaxed">
                    {project.prerequisites}
                  </p>
                </div>
              )}
            </div>

            {/* Expected Learning Outcomes */}
            {project.expected_outcome && (
              <div className="bg-gradient-to-tr from-brand-veryLight/50 to-indigo-50/40 border border-brand-border rounded-3xl p-6 sm:p-8 shadow-xs space-y-3">
                <h2 className="font-display font-bold text-base text-brand-text flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-brand-primary" />
                  What You'll Learn & Portfolio Talking Points
                </h2>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {project.expected_outcome}
                </p>
              </div>
            )}

            {/* Co-Authors & Project Contributors */}
            {project.contributors && project.contributors.length > 0 && (
              <div className="bg-white border border-brand-border rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-lg text-brand-text flex items-center gap-2">
                    <Users className="w-5 h-5 text-brand-primary" />
                    <span>Project Co-Authors & Contributors</span>
                  </h2>
                  <Badge variant="neutral" size="sm">
                    {project.contributors.length} {project.contributors.length === 1 ? 'Contributor' : 'Contributors'}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {project.contributors.map((contributor, idx) => {
                    const initials = contributor.name
                      ? contributor.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                      : 'CO';
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3.5 rounded-2xl border border-brand-border bg-slate-50/60 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {contributor.avatar_url ? (
                            <img
                              src={contributor.avatar_url}
                              alt={contributor.name}
                              className="w-10 h-10 rounded-xl object-cover border border-brand-border shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-cyan text-white font-display font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                              {initials}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-display font-bold text-xs sm:text-sm text-brand-text truncate">
                                {contributor.name}
                              </span>
                              {contributor.profile_username && (
                                <Link
                                  to={`/u/${contributor.profile_username}`}
                                  className="text-brand-primary hover:underline text-[10px] font-semibold shrink-0"
                                  title="View student portfolio"
                                >
                                  @{contributor.profile_username}
                                </Link>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 block truncate">
                              {contributor.role || 'Contributor'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {contributor.github_username && (
                            <a
                              href={`https://github.com/${contributor.github_username}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg border border-brand-border hover:border-brand-primary/40 hover:bg-white text-slate-600 hover:text-brand-primary transition-all"
                              title={`GitHub: @${contributor.github_username}`}
                            >
                              <Github className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {contributor.profile_username && (
                            <Link
                              to={`/u/${contributor.profile_username}`}
                              className="p-1.5 rounded-lg border border-brand-border hover:border-brand-primary/40 hover:bg-white text-brand-primary transition-all"
                              title="View Student Profile"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column (Sidebar): Author, Resources, CTAs */}
          <div className="space-y-8">
            {/* Author Credit Card */}
            <div className="bg-white border border-brand-border rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-sm text-slate-500 uppercase tracking-wider">
                  Project Author
                </h3>
                {project.author_username && (
                  <Link
                    to={`/u/${project.author_username}`}
                    className="text-xs text-brand-primary hover:underline font-semibold"
                  >
                    @{project.author_username}
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-display font-bold text-lg flex items-center justify-center shadow-xs shrink-0">
                  {project.author_avatar ? (
                    <img
                      src={project.author_avatar}
                      alt={project.author_name}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  ) : (
                    project.author_name?.slice(0, 2).toUpperCase() || 'AU'
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="font-display font-bold text-base text-brand-text truncate">
                    {project.author_name}
                  </h4>
                  {project.author_headline && (
                    <p className="text-xs text-brand-muted truncate">
                      {project.author_headline}
                    </p>
                  )}
                  {project.author_university && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span className="truncate">{project.author_university}</span>
                    </div>
                  )}
                </div>
              </div>

              {project.author_bio && (
                <p className="text-xs text-brand-muted leading-relaxed line-clamp-3">
                  {project.author_bio}
                </p>
              )}

              {/* Author Social Links */}
              {(project.author_github || project.author_linkedin || project.author_portfolio) && (
                <div className="flex items-center gap-2 pt-1 border-t border-brand-border/60">
                  {project.author_github && (
                    <a
                      href={project.author_github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl border border-brand-border hover:border-brand-primary/40 hover:bg-slate-50 text-slate-600 hover:text-brand-primary transition-all shadow-xs"
                      title="GitHub Profile"
                    >
                      <Github className="w-4 h-4" />
                    </a>
                  )}
                  {project.author_linkedin && (
                    <a
                      href={project.author_linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl border border-brand-border hover:border-brand-primary/40 hover:bg-slate-50 text-slate-600 hover:text-brand-primary transition-all shadow-xs"
                      title="LinkedIn Profile"
                    >
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                  {project.author_portfolio && (
                    <a
                      href={project.author_portfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl border border-brand-border hover:border-brand-primary/40 hover:bg-slate-50 text-slate-600 hover:text-brand-primary transition-all shadow-xs"
                      title="Personal Website"
                    >
                      <Globe className="w-4 h-4" />
                    </a>
                  )}
                </div>
              )}

              {project.author_username && (
                <div className="pt-2">
                  <Link to={`/u/${project.author_username}`}>
                    <Button variant="outline" size="sm" className="w-full justify-center text-xs">
                      View Full Student Portfolio
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Build & Resources Card */}
            <div className="bg-white border border-brand-border rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
              <h3 className="font-display font-bold text-sm text-slate-500 uppercase tracking-wider">
                Starter Kit & Resources
              </h3>

              <div className="p-4 rounded-2xl bg-slate-50 border border-brand-border/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Repository / Codebase</span>
                  <span className="text-emerald-600 font-medium">Verified Active</span>
                </div>
                <p className="text-[11px] text-brand-muted">
                  Includes frontend React components, FastAPI backend endpoints, and schema definitions.
                </p>
              </div>

              {project.zip_download_url ? (
                <a
                  href={project.zip_download_url}
                  download
                  className="block"
                >
                  <Button
                    variant="primary"
                    className="w-full justify-center py-3"
                    leftIcon={Download}
                  >
                    {project.zip_file_size_bytes
                      ? `Download Starter Kit (${Math.round(project.zip_file_size_bytes / 1024)} KB)`
                      : 'Download Project Starter Kit'}
                  </Button>
                </a>
              ) : project.github_url ? (
                <a
                  href={project.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button
                    variant="primary"
                    className="w-full justify-center py-3"
                    leftIcon={Github}
                  >
                    Clone From GitHub
                  </Button>
                </a>
              ) : (
                <Button
                  variant="primary"
                  className="w-full justify-center py-3"
                  onClick={handleBookmarkToggle}
                  leftIcon={Bookmark}
                >
                  Save to My Learning Queue
                </Button>
              )}

              <div className="text-[11px] text-center text-slate-400">
                100% free and open-source for verified students.
              </div>

              <div className="pt-2 border-t border-brand-border/60 text-center">
                <Link
                  to="/submission-guidelines"
                  className="text-[11px] text-brand-primary hover:underline font-medium inline-flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Review Submission & Code Safety Rules</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Related Projects Section */}
        {relatedProjects.length > 0 && (
          <div className="mt-16 pt-12 border-t border-brand-border">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-display font-bold text-xl text-brand-text">
                  Similar {project.domain} Projects
                </h3>
                <p className="text-xs sm:text-sm text-brand-muted mt-1">
                  More recommended architectures to sharpen your skillset.
                </p>
              </div>
              <Link to={`/projects?domain=${encodeURIComponent(project.domain)}`}>
                <Button variant="outline" size="sm" className="text-xs">
                  View All in Domain
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProjects.map((p) => (
                <ProjectCard
                  key={p.id}
                  id={p.id}
                  slug={p.slug}
                  title={p.title}
                  domain={p.domain}
                  description={p.short_description}
                  technologies={p.tech_stack}
                  authorName={p.author_name}
                  authorAvatar={p.author_avatar}
                  difficulty={p.difficulty}
                  duration={p.estimated_duration}
                  stars={p.stars_count}
                  views_count={p.views_count}
                  coverImage={p.cover_image_url}
                  isSaved={p.is_bookmarked}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Full-Screen Lightbox Modal */}
      {isLightboxOpen && activeScreenshot && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
            aria-label="Close full size view"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="max-w-5xl max-h-[90vh] flex flex-col items-center">
            <img
              src={activeScreenshot.image_url}
              alt={activeScreenshot.caption || 'Screenshot'}
              className="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
            {activeScreenshot.caption && (
              <p className="mt-4 text-sm text-white/90 text-center font-medium">
                {activeScreenshot.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
