import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  ExternalLink,
  Compass,
  BrainCircuit,
  Calculator,
  Briefcase,
  FileText,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { announcementService } from '@/services/announcementService';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';

const ICON_OPTIONS = [
  { label: 'Sparkles (General)', value: 'Sparkles' },
  { label: 'Compass (Career / Roadmap)', value: 'Compass' },
  { label: 'Brain Circuit (AI / Assessment)', value: 'BrainCircuit' },
  { label: 'Calculator (Tools & Kit)', value: 'Calculator' },
  { label: 'Briefcase (Jobs & Internships)', value: 'Briefcase' },
  { label: 'File Text (Resumes & ATS)', value: 'FileText' },
];

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon_or_image: 'Sparkles',
    link_url: '',
    link_label: 'Explore Feature',
    status: 'PUBLISHED',
  });

  const fetchAnnouncements = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await announcementService.getAdminAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load announcements.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleOpenCreate = () => {
    setFormData({
      title: '',
      description: '',
      icon_or_image: 'Sparkles',
      link_url: '',
      link_label: 'Explore Feature',
      status: 'PUBLISHED',
    });
    setCreateModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setActiveItem(item);
    setFormData({
      title: item.title,
      description: item.description,
      icon_or_image: item.icon_or_image || 'Sparkles',
      link_url: item.link_url || '',
      link_label: item.link_label || 'Explore Feature',
      status: item.status || 'PUBLISHED',
    });
    setEditModalOpen(true);
  };

  const handleOpenDelete = (item) => {
    setActiveItem(item);
    setDeleteModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) return;

    setIsSubmitting(true);
    try {
      await announcementService.createAnnouncement(formData);
      setCreateModalOpen(false);
      await fetchAnnouncements(true);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create announcement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!activeItem || !formData.title.trim() || !formData.description.trim()) return;

    setIsSubmitting(true);
    try {
      await announcementService.updateAnnouncement(activeItem.id, formData);
      setEditModalOpen(false);
      await fetchAnnouncements(true);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update announcement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!activeItem) return;

    setIsSubmitting(true);
    try {
      await announcementService.deleteAnnouncement(activeItem.id);
      setDeleteModalOpen(false);
      await fetchAnnouncements(true);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete announcement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (item) => {
    const nextStatus = item.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      await announcementService.updateAnnouncement(item.id, { status: nextStatus });
      await fetchAnnouncements(true);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to toggle status.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Feature Announcements ("What's New")
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Publish new platform features and track student engagement across announcements.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAnnouncements(true)}
            isLoading={refreshing}
            leftIcon={RefreshCw}
          >
            Refresh
          </Button>
          <Button
            variant="gradient"
            size="sm"
            leftIcon={Plus}
            onClick={handleOpenCreate}
            className="font-bold shadow-md shadow-blue-500/20"
          >
            New Announcement
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && !loading && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-xs text-red-700">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchAnnouncements()}>
            Retry
          </Button>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            All Announcements ({announcements.length})
          </h2>
          <span className="text-xs text-slate-500">
            Active announcements automatically notify eligible students upon login.
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading announcements...</div>
        ) : announcements.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No announcements published yet.</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create an announcement to introduce newly launched features directly to users.
            </p>
            <Button variant="primary" size="sm" onClick={handleOpenCreate}>
              Create First Announcement
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {announcements.map((item) => (
              <div
                key={item.id}
                className="p-5 sm:p-6 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                        item.status === 'PUBLISHED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {item.status}
                    </span>

                    <span className="text-xs text-slate-400 font-medium">
                      Icon: <strong>{item.icon_or_image || 'Sparkles'}</strong>
                    </span>

                    {item.link_url && (
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 font-mono">
                        {item.link_url}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>

                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                    <span>
                      Explored by <strong>{item.seen_count ?? 0}</strong> students
                    </span>
                    <span>•</span>
                    <span>
                      Dismissed / Deferred: <strong>{item.dismissed_count ?? 0}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(item)}
                    className="text-xs"
                    leftIcon={item.status === 'PUBLISHED' ? EyeOff : Eye}
                  >
                    {item.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(item)}
                    leftIcon={Edit2}
                    className="text-xs"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDelete(item)}
                    leftIcon={Trash2}
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {(createModalOpen || editModalOpen) && (
        <Modal
          isOpen={createModalOpen || editModalOpen}
          onClose={() => {
            setCreateModalOpen(false);
            setEditModalOpen(false);
          }}
          title={createModalOpen ? 'New Feature Announcement' : 'Edit Feature Announcement'}
          description="Fill in feature details. Published announcements appear automatically upon student login."
        >
          <form onSubmit={createModalOpen ? handleCreateSubmit : handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Feature Title *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Career Discovery & Personalized Guidance"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Short Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Describe what the feature does and how it helps students..."
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Destination URL
                </label>
                <Input
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  placeholder="e.g. /career-discovery"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Button Label
                </label>
                <Input
                  value={formData.link_label}
                  onChange={(e) => setFormData({ ...formData, link_label: e.target.value })}
                  placeholder="e.g. Explore Feature"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Icon
                </label>
                <select
                  value={formData.icon_or_image}
                  onChange={(e) => setFormData({ ...formData, icon_or_image: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {ICON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Publication Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="PUBLISHED">PUBLISHED (Visible immediately)</option>
                  <option value="DRAFT">DRAFT (Hidden from users)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setCreateModalOpen(false);
                  setEditModalOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
              >
                {createModalOpen ? 'Create Announcement' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Delete Feature Announcement"
          description="Are you sure you want to permanently delete this announcement? This action cannot be undone."
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Announcement: <strong>{activeItem?.title}</strong>
            </p>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteConfirm}
                isLoading={isSubmitting}
              >
                Delete Announcement
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
