import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  Sparkles, 
  SearchX, 
  ArrowLeft, 
  ArrowRight,
  Layers,
  CheckCircle2,
  Bookmark
} from 'lucide-react';
import { Button, Select, Skeleton } from '@/components/common';
import ProjectCard from '@/components/cards/ProjectCard';
import ProjectFilterSidebar from '@/components/discovery/ProjectFilterSidebar';
import { projectService } from '@/services/projectService';
import { useAuth } from '@/context/AuthContext';
import SEO from '@/components/common/SEO';
import { getBreadcrumbListSchema } from '@/utils/seoSchemas';

const QUICK_DOMAINS = [
  'All',
  'Web Development',
  'AI / Machine Learning',
  'Mobile Development',
  'Cloud & DevOps',
  'Data Engineering',
  'Cyber Security',
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'stars', label: 'Highest Rated' },
  { value: 'bookmarks', label: 'Most Bookmarked' },
  { value: 'title', label: 'Title (A — Z)' },
];

export default function ProjectsPage() {
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state management
  const searchParam = searchParams.get('search') || '';
  const domainParam = searchParams.get('domain') || 'All';
  const difficultyParam = searchParams.get('difficulty') || 'All';
  const durationParam = searchParams.get('duration') || 'All';
  const techParam = searchParams.get('tech') ? searchParams.get('tech').split(',') : [];
  const sortParam = searchParams.get('sort') || 'newest';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  // Local filter states
  const [searchQuery, setSearchQuery] = useState(searchParam);
  const [selectedDomain, setSelectedDomain] = useState(domainParam);
  const [selectedDifficulty, setSelectedDifficulty] = useState(difficultyParam);
  const [selectedDuration, setSelectedDuration] = useState(durationParam);
  const [selectedTechs, setSelectedTechs] = useState(techParam);
  const [sortBy, setSortBy] = useState(sortParam);
  const [currentPage, setCurrentPage] = useState(pageParam);

  // API Data & Loading state
  const [projects, setProjects] = useState([]);
  const [totalProjects, setTotalProjects] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [facets, setFacets] = useState({ domains: [], difficulties: [], technologies: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  // Sync state to URL search parameters
  const updateUrlParams = useCallback((newFilters) => {
    const params = new URLSearchParams();
    if (newFilters.search) params.set('search', newFilters.search);
    if (newFilters.domain && newFilters.domain !== 'All') params.set('domain', newFilters.domain);
    if (newFilters.difficulty && newFilters.difficulty !== 'All') params.set('difficulty', newFilters.difficulty);
    if (newFilters.duration && newFilters.duration !== 'All') params.set('duration', newFilters.duration);
    if (newFilters.tech && newFilters.tech.length > 0) params.set('tech', newFilters.tech.join(','));
    if (newFilters.sort && newFilters.sort !== 'newest') params.set('sort', newFilters.sort);
    if (newFilters.page && newFilters.page > 1) params.set('page', newFilters.page.toString());
    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

  // Fetch project catalog from backend
  const fetchCatalog = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await projectService.getProjects({
        search: searchQuery.trim(),
        domain: selectedDomain,
        difficulty: selectedDifficulty,
        duration: selectedDuration,
        tech: selectedTechs.join(','),
        sort: sortBy,
        page: currentPage,
        limit: 9,
      });

      // Local storage bookmark synchronization for anonymous visitors
      let items = data.items || [];
      if (!isAuthenticated) {
        try {
          const localSaved = JSON.parse(localStorage.getItem('student_saved_projects') || '[]');
          items = items.map((item) => ({
            ...item,
            is_bookmarked: localSaved.includes(item.slug) || localSaved.includes(item.id),
          }));
        } catch (e) {
          // ignore
        }
      }

      setProjects(items);
      setTotalProjects(data.total || 0);
      setTotalPages(data.total_pages || 1);
      if (data.facets) {
        setFacets(data.facets);
      }
    } catch (err) {
      console.error('Failed to load project catalog:', err);
    } finally {
      setIsLoading(false);
    }
  }, [
    searchQuery,
    selectedDomain,
    selectedDifficulty,
    selectedDuration,
    selectedTechs,
    sortBy,
    currentPage,
    isAuthenticated,
  ]);

  // Initial and reactive fetch with search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCatalog();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchCatalog]);

  // Keep URL updated
  useEffect(() => {
    updateUrlParams({
      search: searchQuery.trim(),
      domain: selectedDomain,
      difficulty: selectedDifficulty,
      duration: selectedDuration,
      tech: selectedTechs,
      sort: sortBy,
      page: currentPage,
    });
  }, [searchQuery, selectedDomain, selectedDifficulty, selectedDuration, selectedTechs, sortBy, currentPage, updateUrlParams]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count += 1;
    if (selectedDomain !== 'All') count += 1;
    if (selectedDifficulty !== 'All') count += 1;
    if (selectedDuration !== 'All') count += 1;
    count += selectedTechs.length;
    return count;
  }, [searchQuery, selectedDomain, selectedDifficulty, selectedDuration, selectedTechs]);

  // Filter dispatchers
  const handleDomainChange = (domain) => {
    setSelectedDomain(domain);
    setCurrentPage(1);
  };

  const handleDifficultyChange = (difficulty) => {
    setSelectedDifficulty(difficulty);
    setCurrentPage(1);
  };

  const handleDurationChange = (duration) => {
    setSelectedDuration(duration);
    setCurrentPage(1);
  };

  const handleToggleTech = (tech) => {
    if (tech === '__CLEAR_ALL__') {
      setSelectedTechs([]);
    } else {
      setSelectedTechs((prev) =>
        prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]
      );
    }
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDomain('All');
    setSelectedDifficulty('All');
    setSelectedDuration('All');
    setSelectedTechs([]);
    setCurrentPage(1);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  // Bookmark toggle handler
  const handleBookmarkToggle = async (project, newSavedState) => {
    if (isAuthenticated) {
      try {
        const res = await projectService.toggleBookmark(project.slug);
        setProjects((prev) =>
          prev.map((p) =>
            p.id === project.id
              ? { ...p, is_bookmarked: res.bookmarked, bookmarks_count: res.bookmarks_count }
              : p
          )
        );
        showToast(res.message);
      } catch (err) {
        showToast('Failed to update bookmark. Please try again.');
      }
    } else {
      // Local fallback for guest students
      try {
        let localSaved = JSON.parse(localStorage.getItem('student_saved_projects') || '[]');
        if (newSavedState) {
          if (!localSaved.includes(project.slug)) localSaved.push(project.slug);
          showToast('Project saved to your browser! Sign in to sync across devices.');
        } else {
          localSaved = localSaved.filter((slug) => slug !== project.slug);
          showToast('Project removed from browser bookmarks.');
        }
        localStorage.setItem('student_saved_projects', JSON.stringify(localSaved));
        setProjects((prev) =>
          prev.map((p) =>
            p.id === project.id ? { ...p, is_bookmarked: newSavedState } : p
          )
        );
      } catch (e) {
        // ignore
      }
    }
  };

  const showToast = (message) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      <SEO
        title="Explore Student Projects & Open-Source Portfolios"
        description="Browse student-built capstone projects and production apps. Filter by tech stack, difficulty, and domain to find inspiration and collaborators."
        canonical="/projects"
        schema={getBreadcrumbListSchema([
          { name: "Home", path: "/" },
          { name: "Projects", path: "/projects" },
        ])}
      />
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-lg border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-brand-primary" />
          <span>{notification}</span>
        </div>
      )}

      {/* Hero Header Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/80 via-white to-slate-50/60 border-b border-brand-border py-14 lg:py-18">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-veryLight border border-brand-border text-brand-primary text-xs font-semibold uppercase tracking-wider mb-4 shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>50+ Production Project Blueprints</span>
            </div>

            {/* Headline */}
            <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-brand-text tracking-tight leading-tight">
              Build Real-World Projects That <span className="text-brand-primary">Get You Hired</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-4 text-base sm:text-lg text-brand-muted leading-relaxed">
              Explore step-by-step problem specs, battle-tested architectural guides, and complete starter kits designed for aspiring engineers.
            </p>

            {/* Search Input Bar */}
            <form onSubmit={handleSearchSubmit} className="mt-8 relative max-w-2xl mx-auto">
              <div className="relative flex items-center">
                <Search className="w-5 h-5 absolute left-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search by keywords, tech stack (e.g. FastAPI, React, Docker)..."
                  className="w-full pl-12 pr-12 py-3.5 text-sm rounded-2xl border border-brand-border bg-white text-brand-text shadow-sm focus:outline-hidden focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                    className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label="Clear search query"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>

            {/* Quick Domain Pills Beneath Search */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-slate-400 font-medium mr-1">Popular:</span>
              {QUICK_DOMAINS.map((domain) => {
                const isSelected = selectedDomain.toLowerCase() === domain.toLowerCase();
                return (
                  <button
                    key={domain}
                    type="button"
                    onClick={() => handleDomainChange(domain)}
                    className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                      isSelected
                        ? 'bg-brand-primary text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-brand-border hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {domain}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block w-72 shrink-0 bg-white border border-brand-border rounded-2xl p-5 shadow-xs sticky top-24">
            <ProjectFilterSidebar
              selectedDomain={selectedDomain}
              onSelectDomain={handleDomainChange}
              selectedDifficulty={selectedDifficulty}
              onSelectDifficulty={handleDifficultyChange}
              selectedDuration={selectedDuration}
              onSelectDuration={handleDurationChange}
              selectedTechs={selectedTechs}
              onToggleTech={handleToggleTech}
              onResetFilters={handleResetFilters}
              facets={facets}
              activeFilterCount={activeFilterCount}
            />
          </aside>

          {/* Right Main Discovery Column */}
          <main className="flex-1 min-w-0 w-full">
            {/* Top Discovery Controls Bar */}
            <div className="bg-white border border-brand-border rounded-2xl p-4 mb-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center justify-between sm:justify-start gap-3">
                {/* Mobile Filter Toggle Button */}
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={SlidersHorizontal}
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="lg:hidden text-xs py-1.5"
                >
                  Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
                </Button>

                {/* Results Count */}
                <div className="text-xs sm:text-sm text-brand-muted">
                  {isLoading ? (
                    <span>Searching catalog...</span>
                  ) : (
                    <span>
                      Showing <strong className="text-brand-text font-bold">{projects.length}</strong> of{' '}
                      <strong className="text-brand-text font-bold">{totalProjects}</strong> projects
                    </span>
                  )}
                </div>
              </div>

              {/* Sorting Selector & Submit Project */}
              <div className="flex items-center gap-3 self-end sm:self-auto">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-brand-muted shrink-0">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="text-xs font-medium py-1.5 px-3 rounded-lg border border-brand-border bg-slate-50 text-brand-text focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <Link to="/submission-guidelines">
                  <Button variant="primary" size="sm" className="text-xs shadow-xs">
                    Submit Project
                  </Button>
                </Link>
              </div>
            </div>

            {/* Active Filters Bar */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="text-xs text-brand-muted font-medium">Active filters:</span>

                {searchQuery.trim() && (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-blue-50 text-brand-primary border border-blue-200">
                    Query: "{searchQuery}"
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedDomain !== 'All' && (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-blue-50 text-brand-primary border border-blue-200">
                    {selectedDomain}
                    <button
                      type="button"
                      onClick={() => handleDomainChange('All')}
                      className="hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedDifficulty !== 'All' && (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-blue-50 text-brand-primary border border-blue-200">
                    {selectedDifficulty}
                    <button
                      type="button"
                      onClick={() => handleDifficultyChange('All')}
                      className="hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedDuration !== 'All' && (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-blue-50 text-brand-primary border border-blue-200">
                    {selectedDuration}
                    <button
                      type="button"
                      onClick={() => handleDurationChange('All')}
                      className="hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedTechs.map((tech) => (
                  <span
                    key={tech}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-blue-50 text-brand-primary border border-blue-200"
                  >
                    {tech}
                    <button
                      type="button"
                      onClick={() => handleToggleTech(tech)}
                      className="hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs text-brand-primary hover:underline font-semibold ml-1"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Projects Grid or Empty/Loading State */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-brand-border p-6 space-y-4 shadow-xs"
                  >
                    <Skeleton className="h-40 w-full rounded-xl" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-12 w-full" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="bg-white border border-brand-border rounded-2xl p-12 text-center shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-4">
                  <SearchX className="w-8 h-8" />
                </div>
                <h3 className="font-display font-bold text-lg text-brand-text">
                  No projects match your filter criteria
                </h3>
                <p className="mt-2 text-sm text-brand-muted max-w-md mx-auto">
                  We couldn't find any published projects with the selected combination of technologies, difficulty, or search terms.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <Button variant="primary" onClick={handleResetFilters}>
                    Clear All Filters
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    id={project.id}
                    slug={project.slug}
                    title={project.title}
                    domain={project.domain}
                    description={project.short_description}
                    technologies={project.tech_stack}
                    authorName={project.author_name}
                    authorAvatar={project.author_avatar}
                    difficulty={project.difficulty}
                    duration={project.estimated_duration}
                    stars={project.stars_count}
                    views_count={project.views_count}
                    coverImage={project.cover_image_url}
                    isSaved={project.is_bookmarked}
                    onSave={(newSaved) => handleBookmarkToggle(project, newSaved)}
                  />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {!isLoading && totalPages > 1 && (
              <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-brand-border">
                <div className="text-xs text-brand-muted">
                  Showing page <strong className="text-brand-text">{currentPage}</strong> of{' '}
                  <strong className="text-brand-text">{totalPages}</strong>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    leftIcon={ArrowLeft}
                    className="text-xs"
                  >
                    Previous
                  </Button>

                  {[...Array(totalPages)].map((_, idx) => {
                    const pageNum = idx + 1;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-brand-primary text-white font-bold'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    rightIcon={ArrowRight}
                    className="text-xs"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filters Slide-Over Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileFilterOpen(false)}
          />

          {/* Drawer content */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-sm bg-white shadow-xl overflow-y-auto">
              <ProjectFilterSidebar
                selectedDomain={selectedDomain}
                onSelectDomain={handleDomainChange}
                selectedDifficulty={selectedDifficulty}
                onSelectDifficulty={handleDifficultyChange}
                selectedDuration={selectedDuration}
                onSelectDuration={handleDurationChange}
                selectedTechs={selectedTechs}
                onToggleTech={handleToggleTech}
                onResetFilters={handleResetFilters}
                facets={facets}
                activeFilterCount={activeFilterCount}
                isMobileDrawer={true}
                onCloseMobileDrawer={() => setIsMobileFilterOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
