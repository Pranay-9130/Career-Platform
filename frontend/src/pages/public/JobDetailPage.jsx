import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  Globe,
  ExternalLink,
  Briefcase,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Layers,
  Share2,
  Bookmark,
  Check,
} from 'lucide-react';
import jobService from '../../services/jobService';
import applicationService from '../../services/applicationService';
import { useAuth } from '../../context/AuthContext';
import { Breadcrumbs } from '@/components/common';
import SEO from '@/components/common/SEO';
import { getJobPostingSchema, getBreadcrumbListSchema } from '@/utils/seoSchemas';
import { formatSalary, formatDeadline } from '@/utils/jobHelpers';

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Application Tracking state
  const [tracking, setTracking] = useState(false);
  const [trackedSuccess, setTrackedSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    async function loadJob() {
      try {
        setLoading(true);
        setError(null);
        const data = await jobService.getJobById(id);
        setJob(data);
      } catch (err) {
        console.error('Failed to load job details:', err);
        setError('The requested job opportunity was not found or is no longer active.');
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      loadJob();
    }
  }, [id]);

  const handleTrackApplication = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/jobs/${id}` } });
      return;
    }
    try {
      setTracking(true);
      await applicationService.createApplication({
        job_id: job.id,
        company_name: job.company_name,
        position_title: job.title,
        job_location: job.location,
        work_mode: job.work_mode,
        salary_or_stipend: job.stipend_or_salary,
        job_url: job.apply_url,
        status: 'Applied',
      });
      setTrackedSuccess(true);
      window.dispatchEvent(new CustomEvent('workspace-counts-updated'));
    } catch (err) {
      console.error('Failed to track application:', err);
    } finally {
      setTracking(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen py-16 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-slate-200 rounded w-24" />
          <div className="h-48 bg-white rounded-3xl border border-brand-border p-8" />
          <div className="h-64 bg-white rounded-3xl border border-brand-border p-8" />
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen py-16 max-w-3xl mx-auto px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
          <Briefcase className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold font-display text-slate-900">Position Not Found</h2>
        <p className="mt-2 text-sm text-slate-500">{error || 'This job posting does not exist.'}</p>
        <Link
          to="/jobs"
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-brand-primary rounded-xl hover:bg-brand-primaryDark transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Jobs Catalog
        </Link>
      </div>
    );
  }

  const formattedSalary = formatSalary(job.stipend_or_salary);
  const deadlineInfo = formatDeadline(job.deadline);

  return (
    <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8">
      <SEO
        title={`${job.title} at ${job.company_name}`}
        description={job.description ? job.description.slice(0, 160) : `${job.title} position at ${job.company_name}. Apply now.`}
        canonical={`/jobs/${job.id}`}
        ogImage={job.company_logo_url || undefined}
        schema={[
          getJobPostingSchema(job),
          getBreadcrumbListSchema([
            { name: "Home", path: "/" },
            { name: "Jobs", path: "/jobs" },
            { name: `${job.title} at ${job.company_name}`, path: `/jobs/${job.id}` },
          ]),
        ]}
      />
      {/* Standard Accessible Breadcrumb Navigation */}
      <Breadcrumbs
        items={[
          { label: 'Jobs', path: '/jobs' },
          { label: `${job.title} at ${job.company_name}` },
        ]}
        backLink={{ label: 'Back to Jobs', path: '/jobs' }}
        actions={
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-brand-border rounded-xl shadow-xs hover:bg-slate-50 transition"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Link Copied!
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-brand-primary" /> Share Position
              </>
            )}
          </button>
        }
      />

      <div className="max-w-5xl mx-auto space-y-8 pt-6">

        {/* Hero Header Card */}
        <div className="bg-white rounded-3xl border border-brand-border shadow-card p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-brand-veryLight border border-brand-border flex items-center justify-center text-brand-primary font-bold text-xl overflow-hidden shrink-0 shadow-xs">
                {job.company_logo_url ? (
                  <img
                    src={job.company_logo_url}
                    alt={job.company_name}
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  job.company_name?.slice(0, 2).toUpperCase()
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-600">
                    {job.company_name}
                  </span>
                  {job.is_featured && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      Featured
                    </span>
                  )}
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="Verified employer" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900">
                  {job.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {job.location}
                  </span>
                  {formattedSalary && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {formattedSalary}
                      </span>
                    </>
                  )}
                  <span>•</span>
                  <span className={`flex items-center gap-1 ${deadlineInfo.isExpired ? 'text-rose-600 font-semibold' : 'text-slate-500'}`}>
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {deadlineInfo.text}
                  </span>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:items-end gap-2.5 shrink-0">
              <a
                href={job.apply_url}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-brand-primary hover:bg-brand-primaryDark shadow-sm rounded-xl transition text-center"
              >
                Apply on Official Site
                <ExternalLink className="w-4 h-4" />
              </a>

              {trackedSuccess ? (
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Tracked in your Pipeline!
                  <Link to="/applications" className="underline ml-1">
                    View
                  </Link>
                </div>
              ) : (
                <button
                  onClick={handleTrackApplication}
                  disabled={tracking}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  <Bookmark className="w-3.5 h-3.5 text-slate-500" />
                  {tracking ? 'Saving...' : 'Track in My Applications'}
                </button>
              )}
            </div>
          </div>

          {/* Badges Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-brand-border">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-primary/10 text-brand-primary">
              {job.job_type}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              {job.work_mode}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
              {job.experience_level}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
              {job.domain}
            </span>
            {job.company_website && (
              <a
                href={job.company_website}
                target="_blank"
                rel="noreferrer"
                className="ml-auto inline-flex items-center gap-1 text-xs text-brand-primary hover:underline font-medium"
              >
                <Globe className="w-3.5 h-3.5" /> Company Website
              </a>
            )}
          </div>
        </div>

        {/* Content Details Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Specification Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview */}
            <div className="bg-white rounded-3xl border border-brand-border shadow-card p-6 sm:p-8 space-y-4">
              <h2 className="text-base font-bold font-display text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-brand-primary" />
                Role Overview
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {job.description}
              </p>
            </div>

            {/* Responsibilities */}
            {job.responsibilities && job.responsibilities.length > 0 && (
              <div className="bg-white rounded-3xl border border-brand-border shadow-card p-6 sm:p-8 space-y-4">
                <h2 className="text-base font-bold font-display text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-brand-primary" />
                  Key Responsibilities
                </h2>
                <ul className="space-y-2.5 list-disc list-inside text-sm text-slate-600">
                  {job.responsibilities.map((resp, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {resp}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Qualifications / Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <div className="bg-white rounded-3xl border border-brand-border shadow-card p-6 sm:p-8 space-y-4">
                <h2 className="text-base font-bold font-display text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-primary" />
                  Candidate Qualifications & Requirements
                </h2>
                <ul className="space-y-2.5 list-disc list-inside text-sm text-slate-600">
                  {job.requirements.map((req, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar Info Column */}
          <div className="space-y-6">
            {/* Required Technologies */}
            <div className="bg-white rounded-3xl border border-brand-border shadow-card p-6 space-y-4">
              <h3 className="text-xs font-bold font-display text-slate-900 uppercase tracking-wider">
                Required Tech Stack & Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {(job.skills_required || []).map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-lg bg-slate-50 border border-brand-border text-xs font-medium text-slate-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Career Pipeline Card */}
            <div className="bg-gradient-to-br from-brand-primary/10 to-sky-50 rounded-3xl border border-brand-border p-6 space-y-3">
              <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                Student Career Tracker
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Add this position to your student application pipeline to monitor interview
                stages, set reminder dates, and keep recruiters' notes organized.
              </p>
              <button
                onClick={handleTrackApplication}
                disabled={tracking || trackedSuccess}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-brand-primary hover:bg-brand-primaryDark rounded-xl transition shadow-xs disabled:opacity-60"
              >
                {trackedSuccess ? '✓ Already Tracked' : 'Add to Application Pipeline'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
