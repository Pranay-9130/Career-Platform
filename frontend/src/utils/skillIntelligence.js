/**
 * Skill Intelligence Helper Utilities
 */

export const SKILL_STATUS_OPTIONS = [
  'Not Started',
  'Learning',
  'Practiced',
  'Completed',
];

export const calculateStageProgress = (skills = []) => {
  if (!skills || skills.length === 0) return 0;
  const completed = skills.filter((s) => s.current_status === 'Completed').length;
  return Math.round((completed / skills.length) * 100);
};

export const getPriorityBadgeClass = (priority) => {
  switch (priority) {
    case 'High':
      return 'bg-rose-50 text-rose-600 border-rose-100';
    case 'Medium':
      return 'bg-amber-50 text-amber-700 border-amber-100';
    case 'Low':
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
};

export const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'Completed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Practiced':
      return 'bg-cyan-50 text-brand-cyan border-cyan-200';
    case 'Learning':
      return 'bg-blue-50 text-brand-primary border-blue-200';
    case 'Not Started':
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200';
  }
};

export const normalizeRoleTitle = (role) => {
  if (!role || typeof role !== 'string') return 'Software Engineer';
  return role.trim();
};

export const getFitLevelBadgeClass = (fitLevel) => {
  switch (fitLevel) {
    case 'Strong Match':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Good Fit':
      return 'bg-blue-50 text-brand-primary border-blue-200';
    case 'Moderate Fit':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Developing':
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
};

export const formatMatchPercentage = (pct) => {
  const num = typeof pct === 'number' ? pct : parseFloat(pct) || 0;
  return `${Math.round(num)}%`;
};
