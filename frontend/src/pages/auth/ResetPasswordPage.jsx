import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { authService } from '@/services/authService';
import { Button, Input, Card, Alert, Spinner } from '@/components/common';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [isCheckingToken, setIsCheckingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState(null);

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Verify token on mount
  useEffect(() => {
    async function checkToken() {
      if (!token || !email) {
        setIsCheckingToken(false);
        setTokenValid(false);
        setTokenError('The password reset link is missing required verification parameters.');
        return;
      }

      try {
        await authService.verifyResetToken({ email, token });
        setTokenValid(true);
      } catch (err) {
        setTokenValid(false);
        setTokenError(
          err.response?.data?.detail ||
          'This password reset link is invalid or has already expired.'
        );
      } finally {
        setIsCheckingToken(false);
      }
    }

    checkToken();
  }, [token, email]);

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

  const validate = () => {
    const errs = {};
    if (!formData.password) {
      errs.password = 'New password is required.';
    } else if (formData.password.length < 8) {
      errs.password = 'Password must be at least 8 characters long.';
    }

    if (!formData.confirmPassword) {
      errs.confirmPassword = 'Please confirm your new password.';
    } else if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (submitError) {
      setSubmitError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await authService.resetPassword({
        email,
        token,
        new_password: formData.password,
      });

      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Unable to update password. Please request a new reset link.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative ambient background accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-72 h-72 bg-cyan-100/50 rounded-full blur-2xl pointer-events-none -z-10" />

      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-veryLight border border-brand-border text-brand-primary text-xs font-semibold mb-4 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Password Security</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-brand-text tracking-tight">
            Reset your password
          </h1>
          <p className="mt-2 text-sm text-brand-muted leading-relaxed">
            Choose a strong, unique password to secure your account.
          </p>
        </div>

        {/* Card Container */}
        <Card className="p-8 shadow-card border-brand-border bg-white/95 backdrop-blur-sm">
          {isCheckingToken ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <Spinner size="lg" />
              <p className="text-xs text-brand-muted font-medium">
                Validating security link...
              </p>
            </div>
          ) : !tokenValid ? (
            <div className="text-center space-y-5 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-display font-bold text-brand-text">
                Invalid or Expired Link
              </h3>
              <p className="text-xs text-brand-muted leading-relaxed">
                {tokenError ||
                  'This password reset link has expired or has already been used.'}
              </p>
              <div className="pt-2">
                <Link to="/forgot-password">
                  <Button variant="gradient" size="md" className="w-full">
                    Request a New Reset Link
                  </Button>
                </Link>
              </div>
            </div>
          ) : isSuccess ? (
            <div className="text-center space-y-4 py-6 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 text-green-600 flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-xl font-display font-bold text-brand-text">
                Password Reset Successful!
              </h3>
              <p className="text-xs text-brand-muted">
                Your password has been updated. Redirecting you to sign in...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {submitError && (
                <Alert
                  variant="error"
                  title="Update Failed"
                  onClose={() => setSubmitError(null)}
                >
                  {submitError}
                </Alert>
              )}

              {/* New Password */}
              <div>
                <label
                  htmlFor="reset-new-password"
                  className="block text-xs font-semibold text-brand-text mb-1.5"
                >
                  New Password <span className="text-brand-error ml-1">*</span>
                </label>
                <div className="relative">
                  <Input
                    id="reset-new-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    leftIcon={Lock}
                    required
                    autoFocus
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
                  htmlFor="reset-confirm-password"
                  className="block text-xs font-semibold text-brand-text mb-1.5"
                >
                  Confirm New Password <span className="text-brand-error ml-1">*</span>
                </label>
                <div className="relative">
                  <Input
                    id="reset-confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Re-enter your new password"
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

              <Button
                type="submit"
                variant="gradient"
                size="lg"
                className="w-full shadow-sm hover:shadow mt-2"
                isLoading={isSubmitting}
                rightIcon={ArrowRight}
              >
                {isSubmitting ? 'Updating Password...' : 'Update Password'}
              </Button>
            </form>
          )}
        </Card>

        {/* Footer Navigation */}
        <div className="text-center">
          <Link
            to="/login"
            className="text-xs text-brand-muted hover:text-brand-primary font-medium hover:underline transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
