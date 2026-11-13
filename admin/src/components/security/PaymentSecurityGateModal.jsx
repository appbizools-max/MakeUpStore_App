import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  KeyRound,
  QrCode,
  Smartphone,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  X,
  Eye,
  EyeOff,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import {
  getAdminSecurityProfile,
  verifyAdminPassword,
  verifyTotpCode,
  verifyRecoveryCode,
  recordFailedVerificationAttempt,
  resetFailedAttempts,
  issuePaymentAccessSession,
  getRemainingTotpSeconds,
  logSecurityAuditEvent,
  TOTP_TIME_STEP_SECONDS,
  MAX_FAILED_ATTEMPTS
} from '../../utils/totpSecurityEngine';

export default function PaymentSecurityGateModal({
  isOpen,
  onClose,
  onSuccess,
  currentAuthUser,
  onNavigateToSetup2FA,
  targetSectionName = 'Payment & UPI Gateway'
}) {
  const adminEmail = currentAuthUser?.email || 'admin@salbeau.com';

  // Security Verification Step: 1 = Password, 2 = Authenticator OTP, 'setup_required' = 2FA not enabled
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Form Inputs
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpInput, setOtpInput] = useState(['', '', '', '', '', '']);
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [recoveryCodeInput, setRecoveryCodeInput] = useState('');

  // Status & Validation
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState(MAX_FAILED_ATTEMPTS);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutMinutes, setLockoutMinutes] = useState(0);

  // Live 30-Second TOTP Window Countdown
  const [secondsRemaining, setSecondsRemaining] = useState(getRemainingTotpSeconds());

  const otpInputRefs = useRef([]);
  const passwordInputRef = useRef(null);

  // 1. Load Profile & Check 2FA State whenever modal opens
  useEffect(() => {
    let isMounted = true;
    async function loadProfile() {
      if (!isOpen) return;
      setIsLoadingProfile(true);
      setErrorMessage('');
      setPasswordInput('');
      setOtpInput(['', '', '', '', '', '']);
      setUseRecoveryCode(false);
      setRecoveryCodeInput('');
      setIsVerifying(false);

      try {
        const secProfile = await getAdminSecurityProfile(adminEmail);
        if (!isMounted) return;
        setProfile(secProfile);

        // Check Lockout
        if (secProfile?.locked_until) {
          const lockTime = new Date(secProfile.locked_until).getTime();
          const now = Date.now();
          if (lockTime > now) {
            setIsLocked(true);
            setLockoutMinutes(Math.ceil((lockTime - now) / 60000));
            return;
          }
        }

        setIsLocked(false);
        const failed = secProfile?.failed_attempts || 0;
        setRemainingAttempts(Math.max(0, MAX_FAILED_ATTEMPTS - failed));

        // If 2FA is not enabled on this account, guide to setup first
        if (!secProfile?.is_2fa_enabled) {
          setStep('setup_required');
        } else {
          setStep(1); // Start with Step 1: Admin Password
        }
      } catch (err) {
        console.error('Error loading security profile:', err);
      } finally {
        if (isMounted) setIsLoadingProfile(false);
      }
    }

    loadProfile();
    return () => { isMounted = false; };
  }, [isOpen, adminEmail]);

  // Focus password input when Step 1 loads
  useEffect(() => {
    if (isOpen && step === 1 && !isLocked && !isLoadingProfile) {
      setTimeout(() => passwordInputRef.current?.focus(), 150);
    }
  }, [isOpen, step, isLocked, isLoadingProfile]);

  // Live 30-Second TOTP window ticker
  useEffect(() => {
    if (step !== 2 || !isOpen) return;
    const interval = setInterval(() => {
      setSecondsRemaining(getRemainingTotpSeconds());
    }, 1000);
    return () => clearInterval(interval);
  }, [step, isOpen]);

  // Focus first OTP box when entering Step 2
  useEffect(() => {
    if (step === 2 && !useRecoveryCode) {
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    }
  }, [step, useRecoveryCode]);

  // ── STEP 1: PASSWORD VERIFICATION HANDLER ──
  const handleVerifyPassword = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!passwordInput.trim()) {
      setErrorMessage('Please enter your administrator password.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');

    try {
      const res = await verifyAdminPassword(adminEmail, passwordInput, profile);
      if (res.locked) {
        setIsLocked(true);
        setErrorMessage(res.reason);
        return;
      }

      if (!res.success) {
        const failRes = await recordFailedVerificationAttempt(adminEmail, 'PASSWORD_INCORRECT');
        if (failRes.locked) {
          setIsLocked(true);
          setErrorMessage('Too many failed attempts. Account temporarily locked for 15 minutes.');
        } else {
          setRemainingAttempts(failRes.remainingAttempts);
          setErrorMessage(`Incorrect administrator password. ${failRes.remainingAttempts} attempt(s) remaining.`);
        }
        return;
      }

      // Password Success: Move to Step 2 (Authenticator OTP)
      await logSecurityAuditEvent({
        adminId: profile?.user_id || 'admin_root',
        adminEmail,
        action: 'VERIFY_PASSWORD_SUCCESS',
        status: 'SUCCESS'
      });

      setStep(2);
    } catch (err) {
      setErrorMessage(err.message || 'Verification failed. Please retry.');
    } finally {
      setIsVerifying(false);
    }
  };

  // ── STEP 2: TOTP CODE VERIFICATION HANDLER ──
  const handleVerifyOtp = async (codeToVerify) => {
    const code = codeToVerify || otpInput.join('');
    if (!code || code.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit code from your authenticator app.');
      return;
    }

    if (!profile?.totp_secret) {
      setErrorMessage('No TOTP secret configured. Please complete 2FA setup.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');

    try {
      const result = await verifyTotpCode(code, profile.totp_secret, 1);
      if (!result.valid) {
        const failRes = await recordFailedVerificationAttempt(adminEmail, 'TOTP_INVALID');
        if (failRes.locked) {
          setIsLocked(true);
          setErrorMessage('Too many failed attempts. Account temporarily locked for 15 minutes.');
        } else {
          setRemainingAttempts(failRes.remainingAttempts);
          setErrorMessage(`Invalid or expired authenticator code. ${failRes.remainingAttempts} attempt(s) remaining.`);
        }
        return;
      }

      // Verification Complete: Reset attempts, log audit, issue session token, and grant access
      await resetFailedAttempts(adminEmail);
      await logSecurityAuditEvent({
        adminId: profile.user_id,
        adminEmail,
        action: 'PAYMENT_ACCESS_GRANTED',
        status: 'SUCCESS',
        details: { target: targetSectionName, delta: result.delta }
      });

      issuePaymentAccessSession(adminEmail);

      if (typeof onSuccess === 'function') {
        onSuccess();
      }
    } catch (err) {
      setErrorMessage(err.message || 'OTP verification failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  // ── BACKUP RECOVERY CODE HANDLER ──
  const handleVerifyRecoveryCode = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!recoveryCodeInput.trim()) {
      setErrorMessage('Please enter a valid backup recovery code.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');

    try {
      const res = await verifyRecoveryCode(adminEmail, recoveryCodeInput, profile);
      if (!res.valid) {
        const failRes = await recordFailedVerificationAttempt(adminEmail, 'RECOVERY_CODE_INVALID');
        setRemainingAttempts(failRes.remainingAttempts);
        setErrorMessage(res.reason || 'Invalid recovery code.');
        return;
      }

      // Recovery Code Success
      await resetFailedAttempts(adminEmail);
      issuePaymentAccessSession(adminEmail);

      if (typeof onSuccess === 'function') {
        onSuccess();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Recovery code verification error.');
    } finally {
      setIsVerifying(false);
    }
  };

  // ── OTP INPUT CHANGE & AUTO-SUBMIT ──
  const handleOtpDigitChange = (index, value) => {
    const cleanVal = value.replace(/[^0-9]/g, '').slice(-1);
    const newOtp = [...otpInput];
    newOtp[index] = cleanVal;
    setOtpInput(newOtp);

    // Auto-advance cursor
    if (cleanVal && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (cleanVal && index === 5) {
      const fullCode = newOtp.join('');
      if (fullCode.length === 6) {
        handleVerifyOtp(fullCode);
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpInput[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pasted) return;
    const newOtp = [...otpInput];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtpInput(newOtp);

    if (pasted.length === 6) {
      handleVerifyOtp(pasted);
    } else {
      otpInputRefs.current[Math.min(5, pasted.length)]?.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isVerifying) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden flex flex-col relative animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── TOP BANNER ── */}
        <div className="p-5 sm:px-6 bg-gradient-to-r from-purple-950 via-gray-900 to-[#5a1336] text-white flex items-center justify-between relative overflow-hidden">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-rose-300 shadow-inner">
              <Shield className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black tracking-tight text-white">Enterprise Security Gate</h3>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/30 text-[10px] font-black text-rose-300 uppercase tracking-wider">
                  2FA Required
                </span>
              </div>
              <p className="text-[11px] text-gray-300 font-medium mt-0.5">
                Protecting: <span className="text-white font-bold">{targetSectionName}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isVerifying}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-all cursor-pointer relative z-10"
            title="Cancel & Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── MODAL CONTENT ── */}
        <div className="p-6 space-y-5">
          {/* Locked Out Alert */}
          {isLocked && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-3 animate-shake">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold block">Account Temporarily Locked</span>
                <p className="text-[11px] text-rose-700 mt-1 leading-relaxed">
                  Maximum failed verification attempts reached. To protect store payment assets, access is suspended for{' '}
                  <strong>{lockoutMinutes} minute(s)</strong>.
                </p>
              </div>
            </div>
          )}

          {/* General Error Message */}
          {errorMessage && !isLocked && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2.5 animate-fade-in">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span className="flex-1">{errorMessage}</span>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* CASE A: 2FA NOT SETUP YET (GUIDE TO SETUP)                     */}
          {/* ───────────────────────────────────────────────────────────── */}
          {step === 'setup_required' && !isLoadingProfile && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-purple-50 text-purple-700 border border-purple-200 mx-auto flex items-center justify-center shadow-sm">
                <Smartphone size={32} />
              </div>

              <div>
                <h4 className="text-base font-black text-gray-900">Two-Factor Authentication Setup Required</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  To safeguard store payout credentials, UPI addresses, and payment gateways, you must first link an authenticator app (Google Authenticator or Microsoft Authenticator).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 text-left space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-950">
                  <Sparkles size={14} className="text-purple-600" />
                  <span>Mandatory Enterprise Security Checklist:</span>
                </div>
                <ul className="text-[11px] text-purple-900/80 space-y-1 pl-4 list-disc font-medium">
                  <li>Generate unique RFC 6238 TOTP secret</li>
                  <li>Scan QR code in Google or Microsoft Authenticator</li>
                  <li>Store 8 backup emergency recovery codes</li>
                </ul>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (typeof onNavigateToSetup2FA === 'function') {
                      onNavigateToSetup2FA();
                    }
                  }}
                  className="w-full py-3 bg-gradient-to-r from-purple-700 to-[#D81B60] hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <KeyRound size={15} />
                  <span>Setup 2FA Now in Security Settings</span>
                  <ArrowRight size={14} />
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel & Exit
                </button>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* STEP 1: CURRENT ADMIN PASSWORD VERIFICATION                   */}
          {/* ───────────────────────────────────────────────────────────── */}
          {step === 1 && !isLoadingProfile && !isLocked && (
            <form onSubmit={handleVerifyPassword} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[11px] font-black flex items-center justify-center">
                    1
                  </span>
                  <span className="text-xs font-bold text-gray-900">Step 1 of 2: Admin Password Confirmation</span>
                </div>
                <span className="text-[11px] text-gray-400 font-medium">
                  {remainingAttempts} attempt(s) left
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1.5">
                  Current Administrator Password
                </label>
                <div className="relative">
                  <input
                    ref={passwordInputRef}
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter your login password"
                    disabled={isVerifying}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 outline-none focus:border-purple-600 bg-white shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <span className="text-[10px] text-gray-500 font-medium mt-1 block">
                  Verify identity for account: <strong className="text-gray-800">{adminEmail}</strong>
                </span>
              </div>

              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isVerifying}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifying || !passwordInput.trim()}
                  className="flex-1 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isVerifying ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Next: 2FA Code</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* STEP 2: TOTP 6-DIGIT AUTHENTICATOR CODE                       */}
          {/* ───────────────────────────────────────────────────────────── */}
          {step === 2 && !useRecoveryCode && !isLoadingProfile && !isLocked && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-black flex items-center justify-center">
                    2
                  </span>
                  <span className="text-xs font-bold text-gray-900">Step 2 of 2: Authenticator App Code</span>
                </div>

                {/* 30-Second Countdown Meter */}
                <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200/60">
                  <Clock size={12} className="text-purple-600" />
                  <span>{secondsRemaining}s</span>
                </div>
              </div>

              <div className="text-center">
                <p className="text-xs text-gray-600 font-medium">
                  Open <strong>Google Authenticator</strong> or <strong>Microsoft Authenticator</strong> on your phone and enter the 6-digit code for <strong>Salbeau</strong>.
                </p>
              </div>

              {/* 6 Digit Input Boxes */}
              <div className="flex items-center justify-center gap-2 sm:gap-2.5 my-3" onPaste={handleOtpPaste}>
                {otpInput.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    disabled={isVerifying}
                    className="w-11 h-12 sm:w-12 sm:h-14 text-center font-mono font-black text-lg sm:text-xl rounded-xl border-2 border-purple-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none bg-white shadow-2xs transition-all text-gray-900"
                  />
                ))}
              </div>

              {/* Live progress indicator bar */}
              <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
                <div
                  className="bg-purple-600 h-full transition-all duration-1000"
                  style={{ width: `${(secondsRemaining / TOTP_TIME_STEP_SECONDS) * 100}%` }}
                />
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleVerifyOtp()}
                  disabled={isVerifying || otpInput.join('').length !== 6}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-700 to-[#D81B60] hover:opacity-95 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isVerifying ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Validating Security Token...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={15} />
                      <span>Unlock Payment Configurations</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-gray-500 hover:text-gray-800 font-bold underline cursor-pointer"
                  >
                    ← Back to Password
                  </button>

                  <button
                    type="button"
                    onClick={() => setUseRecoveryCode(true)}
                    className="text-purple-700 hover:text-purple-900 font-bold underline cursor-pointer"
                  >
                    Lost phone? Use Recovery Code
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* STEP 2 FALLBACK: RECOVERY CODE                                */}
          {/* ───────────────────────────────────────────────────────────── */}
          {step === 2 && useRecoveryCode && !isLoadingProfile && !isLocked && (
            <form onSubmit={handleVerifyRecoveryCode} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-900">Emergency Recovery Code</span>
                <button
                  type="button"
                  onClick={() => setUseRecoveryCode(false)}
                  className="text-[11px] text-purple-700 font-bold underline cursor-pointer"
                >
                  Use Authenticator App
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Enter 8-Character Recovery Code
                </label>
                <input
                  type="text"
                  value={recoveryCodeInput}
                  onChange={(e) => setRecoveryCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. SALB-7K9A-2X4M"
                  disabled={isVerifying}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 text-xs font-mono font-bold text-gray-900 outline-none focus:border-purple-600 bg-white shadow-2xs uppercase tracking-wider"
                />
                <span className="text-[10px] text-gray-500 font-medium mt-1 block">
                  Recovery codes are one-time use emergency keys provided during 2FA setup.
                </span>
              </div>

              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setUseRecoveryCode(false)}
                  disabled={isVerifying}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifying || !recoveryCodeInput.trim()}
                  className="flex-1 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isVerifying ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Verify Recovery Code</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Loading Indicator */}
          {isLoadingProfile && (
            <div className="py-8 text-center flex flex-col items-center justify-center gap-3">
              <span className="w-7 h-7 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold text-gray-600">Checking Security Status...</span>
            </div>
          )}
        </div>

        {/* ── FOOTER NOTICE ── */}
        <div className="p-3 bg-gray-50 border-t border-gray-100 text-center text-[10px] text-gray-400 font-medium">
          🔒 Salbeau Bank-Grade Encryption • Zero Mock Authentication • RFC 6238 Standard
        </div>
      </div>
    </div>
  );
}

