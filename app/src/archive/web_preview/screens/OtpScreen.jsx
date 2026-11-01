import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { ArrowLeft, Clock, RefreshCw } from 'lucide-react';
import { isB2BRole } from '../utils/b2bVerificationService';

export const OtpScreen = () => {
  const { userRole, userProfile, setCurrentScreen, checkUserExistingProfile, prefetchUserProfile } = useApp();
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timerSeconds, setTimerSeconds] = useState(120);
  const [isVerifying, setIsVerifying] = useState(false);
  const inFlightRef = useRef(false);
  const inputRefs = useRef([]);

  const isOtpComplete = otp.every(d => d.trim().length === 1);

  useEffect(() => {
    if (prefetchUserProfile && userProfile?.phone) {
      prefetchUserProfile(userProfile.phone);
    }
  }, [userProfile?.phone]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const formattedMins = String(mins).padStart(2, '0');
    const formattedSecs = String(secs).padStart(2, '0');
    return `${formattedMins}:${formattedSecs}`;
  };

  const getRoleTitle = () => {
    switch (userRole) {
      case 'salon': return 'Salon';
      case 'artist': return 'Makeup Artist';
      case 'beautician': return 'Beautician';
      case 'general':
      default: return 'General User';
    }
  };

  const handleDigitChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal) {
      const updated = [...otp];
      updated[index] = '';
      setOtp(updated);
      return;
    }

    if (cleanVal.length > 1) {
      // User pasted multiple digits
      const digits = cleanVal.slice(0, 4).split('');
      const updated = [...otp];
      digits.forEach((d, i) => {
        if (i < 4) updated[i] = d;
      });
      setOtp(updated);
      const nextIdx = Math.min(digits.length, 3);
      if (inputRefs.current[nextIdx]) {
        inputRefs.current[nextIdx].focus();
      }
      return;
    }

    const updated = [...otp];
    updated[index] = cleanVal;
    setOtp(updated);

    if (index < 3 && cleanVal) {
      if (inputRefs.current[index + 1]) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      if (inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handleVerifyOtp = async () => {
    if (!isOtpComplete || inFlightRef.current) return;
    inFlightRef.current = true;
    setIsVerifying(true);

    try {
      let isComplete = false;
      if (checkUserExistingProfile) {
        isComplete = await checkUserExistingProfile(userProfile?.phone);
      }

      // Check if user is B2B (either chosen on role screen or stored in existing profile)
      const effectiveRole = (userProfile?.role || userRole || '').toLowerCase().trim();
      const isB2B = isB2BRole(effectiveRole);

      if (isB2B) {
        // DIRECTLY OPEN B2B PROFESSIONAL VERIFICATION USER ACCOUNT FOR ALL B2B USERS
        setCurrentScreen('b2b_verification');
        return;
      }

      // For General User (B2C):
      if (isComplete) {
        setCurrentScreen('home');
      } else {
        setCurrentScreen('complete_profile');
      }
    } catch (e) {
      const effectiveRole = (userProfile?.role || userRole || '').toLowerCase().trim();
      if (isB2BRole(effectiveRole)) {
        setCurrentScreen('b2b_verification');
      } else {
        setCurrentScreen('complete_profile');
      }
    } finally {
      inFlightRef.current = false;
      setIsVerifying(false);
    }
  };

  const handleResendOtp = () => {
    setTimerSeconds(120);
    setOtp(['', '', '', '']);
    if (inputRefs.current[0]) inputRefs.current[0].focus();
  };

  return (
    <div className="min-h-screen bg-white p-5 flex flex-col justify-between select-none animate-fade-in">
      <div>
        {/* Top Header: Back Arrow & Selected Role Pill Badge */}
        <div className="flex items-center justify-between mt-2 mb-6">
          <button
            onClick={() => setCurrentScreen('login')}
            className="w-10 h-10 rounded-full bg-white border border-[#FCE4EC] flex items-center justify-center text-[#C2477A] shadow-sm hover:bg-[#FFF5F8]"
          >
            <ArrowLeft size={20} />
          </button>

          <span className="bg-white border border-[#F5A8C0] px-3.5 py-1.5 rounded-full text-xs font-black text-[#C2477A] shadow-xs">
            {getRoleTitle()}
          </span>
        </div>

        {/* Heading Title & Subtitle */}
        <h2 className="text-2xl font-black text-[#3A2430] mb-1.5">
          Verify OTP
        </h2>
        <p className="text-xs font-medium text-[#8C7078] mb-2 leading-relaxed">
          Sent verification code to <span className="font-bold text-[#3A2430]">{userProfile?.phone || ''}</span>
        </p>
        <p className="text-[11px] text-[#C2477A] font-semibold mb-6">
          Enter 4-digit code (e.g. 1234)
        </p>

        {/* 4-Digit Crisp White OTP Inputs */}
        <div className="flex justify-around mb-8 px-2">
          {otp.map((digit, index) => (
            <div
              key={index}
              className={`w-14 h-14 rounded-2xl border bg-white flex items-center justify-center shadow-xs transition-all ${
                digit ? 'border-[#C2477A] ring-1 ring-[#C2477A]' : 'border-[#F5A8C0]'
              }`}
            >
              <input
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                value={digit}
                maxLength={4}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="text-2xl font-black text-[#3A2430] text-center w-full bg-transparent outline-none"
                autoFocus={index === 0}
              />
            </div>
          ))}
        </div>

        {/* 2:00 Countdown Timer Display */}
        <div className="flex justify-center mb-8">
          {timerSeconds > 0 ? (
            <div className="bg-white border border-[#FCE4EC] px-4 py-2 rounded-full flex items-center gap-2 shadow-xs">
              <Clock size={16} className="text-[#C2477A]" />
              <span className="text-xs font-semibold text-[#8C7078]">
                Resend OTP in <span className="text-sm font-black text-[#C2477A]">{formatTimer(timerSeconds)}</span>
              </span>
            </div>
          ) : (
            <button
              onClick={handleResendOtp}
              className="bg-white border border-[#F5A8C0] px-4 py-2 rounded-full flex items-center gap-1.5 text-xs font-black text-[#C2477A] shadow-xs cursor-pointer hover:bg-[#FFF5F8]"
            >
              <RefreshCw size={14} />
              <span>Resend OTP</span>
            </button>
          )}
        </div>

        {/* Verify & Continue Button */}
        <button
          onClick={handleVerifyOtp}
          disabled={!isOtpComplete || isVerifying}
          className={`w-full py-4 rounded-full font-black text-base tracking-wide transition-all mb-4 ${
            isOtpComplete && !isVerifying
              ? 'bg-[#C2477A] text-white shadow-lg hover:bg-[#a83765] active:scale-[0.99] cursor-pointer'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isVerifying ? 'Verifying...' : 'Verify & Continue'}
        </button>
      </div>

      {/* Footer Notice */}
      <div className="text-center mb-2">
        <p className="text-xs text-[#8C7078] leading-relaxed">
          Didn't receive the code? Check spam or tap resend above.
        </p>
      </div>
    </div>
  );
};
