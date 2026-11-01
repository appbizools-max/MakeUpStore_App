import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { ArrowLeft } from 'lucide-react';

export const MobileLoginScreen = () => {
  const { userRole, userProfile, setUserProfile, setCurrentScreen, prefetchUserProfile } = useApp();
  const [mobileNumber, setMobileNumber] = useState('');

  const cleanDigits = mobileNumber.replace(/\D/g, '');
  const isValid = cleanDigits.length === 10;

  const getRoleTitle = () => {
    switch (userRole) {
      case 'salon': return 'Salon';
      case 'artist': return 'Makeup Artist';
      case 'beautician': return 'Beautician';
      case 'general':
      default: return 'General User';
    }
  };

  const handleInputChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    if (raw.length > 5) {
      setMobileNumber(`${raw.slice(0, 5)} ${raw.slice(5)}`);
    } else {
      setMobileNumber(raw);
    }
  };

  const handleSendOtp = () => {
    if (!isValid) return;
    const fullPhone = `+91 ${cleanDigits.slice(0, 5)} ${cleanDigits.slice(5)}`;
    setUserProfile(prev => ({
      ...prev,
      phone: fullPhone,
    }));
    if (prefetchUserProfile) {
      prefetchUserProfile(fullPhone);
    }
    setCurrentScreen('otp');
  };

  return (
    <div className="min-h-screen bg-white p-5 flex flex-col justify-between select-none animate-fade-in">
      <div>
        {/* Top Header: Back Arrow & Selected Role Pill Badge */}
        <div className="flex items-center justify-between mt-2 mb-6">
          <button
            onClick={() => setCurrentScreen('onboarding')}
            className="w-10 h-10 rounded-full bg-white border border-[#FCE4EC] flex items-center justify-center text-[#C2477A] shadow-sm hover:bg-[#FFF5F8]"
          >
            <ArrowLeft size={20} />
          </button>

          <span className="bg-[#FFF5F8] border border-[#F5A8C0] px-3.5 py-1.5 rounded-full text-xs font-black text-[#C2477A]">
            {getRoleTitle()}
          </span>
        </div>

        {/* Heading Title & Subtitle matching Reference UI */}
        <h2 className="text-2xl font-black text-[#3A2430] mb-1.5">
          Enter your mobile number
        </h2>
        <p className="text-xs font-medium text-[#8C7078] mb-8 leading-relaxed">
          We'll send you a 4-digit verification code.
        </p>

        {/* Mobile Input Field Box */}
        <div className={`border rounded-full py-3.5 px-5 flex items-center shadow-sm mb-6 transition-all ${isValid ? 'border-[#C2477A]' : 'border-[#FCE4EC]'}`}>
          {/* Indian Flag Badge Visual */}
          <div className="w-6 h-4 bg-[#FF9933] rounded-xs mr-2 overflow-hidden flex flex-col justify-between border border-[#E8DDD7]">
            <div className="h-1.5 bg-[#FF9933]"></div>
            <div className="h-1.5 bg-white flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-[#000080]"></div>
            </div>
            <div className="h-1.5 bg-[#138808]"></div>
          </div>

          {/* Country Code +91 */}
          <span className="text-sm font-black text-[#3A2430] mr-2">
            +91
          </span>

          <span className="text-sm text-[#8C7078] mr-3">|</span>

          {/* Clean Mobile Input */}
          <input
            type="tel"
            value={mobileNumber}
            onChange={handleInputChange}
            maxLength={11}
            className="flex-1 text-sm font-bold text-[#3A2430] bg-transparent outline-none"
            placeholder="Enter 10-digit number"
            autoFocus
          />
        </div>

        {/* Send OTP Primary Action Button */}
        <button
          onClick={handleSendOtp}
          disabled={!isValid}
          className={`w-full py-4 rounded-full font-black text-base tracking-wide transition-all mb-4 ${
            isValid
              ? 'bg-[#C2477A] text-white shadow-lg hover:bg-[#a83765] active:scale-[0.99] cursor-pointer'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Send OTP
        </button>
      </div>

      {/* Footer Legal Terms Notice */}
      <div className="text-center mb-2">
        <p className="text-xs text-[#8C7078] leading-relaxed">
          By continuing, you agree to our{' '}
          <span className="text-[#C2477A] font-bold underline cursor-pointer">Terms</span> &{' '}
          <span className="text-[#C2477A] font-bold underline cursor-pointer">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
};
