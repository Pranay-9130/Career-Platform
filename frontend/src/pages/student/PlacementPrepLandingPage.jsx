import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Search,
  ArrowRight,
  Sparkles,
  FileText,
  Layers,
  CheckCircle2,
  Terminal,
  Code,
  Layout,
  Server,
  BarChart3,
  CheckSquare,
  Cloud,
  Database,
  Cpu,
  Globe,
  ShieldAlert,
} from 'lucide-react';
import { placementPrepService } from '@/services/placementPrepService';
import { Spinner, Alert, Badge } from '@/components/common';

// Helper to render role icons dynamically
function RoleIcon({ name, className = 'w-6 h-6 text-brand-primary' }) {
  switch ((name || '').toLowerCase()) {
    case 'terminal':
      return <Terminal className={className} />;
    case 'code':
      return <Code className={className} />;
    case 'layout':
      return <Layout className={className} />;
    case 'server':
      return <Server className={className} />;
    case 'barchart3':
    case 'barchart':
    case 'chart':
      return <BarChart3 className={className} />;
    case 'checksquare':
    case 'check':
      return <CheckSquare className={className} />;
    case 'cloud':
      return <Cloud className={className} />;
    case 'database':
      return <Database className={className} />;
    case 'cpu':
      return <Cpu className={className} />;
    case 'globe':
      return <Globe className={className} />;
    default:
      return <BookOpen className={className} />;
  }
}

export default function PlacementPrepLandingPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await placementPrepService.getRoles();
      setRoles(data || []);
    } catch (err) {
      console.error('Failed to load placement preparation roles:', err);
      setError('Unable to load preparation roles. Please refresh or try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filteredRoles = useMemo(() => {
    if (!searchQuery.trim()) return roles;
    const term = searchQuery.toLowerCase().trim();
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(term) ||
        (r.description && r.description.toLowerCase().includes(term)) ||
        (r.topics && r.topics.some((t) => t.name.toLowerCase().includes(term)))
    );
  }, [roles, searchQuery]);

  const totalPublishedDocs = useMemo(() => {
    return roles.reduce((acc, r) => acc + (r.material_count || 0), 0);
  }, [roles]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Top Hero Section */}
      <div className="bg-white border-b border-brand-border/60 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Placement Preparation Library</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Placement Preparation Center
              </h1>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                Explore technical question banks and preparation materials designed for your target career role.
              </p>
            </div>

            {/* Quick Metrics Badge */}
            <div className="flex items-center gap-4 bg-blue-50/80 border border-blue-100 rounded-2xl p-4 shrink-0">
              <div className="w-12 h-12 rounded-xl bg-brand-primary text-white flex items-center justify-center shadow-sm">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900">
                  {loading ? '...' : totalPublishedDocs}
                </div>
                <div className="text-xs font-medium text-slate-500">
                  Published Study Guides
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="mt-8 relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by role (e.g. Python, Java, DevOps) or topic..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 rounded-xl text-sm text-slate-800 transition outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 px-2 py-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {error && (
          <Alert variant="danger" className="mb-6">
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <Spinner size="lg" />
            <p className="text-sm font-medium text-slate-500">Loading career preparation tracks...</p>
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto my-12 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No preparation tracks found</h3>
            <p className="text-sm text-slate-500 mb-6">
              We couldn't find any roles matching "{searchQuery}". Try searching for another role or keyword.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 bg-brand-primary text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition"
            >
              View All Tracks
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                Available Career Tracks ({filteredRoles.length})
              </div>
              <div className="text-xs text-slate-400">
                Updated weekly by industry administrators
              </div>
            </div>

            {/* Role Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRoles.map((role) => {
                const docCount = role.material_count || 0;
                const topicsCount = role.topics ? role.topics.length : 0;

                return (
                  <div
                    key={role.id}
                    className="group bg-white rounded-2xl border border-slate-200/90 hover:border-brand-primary/50 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center group-hover:bg-brand-primary/10 transition">
                          <RoleIcon name={role.icon_name} className="w-6 h-6 text-brand-primary" />
                        </div>

                        {/* Document Count Badge */}
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                            docCount > 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{docCount} {docCount === 1 ? 'PDF' : 'PDFs'}</span>
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-brand-primary transition mb-2">
                        {role.name}
                      </h3>

                      <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed mb-4">
                        {role.description || 'Curated technical preparation materials and interview question banks.'}
                      </p>

                      {/* Topic Highlights */}
                      {role.topics && role.topics.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {role.topics.slice(0, 3).map((topic) => (
                            <span
                              key={topic.id}
                              className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600"
                            >
                              {topic.name}
                            </span>
                          ))}
                          {role.topics.length > 3 && (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-brand-primary">
                              +{role.topics.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card Footer with CTA */}
                    <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">
                        {topicsCount} {topicsCount === 1 ? 'Topic Area' : 'Topic Areas'}
                      </span>
                      <Link
                        to={`/placement-preparation/${role.slug}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary group-hover:text-blue-700 group-hover:translate-x-0.5 transition"
                      >
                        <span>Explore Materials</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

