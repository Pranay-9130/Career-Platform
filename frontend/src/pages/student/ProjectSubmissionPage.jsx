import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import {
  FileText,
  Layers,
  Code2,
  Image as ImageIcon,
  Link as LinkIcon,
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Send,
  UploadCloud,
  Github,
  Globe,
  Video,
  ExternalLink,
  Sparkles,
  Info,
  RotateCcw,
  Eye,
  Check,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { projectService } from '@/services/projectService';
import { Button, Input, Textarea, Select, Badge, Card, Alert, Modal, Spinner } from '@/components/common';

const STORAGE_KEY = 'student_project_draft';

const DOMAIN_OPTIONS = [
  'Web Development',
  'AI / Machine Learning',
  'Mobile Development',
  'Cloud & DevOps',
  'Data Engineering',
  'Cybersecurity',
  'Blockchain & Web3',
  'IoT & Embedded Systems',
];

const DIFFICULTY_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'];

const DURATION_OPTIONS = [
  '< 1 week',
  '1-2 weeks',
  '2-3 weeks',
  '3-4 weeks',
  '4+ weeks',
];

const POPULAR_TECH = [
  'React',
  'Next.js',
  'TypeScript',
  'Tailwind CSS',
  'Node.js',
  'Express',
  'Python',
  'FastAPI',
  'Django',
  'PyTorch',
  'PostgreSQL',
  'MongoDB',
  'Docker',
  'AWS',
  'Redis',
  'GraphQL',
];

const INITIAL_FORM_STATE = {
  title: '',
  domain: 'Web Development',
  short_description: '',
  difficulty: 'Intermediate',
  estimated_duration: '2-3 weeks',
  problem_statement: '',
  objectives: '',
  features: [],
  tech_stack: [],
  prerequisites: '',
  expected_outcome: '',
  cover_image_url: '',
  screenshots: [],
  contributors: [],
  github_url: '',
  live_demo_url: '',
  video_demo_url: '',
  zip_storage_key: '',
  zip_file_size_bytes: 0,
  zip_filename: '',
  zip_ignored_files_count: 0,
};

export default function ProjectSubmissionPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { slug } = useParams();
  const isEditMode = Boolean(slug);
  const [isLoadingExisting, setIsLoadingExisting] = useState(isEditMode);
  const [showLivePreviewModal, setShowLivePreviewModal] = useState(false);

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [isDraftRestored, setIsDraftRestored] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  // Field input states for dynamic lists
  const [featureInput, setFeatureInput] = useState('');
  const [customTechInput, setCustomTechInput] = useState('');
  const [contributorNameInput, setContributorNameInput] = useState('');
  const [contributorRoleInput, setContributorRoleInput] = useState('');
  const [contributorGithubInput, setContributorGithubInput] = useState('');
  const [contributorProfileInput, setContributorProfileInput] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [previewTab, setPreviewTab] = useState('summary');
  const [isUploadingZip, setIsUploadingZip] = useState(false);
  const [zipUploadError, setZipUploadError] = useState(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingScreenshots, setIsUploadingScreenshots] = useState(false);
  const [imageUploadError, setImageUploadError] = useState(null);

  // Load existing project if in edit mode
  useEffect(() => {
    if (!slug) return;
    async function loadExisting() {
      setIsLoadingExisting(true);
      try {
        const data = await projectService.getProjectBySlug(slug);
        setFormData({
          title: data.title || '',
          domain: data.domain || 'Web Development',
          short_description: data.short_description || '',
          difficulty: data.difficulty || 'Intermediate',
          estimated_duration: data.estimated_duration || '2-3 weeks',
          problem_statement: data.problem_statement || '',
          objectives: data.objectives || '',
          features: data.features || [],
          tech_stack: data.tech_stack || [],
          prerequisites: data.prerequisites || '',
          expected_outcome: data.expected_outcome || '',
          cover_image_url: data.cover_image_url || '',
          screenshots: (data.screenshots || []).map((s, idx) => ({
            image_url: s.image_url || '',
            caption: s.caption || '',
            order_index: s.order_index ?? idx,
          })),
          contributors: (data.contributors || []).map((c) => ({
            name: c.name || '',
            role: c.role || 'Contributor',
            github_username: c.github_username || '',
          })),
          github_url: data.github_url || '',
          live_demo_url: data.live_demo_url || '',
          video_demo_url: data.video_demo_url || '',
          zip_storage_key: data.zip_storage_key || '',
          zip_file_size_bytes: data.zip_file_size_bytes || 0,
          zip_filename: data.zip_storage_key ? 'source-code.zip' : '',
          zip_ignored_files_count: 0,
        });
      } catch (err) {
        setSubmitError('Failed to load project details for editing.');
      } finally {
        setIsLoadingExisting(false);
      }
    }
    loadExisting();
  }, [slug]);

  // Load saved draft on mount (only if not in edit mode)
  useEffect(() => {
    if (isEditMode) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.title || parsed.short_description || parsed.tech_stack?.length) {
          setFormData(parsed);
          setIsDraftRestored(true);
        }
      }
    } catch {
      // Fallback silently if storage read fails
    }
  }, [isEditMode]);

  // Autosave to localStorage on form changes (only when not in edit mode)
  useEffect(() => {
    if (isEditMode) return;
    if (!formData.title && !formData.short_description && formData.features.length === 0) {
      return;
    }
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
        setLastSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } catch {
        // Storage full or restricted
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [formData, isEditMode]);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleClearDraft = () => {
    if (window.confirm('Are you sure you want to discard your saved draft and start over?')) {
      localStorage.removeItem(STORAGE_KEY);
      setFormData(INITIAL_FORM_STATE);
      setCurrentStep(1);
      setIsDraftRestored(false);
    }
  };

  // Step 2: Feature list helpers
  const handleAddFeature = () => {
    if (!featureInput.trim()) return;
    if (!formData.features.includes(featureInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, featureInput.trim()],
      }));
    }
    setFeatureInput('');
  };

  const handleRemoveFeature = (idx) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== idx),
    }));
  };

  // Step 3: Tech stack helpers
  const toggleTech = (tech) => {
    setFormData((prev) => {
      const exists = prev.tech_stack.includes(tech);
      return {
        ...prev,
        tech_stack: exists
          ? prev.tech_stack.filter((t) => t !== tech)
          : [...prev.tech_stack, tech],
      };
    });
  };

  const handleAddCustomTech = () => {
    if (!customTechInput.trim()) return;
    const tag = customTechInput.trim();
    if (!formData.tech_stack.includes(tag)) {
      setFormData((prev) => ({
        ...prev,
        tech_stack: [...prev.tech_stack, tag],
      }));
    }
    setCustomTechInput('');
  };

  // Step 4: Durable image uploads
  const validateImageFile = (file) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) return 'Upload a PNG, JPEG, WebP, or GIF image.';
    if (file.size > 5 * 1024 * 1024) return `${file.name} exceeds the 5 MB image limit.`;
    return null;
  };

  const handleCoverImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const validationError = validateImageFile(file);
    if (validationError) {
      setImageUploadError(validationError);
      event.target.value = '';
      return;
    }
    setImageUploadError(null);
    setIsUploadingCover(true);
    try {
      const result = await projectService.uploadProjectImage(file);
      updateField('cover_image_url', result.image_url);
    } catch (err) {
      setImageUploadError(err.response?.data?.detail || 'Cover image upload failed. Please try again.');
    } finally {
      setIsUploadingCover(false);
      event.target.value = '';
    }
  };

  const handleScreenshotUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const remaining = 5 - formData.screenshots.length;
    if (remaining <= 0 || files.length > remaining) {
      setImageUploadError(`You can add up to 5 screenshots. ${remaining} slot${remaining === 1 ? '' : 's'} remaining.`);
      event.target.value = '';
      return;
    }
    const validationError = files.map(validateImageFile).find(Boolean);
    if (validationError) {
      setImageUploadError(validationError);
      event.target.value = '';
      return;
    }
    setImageUploadError(null);
    setIsUploadingScreenshots(true);
    try {
      const uploaded = await Promise.all(files.map((file) => projectService.uploadProjectImage(file)));
      setFormData((prev) => ({
        ...prev,
        screenshots: [...prev.screenshots, ...uploaded.map((result, index) => ({
          image_url: result.image_url,
          caption: files[index].name.replace(/\.[^.]+$/, ''),
          order_index: prev.screenshots.length + index,
        }))],
      }));
    } catch (err) {
      setImageUploadError(err.response?.data?.detail || 'Screenshot upload failed. Please try again.');
    } finally {
      setIsUploadingScreenshots(false);
      event.target.value = '';
    }
  };

  const handleRemoveScreenshot = (idx) => {
    setFormData((prev) => ({
      ...prev,
      screenshots: prev.screenshots.filter((_, i) => i !== idx),
    }));
  };

  // Step 5: ZIP File Validation and Upload
  const handleZipUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setZipUploadError(null);

    // 1. File extension validation
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setZipUploadError('Only .zip archive packages are permitted.');
      return;
    }

    // 2. Client-side size check (50 MB limit)
    const maxBytes = 50 * 1024 * 1024;
    if (file.size > maxBytes) {
      setZipUploadError('File exceeds the 50 MB platform upload limit.');
      return;
    }

    // 3. Client-side binary signature validation (PK\x03\x04 = 0x50, 0x4B, 0x03, 0x04)
    try {
      const headerSlice = await file.slice(0, 4).arrayBuffer();
      const bytes = new Uint8Array(headerSlice);
      const isZipMagic =
        bytes.length >= 4 &&
        bytes[0] === 0x50 &&
        bytes[1] === 0x4b &&
        bytes[2] === 0x03 &&
        bytes[3] === 0x04;

      if (!isZipMagic) {
        setZipUploadError(
          'Invalid archive format: Header does not match ZIP magic bytes (PK\\x03\\x04). Please provide a genuine ZIP archive.'
        );
        return;
      }
    } catch {
      setZipUploadError('Failed to read file binary header for format verification.');
      return;
    }

    // 4. Secure upload to backend
    setIsUploadingZip(true);
    try {
      let result;
      if (isEditMode && slug) {
        result = await projectService.uploadProjectZip(slug, file);
      } else {
        result = await projectService.uploadStandaloneZip(file);
      }

      setFormData((prev) => ({
        ...prev,
        zip_storage_key: result.zip_storage_key,
        zip_file_size_bytes: result.zip_file_size_bytes || file.size,
        zip_filename: result.filename || file.name,
        zip_ignored_files_count: result.ignored_files_count || 0,
      }));
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        'ZIP verification failed. Ensure secret files (.env, keys) or executable binaries (.exe) are excluded.';
      setZipUploadError(detail);
    } finally {
      setIsUploadingZip(false);
      e.target.value = '';
    }
  };

  // Step 6: Contributor helpers
  const handleAddContributor = () => {
    if (!contributorNameInput.trim()) return;
    const newContributor = {
      name: contributorNameInput.trim(),
      role: contributorRoleInput.trim() || 'Contributor',
      github_username: contributorGithubInput.trim() || undefined,
      profile_username: contributorProfileInput.trim().replace(/^@/, '') || undefined,
    };
    setFormData((prev) => ({
      ...prev,
      contributors: [...prev.contributors, newContributor],
    }));
    setContributorNameInput('');
    setContributorRoleInput('');
    setContributorGithubInput('');
    setContributorProfileInput('');
  };

  const handleRemoveContributor = (idx) => {
    setFormData((prev) => ({
      ...prev,
      contributors: prev.contributors.filter((_, i) => i !== idx),
    }));
  };

  // Step validation rules
  const isStep1Valid = useMemo(() => {
    return (
      formData.title.trim().length >= 3 &&
      formData.short_description.trim().length >= 10 &&
      Boolean(formData.domain)
    );
  }, [formData.title, formData.short_description, formData.domain]);

  const isStep2Valid = useMemo(() => {
    return (
      formData.problem_statement.trim().length >= 10 &&
      formData.features.length >= 1
    );
  }, [formData.problem_statement, formData.features]);

  const isStep3Valid = useMemo(() => {
    return formData.tech_stack.length >= 1;
  }, [formData.tech_stack]);

  const canAdvance = () => {
    if (currentStep === 1) return isStep1Valid;
    if (currentStep === 2) return isStep2Valid;
    if (currentStep === 3) return isStep3Valid;
    return true; // Steps 4 and 5 have sensible defaults/optional fields
  };

  // Final submission handlers
  const handleSaveDraft = async () => {
    if (!formData.title.trim()) {
      alert('Please provide at least a project title to save a draft.');
      return;
    }
    setIsSavingDraft(true);
    setSubmitError(null);
    try {
      const payload = {
        ...formData,
        status: 'Draft',
        short_description: formData.short_description.trim() || 'Work in progress draft project.',
        problem_statement: formData.problem_statement || '',
      };
      let res;
      if (isEditMode) {
        res = await projectService.updateProject(slug, payload);
      } else {
        res = await projectService.createProject(payload);
      }
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('workspace-counts-updated'));
      setSuccessData({ project: res, isDraft: true });
    } catch (err) {
      setSubmitError(
        err.response?.data?.detail || 'Failed to save project draft. Please try again.'
      );
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSubmitFinal = async () => {
    if (!isStep1Valid || !isStep2Valid || !isStep3Valid) {
      alert('Please complete all required fields across the steps before submitting.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        ...formData,
        status: 'Submitted',
      };
      let res;
      if (isEditMode) {
        res = await projectService.updateProject(slug, payload);
      } else {
        res = await projectService.createProject(payload);
      }
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('workspace-counts-updated'));
      setSuccessData({ project: res, isDraft: false });
    } catch (err) {
      setSubmitError(
        err.response?.data?.detail || 'Failed to submit project. Please verify all inputs.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const STEPS = [
    { number: 1, title: 'Basic Info', icon: FileText, valid: isStep1Valid },
    { number: 2, title: 'Problem & Features', icon: Layers, valid: isStep2Valid },
    { number: 3, title: 'Tech Stack', icon: Code2, valid: isStep3Valid },
    { number: 4, title: 'Visuals & Media', icon: ImageIcon, valid: true },
    { number: 5, title: 'Repository & Links', icon: LinkIcon, valid: true },
    { number: 6, title: 'Contributors & Review', icon: Users, valid: true },
  ];

  if (successData) {
    const { project, isDraft } = successData;
    return (
      <div className="min-h-screen bg-slate-50/60 py-16 px-4">
        <div className="max-w-2xl mx-auto bg-white border border-brand-border rounded-3xl p-8 sm:p-10 shadow-lg text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
              {isDraft ? 'Draft Saved Successfully' : 'Submission Under Review'}
            </span>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-brand-text">
              {isDraft ? 'Project Draft Saved' : 'Project Submitted Successfully!'}
            </h1>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              {isDraft
                ? `"${project.title}" has been saved to your drafts. You can edit and submit it whenever you're ready.`
                : `"${project.title}" has been routed to our student showcase review pipeline. Our mentors verify code structure within 24 hours.`}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Assigned Slug:</span>
              <code className="bg-white px-2 py-0.5 rounded border border-slate-200 font-mono text-brand-primary font-bold">
                /projects/{project.slug}
              </code>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Domain & Difficulty:</span>
              <span className="text-slate-700 font-semibold">{project.domain} • {project.difficulty}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Author:</span>
              <span className="text-slate-700 font-semibold">{user?.full_name || 'You'}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setSuccessData(null);
                setFormData(INITIAL_FORM_STATE);
                setCurrentStep(1);
              }}
              leftIcon={Plus}
            >
              Submit Another Project
            </Button>

            <Link to={`/projects/${project.slug}`}>
              <Button variant="primary" size="md" rightIcon={ExternalLink}>
                View Project Page
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-24">
      {/* Top Banner Header */}
      <section className="bg-gradient-to-b from-blue-50/80 via-white to-slate-50/60 border-b border-brand-border py-8 lg:py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Link
                  to="/submission-guidelines"
                  className="inline-flex items-center gap-1.5 text-xs text-brand-primary font-semibold hover:underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Submission Guidelines</span>
                </Link>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500">Student Showcase Portal</span>
              </div>

              {isEditMode && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold mb-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Editing Existing Submission: <code className="font-mono">{slug}</code></span>
                </div>
              )}

              <h1 className="font-display font-bold text-2xl sm:text-3xl text-brand-text">
                {isEditMode ? 'Edit Project Submission' : 'Submit Your Project'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                {isEditMode
                  ? 'Update your project specifications, tech stack tags, demo links, and gallery screenshots.'
                  : 'Showcase your software engineering work to verified recruiters, tech leads, and peers.'}
              </p>
            </div>

            {/* Actions: Live Full Preview, Autosave Status & Discard */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowLivePreviewModal(true)}
                leftIcon={Eye}
                className="text-xs text-brand-primary border-brand-primary/30 hover:bg-blue-50 shadow-xs"
              >
                Live Full Preview
              </Button>

              {lastSavedAt && !isEditMode && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full font-medium shadow-xs">
                  <Check className="w-3.5 h-3.5" />
                  <span>Autosaved at {lastSavedAt}</span>
                </div>
              )}
              {isDraftRestored && !isEditMode && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearDraft}
                  leftIcon={RotateCcw}
                  className="text-xs text-slate-500 hover:text-red-600"
                >
                  Discard Draft
                </Button>
              )}
            </div>
          </div>

          {/* Stepper Navigation Bar */}
          <div className="mt-8 pt-6 border-t border-slate-200/80">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
              {STEPS.map((step) => {
                const Icon = step.icon;
                const isCurrent = currentStep === step.number;
                const isPassed = currentStep > step.number;

                return (
                  <button
                    key={step.number}
                    type="button"
                    onClick={() => {
                      // Allow jumping backward anytime, or forward if validated
                      if (step.number < currentStep || canAdvance()) {
                        setCurrentStep(step.number);
                      }
                    }}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                      isCurrent
                        ? 'bg-brand-primary text-white border-brand-primary shadow-sm shadow-brand-primary/20 scale-[1.02]'
                        : isPassed
                        ? 'bg-blue-50/70 border-brand-primary/30 text-brand-primary hover:bg-blue-100/50'
                        : 'bg-white border-brand-border text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                        isCurrent
                          ? 'bg-white/20 text-white'
                          : isPassed
                          ? 'bg-brand-primary text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {isPassed ? <Check className="w-3.5 h-3.5" /> : step.number}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase font-bold tracking-wider opacity-80 leading-none">
                        Step {step.number}
                      </div>
                      <div className="text-xs font-bold truncate mt-0.5">
                        {step.title}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {submitError && (
          <Alert variant="error" className="mb-6" onClose={() => setSubmitError(null)}>
            {submitError}
          </Alert>
        )}

        <div className="bg-white border border-brand-border rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xs">
          {/* STEP 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="border-b border-brand-border pb-4">
                <h2 className="font-display font-bold text-xl text-brand-text flex items-center gap-2">
                  <FileText className="w-5 h-5 text-brand-primary" />
                  Step 1: Basic Information
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Start with a crisp project title, core domain category, and a compelling one-sentence summary.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Project Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. CampusBite: Smart Meal Delivery System"
                    value={formData.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Slug will be generated automatically: <code className="text-brand-primary font-mono font-semibold">/projects/{formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'your-title'}</code>
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Domain Category <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.domain}
                      onChange={(e) => updateField('domain', e.target.value)}
                    >
                      {DOMAIN_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Difficulty Level
                    </label>
                    <Select
                      value={formData.difficulty}
                      onChange={(e) => updateField('difficulty', e.target.value)}
                    >
                      {DIFFICULTY_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Estimated Duration
                    </label>
                    <Select
                      value={formData.estimated_duration}
                      onChange={(e) => updateField('estimated_duration', e.target.value)}
                    >
                      {DURATION_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Short Description / Elevator Pitch <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {formData.short_description.length} / 300
                    </span>
                  </div>
                  <Textarea
                    rows={3}
                    placeholder="Provide a succinct summary of what your project achieves and who benefits from it (10-300 characters)."
                    value={formData.short_description}
                    onChange={(e) => updateField('short_description', e.target.value)}
                    maxLength={300}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Problem & Features */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="border-b border-brand-border pb-4">
                <h2 className="font-display font-bold text-xl text-brand-text flex items-center gap-2">
                  <Layers className="w-5 h-5 text-brand-primary" />
                  Step 2: Problem Statement & Key Features
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Articulate the technical pain point and bullet-point the key engineering capabilities.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Problem Statement <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    rows={4}
                    placeholder="Explain the real-world or technical bottleneck that motivated building this system."
                    value={formData.problem_statement}
                    onChange={(e) => updateField('problem_statement', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Project Objectives (Optional)
                  </label>
                  <Textarea
                    rows={2}
                    placeholder="e.g. Achieve sub-100ms response times and 99.9% uptime with containerized microservices."
                    value={formData.objectives}
                    onChange={(e) => updateField('objectives', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Key Features List <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. JWT-based authentication with role-based authorization"
                      value={featureInput}
                      onChange={(e) => setFeatureInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddFeature();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddFeature}
                      leftIcon={Plus}
                      className="shrink-0"
                    >
                      Add Feature
                    </Button>
                  </div>

                  {formData.features.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {formData.features.map((feat, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-blue-100 text-brand-primary flex items-center justify-center font-bold text-[10px]">
                              {idx + 1}
                            </span>
                            <span>{feat}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFeature(idx)}
                            className="text-slate-400 hover:text-red-600 transition-colors p-1"
                            title="Remove feature"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-3 mt-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      Add at least 1 key feature to advance.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Tech Stack & Prerequisites */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="border-b border-brand-border pb-4">
                <h2 className="font-display font-bold text-xl text-brand-text flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-brand-primary" />
                  Step 3: Tech Stack & Learning Outcomes
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Tag the programming languages, frameworks, databases, and dependencies powering your build.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Select Technologies <span className="text-red-500">*</span>
                  </label>

                  {/* Quick Pick Popular Technologies */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {POPULAR_TECH.map((tech) => {
                      const isSelected = formData.tech_stack.includes(tech);
                      return (
                        <button
                          key={tech}
                          type="button"
                          onClick={() => toggleTech(tech)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                            isSelected
                              ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          {isSelected ? `✓ ${tech}` : `+ ${tech}`}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Tech Input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add custom library or tool (e.g. Celery, WebSockets, Prisma)..."
                      value={customTechInput}
                      onChange={(e) => setCustomTechInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomTech();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddCustomTech}
                      leftIcon={Plus}
                      className="shrink-0"
                    >
                      Add Tag
                    </Button>
                  </div>

                  {/* Active Selected Tags */}
                  <div className="mt-3">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Selected Stack ({formData.tech_stack.length}):
                    </span>
                    {formData.tech_stack.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {formData.tech_stack.map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-brand-primary border border-brand-primary/30"
                          >
                            <span>{t}</span>
                            <button
                              type="button"
                              onClick={() => toggleTech(t)}
                              className="text-brand-primary/60 hover:text-red-600 transition-colors"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        Please select or add at least 1 technology tag.
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Prerequisites (Optional)
                    </label>
                    <Textarea
                      rows={3}
                      placeholder="e.g. Basic knowledge of JavaScript async/await and relational database normalization."
                      value={formData.prerequisites}
                      onChange={(e) => updateField('prerequisites', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Expected Deliverable / Outcome (Optional)
                    </label>
                    <Textarea
                      rows={3}
                      placeholder="e.g. A production-ready API service with automated Docker Compose deployment and interactive Swagger documentation."
                      value={formData.expected_outcome}
                      onChange={(e) => updateField('expected_outcome', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Visuals & Media */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="border-b border-brand-border pb-4">
                <h2 className="font-display font-bold text-xl text-brand-text flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-brand-primary" />
                  Step 4: Cover Image & UI Screenshots
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Projects with visual mockups or UI screenshots receive up to 4x more views and recruiter bookmarks.
                </p>
              </div>

              <div className="space-y-5">
                {imageUploadError && (
                  <Alert variant="error" title="Image Upload Failed" onClose={() => setImageUploadError(null)}>
                    {imageUploadError}
                  </Alert>
                )}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Cover Banner Image
                  </label>
                  <input
                    id="coverImageInput"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    disabled={isUploadingCover}
                    onChange={handleCoverImageUpload}
                  />
                  <label
                    htmlFor="coverImageInput"
                    className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-xs font-semibold text-slate-700 hover:border-brand-primary hover:text-brand-primary cursor-pointer transition-colors"
                  >
                    {isUploadingCover ? <Spinner size="sm" /> : <UploadCloud className="w-4 h-4" />}
                    {isUploadingCover ? 'Uploading cover image...' : 'Choose cover image (PNG, JPEG, WebP, or GIF)'}
                  </label>
                  {formData.cover_image_url && (
                    <div className="mt-2 relative rounded-2xl overflow-hidden border border-brand-border h-40 bg-slate-100 flex items-center justify-center">
                      <img
                        src={formData.cover_image_url}
                        alt="Cover Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <span className="text-xs text-slate-400 absolute">Cover Preview</span>
                      <button
                        type="button"
                        aria-label="Remove cover image"
                        onClick={() => updateField('cover_image_url', '')}
                        className="absolute top-2 right-2 rounded-full bg-white/90 p-1.5 text-slate-600 hover:text-red-600 shadow"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Additional Screenshots (1-5 images)
                  </label>

                  <input
                    id="screenshotImageInput"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    multiple
                    className="hidden"
                    disabled={isUploadingScreenshots || formData.screenshots.length >= 5}
                    onChange={handleScreenshotUpload}
                  />
                  <label
                    htmlFor="screenshotImageInput"
                    className={`flex items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 text-xs font-semibold transition-colors ${
                      formData.screenshots.length >= 5
                        ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'border-slate-300 bg-slate-50 text-slate-700 hover:border-brand-primary hover:text-brand-primary cursor-pointer'
                    }`}
                  >
                    {isUploadingScreenshots ? <Spinner size="sm" /> : <ImageIcon className="w-4 h-4" />}
                    {isUploadingScreenshots
                      ? 'Uploading screenshots...'
                      : `Choose images (${5 - formData.screenshots.length} remaining, 5 MB each)`}
                  </label>

                  {formData.screenshots.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                      {formData.screenshots.map((s, idx) => (
                        <div
                          key={idx}
                          className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 p-2.5 flex items-start gap-3"
                        >
                          <div className="w-16 h-16 rounded-xl bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                            <img
                              src={s.image_url}
                              alt={s.caption}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = 'https://placehold.co/100x100?text=Preview';
                              }}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <input
                              type="text"
                              aria-label={`Caption for screenshot ${idx + 1}`}
                              value={s.caption || ''}
                              placeholder={`Screenshot ${idx + 1}`}
                              onChange={(event) => setFormData((prev) => ({
                                ...prev,
                                screenshots: prev.screenshots.map((item, itemIndex) =>
                                  itemIndex === idx ? { ...item, caption: event.target.value } : item
                                ),
                              }))}
                              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveScreenshot(idx)}
                            className="text-slate-400 hover:text-red-600 transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Repository & Links */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="border-b border-brand-border pb-4">
                <h2 className="font-display font-bold text-xl text-brand-text flex items-center gap-2">
                  <LinkIcon className="w-5 h-5 text-brand-primary" />
                  Step 5: Code Repository, Demos & ZIP Source
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Connect your GitHub repo, deployment URL, or attach an encrypted source ZIP package.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Github className="w-3.5 h-3.5" />
                    <span>GitHub Repository URL</span>
                  </label>
                  <Input
                    placeholder="https://github.com/username/project-repo"
                    value={formData.github_url}
                    onChange={(e) => updateField('github_url', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" />
                      <span>Live Production Demo URL</span>
                    </label>
                    <Input
                      placeholder="https://my-app.vercel.app"
                      value={formData.live_demo_url}
                      onChange={(e) => updateField('live_demo_url', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5" />
                      <span>Walkthrough / Loom Video URL</span>
                    </label>
                    <Input
                      placeholder="https://youtu.be/... or Loom link"
                      value={formData.video_demo_url}
                      onChange={(e) => updateField('video_demo_url', e.target.value)}
                    />
                  </div>
                </div>

                {/* ZIP Package Upload Area */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <UploadCloud className="w-3.5 h-3.5 text-brand-primary" />
                      <span>Project Source Archive (ZIP)</span>
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">Max 50 MB</span>
                  </div>

                  {zipUploadError && (
                    <Alert
                      variant="error"
                      title="Archive Verification Failed"
                      onClose={() => setZipUploadError(null)}
                    >
                      {zipUploadError}
                    </Alert>
                  )}

                  <div className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors ${
                    isUploadingZip
                      ? 'border-brand-primary bg-blue-50/40 cursor-wait'
                      : 'border-slate-300 hover:border-brand-primary bg-slate-50/60'
                  }`}>
                    <input
                      type="file"
                      id="zipFileInput"
                      accept=".zip"
                      className="hidden"
                      disabled={isUploadingZip}
                      onChange={handleZipUpload}
                    />
                    <label
                      htmlFor={isUploadingZip ? undefined : 'zipFileInput'}
                      className={`block space-y-2 ${isUploadingZip ? 'cursor-wait' : 'cursor-pointer'}`}
                    >
                      {isUploadingZip ? (
                        <div className="py-2 space-y-2">
                          <Spinner size="md" className="mx-auto text-brand-primary" />
                          <p className="text-xs font-semibold text-brand-primary">
                            Scanning & Uploading ZIP Package...
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Validating PK\x03\x04 signature, scanning for uncompressed ratio & security policies.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-brand-primary mx-auto flex items-center justify-center">
                            <UploadCloud className="w-6 h-6" />
                          </div>
                          <div className="text-xs font-bold text-slate-700">
                            {formData.zip_filename ? (
                              <span className="text-brand-primary font-mono">{formData.zip_filename}</span>
                            ) : (
                              'Click to select or drag and drop a .zip archive'
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                            Strict safety enforcement: files with binary executables (<code className="bg-slate-200 px-1 py-0.5 rounded font-mono">.exe</code>, <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">.dll</code>), path traversals, or leaked secrets (<code className="bg-slate-200 px-1 py-0.5 rounded font-mono">.env</code>, keys) are automatically rejected.
                          </p>
                          <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                            Generated folders such as <code className="font-mono">node_modules</code>, <code className="font-mono">.git</code>, <code className="font-mono">dist</code>, and <code className="font-mono">build</code> are removed automatically.
                          </p>
                        </>
                      )}
                    </label>
                  </div>

                  {formData.zip_filename && !isUploadingZip && (
                    <div className="flex items-center justify-between text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl px-4 py-2.5">
                      <div className="flex items-center gap-2 truncate">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate">
                          Verified Package: <strong>{formData.zip_filename}</strong> ({Math.round(formData.zip_file_size_bytes / 1024)} KB)
                          {formData.zip_ignored_files_count > 0 && (
                            <span> — removed {formData.zip_ignored_files_count} generated files</span>
                          )}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            zip_storage_key: '',
                            zip_file_size_bytes: 0,
                            zip_filename: '',
                            zip_ignored_files_count: 0,
                          }));
                        }}
                        className="text-emerald-700 hover:text-red-600 font-bold ml-2 shrink-0 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Contributors & Final Review */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="border-b border-brand-border pb-4">
                <h2 className="font-display font-bold text-xl text-brand-text flex items-center gap-2">
                  <Users className="w-5 h-5 text-brand-primary" />
                  Step 6: Contributors & Pre-Submission Review
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Credit co-authors and inspect your project card before submitting for review or saving as draft.
                </p>
              </div>

              {/* Contributors Input */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Co-Authors & Contributors (Optional)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  <Input
                    placeholder="Full name (e.g. Alex Morgan)"
                    value={contributorNameInput}
                    onChange={(e) => setContributorNameInput(e.target.value)}
                  />
                  <Input
                    placeholder="Role (e.g. Frontend Dev)"
                    value={contributorRoleInput}
                    onChange={(e) => setContributorRoleInput(e.target.value)}
                  />
                  <Input
                    placeholder="GitHub username (e.g. alexm)"
                    value={contributorGithubInput}
                    onChange={(e) => setContributorGithubInput(e.target.value)}
                  />
                  <Input
                    placeholder="Platform @username (optional)"
                    value={contributorProfileInput}
                    onChange={(e) => setContributorProfileInput(e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddContributor}
                  leftIcon={Plus}
                >
                  Add Contributor
                </Button>

                {formData.contributors.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.contributors.map((c, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs bg-slate-100 border border-slate-200 text-slate-800"
                      >
                        <span>
                          <strong>{c.name}</strong> ({c.role})
                          {c.profile_username && (
                            <span className="text-brand-primary font-semibold ml-1">
                              @{c.profile_username}
                            </span>
                          )}
                          {c.github_username && !c.profile_username && (
                            <span className="text-slate-500 font-mono ml-1">
                              gh:{c.github_username}
                            </span>
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveContributor(idx)}
                          className="text-slate-400 hover:text-red-600 transition-colors"
                          title="Remove contributor"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Final Summary Card */}
              <div className="mt-6 border-t border-slate-200 pt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-bold text-sm text-brand-text flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-primary" />
                    Review Summary Preview
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowLivePreviewModal(true)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold text-brand-primary bg-blue-50 hover:bg-blue-100 transition-all flex items-center gap-1 border border-brand-primary/20"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Full Detail View</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab('summary')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        previewTab === 'summary'
                          ? 'bg-brand-primary text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Summary
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab('checklist')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        previewTab === 'checklist'
                          ? 'bg-brand-primary text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Compliance
                    </button>
                  </div>
                </div>

                {previewTab === 'summary' ? (
                  <div className="bg-slate-50/70 border border-brand-border rounded-2xl p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-brand-primary bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {formData.domain}
                          </span>
                          <span className="text-xs font-semibold text-slate-600">
                            {formData.difficulty} • {formData.estimated_duration}
                          </span>
                        </div>
                        <h4 className="font-display font-bold text-base text-brand-text mt-1">
                          {formData.title || 'Untitled Project'}
                        </h4>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        By {user?.full_name || 'Current Student'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {formData.short_description || 'No short description provided yet.'}
                    </p>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Tech Stack:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {formData.tech_stack.map((t) => (
                          <span
                            key={t}
                            className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                      <div className="bg-white border border-slate-200 rounded-xl p-2">
                        <span className="text-[10px] text-slate-400 block">Features</span>
                        <strong className="text-slate-800">{formData.features.length}</strong>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-xl p-2">
                        <span className="text-[10px] text-slate-400 block">Screenshots</span>
                        <strong className="text-slate-800">{formData.screenshots.length}</strong>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-xl p-2">
                        <span className="text-[10px] text-slate-400 block">Contributors</span>
                        <strong className="text-slate-800">{formData.contributors.length}</strong>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-xl p-2">
                        <span className="text-[10px] text-slate-400 block">Source Attached</span>
                        <strong className="text-slate-800">
                          {formData.zip_filename || formData.github_url ? 'Yes' : 'No'}
                        </strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-5 space-y-2.5 text-xs text-emerald-900">
                    <div className="flex items-center gap-2 font-bold text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Security & Guidelines Compliance Verified</span>
                    </div>
                    <ul className="space-y-1 pl-6 list-disc text-emerald-800/90 leading-relaxed">
                      <li>Zero hardcoded API secrets or private tokens included</li>
                      <li>Standard README or problem description provided</li>
                      <li>Educational code review license acknowledged</li>
                      <li>Screenshots adhere to platform community guidelines</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="mt-8 pt-6 border-t border-brand-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                  leftIcon={ArrowLeft}
                >
                  Previous Step
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {/* Save Draft Button (Always available) */}
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleSaveDraft}
                disabled={isSavingDraft || isSubmitting}
                leftIcon={Save}
              >
                {isSavingDraft ? 'Saving Draft...' : 'Save Draft'}
              </Button>

              {/* Next Step OR Final Submit */}
              {currentStep < 6 ? (
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  disabled={!canAdvance()}
                  onClick={() => setCurrentStep((prev) => Math.min(6, prev + 1))}
                  rightIcon={ArrowRight}
                >
                  Next Step
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  disabled={!isStep1Valid || !isStep2Valid || !isStep3Valid || isSubmitting}
                  onClick={handleSubmitFinal}
                  rightIcon={Send}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                >
                  {isSubmitting ? 'Submitting Project...' : isEditMode ? 'Update & Submit' : 'Submit for Review'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Live Full Preview Modal */}
      {showLivePreviewModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="bg-white border border-brand-border rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            {/* Modal Top Sticky Header */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-brand-border px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-display font-bold text-sm text-brand-text">
                  Live Public Page Preview
                </span>
                <span className="text-xs text-slate-400">• Read-Only Simulation</span>
              </div>
              <button
                type="button"
                onClick={() => setShowLivePreviewModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Close preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-8">
              {/* Hero Banner Area */}
              <div className="rounded-3xl border border-brand-border overflow-hidden bg-slate-100">
                {formData.cover_image_url ? (
                  <div className="h-56 sm:h-72 w-full relative">
                    <img
                      src={formData.cover_image_url}
                      alt={formData.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex items-end p-6">
                      <div className="text-white space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-primary text-white">
                            {formData.domain}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-xs">
                            {formData.difficulty}
                          </span>
                        </div>
                        <h2 className="font-display font-bold text-2xl sm:text-3xl">
                          {formData.title || 'Untitled Project'}
                        </h2>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 sm:p-10 bg-gradient-to-br from-blue-50 via-white to-slate-50 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-primary text-white">
                        {formData.domain}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-brand-primary">
                        {formData.difficulty}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        • {formData.estimated_duration}
                      </span>
                    </div>
                    <h2 className="font-display font-bold text-2xl sm:text-3xl text-brand-text">
                      {formData.title || 'Untitled Project'}
                    </h2>
                    <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
                      {formData.short_description || 'No short description provided yet.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Author & External Links Bar */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-primary text-white font-bold flex items-center justify-center text-xs">
                    {user?.full_name ? user.full_name.substring(0, 2).toUpperCase() : 'ME'}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      {user?.full_name || 'Your Name'}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Author & Contributor
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {formData.github_url && (
                    <a
                      href={formData.github_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs"
                    >
                      <Github className="w-3.5 h-3.5" />
                      <span>Repository</span>
                    </a>
                  )}
                  {formData.live_demo_url && (
                    <a
                      href={formData.live_demo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary/90 shadow-xs"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Live Demo</span>
                    </a>
                  )}
                  {formData.video_demo_url && (
                    <a
                      href={formData.video_demo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Walkthrough</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Problem Statement & Objectives */}
              <div className="space-y-4">
                <h3 className="font-display font-bold text-lg text-brand-text flex items-center gap-2">
                  <FileText className="w-5 h-5 text-brand-primary" />
                  Problem Statement
                </h3>
                <div className="bg-white border border-brand-border rounded-2xl p-5 text-xs text-slate-700 leading-relaxed whitespace-pre-line shadow-xs">
                  {formData.problem_statement || 'No problem statement written yet.'}
                </div>

                {formData.objectives && (
                  <div>
                    <h4 className="font-display font-bold text-sm text-slate-800 mb-2">Objectives</h4>
                    <div className="bg-blue-50/50 border border-blue-200/60 rounded-2xl p-4 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                      {formData.objectives}
                    </div>
                  </div>
                )}
              </div>

              {/* Key Features */}
              <div className="space-y-3">
                <h3 className="font-display font-bold text-lg text-brand-text flex items-center gap-2">
                  <Layers className="w-5 h-5 text-brand-primary" />
                  Key Features ({formData.features.length})
                </h3>
                {formData.features.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {formData.features.map((feat, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No features listed yet.</p>
                )}
              </div>

              {/* Tech Stack */}
              <div className="space-y-3">
                <h3 className="font-display font-bold text-lg text-brand-text flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-brand-primary" />
                  Technologies & Dependencies
                </h3>
                <div className="flex flex-wrap gap-2">
                  {formData.tech_stack.map((t) => (
                    <span
                      key={t}
                      className="px-3 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-brand-primary border border-brand-primary/20"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Screenshots Gallery Preview */}
              {formData.screenshots.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-display font-bold text-lg text-brand-text flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-brand-primary" />
                    Screenshots Gallery ({formData.screenshots.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {formData.screenshots.map((s, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 shadow-xs"
                      >
                        <div className="h-44 bg-slate-200 overflow-hidden">
                          <img
                            src={s.image_url}
                            alt={s.caption}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = 'https://placehold.co/400x250?text=Preview';
                            }}
                          />
                        </div>
                        {s.caption && (
                          <div className="p-3 text-xs text-slate-700 font-semibold bg-white border-t border-slate-200">
                            {s.caption}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contributors */}
              {formData.contributors.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-display font-bold text-lg text-brand-text flex items-center gap-2">
                    <Users className="w-5 h-5 text-brand-primary" />
                    Project Contributors
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {formData.contributors.map((c, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 shadow-xs"
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>{c.name}</span>
                        <span className="text-slate-400 font-normal">({c.role})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Footer Actions */}
            <div className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-brand-border px-6 py-4 flex items-center justify-between gap-4">
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowLivePreviewModal(false)}
              >
                Back to Editing
              </Button>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => {
                    setShowLivePreviewModal(false);
                    handleSaveDraft();
                  }}
                  leftIcon={Save}
                  disabled={isSavingDraft || isSubmitting}
                >
                  Save Draft
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    setShowLivePreviewModal(false);
                    handleSubmitFinal();
                  }}
                  rightIcon={Send}
                  disabled={!isStep1Valid || !isStep2Valid || !isStep3Valid || isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isEditMode ? 'Update & Submit' : 'Submit Project'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
