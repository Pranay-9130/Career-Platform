import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  RotateCw,
} from 'lucide-react';
import { authService } from '@/services/authService';
import { Button, Input, Card, Alert } from '@/components/common';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [serverMessage, setServerMessage] = useState('');

  const validate = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setError('Email address is required.');
      return false;
    }
    if (!emailRegex.test(email.trim())) {
      setError('Please provide a valid email address.');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await authService.forgotPassword(email.trim());
      setIsSubmitted(true);
      setServerMessage(
        response.message ||
          'If an account with that email exists, we have sent a password reset link to your inbox.'
      );
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Unable to process password reset request. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAnother = () => {
    setIsSubmitted(false);
    setEmail('');
    setError(null);
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
            <KeyRound className="w-3.5 h-3.5" />
            <span>Account Recovery</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-brand-text tracking-tight">
            {isSubmitted ? 'Check your inbox' : 'Forgot your password?'}
          </h1>
          <p className="mt-2 text-sm text-brand-muted leading-relaxed">
            {isSubmitted
              ? 'We have sent recovery instructions to your email address.'
              : 'Enter your registered email address and we will send you a secure link to reset your password.'}
          </p>
        </div>

        {/* Card Container */}
        <Card className="p-8 shadow-card border-brand-border bg-white/95 backdrop-blur-sm">
          {isSubmitted ? (
            <div className="text-center space-y-5 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 text-green-600 flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="bg-brand-veryLight/70 border border-brand-border rounded-xl p-4 text-left space-y-2">
                <p className="text-xs text-brand-muted">
                  A reset link has been dispatched to:
                </p>
                <p className="text-sm font-semibold text-brand-text truncate">
                  {email}
                </p>
                <p className="text-[11px] text-slate-500 pt-1 border-t border-brand-border/60">
                  The link is valid for <strong>15 minutes</strong>. Remember to check your spam or promotions folder.
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <Link to="/login">
                  <Button variant="gradient" size="md" className="w-full">
                    Return to Login
                  </Button>
                </Link>

                <button
                  type="button"
                  onClick={handleResetAnother}
                  className="text-xs text-brand-primary hover:text-blue-700 font-medium hover:underline inline-flex items-center justify-center gap-1.5 pt-1"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Send to a different email</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {error && (
                <Alert
                  variant="error"
                  title="Request Issue"
                  onClose={() => setError(null)}
                >
                  {error}
                </Alert>
              )}

              <div>
                <Input
                  label="Registered Email Address"
                  id="forgot-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="student@university.edu"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  error={error}
                  leftIcon={Mail}
                  required
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                variant="gradient"
                size="lg"
                className="w-full shadow-sm hover:shadow"
                isLoading={isSubmitting}
                rightIcon={ArrowRight}
              >
                {isSubmitting ? 'Sending Reset Link...' : 'Send Reset Link'}
              </Button>
            </form>
          )}
        </Card>

        {/* Footer Navigation */}
        <div className="text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-primary transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to sign in</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
