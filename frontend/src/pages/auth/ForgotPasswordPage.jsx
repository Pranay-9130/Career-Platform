import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  RotateCw,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
  Check,
} from 'lucide-react';
import { authService } from '@/services/authService';
import { Button, Input, Card, Alert } from '@/components/common';

export default function ForgotPasswordPage() {
  // Wizard steps: 1 = Email, 2 = Verify OTP, 3 = New Password, 4 = Success
  const [step, setStep] = useState(1);

  // Form states
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Async states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successNotice, setSuccessNotice] = useState('');

  // Resend OTP countdown
  const [cooldown, setCooldown] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState(null);

  // References for the 6 OTP input elements
  const otpInputRefs = useRef([]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Focus the first OTP box when entering Step 2
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  // Focus the password input when entering Step 3
  const passwordInputRef = useRef(null);
  useEffect(() => {
    if (step === 3) {
      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 100);
    }
  }, [step]);

  // Validation functions
  const validateEmail = () => {
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

  // Password strength calculation
  const calculatePasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: 'None', color: 'bg-slate-200', text: 'text-slate-400' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500', text: 'text-rose-500' };
    if (score === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500', text: 'text-amber-500' };
    if (score === 3) return { score: 3, label: 'Good', color: 'bg-blue-500', text: 'text-blue-500' };
    return { score: 4, label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-600' };
  };

  const passwordStrength = calculatePasswordStrength(password);

  const passwordRequirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'At least 1 uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'At least 1 number', met: /[0-9]/.test(password) },
    { label: 'At least 1 special character', met: /[^A-Za-z0-9]/.test(password) },
  ];

  // -------------------------------------------------------------
  // Step 1: Send 6-Digit OTP
  // -------------------------------------------------------------
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!validateEmail()) return;

    setIsLoading(true);
    setError(null);
    setSuccessNotice('');

    try {
      const response = await authService.forgotPassword(email.trim());
      setStep(2);
      setCooldown(response.cooldown_seconds || 60);
      setAttemptsRemaining(5);
      setSuccessNotice(
        response.message ||
          'A 6-digit verification code has been dispatched to your email address.'
      );
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Unable to request verification code. Please check your network and try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Step 2: Handle OTP Input (Typing, Backspace, Paste)
  // -------------------------------------------------------------
  const handleOtpChange = (index, value) => {
    // Only accept numeric digit
    const cleaned = value.replace(/[^0-9]/g, '');
    if (!cleaned && value !== '') return;

    const newOtp = [...otp];
    newOtp[index] = cleaned.slice(-1); // Take single character
    setOtp(newOtp);
    setError(null);

    // Auto-advance to next box if filled
    if (cleaned && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Current box is empty, navigate to previous box
        otpInputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    const digitsOnly = pastedData.replace(/[^0-9]/g, '').slice(0, 6);

    if (!digitsOnly) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = digitsOnly[i] || '';
    }
    setOtp(newOtp);
    setError(null);

    // Focus last filled index or next available
    const focusIndex = Math.min(digitsOnly.length, 5);
    otpInputRefs.current[focusIndex]?.focus();
  };

  // Resend OTP action
  const handleResendOtp = async () => {
    if (cooldown > 0 || isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.forgotPassword(email.trim());
      setCooldown(response.cooldown_seconds || 60);
      setOtp(['', '', '', '', '', '']);
      setAttemptsRemaining(5);
      setSuccessNotice('A fresh 6-digit code has been sent to your email.');
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 50);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Failed to resend verification code. Please try again later.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP submission
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessNotice('');

    try {
      const response = await authService.verifyResetOtp({
        email: email.trim(),
        otp: code,
      });

      if (response.reset_token) {
        setResetToken(response.reset_token);
        setStep(3);
      } else {
        setError('Verification successful, but reset token was missing. Please try again.');
      }
    } catch (err) {
      const detail = err.response?.data?.detail || 'Incorrect verification code. Please try again.';
      setError(detail);

      // Parse attempt count if returned in error message
      const match = detail.match(/(\d+)\s+attempt/i);
      if (match) {
        setAttemptsRemaining(parseInt(match[1], 10));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Step 3: Reset Password Submission
  // -------------------------------------------------------------
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError('New password is required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please ensure both passwords are identical.');
      return;
    }

    setIsLoading(true);

    try {
      await authService.resetPassword({
        email: email.trim(),
        reset_token: resetToken,
        token: resetToken,
        new_password: password,
      });

      setStep(4);
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Unable to reset password. The reset session may have expired. Please request a new code.';
      setError(detail);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative ambient background accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-72 h-72 bg-cyan-100/50 rounded-full blur-2xl pointer-events-none -z-10" />

      <div className="max-w-md w-full space-y-6">
        {/* Step Indicator Header (Steps 1 to 3) */}
        {step < 4 && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-veryLight border border-brand-border text-brand-primary text-xs font-semibold mb-4 shadow-sm">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Password Recovery</span>
            </div>

            <h1 className="text-3xl font-display font-bold text-brand-text tracking-tight">
              {step === 1 && 'Forgot password?'}
              {step === 2 && 'Enter verification code'}
              {step === 3 && 'Create new password'}
            </h1>

            <p className="mt-2 text-sm text-brand-muted leading-relaxed">
              {step === 1 &&
                'Enter your registered email address and we will send you a 6-digit verification code.'}
              {step === 2 && (
                <>
                  We dispatched a 6-digit code to{' '}
                  <span className="font-semibold text-brand-text">{email}</span>. Code expires in 5 minutes.
                </>
              )}
              {step === 3 &&
                'Verification complete. Enter your new password below to secure your account.'}
            </p>

            {/* Stepper Dots */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === 1 ? 'w-8 bg-brand-primary' : 'w-2 bg-brand-border'
                }`}
              />
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === 2 ? 'w-8 bg-brand-primary' : 'w-2 bg-brand-border'
                }`}
              />
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === 3 ? 'w-8 bg-brand-primary' : 'w-2 bg-brand-border'
                }`}
              />
            </div>
          </div>
        )}

        {/* Card Container */}
        <Card className="p-8 shadow-card border-brand-border bg-white/95 backdrop-blur-sm">
          {/* General Error Banner */}
          {error && (
            <div className="mb-5 animate-in fade-in duration-200">
              <Alert variant="error" title="Notice" onClose={() => setError(null)}>
                {error}
              </Alert>
            </div>
          )}

          {/* Success / Notification Banner */}
          {successNotice && step !== 4 && (
            <div className="mb-5 animate-in fade-in duration-200">
              <Alert variant="success" onClose={() => setSuccessNotice('')}>
                {successNotice}
              </Alert>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 1: Enter Registered Email Address                       */}
          {/* ============================================================ */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-5" noValidate>
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
                isLoading={isLoading}
                rightIcon={ArrowRight}
              >
                {isLoading ? 'Sending Code...' : 'Send 6-Digit Code'}
              </Button>
            </form>
          )}

          {/* ============================================================ */}
          {/* STEP 2: Enter 6-Digit Verification Code                       */}
          {/* ============================================================ */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-6" noValidate>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider text-center mb-3">
                  6-Digit Verification Code
                </label>

                {/* 6 Digit Input Boxes */}
                <div
                  className="flex items-center justify-between gap-2 sm:gap-2.5"
                  onPaste={handleOtpPaste}
                >
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpInputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className={`w-12 h-14 sm:w-13 sm:h-14 text-center text-2xl font-bold font-mono rounded-xl border-2 transition-all duration-150 outline-none select-none ${
                        digit
                          ? 'border-brand-primary bg-blue-50/50 text-brand-primary shadow-sm'
                          : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300 focus:border-brand-primary focus:ring-4 focus:ring-blue-100'
                      }`}
                      autoComplete="one-time-code"
                      aria-label={`Digit ${index + 1}`}
                    />
                  ))}
                </div>

                {attemptsRemaining !== null && attemptsRemaining < 5 && attemptsRemaining > 0 && (
                  <p className="mt-2 text-xs text-amber-600 font-medium text-center">
                    Warning: {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining before code is locked.
                  </p>
                )}
              </div>

              {/* Verify Code Button */}
              <Button
                type="submit"
                variant="gradient"
                size="lg"
                className="w-full shadow-sm hover:shadow"
                isLoading={isLoading}
                disabled={otp.join('').length !== 6}
                rightIcon={ArrowRight}
              >
                {isLoading ? 'Verifying Code...' : 'Verify Code'}
              </Button>

              {/* Resend Code & Timer Section */}
              <div className="pt-2 border-t border-slate-100 text-center space-y-2">
                {cooldown > 0 ? (
                  <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Resend code in <strong className="text-brand-primary">{cooldown}s</strong>
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="text-xs text-brand-primary hover:text-blue-700 font-semibold hover:underline inline-flex items-center gap-1.5"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Didn't receive code? Resend OTP</span>
                  </button>
                )}

                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setOtp(['', '', '', '', '', '']);
                      setError(null);
                      setSuccessNotice('');
                    }}
                    className="text-xs text-slate-400 hover:text-slate-600 font-medium hover:underline"
                  >
                    Entered wrong email? Change address
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ============================================================ */}
          {/* STEP 3: Create New Password                                  */}
          {/* ============================================================ */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-5" noValidate>
              {/* New Password */}
              <div>
                <div className="relative">
                  <Input
                    ref={passwordInputRef}
                    label="New Password"
                    id="new-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    leftIcon={Lock}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {password && (
                  <div className="mt-2.5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Strength:</span>
                      <span className={`font-semibold ${passwordStrength.text}`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 h-1.5">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-full rounded-full transition-colors duration-200 ${
                            passwordStrength.score >= level ? passwordStrength.color : 'bg-slate-100'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <div className="relative">
                  <Input
                    label="Confirm New Password"
                    id="confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    leftIcon={Lock}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Requirements Checklist */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-1.5 text-xs">
                <span className="font-semibold text-slate-700 block mb-1">Password must include:</span>
                {passwordRequirements.map((req, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 transition-colors ${
                      req.met ? 'text-emerald-700 font-medium' : 'text-slate-500'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                        req.met ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      {req.met ? <Check className="w-2.5 h-2.5" /> : '•'}
                    </div>
                    <span>{req.label}</span>
                  </div>
                ))}
              </div>

              <Button
                type="submit"
                variant="gradient"
                size="lg"
                className="w-full shadow-sm hover:shadow"
                isLoading={isLoading}
                rightIcon={ShieldCheck}
              >
                {isLoading ? 'Updating Password...' : 'Reset Password'}
              </Button>
            </form>
          )}

          {/* ============================================================ */}
          {/* STEP 4: Success Confirmation Screen                          */}
          {/* ============================================================ */}
          {step === 4 && (
            <div className="text-center space-y-6 py-2 animate-in zoom-in-95 duration-200">
              <div className="w-18 h-18 mx-auto rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-display font-bold text-brand-text">
                  Password Reset Complete!
                </h2>
                <p className="text-sm text-brand-muted leading-relaxed max-w-sm mx-auto">
                  Your AspirePath account password has been updated securely. You can now log in with your new credentials.
                </p>
              </div>

              <div className="pt-2">
                <Link to="/login" className="block w-full">
                  <Button variant="gradient" size="lg" className="w-full shadow-sm hover:shadow">
                    Sign In to AspirePath
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </Card>

        {/* Footer Navigation */}
        {step < 4 && (
          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-primary transition-colors font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to sign in</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
