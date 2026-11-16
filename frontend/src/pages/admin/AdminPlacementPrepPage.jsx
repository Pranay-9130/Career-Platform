import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BookOpen,
  Plus,
  Upload,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  Eye,
  Download,
  RefreshCw,
  FolderPlus,
  Layers,
  Sparkles,
  AlertCircle,
  HardDrive,
  Calendar,
  X,
  FileUp,
  Terminal,
  Code,
  Layout,
  Server,
  BarChart3,
  CheckSquare,
  Cloud,
} from 'lucide-react';
import { placementPrepService } from '@/services/placementPrepService';
import { Button, Badge, Modal, Input, Alert, Spinner } from '@/components/common';

export default function AdminPlacementPrepPage() {
  const [activeTab, setActiveTab] = useState('materials'); // 'materials' | 'roles'
  const [roles, setRoles] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters for materials table
  const [materialSearchQuery, setMaterialSearchQuery] = useState('');
  const [materialRoleFilter, setMaterialRoleFilter] = useState('all');
  const [materialPublishFilter, setMaterialPublishFilter] = useState('all');

  // Modals state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editMaterialModalOpen, setEditMaterialModalOpen] = useState(false);
  const [replacePdfModalOpen, setReplacePdfModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);

  // Active item selections for edit/delete
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'material'|'role'|'topic', item }

  // Upload Material Form state
  const [uploadRoleId, setUploadRoleId] = useState('');
  const [uploadTopicId, setUploadTopicId] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadIsPublished, setUploadIsPublished] = useState(true);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Edit Material Form state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTopicId, setEditTopicId] = useState('');
  const [editIsPublished, setEditIsPublished] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);

  // Replace PDF Form state
  const [replaceFile, setReplaceFile] = useState(null);
  const [replaceProgress, setReplaceProgress] = useState(0);
  const [replacing, setReplacing] = useState(false);
  const [replaceError, setReplaceError] = useState(null);

  // Role Form state
  const [roleName, setRoleName] = useState('');
  const [roleSlug, setRoleSlug] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [roleIcon, setRoleIcon] = useState('Terminal');
  const [roleIsActive, setRoleIsActive] = useState(true);
  const [roleDisplayOrder, setRoleDisplayOrder] = useState(0);
  const [savingRole, setSavingRole] = useState(false);
  const [roleError, setRoleError] = useState(null);

  // Topic Form state
  const [topicParentRoleId, setTopicParentRoleId] = useState('');
  const [topicName, setTopicName] = useState('');
  const [topicSlug, setTopicSlug] = useState('');
  const [topicDescription, setTopicDescription] = useState('');
  const [topicDisplayOrder, setTopicDisplayOrder] = useState(0);
  const [savingTopic, setSavingTopic] = useState(false);
  const [topicError, setTopicError] = useState(null);

  // Load initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [rolesData, materialsData] = await Promise.all([
        placementPrepService.adminGetRoles(),
        placementPrepService.adminGetMaterials(),
      ]);
      setRoles(rolesData || []);
      setMaterials(materialsData || []);
    } catch (err) {
      console.error('Failed to load placement preparation admin data:', err);
      setError('Failed to load admin data. Please check your admin privileges and refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      if (materialRoleFilter !== 'all' && m.role_id !== materialRoleFilter) return false;
      if (materialPublishFilter !== 'all') {
        const isPub = materialPublishFilter === 'published';
        if (m.is_published !== isPub) return false;
      }
      if (materialSearchQuery.trim()) {
        const q = materialSearchQuery.toLowerCase().trim();
        const matchTitle = m.title.toLowerCase().includes(q);
        const matchDesc = m.description && m.description.toLowerCase().includes(q);
        const matchRole = m.role_name && m.role_name.toLowerCase().includes(q);
        const matchTopic = m.topic_name && m.topic_name.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchRole && !matchTopic) return false;
      }
      return true;
    });
  }, [materials, materialRoleFilter, materialPublishFilter, materialSearchQuery]);

  // Selected role topics helper
  const uploadRoleTopics = useMemo(() => {
    if (!uploadRoleId) return [];
    const r = roles.find((item) => item.id === uploadRoleId);
    return r?.topics || [];
  }, [roles, uploadRoleId]);

  const editRoleTopics = useMemo(() => {
    if (!selectedMaterial?.role_id) return [];
    const r = roles.find((item) => item.id === selectedMaterial.role_id);
    return r?.topics || [];
  }, [roles, selectedMaterial]);

  // ---------------------------------------------------------------------------
  // UPLOAD MATERIAL HANDLERS
  // ---------------------------------------------------------------------------
  const openUploadModal = () => {
    setUploadRoleId(roles[0]?.id || '');
    setUploadTopicId('');
    setUploadTitle('');
    setUploadDescription('');
    setUploadIsPublished(true);
    setUploadFile(null);
    setUploadProgress(0);
    setUploadError(null);
    setUploadModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Invalid file type: Please select a valid PDF file (.pdf).');
      setUploadFile(null);
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setUploadError(`File too large: ${(file.size / (1024 * 1024)).toFixed(1)}MB exceeds the 25MB limit.`);
      setUploadFile(null);
      return;
    }
    setUploadError(null);
    setUploadFile(file);
    if (!uploadTitle.trim()) {
      // Auto-populate title from clean filename
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setUploadTitle(cleanName);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please select a PDF document to upload.');
      return;
    }
    if (!uploadRoleId) {
      setUploadError('Please select a target preparation role.');
      return;
    }
    if (!uploadTitle.trim()) {
      setUploadError('Please enter a title for the document.');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      setUploadProgress(5);

      const formData = new FormData();
      formData.append('role_id', uploadRoleId);
      if (uploadTopicId) formData.append('topic_id', uploadTopicId);
      formData.append('title', uploadTitle.trim());
      if (uploadDescription.trim()) formData.append('description', uploadDescription.trim());
      formData.append('is_published', uploadIsPublished ? 'true' : 'false');
      formData.append('file', uploadFile);

      const created = await placementPrepService.adminUploadMaterial(formData, (percent) => {
        setUploadProgress(percent);
      });

      setMaterials((prev) => [created, ...prev]);
      setSuccessMsg(`Document "${created.title}" uploaded successfully.`);
      setUploadModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchData(); // Refresh role counts
    } catch (err) {
      console.error('Upload failed:', err);
      setUploadError(err.response?.data?.detail || 'Failed to upload document. Please verify the file and try again.');
    } finally {
      setUploading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // EDIT MATERIAL HANDLERS
  // ---------------------------------------------------------------------------
  const openEditMaterial = (material) => {
    setSelectedMaterial(material);
    setEditTitle(material.title);
    setEditDescription(material.description || '');
    setEditTopicId(material.topic_id || '');
    setEditIsPublished(material.is_published);
    setEditMaterialModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMaterial) return;

    try {
      setSavingEdit(true);
      const updated = await placementPrepService.adminUpdateMaterial(selectedMaterial.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        topic_id: editTopicId || null,
        is_published: editIsPublished,
      });

      setMaterials((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setSuccessMsg(`Document "${updated.title}" updated.`);
      setEditMaterialModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Update failed:', err);
      alert(err.response?.data?.detail || 'Failed to update document.');
    } finally {
      setSavingEdit(false);
    }
  };

  // ---------------------------------------------------------------------------
  // REPLACE PDF FILE HANDLERS
  // ---------------------------------------------------------------------------
  const openReplacePdf = (material) => {
    setSelectedMaterial(material);
    setReplaceFile(null);
    setReplaceProgress(0);
    setReplaceError(null);
    setReplacePdfModalOpen(true);
  };

  const handleReplaceSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMaterial || !replaceFile) {
      setReplaceError('Please select a replacement PDF file.');
      return;
    }

    try {
      setReplacing(true);
      setReplaceError(null);
      const formData = new FormData();
      formData.append('file', replaceFile);

      const updated = await placementPrepService.adminReplaceMaterialPdf(selectedMaterial.id, formData, (percent) => {
        setReplaceProgress(percent);
      });

      setMaterials((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setSuccessMsg(`PDF file replaced successfully for "${updated.title}".`);
      setReplacePdfModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Replacement failed:', err);
      setReplaceError(err.response?.data?.detail || 'Failed to replace PDF file.');
    } finally {
      setReplacing(false);
    }
  };

  // ---------------------------------------------------------------------------
  // DOWNLOAD HANDLER
  // ---------------------------------------------------------------------------
  const handleDownload = async (material) => {
    try {
      await placementPrepService.downloadMaterial(material.id, material.file_name);
    } catch (err) {
      console.error('Download error:', err);
      alert('Unable to download PDF file.');
    }
  };

  // ---------------------------------------------------------------------------
  // ROLE HANDLERS
  // ---------------------------------------------------------------------------
  const openCreateRole = () => {
    setSelectedRole(null);
    setRoleName('');
    setRoleSlug('');
    setRoleDescription('');
    setRoleIcon('Terminal');
    setRoleIsActive(true);
    setRoleDisplayOrder(roles.length + 1);
    setRoleError(null);
    setRoleModalOpen(true);
  };

  const openEditRole = (role) => {
    setSelectedRole(role);
    setRoleName(role.name);
    setRoleSlug(role.slug);
    setRoleDescription(role.description || '');
    setRoleIcon(role.icon_name || 'Terminal');
    setRoleIsActive(role.is_active);
    setRoleDisplayOrder(role.display_order || 0);
    setRoleError(null);
    setRoleModalOpen(true);
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    if (!roleName.trim()) {
      setRoleError('Role name is required.');
      return;
    }

    try {
      setSavingRole(true);
      setRoleError(null);
      if (selectedRole) {
        const updated = await placementPrepService.adminUpdateRole(selectedRole.id, {
          name: roleName.trim(),
          slug: roleSlug.trim() || undefined,
          description: roleDescription.trim() || null,
          icon_name: roleIcon,
          is_active: roleIsActive,
          display_order: parseInt(roleDisplayOrder, 10) || 0,
        });
        setRoles((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        setSuccessMsg(`Role "${updated.name}" updated successfully.`);
      } else {
        const created = await placementPrepService.adminCreateRole({
          name: roleName.trim(),
          slug: roleSlug.trim() || undefined,
          description: roleDescription.trim() || null,
          icon_name: roleIcon,
          is_active: roleIsActive,
          display_order: parseInt(roleDisplayOrder, 10) || 0,
        });
        setRoles((prev) => [...prev, created]);
        setSuccessMsg(`Role "${created.name}" created successfully.`);
      }
      setRoleModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Role save failed:', err);
      setRoleError(err.response?.data?.detail || 'Failed to save role.');
    } finally {
      setSavingRole(false);
    }
  };

  // ---------------------------------------------------------------------------
  // TOPIC HANDLERS
  // ---------------------------------------------------------------------------
  const openCreateTopic = (role) => {
    setSelectedRole(role);
    setSelectedTopic(null);
    setTopicParentRoleId(role.id);
    setTopicName('');
    setTopicSlug('');
    setTopicDescription('');
    setTopicDisplayOrder((role.topics?.length || 0) + 1);
    setTopicError(null);
    setTopicModalOpen(true);
  };

  const openEditTopic = (role, topic) => {
    setSelectedRole(role);
    setSelectedTopic(topic);
    setTopicParentRoleId(role.id);
    setTopicName(topic.name);
    setTopicSlug(topic.slug);
    setTopicDescription(topic.description || '');
    setTopicDisplayOrder(topic.display_order || 0);
    setTopicError(null);
    setTopicModalOpen(true);
  };

  const handleTopicSubmit = async (e) => {
    e.preventDefault();
    if (!topicName.trim()) {
      setTopicError('Topic name is required.');
      return;
    }

    try {
      setSavingTopic(true);
      setTopicError(null);
      if (selectedTopic) {
        const updated = await placementPrepService.adminUpdateTopic(selectedTopic.id, {
          name: topicName.trim(),
          slug: topicSlug.trim() || undefined,
          description: topicDescription.trim() || null,
          display_order: parseInt(topicDisplayOrder, 10) || 0,
        });
        setRoles((prev) =>
          prev.map((r) => {
            if (r.id === selectedRole.id) {
              return {
                ...r,
                topics: r.topics.map((t) => (t.id === updated.id ? updated : t)),
              };
            }
            return r;
          })
        );
        setSuccessMsg(`Topic "${updated.name}" updated.`);
      } else {
        const created = await placementPrepService.adminCreateTopic(selectedRole.id, {
          name: topicName.trim(),
          slug: topicSlug.trim() || undefined,
          description: topicDescription.trim() || null,
          display_order: parseInt(topicDisplayOrder, 10) || 0,
        });
        setRoles((prev) =>
          prev.map((r) => {
            if (r.id === selectedRole.id) {
              return {
                ...r,
                topics: [...(r.topics || []), created],
              };
            }
            return r;
          })
        );
        setSuccessMsg(`Topic "${created.name}" created under ${selectedRole.name}.`);
      }
      setTopicModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Topic save failed:', err);
      setTopicError(err.response?.data?.detail || 'Failed to save topic.');
    } finally {
      setSavingTopic(false);
    }
  };

  // ---------------------------------------------------------------------------
  // DELETE HANDLERS
  // ---------------------------------------------------------------------------
  const confirmDelete = (type, item) => {
    setDeleteTarget({ type, item });
    setDeleteConfirmModalOpen(true);
  };

  const handleDeleteExecute = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'material') {
        await placementPrepService.adminDeleteMaterial(deleteTarget.item.id);
        setMaterials((prev) => prev.filter((m) => m.id !== deleteTarget.item.id));
        setSuccessMsg(`Document "${deleteTarget.item.title}" deleted.`);
      } else if (deleteTarget.type === 'role') {
        await placementPrepService.adminDeleteRole(deleteTarget.item.id);
        setRoles((prev) => prev.filter((r) => r.id !== deleteTarget.item.id));
        setMaterials((prev) => prev.filter((m) => m.role_id !== deleteTarget.item.id));
        setSuccessMsg(`Role "${deleteTarget.item.name}" deleted.`);
      } else if (deleteTarget.type === 'topic') {
        await placementPrepService.adminDeleteTopic(deleteTarget.item.id);
        setRoles((prev) =>
          prev.map((r) => ({
            ...r,
            topics: r.topics?.filter((t) => t.id !== deleteTarget.item.id) || [],
          }))
        );
        setSuccessMsg(`Topic "${deleteTarget.item.name}" deleted.`);
      }
      setDeleteConfirmModalOpen(false);
      setDeleteTarget(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Delete operation failed.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              Admin Console
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Placement Preparation Library Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage preparation roles, curriculum topics, and upload verified technical PDF materials.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={openUploadModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Upload className="w-4 h-4" />
            <span>Upload New PDF</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <Alert variant="success" className="animate-in fade-in">
          {successMsg}
        </Alert>
      )}

      {error && (
        <Alert variant="danger">
          {error}
        </Alert>
      )}

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('materials')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'materials'
              ? 'bg-brand-primary text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Uploaded PDF Materials ({materials.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'roles'
              ? 'bg-brand-primary text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Roles & Topics ({roles.length} Roles)</span>
        </button>
      </div>

      {/* TAB 1: MATERIALS MANAGEMENT */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={materialSearchQuery}
                onChange={(e) => setMaterialSearchQuery(e.target.value)}
                placeholder="Search materials by title, topic, or role..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-brand-primary focus:bg-white"
              />
            </div>

            <select
              value={materialRoleFilter}
              onChange={(e) => setMaterialRoleFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none"
            >
              <option value="all">All Roles</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>

            <select
              value={materialPublishFilter}
              onChange={(e) => setMaterialPublishFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft / Unpublished</option>
            </select>
          </div>

          {/* Materials Table */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3 bg-white rounded-xl border border-slate-200">
              <Spinner size="lg" />
              <p className="text-xs font-semibold text-slate-500">Loading uploaded materials...</p>
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-900 mb-1">No materials found</h3>
              <p className="text-xs text-slate-500 mb-4">
                {materials.length === 0
                  ? 'No preparation documents uploaded yet. Click "Upload New PDF" to add one.'
                  : 'No materials match the selected filters.'}
              </p>
              {materials.length === 0 && (
                <button
                  onClick={openUploadModal}
                  className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition"
                >
                  Upload First PDF
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-4">Title & Details</th>
                      <th className="py-3 px-4">Target Role & Topic</th>
                      <th className="py-3 px-4">File Info</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Downloads</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMaterials.map((mat) => (
                      <tr key={mat.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-bold text-slate-900 line-clamp-1">{mat.title}</div>
                          {mat.description && (
                            <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              {mat.description}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800">{mat.role_name}</span>
                          {mat.topic_name && (
                            <div className="text-[11px] text-brand-primary font-medium">
                              • {mat.topic_name}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                          <div className="font-medium text-[11px]">{mat.file_name}</div>
                          <div className="text-[10px] text-slate-400">
                            {mat.file_size_formatted} • {mat.page_count} {mat.page_count === 1 ? 'page' : 'pages'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {mat.is_published ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Published
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              Draft
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          {mat.download_count}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleDownload(mat)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition"
                              title="Download PDF File"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditMaterial(mat)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                              title="Edit Metadata"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openReplacePdf(mat)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"
                              title="Replace PDF File"
                            >
                              <FileUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => confirmDelete('material', mat)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                              title="Delete Material"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ROLES & TOPICS MANAGEMENT */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Registered Preparation Roles ({roles.length})
            </h2>
            <button
              onClick={openCreateRole}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-primary text-white text-xs font-bold rounded-xl hover:bg-blue-600 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Role</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {roles.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center font-bold text-xs">
                        {r.icon_name || 'Terminal'}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{r.name}</h3>
                        <div className="text-[11px] text-slate-400 font-mono">/{r.slug}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditRole(r)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                        title="Edit Role"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => confirmDelete('role', r)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                        title="Delete Role"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {r.description || 'No description provided.'}
                  </p>

                  {/* Topics List */}
                  <div className="border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                        Curriculum Topics ({r.topics?.length || 0})
                      </span>
                      <button
                        onClick={() => openCreateTopic(r)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-primary hover:text-blue-700"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Topic</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {r.topics && r.topics.length > 0 ? (
                        r.topics.map((t) => (
                          <div
                            key={t.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-slate-50 border border-slate-200 text-slate-700"
                          >
                            <span>{t.name}</span>
                            <button
                              onClick={() => openEditTopic(r, t)}
                              className="text-slate-400 hover:text-blue-600"
                              title="Edit topic"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => confirmDelete('topic', t)}
                              className="text-slate-400 hover:text-red-600"
                              title="Delete topic"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">No topics created yet.</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Display Order: {r.display_order}</span>
                  <span className={r.is_active ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                    {r.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* UPLOAD PDF MODAL */}
      {/* --------------------------------------------------------------------- */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-brand-primary" />
                <h3 className="text-base font-bold text-slate-900">Upload Preparation PDF</h3>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              {uploadError && <Alert variant="danger">{uploadError}</Alert>}

              {/* Target Role */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Target Role *
                </label>
                <select
                  value={uploadRoleId}
                  onChange={(e) => {
                    setUploadRoleId(e.target.value);
                    setUploadTopicId('');
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-brand-primary"
                  required
                >
                  <option value="" disabled>Select target preparation role</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                {roles.length === 0 && (
                  <div className="mt-1.5 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center justify-between">
                    <span>No preparation roles found yet.</span>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadModalOpen(false);
                        setActiveTab('roles');
                      }}
                      className="font-semibold text-blue-600 hover:underline ml-2"
                    >
                      + Create role in Roles tab
                    </button>
                  </div>
                )}
              </div>

              {/* Topic */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Topic / Category (Optional)
                </label>
                <select
                  value={uploadTopicId}
                  onChange={(e) => setUploadTopicId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-brand-primary"
                >
                  <option value="">General / No Specific Topic</option>
                  {uploadRoleTopics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Core Python Fundamentals & Memory Guide"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-brand-primary"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Short Description (Optional)
                </label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Brief summary of topics, question formats, and target interview rounds..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-brand-primary"
                />
              </div>

              {/* File Drop / Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  PDF Document (Max 25MB) *
                </label>
                <div className="border-2 border-dashed border-slate-200 hover:border-brand-primary/60 rounded-2xl p-6 text-center transition bg-slate-50">
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="pdf-file-upload"
                  />
                  <label htmlFor="pdf-file-upload" className="cursor-pointer block">
                    <FileText className="w-10 h-10 text-brand-primary/60 mx-auto mb-2" />
                    {uploadFile ? (
                      <div>
                        <div className="font-bold text-xs text-slate-900">{uploadFile.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB • Click to replace
                        </div>
                      </div>
                    ) : (
                      <div>
                        <span className="text-xs font-bold text-brand-primary hover:underline">
                          Choose a PDF file
                        </span>
                        <span className="text-xs text-slate-500"> or drag and drop</span>
                        <div className="text-[11px] text-slate-400 mt-1">PDF documents up to 25MB</div>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Publish Toggle */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="upload-published"
                  checked={uploadIsPublished}
                  onChange={(e) => setUploadIsPublished(e.target.checked)}
                  className="rounded text-brand-primary focus:ring-brand-primary"
                />
                <label htmlFor="upload-published" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Publish immediately (visible to students)
                </label>
              </div>

              {/* Upload Progress Bar */}
              {uploading && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                    <span>Uploading and verifying PDF bytes...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-primary transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  disabled={uploading}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-primary hover:bg-blue-600 rounded-xl shadow-xs transition disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* EDIT METADATA MODAL */}
      {/* --------------------------------------------------------------------- */}
      {editMaterialModalOpen && selectedMaterial && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Edit Document Metadata</h3>
              <button onClick={() => setEditMaterialModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Title *</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Topic</label>
                <select
                  value={editTopicId}
                  onChange={(e) => setEditTopicId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                >
                  <option value="">No Topic</option>
                  {editRoleTopics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-published"
                  checked={editIsPublished}
                  onChange={(e) => setEditIsPublished(e.target.checked)}
                  className="rounded text-brand-primary"
                />
                <label htmlFor="edit-published" className="text-xs font-semibold text-slate-700">
                  Published (visible to students)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditMaterialModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-primary hover:bg-blue-600 rounded-xl shadow-xs"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* REPLACE PDF MODAL */}
      {/* --------------------------------------------------------------------- */}
      {replacePdfModalOpen && selectedMaterial && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Replace PDF Document</h3>
              <button onClick={() => setReplacePdfModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReplaceSubmit} className="p-6 space-y-4">
              {replaceError && <Alert variant="danger">{replaceError}</Alert>}
              <p className="text-xs text-slate-600">
                Replacing the file for <strong>"{selectedMaterial.title}"</strong>. The document URL and ID will remain preserved.
              </p>

              <div>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setReplaceFile(f);
                  }}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-brand-primary hover:file:bg-blue-100"
                  required
                />
              </div>

              {replacing && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>Uploading replacement...</span>
                    <span>{replaceProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-primary" style={{ width: `${replaceProgress}%` }} />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReplacePdfModalOpen(false)}
                  disabled={replacing}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={replacing || !replaceFile}
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-primary hover:bg-blue-600 rounded-xl disabled:opacity-50"
                >
                  {replacing ? 'Uploading...' : 'Replace File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* ROLE FORM MODAL */}
      {/* --------------------------------------------------------------------- */}
      {roleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {selectedRole ? 'Edit Preparation Role' : 'Add Preparation Role'}
              </h3>
              <button onClick={() => setRoleModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRoleSubmit} className="p-6 space-y-4">
              {roleError && <Alert variant="danger">{roleError}</Alert>}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Role Name *</label>
                <input
                  type="text"
                  value={roleName}
                  onChange={(e) => {
                    setRoleName(e.target.value);
                    if (!selectedRole && !roleSlug) {
                      setRoleSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                    }
                  }}
                  placeholder="e.g. Mobile Developer (iOS & Android)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Slug URL Identifier</label>
                <input
                  type="text"
                  value={roleSlug}
                  onChange={(e) => setRoleSlug(e.target.value)}
                  placeholder="e.g. mobile-developer"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Icon Name</label>
                <select
                  value={roleIcon}
                  onChange={(e) => setRoleIcon(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="Terminal">Terminal (Python / Scripting)</option>
                  <option value="Code">Code (Java / C++)</option>
                  <option value="Layout">Layout (Frontend / UI)</option>
                  <option value="Server">Server (Backend / APIs)</option>
                  <option value="BarChart3">BarChart3 (Data Analyst / BI)</option>
                  <option value="CheckSquare">CheckSquare (QA / Testing)</option>
                  <option value="Cloud">Cloud (DevOps / Infrastructure)</option>
                  <option value="Database">Database (DBA / Data Eng)</option>
                  <option value="BookOpen">BookOpen (General Track)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
                <textarea
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Display Order</label>
                  <input
                    type="number"
                    value={roleDisplayOrder}
                    onChange={(e) => setRoleDisplayOrder(e.target.value)}
                    className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="role-active"
                    checked={roleIsActive}
                    onChange={(e) => setRoleIsActive(e.target.checked)}
                    className="rounded text-brand-primary"
                  />
                  <label htmlFor="role-active" className="text-xs font-semibold text-slate-700">
                    Active (Visible)
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRoleModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRole}
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-primary hover:bg-blue-600 rounded-xl"
                >
                  {savingRole ? 'Saving...' : 'Save Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TOPIC FORM MODAL */}
      {/* --------------------------------------------------------------------- */}
      {topicModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {selectedTopic ? 'Edit Topic' : `Add Topic to ${selectedRole?.name}`}
              </h3>
              <button onClick={() => setTopicModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTopicSubmit} className="p-6 space-y-4">
              {topicError && <Alert variant="danger">{topicError}</Alert>}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Topic Name *</label>
                <input
                  type="text"
                  value={topicName}
                  onChange={(e) => {
                    setTopicName(e.target.value);
                    if (!selectedTopic && !topicSlug) {
                      setTopicSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                    }
                  }}
                  placeholder="e.g. Multithreading & Concurrency"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Slug</label>
                <input
                  type="text"
                  value={topicSlug}
                  onChange={(e) => setTopicSlug(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
                <textarea
                  value={topicDescription}
                  onChange={(e) => setTopicDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Display Order</label>
                <input
                  type="number"
                  value={topicDisplayOrder}
                  onChange={(e) => setTopicDisplayOrder(e.target.value)}
                  className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTopicModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTopic}
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-primary hover:bg-blue-600 rounded-xl"
                >
                  {savingTopic ? 'Saving...' : 'Save Topic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* --------------------------------------------------------------------- */}
      {deleteConfirmModalOpen && deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Confirm Deletion</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete this {deleteTarget.type}?
                {deleteTarget.type === 'material' && (
                  <span className="block mt-1 font-semibold text-slate-700">
                    "{deleteTarget.item.title}" (PDF file will be removed from disk)
                  </span>
                )}
                {deleteTarget.type === 'role' && (
                  <span className="block mt-1 font-semibold text-slate-700">
                    Role "{deleteTarget.item.name}" and all its materials
                  </span>
                )}
                {deleteTarget.type === 'topic' && (
                  <span className="block mt-1 font-semibold text-slate-700">
                    Topic "{deleteTarget.item.name}"
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmModalOpen(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteExecute}
                className="flex-1 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

