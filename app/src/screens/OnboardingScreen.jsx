import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { ShoppingBag, Store, Brush, Sparkles, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

export const OnboardingScreen = () => {
  const { userRole, setUserRole, setCurrentScreen } = useApp();
  const [selectedRole, setSelectedRole] = useState(userRole || 'salon');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const roles = [
    { id: 'general', title: 'General User', icon: <ShoppingBag size={18} /> },
    { id: 'salon', title: 'Salon', icon: <Store size={18} /> },
    { id: 'artist', title: 'Makeup Artist', icon: <Brush size={18} /> },
    { id: 'beautician', title: 'Beautician', icon: <Sparkles size={18} /> },
  ];

  const currentRoleObj = roles.find(r => r.id === selectedRole);

  const handleSelectRole = (roleId) => {
    setSelectedRole(roleId);
    setDropdownOpen(false);
  };

  const handleContinue = () => {
    setUserRole(selectedRole);
    setCurrentScreen('login');
  };

  return (
    <div className="min-h-screen bg-white p-5 flex flex-col justify-between select-none animate-fade-in">
      <div>
        {/* Top Centered Brand Logo */}
        <div className="text-center mt-2 mb-4">
          <h1
            style={{ fontFamily: "'Great Vibes', cursive" }}
            className="text-4xl text-[#C2477A] font-normal tracking-wide drop-shadow-sm"
          >
            Salbeau
          </h1>
        </div>

        {/* Heading Title & Subtitle */}
        <h2 className="text-2xl font-black text-[#3A2430] mb-1.5">
          Who's shopping today?
        </h2>
        <p className="text-xs font-medium text-[#8C7078] mb-6 leading-relaxed">
          Choose your account type to see the right pricing for you.
        </p>

        {/* Dropdown Container */}
        <div className="relative z-30 mb-4">
          <label className="block text-xs font-semibold text-[#8C7078] mb-2 ml-1">
            Account Type
          </label>

          {/* Medium Dropdown Field Pill */}
          <div
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="border border-[#F5A8C0] bg-white rounded-full py-3.5 px-5 flex items-center justify-between shadow-sm cursor-pointer transition-all hover:border-[#C2477A]"
          >
            <div className="flex items-center gap-3">
              <span className="text-[#C2477A]">
                {currentRoleObj ? currentRoleObj.icon : null}
              </span>
              <span className="text-sm font-bold text-[#3A2430]">
                {currentRoleObj ? currentRoleObj.title : 'Select account type'}
              </span>
            </div>
            {dropdownOpen ? (
              <ChevronUp size={18} className="text-[#C2477A]" />
            ) : (
              <ChevronDown size={18} className="text-[#C2477A]" />
            )}
          </div>

          {/* Medium Floating Dropdown Options Overlay */}
          {dropdownOpen && (
            <div className="bg-white rounded-3xl border border-[#FCE4EC] p-2 shadow-xl mt-2 z-40 space-y-1">
              {roles.map((role) => {
                const isSelected = selectedRole === role.id;
                return (
                  <div
                    key={role.id}
                    onClick={() => handleSelectRole(role.id)}
                    className={`rounded-2xl py-3 px-4 flex items-center justify-between cursor-pointer transition-all ${
                      isSelected ? 'bg-[#FDEAF1] text-[#C2477A]' : 'bg-white text-[#3A2430] hover:bg-[#FFF5F8]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isSelected ? 'text-[#C2477A]' : 'text-[#8C7078]'}>
                        {role.icon}
                      </span>
                      <span className={`text-sm font-extrabold ${isSelected ? 'text-[#C2477A]' : 'text-[#3A2430]'}`}>
                        {role.title}
                      </span>
                    </div>

                    {isSelected && <CheckCircle2 size={18} className="text-[#C2477A]" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Button */}
      <div className="mt-6 mb-4">
        <button
          onClick={handleContinue}
          className="w-full bg-[#C2477A] text-white py-4 rounded-full font-black text-base tracking-wide shadow-lg hover:bg-[#a83765] active:scale-[0.99] transition-all"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
