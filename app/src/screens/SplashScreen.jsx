import React from 'react';
import { useApp } from '../context/AppContext';

export const SplashScreen = () => {
  const { setCurrentScreen } = useApp();

  const handleProceed = () => {
    setCurrentScreen('onboarding');
  };

  return (
    <div
      onClick={handleProceed}
      onWheel={handleProceed}
      onTouchMove={handleProceed}
      className="min-h-screen bg-gradient-to-b from-[#FDEAF1] via-[#FFF0F5] to-white flex flex-col items-center justify-center cursor-pointer relative px-6 select-none animate-fade-in"
    >
      <div className="text-center -mt-12">
        {/* Brand Title with Home screen GreatVibes font */}
        <h1
          style={{ fontFamily: "'Great Vibes', cursive" }}
          className="text-6xl text-[#C2477A] font-normal tracking-wide mb-3 drop-shadow-sm"
        >
          Salbeau
        </h1>
        {/* Subtitle matching reference design */}
        <p className="text-sm font-medium text-[#8C7078] tracking-wide">
          Beauty, priced right for you.
        </p>
      </div>

      {/* Bottom Page Indicator Dots matching reference image */}
      <div className="absolute bottom-12 flex items-center justify-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#C2477A]"></div>
        <div className="w-2 h-2 rounded-full bg-[#F5A8C0]/60"></div>
      </div>
    </div>
  );
};
