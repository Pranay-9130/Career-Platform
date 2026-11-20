import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  FileText,
  Download,
  Search,
  BookOpen,
  Calendar,
  HardDrive,
  Layers,
  Sparkles,
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
  CheckCircle2,
} from 'lucide-react';
import { placementPrepService } from '@/services/placementPrepService';
import { Spinner, Alert, Badge, Button } from '@/components/common';

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

export default function PlacementPrepRolePage() {
  const { roleSlug } = useParams();
  const navigate = useNavigate();

  const [role, setRole] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedTopicId, setSelectedTopicId] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Download feedback states
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadError, setDownloadError] = useState(null);
  const [downloadSuccess, setDownloadSuccess] = useState(null);

  const loadRoleAndMaterials = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const roleData = await placementPrepService.getRoleBySlug(roleSlug);
      setRole(roleData);

      const materialsData = await placementPrepService.getRoleMaterials(roleSlug);
      setMaterials(materialsData || []);
    } catch (err) {
      console.error('Failed to load role materials:', err);
      setError('Could not load technical materials for this role. It may have been deactivated or renamed.');
    } finally {
      setLoading(false);
    }
  }, [roleSlug]);

  useEffect(() => {
    loadRoleAndMaterials();
  }, [loadRoleAndMaterials]);

  // Auto-dismiss success notification
  useEffect(() => {
    if (downloadSuccess) {
      const timer = setTimeout(() => setDownloadSuccess(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [downloadSuccess]);

  const handleDownload = async (material) => {
    try {
      setDownloadingId(material.id);
      setDownloadError(null);
      setDownloadSuccess(null);
      await placementPrepService.downloadMaterial(material.id, material.file_name);
      // Optimistically update local download count only upon confirmed download completion
      setMaterials((prev) =>
        prev.map((m) => (m.id === material.id ? { ...m, download_count: (m.download_count || 0) + 1 } : m))
      );
      setDownloadSuccess(`Successfully downloaded "${material.file_name}". Check your browser downloads.`);
    } catch (err) {
      console.error('Download failed:', err);
      setDownloadError(err.message || `Failed to download ${material.title}. Please try again.`);
    } finally {
      setDownloadingId(null);
    }
  };

  // Filter materials by topic and search term
  const filteredMaterials = useMemo(() => {
    let result = materials;
    if (selectedTopicId !== 'ALL') {
      result = result.filter((m) => m.topic_id === selectedTopicId);
    }
    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(term) ||
          (m.description && m.description.toLowerCase().includes(term)) ||
          (m.topic_name && m.topic_name.toLowerCase().includes(term))
      );
    }
    return result;
  }, [materials, selectedTopicId, searchQuery]);

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recently';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Top Header / Breadcrumbs */}
      <div className="bg-white border-b border-brand-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            to="/placement-preparation"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:text-blue-700 transition mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to All Preparation Roles</span>
          </Link>

          {role && (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                  <RoleIcon name={role.icon_name} className="w-7 h-7 text-brand-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                      {role.name}
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                      Placement Track
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
                    {role.description}
                  </p>
                </div>
              </div>

              {/* Stats Card */}
              <div className="flex items-center gap-6 bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 shrink-0">
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-900">
                    {materials.length}
                  </div>
                  <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                    Published Guides
                  </div>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-900">
                    {role.topics ? role.topics.length : 0}
                  </div>
                  <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                    Topics
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {error ? (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        ) : loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
            <Spinner size="lg" />
            <p className="text-sm font-medium text-slate-500">Loading technical materials...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Topic Filter Tabs & Search Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Topic Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                <button
                  onClick={() => setSelectedTopicId('ALL')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                    selectedTopicId === 'ALL'
                      ? 'bg-brand-primary text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  All Topics ({materials.length})
                </button>

                {role?.topics?.map((topic) => {
                  const topicCount = materials.filter((m) => m.topic_id === topic.id).length;
                  const isActive = selectedTopicId === topic.id;
                  return (
                    <button
                      key={topic.id}
                      onClick={() => setSelectedTopicId(topic.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition shrink-0 flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-brand-primary text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      <span>{topic.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {topicCount}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[280px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter documents in this track..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 rounded-xl text-xs text-slate-800 outline-none transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400 hover:text-slate-600 px-1"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Success banner when download finishes */}
            {downloadSuccess && (
              <div className="mb-6 animate-in fade-in">
                <Alert variant="success" dismissible onDismiss={() => setDownloadSuccess(null)}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-medium text-emerald-900">{downloadSuccess}</span>
                  </div>
                </Alert>
              </div>
            )}

            {/* Error banner if download fails */}
            {downloadError && (
              <div className="mb-6 animate-in fade-in">
                <Alert variant="error" dismissible onDismiss={() => setDownloadError(null)}>
                  <span className="font-medium">{downloadError}</span>
                </Alert>
              </div>
            )}

            {/* Materials List / Cards */}
            {filteredMaterials.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto my-12 shadow-xs">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">No documents found</h3>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  {searchQuery
                    ? `No materials matched "${searchQuery}". Try a different search keyword.`
                    : 'No published PDF documents in this topic area yet. Check back soon as administrators update materials regularly.'}
                </p>
                {(searchQuery || selectedTopicId !== 'ALL') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedTopicId('ALL');
                    }}
                    className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-xl hover:bg-blue-600 shadow-xs transition"
                  >
                    Show All Role Materials
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMaterials.map((material) => (
                  <div
                    key={material.id}
                    className="bg-white rounded-2xl border border-slate-200/90 hover:border-brand-primary/60 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
                  >
                    <div className="p-6">
                      {/* Top Badges */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-100/80 flex flex-col items-center justify-center text-red-600 font-extrabold text-[11px] shadow-2xs shrink-0">
                          <span>PDF</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          {material.topic_name && (
                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-brand-primary border border-blue-100">
                              {material.topic_name}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>Verified Guide</span>
                          </span>
                        </div>
                      </div>

                      {/* Complete Title - never clipped */}
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5 leading-snug break-words">
                        {material.title}
                      </h3>

                      {/* Monospace file label */}
                      <div
                        className="text-[11px] font-mono text-slate-400 mb-3 truncate flex items-center gap-1"
                        title={material.file_name}
                      >
                        <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{material.file_name}</span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-5">
                        {material.description || 'Comprehensive technical question banks, interview frameworks, and domain preparation notes.'}
                      </p>

                      {/* File Metadata Badges */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-500 pt-3.5 border-t border-slate-100">
                        <span className="inline-flex items-center gap-1.5 text-slate-600">
                          <HardDrive className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold">{material.file_size_formatted || '510 KB'}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-slate-600">
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{material.page_count} {material.page_count === 1 ? 'page' : 'pages'}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{formatDate(material.created_at)}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-slate-500">
                          <Download className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{material.download_count || 0} downloads</span>
                        </span>
                      </div>
                    </div>

                    {/* Prominent Action Button */}
                    <div className="p-4 bg-slate-50/80 border-t border-slate-100">
                      <button
                        onClick={() => handleDownload(material)}
                        disabled={downloadingId === material.id}
                        className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-brand-primary hover:bg-blue-600 active:scale-[0.98] text-white shadow-xs transition-all disabled:opacity-75 disabled:cursor-wait group-hover:bg-blue-600"
                      >
                        {downloadingId === material.id ? (
                          <>
                            <Spinner size="sm" className="border-white" />
                            <span>Downloading PDF Guide...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 text-white" />
                            <span>Download PDF Guide</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

