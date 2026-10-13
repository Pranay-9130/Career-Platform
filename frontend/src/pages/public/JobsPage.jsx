import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Briefcase,
  MapPin,
  Building2,
  DollarSign,
  Calendar,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  X,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import JobCard from '../../components/cards/JobCard';
import jobService from '../../services/jobService';
import SEO from '@/components/common/SEO';
import { getBreadcrumbListSchema } from '@/utils/seoSchemas';

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Facets
  const [facets, setFacets] = useState({
    domains: [],
    job_types: [],
    work_modes: [],
    experience_levels: [],
  });

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [domain, setDomain] = useState('All');
  const [jobType, setJobType] = useState('All');
  const [workMode, setWorkMode] = useState('All');
  const [experienceLevel, setExperienceLevel] = useState('All');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sort, setSort] = useState('newest');

  // Selected job for detail modal
  const [selectedJob, setSelectedJob] = useState(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch jobs
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await jobService.getJobs({
        search: debouncedSearch,
        domain: domain !== 'All' ? domain : undefined,
        job_type: jobType !== 'All' ? jobType : undefined,
        work_mode: workMode !== 'All' ? workMode : undefined,
        experience_level: experienceLevel !== 'All' ? experienceLevel : undefined,
        featured_only: featuredOnly ? true : undefined,
        sort,
        page,
        limit: 9,
      });

      setJobs(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
      if (data.facets) {
        setFacets(data.facets);
      }
    } catch (err) {
      console.error('Failed to fetch jobs catalog:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, domain, jobType, workMode, experienceLevel, featuredOnly, sort, page]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleResetFilters = () => {
    setSearch('');
    setDomain('All');
    setJobType('All');
    setWorkMode('All');
    setExperienceLevel('All');
    setFeaturedOnly(false);
    setSort('newest');
    setPage(1);
  };

  const hasActiveFilters =
    Boolean(search) ||
    domain !== 'All' ||
    jobType !== 'All' ||
    workMode !== 'All' ||
    experienceLevel !== 'All' ||
    featuredOnly;

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <SEO
        title="Curated Tech Jobs & Internships for Students"
        description="Discover junior developer jobs, tech internships, and entry-level engineering roles. Search by tech stack, remote flexibility, and category."
        canonical="/jobs"
        schema={getBreadcrumbListSchema([
          { name: "Home", path: "/" },
          { name: "Jobs & Internships", path: "/jobs" },
        ])}
      />
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="relative rounded-3xl bg-gradient-to-br from-brand-primary/10 via-sky-50 to-white border border-brand-border p-8 sm:p-12 overflow-hidden shadow-sm">
          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-brand-border text-xs font-semibold text-brand-primary backdrop-blur-sm shadow-xs mx-auto">
              <Sparkles className="w-3.5 h-3.5 text-brand-primary" />
              Verified Student Opportunities
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-slate-900 tracking-tight">
              Launch Your Career With Curated Tech Roles
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Browse vetted software engineering internships, junior developer jobs, and entry-level
              postings aligned with your projects and portfolio.
            </p>

            {/* Live Search Bar */}
            <div className="pt-2">
              <div className="relative max-w-2xl mx-auto flex items-center shadow-md rounded-2xl bg-white border border-brand-border overflow-hidden focus-within:ring-2 focus-within:ring-brand-primary/30 transition text-left">
                <Search className="w-5 h-5 text-slate-400 ml-4 shrink-0" />
                <input
                  type="text"
                  placeholder="Search by role title, company, technology (React, Python, AWS)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-3 py-3.5 text-sm bg-transparent focus:outline-none text-slate-800 placeholder:text-slate-400"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="p-1 mr-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Quick tags */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 text-xs text-slate-500">
                <span className="font-medium text-slate-400">Popular:</span>
                {['Remote', 'Frontend', 'Internship', 'AI / Machine Learning', 'Entry Level'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      if (tag === 'Remote') setWorkMode('Remote');
                      else if (tag === 'Internship') setJobType('Internship');
                      else if (tag === 'Entry Level') setExperienceLevel('Entry Level');
                      else setDomain(tag);
                    }}
                    className="px-2.5 py-1 rounded-full bg-white/70 border border-brand-border hover:bg-brand-primary/10 hover:text-brand-primary text-slate-600 text-[11px] font-medium transition"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Catalog Layout: Filter Controls + Listings */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 shrink-0 space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-card space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-brand-border">
                <div className="flex items-center gap-2 font-display font-bold text-slate-800 text-sm">
                  <Filter className="w-4 h-4 text-brand-primary" />
                  Filters & Facets
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={handleResetFilters}
                    className="text-xs text-brand-primary hover:underline font-medium"
                  >
                    Reset all
                  </button>
                )}
              </div>

              {/* Work Mode */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Work Mode
                </label>
                <div className="space-y-1">
                  {['All', 'Remote', 'Hybrid', 'Onsite'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setWorkMode(mode);
                        setPage(1);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                        workMode === mode
                          ? 'bg-brand-primary/10 text-brand-primary font-semibold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{mode}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Job Type */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Opportunity Type
                </label>
                <div className="space-y-1">
                  {['All', 'Internship', 'Full-time', 'Contract'].map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setJobType(type);
                        setPage(1);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                        jobType === type
                          ? 'bg-brand-primary/10 text-brand-primary font-semibold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{type}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Domain */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Domain / Category
                </label>
                <select
                  value={domain}
                  onChange={(e) => {
                    setDomain(e.target.value);
                    setPage(1);
                  }}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-brand-border rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                >
                  <option value="All">All Domains</option>
                  <option value="Frontend">Frontend Development</option>
                  <option value="Backend">Backend Development</option>
                  <option value="Full-Stack">Full-Stack Development</option>
                  <option value="AI / Machine Learning">AI / Machine Learning</option>
                  <option value="Cloud & DevOps">Cloud & DevOps</option>
                  <option value="Mobile Development">Mobile Development</option>
                </select>
              </div>

              {/* Experience Level */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Experience Level
                </label>
                <div className="space-y-1">
                  {['All', 'Internship', 'Entry Level'].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => {
                        setExperienceLevel(lvl);
                        setPage(1);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                        experienceLevel === lvl
                          ? 'bg-brand-primary/10 text-brand-primary font-semibold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{lvl}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Featured toggle */}
              <div className="pt-2 border-t border-brand-border">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={featuredOnly}
                    onChange={(e) => {
                      setFeaturedOnly(e.target.checked);
                      setPage(1);
                    }}
                    className="rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
                  />
                  <span>Show Featured only</span>
                </label>
              </div>
            </div>
          </aside>

          {/* Main Job Results Section */}
          <main className="flex-1 space-y-6">
            {/* Sorting & Result Count Bar */}
            <div className="bg-white p-4 rounded-2xl border border-brand-border shadow-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
              <div className="text-slate-600 font-medium">
                Showing <span className="font-bold text-slate-900">{total}</span> verified{' '}
                {total === 1 ? 'position' : 'positions'}
                {domain !== 'All' && ` in ${domain}`}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">Sort by:</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="p-1.5 bg-slate-50 border border-brand-border rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-brand-primary"
                >
                  <option value="newest">Featured & Newest</option>
                  <option value="title">Job Title (A-Z)</option>
                  <option value="company">Company Name (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Job Cards Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="p-5 bg-white rounded-2xl border border-brand-border shadow-card animate-pulse space-y-4 h-64"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-200 rounded-xl" />
                      <div className="space-y-2 flex-1">
                        <div className="h-3 bg-slate-200 rounded w-1/2" />
                        <div className="h-4 bg-slate-200 rounded w-3/4" />
                      </div>
                    </div>
                    <div className="h-4 bg-slate-200 rounded w-1/3" />
                    <div className="h-12 bg-slate-100 rounded" />
                    <div className="h-8 bg-slate-200 rounded mt-4" />
                  </div>
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-brand-border shadow-card p-12 text-center space-y-3">
                <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">No matching positions found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  We couldn't find any opportunities matching your specific filter criteria. Try
                  loosening filters or clearing search terms.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand-primary hover:bg-brand-primaryDark rounded-lg transition shadow-sm"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {jobs.map((job) => (
                  <JobCard
                    key={job.id}
                    {...job}
                    onSelect={() => setSelectedJob(job)}
                  />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-brand-border text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition"
                >
                  Previous
                </button>
                <span className="text-xs text-slate-500 font-medium px-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-brand-border text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition"
                >
                  Next
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Job Details Modal Drawer */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-brand-border overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-brand-border flex items-start justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white border border-brand-border flex items-center justify-center font-bold text-base text-brand-primary overflow-hidden shrink-0">
                  {selectedJob.company_logo_url ? (
                    <img
                      src={selectedJob.company_logo_url}
                      alt={selectedJob.company_name}
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    selectedJob.company_name?.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <span>{selectedJob.company_name}</span>
                    {selectedJob.is_featured && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-100 text-amber-800">
                        Featured
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold font-display text-slate-900">
                    {selectedJob.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {selectedJob.location}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-slate-800">
                      {selectedJob.stipend_or_salary}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedJob(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs text-slate-700">
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-1 rounded-full bg-brand-primary/10 text-brand-primary font-semibold text-[11px]">
                  {selectedJob.job_type}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium text-[11px]">
                  {selectedJob.work_mode}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-medium text-[11px]">
                  {selectedJob.experience_level}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium text-[11px]">
                  {selectedJob.domain}
                </span>
              </div>

              {/* Description */}
              {selectedJob.description && (
                <div>
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">
                    Role Overview
                  </h4>
                  <p className="text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-brand-border">
                    {selectedJob.description}
                  </p>
                </div>
              )}

              {/* Responsibilities */}
              {selectedJob.responsibilities && selectedJob.responsibilities.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2">
                    Key Responsibilities
                  </h4>
                  <ul className="space-y-1.5 list-disc list-inside text-slate-600">
                    {selectedJob.responsibilities.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Requirements */}
              {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2">
                    Qualifications & Requirements
                  </h4>
                  <ul className="space-y-1.5 list-disc list-inside text-slate-600">
                    {selectedJob.requirements.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Skills */}
              {selectedJob.skills_required && selectedJob.skills_required.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2">
                    Technologies & Skills
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedJob.skills_required.map((skill, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-md bg-white border border-brand-border text-slate-700 font-medium text-[11px]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-brand-border bg-slate-50 flex items-center justify-between">
              {selectedJob.company_website ? (
                <a
                  href={selectedJob.company_website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-brand-primary hover:underline inline-flex items-center gap-1 font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Company Website
                </a>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedJob(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/50 rounded-lg transition"
                >
                  Close
                </button>
                <a
                  href={selectedJob.apply_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2 text-xs font-semibold text-white bg-brand-primary hover:bg-brand-primaryDark shadow-sm rounded-lg transition inline-flex items-center gap-1.5"
                >
                  Apply Directly
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
