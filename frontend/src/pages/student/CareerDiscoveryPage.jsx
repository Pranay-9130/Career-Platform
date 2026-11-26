import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  BrainCircuit,
  FolderGit2,
  BookOpen,
  Briefcase,
  FileText,
  Send,
  ExternalLink,
  RotateCcw,
  AlertCircle,
  GraduationCap,
  Target,
  Layers,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { careerDiscoveryService } from '@/services/careerDiscoveryService';
import { Button, Badge, Card } from '@/components/common';

const AVAILABLE_INTERESTS = [
  { id: 'web-dev', name: 'Web Development', desc: 'Modern responsive SPAs & PWAs' },
  { id: 'python-dev', name: 'Python Development', desc: 'APIs, scripting & backend systems' },
  { id: 'java-dev', name: 'Java Development', desc: 'Enterprise backends & distributed apps' },
  { id: 'fullstack-dev', name: 'Full Stack Development', desc: 'End-to-end frontend & backend architectures' },
  { id: 'data-ai', name: 'Data Science & AI', desc: 'Analytics, statistical modeling & LLMs' },
  { id: 'ml-eng', name: 'Machine Learning', desc: 'Predictive models & deep learning pipelines' },
  { id: 'cloud-devops', name: 'Cloud & DevOps', desc: 'CI/CD, containers & cloud infrastructure' },
  { id: 'cybersecurity', name: 'Cybersecurity', desc: 'Network security, secure auth & audit' },
  { id: 'mobile-dev', name: 'Mobile App Development', desc: 'Cross-platform Android & iOS apps' },
  { id: 'qa-testing', name: 'Software Quality & Testing', desc: 'Automated testing, integration & QA' },
];

const COMMON_SKILLS = [
  'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'SQL', 'PostgreSQL',
  'React', 'Node.js', 'FastAPI', 'Django', 'Spring Boot', 'HTML', 'CSS',
  'Tailwind CSS', 'Docker', 'Git', 'AWS', 'MongoDB', 'REST APIs',
];

export default function CareerDiscoveryPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Discovery state from backend
  const [discoveryState, setDiscoveryState] = useState(null);

  // Active view: 'questionnaire' | 'assessment' | 'results'
  const [viewMode, setViewMode] = useState('questionnaire');

  // Questionnaire step (1 to 5)
  const [currentStep, setCurrentStep] = useState(1);

  // Form states
  const [education, setEducation] = useState({
    college_name: '',
    degree: '',
    branch: '',
    current_year: '3rd Year',
    graduation_year: 2026,
  });

  const [interests, setInterests] = useState([]);
  const [skillLevel, setSkillLevel] = useState('beginner');
  const [skills, setSkills] = useState([]);
  const [newSkillInput, setNewSkillInput] = useState('');

  const [careerGoals, setCareerGoals] = useState({
    target_timing: 'internship_now',
    work_preference: 'Hybrid',
    target_companies: ['Product-based', 'Startups'],
  });

  const [learningPrefs, setLearningPrefs] = useState({
    style: 'project_based',
    weekly_hours: '10-15 hrs',
  });

  // Assessment questions & answers
  const [assessmentQuestions, setAssessmentQuestions] = useState([]);
  const [assessmentAnswers, setAssessmentAnswers] = useState({});
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);

  // Active tab in results view
  const [resultsTab, setResultsTab] = useState('roadmap'); // 'roadmap' | 'roles' | 'projects' | 'jobs'

  // Load initial discovery state
  useEffect(() => {
    fetchDiscovery();
  }, []);

  const fetchDiscovery = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await careerDiscoveryService.getStatus();
      setDiscoveryState(data);

      if (data.status === 'completed') {
        setViewMode('results');
      } else if (data.status === 'assessment_ready' && data.assessment_questions?.length > 0) {
        setAssessmentQuestions(data.assessment_questions);
        setAssessmentAnswers(data.assessment_answers || {});
        setViewMode('assessment');
      } else {
        setViewMode('questionnaire');
        setCurrentStep(data.current_step || 1);
      }

      // Populate existing fields
      if (data.education_info) setEducation((prev) => ({ ...prev, ...data.education_info }));
      if (data.technical_interests) setInterests(data.technical_interests);
      if (data.skill_level) setSkillLevel(data.skill_level);
      if (data.self_reported_skills) setSkills(data.self_reported_skills);
      if (data.career_goals) setCareerGoals((prev) => ({ ...prev, ...data.career_goals }));
      if (data.learning_preferences) setLearningPrefs((prev) => ({ ...prev, ...data.learning_preferences }));
    } catch (err) {
      console.error('Failed to load career discovery:', err);
      setError('Could not load your career discovery profile. Please refresh and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInterestToggle = (name) => {
    setInterests((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]
    );
  };

  const handleSkillAdd = (skillName) => {
    const trimmed = skillName.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed]);
    }
    setNewSkillInput('');
  };

  const handleSkillRemove = (skillName) => {
    setSkills((prev) => prev.filter((s) => s !== skillName));
  };

  const handleSaveStep = async (nextStep) => {
    try {
      setSubmitting(true);
      const payload = {
        current_step: nextStep,
        education_info: education,
        technical_interests: interests,
        skill_level: skillLevel,
        self_reported_skills: skills,
        career_goals: careerGoals,
        learning_preferences: learningPrefs,
      };
      const updated = await careerDiscoveryService.saveProgress(payload);
      setDiscoveryState(updated);
      setCurrentStep(nextStep);
    } catch (err) {
      console.error('Failed to save progress:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartAssessment = async () => {
    try {
      setSubmitting(true);
      setError(null);
      // Save Step 5 first
      await careerDiscoveryService.saveProgress({
        current_step: 5,
        education_info: education,
        technical_interests: interests,
        skill_level: skillLevel,
        self_reported_skills: skills,
        career_goals: careerGoals,
        learning_preferences: learningPrefs,
      });

      // Generate customized questions
      const res = await careerDiscoveryService.generateAssessment();
      setAssessmentQuestions(res.questions);
      setAssessmentAnswers({});
      setCurrentQuestionIdx(0);
      setViewMode('assessment');
    } catch (err) {
      console.error('Failed to generate assessment:', err);
      setError('Failed to prepare your assessment questions. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectAnswer = (qId, optionId) => {
    setAssessmentAnswers((prev) => ({
      ...prev,
      [qId]: optionId,
    }));
  };

  const handleSubmitAssessment = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const res = await careerDiscoveryService.submitAssessment(assessmentAnswers);
      setDiscoveryState(res);
      setViewMode('results');
    } catch (err) {
      console.error('Failed to submit assessment:', err);
      setError(
        err.response?.data?.detail ||
          'An error occurred while evaluating your assessment. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoadmapToggle = async (stageId, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'in_progress' : 'completed';
    try {
      const res = await careerDiscoveryService.updateRoadmapStage(stageId, newStatus);
      if (res.roadmap) {
        setDiscoveryState((prev) => ({
          ...prev,
          roadmap_progress: res.roadmap,
        }));
      }
    } catch (err) {
      console.error('Failed to update roadmap:', err);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to retake Career Discovery? Your existing roadmap will be updated with your new responses.')) {
      return;
    }
    try {
      setLoading(true);
      const res = await careerDiscoveryService.resetDiscovery();
      setDiscoveryState(res);
      setViewMode('questionnaire');
      setCurrentStep(1);
    } catch (err) {
      console.error('Failed to reset discovery:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 animate-spin">
          <Compass className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-slate-600">Loading your personalized career discovery workspace...</p>
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: RESULTS & PERSONALIZED ROADMAP
  // =========================================================================
  if (viewMode === 'results') {
    if (!discoveryState?.recommendations) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 animate-spin">
            <Compass className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-600">Generating your personalized roadmap...</p>
        </div>
      );
    }
    const { primary_role, recommended_roles, recommended_projects, recommended_preparation, matched_jobs, roadmap } =
      discoveryState.recommendations;
    const assessmentResult = discoveryState.assessment_result || {};
    const roadmapList = discoveryState.roadmap_progress || roadmap || [];
    const completedStages = roadmapList.filter((s) => s.status === 'completed').length;
    const progressPercent = Math.round((completedStages / (roadmapList.length || 7)) * 100);

    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-200">
        {/* Header Profile Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-bold uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5 text-indigo-400" />
                <span>Your Personalized Career Profile</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Recommended Path: <span className="text-indigo-300">{primary_role?.role_name || 'Software Engineer'}</span>
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
                {primary_role?.description || 'Your technical strengths and declared interests indicate a high alignment with this engineering track.'}
              </p>

              {/* Assessment Score Pills */}
              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md text-xs font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Match Score: <strong>{primary_role?.match_percentage || 85}%</strong></span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md text-xs font-semibold flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-cyan-400" />
                  <span>Assessment: <strong>{assessmentResult.score ?? 0}/{assessmentResult.total ?? 0} ({assessmentResult.accuracy_percentage ?? 0}%)</strong></span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md text-xs font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Level: <strong>{assessmentResult.level_label || 'Developing'}</strong></span>
                </div>
              </div>
            </div>

            {/* Retake CTA */}
            <div className="flex sm:flex-col items-center lg:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t border-white/10 lg:border-t-0">
              <Button
                variant="outline"
                size="sm"
                leftIcon={RotateCcw}
                onClick={handleReset}
                className="text-white border-white/30 hover:bg-white/10 text-xs font-semibold"
              >
                Retake Discovery
              </Button>
              <div className="text-right">
                <p className="text-[11px] text-slate-400">Roadmap Progress</p>
                <p className="text-sm font-black text-white">{completedStages} of {roadmapList.length} Steps ({progressPercent}%)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 flex items-center gap-2 overflow-x-auto pb-1 text-xs sm:text-sm font-semibold">
          <button
            type="button"
            onClick={() => setResultsTab('roadmap')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              resultsTab === 'roadmap'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>My Career Roadmap ({completedStages}/{roadmapList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setResultsTab('roles')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              resultsTab === 'roles'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Target className="w-4 h-4 text-cyan-600" />
            <span>Matched Career Paths ({recommended_roles?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setResultsTab('projects')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              resultsTab === 'projects'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FolderGit2 className="w-4 h-4 text-amber-600" />
            <span>Recommended Projects & Prep</span>
          </button>

          <button
            type="button"
            onClick={() => setResultsTab('jobs')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              resultsTab === 'jobs'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Briefcase className="w-4 h-4 text-emerald-600" />
            <span>Matched Opportunities ({matched_jobs?.length || 0})</span>
          </button>
        </div>

        {/* TAB 1: 7-STAGE ACTIONABLE ROADMAP */}
        {resultsTab === 'roadmap' && (
          <div className="space-y-4">
            <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 space-y-1">
                <p className="font-bold text-slate-900">Your Structured 7-Stage Career Roadmap</p>
                <p className="text-slate-600 leading-relaxed">
                  Each stage connects directly into verified AspirePath tools. Click on any stage to execute the preparation action or mark it complete as you progress.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {roadmapList.map((stage) => {
                const isCompleted = stage.status === 'completed';
                return (
                  <div
                    key={stage.stage_id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isCompleted
                        ? 'bg-slate-50/60 border-slate-200 opacity-80'
                        : 'bg-white border-slate-200 shadow-xs hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <button
                        type="button"
                        onClick={() => handleRoadmapToggle(stage.stage_id, stage.status)}
                        className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors focus:outline-none"
                        title={isCompleted ? 'Mark as in progress' : 'Mark as completed'}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                        ) : (
                          <Circle className="w-6 h-6 text-slate-300 hover:text-emerald-500" />
                        )}
                      </button>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                            Stage {stage.stage_id}
                          </span>
                          <h3 className={`text-sm sm:text-base font-bold ${isCompleted ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            {stage.title}
                          </h3>
                          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {stage.estimated_time}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                          {stage.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 sm:self-center shrink-0 pl-9 sm:pl-0">
                      <Link to={stage.target_route}>
                        <Button
                          variant={isCompleted ? 'secondary' : 'gradient'}
                          size="sm"
                          rightIcon={ArrowRight}
                          className="text-xs font-semibold whitespace-nowrap"
                        >
                          {stage.action_label}
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: MATCHED CAREER PATHS */}
        {resultsTab === 'roles' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommended_roles?.map((role, idx) => (
              <div
                key={role.role_name}
                className={`bg-white rounded-2xl border p-5 flex flex-col justify-between space-y-4 shadow-xs transition-all ${
                  idx === 0 ? 'border-indigo-300 ring-2 ring-indigo-500/20' : 'border-slate-200 hover:border-indigo-200'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                      {idx === 0 ? 'Top Match' : `Option ${idx + 1}`}
                    </span>
                    <span className="text-xs font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                      {role.match_percentage}% Fit
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-slate-900">{role.role_name}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-3">
                      {role.description}
                    </p>
                  </div>

                  {/* Skills Ready */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Ready Skills ({role.matched_skills?.length || 0})</p>
                    <div className="flex flex-wrap gap-1">
                      {role.matched_skills?.length > 0 ? (
                        role.matched_skills.map((s) => (
                          <span key={s} className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-400">None declared yet</span>
                      )}
                    </div>
                  </div>

                  {/* Missing Gap Skills */}
                  <div className="space-y-1.5 pt-1">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Skills to Build ({role.missing_skills?.length || 0})</p>
                    <div className="flex flex-wrap gap-1">
                      {role.missing_skills?.slice(0, 4).map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-semibold border border-amber-200">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <Link to="/skill-intelligence" className="pt-2">
                  <Button variant="outline" size="sm" fullWidth className="text-xs font-semibold text-brand-primary">
                    Open Skill Matrix
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: RECOMMENDED PROJECTS & INTERVIEW PREP */}
        {resultsTab === 'projects' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <FolderGit2 className="w-4 h-4 text-brand-primary" />
                  <span>Showcase Projects That Build Your Missing Skills</span>
                </h3>
                <Link to="/projects" className="text-xs font-semibold text-brand-primary hover:underline">
                  Browse All Blueprints &rarr;
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {recommended_projects?.length > 0 ? (
                  recommended_projects.map((proj) => (
                    <div
                      key={proj.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between space-y-3 shadow-xs hover:border-indigo-300 transition-all"
                    >
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-brand-primary border border-blue-100">
                          {proj.why_recommended}
                        </span>
                        <h4 className="font-bold text-xs text-slate-900 line-clamp-2 mt-1">{proj.title}</h4>
                        <p className="text-[11px] text-slate-400 font-mono truncate">{proj.tech_stack}</p>
                      </div>
                      <Link to={`/projects/${proj.slug || proj.id}`}>
                        <Button variant="outline" size="sm" fullWidth className="text-xs font-semibold text-brand-primary">
                          View Project Blueprint
                        </Button>
                      </Link>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 col-span-4">No specific projects found. Explore our project library!</p>
                )}
              </div>
            </div>

            {/* Preparation Materials */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span>Placement Interview PDF Guides</span>
                </h3>
                <Link to="/placement-preparation" className="text-xs font-semibold text-brand-primary hover:underline">
                  View Placement Center &rarr;
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {recommended_preparation?.map((prep) => (
                  <Link
                    key={prep.id}
                    to="/placement-preparation"
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:bg-emerald-50/40 hover:border-emerald-200 transition-all flex items-center justify-between group"
                  >
                    <div className="space-y-1 min-w-0 pr-2">
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">
                        PDF Guide
                      </span>
                      <p className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                        {prep.title}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MATCHED OPPORTUNITIES */}
        {resultsTab === 'jobs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">Opportunities Matched to Your Profile</h3>
                <p className="text-xs text-slate-500">Verified vacancies matching your declared skills and graduation batch.</p>
              </div>
              <Link to="/jobs" className="text-xs font-semibold text-brand-primary hover:underline">
                View All Jobs &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {matched_jobs?.length > 0 ? (
                matched_jobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between space-y-4 shadow-xs hover:border-indigo-300 transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                          {job.match_score}% Profile Match
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">{job.job_type || 'Full-time'}</span>
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-slate-900 leading-tight">{job.title}</h4>
                        <p className="text-xs text-slate-600 font-medium mt-0.5">{job.company_name} • {job.location}</p>
                      </div>

                      {job.matching_skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          <span className="text-[10px] text-slate-400 font-medium">Matches:</span>
                          {job.matching_skills.map((s) => (
                            <span key={s} className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-100">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-medium">{job.work_mode || 'Hybrid'}</span>
                      <a
                        href={job.apply_url || '/jobs'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:underline"
                      >
                        <span>Apply Directly</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 col-span-2">No direct jobs matched currently. Explore our open jobs catalog!</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: INDICATIVE SKILL ASSESSMENT (5–7 Questions)
  // =========================================================================
  if (viewMode === 'assessment' && assessmentQuestions.length > 0) {
    const totalQ = assessmentQuestions.length;
    const currentQ = assessmentQuestions[currentQuestionIdx];
    const answeredCount = Object.keys(assessmentAnswers).length;
    const isLastQuestion = currentQuestionIdx === totalQ - 1;

    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-200">
        {/* Assessment Progress Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5 text-brand-primary font-bold">
              <BrainCircuit className="w-4 h-4" />
              <span>Indicative Assessment: Question {currentQuestionIdx + 1} of {totalQ}</span>
            </span>
            <span>{answeredCount} answered</span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-primary to-indigo-600 transition-all duration-300"
              style={{ width: `${((currentQuestionIdx + 1) / totalQ) * 100}%` }}
            />
          </div>
        </div>

        {/* Disclaimer Card */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p>
            This 5-question indicative assessment identifies your conceptual readiness and domain gaps. It is used strictly for personalized guidance and is not an official test.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl flex items-center gap-3 text-xs sm:text-sm animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Question Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-card">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-50 text-brand-primary border border-blue-100 font-mono">
                {currentQ.domain}
              </span>
              <span className="text-[11px] text-slate-400 font-medium capitalize">
                {currentQ.difficulty} Level
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {currentQ.question}
            </h2>
          </div>

          {/* Options List */}
          <div className="space-y-2.5">
            {currentQ.options?.map((opt) => {
              const isSelected = assessmentAnswers[currentQ.id] === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectAnswer(currentQ.id, opt.id)}
                  className={`w-full text-left p-4 rounded-2xl border text-xs sm:text-sm font-medium transition-all flex items-center justify-between group ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                      }`}
                    >
                      {opt.id}
                    </span>
                    <span>{opt.text}</span>
                  </div>
                  {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Question Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              leftIcon={ArrowLeft}
              disabled={currentQuestionIdx === 0}
              onClick={() => setCurrentQuestionIdx((p) => p - 1)}
              className="text-xs font-semibold"
            >
              Previous
            </Button>

            {isLastQuestion ? (
              <Button
                variant="gradient"
                size="sm"
                rightIcon={Sparkles}
                disabled={submitting}
                onClick={handleSubmitAssessment}
                className="text-xs font-bold px-5"
              >
                {submitting ? 'Evaluating...' : 'Complete & Generate Roadmap'}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                rightIcon={ArrowRight}
                onClick={() => setCurrentQuestionIdx((p) => p + 1)}
                className="text-xs font-semibold px-5"
              >
                Next Question
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: 5-STEP QUESTIONNAIRE
  // =========================================================================
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Intro Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider">
          <Compass className="w-3.5 h-3.5 text-indigo-600" />
          <span>Interactive Career Discovery</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Discover Your Personalized Career Path
        </h1>
        <p className="text-slate-600 text-xs sm:text-sm max-w-xl mx-auto">
          Takes only 3–5 minutes. Answer a few questions about your technical interests, skill background, and goals to unlock your tailored 7-stage roadmap.
        </p>
      </div>

      {/* 5-Step Progress Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-2">
          <span>Step {currentStep} of 5</span>
          <span className="text-brand-primary">
            {currentStep === 1 && 'Education Background'}
            {currentStep === 2 && 'Technical Interests'}
            {currentStep === 3 && 'Skill Level & Known Technologies'}
            {currentStep === 4 && 'Career Aspirations'}
            {currentStep === 5 && 'Learning Preferences'}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-brand-primary transition-all duration-300"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Container Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-card">
        {/* STEP 1: EDUCATION */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Education Information</h2>
              <p className="text-xs text-slate-500">Provide your college details to calibrate placement timelines and eligible hiring drives.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700">College / University Name</label>
                <input
                  type="text"
                  value={education.college_name}
                  onChange={(e) => setEducation({ ...education, college_name: e.target.value })}
                  placeholder="e.g. JNTU Hyderabad / National Institute of Technology"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Degree</label>
                <input
                  type="text"
                  value={education.degree}
                  onChange={(e) => setEducation({ ...education, degree: e.target.value })}
                  placeholder="e.g. B.Tech / B.E. / BCA / M.Tech"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Branch / Department</label>
                <input
                  type="text"
                  value={education.branch}
                  onChange={(e) => setEducation({ ...education, branch: e.target.value })}
                  placeholder="e.g. Computer Science / IT / AI & ML"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Current Academic Year</label>
                <select
                  value={education.current_year}
                  onChange={(e) => setEducation({ ...education, current_year: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 bg-white"
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year (Final Year)</option>
                  <option value="Graduated">Recent Graduate</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Graduation Year</label>
                <input
                  type="number"
                  value={education.graduation_year}
                  onChange={(e) => setEducation({ ...education, graduation_year: parseInt(e.target.value, 10) || 2026 })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: TECHNICAL INTERESTS */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Technical Interests</h2>
              <p className="text-xs text-slate-500">Select one or more domains you are passionate about or want to explore.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {AVAILABLE_INTERESTS.map((item) => {
                const isSelected = interests.includes(item.name);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleInterestToggle(item.name)}
                    className={`text-left p-3.5 rounded-2xl border text-xs transition-all flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-sm text-slate-900">{item.name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                    {isSelected ? (
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: SKILL LEVEL & SKILLS */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Current Skill Level & Tools</h2>
              <p className="text-xs text-slate-500">Help us tailor question difficulty and gap analysis accurately.</p>
            </div>

            {/* Skill Level Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Where would you place yourself currently?</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'beginner', title: 'Beginner', desc: 'Starting out, learning syntax and fundamentals.' },
                  { id: 'intermediate', title: 'Intermediate', desc: 'Can build functional apps, know basic APIs and SQL.' },
                  { id: 'advanced', title: 'Advanced', desc: 'Comfortable with system design, testing, and deployment.' },
                ].map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setSkillLevel(tier.id)}
                    className={`text-left p-3.5 rounded-2xl border transition-all ${
                      skillLevel === tier.id
                        ? 'border-brand-primary bg-blue-50/70 text-brand-primary ring-2 ring-brand-primary/20 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <p className="font-bold text-xs">{tier.title}</p>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{tier.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Self-reported skills */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-700">Technologies and skills you have used:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSkillAdd(newSkillInput))}
                  placeholder="Type a skill (e.g. Python, React) and press Enter"
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSkillAdd(newSkillInput)}
                  className="text-xs font-semibold px-4"
                >
                  Add
                </Button>
              </div>

              {/* Selected Skill Pills */}
              <div className="flex flex-wrap gap-1.5 pt-2 min-h-[36px]">
                {skills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold"
                  >
                    <span>{s}</span>
                    <button
                      type="button"
                      onClick={() => handleSkillRemove(s)}
                      className="text-indigo-400 hover:text-indigo-600 focus:outline-none text-xs"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>

              {/* Quick Suggestion Pills */}
              <div className="space-y-1 pt-1">
                <p className="text-[10px] font-bold uppercase text-slate-400">Quick Add Suggestions:</p>
                <div className="flex flex-wrap gap-1">
                  {COMMON_SKILLS.filter((s) => !skills.includes(s)).slice(0, 8).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSkillAdd(s)}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-semibold transition-colors"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: CAREER GOALS */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Career Aspirations & Preferences</h2>
              <p className="text-xs text-slate-500">Define your immediate targets to filter relevant vacancies and timelines.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">What is your primary current focus?</label>
                <select
                  value={careerGoals.target_timing}
                  onChange={(e) => setCareerGoals({ ...careerGoals, target_timing: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-brand-primary bg-white"
                >
                  <option value="internship_now">Securing a Summer / Winter Internship</option>
                  <option value="full_time_grad">Securing an Entry-Level Full-Time Software Job</option>
                  <option value="skill_building">Strengthening Projects and Resume First</option>
                  <option value="higher_studies">Preparing for Technical Assessment Drives</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Work Mode Preference</label>
                <div className="grid grid-cols-3 gap-3 mt-1">
                  {['Hybrid', 'Remote', 'On-site'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setCareerGoals({ ...careerGoals, work_preference: mode })}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                        careerGoals.work_preference === mode
                          ? 'border-brand-primary bg-blue-50 text-brand-primary ring-2 ring-brand-primary/20'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: LEARNING PREFERENCES */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Learning Preferences</h2>
              <p className="text-xs text-slate-500">How do you learn best, and how much time can you dedicate weekly?</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Preferred Learning Style</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                  {[
                    { id: 'project_based', title: 'Hands-on Project Building', desc: 'Building full blueprints with code and diagrams.' },
                    { id: 'interview_guides', title: 'Curated Topic Guides & PDFs', desc: 'Question banks, interview answers, and cheat sheets.' },
                  ].map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setLearningPrefs({ ...learningPrefs, style: style.id })}
                      className={`text-left p-3.5 rounded-2xl border text-xs transition-all ${
                        learningPrefs.style === style.id
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <p className="font-bold text-xs">{style.title}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{style.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Available Weekly Commitment</label>
                <select
                  value={learningPrefs.weekly_hours}
                  onChange={(e) => setLearningPrefs({ ...learningPrefs, weekly_hours: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-brand-primary bg-white"
                >
                  <option value="5-10 hrs">5–10 hours / week (Balanced with college exams)</option>
                  <option value="10-15 hrs">10–15 hours / week (Recommended for rapid growth)</option>
                  <option value="15-25 hrs">15–25 hours / week (Intensive placement boot)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step Navigation Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <Button
            variant="outline"
            size="sm"
            leftIcon={ArrowLeft}
            disabled={currentStep === 1 || submitting}
            onClick={() => setCurrentStep((p) => Math.max(1, p - 1))}
            className="text-xs font-semibold"
          >
            Back
          </Button>

          {currentStep < 5 ? (
            <Button
              variant="primary"
              size="sm"
              rightIcon={ArrowRight}
              disabled={submitting}
              onClick={() => handleSaveStep(currentStep + 1)}
              className="text-xs font-semibold px-5"
            >
              Save & Next
            </Button>
          ) : (
            <Button
              variant="gradient"
              size="sm"
              rightIcon={Sparkles}
              disabled={submitting}
              onClick={handleStartAssessment}
              className="text-xs font-bold px-5"
            >
              {submitting ? 'Preparing Assessment...' : 'Start Indicative Assessment'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
