import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { ArrowLeft, Clock, RefreshCw } from 'lucide-react';

export const OtpScreen = () => {
  const { userRole, userProfile, setCurrentScreen } = useApp();
  const [otp, setOtp] = useState(['4', '8', '2', '1']);
  const [timerSeconds, setTimerSeconds] = useState(120);

  useEffect(() => {
    if (timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [timerSeconds]);

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

  const handleVerifyOtp = () => {
    setCurrentScreen('home');
  };

  const handleResendOtp = () => {
    setTimerSeconds(120);
    setOtp(['4', '8', '2', '1']);
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
        <p className="text-xs font-medium text-[#8C7078] mb-8 leading-relaxed">
          Sent verification code to <span className="font-bold text-[#3A2430]">{userProfile?.phone || '+91 98765 43210'}</span>
        </p>

        {/* 4-Digit Crisp White OTP Inputs */}
        <div className="flex justify-around mb-8 px-2">
          {otp.map((digit, index) => (
            <div
              key={index}
              className="w-14 h-14 rounded-2xl border border-[#F5A8C0] bg-white flex items-center justify-center shadow-xs"
            >
              <input
                type="text"
                value={digit}
                maxLength={1}
                onChange={(e) => {
                  const updated = [...otp];
                  updated[index] = e.target.value;
                  setOtp(updated);
                }}
                className="text-2xl font-black text-[#3A2430] text-center w-full bg-transparent outline-none"
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
              className="bg-white border border-[#F5A8C0] px-4 py-2 rounded-full flex items-center gap-1.5 text-xs font-black text-[#C2477A] shadow-xs"
            >
              <RefreshCw size={14} />
              <span>Resend OTP</span>
            </button>
          )}
        </div>

        {/* Verify & Continue Button */}
        <button
          onClick={handleVerifyOtp}
          className="w-full bg-[#C2477A] text-white py-4 rounded-full font-black text-base tracking-wide shadow-lg hover:bg-[#a83765] active:scale-[0.99] transition-all mb-4"
        >
          Verify & Continue
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
