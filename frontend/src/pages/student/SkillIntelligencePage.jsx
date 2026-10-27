import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  BrainCircuit,
  Target,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  BookOpen,
  FolderGit2,
  FileText,
  UploadCloud,
  Plus,
  Trash2,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  Layers,
  Award,
  Sliders,
  ExternalLink,
  Check,
  X,
  Code2,
  Database,
  Cloud,
  Shield,
  HelpCircle,
  Lightbulb,
  Send,
  RotateCcw,
  MessageSquare,
  TrendingUp,
  Info,
} from 'lucide-react';
import SEO from '@/components/common/SEO';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import Skeleton from '@/components/common/Skeleton';
import Modal from '@/components/common/Modal';
import { skillIntelligenceService } from '@/services/skillIntelligenceService';
import { resumeService } from '@/services/resumeService';
import { getFitLevelBadgeClass, formatMatchPercentage } from '@/utils/skillIntelligence';

const COMMON_ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Python Developer',
  'Java Developer',
  'Data Analyst',
  'Data Scientist',
  'Machine Learning Engineer',
  'AI Engineer',
  'Cybersecurity Analyst',
  'DevOps Engineer',
  'Cloud Engineer',
  'Software Engineer',
];

const EXPERIENCE_LEVELS = [
  'Beginner',
  'Student / Entry Level',
  'Experienced',
];

const SKILL_STATUSES = [
  { value: 'Not Started', label: 'Not Started', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { value: 'Learning', label: 'Learning', color: 'bg-blue-50 text-brand-primary border-blue-200' },
  { value: 'Practiced', label: 'Practiced', color: 'bg-cyan-50 text-brand-cyan border-cyan-200' },
  { value: 'Completed', label: 'Completed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
];

export default function SkillIntelligencePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'fit';

  // Core Data States
  const [targetRoleData, setTargetRoleData] = useState(null);
  const [gapData, setGapData] = useState(null);
  const [roadmapData, setRoadmapData] = useState(null);
  const [recommendationsData, setRecommendationsData] = useState(null);
  const [confirmedSkills, setConfirmedSkills] = useState([]);
  const [projectSuggestions, setProjectSuggestions] = useState([]);
  const [userResumes, setUserResumes] = useState([]);

  // UI & Loading States
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState('');

  // Reassessment & Resources States
  const [reassessing, setReassessing] = useState(false);
  const [reassessmentResult, setReassessmentResult] = useState(null);
  const [updatingResource, setUpdatingResource] = useState(null);
  const [resourceFilter, setResourceFilter] = useState('all');

  // Target Role Setup Modal
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState('Frontend Developer');
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [selectedExpLevel, setSelectedExpLevel] = useState('Student / Entry Level');
  const [selectedWorkMode, setSelectedWorkMode] = useState('Remote');
  const [savingRole, setSavingRole] = useState(false);

  // Resume Upload / Extract State
  const [extractModalOpen, setExtractModalOpen] = useState(false);
  const [extractMode, setExtractMode] = useState('upload'); // 'upload' | 'saved' | 'paste'
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [pastedResumeText, setPastedResumeText] = useState('');
  const [selectedPdfFile, setSelectedPdfFile] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [extractedSkills, setExtractedSkills] = useState([]);
  const [extractedSuggestedRoles, setExtractedSuggestedRoles] = useState([]);
  const [workspaceSuggestedRoles, setWorkspaceSuggestedRoles] = useState([]);
  const [extractError, setExtractError] = useState('');

  // Manual Add Skill Form
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('Technical Skills');
  const [newSkillStatus, setNewSkillStatus] = useState('Not Started');
  const [addingSkill, setAddingSkill] = useState(false);

  // AI Mentor Conversational Chat State
  const [mentorChatOpen, setMentorChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const [suggestedFollowups, setSuggestedFollowups] = useState([]);
  const chatMessagesEndRef = useRef(null);

  // Filter for Recommendations Tab
  const [recFilter, setRecFilter] = useState('all'); // 'all' | 'High' | 'Medium' | 'Low'

  const showNotification = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 4000);
  };

  // 1. Initial Data Fetch
  const loadWorkspaceData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch target role preference
      const rolePref = await skillIntelligenceService.getTargetRole();
      setTargetRoleData(rolePref);

      const activeRole = rolePref?.target_role || 'Frontend Developer';
      const activeExp = rolePref?.experience_level || 'Student / Entry Level';

      setSelectedRole(activeRole);
      setSelectedExpLevel(activeExp);
      if (rolePref?.preferences?.work_mode) {
        setSelectedWorkMode(rolePref.preferences.work_mode);
      }

      // Fetch confirmed skills, roadmap, gap analysis, projects, and suggested roles in parallel
      const [skillsRes, gapRes, roadRes, recsRes, projsRes, resumesRes, suggestRes] = await Promise.all([
        skillIntelligenceService.getSkills(),
        skillIntelligenceService.getGapAnalysis({ target_role: activeRole, experience_level: activeExp }),
        skillIntelligenceService.getRoadmap({ target_role: activeRole, experience_level: activeExp }),
        skillIntelligenceService.getRecommendations({ target_role: activeRole, experience_level: activeExp }),
        skillIntelligenceService.getProjectSuggestions(activeRole),
        resumeService.getResumes().catch(() => ({ items: [] })),
        skillIntelligenceService.suggestRoles().catch(() => ({ suggested_roles: [] })),
      ]);

      setConfirmedSkills(skillsRes || []);
      setGapData(gapRes);
      setRoadmapData(roadRes);
      setRecommendationsData(recsRes);
      setProjectSuggestions(projsRes || []);
      setUserResumes(resumesRes?.items || []);
      setWorkspaceSuggestedRoles(suggestRes?.suggested_roles || []);

      if (resumesRes?.items?.length > 0) {
        setSelectedResumeId(resumesRes.items[0].id);
      }

      // If user hasn't configured a role yet, suggest opening the role modal
      if (!rolePref) {
        setRoleModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to load Skill Intelligence workspace:', err);
      setError('Unable to load Skill Intelligence data. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspaceData();
  }, [loadWorkspaceData]);

  // Tab switcher
  const handleTabChange = (tabKey) => {
    setSearchParams({ tab: tabKey });
  };

  // 2. Save Target Role Preference
  const handleSaveRole = async (e) => {
    e?.preventDefault();
    const finalRole = selectedRole === 'Other' ? customRoleInput.trim() : selectedRole;
    if (!finalRole) return;

    setSavingRole(true);
    try {
      const payload = {
        target_role: finalRole,
        experience_level: selectedExpLevel,
        preferences: {
          work_mode: selectedWorkMode,
        },
      };
      const updated = await skillIntelligenceService.setTargetRole(payload);
      setTargetRoleData(updated);
      setRoleModalOpen(false);
      showNotification(`Target role updated to ${finalRole}!`);
      // Reload calculations for new role
      await loadWorkspaceData();
    } catch (err) {
      console.error('Failed to update target role:', err);
      alert('Failed to save target role preferences. Please try again.');
    } finally {
      setSavingRole(false);
    }
  };

  // 3. Update Skill Status (Interactive Progress Tracking)
  const handleStatusChange = async (skillName, newStatus) => {
    setUpdatingStatus(skillName);
    try {
      // Find existing skill record if present
      const norm = skillName.trim().toLowerCase();
      const existing = confirmedSkills.find((s) => s.skill_name.trim().toLowerCase() === norm);

      if (existing) {
        await skillIntelligenceService.updateSkill(existing.id, { status: newStatus });
      } else {
        // Create new confirmed skill record with chosen status
        await skillIntelligenceService.addSkills([
          {
            skill_name: skillName,
            status: newStatus,
            source: 'manual',
            is_confirmed: true,
          },
        ]);
      }

      // Refresh roadmap & gap data locally without full re-render
      const [skillsRes, roadRes, gapRes, recsRes] = await Promise.all([
        skillIntelligenceService.getSkills(),
        skillIntelligenceService.getRoadmap({
          target_role: targetRoleData?.target_role || selectedRole,
          experience_level: targetRoleData?.experience_level || selectedExpLevel,
        }),
        skillIntelligenceService.getGapAnalysis({
          target_role: targetRoleData?.target_role || selectedRole,
          experience_level: targetRoleData?.experience_level || selectedExpLevel,
        }),
        skillIntelligenceService.getRecommendations({
          target_role: targetRoleData?.target_role || selectedRole,
          experience_level: targetRoleData?.experience_level || selectedExpLevel,
        }),
      ]);

      setConfirmedSkills(skillsRes);
      setRoadmapData(roadRes);
      setGapData(gapRes);
      setRecommendationsData(recsRes);
      showNotification(`Updated ${skillName} status to ${newStatus}`);
    } catch (err) {
      console.error('Failed to update skill status:', err);
      alert('Unable to persist status update. Please try again.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Reassess Career Fit
  const handleReassess = async () => {
    setReassessing(true);
    try {
      const activeRole = targetRoleData?.target_role || selectedRole;
      const activeExp = targetRoleData?.experience_level || selectedExpLevel;
      const res = await skillIntelligenceService.reassessCareerFit({
        target_role: activeRole,
        experience_level: activeExp,
      });
      setReassessmentResult(res);
      showNotification(`Reassessment completed: ${res.score_delta >= 0 ? '+' : ''}${res.score_delta}% score change.`);
      await loadWorkspaceData();
    } catch (err) {
      console.error('Failed to reassess career fit:', err);
      alert('Reassessment failed. Please try again.');
    } finally {
      setReassessing(false);
    }
  };

  // Update Learning Resource Progress
  const handleResourceProgress = async (resourceUrl, skillName, newStatus) => {
    setUpdatingResource(resourceUrl);
    try {
      await skillIntelligenceService.updateResourceProgress({
        resource_url: resourceUrl,
        skill_name: skillName,
        status: newStatus,
      });
      showNotification(`Resource marked as ${newStatus}!`);
      await loadWorkspaceData();
    } catch (err) {
      console.error('Failed to update resource progress:', err);
      alert('Could not update resource progress.');
    } finally {
      setUpdatingResource(null);
    }
  };

  // 4. Manual Add Skill
  const handleAddManualSkill = async (e) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    setAddingSkill(true);
    try {
      await skillIntelligenceService.addSkills([
        {
          skill_name: newSkillName.trim(),
          category: newSkillCategory,
          status: newSkillStatus,
          source: 'manual',
          is_confirmed: true,
        },
      ]);
      setNewSkillName('');
      showNotification(`Added ${newSkillName} to confirmed skills!`);
      await loadWorkspaceData();
    } catch (err) {
      console.error('Failed to add manual skill:', err);
      alert('Failed to add skill. Please try again.');
    } finally {
      setAddingSkill(false);
    }
  };

  // 5. Delete Skill
  const handleDeleteSkill = async (skillId, skillName) => {
    if (!window.confirm(`Remove '${skillName}' from your confirmed skills?`)) return;
    try {
      await skillIntelligenceService.deleteSkill(skillId);
      showNotification(`Removed ${skillName}`);
      await loadWorkspaceData();
    } catch (err) {
      console.error('Failed to delete skill:', err);
      alert('Could not remove skill. Please try again.');
    }
  };

  // 6. Resume Extraction Handlers
  const handleExtractSkills = async () => {
    setExtracting(true);
    setExtractError('');
    setExtractedSkills([]);
    setExtractedSuggestedRoles([]);
    try {
      let res;
      if (extractMode === 'upload') {
        if (!selectedPdfFile) {
          setExtractError('Please select a PDF file first.');
          setExtracting(false);
          return;
        }
        res = await skillIntelligenceService.extractSkillsFromPdf(selectedPdfFile);
      } else if (extractMode === 'saved') {
        if (!selectedResumeId) {
          setExtractError('Please select a saved resume.');
          setExtracting(false);
          return;
        }
        res = await skillIntelligenceService.extractSkills({ resume_id: selectedResumeId });
      } else {
        if (!pastedResumeText.trim()) {
          setExtractError('Please paste your resume text.');
          setExtracting(false);
          return;
        }
        res = await skillIntelligenceService.extractSkills({ resume_text: pastedResumeText });
      }

      setExtractedSkills(res.skills || []);
      setExtractedSuggestedRoles(res.suggested_roles || []);
      if (!res.skills || res.skills.length === 0) {
        setExtractError('No recognizable technical skills found. You can add them manually below.');
      }
    } catch (err) {
      console.error('Extraction failed:', err);
      setExtractError(err.response?.data?.detail || 'Failed to extract skills. Please check your input.');
    } finally {
      setExtracting(false);
    }
  };

  // Select a role from suggestions and set as student's target role
  const handleSelectSuggestedRole = async (roleTitle) => {
    if (!roleTitle) return;
    try {
      setSavingRole(true);
      const payload = {
        target_role: roleTitle,
        experience_level: selectedExpLevel || 'Student / Entry Level',
        preferences: {
          work_mode: selectedWorkMode,
        },
      };
      const updated = await skillIntelligenceService.setTargetRole(payload);
      setTargetRoleData(updated);
      setSelectedRole(roleTitle);
      showNotification(`Target role updated to ${roleTitle}! Your workspace has been personalized.`);
      setExtractModalOpen(false);
      await loadWorkspaceData();
    } catch (err) {
      console.error('Failed to update target role:', err);
      alert('Could not update target role. Please try again.');
    } finally {
      setSavingRole(false);
    }
  };

  // Confirm extracted skills into database
  const handleConfirmExtractedSkills = async (skillsToConfirm) => {
    if (!skillsToConfirm || skillsToConfirm.length === 0) return;
    try {
      const payload = skillsToConfirm.map((s) => ({
        skill_name: s.skill_name,
        category: s.category,
        status: s.current_status || 'Not Started',
        source: 'resume',
        is_confirmed: true,
      }));
      await skillIntelligenceService.addSkills(payload);
      setExtractModalOpen(false);
      setExtractedSkills([]);
      setExtractedSuggestedRoles([]);
      showNotification(`Successfully confirmed ${payload.length} skills from resume!`);
      await loadWorkspaceData();
    } catch (err) {
      console.error('Failed to confirm skills:', err);
      alert('Failed to save extracted skills.');
    }
  };

  // 7. AI Mentor Conversational Chat Handlers
  const handleOpenMentorChat = () => {
    setMentorChatOpen(true);
    if (chatMessages.length === 0) {
      setChatMessages([
        {
          role: 'assistant',
          content: `Hello! I am your AspirePath AI Mentor. I have your progress as an aspiring **${activeRoleTitle}** loaded (${gapData?.coverage_percentage ?? 0}% competency coverage, ${confirmedSkills.length} confirmed skills).\n\nHow can I help accelerate your learning, guide your project choices, or prepare for technical interviews today?`,
          source: 'Platform AI Coach',
        },
      ]);
      setSuggestedFollowups([
        'What should I prioritize first between my top gaps?',
        'What portfolio project should I build for my stack?',
        'How do I reach Stage 4: Career Ready?',
      ]);
    }
  };

  const handleSendChatMessage = async (overrideText) => {
    const textToSend = (overrideText !== undefined ? overrideText : chatInput).trim();
    if (!textToSend || chatLoading) return;

    setChatError('');
    setChatInput('');

    const updatedMessages = [...chatMessages, { role: 'user', content: textToSend }];
    setChatMessages(updatedMessages);
    setChatLoading(true);

    try {
      const payloadMessages = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await skillIntelligenceService.chatWithMentor({
        messages: payloadMessages,
      });

      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.reply,
          source: res.source,
        },
      ]);
      if (res.suggested_followups && res.suggested_followups.length > 0) {
        setSuggestedFollowups(res.suggested_followups);
      }
    } catch (err) {
      console.error('Mentor chat error:', err);
      const detail =
        err.response?.data?.detail ||
        'Unable to reach AI Mentor. Please check your connection and retry.';
      setChatError(detail);
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendChatMessage();
    }
  };

  const handleResetChat = () => {
    setChatMessages([
      {
        role: 'assistant',
        content: `New session started. How can I assist you with your **${activeRoleTitle}** roadmap or projects?`,
        source: 'Platform AI Coach',
      },
    ]);
    setSuggestedFollowups([
      'What should I prioritize first between my top gaps?',
      'What portfolio project should I build for my stack?',
      'How do I reach Stage 4: Career Ready?',
    ]);
    setChatError('');
    setChatInput('');
  };

  useEffect(() => {
    if (mentorChatOpen) {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatLoading, mentorChatOpen]);

  const filteredRecommendations = useMemo(() => {
    if (!recommendationsData?.items) return [];
    if (recFilter === 'all') return recommendationsData.items;
    return recommendationsData.items.filter((item) => item.priority === recFilter);
  }, [recommendationsData, recFilter]);

  const allLearningResources = useMemo(() => {
    if (!recommendationsData?.items) return [];
    const list = [];
    const seenUrls = new Set();
    recommendationsData.items.forEach((item) => {
      (item.resources || []).forEach((res) => {
        if (!seenUrls.has(res.url)) {
          seenUrls.add(res.url);
          list.push({
            ...res,
            skill_name: item.skill_name,
            skill_category: item.category,
            skill_priority: item.priority,
            is_essential: item.is_essential,
          });
        }
      });
    });
    return list;
  }, [recommendationsData]);

  const filteredResources = useMemo(() => {
    if (resourceFilter === 'all') return allLearningResources;
    return allLearningResources.filter((r) => r.resource_type === resourceFilter);
  }, [allLearningResources, resourceFilter]);

  const activeRoleTitle = targetRoleData?.target_role || 'Frontend Developer';
  const activeExpTitle = targetRoleData?.experience_level || 'Student / Entry Level';

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      <SEO
        title="Skill Intelligence & Personalized Roadmap | AspirePath"
        description="Target role competency analysis, resume skill extraction, and personalized engineering learning roadmap."
      />

      {/* Floating Notice Banner */}
      {notice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notice}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice('')}
            aria-label="Dismiss notice"
            className="text-emerald-600 hover:text-emerald-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#0B1528] via-[#0F1E36] to-[#0A192F] border border-white/15 p-6 sm:p-8 lg:p-10 text-white shadow-2xl overflow-hidden">
        {/* Ambient atmospheric glows */}
        <div className="absolute -top-24 -right-24 w-[420px] h-[420px] bg-gradient-to-br from-cyan-500/20 via-blue-600/15 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 left-1/4 w-[340px] h-[340px] bg-gradient-to-tr from-indigo-500/15 via-blue-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-60" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          {/* Left Column: Typography & System Value */}
          <div className="max-w-2xl space-y-4">
            {/* Top Eyebrow Pills */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-semibold backdrop-blur-md shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <BrainCircuit className="w-3.5 h-3.5 text-cyan-300" />
                <span>Skill Intelligence</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-blue-100 text-xs font-medium backdrop-blur-md">
                <Target className="w-3.5 h-3.5 text-cyan-300" />
                <span>Target Role: <strong className="text-white font-bold">{activeRoleTitle}</strong></span>
              </span>
            </div>

            {/* Main Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display tracking-tight text-white leading-[1.15]">
              Personalized{' '}
              <span className="bg-gradient-to-r from-cyan-300 via-blue-200 to-indigo-200 bg-clip-text text-transparent">
                Engineering Competency
              </span>{' '}
              System
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
              Bridge the gap between your coursework and commercial job requirements. Track verified progress across ordered milestones, integrate real project showcases, and unlock technical interviews.
            </p>

            {/* Micro value badges */}
            <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 flex items-center gap-1.5">
                <Check className="w-3 h-3 text-emerald-400" /> Deterministic Math
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 flex items-center gap-1.5">
                <Check className="w-3 h-3 text-cyan-400" /> ATS-Ready Parsing
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 flex items-center gap-1.5">
                <Check className="w-3 h-3 text-indigo-400" /> Ordered 4-Stage Roadmap
              </span>
            </div>
          </div>

          {/* Right Column: Glassmorphic Workspace Control Deck */}
          <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 bg-white/[0.06] backdrop-blur-xl border border-white/15 rounded-2xl p-5 shadow-2xl space-y-4">
            {/* Control Deck Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/10">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-300 block">
                  Active Career Goal
                </span>
                <h4 className="text-base font-bold text-white truncate max-w-[200px]">
                  {activeRoleTitle}
                </h4>
                <span className="text-[11px] text-slate-400 block">{activeExpTitle}</span>
              </div>

              {/* Match Coverage Badge */}
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
                  {gapData?.coverage_percentage ?? 0}% Fit
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">Deterministic</span>
              </div>
            </div>

            {/* Mini Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300 font-medium">Competency Baseline</span>
                <span className="text-cyan-300 font-bold">
                  {gapData?.matched_skills_count ?? 0} / {gapData?.total_role_skills ?? 0} verified
                </span>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(gapData?.coverage_percentage ?? 0, 100)}%` }}
                />
              </div>
            </div>

            {/* Interactive Action Grid (2x2) */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                variant="white"
                size="sm"
                onClick={() => setExtractModalOpen(true)}
                leftIcon={UploadCloud}
                className="w-full !bg-white !text-blue-700 hover:!bg-blue-50 font-bold shadow-md text-xs py-2.5"
              >
                Extract from CV
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setRoleModalOpen(true)}
                leftIcon={Sliders}
                className="w-full text-white border-white/20 hover:bg-white/10 font-semibold text-xs py-2.5"
              >
                Change Role
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenMentorChat}
                leftIcon={Sparkles}
                className="w-full text-cyan-200 border-cyan-400/30 hover:bg-cyan-500/15 font-semibold text-xs py-2.5"
              >
                AI Mentor
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleReassess}
                isLoading={reassessing}
                leftIcon={RefreshCw}
                className="w-full text-slate-200 border-white/20 hover:bg-white/10 font-semibold text-xs py-2.5"
              >
                Reassess Fit
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Reassessment Result Report Callout */}
      {reassessmentResult && (
        <div className="p-5 bg-gradient-to-r from-blue-50 via-cyan-50/50 to-emerald-50 border border-blue-200 rounded-3xl space-y-3 shadow-sm animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-blue-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-primary shrink-0" />
              <h4 className="text-sm font-bold text-brand-text">Career Fit Reassessment Report</h4>
              <span className="text-xs text-brand-muted">• {activeRoleTitle}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-brand-muted">
                Previous: <strong>{reassessmentResult.previous_match_percentage}%</strong>
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                reassessmentResult.score_delta >= 0
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                Current: {reassessmentResult.current_match_percentage}% ({reassessmentResult.score_delta >= 0 ? '+' : ''}{reassessmentResult.score_delta}%)
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">{reassessmentResult.explanation}</p>
          {reassessmentResult.improved_skills?.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="font-bold text-slate-600">Strengthened Competencies:</span>
              {reassessmentResult.improved_skills.map((s) => (
                <span key={s} className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
                  ✓ {s}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between text-[11px] text-brand-primary font-semibold pt-1">
            <span>💡 {reassessmentResult.career_readiness_impact}</span>
            <button
              onClick={() => setReassessmentResult(null)}
              className="text-slate-400 hover:text-slate-600 text-xs font-normal"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 2. Top Metric KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Role Coverage */}
        <div className="p-5 bg-white rounded-card border border-brand-border shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">Role Coverage</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold font-display text-brand-text">
                  {gapData?.coverage_percentage ?? 0}%
                </span>
                <span className="text-xs font-semibold text-brand-muted">covered</span>
              </div>
            )}
            <p className="text-[11px] text-brand-muted mt-1">
              {gapData?.matched_skills_count ?? 0} of {gapData?.total_role_skills ?? 0} competencies confirmed
            </p>
          </div>
        </div>

        {/* Metric 2: Essential Requirements */}
        <div className="p-5 bg-white rounded-card border border-brand-border shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">Core Requirements</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-brand-cyan flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold font-display text-brand-text">
                  {gapData?.essential_coverage_percentage ?? 0}%
                </span>
                <span className="text-xs font-semibold text-brand-muted">essential</span>
              </div>
            )}
            <p className="text-[11px] text-brand-muted mt-1">
              {gapData?.missing_skills_count ?? 0} skills remaining to complete role baseline
            </p>
          </div>
        </div>

        {/* Metric 3: Roadmap Progress */}
        <div className="p-5 bg-white rounded-card border border-brand-border shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">Roadmap Progress</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold font-display text-brand-text">
                  {roadmapData?.overall_progress_percentage ?? 0}%
                </span>
                <span className="text-xs font-semibold text-brand-muted">completed</span>
              </div>
            )}
            <p className="text-[11px] text-brand-muted mt-1">
              {roadmapData?.overall_completed_count ?? 0} of {roadmapData?.overall_total_skills ?? 0} skills mastered
            </p>
          </div>
        </div>

        {/* Metric 4: Platform Projects Available */}
        <div className="p-5 bg-white rounded-card border border-brand-border shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">Practice Projects</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FolderGit2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold font-display text-brand-text">
                  {projectSuggestions.length}
                </span>
                <span className="text-xs font-semibold text-brand-muted">projects</span>
              </div>
            )}
            <p className="text-[11px] text-brand-muted mt-1">
              Showcases in platform matching your target stack
            </p>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs Bar */}
      <div className="border-b border-brand-border bg-white rounded-2xl p-1.5 shadow-xs flex items-center gap-1 overflow-x-auto">
        <button
          onClick={() => handleTabChange('fit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'fit'
              ? 'bg-brand-primary text-white shadow-xs'
              : 'text-brand-muted hover:text-brand-text hover:bg-slate-50'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Career Fit & Analysis</span>
        </button>

        <button
          onClick={() => handleTabChange('gaps')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'gaps'
              ? 'bg-brand-primary text-white shadow-xs'
              : 'text-brand-muted hover:text-brand-text hover:bg-slate-50'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Skill Gaps</span>
          {gapData?.missing_skills_count ? (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'gaps' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700 font-bold'}`}>
              {gapData.missing_skills_count}
            </span>
          ) : null}
        </button>

        <button
          onClick={() => handleTabChange('roadmap')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'roadmap'
              ? 'bg-brand-primary text-white shadow-xs'
              : 'text-brand-muted hover:text-brand-text hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Learning Roadmap</span>
        </button>

        <button
          onClick={() => handleTabChange('resources')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'resources'
              ? 'bg-brand-primary text-white shadow-xs'
              : 'text-brand-muted hover:text-brand-text hover:bg-slate-50'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Learning Resources</span>
          {allLearningResources.length > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'resources' ? 'bg-white/20 text-white' : 'bg-blue-100 text-brand-primary font-bold'}`}>
              {allLearningResources.length}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange('recommendations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'recommendations'
              ? 'bg-brand-primary text-white shadow-xs'
              : 'text-brand-muted hover:text-brand-text hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Prioritized Recs</span>
          {recommendationsData?.high_priority_count ? (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'recommendations' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700 font-bold'}`}>
              {recommendationsData.high_priority_count} High
            </span>
          ) : null}
        </button>

        <button
          onClick={() => handleTabChange('projects')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'projects'
              ? 'bg-brand-primary text-white shadow-xs'
              : 'text-brand-muted hover:text-brand-text hover:bg-slate-50'
          }`}
        >
          <FolderGit2 className="w-4 h-4" />
          <span>Platform Projects</span>
          {projectSuggestions.length > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'projects' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800 font-bold'}`}>
              {projectSuggestions.length}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange('mentor')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'mentor'
              ? 'bg-brand-primary text-white shadow-xs'
              : 'text-brand-muted hover:text-brand-text hover:bg-slate-50'
          }`}
        >
          <BrainCircuit className="w-4 h-4" />
          <span>AI Mentor</span>
        </button>

        <button
          onClick={() => handleTabChange('skills')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'skills'
              ? 'bg-brand-primary text-white shadow-xs'
              : 'text-brand-muted hover:text-brand-text hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>My Skills ({confirmedSkills.length})</span>
        </button>
      </div>

      {/* 4. Tab Content Panels */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      ) : (
        <>
          {/* TAB 0: CAREER FIT & ANALYSIS */}
          {activeTab === 'fit' && (
            <div className="space-y-6">
              {/* Role Match Overview Banner */}
              <div className="bg-white rounded-3xl border border-brand-border shadow-card p-6 lg:p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1.5">
                      <Target className="w-4 h-4" /> Role Match Analysis
                    </span>
                    <h3 className="text-xl font-bold font-display text-brand-text">
                      {activeRoleTitle} Competency Alignment
                    </h3>
                    <p className="text-xs text-brand-muted">
                      Evaluated level: <strong>{activeExpTitle}</strong> • Verified against curated industry requirements and live platform jobs.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRoleModalOpen(true)}
                      leftIcon={Sliders}
                    >
                      Change Role
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleReassess}
                      isLoading={reassessing}
                      leftIcon={RefreshCw}
                    >
                      Reassess Fit
                    </Button>
                  </div>
                </div>

                {/* Score Breakdown Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Overall Role Match */}
                  <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50/60 rounded-2xl border border-blue-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600">Deterministic Match Score</span>
                      <Award className="w-4 h-4 text-brand-primary" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold font-display text-brand-primary">
                        {gapData?.coverage_percentage ?? 0}%
                      </span>
                      {gapData?.previous_coverage_percentage != null && (
                        <span className="text-xs font-semibold text-slate-500">
                          (prev: {gapData.previous_coverage_percentage}%)
                        </span>
                      )}
                    </div>
                    <div className="w-full bg-blue-200/50 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-brand-primary h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(gapData?.coverage_percentage ?? 0, 100)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {gapData?.matched_skills_count ?? 0} of {gapData?.total_role_skills ?? 0} total competencies matched
                    </p>
                  </div>

                  {/* Core Requirements */}
                  <div className="p-5 bg-gradient-to-br from-cyan-50 to-blue-50/60 rounded-2xl border border-cyan-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600">Core Essential Coverage</span>
                      <CheckCircle2 className="w-4 h-4 text-cyan-600" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold font-display text-cyan-700">
                        {gapData?.essential_coverage_percentage ?? 0}%
                      </span>
                      <span className="text-xs font-semibold text-slate-500">essential</span>
                    </div>
                    <div className="w-full bg-cyan-200/50 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-cyan-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(gapData?.essential_coverage_percentage ?? 0, 100)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Weighted at 15 points per essential requirement
                    </p>
                  </div>

                  {/* Active Resume / Assessment Basis */}
                  <div className="p-5 bg-gradient-to-br from-slate-50 to-slate-100/60 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600">Resume / Profile Basis</span>
                      <FileText className="w-4 h-4 text-slate-600" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {userResumes.find((r) => r.id === selectedResumeId)?.title ||
                          (userResumes.length > 0 ? userResumes[0].title : 'Manual Profile Skills')}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {confirmedSkills.length} confirmed student skills in database
                      </p>
                    </div>
                    <button
                      onClick={() => setExtractModalOpen(true)}
                      className="text-xs text-brand-primary font-bold hover:underline inline-flex items-center gap-1 pt-1"
                    >
                      <UploadCloud className="w-3.5 h-3.5" /> Scan different resume
                    </button>
                  </div>
                </div>

                {/* Deterministic Scoring Formula & Disclaimer */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-700">
                    <Info className="w-4 h-4 text-brand-primary shrink-0" />
                    <span>Transparent Scoring Methodology</span>
                  </div>
                  <p className="text-slate-600 font-mono text-[11px] bg-white p-2 rounded-lg border border-slate-200/80">
                    {gapData?.evaluation_formula ||
                      'Role Match (%) = (Sum of weights for matched evaluated requirements / Sum of weights for evaluated requirements) × 100'}
                  </p>
                  <p className="text-[11px] text-slate-500 leading-relaxed italic">
                    ⚠️ {gapData?.disclaimer ||
                      'Role match percentage reflects evaluated technical skills and does not represent a guarantee of employment.'}
                  </p>
                </div>
              </div>

              {/* Suggested Engineering Roles Matching Your Skills */}
              {workspaceSuggestedRoles.length > 0 && (
                <div className="bg-white rounded-3xl border border-brand-border shadow-card p-6 lg:p-8 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-brand-primary" />
                        <h3 className="text-base font-bold font-display text-brand-text">
                          Suggested Engineering Roles Matching Your Skills
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-brand-primary text-[10px] font-bold">
                          Automatic Recommendations
                        </span>
                      </div>
                      <p className="text-xs text-brand-muted mt-0.5">
                        Calculated across all standard roles based on your extracted resume competencies and confirmed skills.
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExtractModalOpen(true)}
                      leftIcon={UploadCloud}
                      className="text-xs font-semibold"
                    >
                      Extract from Resume
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {workspaceSuggestedRoles.slice(0, 3).map((item, idx) => {
                      const isCurrent = (targetRoleData?.target_role || selectedRole) === item.role_title;
                      return (
                        <div
                          key={item.role_title || idx}
                          className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                            item.is_recommended
                              ? 'bg-gradient-to-br from-blue-50/70 via-white to-cyan-50/30 border-blue-200 shadow-sm'
                              : 'bg-slate-50/60 border-slate-200'
                          }`}
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="text-base font-bold text-brand-text">
                                    {item.role_title}
                                  </h4>
                                </div>
                                <span className="text-xs text-slate-400">{item.domain}</span>
                              </div>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getFitLevelBadgeClass(
                                  item.fit_level
                                )}`}
                              >
                                {formatMatchPercentage(item.match_percentage)} Match
                              </span>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-brand-primary h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(item.match_percentage, 100)}%` }}
                              />
                            </div>

                            <p className="text-xs text-brand-muted leading-relaxed">
                              {item.why_recommended}
                            </p>

                            <div className="text-[11px] space-y-1 text-slate-600 pt-1">
                              {item.matched_skills?.length > 0 && (
                                <p className="line-clamp-2">
                                  <strong className="text-emerald-700">Matched ({item.matched_skills_count}):</strong>{' '}
                                  {item.matched_skills.slice(0, 4).join(', ')}
                                  {item.matched_skills.length > 4 ? ` +${item.matched_skills.length - 4} more` : ''}
                                </p>
                              )}
                              {item.missing_essential_skills?.length > 0 && (
                                <p className="line-clamp-1 text-slate-400">
                                  <strong>To master:</strong> {item.missing_essential_skills.slice(0, 3).join(', ')}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                            <span className="text-[11px] text-slate-500 font-medium">
                              {item.matched_skills_count} / {item.total_role_skills} competencies
                            </span>

                            {isCurrent ? (
                              <span className="text-xs font-bold text-brand-primary flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Current Role
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleSelectSuggestedRole(item.role_title)}
                                disabled={savingRole}
                                className="text-xs font-bold"
                              >
                                Switch to this Role
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Competency Evidence Breakdown Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Demonstrated */}
                <div className="bg-white p-5 rounded-3xl border border-brand-border shadow-card space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <h4 className="text-xs font-bold text-brand-text">Demonstrated</h4>
                    </div>
                    <span className="text-xs font-bold text-emerald-700">
                      {confirmedSkills.filter((s) => s.status === 'Completed' || s.source === 'resume').length}
                    </span>
                  </div>
                  <p className="text-[11px] text-brand-muted">
                    Skills confirmed via resume parsing, portfolio projects, or completed assessments.
                  </p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {confirmedSkills
                      .filter((s) => s.status === 'Completed' || s.source === 'resume')
                      .slice(0, 8)
                      .map((s) => (
                        <div key={s.id} className="text-xs font-semibold text-slate-700 flex items-center justify-between p-1.5 rounded-lg bg-emerald-50/60">
                          <span>{s.skill_name}</span>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                      ))}
                    {confirmedSkills.filter((s) => s.status === 'Completed' || s.source === 'resume').length === 0 && (
                      <p className="text-[11px] text-slate-400 italic">No skills demonstrated yet.</p>
                    )}
                  </div>
                </div>

                {/* 2. Student Confirmed */}
                <div className="bg-white p-5 rounded-3xl border border-brand-border shadow-card space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <h4 className="text-xs font-bold text-brand-text">Student Confirmed</h4>
                    </div>
                    <span className="text-xs font-bold text-brand-primary">
                      {confirmedSkills.filter((s) => s.source === 'manual' && s.status !== 'Completed').length}
                    </span>
                  </div>
                  <p className="text-[11px] text-brand-muted">
                    Self-reported competencies added directly to your profile.
                  </p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {confirmedSkills
                      .filter((s) => s.source === 'manual' && s.status !== 'Completed')
                      .slice(0, 8)
                      .map((s) => (
                        <div key={s.id} className="text-xs font-semibold text-slate-700 flex items-center justify-between p-1.5 rounded-lg bg-blue-50/60">
                          <span>{s.skill_name}</span>
                          <span className="text-[10px] text-blue-600 font-bold">{s.status}</span>
                        </div>
                      ))}
                    {confirmedSkills.filter((s) => s.source === 'manual' && s.status !== 'Completed').length === 0 && (
                      <p className="text-[11px] text-slate-400 italic">No manual skills added yet.</p>
                    )}
                  </div>
                </div>

                {/* 3. In Progress / Needs Confirmation */}
                <div className="bg-white p-5 rounded-3xl border border-brand-border shadow-card space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <h4 className="text-xs font-bold text-brand-text">Learning / In Progress</h4>
                    </div>
                    <span className="text-xs font-bold text-amber-700">
                      {confirmedSkills.filter((s) => s.status === 'Learning' || s.status === 'Practiced').length}
                    </span>
                  </div>
                  <p className="text-[11px] text-brand-muted">
                    Competencies actively being studied through roadmap modules.
                  </p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {confirmedSkills
                      .filter((s) => s.status === 'Learning' || s.status === 'Practiced')
                      .slice(0, 8)
                      .map((s) => (
                        <div key={s.id} className="text-xs font-semibold text-slate-700 flex items-center justify-between p-1.5 rounded-lg bg-amber-50/60">
                          <span>{s.skill_name}</span>
                          <span className="text-[10px] text-amber-700 font-bold">{s.status}</span>
                        </div>
                      ))}
                    {confirmedSkills.filter((s) => s.status === 'Learning' || s.status === 'Practiced').length === 0 && (
                      <p className="text-[11px] text-slate-400 italic">No active skills in progress.</p>
                    )}
                  </div>
                </div>

                {/* 4. Not Detected / Gaps */}
                <div className="bg-white p-5 rounded-3xl border border-brand-border shadow-card space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <h4 className="text-xs font-bold text-brand-text">Not Detected</h4>
                    </div>
                    <span className="text-xs font-bold text-rose-700">
                      {gapData?.missing_skills?.length || 0}
                    </span>
                  </div>
                  <p className="text-[11px] text-brand-muted">
                    Role requirements absent from current verified records.
                  </p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {gapData?.missing_skills?.slice(0, 8).map((s, idx) => (
                      <div key={idx} className="text-xs font-semibold text-slate-700 flex items-center justify-between p-1.5 rounded-lg bg-rose-50/60">
                        <span>{s.name}</span>
                        <span className="text-[10px] text-rose-600 font-bold">
                          {s.is_essential ? 'Core' : 'Optional'}
                        </span>
                      </div>
                    ))}
                    {(!gapData?.missing_skills || gapData.missing_skills.length === 0) && (
                      <p className="text-[11px] text-emerald-600 font-semibold">All role requirements met!</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Navigation Callout */}
              <div className="p-6 bg-gradient-to-r from-blue-900 to-brand-primary rounded-3xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-base font-bold font-display text-white">Ready to close your remaining skill gaps?</h4>
                  <p className="text-xs text-blue-100 max-w-xl">
                    Follow your ordered roadmap, engage verified official documentation, or complete practical project showcases.
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Button
                    variant="white"
                    size="sm"
                    onClick={() => handleTabChange('roadmap')}
                    rightIcon={ArrowRight}
                  >
                    View Learning Roadmap
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: LEARNING ROADMAP */}
          {activeTab === 'roadmap' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-brand-border">
                <div>
                  <h3 className="text-sm font-bold text-brand-text">Ordered Roadmap for {activeRoleTitle}</h3>
                  <p className="text-xs text-brand-muted">
                    Arranged with prerequisites first. Click the status dropdown on any skill to track your real database progress.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Legend:</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">Not Started</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-brand-primary">Learning</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">Completed</span>
                </div>
              </div>

              {roadmapData?.stages?.map((stage) => (
                <div
                  key={stage.stage_number}
                  className="bg-white rounded-3xl border border-brand-border shadow-card overflow-hidden"
                >
                  {/* Stage Header */}
                  <div className="p-5 bg-gradient-to-r from-slate-50 via-white to-blue-50/30 border-b border-brand-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-brand-primary text-white text-xs font-bold flex items-center justify-center">
                          {stage.stage_number}
                        </span>
                        <h4 className="text-base font-bold font-display text-brand-text">
                          {stage.stage_title}
                        </h4>
                      </div>
                      <p className="text-xs text-brand-muted max-w-2xl">
                        {stage.stage_description}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-semibold text-slate-500">
                        {stage.completed_count} / {stage.total_count} completed
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-blue-50 text-brand-primary text-xs font-bold border border-blue-100">
                        {stage.estimated_stage_duration}
                      </span>
                    </div>
                  </div>

                  {/* Skills in Stage */}
                  <div className="p-5 divide-y divide-slate-100">
                    {stage.skills?.map((skill, sIdx) => {
                      const isSaving = updatingStatus === skill.skill_name;
                      const hasPrereqs = skill.prerequisites && skill.prerequisites.length > 0;

                      return (
                        <div
                          key={skill.skill_name || sIdx}
                          className="py-4 first:pt-0 last:pb-0 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                        >
                          <div className="space-y-1.5 max-w-3xl">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="text-sm font-bold text-brand-text">
                                {skill.skill_name}
                              </h5>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                                  skill.priority === 'High'
                                    ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                    : skill.priority === 'Medium'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {skill.priority} Priority
                              </span>
                              <span className="text-[11px] text-slate-400">• {skill.category}</span>
                              <span className="text-[11px] text-slate-400">• ~{skill.estimated_duration}</span>
                            </div>

                            <p className="text-xs text-brand-muted leading-relaxed">
                              {skill.reason}
                            </p>

                            {/* Prerequisites Pill */}
                            {hasPrereqs && (
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-0.5">
                                <span className="font-semibold text-slate-400">Prerequisites:</span>
                                {skill.prerequisites.map((p) => (
                                  <span key={p} className="px-2 py-0.2 rounded-md bg-slate-100 text-slate-700 font-medium">
                                    {p}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Learning Objectives */}
                            {skill.learning_objectives && skill.learning_objectives.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {skill.learning_objectives.map((obj, oIdx) => (
                                  <span
                                    key={oIdx}
                                    className="px-2 py-0.5 rounded-lg bg-blue-50/70 text-blue-900 text-[11px] font-medium"
                                  >
                                    ✓ {obj}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Practice Exercise */}
                            {skill.practice_exercise && (
                              <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-2 flex items-start gap-2">
                                <Code2 className="w-3.5 h-3.5 text-brand-primary shrink-0 mt-0.5" />
                                <span>
                                  <strong>Practice Exercise:</strong> {skill.practice_exercise}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Action & Status Controls */}
                          <div className="flex items-center gap-3 shrink-0">
                            {/* Resource Link if available */}
                            {skill.resources && skill.resources.length > 0 && (
                              <a
                                href={skill.resources[0].url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-brand-primary hover:text-blue-800 font-semibold flex items-center gap-1 underline underline-offset-2 shrink-0"
                              >
                                <span>{skill.resources[0].title}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}

                            {/* Status Selector Dropdown */}
                            <select
                              value={skill.current_status || 'Not Started'}
                              disabled={isSaving}
                              onChange={(e) => handleStatusChange(skill.skill_name, e.target.value)}
                              className={`text-xs font-bold rounded-xl px-3 py-1.5 border transition-all cursor-pointer ${
                                skill.current_status === 'Completed'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : skill.current_status === 'Learning'
                                  ? 'bg-blue-50 text-brand-primary border-blue-300'
                                  : skill.current_status === 'Practiced'
                                  ? 'bg-cyan-50 text-brand-cyan border-cyan-300'
                                  : 'bg-slate-50 text-slate-600 border-slate-200'
                              } focus:outline-none focus:ring-2 focus:ring-brand-primary/20`}
                            >
                              <option value="Not Started">Not Started</option>
                              <option value="Learning">Learning</option>
                              <option value="Practiced">Practiced</option>
                              <option value="Completed">Completed</option>
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: PRIORITIZED RECOMMENDATIONS */}
          {activeTab === 'recommendations' && (
            <div className="space-y-6">
              {/* Filter & Explanation */}
              <div className="p-4 bg-white rounded-2xl border border-brand-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-brand-text">Personalized Recommendations</h3>
                  <p className="text-xs text-brand-muted">
                    Prioritized combining live platform job requirements (40%), essential role weight (35%), and current gaps (25%).
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  {['all', 'High', 'Medium', 'Low'].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setRecFilter(lvl)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                        recFilter === lvl
                          ? 'bg-white text-brand-primary shadow-xs'
                          : 'text-brand-muted hover:text-brand-text'
                      }`}
                    >
                      {lvl === 'all' ? 'All Priorities' : `${lvl} Priority`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid of Recommendation Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredRecommendations.map((rec) => (
                  <div
                    key={rec.skill_name}
                    className="p-5 bg-white rounded-3xl border border-brand-border shadow-card hover:border-brand-primary/30 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold font-display text-brand-text">
                            {rec.skill_name}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                              rec.priority === 'High'
                                ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                : rec.priority === 'Medium'
                                ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {rec.priority} Priority
                          </span>
                        </div>
                        <span className="text-xs font-extrabold text-brand-primary bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                          Score: {rec.priority_score}/100
                        </span>
                      </div>

                      <p className="text-xs text-brand-muted leading-relaxed">
                        {rec.reason}
                      </p>

                      <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100">
                          {rec.category}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100">
                          Stage {rec.learning_stage}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100">
                          ~{rec.estimated_duration}
                        </span>
                      </div>

                      {/* Learning Objectives */}
                      {rec.learning_objectives && rec.learning_objectives.length > 0 && (
                        <div className="pt-1">
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Learning Objectives
                          </p>
                          <ul className="space-y-1 text-xs text-slate-600">
                            {rec.learning_objectives.map((obj, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-brand-primary mt-0.5">▪</span>
                                <span>{obj}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Related Project link if exists */}
                      {rec.related_project && (
                        <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100 mt-2 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wide">
                              Related Platform Showcase
                            </span>
                            <p className="text-xs font-bold text-brand-text truncate">
                              {rec.related_project.title}
                            </p>
                          </div>
                          <Link
                            to={`/projects/${rec.related_project.slug}`}
                            className="text-xs font-bold text-brand-primary hover:underline shrink-0 flex items-center gap-1"
                          >
                            <span>Inspect</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {rec.resources && rec.resources.length > 0 && (
                          <a
                            href={rec.resources[0].url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-brand-primary hover:underline font-semibold flex items-center gap-1"
                          >
                            <span>Official Docs</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      <select
                        value={rec.current_status || 'Not Started'}
                        onChange={(e) => handleStatusChange(rec.skill_name, e.target.value)}
                        className="text-xs font-bold rounded-xl px-2.5 py-1.5 border border-slate-200 bg-slate-50 focus:outline-none"
                      >
                        <option value="Not Started">Not Started</option>
                        <option value="Learning">Learning</option>
                        <option value="Practiced">Practiced</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SKILL GAP BREAKDOWN */}
          {activeTab === 'gaps' && (
            <div className="space-y-6">
              {/* Data Sources Disclaimer Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-brand-primary shrink-0" />
                  <span>
                    <strong>Data Sources:</strong> {gapData?.data_sources_used?.join(' • ')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Missing Skills Section */}
                <div className="bg-white rounded-3xl border border-brand-border shadow-card p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-bold font-display text-brand-text flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-rose-500" />
                        Identified Skill Gaps ({gapData?.missing_skills?.length || 0})
                      </h3>
                      <p className="text-xs text-brand-muted">
                        Competencies required for {activeRoleTitle} not yet confirmed.
                      </p>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100 space-y-3">
                    {gapData?.missing_skills?.map((item, idx) => (
                      <div key={item.name || idx} className="pt-3 first:pt-0 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-brand-text">{item.name}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                            {item.is_essential ? 'Core Requirement' : 'Recommended'}
                          </span>
                        </div>
                        <p className="text-xs text-brand-muted leading-relaxed">{item.why_it_matters}</p>
                        {item.prerequisites && item.prerequisites.length > 0 && (
                          <p className="text-[11px] text-slate-400">
                            Prerequisites: {item.prerequisites.join(', ')}
                          </p>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(item.name, 'Learning')}
                          className="mt-1 text-xs"
                        >
                          Start Learning
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Matched Confirmed Skills Section */}
                <div className="bg-white rounded-3xl border border-brand-border shadow-card p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-bold font-display text-brand-text flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-500" />
                        Confirmed Competencies ({gapData?.matched_skills?.length || 0})
                      </h3>
                      <p className="text-xs text-brand-muted">
                        Skills in your profile that match target role criteria.
                      </p>
                    </div>
                  </div>

                  {gapData?.matched_skills?.length === 0 ? (
                    <div className="text-center py-10 space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <p className="text-xs text-brand-muted max-w-xs mx-auto">
                        No skills confirmed for this role yet. Upload your resume or manually confirm skills in the "My Confirmed Skills" tab.
                      </p>
                      <Button variant="primary" size="sm" onClick={() => setExtractModalOpen(true)}>
                        Extract from Resume
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 space-y-3">
                      {gapData?.matched_skills?.map((item, idx) => (
                        <div key={item.name || idx} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                          <div>
                            <span className="text-sm font-bold text-brand-text">{item.name}</span>
                            <span className="text-xs text-slate-400 block">{item.category}</span>
                          </div>
                          <Badge variant="approved" size="sm">
                            {item.current_status || 'Confirmed'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MY CONFIRMED SKILLS */}
          {activeTab === 'skills' && (
            <div className="space-y-6">
              {/* Add Skill Form Card */}
              <div className="p-6 bg-white rounded-3xl border border-brand-border shadow-card space-y-4">
                <h3 className="text-base font-bold font-display text-brand-text flex items-center gap-2">
                  <Plus className="w-4 h-4 text-brand-primary" />
                  Add or Confirm a Skill
                </h3>
                <form onSubmit={handleAddManualSkill} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input
                    type="text"
                    placeholder="e.g. React, PostgreSQL, Docker..."
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                    required
                  />

                  <select
                    value={newSkillCategory}
                    onChange={(e) => setNewSkillCategory(e.target.value)}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-brand-text focus:outline-none"
                  >
                    <option value="Languages">Languages</option>
                    <option value="Frameworks & Libraries">Frameworks & Libraries</option>
                    <option value="Databases & Storage">Databases & Storage</option>
                    <option value="Cloud & DevOps">Cloud & DevOps</option>
                    <option value="Tools & Testing">Tools & Testing</option>
                    <option value="Architecture & APIs">Architecture & APIs</option>
                    <option value="Data & AI">Data & AI</option>
                    <option value="Professional Skills">Professional Skills</option>
                  </select>

                  <select
                    value={newSkillStatus}
                    onChange={(e) => setNewSkillStatus(e.target.value)}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-brand-text focus:outline-none"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="Learning">Learning</option>
                    <option value="Practiced">Practiced</option>
                    <option value="Completed">Completed</option>
                  </select>

                  <Button variant="primary" size="sm" type="submit" isLoading={addingSkill}>
                    Add Skill
                  </Button>
                </form>
              </div>

              {/* Skills List Table */}
              <div className="bg-white rounded-3xl border border-brand-border shadow-card overflow-hidden">
                <div className="p-5 border-b border-brand-border flex items-center justify-between">
                  <h4 className="text-sm font-bold text-brand-text">
                    All Confirmed Skills ({confirmedSkills.length})
                  </h4>
                  <Button variant="outline" size="sm" onClick={() => setExtractModalOpen(true)} leftIcon={UploadCloud}>
                    Bulk Extract from CV
                  </Button>
                </div>

                {confirmedSkills.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-xs text-brand-muted">
                      No skills confirmed yet. Extract from your resume or add one above!
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {confirmedSkills.map((s) => (
                      <div
                        key={s.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-brand-text">{s.skill_name}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                              {s.category}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Source: {s.source}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <select
                            value={s.status}
                            onChange={(e) => handleStatusChange(s.skill_name, e.target.value)}
                            className="text-xs font-bold rounded-xl px-3 py-1.5 border border-slate-200 bg-white"
                          >
                            <option value="Not Started">Not Started</option>
                            <option value="Learning">Learning</option>
                            <option value="Practiced">Practiced</option>
                            <option value="Completed">Completed</option>
                          </select>

                          <button
                            onClick={() => handleDeleteSkill(s.id, s.skill_name)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                            title="Delete skill"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: PLATFORM PROJECTS */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              <div className="p-4 bg-white rounded-2xl border border-brand-border flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-brand-text">Showcase Code for {activeRoleTitle}</h3>
                  <p className="text-xs text-brand-muted">
                    Verified practical blueprints in the platform that teach skills from your roadmap.
                  </p>
                </div>
                <Link to="/projects">
                  <Button variant="outline" size="sm" rightIcon={ExternalLink}>
                    Explore All Projects
                  </Button>
                </Link>
              </div>

              {projectSuggestions.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-brand-border space-y-3">
                  <FolderGit2 className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="text-sm font-bold text-brand-text">No Exact Matching Projects Found</h4>
                  <p className="text-xs text-brand-muted max-w-sm mx-auto">
                    We currently don't have published platform showcases matching every rare skill for this role, but new peer submissions are added regularly.
                  </p>
                  <Link to="/my-projects">
                    <Button variant="primary" size="sm">
                      Submit Your Own Showcase
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projectSuggestions.map((proj) => (
                    <div
                      key={proj.id}
                      className="p-5 bg-white rounded-3xl border border-brand-border shadow-card hover:border-brand-primary/30 transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-brand-primary uppercase tracking-wide">
                            {proj.difficulty} Level
                          </span>
                          <span className="text-[11px] text-slate-400">Teaches: {proj.teaches_skills?.join(', ')}</span>
                        </div>

                        <h4 className="text-base font-bold text-brand-text">{proj.title}</h4>
                        <p className="text-xs text-brand-muted leading-relaxed line-clamp-2">
                          {proj.short_description}
                        </p>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {proj.tech_stack?.map((t) => (
                            <span key={t} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium">Interactive Guide</span>
                        <Link to={`/projects/${proj.slug}`}>
                          <Button variant="primary" size="sm" rightIcon={ArrowRight}>
                            View Project
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: VERIFIED LEARNING RESOURCES */}
          {activeTab === 'resources' && (
            <div className="space-y-6">
              <div className="p-4 bg-white rounded-2xl border border-brand-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-brand-text">Verified Learning Resources for {activeRoleTitle}</h3>
                  <p className="text-xs text-brand-muted">
                    Curated official documentation, guides, and practical references. Track your progress with Start and Completed markers.
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  {['all', 'Documentation', 'Guide', 'Course'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setResourceFilter(type)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                        resourceFilter === type
                          ? 'bg-white text-brand-primary shadow-xs'
                          : 'text-brand-muted hover:text-brand-text'
                      }`}
                    >
                      {type === 'all' ? 'All Types' : type}
                    </button>
                  ))}
                </div>
              </div>

              {filteredResources.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-brand-border space-y-3">
                  <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs text-brand-muted">No resources match the selected filter.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredResources.map((res, idx) => {
                    const isUpdating = updatingResource === res.url;
                    return (
                      <div
                        key={res.url || idx}
                        className="p-5 bg-white rounded-3xl border border-brand-border shadow-card hover:border-brand-primary/30 transition-all flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-brand-primary">
                              {res.resource_type || 'Documentation'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              res.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : res.status === 'started'
                                ? 'bg-cyan-100 text-cyan-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {res.status === 'completed' ? 'Completed ✓' : res.status === 'started' ? 'In Progress ⚡' : 'Not Started'}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-brand-text leading-snug">{res.title}</h4>
                          <p className="text-xs text-brand-muted">
                            Develops competency in <strong>{res.skill_name}</strong> ({res.skill_category})
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <a
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-brand-primary hover:underline font-semibold flex items-center gap-1"
                          >
                            <span>Open Resource</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>

                          <div className="flex items-center gap-1.5">
                            {res.status !== 'started' && res.status !== 'completed' && (
                              <button
                                disabled={isUpdating}
                                onClick={() => handleResourceProgress(res.url, res.skill_name, 'started')}
                                className="px-2.5 py-1 rounded-lg bg-blue-50 text-brand-primary text-xs font-bold hover:bg-blue-100 transition-colors"
                              >
                                Start
                              </button>
                            )}
                            {res.status !== 'completed' && (
                              <button
                                disabled={isUpdating}
                                onClick={() => handleResourceProgress(res.url, res.skill_name, 'completed')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors"
                              >
                                Mark Done
                              </button>
                            )}
                            {res.status === 'completed' && (
                              <button
                                disabled={isUpdating}
                                onClick={() => handleResourceProgress(res.url, res.skill_name, 'started')}
                                className="px-2 py-1 rounded-lg text-slate-400 hover:text-slate-600 text-[11px] font-semibold"
                                title="Reset status"
                              >
                                Reset
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: EMBEDDED AI CAREER MENTOR */}
          {activeTab === 'mentor' && (
            <div className="bg-white rounded-3xl border border-brand-border shadow-card p-6 space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-primary to-blue-700 text-white flex items-center justify-center">
                    <BrainCircuit className="w-5 h-5 text-cyan-300" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-display text-brand-text">
                      AI Career Coach & Technical Mentor
                    </h3>
                    <p className="text-xs text-brand-muted">
                      Grounded in your {activeRoleTitle} roadmap, {confirmedSkills.length} confirmed skills, and platform project showcases.
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetChat}
                  leftIcon={RotateCcw}
                >
                  New Conversation
                </Button>
              </div>

              {/* Chat Messages */}
              <div className="h-[480px] overflow-y-auto space-y-3.5 pr-2 border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <Sparkles className="w-10 h-10 text-brand-primary mx-auto" />
                    <h4 className="text-sm font-bold text-brand-text">Ask Your AI Mentor Anything</h4>
                    <p className="text-xs text-brand-muted max-w-sm mx-auto">
                      Get guidance on which skills to tackle first, how to design portfolio projects, or preparing for technical interviews.
                    </p>
                    <Button variant="primary" size="sm" onClick={handleOpenMentorChat}>
                      Initialize Session
                    </Button>
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => {
                    const isUser = msg.role === 'user';
                    return (
                      <div key={idx} className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                        {!isUser && (
                          <div className="w-7 h-7 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center shrink-0 border border-blue-100 mt-0.5">
                            <Sparkles className="w-3.5 h-3.5 text-brand-primary" />
                          </div>
                        )}
                        <div
                          className={`max-w-[82%] rounded-2xl p-3.5 text-xs leading-relaxed space-y-1.5 ${
                            isUser
                              ? 'bg-gradient-to-r from-brand-primary to-blue-600 text-white rounded-br-xs shadow-xs'
                              : 'bg-white border border-slate-200 text-brand-text rounded-bl-xs shadow-xs'
                          }`}
                        >
                          {!isUser && msg.source && (
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-0.5 border-b border-slate-100 flex items-center justify-between">
                              <span>AI Mentor</span>
                              <span className="font-normal lowercase text-[10px] text-slate-400">{msg.source}</span>
                            </div>
                          )}
                          <div className="whitespace-pre-line break-words">{msg.content}</div>
                        </div>
                        {isUser && (
                          <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                            You
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                {chatLoading && (
                  <div className="flex gap-2.5 justify-start">
                    <div className="w-7 h-7 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center shrink-0 border border-blue-100 animate-pulse">
                      <Sparkles className="w-3.5 h-3.5 text-brand-primary" />
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-xs p-3 text-xs text-slate-500 shadow-xs flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-primary" />
                      <span>AI Mentor is analyzing your gaps & composing personalized guidance...</span>
                    </div>
                  </div>
                )}

                <div ref={chatMessagesEndRef} />
              </div>

              {/* Follow-up Prompts */}
              {suggestedFollowups.length > 0 && !chatLoading && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {suggestedFollowups.map((fu, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendChatMessage(fu)}
                      className="px-2.5 py-1 rounded-xl text-[11px] font-medium bg-blue-50 hover:bg-blue-100 text-brand-primary border border-blue-200/60 transition-colors"
                    >
                      {fu}
                    </button>
                  ))}
                </div>
              )}

              {/* Chat Input */}
              <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:border-brand-primary focus-within:bg-white transition-all">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleChatKeyDown}
                  placeholder={`Ask about ${activeRoleTitle} roadmap, prerequisites, or projects...`}
                  rows={2}
                  disabled={chatLoading}
                  className="w-full p-2 bg-transparent text-xs text-brand-text placeholder:text-slate-400 focus:outline-none resize-none font-medium"
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleSendChatMessage()}
                  disabled={!chatInput.trim() || chatLoading}
                  isLoading={chatLoading}
                  leftIcon={Send}
                  className="shrink-0 rounded-xl"
                >
                  Send
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL 1: TARGET ROLE SELECTION */}
      <Modal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        title="Personalize Your Target Role"
        size="lg"
      >
        <form onSubmit={handleSaveRole} className="space-y-5">
          <p className="text-xs text-brand-muted leading-relaxed">
            Select your desired career path. Your skill gaps, prioritized recommendations, and learning roadmap will adjust instantly to mirror market requirements.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-bold text-brand-text block">Career Role</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {COMMON_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={`p-2.5 rounded-xl text-xs font-bold text-left transition-all border ${
                    selectedRole === role
                      ? 'bg-blue-50 text-brand-primary border-brand-primary/60 shadow-xs'
                      : 'bg-slate-50/70 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {role}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSelectedRole('Other')}
                className={`p-2.5 rounded-xl text-xs font-bold text-left transition-all border ${
                  selectedRole === 'Other'
                    ? 'bg-blue-50 text-brand-primary border-brand-primary/60 shadow-xs'
                    : 'bg-slate-50/70 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Custom / Other...
              </button>
            </div>

            {selectedRole === 'Other' && (
              <input
                type="text"
                placeholder="Type your target role title..."
                value={customRoleInput}
                onChange={(e) => setCustomRoleInput(e.target.value)}
                className="w-full mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-brand-text focus:outline-none"
                required
              />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-text block">Experience Level</label>
              <select
                value={selectedExpLevel}
                onChange={(e) => setSelectedExpLevel(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-brand-text focus:outline-none"
              >
                {EXPERIENCE_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-text block">Preferred Work Mode</label>
              <select
                value={selectedWorkMode}
                onChange={(e) => setSelectedWorkMode(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-brand-text focus:outline-none"
              >
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Onsite">Onsite</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button variant="ghost" size="sm" type="button" onClick={() => setRoleModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={savingRole}>
              Save Target Role
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: EXTRACT SKILLS FROM RESUME */}
      <Modal
        isOpen={extractModalOpen}
        onClose={() => setExtractModalOpen(false)}
        title="Extract Skills from Resume"
        size="lg"
      >
        <div className="space-y-5">
          <p className="text-xs text-brand-muted leading-relaxed">
            Upload your PDF resume or select an existing resume from your account. Our engine will identify technical skills, libraries, and tools for your review before saving.
          </p>

          <div className="flex border-b border-slate-200 gap-2">
            <button
              onClick={() => setExtractMode('upload')}
              className={`pb-2 text-xs font-bold border-b-2 transition-all ${
                extractMode === 'upload' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-400'
              }`}
            >
              Upload PDF
            </button>
            <button
              onClick={() => setExtractMode('saved')}
              className={`pb-2 text-xs font-bold border-b-2 transition-all ${
                extractMode === 'saved' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-400'
              }`}
            >
              Select Saved Resume ({userResumes.length})
            </button>
            <button
              onClick={() => setExtractMode('paste')}
              className={`pb-2 text-xs font-bold border-b-2 transition-all ${
                extractMode === 'paste' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-400'
              }`}
            >
              Paste Text
            </button>
          </div>

          {extractError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{extractError}</span>
            </div>
          )}

          {extractMode === 'upload' && (
            <div className="space-y-3">
              <div className="p-6 border-2 border-dashed border-slate-300 hover:border-brand-primary rounded-2xl text-center space-y-2 cursor-pointer bg-slate-50/50">
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => setSelectedPdfFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="pdf-upload-input"
                />
                <label htmlFor="pdf-upload-input" className="cursor-pointer block">
                  <UploadCloud className="w-8 h-8 text-brand-primary mx-auto mb-1" />
                  <span className="text-xs font-bold text-brand-text block">
                    {selectedPdfFile ? selectedPdfFile.name : 'Click to upload your .PDF resume'}
                  </span>
                  <span className="text-[11px] text-slate-400">Standard ATS PDF up to 10MB</span>
                </label>
              </div>
            </div>
          )}

          {extractMode === 'saved' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-brand-text block">Choose Resume</label>
              {userResumes.length === 0 ? (
                <p className="text-xs text-brand-muted">
                  No saved resumes yet. Use the PDF upload option or build one in the Resume Builder.
                </p>
              ) : (
                <select
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-brand-text focus:outline-none"
                >
                  {userResumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title} ({r.template_id})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {extractMode === 'paste' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-brand-text block">Resume Plain Text</label>
              <textarea
                rows={5}
                placeholder="Paste the text from your resume here..."
                value={pastedResumeText}
                onChange={(e) => setPastedResumeText(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-brand-text focus:outline-none"
              />
            </div>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={handleExtractSkills}
            isLoading={extracting}
            className="w-full font-bold"
          >
            Scan & Extract Skills
          </Button>

          {/* Extracted Review Section */}
          {extractedSkills.length > 0 && (
            <div className="space-y-4 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-text">
                  Extracted {extractedSkills.length} Technical Competencies
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleConfirmExtractedSkills(extractedSkills)}
                >
                  Confirm & Save All Skills
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
                {extractedSkills.map((s, idx) => (
                  <span
                    key={idx}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold border flex items-center gap-1.5 ${
                      s.already_confirmed
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-white text-brand-text border-slate-200'
                    }`}
                  >
                    <span>{s.skill_name}</span>
                    <span className="text-[10px] text-slate-400">({s.category})</span>
                    {s.already_confirmed && <Check className="w-3 h-3 text-emerald-600" />}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Roles Based on Extracted Skills */}
          {extractedSuggestedRoles.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-text">
                    Roles You Fit According to Extracted Skills
                  </span>
                </div>
                <span className="text-[11px] text-brand-muted">
                  Ranked by resume match percentage
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto p-1">
                {extractedSuggestedRoles.slice(0, 4).map((role, idx) => {
                  const isCurrent = (targetRoleData?.target_role || selectedRole) === role.role_title;
                  return (
                    <div
                      key={role.role_title || idx}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                        role.is_recommended
                          ? 'bg-gradient-to-br from-blue-50/80 via-white to-cyan-50/30 border-blue-200 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h5 className="text-sm font-bold text-brand-text">
                                {role.role_title}
                              </h5>
                              {role.is_recommended && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                  Top Recommendation
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400">{role.domain}</span>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold border shrink-0 ${getFitLevelBadgeClass(
                              role.fit_level
                            )}`}
                          >
                            {formatMatchPercentage(role.match_percentage)} Match
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-brand-primary h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(role.match_percentage, 100)}%` }}
                          />
                        </div>

                        {/* Matched & Missing Skills summary */}
                        <div className="text-[11px] space-y-1 pt-1 text-slate-600">
                          {role.matched_skills?.length > 0 ? (
                            <p className="line-clamp-1">
                              <strong className="text-emerald-700">Matched ({role.matched_skills_count}):</strong>{' '}
                              {role.matched_skills.slice(0, 3).join(', ')}
                              {role.matched_skills.length > 3 ? ` +${role.matched_skills.length - 3} more` : ''}
                            </p>
                          ) : (
                            <p className="text-slate-400 italic">No direct essential matches yet</p>
                          )}
                          {role.missing_essential_skills?.length > 0 && (
                            <p className="line-clamp-1 text-slate-500">
                              <span className="font-semibold text-slate-600">Key Gaps:</span> {role.missing_essential_skills.slice(0, 2).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          {role.matched_skills_count} / {role.total_role_skills} skills
                        </span>

                        {isCurrent ? (
                          <span className="text-xs font-bold text-brand-primary flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Current Target Role
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleSelectSuggestedRole(role.role_title)}
                            disabled={savingRole}
                            className="text-xs font-bold"
                          >
                            Set as Target Role
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* MODAL 3: AI CAREER MENTOR CHAT */}
      <Modal
        isOpen={mentorChatOpen}
        onClose={() => setMentorChatOpen(false)}
        title="AI Engineering Career Mentor"
        size="xl"
      >
        <div className="flex flex-col h-[600px] max-h-[75vh]">
          {/* Context Header */}
          <div className="p-3 bg-gradient-to-r from-blue-900 to-brand-primary rounded-2xl text-white flex items-center justify-between shadow-xs mb-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-cyan-300">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-tight">
                  {activeRoleTitle} Track
                </p>
                <p className="text-[11px] text-blue-200">
                  {gapData?.coverage_percentage ?? 0}% coverage • {confirmedSkills.length} confirmed skills
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetChat}
                className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-white/10 hover:bg-white/20 text-blue-100 flex items-center gap-1 transition-colors"
                title="Start a new conversation"
              >
                <RotateCcw className="w-3 h-3" />
                <span>New Chat</span>
              </button>
            </div>
          </div>

          {/* Chat Messages Stream */}
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 scrollbar-thin">
            {chatMessages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={idx}
                  className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center shrink-0 border border-blue-100 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-brand-primary" />
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] rounded-2xl p-3.5 text-xs leading-relaxed space-y-1.5 ${
                      isUser
                        ? 'bg-gradient-to-r from-brand-primary to-blue-600 text-white rounded-br-xs shadow-xs'
                        : 'bg-white border border-slate-200 text-brand-text rounded-bl-xs shadow-xs'
                    }`}
                  >
                    {!isUser && msg.source && (
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-0.5 border-b border-slate-100 flex items-center justify-between">
                        <span>AI Mentor</span>
                        <span className="font-normal lowercase text-[10px] text-slate-400">
                          {msg.source}
                        </span>
                      </div>
                    )}
                    <div className="whitespace-pre-line break-words">{msg.content}</div>
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                      You
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading Indicator */}
            {chatLoading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center shrink-0 border border-blue-100 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 text-brand-primary" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-xs p-3 text-xs text-slate-500 shadow-xs flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-primary" />
                  <span>AI Mentor is analyzing your gaps & composing guidance...</span>
                </div>
              </div>
            )}

            {/* Error Message with Retry */}
            {chatError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{chatError}</span>
                </div>
                <button
                  onClick={() => {
                    const lastUser = [...chatMessages].reverse().find((m) => m.role === 'user');
                    if (lastUser) handleSendChatMessage(lastUser.content);
                  }}
                  className="px-2.5 py-1 bg-red-100 hover:bg-red-200 rounded-lg font-bold text-red-800 text-[11px] shrink-0"
                >
                  Retry
                </button>
              </div>
            )}

            <div ref={chatMessagesEndRef} />
          </div>

          {/* Follow-up Suggestions Chips */}
          {suggestedFollowups.length > 0 && !chatLoading && (
            <div className="pt-2 pb-2 flex flex-wrap gap-1.5 shrink-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-1 block w-full">
                Suggested Questions:
              </span>
              {suggestedFollowups.map((fu, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendChatMessage(fu)}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-medium bg-blue-50/80 hover:bg-blue-100 text-brand-primary border border-blue-200/60 transition-colors text-left"
                >
                  {fu}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="pt-2 border-t border-slate-100 shrink-0 space-y-1.5">
            <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-1.5 focus-within:border-brand-primary focus-within:bg-white transition-all">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleChatKeyDown}
                placeholder={`Ask about ${activeRoleTitle} roadmap, prerequisites, or projects... (Enter to send)`}
                rows={2}
                disabled={chatLoading}
                className="w-full p-2 bg-transparent text-xs text-brand-text placeholder:text-slate-400 focus:outline-none resize-none font-medium"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleSendChatMessage()}
                disabled={!chatInput.trim() || chatLoading}
                isLoading={chatLoading}
                leftIcon={Send}
                className="shrink-0 rounded-xl"
              >
                Send
              </Button>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
              <span>Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for new line</span>
              <span>Grounded in verified platform records</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
