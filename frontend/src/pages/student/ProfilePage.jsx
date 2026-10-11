import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  GraduationCap,
  Sparkles,
  Globe,
  Github,
  Linkedin,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  Save,
  RotateCcw,
  ShieldCheck,
  Award,
  Plus,
  X,
  Camera,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { userService } from '@/services/userService';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Textarea from '@/components/common/Textarea';
import Badge from '@/components/common/Badge';
import Skeleton from '@/components/common/Skeleton';

const POPULAR_SKILLS = [
  'React',
  'TypeScript',
  'Python',
  'FastAPI',
  'Node.js',
  'PostgreSQL',
  'Docker',
  'Tailwind CSS',
  'AWS',
  'Git',
  'GraphQL',
  'Next.js',
];

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    headline: '',
    bio: '',
    avatar_url: '',
    university: '',
    degree: '',
    graduation_year: '',
    github_url: '',
    linkedin_url: '',
    portfolio_url: '',
    skills: [],
  });

  const [initialData, setInitialData] = useState(null);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [newSkillInput, setNewSkillInput] = useState('');

  // Fetch profile on mount
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userService.getProfile();
      const populated = {
        full_name: data.full_name || '',
        username: data.username || '',
        headline: data.headline || '',
        bio: data.bio || '',
        avatar_url: data.avatar_url || '',
        university: data.university || '',
        degree: data.degree || '',
        graduation_year: data.graduation_year ? String(data.graduation_year) : '',
        github_url: data.github_url || '',
        linkedin_url: data.linkedin_url || '',
        portfolio_url: data.portfolio_url || '',
        skills: Array.isArray(data.skills) ? data.skills : [],
      };
      setFormData(populated);
      setInitialData(populated);
      setCompletionPercentage(data.completion_percentage || 0);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(
        err.response?.data?.detail ||
          'Failed to load profile details. Please refresh the page.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSuccessMessage(null);
  };

  const handleAddSkill = (skillToAdd) => {
    const trimmed = (skillToAdd || newSkillInput).trim();
    if (!trimmed) return;
    if (formData.skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setNewSkillInput('');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      skills: [...prev.skills, trimmed],
    }));
    setNewSkillInput('');
    setSuccessMessage(null);
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
    setSuccessMessage(null);
  };

  const handleCopyPublicLink = () => {
    const publicUrl = `${window.location.origin}/u/${formData.username}`;
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleReset = () => {
    if (initialData) {
      setFormData(initialData);
      setSuccessMessage(null);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload = {
        full_name: formData.full_name,
        username: formData.username.trim().toLowerCase(),
        headline: formData.headline,
        bio: formData.bio,
        avatar_url: formData.avatar_url || null,
        university: formData.university || null,
        degree: formData.degree || null,
        graduation_year: formData.graduation_year ? parseInt(formData.graduation_year, 10) : null,
        github_url: formData.github_url || null,
        linkedin_url: formData.linkedin_url || null,
        portfolio_url: formData.portfolio_url || null,
        skills: formData.skills,
      };

      const updated = await userService.updateProfile(payload);

      setCompletionPercentage(updated.completion_percentage || 0);
      setInitialData(formData);
      setSuccessMessage('Profile details successfully updated and saved!');

      // Synchronize auth context user state for consistent navbar/sidebar display
      updateUser({
        full_name: updated.full_name,
        headline: updated.headline,
        avatar_url: updated.avatar_url,
      });
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(
        err.response?.data?.detail ||
          'Failed to update profile. Please verify your fields and try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  // Get user initials for fallback avatar
  const getInitials = (name) => {
    if (!name) return 'ST';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* 1. Header Banner & Identity Overview */}
      <div className="bg-white rounded-card border border-brand-border shadow-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative group">
            {formData.avatar_url ? (
              <img
                src={formData.avatar_url}
                alt={formData.full_name || 'Profile'}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-brand-primary/20 shadow-xs"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-brand-primary to-brand-cyan text-white flex items-center justify-center font-display font-bold text-xl sm:text-2xl shadow-xs">
                {getInitials(formData.full_name)}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-display font-extrabold text-brand-text">
                {loading ? <Skeleton className="h-6 w-36" /> : formData.full_name || 'Your Name'}
              </h1>
              {user?.is_verified && (
                <span title="Verified Student">
                  <ShieldCheck className="w-5 h-5 text-brand-primary" />
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-brand-muted mt-0.5">
              {loading ? (
                <Skeleton className="h-4 w-48 mt-1" />
              ) : (
                formData.headline || 'Add a headline (e.g. Computer Science Student)'
              )}
            </p>

            <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-brand-primary">
              <span className="text-slate-400 font-normal">Public URL:</span>
              <span className="font-mono bg-blue-50/80 px-2 py-0.5 rounded text-[11px] text-brand-primary">
                /u/{formData.username || 'username'}
              </span>
              <button
                type="button"
                onClick={handleCopyPublicLink}
                className="text-slate-400 hover:text-brand-primary transition-colors p-1"
                title="Copy public link"
              >
                {copiedLink ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Link
            to={`/u/${formData.username || ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto"
          >
            <Button
              variant="outline"
              size="sm"
              rightIcon={ExternalLink}
              className="w-full sm:w-auto"
            >
              View Public Portfolio
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Profile Completeness Progress Meter */}
      <div className="p-5 bg-gradient-to-r from-blue-900 to-brand-primary rounded-2xl text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-cyan-300" />
            <span className="text-xs font-bold tracking-wider uppercase text-cyan-200">
              Profile Completeness
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-bold font-display">
            Your profile is {completionPercentage}% complete
          </h3>
          <p className="text-xs text-blue-100/80">
            {completionPercentage >= 80
              ? 'Excellent! Your profile meets high-visibility standards for verified recruiter inquiries.'
              : 'Add your university, bio, and at least 3 skills to reach 100% and unlock maximum recruiter reach.'}
          </p>
        </div>

        <div className="w-full md:w-60 bg-blue-950/40 p-3 rounded-xl border border-white/10 backdrop-blur-sm shrink-0">
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span className="text-blue-200">Strength Gauge</span>
            <span className="text-cyan-300 font-bold">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-blue-950/80 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-400 to-blue-200 h-full rounded-full transition-all duration-700"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Feedback Alerts */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-xs text-red-800">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 4. Profile Editor Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section A: Personal & Biographical Info */}
        <div className="bg-white rounded-card border border-brand-border shadow-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-brand-primary flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <h2 className="font-display font-bold text-base text-brand-text">
              Personal Information & Bio
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              name="full_name"
              required
              value={formData.full_name}
              onChange={handleChange}
              placeholder="e.g. Alex Morgan"
            />

            <Input
              label="Public Username Slug"
              name="username"
              required
              value={formData.username}
              onChange={handleChange}
              placeholder="e.g. alexmorgan"
              helperText={`Your public portfolio will be accessible at /u/${formData.username || 'username'}`}
            />
          </div>

          <Input
            label="Professional Headline"
            name="headline"
            value={formData.headline}
            onChange={handleChange}
            placeholder="e.g. Full-Stack Developer | Computer Science Junior @ University"
            helperText="Summarize your current focus or career objective in one crisp line."
          />

          <Textarea
            label="About / Bio"
            name="bio"
            rows={4}
            value={formData.bio}
            onChange={handleChange}
            placeholder="Write a brief introduction highlighting your technical interests, notable projects, and what kind of internships or roles you are seeking..."
            helperText={`${(formData.bio || '').length}/2000 characters`}
          />

          <Input
            label="Avatar Image URL (Optional)"
            name="avatar_url"
            value={formData.avatar_url}
            onChange={handleChange}
            placeholder="https://example.com/avatar.jpg"
            helperText="Paste a public direct link to your headshot or GitHub avatar image."
          />
        </div>

        {/* Section B: Academic Education */}
        <div className="bg-white rounded-card border border-brand-border shadow-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-cyan-50 text-brand-cyan flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <h2 className="font-display font-bold text-base text-brand-text">
              Academic Background & Education
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="University / Institution"
                name="university"
                value={formData.university}
                onChange={handleChange}
                placeholder="e.g. University of California, Berkeley"
              />
            </div>

            <Input
              label="Graduation Year"
              name="graduation_year"
              type="number"
              min="1980"
              max="2035"
              value={formData.graduation_year}
              onChange={handleChange}
              placeholder="e.g. 2026"
            />
          </div>

          <Input
            label="Degree & Major"
            name="degree"
            value={formData.degree}
            onChange={handleChange}
            placeholder="e.g. B.S. in Computer Science & Engineering"
          />
        </div>

        {/* Section C: Skills Matrix */}
        <div className="bg-white rounded-card border border-brand-border shadow-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-brand-text">
                Skills & Technical Stack
              </h2>
              <p className="text-xs text-brand-muted">
                Add programming languages, frameworks, databases, and developer tools.
              </p>
            </div>
          </div>

          {/* Current Skills Tags */}
          <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-slate-50 border border-slate-200 rounded-xl">
            {formData.skills.length === 0 ? (
              <span className="text-xs text-slate-400 py-1">
                No skills added yet. Type below or pick from recommended skills.
              </span>
            ) : (
              formData.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white border border-brand-border text-brand-primary shadow-xs"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="p-0.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            )}
          </div>

          {/* Add Skill Input */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                placeholder="Type a skill and press Enter (e.g. Docker, GraphQL, Kubernetes)"
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              size="md"
              leftIcon={Plus}
              onClick={() => handleAddSkill()}
            >
              Add
            </Button>
          </div>

          {/* Quick Suggestions */}
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">Suggested Skills:</p>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_SKILLS.filter(
                (s) => !formData.skills.some((curr) => curr.toLowerCase() === s.toLowerCase())
              ).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleAddSkill(s)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-brand-primary hover:border-brand-primary border border-transparent transition-all"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section D: Social & Portfolio Links */}
        <div className="bg-white rounded-card border border-brand-border shadow-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <h2 className="font-display font-bold text-base text-brand-text">
              Social Profiles & Portfolio Links
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="GitHub Profile"
              name="github_url"
              value={formData.github_url}
              onChange={handleChange}
              leftIcon={Github}
              placeholder="https://github.com/username"
            />

            <Input
              label="LinkedIn Profile"
              name="linkedin_url"
              value={formData.linkedin_url}
              onChange={handleChange}
              leftIcon={Linkedin}
              placeholder="https://linkedin.com/in/username"
            />

            <Input
              label="Personal Website / Blog"
              name="portfolio_url"
              value={formData.portfolio_url}
              onChange={handleChange}
              leftIcon={Globe}
              placeholder="https://yourportfolio.dev"
            />
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="md"
            leftIcon={RotateCcw}
            onClick={handleReset}
            disabled={saving}
          >
            Discard Changes
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            leftIcon={Save}
            isLoading={saving}
          >
            Save Profile Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
