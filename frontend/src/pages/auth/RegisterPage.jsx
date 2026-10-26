import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Briefcase,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button, Input, Card, Alert } from '@/components/common';
import { getDashboardPath } from '@/utils/navigation';
import { REGISTRATION_ROLE_OPTIONS, getDefaultHeadline } from '@/utils/registration';

const roleIcons = {
  STUDENT: GraduationCap,
  CONTRIBUTOR: Briefcase,
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { registerUser, isAuthenticated, user, logout } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'STUDENT',
    headline: '',
    agreeTerms: true,
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasExistingSession, setHasExistingSession] = useState(() => isAuthenticated);

  const handleLogout = () => {
    logout();
    setHasExistingSession(false);
  };

  // Real-time password strength calculation
  const calculatePasswordStrength = (pwd) => {
    let score = 0;
    if (!pwd) return { score: 0, label: 'None', color: 'bg-slate-200' };
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-400' };
    if (score === 2) return { score: 2, label: 'Fair', color: 'bg-amber-400' };
    if (score === 3) return { score: 3, label: 'Good', color: 'bg-blue-400' };
    return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = calculatePasswordStrength(formData.password);

  // Validation
  const validate = () => {
    const errs = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      errs.fullName = 'Full name must be at least 2 characters.';
    }

    if (!formData.email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!emailRegex.test(formData.email.trim())) {
      errs.email = 'Please provide a valid email address.';
    }

    if (!formData.password) {
      errs.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      errs.password = 'Password must be at least 8 characters long.';
    }

    if (!formData.confirmPassword) {
      errs.confirmPassword = 'Please confirm your password.';
    } else if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    if (!formData.agreeTerms) {
      errs.agreeTerms = 'You must agree to the terms to create an account.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleRoleSelect = (role) => {
    setFormData((prev) => ({ ...prev, role }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await registerUser({
        full_name: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
        headline: formData.headline.trim() || getDefaultHeadline(formData.role),
      });

      const targetPath = getDashboardPath(response.user);
      navigate(targetPath, { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Registration failed. Please check your information and try again.';
      setErrorMessage(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative ambient background accents */}
      <div className="absolute top-1/4 right-1/2 translate-x-1/3 -translate-y-1/2 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-1/4 w-72 h-72 bg-cyan-100/50 rounded-full blur-2xl pointer-events-none -z-10" />

      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <Link to="/" className="inline-block mb-3 transition-transform hover:scale-105">
            <picture>
              <source srcSet="/logo.webp" type="image/webp" />
              <img
                src="/logo.png"
                alt="AspirePath"
                width="165"
                height="44"
                decoding="async"
                className="h-11 w-auto object-contain mx-auto"
              />
            </picture>
          </Link>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-veryLight border border-brand-border text-brand-primary text-xs font-semibold mb-4 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-brand-primary" />
            <span>Start Your Journey with AspirePath</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-brand-text tracking-tight">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-brand-muted max-w-sm">
            Build your portfolio from real-world projects and land your next role.
          </p>
        </div>

        {/* Register Card */}
        <Card className="p-8 shadow-card border-brand-border bg-white/95 backdrop-blur-sm">
          {hasExistingSession && isAuthenticated && !isSubmitting && (
            <div className="mb-6 p-4 rounded-2xl bg-brand-veryLight border border-brand-border text-xs text-brand-text space-y-2.5">
              <div className="flex items-center gap-2 font-semibold text-brand-primary">
                <CheckCircle2 className="w-4 h-4" />
                <span>Active Session Detected</span>
              </div>
              <p className="text-slate-600">
                You are currently signed in as <strong>{user?.email}</strong>.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button size="sm" variant="primary" onClick={() => navigate(getDashboardPath(user), { replace: true })}>
                  Continue to Dashboard
                </Button>
                <Button size="sm" variant="outline" onClick={handleLogout} leftIcon={LogOut}>
                  Sign Out to Register New Account
                </Button>
              </div>
            </div>
          )}

          {errorMessage && (
            <Alert
              variant="error"
              title="Registration Notice"
              className="mb-6"
              onClose={() => setErrorMessage(null)}
            >
              <div className="space-y-1">
                <p>{errorMessage}</p>
                {errorMessage.includes('already exists') && (
                  <p className="text-xs pt-1">
                    Already have an account?{' '}
                    <Link
                      to="/login"
                      className="font-semibold text-brand-primary underline"
                    >
                      Click here to sign in
                    </Link>
                  </p>
                )}
              </div>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Account Role Toggle */}
            <div>
              <label className="block text-xs font-semibold text-brand-text mb-1.5">
                I am joining as a
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="radiogroup" aria-label="Account type">
                {REGISTRATION_ROLE_OPTIONS.map((option) => {
                  const RoleIcon = roleIcons[option.value];
                  const selected = formData.role === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => handleRoleSelect(option.value)}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                        selected
                          ? 'bg-brand-veryLight border-brand-primary text-brand-primary shadow-xs'
                          : 'bg-white border-brand-border text-brand-muted hover:border-slate-300'
                      }`}
                    >
                      <RoleIcon className="w-4 h-4" />
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Full Name */}
            <div>
              <Input
                label="Full Name"
                id="register-fullname"
                name="fullName"
                type="text"
                autoComplete="name"
                placeholder="Alex Chen"
                value={formData.fullName}
                onChange={handleChange}
                error={errors.fullName}
                leftIcon={User}
                required
              />
            </div>

            {/* Email Address */}
            <div>
              <Input
                label="Email Address"
                id="register-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="alex.chen@university.edu"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                leftIcon={Mail}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="register-password"
                className="block text-xs font-semibold text-brand-text mb-1.5"
              >
                Password <span className="text-brand-error ml-1">*</span>
              </label>
              <div className="relative">
                <Input
                  id="register-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  leftIcon={Lock}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-[11px] text-brand-muted hover:text-brand-text focus:outline-none transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Password Strength Meter */}
              {formData.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-brand-muted">Strength:</span>
                    <span className="font-semibold text-brand-text">
                      {strength.label}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-full flex-1 rounded-full transition-all duration-300 ${
                          strength.score >= level ? strength.color : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="register-confirm-password"
                className="block text-xs font-semibold text-brand-text mb-1.5"
              >
                Confirm Password <span className="text-brand-error ml-1">*</span>
              </label>
              <div className="relative">
                <Input
                  id="register-confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                  leftIcon={Lock}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={
                    showConfirmPassword
                      ? 'Hide confirm password'
                      : 'Show confirm password'
                  }
                  className="absolute right-3 top-[11px] text-brand-muted hover:text-brand-text focus:outline-none transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Live Match Indicator */}
              {formData.confirmPassword && (
                <p className="mt-1 text-xs flex items-center gap-1">
                  {formData.password === formData.confirmPassword ? (
                    <span className="text-emerald-600 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
                    </span>
                  ) : (
                    <span className="text-brand-error flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Passwords do not match
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Terms of Service & Privacy Checkbox */}
            <div className="pt-1">
              <div className="flex items-start">
                <input
                  id="agreeTerms"
                  name="agreeTerms"
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  className="h-4 w-4 mt-0.5 text-brand-primary focus:ring-brand-primary border-brand-border rounded cursor-pointer"
                />
                <label
                  htmlFor="agreeTerms"
                  className="ml-2 block text-xs text-brand-muted cursor-pointer select-none leading-relaxed"
                >
                  I agree to the{' '}
                  <span className="text-brand-primary font-medium hover:underline">
                    Terms of Service
                  </span>{' '}
                  and{' '}
                  <span className="text-brand-primary font-medium hover:underline">
                    Privacy Policy
                  </span>
                  .
                </label>
              </div>
              {errors.agreeTerms && (
                <p className="mt-1 text-xs text-brand-error">{errors.agreeTerms}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="gradient"
              size="lg"
              className="w-full shadow-sm hover:shadow mt-2"
              isLoading={isSubmitting}
              rightIcon={ArrowRight}
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        </Card>

        {/* Footer Login Redirect */}
        <p className="text-center text-xs text-brand-muted">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-brand-primary font-semibold hover:text-blue-700 hover:underline"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
