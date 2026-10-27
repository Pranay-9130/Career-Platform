import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  GraduationCap,
  Sparkles,
  Github,
  Linkedin,
  Globe,
  ShieldCheck,
  ExternalLink,
  Share2,
  FolderGit2,
  Check,
  Mail,
  ArrowLeft,
  Building,
  Calendar,
  Star,
  Eye,
  Code2,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { userService } from '@/services/userService';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import Skeleton from '@/components/common/Skeleton';
import Breadcrumbs from '@/components/common/Breadcrumbs';

export default function PublicProfilePage() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchPublicData() {
      if (!username) return;
      setLoading(true);
      setError(null);
      try {
        const data = await userService.getPublicProfile(username);
        setProfile(data);
      } catch (err) {
        console.error('Error fetching public portfolio:', err);
        setError(
          err.response?.status === 404
            ? 'Student profile not found.'
            : 'Unable to load profile portfolio. Please try again later.'
        );
      } finally {
        setLoading(false);
      }
    }

    fetchPublicData();
  }, [username]);

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `${profile?.full_name || 'Student'} — AspirePath Portfolio`,
        url: url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'ST';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // 404 / Error State
  if (!loading && error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-brand-primary flex items-center justify-center mx-auto">
          <FolderGit2 className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-extrabold text-brand-text">
            Profile Not Found
          </h1>
          <p className="text-sm text-brand-muted mt-2 max-w-md mx-auto">
            We couldn't find a student profile with the username{' '}
            <span className="font-mono font-semibold text-brand-text">@{username}</span>.
            The account may not exist or the link may have changed.
          </p>
        </div>
        <div className="flex justify-center gap-3">
          <Link to="/">
            <Button variant="outline" size="sm" leftIcon={ArrowLeft}>
              Back to Home
            </Button>
          </Link>
          <Link to="/projects">
            <Button variant="primary" size="sm">
              Explore Student Projects
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      {/* Standard Accessible Breadcrumb Navigation */}
      <Breadcrumbs
        items={[
          { label: 'Projects', path: '/projects' },
          { label: profile?.full_name ? `${profile.full_name}'s Portfolio` : `@${username}` },
        ]}
        backLink={{ label: 'Explore Projects', path: '/projects' }}
        actions={
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-brand-border rounded-xl shadow-xs hover:bg-slate-50 transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-brand-primary" /> Share Portfolio
              </>
            )}
          </button>
        }
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Header Profile Hero Card */}
      <div className="bg-white rounded-3xl border border-brand-border shadow-card p-6 sm:p-8 relative overflow-hidden">
        {/* Decorative background accent */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-blue-100/50 via-cyan-50/30 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar */}
            {loading ? (
              <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl" />
            ) : profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-brand-primary/20 shadow-xs"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-brand-primary to-brand-cyan text-white flex items-center justify-center font-display font-bold text-2xl sm:text-3xl shadow-sm">
                {getInitials(profile?.full_name)}
              </div>
            )}

            {/* Profile Info */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-brand-text">
                  {loading ? <Skeleton className="h-8 w-44" /> : profile?.full_name}
                </h1>
                {profile?.is_verified && (
                  <span
                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-brand-primary border border-brand-border"
                    title="Verified Student Identity"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verified</span>
                  </span>
                )}
              </div>

              <p className="text-sm font-medium text-slate-500">
                {loading ? (
                  <Skeleton className="h-4 w-60" />
                ) : (
                  profile?.headline || 'Aspiring Software Engineer'
                )}
              </p>

              {/* Academic Tags */}
              {(profile?.university || profile?.degree) && (
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-brand-muted">
                  {profile.university && (
                    <span className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      {profile.university}
                    </span>
                  )}
                  {profile.degree && (
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                      {profile.degree}
                    </span>
                  )}
                  {profile.graduation_year && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Class of {profile.graduation_year}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Social Links & Action Buttons */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 w-full md:w-auto">
            {/* Social Icons */}
            <div className="flex items-center gap-2">
              {profile?.github_url && (
                <a
                  href={profile.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl border border-brand-border hover:border-brand-primary/40 hover:bg-slate-50 text-slate-600 hover:text-brand-primary transition-all shadow-xs"
                  title="GitHub Profile"
                >
                  <Github className="w-4 h-4" />
                </a>
              )}
              {profile?.linkedin_url && (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl border border-brand-border hover:border-brand-primary/40 hover:bg-slate-50 text-slate-600 hover:text-brand-primary transition-all shadow-xs"
                  title="LinkedIn Profile"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              )}
              {profile?.portfolio_url && (
                <a
                  href={profile.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl border border-brand-border hover:border-brand-primary/40 hover:bg-slate-50 text-slate-600 hover:text-brand-primary transition-all shadow-xs"
                  title="Personal Portfolio"
                >
                  <Globe className="w-4 h-4" />
                </a>
              )}
            </div>

            {/* CTAs */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                leftIcon={copied ? Check : Share2}
                onClick={handleShare}
                className="flex-1 sm:flex-initial"
              >
                {copied ? 'Link Copied' : 'Share'}
              </Button>
              <Link
                to={`/contact?subject=Portfolio%20Inquiry%20for%20${encodeURIComponent(profile?.full_name || username)}`}
                className="flex-1 sm:flex-initial"
              >
                <Button variant="primary" size="sm" leftIcon={Mail} className="w-full">
                  Connect
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 1.5. Portfolio Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-brand-border p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Published Projects
          </span>
          <span className="text-xl sm:text-2xl font-display font-extrabold text-brand-text mt-1 block">
            {profile?.projects_count || profile?.projects?.length || 0}
          </span>
        </div>
        <div className="bg-white rounded-2xl border border-brand-border p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Community Stars
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
            <span className="text-xl sm:text-2xl font-display font-extrabold text-brand-text">
              {profile?.total_stars_count || 0}
            </span>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-brand-border p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Views
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <Eye className="w-4 h-4 text-brand-primary shrink-0" />
            <span className="text-xl sm:text-2xl font-display font-extrabold text-brand-text">
              {profile?.total_views_count || 0}
            </span>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-brand-border p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Skills Mastered
          </span>
          <span className="text-xl sm:text-2xl font-display font-extrabold text-brand-text mt-1 block">
            {profile?.skills?.length || 0}
          </span>
        </div>
      </div>

      {/* 2. Bio / About Section */}
      {profile?.bio && (
        <div className="bg-white rounded-2xl border border-brand-border shadow-card p-6 space-y-3">
          <h2 className="font-display font-bold text-base text-brand-text">
            About {profile.full_name?.split(' ')[0] || 'Student'}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
            {profile.bio}
          </p>
        </div>
      )}

      {/* 3. Skills Matrix */}
      {profile?.skills && profile.skills.length > 0 && (
        <div className="bg-white rounded-2xl border border-brand-border shadow-card p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-primary" />
            <h2 className="font-display font-bold text-base text-brand-text">
              Technical Skills & Proficiencies
            </h2>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {profile.skills.map((skill) => (
              <span
                key={skill}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-veryLight text-brand-primary border border-brand-border shadow-xs hover:border-blue-300 transition-colors"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 4. Showcased Projects Portfolio */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-brand-primary" />
            <h2 className="font-display font-bold text-lg text-brand-text">
              Showcased Projects
            </h2>
          </div>
          <span className="text-xs text-brand-muted font-medium">
            {profile?.projects?.length || 0} verified projects
          </span>
        </div>

        {profile?.projects?.length === 0 ? (
          <div className="bg-white rounded-2xl border border-brand-border p-8 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-brand-primary flex items-center justify-center mx-auto">
              <Code2 className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-base text-brand-text">
              No Showcased Projects Yet
            </h3>
            <p className="text-xs text-brand-muted max-w-sm mx-auto">
              Projects submitted and approved through moderation will be automatically featured on this verified student portfolio.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(profile?.projects || []).map((project, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-brand-border shadow-card p-5 hover:shadow-card-hover hover:border-brand-primary/40 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {project.slug ? (
                        <Link
                          to={`/projects/${project.slug}`}
                          className="font-display font-bold text-sm text-brand-text group-hover:text-brand-primary transition-colors block truncate"
                        >
                          {project.title}
                        </Link>
                      ) : (
                        <h3 className="font-display font-bold text-sm text-brand-text block truncate">
                          {project.title}
                        </h3>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <Badge variant="primary" size="sm">
                          {project.role || 'Lead Author'}
                        </Badge>
                        {project.domain && (
                          <Badge variant="neutral" size="sm">
                            {project.domain}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
                      {(project.stars_count !== undefined) && (
                        <span className="flex items-center gap-0.5" title="Stars">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span>{project.stars_count}</span>
                        </span>
                      )}
                      {(project.views_count !== undefined) && (
                        <span className="flex items-center gap-0.5" title="Views">
                          <Eye className="w-3.5 h-3.5" />
                          <span>{project.views_count}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-brand-muted mt-2.5 leading-relaxed line-clamp-3">
                    {project.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {project.tech_stack?.map((tech) => (
                      <span
                        key={tech}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  {project.slug ? (
                    <Link
                      to={`/projects/${project.slug}`}
                      className="inline-flex items-center gap-1 text-brand-primary font-bold hover:underline"
                    >
                      <span>View Project Specs</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <span className="text-slate-400">Platform Project</span>
                  )}

                  <div className="flex items-center gap-3">
                    {project.github_url && (
                      <a
                        href={project.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-slate-500 hover:text-brand-primary font-medium transition-colors"
                      >
                        <Github className="w-3.5 h-3.5" />
                        <span>Code</span>
                      </a>
                    )}
                    {project.demo_url && (
                      <a
                        href={project.demo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-600 font-bold hover:underline"
                      >
                        <span>Demo</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Promotion Footer Callout */}
      <div className="p-6 bg-slate-50 border border-brand-border rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div>
          <h4 className="text-sm font-bold text-brand-text">
            Are you a student developer?
          </h4>
          <p className="text-xs text-brand-muted mt-0.5">
            Build your verified portfolio, get ATS resume feedback, and connect with recruiters.
          </p>
        </div>
        <Link to="/register">
          <Button variant="primary" size="sm">
            Create Your Profile
          </Button>
        </Link>
      </div>
      </div>
    </div>
  );
}
