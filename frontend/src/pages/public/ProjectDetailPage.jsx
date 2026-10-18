import React, { useState, useEffect, useMemo } from 'react';
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
  MessageCircle,
  Send,
  Trash2,
  Terminal,
  Cpu,
  Server,
  Shield,
  Smartphone,
  ArrowUpRight,
} from 'lucide-react';
import { Button, Badge, Card, Skeleton, Breadcrumbs } from '@/components/common';
import ProjectCard from '@/components/cards/ProjectCard';
import { projectService } from '@/services/projectService';
import { useAuth } from '@/context/AuthContext';
import SEO from '@/components/common/SEO';
import { getProjectCreativeWorkSchema, getBreadcrumbListSchema } from '@/utils/seoSchemas';
import { resolveMediaUrl } from '@/utils/media';

/**
 * Premium generative canvas rendered when screenshots fail to load or are not provided.
 * Adapts typography, glowing meshes, and badges dynamically based on project domain.
 */
function ProjectHeroCanvas({ project }) {
  const getDomainTheme = (domain) => {
    const d = (domain || '').toLowerCase();
    if (d.includes('ai') || d.includes('machine') || d.includes('data')) {
      return {
        gradient: 'from-slate-950 via-purple-950/80 to-slate-900',
        glow: 'bg-purple-500/25',
        border: 'border-purple-500/30',
        badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
        accent: 'text-purple-400',
        icon: Cpu,
        label: 'AI & Data Architecture',
      };
    }
    if (d.includes('cyber') || d.includes('security')) {
      return {
        gradient: 'from-slate-950 via-emerald-950/80 to-slate-900',
        glow: 'bg-emerald-500/25',
        border: 'border-emerald-500/30',
        badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        accent: 'text-emerald-400',
        icon: Shield,
        label: 'Cybersecurity Architecture',
      };
    }
    if (d.includes('mobile') || d.includes('ios') || d.includes('android')) {
      return {
        gradient: 'from-slate-950 via-rose-950/80 to-slate-900',
        glow: 'bg-rose-500/25',
        border: 'border-rose-500/30',
        badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        accent: 'text-rose-400',
        icon: Smartphone,
        label: 'Mobile Application Framework',
      };
    }
    if (d.includes('cloud') || d.includes('devops')) {
      return {
        gradient: 'from-slate-950 via-sky-950/80 to-slate-900',
        glow: 'bg-sky-500/25',
        border: 'border-sky-500/30',
        badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
        accent: 'text-sky-400',
        icon: Server,
        label: 'Cloud Infrastructure & DevOps',
      };
    }
    // Default to Full Stack / Web Development
    return {
      gradient: 'from-slate-950 via-indigo-950/80 to-slate-900',
      glow: 'bg-blue-500/25',
      border: 'border-blue-500/30',
      badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
      accent: 'text-cyan-400',
      icon: Terminal,
      label: 'Full Stack Engineering Blueprint',
    };
  };

  const theme = getDomainTheme(project?.domain);
  const DomainIcon = theme.icon;

  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${theme.gradient} border ${theme.border} p-6 sm:p-8 aspect-video flex flex-col justify-between shadow-2xl group select-none`}
    >
      {/* Ambient gradient backdrops */}
      <div
        className={`absolute top-0 right-1/4 w-80 h-80 rounded-full ${theme.glow} blur-3xl pointer-events-none transition-all duration-700 group-hover:scale-110`}
      />
      <div className="absolute bottom-0 left-10 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0d_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

      {/* Terminal / Browser Mockup Top Bar */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <div className="ml-3 flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] font-mono text-slate-300">
            <Code2 className={`w-3 h-3 ${theme.accent}`} />
            <span>{project?.slug || 'project'}.blueprint</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Verified Showcase
          </span>
        </div>
      </div>

      {/* Center Showcase Content */}
      <div className="relative z-10 my-auto py-3">
        <div className="flex items-center gap-2 mb-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${theme.badge}`}>
            <DomainIcon className="w-3.5 h-3.5" />
            {theme.label}
          </span>
          <span className="text-xs text-slate-400 font-medium">
            • {project?.difficulty || 'Intermediate'} Level
          </span>
        </div>

        <h3 className="font-display font-black text-xl sm:text-2xl lg:text-3xl text-white tracking-tight leading-snug max-w-2xl drop-shadow-sm">
          {project?.title}
        </h3>

        <p className="mt-2 text-xs sm:text-sm text-slate-300 line-clamp-2 max-w-xl font-normal leading-relaxed">
          {project?.short_description}
        </p>

        {/* Tech Stack Badges */}
        {project?.tech_stack && project.tech_stack.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            {project.tech_stack.slice(0, 5).map((tech, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-mono font-medium bg-white/10 text-slate-200 border border-white/15 backdrop-blur-sm shadow-xs"
              >
                {tech}
              </span>
            ))}
            {project.tech_stack.length > 5 && (
              <span className="text-[10px] font-mono text-slate-400">
                +{project.tech_stack.length - 5} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Canvas Footer CTAs */}
      <div className="relative z-10 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Interactive Student Blueprint & Source</span>
        </div>

        <div className="flex items-center gap-2">
          {project?.live_demo_url && (
            <a
              href={project.live_demo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs shadow-md transition-all hover:scale-105"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Live Demo</span>
            </a>
          )}
          {project?.github_url && (
            <a
              href={project.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs border border-white/20 backdrop-blur-sm transition-all"
            >
              <Github className="w-3.5 h-3.5" />
              <span>Inspect Code</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [project, setProject] = useState(null);
  const [relatedProjects, setRelatedProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  const [isStarUpdating, setIsStarUpdating] = useState(false);

  // Screenshot carousel, lightbox & error tracking
  const [activeScreenshotIdx, setActiveScreenshotIdx] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [failedImages, setFailedImages] = useState(new Set());
  const [authorAvatarFailed, setAuthorAvatarFailed] = useState(false);

  const handleImageError = (url) => {
    if (!url) return;
    setFailedImages((prev) => {
      const next = new Set(prev);
      next.add(url);
      return next;
    });
  };

  const authorInitials = useMemo(() => {
    if (!project?.author_name) return 'AU';
    const parts = project.author_name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'AU';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [project?.author_name]);

  // Aggregate screenshots list (declared at top level to satisfy React Rules of Hooks)
  const screenshots = useMemo(() => {
    if (Array.isArray(project?.screenshots) && project.screenshots.length > 0) {
      return project.screenshots.map((s) => ({
        ...s,
        image_url: resolveMediaUrl(s.image_url),
      }));
    }
    if (project?.cover_image_url) {
      return [{ image_url: resolveMediaUrl(project.cover_image_url), caption: project.title }];
    }
    return [];
  }, [project?.screenshots, project?.cover_image_url, project?.title]);

  useEffect(() => {
    async function loadProject() {
      setFailedImages(new Set());
      setAuthorAvatarFailed(false);
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

        try {
          const commentData = await projectService.getComments(slug);
          setComments(commentData.items || []);
        } catch {
          setComments([]);
        }

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

  const goToLogin = () => {
    navigate('/login', {
      state: {
        from: `/projects/${slug}`,
        message: 'Sign in to support project contributors.',
      },
    });
  };

  const handleStarToggle = async () => {
    if (!isAuthenticated) {
      goToLogin();
      return;
    }
    if (!project || isStarUpdating) return;
    setIsStarUpdating(true);
    try {
      const result = await projectService.toggleStar(project.slug);
      setProject((previous) => ({
        ...previous,
        is_starred: result.starred,
        stars_count: result.stars_count,
      }));
      showToast(result.message);
    } catch (err) {
      showToast(err.response?.data?.detail || 'Could not update your star.');
    } finally {
      setIsStarUpdating(false);
    }
  };

  const handleCommentSubmit = async (event) => {
    event.preventDefault();
    if (!isAuthenticated) {
      goToLogin();
      return;
    }
    const body = commentText.trim();
    if (body.length < 2 || isCommentSubmitting) return;
    setIsCommentSubmitting(true);
    try {
      const created = await projectService.addComment(project.slug, body);
      setComments((previous) => [...previous, created]);
      setCommentText('');
      showToast('Your comment was shared with the contributors.');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Could not post your comment.');
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  const handleCommentDelete = async (commentId) => {
    try {
      await projectService.deleteComment(project.slug, commentId);
      setComments((previous) => previous.filter((comment) => comment.id !== commentId));
      showToast('Comment deleted.');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Could not delete that comment.');
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

  const activeScreenshot = screenshots[activeScreenshotIdx] || null;
  const hasValidActiveScreenshot = Boolean(
    activeScreenshot?.image_url && !failedImages.has(activeScreenshot.image_url)
  );

  const hasValidZip = Boolean(
    project?.zip_storage_key ||
    (project?.zip_download_url &&
      (project.zip_download_url.includes('/download') ||
        project.zip_download_url.endsWith('.zip')))
  );

  const difficultyVariant =
    project?.difficulty === 'Beginner' ? 'approved' : project?.difficulty === 'Intermediate' ? 'published' : 'changesRequested';

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      <SEO
        title={project.title}
        description={project.short_description || `Explore ${project.title} on Student Career Platform.`}
        canonical={`/projects/${project.slug}`}
        ogType="article"
        ogImage={resolveMediaUrl(project.screenshots?.[0]?.image_url || project.cover_image_url) || undefined}
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

      {/* Standard Accessible Breadcrumb Navigation */}
      <Breadcrumbs
        items={[
          { label: 'Projects', path: '/projects' },
          { label: project.title },
        ]}
        backLink={{ label: 'Back to Discovery', path: '/projects' }}
      />

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Project Header Banner Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white via-white to-blue-50/40 border border-slate-200/80 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-sm mb-8">
          {/* Subtle decorative radial light */}
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-gradient-to-br from-blue-100/40 via-indigo-50/20 to-transparent blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-primary bg-blue-50/90 px-3 py-1 rounded-full border border-blue-200/70 shadow-xs">
                  {project.domain}
                </span>
                <Badge variant={difficultyVariant} size="sm">
                  {project.difficulty}
                </Badge>
                {project.status === 'Published' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Verified Project
                  </span>
                )}
              </div>

              <h1 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl text-slate-900 tracking-tight leading-tight">
                {project.title}
              </h1>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl font-normal">
                {project.short_description}
              </p>

              {/* Key Metrics Chips */}
              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-1.5 bg-slate-100/80 px-2.5 py-1 rounded-lg border border-slate-200/60">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Duration: {project.estimated_duration || '2-3 weeks'}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-100/80 px-2.5 py-1 rounded-lg border border-slate-200/60">
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>{project.views_count} views</span>
                </div>
                <div className="flex items-center gap-1.5 bg-amber-50/80 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-200/60">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                  <span className="font-semibold">{project.stars_count} stars</span>
                </div>
                <div className="flex items-center gap-1.5 bg-blue-50/80 text-blue-900 px-2.5 py-1 rounded-lg border border-blue-200/60">
                  <Bookmark className="w-3.5 h-3.5 text-brand-primary fill-brand-primary/20" />
                  <span className="font-semibold">{project.bookmarks_count} saved</span>
                </div>
              </div>
            </div>

            {/* Top Action CTAs */}
            <div className="flex flex-row lg:flex-col gap-2.5 shrink-0">
              {/* Star Button with Gold Accent */}
              <button
                type="button"
                onClick={handleStarToggle}
                disabled={isStarUpdating}
                className={`flex-1 lg:flex-initial inline-flex items-center justify-center font-semibold text-sm px-4 py-2.5 rounded-xl border transition-all duration-150 shadow-xs active:scale-[0.98] ${
                  project.is_starred
                    ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-amber-500/25 ring-2 ring-amber-400/30'
                    : 'bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-800 border-slate-300 hover:border-amber-400'
                }`}
              >
                <Star
                  className={`w-4 h-4 mr-2 shrink-0 ${
                    project.is_starred ? 'fill-white text-white' : 'text-amber-500 fill-amber-400/30'
                  }`}
                />
                <span className={project.is_starred ? 'text-white' : 'text-slate-800'}>
                  {isStarUpdating ? 'Updating...' : project.is_starred ? 'Starred' : 'Star this Project'}
                </span>
              </button>

              {/* Bookmark Button with Blue Accent */}
              <button
                type="button"
                onClick={handleBookmarkToggle}
                className={`flex-1 lg:flex-initial inline-flex items-center justify-center font-semibold text-sm px-4 py-2.5 rounded-xl border transition-all duration-150 shadow-xs active:scale-[0.98] ${
                  project.is_bookmarked
                    ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700 shadow-blue-500/25 ring-2 ring-blue-400/30'
                    : 'bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-800 border-slate-300 hover:border-blue-400'
                }`}
              >
                <Bookmark
                  className={`w-4 h-4 mr-2 shrink-0 ${
                    project.is_bookmarked ? 'fill-white text-white' : 'text-blue-600 fill-blue-500/20'
                  }`}
                />
                <span className={project.is_bookmarked ? 'text-white' : 'text-slate-800'}>
                  {project.is_bookmarked ? 'Saved to Bookmarks' : 'Bookmark Project'}
                </span>
              </button>

              {/* Resource & Link Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {hasValidZip && (
                  <a
                    href={project.zip_download_url}
                    download
                    className="flex-1 min-w-[130px]"
                  >
                    <Button variant="primary" size="md" leftIcon={Download} className="w-full justify-center shadow-xs">
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
                    <Button variant="secondary" size="md" rightIcon={ExternalLink} className="w-full justify-center shadow-xs">
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
                  className="w-10 h-10 rounded-xl border border-brand-border bg-white hover:bg-slate-50 text-slate-600 hover:text-brand-primary flex items-center justify-center transition-colors shrink-0 shadow-xs"
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
            {/* Visuals & Interactive Showcase */}
            <div className="bg-white border border-brand-border rounded-3xl p-6 sm:p-8 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-base text-brand-text flex items-center gap-2">
                  <Layers className="w-4 h-4 text-brand-primary" />
                  Project Visuals & Showcase
                </h3>
                {screenshots.length > 0 && hasValidActiveScreenshot && (
                  <span className="text-xs text-brand-muted">
                    {activeScreenshotIdx + 1} of {screenshots.length}
                  </span>
                )}
              </div>

              {/* Main Visual Display: Generative Canvas OR Valid Screenshot */}
              {hasValidActiveScreenshot ? (
                <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 aspect-video group">
                  <img
                    src={activeScreenshot?.image_url}
                    alt={activeScreenshot?.caption || project.title}
                    onError={() => handleImageError(activeScreenshot?.image_url)}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
                  />

                  {/* Caption Overlay */}
                  {activeScreenshot?.caption && (
                    <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent text-white text-xs sm:text-sm font-medium">
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
              ) : (
                /* High-tech dynamic canvas fallback */
                <ProjectHeroCanvas project={project} />
              )}

              {/* Thumbnail Strip (only for valid image collections) */}
              {screenshots.length > 1 && (
                <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                  {screenshots.map((s, idx) => {
                    const isBroken = failedImages.has(s.image_url);
                    if (isBroken) return null;
                    return (
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
                        <img
                          src={s.image_url}
                          alt=""
                          onError={() => handleImageError(s.image_url)}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

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
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-cyan text-white font-display font-bold text-xs flex items-center justify-center shrink-0 shadow-xs overflow-hidden relative">
                            {contributor.avatar_url && (
                              <img
                                src={contributor.avatar_url}
                                alt=""
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                                className="w-full h-full object-cover absolute inset-0"
                              />
                            )}
                            <span>{initials}</span>
                          </div>
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

            {/* Community appreciation and project discussion */}
            <div className="bg-white border border-brand-border rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display font-bold text-lg text-brand-text flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-brand-primary" />
                    Community Appreciation
                  </h2>
                  <p className="text-xs text-brand-muted mt-1">
                    Share constructive feedback or a compliment with the contributors.
                  </p>
                </div>
                <Badge variant="neutral" size="sm">
                  {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
                </Badge>
              </div>

              {isAuthenticated ? (
                <form onSubmit={handleCommentSubmit} className="space-y-3">
                  <label htmlFor="project-comment" className="sr-only">Add a project comment</label>
                  <textarea
                    id="project-comment"
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value.slice(0, 1000))}
                    placeholder="What did the contributors do well?"
                    rows={3}
                    maxLength={1000}
                    className="w-full resize-y rounded-2xl border border-brand-border bg-slate-50/60 px-4 py-3 text-sm text-brand-text placeholder:text-slate-400 outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
                  />
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-400">{commentText.length}/1000</span>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      leftIcon={Send}
                      disabled={commentText.trim().length < 2 || isCommentSubmitting}
                    >
                      {isCommentSubmitting ? 'Posting...' : 'Post Comment'}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="rounded-2xl border border-brand-border bg-slate-50 px-4 py-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-brand-muted">Sign in to star this work and leave a comment.</p>
                  <Button variant="outline" size="sm" onClick={goToLogin}>Sign In to Comment</Button>
                </div>
              )}

              <div className="space-y-3">
                {comments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-brand-border py-8 text-center">
                    <MessageCircle className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-600">No comments yet</p>
                    <p className="text-xs text-slate-400 mt-1">Be the first to recognize the contributors' work.</p>
                  </div>
                ) : comments.map((comment) => {
                  const initials = comment.author_name
                    .split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <article key={comment.id} className="rounded-2xl border border-brand-border bg-slate-50/50 p-4">
                      <div className="flex items-start gap-3">
                        {comment.author_avatar ? (
                          <img src={comment.author_avatar} alt="" className="w-9 h-9 rounded-xl object-cover shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-brand-primary text-white text-xs font-bold flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <span className="text-sm font-semibold text-brand-text">{comment.author_name}</span>
                              <span className="text-[11px] text-slate-400 ml-2">
                                {new Date(comment.created_at).toLocaleDateString(undefined, {
                                  year: 'numeric', month: 'short', day: 'numeric',
                                })}
                              </span>
                            </div>
                            {comment.can_delete && (
                              <button
                                type="button"
                                onClick={() => handleCommentDelete(comment.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Delete comment"
                                aria-label={`Delete comment by ${comment.author_name}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <p className="mt-1.5 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words">{comment.body}</p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
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
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-brand-primary text-white font-display font-bold text-base flex items-center justify-center shadow-md shrink-0 overflow-hidden relative">
                  {project.author_avatar && !authorAvatarFailed ? (
                    <img
                      src={project.author_avatar}
                      alt=""
                      onError={() => setAuthorAvatarFailed(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="tracking-wider">{authorInitials}</span>
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

              {hasValidZip ? (
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
