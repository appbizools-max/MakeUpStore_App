import React from 'react';
import { useApp } from '../context/AppContext.jsx';

export const SplashScreen = () => {
  const { setCurrentScreen, userProfile } = useApp();

  const handleProceed = () => {
    if (userProfile?.isProfileComplete) {
      setCurrentScreen('home');
    } else {
      setCurrentScreen('onboarding');
    }
  };

  return (
    <div
      onClick={handleProceed}
      onWheel={handleProceed}
      onTouchMove={handleProceed}
      className="min-h-screen bg-gradient-to-b from-[#FDEAF1] via-[#FFF0F5] to-white flex flex-col items-center justify-center cursor-pointer relative px-6 select-none animate-fade-in"
    >
      <div className="text-center -mt-8 flex flex-col items-center">
        {/* Approved Brand Logo */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white/90 p-2.5 shadow-md border border-[#FCE4EC] flex items-center justify-center mb-4 backdrop-blur-xs transition-transform hover:scale-105 duration-300">
          <img
            src="/Assets/Logo.png"
            alt="Salbeau Luxe Logo"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Brand Title with Home screen GreatVibes font */}
        <h1
          style={{ fontFamily: "'Great Vibes', cursive" }}
          className="text-6xl text-[#C2477A] font-normal tracking-wide mb-2 drop-shadow-xs"
        >
          Salbeau
        </h1>
        {/* Subtitle matching reference design */}
        <p className="text-sm font-medium text-[#8C7078] tracking-wide">
          Beauty, priced right for you.
        </p>
      </div>

      {/* Bottom Page Indicator Dots matching reference design */}
      <div className="absolute bottom-12 flex items-center justify-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#C2477A]"></div>
        <div className="w-2 h-2 rounded-full bg-[#F5A8C0]/60"></div>
      </div>
    </div>
  );
};
