import React, { useState } from 'react';
import {
  ArrowLeft,
  UserPlus,
  Shield,
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
  Lock
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import ImageField from '../ImageField';
import {
  EMPLOYEE_DEPARTMENTS,
  EMPLOYEE_DESIGNATIONS,
  PERMISSION_PRESETS,
  applyPreset,
  generateEmployeeCode
} from '../../utils/permissionEngine';

export default function AddEmployeePage({ onNavigate }) {
  const { employees = [], createEmployee } = useAdmin();

  // Employee details state
  const [formData, setFormData] = useState({
    fullName: '',
    employeeCode: generateEmployeeCode(employees.length),
    email: '',
    phone: '',
    department: 'Operations',
    designation: 'Fulfillment Specialist',
    profilePhoto: '',
    joiningDate: new Date().toISOString().split('T')[0],
    status: 'active',
  });

  // Credentials state
  const [credentials, setCredentials] = useState({
    password: '',
    confirmPassword: '',
    forcePasswordReset: true,
  });

  const [selectedPreset, setSelectedPreset] = useState('operations');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Generate a cryptographically strong random password
  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let pass = 'Salbeau@';
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCredentials((prev) => ({
      ...prev,
      password: pass,
      confirmPassword: pass,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!formData.fullName.trim()) {
      setErrorMessage('Please enter employee full name.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!credentials.password || credentials.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    if (credentials.password !== credentials.confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    // Check duplicate code or email in existing local state
    if (employees.some((e) => e.email.toLowerCase() === formData.email.trim().toLowerCase())) {
      setErrorMessage('An employee with this email already exists.');
      return;
    }
    if (employees.some((e) => e.employee_code === formData.employeeCode.trim())) {
      setErrorMessage('Employee code already exists. Please choose a unique code.');
      return;
    }

    setIsSubmitting(true);

    try {
      const initialPermissions = applyPreset(selectedPreset);

      const result = await createEmployee({
        fullName: formData.fullName.trim(),
        employeeCode: formData.employeeCode.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        department: formData.department,
        designation: formData.designation,
        profilePhoto: formData.profilePhoto,
        joiningDate: formData.joiningDate,
        status: formData.status,
        password: credentials.password,
        forcePasswordReset: credentials.forcePasswordReset,
        permissions: initialPermissions,
      });

      setSuccessMessage('Employee account created successfully!');
      setTimeout(() => {
        if (result?.employee?.id) {
          onNavigate(`employees/${result.employee.id}/permissions`);
        } else {
          onNavigate('employees');
        }
      }, 1000);
    } catch (err) {
      console.error('Error creating employee:', err);
      setErrorMessage(err.message || 'Failed to create employee account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 animate-fade-in max-w-5xl mx-auto">
      {/* Top Header & Back Button */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onNavigate('employees')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-pink-100 text-gray-700 hover:text-[#CE4270] hover:bg-pink-50/50 font-bold text-xs transition-all shadow-2xs cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>← Back to Employees</span>
        </button>

        <span className="text-xs font-bold text-gray-400">
          Step 1 of 2: Create Account
        </span>
      </div>

      {/* Main Title Card */}
      <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#CE4270] to-[#E25586] text-white flex items-center justify-center font-bold shadow-md">
            <UserPlus size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">
              Add New Employee
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Create an employee account, configure initial credentials, and assign role presets.
            </p>
          </div>
        </div>
      </div>

      {/* Feedback Alerts */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs font-semibold animate-shake">
          <AlertCircle size={18} className="shrink-0 text-rose-600" />
          <div className="flex-1">{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-semibold animate-fade-in">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
          <div className="flex-1 font-bold">{successMessage}</div>
        </div>
      )}

      {/* Two-Column Form Layout */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Personal & Organization Information (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-pink-100/60">
                <Shield size={16} className="text-[#CE4270]" />
                <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">
                  Employee Information
                </h2>
              </div>

              {/* Full Name & Employee ID */}
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
                    className="w-full p-3 rounded-xl border border-gray-200 text-xs font-medium text-gray-900 focus:border-[#CE4270] focus:ring-2 focus:ring-[#CE4270]/20 outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Employee ID Code <span className="text-[#CE4270]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.employeeCode}
                    onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                    placeholder="EMP-0001"
                    className="w-full p-3 rounded-xl border border-gray-200 text-xs font-mono font-bold text-gray-900 focus:border-[#CE4270] focus:ring-2 focus:ring-[#CE4270]/20 outline-none bg-white"
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Email Address (Login ID) <span className="text-[#CE4270]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="priya.sharma@salbeau.com"
                    className="w-full p-3 rounded-xl border border-gray-200 text-xs font-medium text-gray-900 focus:border-[#CE4270] focus:ring-2 focus:ring-[#CE4270]/20 outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full p-3 rounded-xl border border-gray-200 text-xs font-medium text-gray-900 focus:border-[#CE4270] focus:ring-2 focus:ring-[#CE4270]/20 outline-none bg-white"
                  />
                </div>
              </div>

              {/* Department & Designation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Department
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full p-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 focus:border-[#CE4270] outline-none bg-white"
                  >
                    {EMPLOYEE_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g. Operations Lead"
                    className="w-full p-3 rounded-xl border border-gray-200 text-xs font-medium text-gray-900 focus:border-[#CE4270] focus:ring-2 focus:ring-[#CE4270]/20 outline-none bg-white"
                  />
                </div>
              </div>

              {/* Joining Date & Account Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Joining Date
                  </label>
                  <input
                    type="date"
                    value={formData.joiningDate}
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    className="w-full p-3 rounded-xl border border-gray-200 text-xs font-medium text-gray-900 focus:border-[#CE4270] outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Account Status
                  </label>
                  <div className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-200 bg-gray-50/50">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.status === 'active'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'active' : 'inactive' })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                    <span className="text-xs font-bold text-gray-800">
                      {formData.status === 'active' ? 'Active Account (Permitted)' : 'Inactive / Blocked'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Profile Photo (Centralized ImageField) */}
              <div className="pt-2">
                <ImageField
                  label="Employee Profile Photo"
                  sublabel="Upload, drag & drop, paste, or search photo"
                  value={formData.profilePhoto}
                  onChange={(url) => setFormData({ ...formData, profilePhoto: url })}
                  folder="employees"
                  filenamePrefix="emp"
                  entityName={formData.fullName || 'Employee'}
                  aspectRatio="circle"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Credentials & Role Presets (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Credentials Card */}
            <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-pink-100/60">
                <div className="flex items-center gap-2">
                  <Key size={16} className="text-[#CE4270]" />
                  <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">
                    Login Credentials
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="px-2.5 py-1 text-[11px] font-bold text-[#CE4270] bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors cursor-pointer"
                >
                  Generate Password
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Temporary Password <span className="text-[#CE4270]">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    placeholder="Min 6 characters"
                    className="w-full p-3 pr-10 rounded-xl border border-gray-200 text-xs font-mono font-bold text-gray-900 focus:border-[#CE4270] outline-none bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Confirm Temporary Password <span className="text-[#CE4270]">*</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={credentials.confirmPassword}
                  onChange={(e) => setCredentials({ ...credentials, confirmPassword: e.target.value })}
                  placeholder="Re-enter password"
                  className="w-full p-3 rounded-xl border border-gray-200 text-xs font-mono font-bold text-gray-900 focus:border-[#CE4270] outline-none bg-white"
                />
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-gray-800">Force Password Reset</div>
                  <div className="text-[10px] text-gray-400">Must choose new password upon 1st login</div>
                </div>
                <input
                  type="checkbox"
                  checked={credentials.forcePasswordReset}
                  onChange={(e) => setCredentials({ ...credentials, forcePasswordReset: e.target.checked })}
                  className="w-4 h-4 text-[#CE4270] accent-[#CE4270] rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Permission Presets Card */}
            <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-pink-100/60">
                <Sliders size={16} className="text-[#CE4270]" />
                <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">
                  Initial Permission Preset
                </h2>
              </div>

              <p className="text-xs text-gray-500">
                Choose a baseline role preset. You can fine-tune every individual module and action permission afterward.
              </p>

              <div className="space-y-2">
                {PERMISSION_PRESETS.map((preset) => {
                  const isSelected = selectedPreset === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => setSelectedPreset(preset.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                        isSelected
                          ? 'border-[#CE4270] bg-[#FFF2F5] shadow-xs'
                          : 'border-gray-200 hover:border-pink-200 hover:bg-gray-50/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="presetChoice"
                        checked={isSelected}
                        onChange={() => setSelectedPreset(preset.id)}
                        className="mt-0.5 text-[#CE4270] accent-[#CE4270] cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-gray-900">{preset.name}</div>
                        <div className="text-[11px] text-gray-500 mt-0.5 leading-snug">{preset.description}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#CE4270] to-[#E25586] hover:from-[#b83760] hover:to-[#ce4270] text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Creating Employee Account...</span>
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  <span>Create Account & Configure Permissions →</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
