import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button, Input, Card, Alert } from '@/components/common';
import { getDashboardPath, getInternalPath } from '@/utils/navigation';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithCredentials, isAuthenticated, user, logout } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: true,
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const getRequestedPath = () => {
    const from = location.state?.from;
    const statePath = getInternalPath(from);
    const queryPath = getInternalPath(new URLSearchParams(location.search).get('redirect'));
    return statePath || queryPath;
  };

  const getDestination = (account) => {
    const requested = getRequestedPath();
    const isAdmin = account?.role === 'ADMIN';

    if (isAdmin) {
      if (requested && requested.startsWith('/admin')) {
        return requested;
      }
      return '/admin/dashboard';
    }

    if (requested && !requested.startsWith('/admin')) {
      return requested;
    }

    return getDashboardPath(account);
  };

  const redirectPath = getDestination(user);

  // Client-side form validation
  const validate = () => {
    const errs = {};

    if (!formData.email.trim()) {
      errs.email = 'Email address or admin username is required.';
    }

    if (!formData.password) {
      errs.password = 'Password is required.';
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
    // Clear field-specific error as user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await loginWithCredentials(
        formData.email.trim(),
        formData.password,
        formData.rememberMe
      );

      const targetPath = getDestination(response.user);

      navigate(targetPath, { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Unable to log in. Please check your credentials and try again.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-72 h-72 bg-cyan-100/50 rounded-full blur-2xl pointer-events-none -z-10" />

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
            <span>Welcome to AspirePath</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-brand-text tracking-tight">
            Sign in to your account
          </h1>
          <p className="mt-2 text-sm text-brand-muted max-w-sm">
            Access your projects, resume builder, and job application tracker.
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-8 shadow-card border-brand-border bg-white/95 backdrop-blur-sm">
          {isAuthenticated && (
            <div className="mb-6 p-4 rounded-2xl bg-brand-veryLight border border-brand-border text-xs text-brand-text space-y-2.5">
              <div className="flex items-center gap-2 font-semibold text-brand-primary">
                <CheckCircle2 className="w-4 h-4" />
                <span>Active Session Detected</span>
              </div>
              <p className="text-slate-600">
                You are currently signed in as <strong>{user?.email}</strong> ({user?.role}).
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button size="sm" variant="primary" onClick={() => navigate(redirectPath, { replace: true })}>
                  Continue to {redirectPath.includes('admin') ? 'Admin Dashboard' : redirectPath.includes('projects') ? 'Project' : 'Dashboard'}
                </Button>
                <Button size="sm" variant="outline" onClick={logout} leftIcon={LogOut}>
                  Sign Out / Switch Account
                </Button>
              </div>
            </div>
          )}

          {location.state?.message && !isAuthenticated && (
            <div className="mb-6 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-brand-primary shrink-0" />
              <span>{location.state.message}</span>
            </div>
          )}

          {errorMessage && (
            <Alert
              variant="error"
              title="Authentication Failed"
              className="mb-6"
              onClose={() => setErrorMessage(null)}
            >
              {errorMessage}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email Input */}
            <div>
              <Input
                label="Email Address or Admin Username"
                id="login-email"
                name="email"
                type="text"
                autoComplete="username"
                placeholder="Your email or admin username"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                leftIcon={Mail}
                required
              />
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-brand-text"
                >
                  Password <span className="text-brand-error ml-1">*</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-brand-primary hover:text-blue-700 hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative">
                <Input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
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
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="rememberMe"
                name="rememberMe"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-brand-border rounded cursor-pointer"
              />
              <label
                htmlFor="rememberMe"
                className="ml-2 block text-xs text-brand-muted cursor-pointer select-none"
              >
                Keep me signed in on this device
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="gradient"
              size="lg"
              className="w-full shadow-sm hover:shadow"
              isLoading={isSubmitting}
              rightIcon={ArrowRight}
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>

        </Card>

        {/* Footer Register Redirect */}
        <p className="text-center text-xs text-brand-muted">
          Don't have an account yet?{' '}
          <Link
            to="/register"
            className="text-brand-primary font-semibold hover:text-blue-700 hover:underline"
          >
            Create an account for free
          </Link>
        </p>
      </div>
    </div>
  );
}
