import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { ArrowLeft, Edit3, Loader2 } from 'lucide-react';
import { isB2BRole } from '../utils/b2bVerificationService';

export const CompleteProfileScreen = () => {
  const { userRole, userProfile, saveUserProfile, setCurrentScreen } = useApp();

  const [fullName, setFullName] = useState(userProfile?.name || '');
  const [email, setEmail] = useState(userProfile?.email || '');
  const [pincode, setPincode] = useState(userProfile?.pincode || '');
  const [city, setCity] = useState(userProfile?.city || '');
  const [state, setState] = useState(userProfile?.state || '');

  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionError, setDetectionError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [fullNameTouched, setFullNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [pincodeTouched, setPincodeTouched] = useState(false);

  const cityInputRef = useRef(null);
  const stateInputRef = useRef(null);
  const pincodeCacheRef = useRef(new Map());

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = !email.trim() || emailRegex.test(email.trim());

  useEffect(() => {
    const cleanPin = pincode.replace(/\D/g, '');
    if (cleanPin.length === 6) {
      lookupPincode(cleanPin);
    } else {
      setDetectionError('');
      if (cleanPin.length === 0) {
        setCity('');
        setState('');
      }
    }
  }, [pincode]);

  const lookupPincode = async (code) => {
    // Check in-memory cache first
    if (pincodeCacheRef.current.has(code)) {
      const cached = pincodeCacheRef.current.get(code);
      if (cached.success) {
        setCity(cached.city);
        setState(cached.state);
        setDetectionError('');
      } else {
        setDetectionError(cached.error);
      }
      return;
    }

    setIsDetecting(true);
    setDetectionError('');

    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${code}`);
      const data = await response.json();

      if (data && Array.isArray(data) && data[0]?.Status === 'Success' && data[0].PostOffice?.length > 0) {
        const po = data[0].PostOffice[0];
        const detectedCity = po.District || po.Block || po.Division || po.Name || '';
        const detectedState = po.State || '';

        pincodeCacheRef.current.set(code, { success: true, city: detectedCity, state: detectedState });
        setCity(detectedCity);
        setState(detectedState);
        setDetectionError('');
      } else {
        const errorMsg = "We couldn't detect your location from this PIN code. Please check the PIN code or enter your location manually.";
        pincodeCacheRef.current.set(code, { success: false, error: errorMsg });
        setDetectionError(errorMsg);
      }
    } catch (err) {
      setDetectionError("We couldn't detect your location from this PIN code. Please check the PIN code or enter your location manually.");
    } finally {
      setIsDetecting(false);
    }
  };

  const isFormValid =
    fullName.trim().length >= 2 &&
    pincode.replace(/\D/g, '').length === 6 &&
    city.trim().length >= 2 &&
    state.trim().length >= 2 &&
    isEmailValid;

  const handleContinue = async (e) => {
    e.preventDefault();
    setFullNameTouched(true);
    setPincodeTouched(true);

    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);

    try {
      if (saveUserProfile) {
        await saveUserProfile({
          fullName: fullName.trim(),
          email: email.trim(),
          pincode: pincode.trim(),
          city: city.trim(),
          state: state.trim()
        });
      }
      if (isB2BRole(userRole)) {
        setCurrentScreen('b2b_verification');
      } else {
        setCurrentScreen('home');
      }
    } catch (err) {
      alert('Unable to save your profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-white min-h-screen flex flex-col justify-between animate-fade-in font-sans">
      <div>
        {/* Top Header */}
        <div className="flex items-center mb-6">
          <button
            type="button"
            onClick={() => setCurrentScreen('otp')}
            className="w-10 h-10 rounded-full bg-white border border-[#FCE4EC] flex items-center justify-center text-[#C2477A] hover:bg-[#FFF5F8] transition-all shadow-xs"
          >
            <ArrowLeft size={18} />
          </button>
        </div>

        {/* Title */}
        <div className="mb-7 text-center">
          <h1 className="text-2xl font-black text-[#3A2430] tracking-tight">
            Complete Your Profile
          </h1>
        </div>

        <form onSubmit={handleContinue} className="space-y-5">
          {/* Full Name * */}
          <div>
            <label className="block text-xs font-bold text-[#3A2430] mb-2">
              Full Name <span className="text-[#C2477A]">*</span>
            </label>
            <div
              className={`flex items-center border rounded-2xl px-4 py-3.5 bg-white shadow-xs transition-all ${
                fullNameTouched && fullName.trim().length < 2
                  ? 'border-[#E11D48] ring-1 ring-[#E11D48]'
                  : 'border-[#FCE4EC] focus-within:border-[#C2477A]'
              }`}
            >
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (!fullNameTouched) setFullNameTouched(true);
                }}
                onBlur={() => setFullNameTouched(true)}
                placeholder="Enter your full name"
                className="w-full text-sm font-semibold text-[#3A2430] outline-none placeholder:text-[#8C7078]"
              />
            </div>
            {fullNameTouched && fullName.trim().length < 2 && (
              <p className="text-[11px] font-bold text-[#E11D48] mt-1 ml-1">
                Please enter your full name.
              </p>
            )}
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-bold text-[#3A2430] mb-2">
              Email Address
            </label>
            <div
              className={`flex items-center border rounded-2xl px-4 py-3.5 bg-white shadow-xs transition-all ${
                emailTouched && !isEmailValid
                  ? 'border-[#E11D48] ring-1 ring-[#E11D48]'
                  : 'border-[#FCE4EC] focus-within:border-[#C2477A]'
              }`}
            >
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (!emailTouched) setEmailTouched(true);
                }}
                onBlur={() => setEmailTouched(true)}
                placeholder="Enter your email"
                className="w-full text-sm font-semibold text-[#3A2430] outline-none placeholder:text-[#8C7078]"
              />
            </div>
            {emailTouched && !isEmailValid && (
              <p className="text-[11px] font-bold text-[#E11D48] mt-1 ml-1">
                Please enter a valid email format.
              </p>
            )}
          </div>

          {/* PIN Code * */}
          <div>
            <label className="block text-xs font-bold text-[#3A2430] mb-2">
              PIN Code <span className="text-[#C2477A]">*</span>
            </label>
            <div
              className={`flex items-center justify-between border rounded-2xl px-4 py-3.5 bg-white shadow-xs transition-all ${
                pincodeTouched && pincode.replace(/\D/g, '').length !== 6
                  ? 'border-[#E11D48] ring-1 ring-[#E11D48]'
                  : 'border-[#FCE4EC] focus-within:border-[#C2477A]'
              }`}
            >
              <input
                type="text"
                maxLength={6}
                value={pincode}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setPincode(cleaned);
                  if (!pincodeTouched) setPincodeTouched(true);
                }}
                onBlur={() => setPincodeTouched(true)}
                placeholder="Enter PIN code"
                className="w-full text-sm font-bold text-[#3A2430] outline-none placeholder:text-[#8C7078]"
              />
              {isDetecting && (
                <Loader2 size={16} className="text-[#C2477A] animate-spin shrink-0 ml-2" />
              )}
            </div>

            {pincodeTouched && pincode.replace(/\D/g, '').length > 0 && pincode.replace(/\D/g, '').length < 6 && (
              <p className="text-[11px] font-bold text-[#E11D48] mt-1 ml-1">
                Please enter a valid 6-digit PIN code.
              </p>
            )}

            {detectionError && (
              <p className="text-[11px] font-semibold text-[#E11D48] mt-1.5 ml-1 leading-snug">
                {detectionError}
              </p>
            )}
          </div>

          {/* City */}
          <div>
            <label className="block text-xs font-bold text-[#3A2430] mb-2">
              City
            </label>
            <div
              onClick={() => cityInputRef.current?.focus()}
              className="flex items-center justify-between border border-[#FCE4EC] rounded-2xl px-4 py-3.5 bg-white shadow-xs focus-within:border-[#C2477A] cursor-text"
            >
              <input
                ref={cityInputRef}
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter City"
                className="w-full text-sm font-bold text-[#3A2430] outline-none placeholder:text-[#8C7078]"
              />
              <button
                type="button"
                onClick={() => cityInputRef.current?.focus()}
                className="text-[#8C7078] hover:text-[#C2477A] transition-colors shrink-0 ml-2 cursor-pointer"
              >
                <Edit3 size={15} />
              </button>
            </div>
          </div>

          {/* State */}
          <div>
            <label className="block text-xs font-bold text-[#3A2430] mb-2">
              State
            </label>
            <div
              onClick={() => stateInputRef.current?.focus()}
              className="flex items-center justify-between border border-[#FCE4EC] rounded-2xl px-4 py-3.5 bg-white shadow-xs focus-within:border-[#C2477A] cursor-text"
            >
              <input
                ref={stateInputRef}
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Enter State"
                className="w-full text-sm font-bold text-[#3A2430] outline-none placeholder:text-[#8C7078]"
              />
              <button
                type="button"
                onClick={() => stateInputRef.current?.focus()}
                className="text-[#8C7078] hover:text-[#C2477A] transition-colors shrink-0 ml-2 cursor-pointer"
              >
                <Edit3 size={15} />
              </button>
            </div>
          </div>

          {/* Continue Button */}
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className={`w-full py-4 rounded-full font-black text-base tracking-wide text-white shadow-lg transition-all flex items-center justify-center gap-2 mt-7 ${
              isFormValid && !isSubmitting
                ? 'bg-[#C2477A] hover:bg-[#B03A6A] cursor-pointer active:scale-[0.99]'
                : 'bg-[#C2477A]/40 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <span>Continue</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
