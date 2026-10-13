import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Mail,
  ShieldCheck,
  CheckCircle2,
  Clock,
  RotateCw,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/authService';
import { Button, Card, Alert } from '@/components/common';
import { OTPInput } from '@/components/auth';

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, updateUser } = useAuth();

  // Retrieve email from routing state, auth context, or fallback
  const email =
    location.state?.email ||
    user?.email ||
    '';

  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    email ? null : 'No email address was provided. Please register or sign in again.'
  );
  const [successMessage, setSuccessMessage] = useState(null);
  const [isVerified, setIsVerified] = useState(false);

  // Overall code expiration timer (300 seconds = 5 minutes)
  const [expiresIn, setExpiresIn] = useState(300);
  // Resend cooldown timer (60 seconds)
  const [cooldown, setCooldown] = useState(60);

  // Mask email for display: a***n@university.edu
  const maskEmail = (rawEmail) => {
    if (!rawEmail || !rawEmail.includes('@')) return rawEmail || 'your email';
    const [namePart, domain] = rawEmail.split('@');
    if (namePart.length <= 2) return `${namePart}***@${domain}`;
    return `${namePart[0]}***${namePart[namePart.length - 1]}@${domain}`;
  };

  // Expiration Countdown Timer
  useEffect(() => {
    if (expiresIn <= 0) return;
    const interval = setInterval(() => {
      setExpiresIn((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresIn]);

  // Resend Cooldown Timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleVerify = useCallback(
    async (codeToVerify) => {
      const code = codeToVerify || otpDigits.join('');
      if (!email || code.length !== 6) return;

      setIsSubmitting(true);
      setErrorMessage(null);

      try {
        const response = await authService.verifyOtp({
          email: email.trim(),
          otp: code,
          purpose: 'registration',
        });

        setIsVerified(true);
        setSuccessMessage('Account verified successfully!');

        // Update auth state if token or user received
        if (response.access_token && response.user) {
          login(response.access_token, response.user);
        } else {
          updateUser({ is_verified: true });
        }

        // Smooth redirect to student dashboard
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1200);
      } catch (err) {
        const message =
          err.response?.data?.detail ||
          err.response?.data?.message ||
          'Verification failed. Please check the code and try again.';
        setErrorMessage(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, otpDigits, login, updateUser, navigate]
  );

  const handleResend = async () => {
    if (!email || cooldown > 0 || isResending) return;

    setIsResending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await authService.resendOtp({
        email: email.trim(),
        purpose: 'registration',
      });

      setSuccessMessage(response.message || 'A new verification code has been dispatched.');
      setCooldown(response.cooldown_seconds || 60);
      setExpiresIn(response.expires_in_seconds || 300);
      setOtpDigits(['', '', '', '', '', '']);
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Unable to resend verification code. Please try again.';
      setErrorMessage(message);
    } finally {
      setIsResending(false);
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
            <ShieldCheck className="w-4 h-4 text-brand-primary" />
            <span>Email Security Verification</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-brand-text tracking-tight">
            Verify your account
          </h1>
          <p className="mt-2 text-sm text-brand-muted leading-relaxed">
            We sent a 6-digit confirmation code to{' '}
            <span className="font-semibold text-brand-text">
              {maskEmail(email)}
            </span>
          </p>
        </div>

        {/* Verification Card */}
        <Card className="p-8 shadow-card border-brand-border bg-white/95 backdrop-blur-sm text-center">
          {isVerified ? (
            <div className="py-8 space-y-3 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 text-green-600 flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-xl font-display font-bold text-brand-text">
                Verification Complete!
              </h3>
              <p className="text-sm text-brand-muted">
                Taking you to your student dashboard...
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Alert Feedback */}
              {errorMessage && (
                <Alert
                  variant="error"
                  title="Verification Issue"
                  className="text-left"
                  onClose={() => setErrorMessage(null)}
                >
                  {errorMessage}
                </Alert>
              )}

              {successMessage && (
                <Alert
                  variant="success"
                  title="Code Dispatched"
                  className="text-left"
                  onClose={() => setSuccessMessage(null)}
                >
                  {successMessage}
                </Alert>
              )}

              {/* 6-Digit Auto-Advancing Input */}
              <div>
                <label className="block text-xs font-semibold text-brand-text mb-3">
                  Enter 6-Digit Verification Code
                </label>
                <OTPInput
                  value={otpDigits}
                  onChange={setOtpDigits}
                  onComplete={handleVerify}
                  disabled={isSubmitting}
                  error={Boolean(errorMessage)}
                />
              </div>

              {/* Expiry Timer Bar */}
              <div className="flex items-center justify-center gap-1.5 text-xs text-brand-muted">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Code expires in:</span>
                <span
                  className={`font-semibold font-mono ${
                    expiresIn < 60 ? 'text-brand-error' : 'text-brand-text'
                  }`}
                >
                  {formatTimer(expiresIn)}
                </span>
              </div>

              {/* Primary Verify Button */}
              <Button
                type="button"
                variant="gradient"
                size="lg"
                className="w-full shadow-sm hover:shadow"
                onClick={() => handleVerify()}
                disabled={!email || otpDigits.some((d) => !d) || isSubmitting}
                isLoading={isSubmitting}
                rightIcon={ArrowRight}
              >
                {isSubmitting ? 'Verifying Code...' : 'Verify & Continue'}
              </Button>

              {/* Resend Cooldown Section */}
              <div className="pt-4 border-t border-brand-border/70 text-xs text-brand-muted">
                <span>Didn't receive the email? </span>
                {cooldown > 0 ? (
                  <span className="text-slate-400 font-medium">
                    Resend in {cooldown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending}
                    className="inline-flex items-center gap-1 font-semibold text-brand-primary hover:text-blue-700 hover:underline disabled:opacity-60 transition-colors"
                  >
                    <RotateCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
                    <span>Resend Code</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between text-xs text-brand-muted px-2">
          <Link
            to="/register"
            className="inline-flex items-center gap-1 hover:text-brand-primary transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Change email</span>
          </Link>

          <Link
            to="/login"
            className="hover:text-brand-primary font-medium hover:underline transition-colors"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
