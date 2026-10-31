import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Shield,
  Key,
  Mail,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  RefreshCw,
  RotateCcw,
  User,
  ChevronRight,
  Search,
  Check,
  Copy
} from 'lucide-react';
import { useAdmin } from '../../../context/AdminContext';
import ImageField from '../../media/ImageField';
import {
  MODULE_DEFINITIONS,
  COUNTRY_CODES,
  getPresetForDesignation,
  applyPreset,
  generateEmployeeCode,
  generateSecureTemporaryPassword,
  ensurePermissionDependencies,
  countPermissionsSummary
} from '../../../utils/permissionEngine';

export default function AddEmployeePage({ onNavigate }) {
  const { employees = [], createEmployee } = useAdmin();

  // Step 1 = Identity & Contact Info, Step 2 = Granular Access Matrix
  const [currentStep, setCurrentStep] = useState(1);

  // Clean Form State: Strictly the requested fields
  const [formData, setFormData] = useState(() => ({
    fullName: '',
    employeeCode: generateEmployeeCode(employees),
    email: '',
    password: '',
    countryCode: '+91',
    phone: '',
    profilePhoto: '',
    designation: 'manager',
    rolePreset: 'manager',
    status: 'active'
  }));

  // Auto-sync next employee ID if employees list loaded after mount
  React.useEffect(() => {
    if (employees && employees.length > 0) {
      setFormData((prev) => {
        // If employeeCode is empty, or if current code already clashes with an existing employee and user hasn't typed name yet
        const isClashing = employees.some(
          (e) => (e.employee_code || e.employeeCode || '').toUpperCase() === (prev.employeeCode || '').toUpperCase()
        );
        if (!prev.employeeCode || (!prev.fullName && isClashing)) {
          return { ...prev, employeeCode: generateEmployeeCode(employees) };
        }
        return prev;
      });
    }
  }, [employees]);

  // Granular Permissions State (initialized from default designation preset)
  const [permissions, setPermissions] = useState(() => applyPreset('manager'));
  const [permissionSearchTerm, setPermissionSearchTerm] = useState('');

  // UI / Interaction States
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [createdEmployeeResult, setCreatedEmployeeResult] = useState(null);
  const [isCopiedPassword, setIsCopiedPassword] = useState(false);

  // When designation changes, automatically update baseline permissions and role preset
  const handleDesignationChange = (newDesig) => {
    const presetId = getPresetForDesignation(newDesig);
    setFormData((prev) => ({
      ...prev,
      designation: newDesig,
      rolePreset: presetId
    }));
    setPermissions(applyPreset(presetId));
  };

  // Concurrency-safe employee code refresh
  const handleRegenerateCode = () => {
    const nextCode = generateEmployeeCode(employees);
    setFormData((prev) => ({ ...prev, employeeCode: nextCode }));
  };

  // Generate strong random password
  const handleGenerateStrongPassword = () => {
    const pass = generateSecureTemporaryPassword();
    setFormData((prev) => ({
      ...prev,
      password: pass
    }));
    setShowPassword(true);
  };

  // Copy password helper
  const handleCopyPassword = () => {
    if (!formData.password) return;
    navigator.clipboard.writeText(formData.password);
    setIsCopiedPassword(true);
    setTimeout(() => setIsCopiedPassword(false), 2000);
  };

  // Check duplicate email
  const isDuplicateEmail = useMemo(() => {
    const trimmed = formData.email.trim().toLowerCase();
    if (!trimmed) return false;
    return employees.some((e) => (e.email || '').toLowerCase() === trimmed);
  }, [formData.email, employees]);

  // Check duplicate employee code
  const isDuplicateCode = useMemo(() => {
    const trimmed = formData.employeeCode.trim().toUpperCase();
    if (!trimmed) return false;
    return employees.some(
      (e) => (e.employee_code || e.employeeCode || '').toUpperCase() === trimmed
    );
  }, [formData.employeeCode, employees]);

  // Permission counts summary
  const permSummary = useMemo(() => {
    return countPermissionsSummary(permissions);
  }, [permissions]);

  // Filtered module definitions for Step 2 search
  const filteredModules = useMemo(() => {
    const term = permissionSearchTerm.trim().toLowerCase();
    if (!term) return MODULE_DEFINITIONS;
    return MODULE_DEFINITIONS.filter((mod) => {
      const matchName = mod.name.toLowerCase().includes(term);
      const matchDesc = mod.description.toLowerCase().includes(term);
      const matchActions = mod.actions.some((a) => a.label.toLowerCase().includes(term));
      return matchName || matchDesc || matchActions;
    });
  }, [permissionSearchTerm]);

  // Master toggle for a module in Step 2
  const handleToggleModule = (moduleKey, enabled) => {
    setPermissions((prev) => {
      const updated = { ...prev };
      const currentMod = updated[moduleKey] || { enabled: false, actions: {} };
      const newActions = { ...currentMod.actions };

      if (enabled) {
        newActions.view = true;
      } else {
        Object.keys(newActions).forEach((act) => {
          newActions[act] = false;
        });
      }

      updated[moduleKey] = {
        enabled,
        actions: newActions,
      };
      return ensurePermissionDependencies(updated);
    });
  };

  // Toggle individual action in Step 2
  const handleToggleAction = (moduleKey, actionKey, checked) => {
    setPermissions((prev) => {
      const updated = { ...prev };
      const currentMod = updated[moduleKey] || { enabled: false, actions: {} };
      const newActions = { ...currentMod.actions, [actionKey]: checked };

      const isAnyActionChecked = Object.values(newActions).some(Boolean);

      updated[moduleKey] = {
        enabled: isAnyActionChecked || currentMod.enabled,
        actions: newActions,
      };
      return ensurePermissionDependencies(updated);
    });
  };

  // Module level: Select all / Deselect all actions
  const handleModuleBulkActions = (moduleKey, enableAll) => {
    setPermissions((prev) => {
      const updated = { ...prev };
      const targetModDef = MODULE_DEFINITIONS.find((m) => m.key === moduleKey);
      if (!targetModDef) return prev;

      const newActions = {};
      targetModDef.actions.forEach((act) => {
        newActions[act.key] = enableAll;
      });

      updated[moduleKey] = {
        enabled: enableAll,
        actions: newActions,
      };
      return ensurePermissionDependencies(updated);
    });
  };

  // Reset to current designation baseline preset
  const handleResetToPreset = () => {
    const base = applyPreset(formData.rolePreset);
    setPermissions(base);
  };

  // Validate Step 1 before advancing
  const handleProceedToStep2 = (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.fullName.trim()) {
      setErrorMessage('Please enter the employee full name.');
      return;
    }
    if (!formData.employeeCode.trim()) {
      setErrorMessage('Please provide an Employee ID Code.');
      return;
    }
    if (isDuplicateCode) {
      setErrorMessage(`Employee ID Code "${formData.employeeCode}" is already taken.`);
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (isDuplicateEmail) {
      setErrorMessage(`An employee with email "${formData.email}" already exists.`);
      return;
    }
    if (!formData.password || !formData.password.trim()) {
      setErrorMessage('Please provide a login password.');
      return;
    }

    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Final Form Submission
  const handleFinalSubmit = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const sanitizedPermissions = ensurePermissionDependencies(permissions);

      const submissionPayload = {
        fullName: formData.fullName.trim(),
        employeeCode: formData.employeeCode.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        countryCode: formData.countryCode,
        phone: formData.phone.trim(),
        profilePhoto: formData.profilePhoto,
        designation: formData.designation,
        department: '',
        rolePreset: formData.rolePreset,
        status: 'active',
        onboardingMethod: 'temporary_password',
        permissions: sanitizedPermissions,
        forcePasswordReset: false
      };

      const result = await createEmployee(submissionPayload);

      setCreatedEmployeeResult(result?.employee || submissionPayload);
      setSuccessMessage(`Employee "${formData.fullName}" created successfully with ${formData.designation} access!`);
    } catch (err) {
      console.error('Error creating employee:', err);
      setErrorMessage(err.message || 'Failed to create employee account. Please check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in max-w-4xl mx-auto">
      {/* Top Header & Back Button */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            if (currentStep === 2 && !createdEmployeeResult) {
              setCurrentStep(1);
            } else {
              onNavigate('employees');
            }
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-pink-100 text-gray-700 hover:text-[#CE4270] font-bold text-xs transition-all shadow-2xs cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>{currentStep === 2 && !createdEmployeeResult ? '← Back to Identity Details' : '← Back to Employees'}</span>
        </button>

        {/* Step Indicator Pill */}
        {!createdEmployeeResult && (
          <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-pink-100 shadow-2xs text-xs font-bold text-gray-500">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
                currentStep === 1 ? 'bg-[#CE4270] text-white shadow-2xs' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              1
            </span>
            <span className={currentStep === 1 ? 'text-[#CE4270] font-black' : 'text-gray-700'}>
              Identity & Contact
            </span>
            <ChevronRight size={14} className="text-gray-300" />
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
                currentStep === 2 ? 'bg-[#CE4270] text-white shadow-2xs' : 'bg-gray-100 text-gray-400'
              }`}
            >
              2
            </span>
            <span className={currentStep === 2 ? 'text-[#CE4270] font-black' : 'text-gray-400'}>
              Granular Access Matrix
            </span>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs font-semibold animate-shake">
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Success Notification & Employee Credentials Card */}
      {createdEmployeeResult && (
        <div className="p-6 sm:p-8 bg-gradient-to-br from-emerald-50 via-white to-pink-50 border border-emerald-200 rounded-3xl shadow-sm space-y-6 animate-scale-up">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-md">
              <CheckCircle2 size={26} />
            </div>
            <div>
              <h3 className="text-lg font-black text-emerald-950">
                Employee Created & Configured Successfully!
              </h3>
              <p className="text-xs text-emerald-700 font-medium mt-0.5">
                {successMessage}
              </p>
            </div>
          </div>

          {/* Credentials Display Card */}
          <div className="p-5 rounded-2xl bg-white border border-emerald-100 shadow-2xs space-y-3.5">
            <h4 className="text-xs font-black uppercase text-gray-500 tracking-wider">
              Account Login Credentials
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-400 font-bold block text-[10px]">EMPLOYEE NAME</span>
                <span className="font-extrabold text-gray-900 text-sm">{formData.fullName}</span>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-400 font-bold block text-[10px]">EMPLOYEE ID CODE</span>
                <span className="font-mono font-bold text-[#CE4270] text-sm">{formData.employeeCode}</span>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-400 font-bold block text-[10px]">LOGIN EMAIL</span>
                <span className="font-mono font-bold text-gray-900 text-xs">{formData.email}</span>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-400 font-bold block text-[10px]">DESIGNATION</span>
                <span className="font-extrabold text-[#CE4270] uppercase text-xs">{formData.designation}</span>
              </div>
              <div className="sm:col-span-2 p-3.5 rounded-xl bg-pink-50/70 border border-pink-200 flex items-center justify-between">
                <div>
                  <span className="text-gray-500 font-bold block text-[10px]">TEMPORARY PASSWORD</span>
                  <span className="font-mono font-bold text-gray-900 text-sm">
                    {showPassword ? formData.password : '••••••••••••'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-2 rounded-lg bg-white border border-pink-200 text-gray-600 hover:text-[#CE4270] cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className="px-3 py-2 rounded-lg bg-[#CE4270] text-white font-bold text-xs flex items-center gap-1 cursor-pointer hover:bg-[#b83760] transition-colors"
                  >
                    {isCopiedPassword ? (
                      <>
                        <Check size={14} />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy Password</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('employees')}
              className="px-6 py-3 rounded-2xl bg-emerald-600 text-white font-extrabold text-xs hover:bg-emerald-700 transition-all shadow-xs cursor-pointer"
            >
              View in Employee List →
            </button>
            <button
              type="button"
              onClick={() => {
                setSuccessMessage(null);
                setCreatedEmployeeResult(null);
                setFormData({
                  fullName: '',
                  employeeCode: generateEmployeeCode(employees),
                  email: '',
                  password: '',
                  countryCode: '+91',
                  phone: '',
                  profilePhoto: '',
                  designation: 'manager',
                  rolePreset: 'manager',
                  status: 'active'
                });
                setPermissions(applyPreset('manager'));
                setCurrentStep(1);
              }}
              className="px-4 py-2.5 rounded-xl bg-white border border-emerald-200 text-emerald-800 font-bold text-xs hover:bg-emerald-50 transition-colors cursor-pointer"
            >
              + Add Another Employee
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 1: IDENTITY & CONTACT INFORMATION                                    */}
      {/* ========================================================================= */}
      {currentStep === 1 && !createdEmployeeResult && (
        <form onSubmit={handleProceedToStep2} autoComplete="off" className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-pink-100 shadow-2xs space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-pink-100/60">
              <Shield size={18} className="text-[#CE4270]" />
              <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">
                1. Identity & Contact Information
              </h2>
            </div>

            {/* Row 1: Name & Employee ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Name <span className="text-[#CE4270]">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Enter employee full name"
                  className="w-full p-3.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:border-[#CE4270] focus:ring-2 focus:ring-[#CE4270]/20 outline-none bg-white transition-all shadow-2xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-700">
                    Employee ID <span className="text-[#CE4270]">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleRegenerateCode}
                    className="text-[11px] font-bold text-[#CE4270] hover:text-[#b83760] flex items-center gap-1 cursor-pointer"
                    title="Generate next sequential ID"
                  >
                    <RefreshCw size={11} /> Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={formData.employeeCode}
                  onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value.toUpperCase() })}
                  placeholder="EMP-0001"
                  className={`w-full p-3.5 rounded-xl border text-xs font-mono font-bold outline-none bg-white transition-all shadow-2xs ${
                    isDuplicateCode
                      ? 'border-rose-400 text-rose-700 bg-rose-50/30'
                      : 'border-gray-200 text-gray-900 focus:border-[#CE4270]'
                  }`}
                />
                {isDuplicateCode && (
                  <span className="text-[10px] text-rose-600 font-bold block mt-1">
                    ⚠️ Employee ID already exists. Please choose a unique ID.
                  </span>
                )}
              </div>
            </div>

            {/* Row 2: Mail ID & Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Mail ID (Login Email) <span className="text-[#CE4270]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    autoComplete="off"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="employee@salbeau.com"
                    className={`w-full p-3.5 pl-10 rounded-xl border text-xs font-semibold outline-none bg-white transition-all shadow-2xs ${
                      isDuplicateEmail
                        ? 'border-rose-400 text-rose-700 bg-rose-50/30'
                        : 'border-gray-200 text-gray-900 focus:border-[#CE4270]'
                    }`}
                  />
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                {isDuplicateEmail && (
                  <span className="text-[10px] text-rose-600 font-bold block mt-1">
                    ⚠️ An employee with this email already exists.
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-700">
                    Password <span className="text-[#CE4270]">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateStrongPassword}
                    className="text-[11px] font-bold text-[#CE4270] hover:text-[#b83760] flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles size={11} /> Auto-Generate
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter password (min 6 chars)"
                    className="w-full p-3.5 pl-10 pr-10 rounded-xl border border-gray-200 text-xs font-mono font-bold text-gray-900 focus:border-[#CE4270] outline-none bg-white shadow-2xs"
                  />
                  <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Row 3: Phone Number & Designation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Phone Number <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={formData.countryCode}
                    onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                    className="w-24 p-3.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 focus:border-[#CE4270] outline-none bg-white shrink-0 shadow-2xs"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/[^0-9]/g, '') })}
                    placeholder="9876543210"
                    className="w-full p-3.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:border-[#CE4270] outline-none bg-white shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Designation <span className="text-[#CE4270]">*</span>
                </label>
                <select
                  value={formData.designation}
                  onChange={(e) => handleDesignationChange(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-pink-200 text-xs font-extrabold text-gray-900 focus:border-[#CE4270] outline-none bg-[#FFF8FA] cursor-pointer shadow-2xs"
                >
                  <option value="(admin)">1) (admin)</option>
                  <option value="manager">2) manager</option>
                  <option value="account">3) account</option>
                  <option value="employee">4) employee</option>
                </select>
                <span className="text-[11px] text-gray-400 font-medium block mt-1">
                  Preset: <strong className="text-[#CE4270] font-bold">{formData.rolePreset.toUpperCase()}</strong> access level
                </span>
              </div>
            </div>

            {/* Row 4: Photo (Optional) */}
            <div className="pt-2">
              <ImageField
                label="Photo"
                sublabel="Optional: Upload, drag & drop, or paste a photo URL"
                value={formData.profilePhoto}
                onChange={(url) => setFormData({ ...formData, profilePhoto: url })}
                folder="employees"
                filenamePrefix="emp_avatar"
                entityName={formData.fullName || 'Employee'}
                aspectRatio="circle"
              />
            </div>

            {/* Next Button */}
            <div className="pt-4 border-t border-pink-100 flex justify-end">
              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#CE4270] to-[#E25586] hover:from-[#b83760] hover:to-[#ce4270] text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Proceed to Granular Access Matrix (Step 2) →</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: GRANULAR ACCESS MATRIX (MUST BE THERE)                            */}
      {/* ========================================================================= */}
      {currentStep === 2 && !createdEmployeeResult && (
        <div className="space-y-6">
          {/* Employee Summary Card */}
          <div className="bg-white p-5 rounded-3xl border border-pink-100 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-13 h-13 rounded-2xl bg-pink-50 border border-pink-100 flex items-center justify-center overflow-hidden shrink-0">
                {formData.profilePhoto ? (
                  <img src={formData.profilePhoto} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={24} className="text-[#CE4270]" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-gray-900">{formData.fullName || 'Employee Name'}</h2>
                  <span className="font-mono text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                    {formData.employeeCode}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 text-xs text-gray-500 mt-0.5">
                  <span>{formData.email}</span>
                  {formData.phone && (
                    <>
                      <span>•</span>
                      <span>{formData.countryCode} {formData.phone}</span>
                    </>
                  )}
                  <span>•</span>
                  <span className="text-[#CE4270] font-bold">Designation: {formData.designation}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="text-xs font-bold text-[#CE4270] hover:underline cursor-pointer self-start md:self-auto"
            >
              ← Edit Details
            </button>
          </div>

          {/* Granular Access Matrix Header & Search Controls */}
          <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-pink-100/60">
              <div>
                <div className="flex items-center gap-2">
                  <Shield size={18} className="text-[#CE4270]" />
                  <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">
                    2. Granular Access Matrix
                  </h2>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Configure precise page and action access permissions for this account.
                </p>
              </div>

              {/* Reset to Designation Preset */}
              <button
                type="button"
                onClick={handleResetToPreset}
                className="px-3.5 py-1.5 rounded-xl border border-pink-200 text-[#CE4270] font-bold text-xs hover:bg-[#FFF2F5] transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                title="Reset matrix to default preset for this designation"
              >
                <RotateCcw size={13} />
                <span>Reset to {formData.designation} Preset</span>
              </button>
            </div>

            {/* Filter Search Input */}
            <div className="relative">
              <input
                type="text"
                value={permissionSearchTerm}
                onChange={(e) => setPermissionSearchTerm(e.target.value)}
                placeholder="Search modules or specific actions (e.g. Products, Orders, Delete)..."
                className="w-full p-3 pl-10 rounded-xl border border-gray-200 text-xs font-medium text-gray-900 focus:border-[#CE4270] outline-none bg-white shadow-2xs"
              />
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            {/* Quick Metrics Bar */}
            <div className="flex items-center justify-between text-xs text-gray-500 bg-pink-50/50 p-3 rounded-2xl border border-pink-100/60">
              <div className="flex items-center gap-4">
                <span>
                  Active Modules: <strong className="text-gray-900">{permSummary.enabledModulesCount}</strong> / {permSummary.totalModulesCount}
                </span>
                <span>•</span>
                <span>
                  Granted Actions: <strong className="text-[#CE4270]">{permSummary.totalGrantedActions}</strong>
                </span>
              </div>
              <span className="text-[11px] font-bold text-gray-400">
                Granular Permissions Engine
              </span>
            </div>
          </div>

          {/* Module Grid List */}
          <div className="space-y-4">
            {filteredModules.map((mod) => {
              const currentModPerm = permissions[mod.key] || { enabled: false, actions: {} };
              const isModuleEnabled = Boolean(currentModPerm.enabled);
              const grantedActionsCount = Object.values(currentModPerm.actions || {}).filter(Boolean).length;
              const totalActionsCount = mod.actions.length;

              return (
                <div
                  key={mod.key}
                  className={`bg-white rounded-3xl border transition-all shadow-2xs overflow-hidden ${
                    isModuleEnabled ? 'border-pink-200 shadow-xs' : 'border-gray-200/80 opacity-90'
                  }`}
                >
                  {/* Module Header Bar with Master Toggle */}
                  <div
                    className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b ${
                      isModuleEnabled ? 'bg-gradient-to-r from-[#FFF5F8] to-white border-pink-100/80' : 'bg-gray-50/70 border-gray-100'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                          isModuleEnabled ? 'bg-[#CE4270] text-white' : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {mod.name[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-sm text-gray-900">{mod.name}</h3>
                          {isModuleEnabled ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                              Enabled ({grantedActionsCount}/{totalActionsCount})
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                              Disabled
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">{mod.description}</p>
                      </div>
                    </div>

                    {/* Master Switch & Bulk Action Controls */}
                    <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                      {isModuleEnabled && (
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <button
                            type="button"
                            onClick={() => handleModuleBulkActions(mod.key, true)}
                            className="px-2 py-1 rounded-md bg-white border border-gray-200 text-gray-600 hover:text-[#CE4270] font-bold cursor-pointer"
                          >
                            All
                          </button>
                          <button
                            type="button"
                            onClick={() => handleModuleBulkActions(mod.key, false)}
                            className="px-2 py-1 rounded-md bg-white border border-gray-200 text-gray-600 hover:text-rose-600 font-bold cursor-pointer"
                          >
                            None
                          </button>
                        </div>
                      )}

                      {/* Module Enable / Disable Switch */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isModuleEnabled}
                          onChange={(e) => handleToggleModule(mod.key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#CE4270]" />
                      </label>
                    </div>
                  </div>

                  {/* Actions Checkbox Matrix */}
                  {isModuleEnabled && (
                    <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 bg-white">
                      {mod.actions.map((act) => {
                        const isChecked = Boolean(currentModPerm.actions?.[act.key]);

                        return (
                          <label
                            key={act.key}
                            className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-between cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-pink-50/60 border-pink-200 text-gray-900 shadow-2xs'
                                : 'bg-gray-50/40 border-gray-200/80 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <span className="truncate pr-2">{act.label}</span>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => handleToggleAction(mod.key, act.key, e.target.checked)}
                              className="w-4 h-4 text-[#CE4270] accent-[#CE4270] rounded cursor-pointer shrink-0"
                            />
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Step 2 Bottom Actions Bar */}
          <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => {
                setCurrentStep(1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 transition-colors cursor-pointer"
            >
              ← Back to Identity Details
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinalSubmit}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#CE4270] to-[#E25586] hover:from-[#b83760] hover:to-[#ce4270] text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Creating Employee Account...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Submit &amp; Create Employee</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
