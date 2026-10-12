import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderGit2,
  FileText,
  Sparkles,
  Send,
  ArrowRight,
  PlusCircle,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldAlert,
  Compass,
  RefreshCw,
  TrendingUp,
  Award,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { dashboardService } from '@/services/dashboardService';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import Skeleton from '@/components/common/Skeleton';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [recFilter, setRecFilter] = useState('all'); // 'all' | 'project' | 'job'

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const summary = await dashboardService.getSummary();
      setData(summary);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
      setError(
        err.response?.data?.detail ||
          'Unable to load dashboard summary right now. Please refresh.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Greeting helper based on local time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Relative time helper
  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    try {
      const date = new Date(timestamp);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 5) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  const displayName = data?.user?.full_name || user?.full_name || 'Student';
  const isVerified = data?.user?.is_verified ?? user?.is_verified ?? false;

  const filteredRecommendations = (data?.recommended_opportunities || []).filter(
    (item) => recFilter === 'all' || item.category === recFilter
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* 1. Header Greeting & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-brand-text tracking-tight flex items-center gap-2">
            <span>{getGreeting()}, {displayName.split(' ')[0]}</span>
            <span className="inline-block animate-wave origin-[70%_70%]">👋</span>
          </h1>
          <p className="text-sm text-brand-muted mt-1">
            Track your verified showcase projects, optimize resume score, and unlock internships.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDashboardData(true)}
            isLoading={refreshing}
            leftIcon={RefreshCw}
          >
            Refresh
          </Button>
          <Link to="/my-projects">
            <Button variant="primary" size="sm" leftIcon={PlusCircle}>
              Add Project
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Unverified Email Warning Callout */}
      {!isVerified && (
        <div className="p-4 sm:p-5 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                Action Required: Verify Your Student Email
              </h3>
              <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                Your email is unverified. Complete 6-digit OTP verification to unlock project review publishing, ATS recommendations, and recruiter outreach.
              </p>
            </div>
          </div>
          <Link to="/verify-otp" className="shrink-0">
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white border-none shadow-sm w-full sm:w-auto"
              rightIcon={ArrowRight}
            >
              Verify Now
            </Button>
          </Link>
        </div>
      )}

      {/* 3. Error Fallback state */}
      {error && !loading && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-xs text-red-700">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchDashboardData()}>
            Retry
          </Button>
        </div>
      )}

      {/* 4. Top KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: My Projects */}
        <Link
          to="/my-projects"
          className="group p-5 bg-white rounded-card border border-brand-border shadow-card hover:shadow-card-hover hover:border-brand-primary/40 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">
                My Projects
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <FolderGit2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-extrabold font-display text-brand-text">
                  {data?.stats?.projects_count ?? 0}
                </div>
              )}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-brand-muted">
            <span>
              {loading
                ? 'Loading...'
                : `${data?.stats?.projects_under_review ?? 0} in review • ${data?.stats?.projects_draft ?? 0} drafts`}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
          </div>
        </Link>

        {/* Metric 2: Resume Status */}
        <Link
          to="/resume-builder"
          className="group p-5 bg-white rounded-card border border-brand-border shadow-card hover:shadow-card-hover hover:border-brand-primary/40 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">
                Resume Status
              </span>
              <div className="w-9 h-9 rounded-xl bg-cyan-50 text-brand-cyan flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold font-display text-brand-text">
                    {data?.has_resume ? `${data?.stats?.resume_completion_percentage ?? 0}%` : '0%'}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    {data?.has_resume ? 'completed' : 'no resume'}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-1.5">
              <div
                className="bg-brand-cyan h-full rounded-full transition-all duration-500"
                style={{
                  width: `${loading ? 0 : data?.has_resume ? (data?.stats?.resume_completion_percentage ?? 0) : 0}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-brand-muted">
              <span className="truncate max-w-[150px]">
                {data?.has_resume ? (data?.latest_resume_title || 'Active Resume') : 'Build first ATS resume'}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand-cyan group-hover:translate-x-1 transition-all shrink-0" />
            </div>
          </div>
        </Link>

        {/* Metric 3: ATS Score */}
        <Link
          to="/ats-analyzer"
          className="group p-5 bg-white rounded-card border border-brand-border shadow-card hover:shadow-card-hover hover:border-brand-primary/40 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">
                ATS Score
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold font-display text-brand-text">
                    {data?.stats?.ats_score ? `${data.stats.ats_score}` : '--'}
                  </span>
                  {data?.stats?.ats_score && (
                    <span className="text-xs font-medium text-slate-400">/ 100</span>
                  )}
                  {data?.stats?.ats_score ? (
                    <Badge variant="approved" size="sm" className="ml-auto">
                      Analyzed
                    </Badge>
                  ) : (
                    <Badge variant="neutral" size="sm" className="ml-auto">
                      Scan Needed
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-brand-muted">
            <span>
              {data?.stats?.ats_score ? 'Latest scanned match' : 'Upload CV for check'}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
          </div>
        </Link>

        {/* Metric 4: Applications */}
        <Link
          to="/applications"
          className="group p-5 bg-white rounded-card border border-brand-border shadow-card hover:shadow-card-hover hover:border-brand-primary/40 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">
                Applications
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Send className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-extrabold font-display text-brand-text">
                  {data?.stats?.active_applications_count ?? 0}
                </div>
              )}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-brand-muted">
            <span>
              {loading
                ? 'Loading...'
                : `${data?.stats?.interviews_scheduled_count ?? 0} active interviews`}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      </div>

      {/* 5. Career Readiness Progress Meter Banner */}
      <div className="p-6 bg-gradient-to-r from-blue-900 via-brand-primary to-blue-700 rounded-3xl text-white shadow-md relative overflow-hidden">
        {/* Subtle background decorative shapes */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-cyan-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[11px] font-bold text-white tracking-wide uppercase">
                {loading ? 'Calculating...' : data?.readiness_stage || 'Stage 2: Skill Builder'}
              </span>
              <span className="text-xs text-blue-100 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-cyan-300" /> Career Readiness Track
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold font-display tracking-tight text-white">
              {loading ? (
                'Assessing profile strength...'
              ) : (
                <span>Profile Strength: <span className="text-cyan-300">{data?.readiness_score || 55}%</span> Ready for Job Market</span>
              )}
            </h2>

            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              {loading
                ? 'Gathering achievements and milestone metrics...'
                : data?.next_milestone ||
                  'Showcase your first practical project to reach Stage 3: Verified Creator.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
            <div className="w-full sm:w-64 bg-blue-950/40 p-3 rounded-2xl border border-white/10 backdrop-blur-sm">
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-blue-200">Readiness Score</span>
                <span className="text-cyan-300 font-bold">{data?.readiness_score || 55}%</span>
              </div>
              <div className="w-full bg-blue-950/80 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-400 to-blue-200 h-full rounded-full transition-all duration-700"
                  style={{ width: `${data?.readiness_score || 55}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Link to="/resume-builder" className="flex-1 sm:flex-initial">
                <Button
                  size="sm"
                  className="bg-white text-brand-primary hover:bg-blue-50 border-none font-semibold shadow-sm w-full"
                >
                  Boost Score
                </Button>
              </Link>
              <Link to="/about" className="flex-1 sm:flex-initial">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/10 w-full"
                >
                  View Criteria
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Quick Action Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/my-projects"
          className="p-3.5 bg-white rounded-2xl border border-brand-border shadow-xs hover:border-brand-primary/40 hover:bg-blue-50/40 transition-all flex items-center gap-3 group"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <PlusCircle className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-brand-text truncate">Add Project</p>
            <p className="text-[11px] text-brand-muted truncate">Showcase code</p>
          </div>
        </Link>

        <Link
          to="/resume-builder"
          className="p-3.5 bg-white rounded-2xl border border-brand-border shadow-xs hover:border-brand-primary/40 hover:bg-blue-50/40 transition-all flex items-center gap-3 group"
        >
          <div className="w-8 h-8 rounded-xl bg-cyan-50 text-brand-cyan flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-brand-text truncate">Build Resume</p>
            <p className="text-[11px] text-brand-muted truncate">Modern templates</p>
          </div>
        </Link>

        <Link
          to="/ats-analyzer"
          className="p-3.5 bg-white rounded-2xl border border-brand-border shadow-xs hover:border-brand-primary/40 hover:bg-blue-50/40 transition-all flex items-center gap-3 group"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-brand-text truncate">Scan ATS</p>
            <p className="text-[11px] text-brand-muted truncate">Match job desc</p>
          </div>
        </Link>

        <Link
          to="/jobs"
          className="p-3.5 bg-white rounded-2xl border border-brand-border shadow-xs hover:border-brand-primary/40 hover:bg-blue-50/40 transition-all flex items-center gap-3 group"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Briefcase className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-brand-text truncate">Explore Jobs</p>
            <p className="text-[11px] text-brand-muted truncate">Internships & roles</p>
          </div>
        </Link>
      </div>

      {/* 7. Overview Breakdowns: Projects & Applications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Overview Card */}
        <div className="bg-white rounded-card border border-brand-border shadow-card p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-brand-primary flex items-center justify-center">
                  <FolderGit2 className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-base text-brand-text">Project Overview</h3>
              </div>
              <Link to="/my-projects" className="text-xs font-semibold text-brand-primary hover:underline flex items-center gap-1">
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <div className="p-3 bg-slate-50 rounded-xl text-center">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Total</span>
                <p className="text-xl font-extrabold text-brand-text mt-1">{data?.stats?.projects_count ?? 0}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl text-center">
                <span className="text-[11px] font-bold text-amber-700 uppercase">Drafts</span>
                <p className="text-xl font-extrabold text-amber-700 mt-1">{data?.stats?.projects_draft ?? 0}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl text-center">
                <span className="text-[11px] font-bold text-blue-700 uppercase">In Review</span>
                <p className="text-xl font-extrabold text-brand-primary mt-1">{data?.stats?.projects_under_review ?? 0}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl text-center">
                <span className="text-[11px] font-bold text-emerald-700 uppercase">Published</span>
                <p className="text-xl font-extrabold text-emerald-700 mt-1">{data?.stats?.projects_published ?? 0}</p>
              </div>
            </div>
          </div>

          {(data?.stats?.projects_count ?? 0) === 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-brand-muted">
              <span>No showcase projects created yet.</span>
              <Link to="/my-projects" className="text-brand-primary font-bold hover:underline">
                + Add Project
              </Link>
            </div>
          )}
        </div>

        {/* Applications Overview Card */}
        <div className="bg-white rounded-card border border-brand-border shadow-card p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-base text-brand-text">Applications Overview</h3>
              </div>
              <Link to="/applications" className="text-xs font-semibold text-brand-primary hover:underline flex items-center gap-1">
                <span>Tracker</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <div className="p-3 bg-slate-50 rounded-xl text-center">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Submitted</span>
                <p className="text-xl font-extrabold text-brand-text mt-1">{data?.stats?.active_applications_count ?? 0}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl text-center">
                <span className="text-[11px] font-bold text-sky-700 uppercase">In Review</span>
                <p className="text-xl font-extrabold text-sky-700 mt-1">{data?.stats?.applications_applied ?? 0}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl text-center">
                <span className="text-[11px] font-bold text-purple-700 uppercase">Interview</span>
                <p className="text-xl font-extrabold text-purple-700 mt-1">{data?.stats?.interviews_scheduled_count ?? 0}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl text-center">
                <span className="text-[11px] font-bold text-emerald-700 uppercase">Offers</span>
                <p className="text-xl font-extrabold text-emerald-700 mt-1">{data?.stats?.applications_offer ?? 0}</p>
              </div>
            </div>
          </div>

          {(data?.stats?.active_applications_count ?? 0) === 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-brand-muted">
              <span>No submitted applications in pipeline.</span>
              <Link to="/jobs" className="text-brand-primary font-bold hover:underline">
                Explore Open Jobs
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 8. Recently Applied Section */}
      <div className="bg-white rounded-card border border-brand-border shadow-card p-5 sm:p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-brand-text">Recently Applied</h3>
              <p className="text-xs text-brand-muted">Track your submitted job applications and status progression.</p>
            </div>
          </div>
          <Link
            to="/applications"
            className="text-xs font-semibold text-brand-primary hover:underline inline-flex items-center gap-1"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3.5 border border-slate-100 rounded-xl space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              ))}
            </div>
          ) : (data?.recent_applications || []).length === 0 ? (
            <div className="py-10 text-center rounded-2xl bg-slate-50/60 border border-dashed border-slate-200 p-6">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-slate-200 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Briefcase className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">You haven't applied to any jobs yet.</h4>
              <p className="text-xs text-brand-muted mt-1 max-w-sm mx-auto">
                Explore student internships, entry-level engineering roles, and apply to track your interviews here.
              </p>
              <div className="mt-4">
                <Link to="/jobs">
                  <Button size="sm" variant="primary" leftIcon={Briefcase}>
                    Explore Jobs
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="pb-2.5">Position / Role</th>
                    <th className="pb-2.5">Company</th>
                    <th className="pb-2.5">Location</th>
                    <th className="pb-2.5">Date Applied</th>
                    <th className="pb-2.5">Status</th>
                    <th className="pb-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(data?.recent_applications || []).map((app) => {
                    const getStatusBadge = (st) => {
                      switch (st) {
                        case 'Interviewing':
                          return <Badge variant="secondary">Interviewing</Badge>;
                        case 'Offer':
                          return <Badge variant="approved">Offer</Badge>;
                        case 'Rejected':
                          return <Badge variant="danger">Rejected</Badge>;
                        case 'Applied':
                        default:
                          return <Badge variant="neutral">Applied</Badge>;
                      }
                    };

                    return (
                      <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 font-bold text-brand-text">{app.position_title}</td>
                        <td className="py-3 text-slate-600 font-medium">{app.company_name}</td>
                        <td className="py-3 text-slate-500">{app.job_location || 'Remote'}</td>
                        <td className="py-3 text-slate-500">{formatRelativeTime(app.applied_date)}</td>
                        <td className="py-3">{getStatusBadge(app.status)}</td>
                        <td className="py-3 text-right">
                          <Link
                            to="/applications"
                            className="text-brand-primary font-semibold hover:underline inline-flex items-center gap-1"
                          >
                            <span>Details</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 9. Main Two-Column Layout: Activity Feed & Recommended Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Activity Timeline (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-card border border-brand-border shadow-card p-5 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-brand-primary flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="font-display font-bold text-base text-brand-text">
                Recent Activity
              </h3>
            </div>
            <span className="text-xs text-brand-muted font-medium">
              {(data?.recent_activity || []).length} events
            </span>
          </div>

          <div className="mt-4 flex-1">
            {loading ? (
              <div className="space-y-4 py-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (data?.recent_activity || []).length === 0 ? (
              <div className="py-12 text-center text-brand-muted">
                <Compass className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-medium">No recent activity yet.</p>
                <p className="text-[11px] mt-1 text-slate-400">
                  Actions you take on projects or applications will appear here.
                </p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-100">
                {(data?.recent_activity || []).map((activity) => {
                  const getCategoryStyles = (cat) => {
                    switch (cat) {
                      case 'account':
                        return {
                          dot: 'bg-blue-500 ring-blue-100',
                          badge: 'neutral',
                        };
                      case 'resume':
                        return {
                          dot: 'bg-cyan-500 ring-cyan-100',
                          badge: 'cyan',
                        };
                      case 'application':
                        return {
                          dot: 'bg-emerald-500 ring-emerald-100',
                          badge: 'approved',
                        };
                      case 'project':
                      default:
                        return {
                          dot: 'bg-brand-primary ring-blue-100',
                          badge: 'primary',
                        };
                    }
                  };

                  const styles = getCategoryStyles(activity.category);

                  return (
                    <div key={activity.id} className="relative group">
                      {/* Timeline dot */}
                      <span
                        className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full ring-4 ${styles.dot}`}
                      />

                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-brand-text">
                            {activity.action}
                          </span>
                          <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                            {activity.category}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {formatRelativeTime(activity.timestamp)}
                        </span>
                      </div>

                      <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                        {activity.title}
                      </p>

                      {activity.link && (
                        <Link
                          to={activity.link}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-primary hover:underline mt-1.5"
                        >
                          <span>View details</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recommended Opportunities (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-card border border-brand-border shadow-card p-5 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-cyan-50 text-brand-cyan flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="font-display font-bold text-base text-brand-text">
                Recommended For You
              </h3>
            </div>
            {/* Filter Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setRecFilter('all')}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  recFilter === 'all'
                    ? 'bg-white text-brand-primary shadow-xs'
                    : 'text-slate-500 hover:text-brand-text'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setRecFilter('project')}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  recFilter === 'project'
                    ? 'bg-white text-brand-primary shadow-xs'
                    : 'text-slate-500 hover:text-brand-text'
                }`}
              >
                Projects
              </button>
              <button
                type="button"
                onClick={() => setRecFilter('job')}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  recFilter === 'job'
                    ? 'bg-white text-brand-primary shadow-xs'
                    : 'text-slate-500 hover:text-brand-text'
                }`}
              >
                Jobs
              </button>
            </div>
          </div>

          <div className="mt-4 flex-1 space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-3.5 border border-slate-100 rounded-xl space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredRecommendations.length === 0 ? (
              <div className="py-12 text-center text-brand-muted">
                <p className="text-xs">No opportunities matching this filter.</p>
              </div>
            ) : (
              filteredRecommendations.map((item) => {
                const isJob = item.category === 'job';

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-brand-border bg-slate-50/50 hover:bg-white hover:border-brand-primary/40 hover:shadow-xs transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isJob
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-blue-50 text-brand-primary border border-blue-200'
                            }`}
                          >
                            {isJob ? 'Role' : 'Project Guide'}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500">
                            {item.organization}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-brand-primary bg-blue-50/70 px-1.5 py-0.5 rounded">
                          {item.tag}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-brand-text mt-2 group-hover:text-brand-primary transition-colors">
                        {item.title}
                      </h4>

                      <p className="text-[11px] text-brand-muted mt-0.5">
                        {item.domain} • {item.location}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        {isJob ? 'Verified employer' : 'Step-by-step mentor guide'}
                      </span>
                      <Link
                        to={item.link}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-primary hover:underline"
                      >
                        <span>{isJob ? 'View Role' : 'Explore'}</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <Link
              to={recFilter === 'job' ? '/jobs' : '/projects'}
              className="text-xs font-semibold text-brand-primary hover:underline inline-flex items-center gap-1"
            >
              <span>Explore all {recFilter === 'job' ? 'job postings' : 'projects'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
