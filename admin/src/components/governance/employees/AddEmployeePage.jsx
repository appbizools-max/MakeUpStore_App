import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  UserPlus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Key,
  Mail,
  Phone,
  Building2,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Sliders,
  Lock,
  RefreshCw,
  AlertTriangle,
  Check,
  RotateCcw,
  Info,
  Briefcase,
  MapPin,
  User,
  FileText,
  Send,
  Copy,
  ChevronRight,
  ExternalLink,
  Search
} from 'lucide-react';
import { useAdmin } from '../../../context/AdminContext';
import ImageField from '../../media/ImageField';
import {
  MODULE_DEFINITIONS,
  PERMISSION_PRESETS,
  SENSITIVE_ACTIONS,
  ACCOUNT_STATES,
  ACCOUNT_STATE_META,
  EMPLOYEE_DEPARTMENTS,
  DEPARTMENT_DESIGNATIONS_MAP,
  EMPLOYMENT_TYPES,
  WORK_LOCATIONS,
  COUNTRY_CODES,
  applyPreset,
  createEmptyPermissions,
  generateEmployeeCode,
  generateSecureTemporaryPassword,
  validatePasswordPolicy,
  ensurePermissionDependencies,
  countPermissionsSummary
} from '../../../utils/permissionEngine';

export default function AddEmployeePage({ onNavigate }) {
  const { employees = [], createEmployee } = useAdmin();

  // Wizard Step: 1 = Employee Info & Login Setup, 2 = Configure Permissions & Review
  const [currentStep, setCurrentStep] = useState(1);

  // Form State: Personal, Job & Organization Info
  const [formData, setFormData] = useState(() => ({
    fullName: '',
    employeeCode: generateEmployeeCode(employees),
    email: '',
    countryCode: '+91',
    phone: '',
    department: 'Operations',
    designation: 'Fulfillment Specialist',
    joiningDate: new Date().toISOString().split('T')[0],
    employmentType: 'Full-time',
    reportingManagerId: '',
    reportingManagerName: '',
    workLocation: 'Visakhapatnam Main Store & Headquarters',
    profilePhoto: '',
    onboardingMethod: 'invitation', // 'invitation' | 'temporary_password'
    status: 'active',
    rolePreset: 'operations',
  }));

  // Login Credentials State (for temporary password method)
  const [credentials, setCredentials] = useState({
    password: '',
    confirmPassword: '',
    forcePasswordReset: true,
  });

  // Granular Permissions State (Step 2)
  const [permissions, setPermissions] = useState(() => applyPreset('operations'));
  const [permissionSearchTerm, setPermissionSearchTerm] = useState('');

  // UI / Interaction States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [createdEmployeeResult, setCreatedEmployeeResult] = useState(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // Auto-update designations dropdown when department changes
  const availableDesignations = useMemo(() => {
    return DEPARTMENT_DESIGNATIONS_MAP[formData.department] || [
      'Operations Lead',
      'Fulfillment Specialist',
      'Store Manager',
      'Staff Associate'
    ];
  }, [formData.department]);

  // Sync designation if current is not in newly selected department
  const handleDepartmentChange = (newDept) => {
    const list = DEPARTMENT_DESIGNATIONS_MAP[newDept] || [];
    const defaultDesignation = list[0] || 'Staff Associate';
    setFormData((prev) => ({
      ...prev,
      department: newDept,
      designation: defaultDesignation,
    }));
  };

  // Sync permissions whenever role preset is changed in Step 1
  const handleRolePresetSelect = (presetId) => {
    setFormData((prev) => ({ ...prev, rolePreset: presetId }));
    const newPerms = applyPreset(presetId);
    setPermissions(newPerms);
  };

  // Concurrency-safe code refresh
  const handleRegenerateCode = () => {
    const nextCode = generateEmployeeCode(employees);
    setFormData((prev) => ({ ...prev, employeeCode: nextCode }));
  };

  // Generate strong random password
  const handleGenerateStrongPassword = () => {
    const pass = generateSecureTemporaryPassword();
    setCredentials((prev) => ({
      ...prev,
      password: pass,
      confirmPassword: pass,
    }));
  };

  // Live password validation
  const passwordCheck = useMemo(() => {
    if (formData.onboardingMethod !== 'temporary_password' || !credentials.password) {
      return { isValid: true, errors: [] };
    }
    return validatePasswordPolicy(credentials.password);
  }, [formData.onboardingMethod, credentials.password]);

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

  // Toggle individual action with automatic dependency resolution
  const handleToggleAction = (moduleKey, actionKey, checked) => {
    setPermissions((prev) => {
      const updated = { ...prev };
      const currentMod = updated[moduleKey] || { enabled: false, actions: {} };
      const newActions = { ...currentMod.actions, [actionKey]: checked };

      // If action is checked, view & module must be ON
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

  // Reset to original preset baseline
  const handleResetToPreset = () => {
    const base = applyPreset(formData.rolePreset);
    setPermissions(base);
  };

  // Validate Step 1 before advancing
  const handleProceedToStep2 = (e) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate Required Fields
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

    // Validate Temporary Password if selected
    if (formData.onboardingMethod === 'temporary_password') {
      if (!credentials.password) {
        setErrorMessage('Please specify a temporary password or choose Email Invitation.');
        return;
      }
      if (!passwordCheck.isValid) {
        setErrorMessage('Password does not meet requirements: ' + passwordCheck.errors.join('; '));
        return;
      }
      if (credentials.password !== credentials.confirmPassword) {
        setErrorMessage('Passwords do not match. Please verify.');
        return;
      }
    }

    // Advance to Step 2
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
        countryCode: formData.countryCode,
        phone: formData.phone.trim(),
        department: formData.department,
        designation: formData.designation,
        joiningDate: formData.joiningDate,
        employmentType: formData.employmentType,
        reportingManagerId: formData.reportingManagerId,
        reportingManagerName: formData.reportingManagerName,
        workLocation: formData.workLocation,
        profilePhoto: formData.profilePhoto,
        onboardingMethod: formData.onboardingMethod,
        status: formData.status,
        rolePreset: formData.rolePreset,
        permissions: sanitizedPermissions,
        password: formData.onboardingMethod === 'temporary_password' ? credentials.password : undefined,
        forcePasswordReset: formData.onboardingMethod === 'temporary_password' ? credentials.forcePasswordReset : true,
      };

      const result = await createEmployee(submissionPayload);

      setCreatedEmployeeResult(result?.employee || submissionPayload);
      setSuccessMessage(
        formData.onboardingMethod === 'invitation'
          ? `Employee created successfully! Invitation token generated and queued for ${formData.email}.`
          : `Employee account created and credentials configured successfully!`
      );
    } catch (err) {
      console.error('Error creating employee:', err);
      setErrorMessage(err.message || 'Failed to create employee account. Please check the inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in max-w-5xl mx-auto">
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
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-pink-100 text-gray-700 hover:text-[#CE4270] hover:bg-pink-50/50 font-bold text-xs transition-all shadow-2xs cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>{currentStep === 2 && !createdEmployeeResult ? '← Back to Step 1 (Info)' : '← Back to Employees'}</span>
        </button>

        {/* Interactive Step Indicator */}
        <div className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-2xl border border-pink-100 shadow-2xs">
          <button
            type="button"
            onClick={() => !createdEmployeeResult && setCurrentStep(1)}
            className={`flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-xl transition-all cursor-pointer ${
              currentStep === 1
                ? 'bg-[#CE4270] text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <User size={13} />
            <span>1. Information & Credentials</span>
          </button>

          <ChevronRight size={14} className="text-gray-300" />

          <button
            type="button"
            onClick={(e) => {
              if (currentStep === 1 && !createdEmployeeResult) {
                handleProceedToStep2(e);
              }
            }}
            className={`flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-xl transition-all cursor-pointer ${
              currentStep === 2
                ? 'bg-[#CE4270] text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <ShieldCheck size={13} />
            <span>2. Permissions & Review</span>
          </button>
        </div>
      </div>

      {/* Hero Title Card */}
      <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#CE4270] to-[#E25586] text-white flex items-center justify-center font-bold shadow-md shrink-0">
              <UserPlus size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">
                Add New Employee
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {currentStep === 1
                  ? 'Step 1: Set identity details, organizational assignment, and secure onboarding method.'
                  : 'Step 2: Review configuration and adjust granular module-by-action permissions.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
              Status: <b className="text-gray-900">{ACCOUNT_STATE_META[formData.status]?.label || 'Active'}</b>
            </span>
          </div>
        </div>
      </div>

      {/* Global Feedback Banners */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs font-semibold animate-shake shadow-2xs">
          <AlertCircle size={18} className="shrink-0 text-rose-600" />
          <div className="flex-1">{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-3xl space-y-3 animate-fade-in shadow-2xs">
          <div className="flex items-center gap-3 text-emerald-900 font-extrabold text-sm">
            <CheckCircle2 size={22} className="text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>

          {createdEmployeeResult?.invitation_token && (
            <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-700">Invitation Token & Onboarding URL:</span>
                <button
                  type="button"
                  onClick={() => {
                    const url = `${window.location.origin}/onboard?token=${createdEmployeeResult.invitation_token}`;
                    navigator.clipboard.writeText(url);
                    setCopiedToken(true);
                    setTimeout(() => setCopiedToken(false), 2500);
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold text-[#CE4270] bg-pink-50 hover:bg-pink-100 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  {copiedToken ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedToken ? 'Copied!' : 'Copy Onboarding Link'}</span>
                </button>
              </div>
              <div className="font-mono text-[11px] p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-gray-800 break-all select-all">
                {window.location.origin}/onboard?token={createdEmployeeResult.invitation_token}
              </div>
              <p className="text-[11px] text-gray-500">
                Single-use invitation valid for 7 days. The employee can use this link to establish their password and activate their account.
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('employees')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              Go to All Employees →
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
                  countryCode: '+91',
                  phone: '',
                  department: 'Operations',
                  designation: 'Fulfillment Specialist',
                  joiningDate: new Date().toISOString().split('T')[0],
                  employmentType: 'Full-time',
                  reportingManagerId: '',
                  reportingManagerName: '',
                  workLocation: 'Visakhapatnam Main Store & Headquarters',
                  profilePhoto: '',
                  onboardingMethod: 'invitation',
                  status: 'active',
                  rolePreset: 'operations',
                });
                setCredentials({ password: '', confirmPassword: '', forcePasswordReset: true });
                setCurrentStep(1);
              }}
              className="px-4 py-2 rounded-xl bg-white border border-emerald-200 text-emerald-800 font-bold text-xs hover:bg-emerald-50 transition-colors cursor-pointer"
            >
              + Add Another Employee
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 1: EMPLOYEE INFORMATION & LOGIN CREDENTIALS SETUP                    */}
      {/* ========================================================================= */}
      {currentStep === 1 && !createdEmployeeResult && (
        <form onSubmit={handleProceedToStep2} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Personal, Job & Organization Details (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Card 1: Personal & Identification Details */}
              <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-pink-100/60">
                  <Shield size={16} className="text-[#CE4270]" />
                  <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">
                    1. Identity & Contact Information
                  </h2>
                </div>

                {/* Full Name & Employee ID Code */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Employee Full Name <span className="text-[#CE4270]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="e.g. Priya Sharma"
                      className="w-full p-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:border-[#CE4270] focus:ring-2 focus:ring-[#CE4270]/20 outline-none bg-white transition-all"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-gray-700">
                        Employee ID Code <span className="text-[#CE4270]">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleRegenerateCode}
                        className="text-[11px] font-bold text-[#CE4270] hover:text-[#b83760] flex items-center gap-1 cursor-pointer"
                        title="Re-generate sequential ID"
                      >
                        <RefreshCw size={11} /> Auto-Generate
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.employeeCode}
                      onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value.toUpperCase() })}
                      placeholder="EMP-0001"
                      className={`w-full p-3 rounded-xl border text-xs font-mono font-bold outline-none bg-white transition-all ${
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

                {/* Email Address & Phone Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Email Address (Login ID) <span className="text-[#CE4270]">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="priya.sharma@salbeau.com"
                        className={`w-full p-3 pl-9 rounded-xl border text-xs font-semibold outline-none bg-white transition-all ${
                          isDuplicateEmail
                            ? 'border-rose-400 text-rose-700 bg-rose-50/30'
                            : 'border-gray-200 text-gray-900 focus:border-[#CE4270]'
                        }`}
                      />
                      <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    {isDuplicateEmail && (
                      <span className="text-[10px] text-rose-600 font-bold block mt-1">
                        ⚠️ An employee with this email already exists.
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Phone Number <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={formData.countryCode}
                        onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                        className="w-24 p-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 focus:border-[#CE4270] outline-none bg-white shrink-0"
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
                        className="w-full p-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:border-[#CE4270] outline-none bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Profile Photo (Object Storage & Thumbnail) */}
                <div className="pt-2">
                  <ImageField
                    label="Employee Profile Photo"
                    sublabel="Upload, drag & drop, or paste a secure photo URL"
                    value={formData.profilePhoto}
                    onChange={(url) => setFormData({ ...formData, profilePhoto: url })}
                    folder="employees"
                    filenamePrefix="emp_avatar"
                    entityName={formData.fullName || 'Employee'}
                    aspectRatio="circle"
                  />
                </div>
              </div>

              {/* Card 2: Organization, Designation & Location */}
              <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-pink-100/60">
                  <Briefcase size={16} className="text-[#CE4270]" />
                  <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">
                    2. Role & Organizational Placement
                  </h2>
                </div>

                {/* Department & Designation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Department <span className="text-[#CE4270]">*</span>
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
                      className="w-full p-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 focus:border-[#CE4270] outline-none bg-white cursor-pointer"
                    >
                      {EMPLOYEE_DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Designation <span className="text-[#CE4270]">*</span>
                    </label>
                    <select
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      className="w-full p-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 focus:border-[#CE4270] outline-none bg-white cursor-pointer"
                    >
                      {availableDesignations.map((desig) => (
                        <option key={desig} value={desig}>{desig}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Employment Type & Joining Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Employment Type <span className="text-[#CE4270]">*</span>
                    </label>
                    <select
                      value={formData.employmentType}
                      onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                      className="w-full p-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 focus:border-[#CE4270] outline-none bg-white cursor-pointer"
                    >
                      {EMPLOYMENT_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Joining Date <span className="text-[#CE4270]">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        required
                        value={formData.joiningDate}
                        onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                        className="w-full p-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:border-[#CE4270] outline-none bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Work Location & Reporting Manager */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Work Location <span className="text-[#CE4270]">*</span>
                    </label>
                    <select
                      value={formData.workLocation}
                      onChange={(e) => setFormData({ ...formData, workLocation: e.target.value })}
                      className="w-full p-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 focus:border-[#CE4270] outline-none bg-white cursor-pointer"
                    >
                      {WORK_LOCATIONS.map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Reporting Manager <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <select
                      value={formData.reportingManagerId}
                      onChange={(e) => {
                        const selEmp = employees.find((x) => x.id === e.target.value);
                        setFormData({
                          ...formData,
                          reportingManagerId: e.target.value,
                          reportingManagerName: selEmp?.full_name || selEmp?.name || (e.target.value ? 'Reporting Lead' : ''),
                        });
                      }}
                      className="w-full p-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 focus:border-[#CE4270] outline-none bg-white cursor-pointer"
                    >
                      <option value="">None (Reports to Root Administrator)</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.full_name || emp.name} ({emp.designation || 'Staff'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Credentials & Role Preset (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Card 3: Secure Login & Onboarding Mode */}
              <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-pink-100/60">
                  <div className="flex items-center gap-2">
                    <Key size={16} className="text-[#CE4270]" />
                    <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">
                      3. Onboarding & Login Setup
                    </h2>
                  </div>
                </div>

                {/* Onboarding Mode Selector */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">
                    Select Onboarding Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, onboardingMethod: 'invitation' })}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        formData.onboardingMethod === 'invitation'
                          ? 'border-[#CE4270] bg-[#FFF2F5] shadow-xs'
                          : 'border-gray-200 hover:border-pink-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#CE4270]">
                        <Send size={13} />
                        <span>Email Invitation</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1 leading-snug">
                        Employee establishes own password via secure single-use token.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, onboardingMethod: 'temporary_password' })}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        formData.onboardingMethod === 'temporary_password'
                          ? 'border-[#CE4270] bg-[#FFF2F5] shadow-xs'
                          : 'border-gray-200 hover:border-pink-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-gray-900">
                        <Lock size={13} />
                        <span>Temp Password</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1 leading-snug">
                        Admin specifies temporary password with mandatory first-login reset.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Mode A: Invitation Info */}
                {formData.onboardingMethod === 'invitation' ? (
                  <div className="p-3.5 bg-pink-50/70 border border-pink-100 rounded-2xl text-xs space-y-1.5 text-gray-700">
                    <div className="flex items-center gap-1.5 text-[#CE4270] font-bold">
                      <Sparkles size={14} />
                      <span>Zero-Knowledge Security</span>
                    </div>
                    <p className="text-[11px] text-gray-600 leading-relaxed">
                      No temporary passwords are transmitted or logged. An expiring activation token is generated for <b>{formData.email || 'the employee'}</b>.
                    </p>
                  </div>
                ) : (
                  /* Mode B: Temporary Password Inputs */
                  <div className="space-y-3 pt-1 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-gray-700">
                        Temporary Password <span className="text-[#CE4270]">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateStrongPassword}
                        className="text-[11px] font-bold text-[#CE4270] hover:text-[#b83760] flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles size={11} /> Generate Strong
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={credentials.password}
                        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                        placeholder="Min 8 chars (A-Z, 0-9, symbol)"
                        className="w-full p-3 pr-10 rounded-xl border border-gray-200 text-xs font-mono font-bold text-gray-900 focus:border-[#CE4270] outline-none bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Confirm Temporary Password <span className="text-[#CE4270]">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={credentials.confirmPassword}
                          onChange={(e) => setCredentials({ ...credentials, confirmPassword: e.target.value })}
                          placeholder="Re-enter password"
                          className="w-full p-3 pr-10 rounded-xl border border-gray-200 text-xs font-mono font-bold text-gray-900 focus:border-[#CE4270] outline-none bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Password Policy Status Checklist */}
                    {credentials.password && (
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-[11px] space-y-1">
                        <div className="font-bold text-gray-700">Password Requirements:</div>
                        <div className={`flex items-center gap-1.5 ${credentials.password.length >= 8 ? 'text-emerald-600' : 'text-gray-400'}`}>
                          <Check size={12} /> Min 8 characters
                        </div>
                        <div className={`flex items-center gap-1.5 ${/[A-Z]/.test(credentials.password) && /[a-z]/.test(credentials.password) ? 'text-emerald-600' : 'text-gray-400'}`}>
                          <Check size={12} /> Uppercase & lowercase letters
                        </div>
                        <div className={`flex items-center gap-1.5 ${/[0-9]/.test(credentials.password) && /[!@#$%^&*]/.test(credentials.password) ? 'text-emerald-600' : 'text-gray-400'}`}>
                          <Check size={12} /> At least 1 number and 1 special symbol
                        </div>
                      </div>
                    )}

                    {/* Force Reset Toggle */}
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-gray-800">Force Password Reset</div>
                        <div className="text-[10px] text-gray-400">Must establish new password on 1st login</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={credentials.forcePasswordReset}
                        onChange={(e) => setCredentials({ ...credentials, forcePasswordReset: e.target.checked })}
                        className="w-4 h-4 text-[#CE4270] accent-[#CE4270] rounded cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Card 4: Role Preset Selector */}
              <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-pink-100/60">
                  <Sliders size={16} className="text-[#CE4270]" />
                  <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">
                    4. Role Preset
                  </h2>
                </div>

                <p className="text-xs text-gray-500">
                  Choose a baseline role preset. You can fine-tune every granular permission in Step 2.
                </p>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {PERMISSION_PRESETS.map((preset) => {
                    const isSelected = formData.rolePreset === preset.id;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleRolePresetSelect(preset.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                          isSelected
                            ? 'border-[#CE4270] bg-[#FFF2F5] shadow-xs'
                            : 'border-gray-200 hover:border-pink-200 hover:bg-gray-50/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="rolePreset"
                          checked={isSelected}
                          onChange={() => handleRolePresetSelect(preset.id)}
                          className="mt-0.5 text-[#CE4270] accent-[#CE4270] cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-900">{preset.name}</span>
                            {preset.id === 'custom' && (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                                Granular
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{preset.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Next Step Button */}
              <button
                type="submit"
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#CE4270] to-[#E25586] hover:from-[#b83760] hover:to-[#ce4270] text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Next: Configure Permissions (Step 2) →</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: CONFIGURE PERMISSIONS & FINAL REVIEW                              */}
      {/* ========================================================================= */}
      {currentStep === 2 && !createdEmployeeResult && (
        <div className="space-y-6">
          {/* Employee Summary Banner */}
          <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-pink-50 border border-pink-100 flex items-center justify-center overflow-hidden shrink-0">
                {formData.profilePhoto ? (
                  <img src={formData.profilePhoto} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={26} className="text-[#CE4270]" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-gray-900">{formData.fullName || 'Employee Name'}</h2>
                  <span className="font-mono text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                    {formData.employeeCode}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                  <span>{formData.email}</span>
                  <span>•</span>
                  <span>{formData.department} — {formData.designation}</span>
                  <span>•</span>
                  <span className="text-[#CE4270] font-bold">Role: {formData.rolePreset.toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                ← Edit Info
              </button>
              <button
                type="button"
                onClick={handleResetToPreset}
                className="px-3 py-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-[#CE4270] text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Reset to Preset</span>
              </button>
            </div>
          </div>

          {/* Permissions Metrics Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-pink-100/80 shadow-2xs">
              <span className="text-[11px] font-bold text-gray-400 uppercase">Active Modules</span>
              <div className="text-xl font-black text-gray-900 mt-1">{permSummary.enabledModules} of {MODULE_DEFINITIONS.length}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-pink-100/80 shadow-2xs">
              <span className="text-[11px] font-bold text-gray-400 uppercase">Permitted Actions</span>
              <div className="text-xl font-black text-[#CE4270] mt-1">{permSummary.totalActions} Actions Granted</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-pink-100/80 shadow-2xs">
              <span className="text-[11px] font-bold text-gray-400 uppercase">Sensitive Privileges</span>
              <div className={`text-xl font-black mt-1 ${permSummary.sensitiveActionsCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {permSummary.sensitiveActionsCount > 0 ? `⚠️ ${permSummary.sensitiveActionsCount} Sensitive Actions` : '✓ Least Privilege Safe'}
              </div>
            </div>
          </div>

          {/* Module Permissions Matrix */}
          <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-pink-100/60">
              <div>
                <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck size={18} className="text-[#CE4270]" />
                  <span>Granular Access Matrix</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Turning off View disables all child mutation actions. Sensitive privileges are highlighted in rose.
                </p>
              </div>

              {/* Quick Search */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  value={permissionSearchTerm}
                  onChange={(e) => setPermissionSearchTerm(e.target.value)}
                  placeholder="Filter permissions..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-900 focus:border-[#CE4270] outline-none"
                />
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Modules Grid */}
            <div className="space-y-4">
              {filteredModules.map((mod) => {
                const isModEnabled = Boolean(permissions[mod.key]?.enabled);
                const currentActions = permissions[mod.key]?.actions || {};
                const activeActionCount = Object.values(currentActions).filter(Boolean).length;

                return (
                  <div
                    key={mod.key}
                    className={`rounded-2xl border transition-all ${
                      isModEnabled
                        ? 'border-pink-200 bg-white shadow-2xs'
                        : 'border-gray-200 bg-gray-50/50 opacity-80'
                    }`}
                  >
                    {/* Module Header Bar */}
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isModEnabled}
                            onChange={(e) => handleToggleModule(mod.key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#CE4270]"></div>
                        </label>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-gray-900">{mod.name}</span>
                            <span className="text-[10px] font-bold text-gray-400">
                              ({activeActionCount} / {mod.actions.length} allowed)
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 leading-snug">{mod.description}</p>
                        </div>
                      </div>

                      {/* Module Bulk Buttons */}
                      {isModEnabled && (
                        <div className="flex items-center gap-2 text-[11px] font-bold">
                          <button
                            type="button"
                            onClick={() => handleModuleBulkActions(mod.key, true)}
                            className="text-[#CE4270] hover:underline cursor-pointer"
                          >
                            Select All
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            type="button"
                            onClick={() => handleModuleBulkActions(mod.key, false)}
                            className="text-gray-500 hover:text-gray-700 cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Actions Checkbox List */}
                    {isModEnabled && (
                      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {mod.actions.map((act) => {
                          const isActionChecked = Boolean(currentActions[act.key]);
                          const isSensitive = SENSITIVE_ACTIONS.has(act.key);

                          return (
                            <label
                              key={act.key}
                              className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-xs transition-all cursor-pointer ${
                                isActionChecked
                                  ? isSensitive
                                    ? 'border-amber-200 bg-amber-50/40 text-amber-900 font-bold'
                                    : 'border-pink-200 bg-pink-50/30 text-gray-900 font-bold'
                                  : 'border-gray-100 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isActionChecked}
                                onChange={(e) => handleToggleAction(mod.key, act.key, e.target.checked)}
                                className="w-4 h-4 text-[#CE4270] accent-[#CE4270] rounded cursor-pointer shrink-0"
                              />
                              <div className="flex-1 min-w-0 flex items-center justify-between">
                                <span className="truncate">{act.label}</span>
                                {isSensitive && (
                                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 shrink-0 ml-1">
                                    Sensitive
                                  </span>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Final Submission Card */}
          <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-gray-700">Ready to complete setup?</div>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {formData.onboardingMethod === 'invitation'
                  ? 'An onboarding invitation will be generated with 7-day expiration.'
                  : 'Account will be created with assigned temporary password and force-reset flag.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setCurrentStep(1)}
                className="px-5 py-3 rounded-2xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                ← Back to Step 1
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#CE4270] to-[#E25586] hover:from-[#b83760] hover:to-[#ce4270] text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Creating Employee Account...</span>
                  </>
                ) : formData.onboardingMethod === 'invitation' ? (
                  <>
                    <Send size={16} />
                    <span>Send Invitation & Create Employee</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    <span>Create Account & Activate Employee</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
