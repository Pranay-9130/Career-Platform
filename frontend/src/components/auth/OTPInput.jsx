import React, { useRef, useEffect } from 'react';

export default function OTPInput({
  value = ['', '', '', '', '', ''],
  onChange,
  onComplete,
  disabled = false,
  error = false,
  autoFocus = true,
}) {
  const inputRefs = useRef([]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus, disabled]);

  const handleChange = (index, e) => {
    const rawVal = e.target.value;
    const digit = rawVal.replace(/\D/g, '').slice(-1);

    const newOtp = [...value];
    newOtp[index] = digit;
    onChange(newOtp);

    // Auto-advance to next box if digit entered
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Trigger onComplete when all 6 filled
    if (newOtp.every((d) => d !== '') && onComplete) {
      onComplete(newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        // Move to previous and clear it
        const newOtp = [...value];
        newOtp[index - 1] = '';
        onChange(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...value];
        newOtp[index] = '';
        onChange(newOtp);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (!pastedData) return;

    const digits = pastedData.slice(0, 6).split('');
    const newOtp = [...value];

    digits.forEach((digit, i) => {
      newOtp[i] = digit;
    });

    onChange(newOtp);

    // Focus on next empty or the last input
    const nextIndex = Math.min(digits.length, 5);
    inputRefs.current[nextIndex]?.focus();

    if (newOtp.every((d) => d !== '') && onComplete) {
      onComplete(newOtp.join(''));
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
      {value.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          disabled={disabled}
          aria-label={`Digit ${index + 1} of verification code`}
          className={`w-11 h-13 sm:w-12 sm:h-14 text-center font-display font-bold text-xl sm:text-2xl rounded-xl border transition-all duration-150 focus:outline-none select-none ${
            disabled
              ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
              : error
              ? 'border-brand-error text-brand-error bg-red-50/40 focus:ring-2 focus:ring-brand-error/20 focus:border-brand-error'
              : digit
              ? 'border-brand-primary text-brand-primary bg-brand-veryLight/60 focus:ring-2 focus:ring-brand-primary/20'
              : 'border-brand-border text-brand-text bg-white hover:border-blue-300 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20'
          }`}
        />
      ))}
    </div>
  );
}
