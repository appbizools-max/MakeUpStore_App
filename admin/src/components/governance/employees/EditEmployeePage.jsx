import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Edit,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
  Phone,
  Mail,
  User,
  Key,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';
import { useAdmin } from '../../../context/AdminContext';
import ImageField from '../../media/ImageField';
import { generateSecureTemporaryPassword } from '../../../utils/permissionEngine';

export default function EditEmployeePage({ employeeId, onNavigate }) {
  const {
    employees = [],
    updateEmployee
  } = useAdmin();

  const employee = useMemo(() => {
    return employees.find((e) => e.id === employeeId || e.employee_code === employeeId);
  }, [employees, employeeId]);

  const [formData, setFormData] = useState({
    fullName: '',
    employeeCode: '',
    phone: '',
    designation: 'manager',
    password: '',
    profilePhoto: '',
    status: 'active',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    if (employee) {
      // Map existing designation to one of the 4 exact options
      let desig = employee.designation || 'manager';
      if (desig.toLowerCase().includes('admin')) desig = '(admin)';
      else if (desig.toLowerCase().includes('manage')) desig = 'manager';
      else if (desig.toLowerCase().includes('account')) desig = 'account';
      else if (desig.toLowerCase().includes('employ') || desig.toLowerCase().includes('staff')) desig = 'employee';

      setFormData({
        fullName: employee.full_name || '',
        employeeCode: employee.employee_code || '',
        phone: employee.phone || '',
        designation: desig,
        password: employee.password || '',
        profilePhoto: employee.profile_photo || '',
        status: employee.status || 'active',
      });
    }
  }, [employee]);

  const handleGeneratePassword = () => {
    const newPass = generateSecureTemporaryPassword();
    setFormData((prev) => ({ ...prev, password: newPass }));
    setShowPassword(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employee) return;

    if (!formData.fullName.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await updateEmployee(employee.id, {
        fullName: formData.fullName.trim(),
        full_name: formData.fullName.trim(),
        employeeCode: formData.employeeCode.trim(),
        employee_code: formData.employeeCode.trim(),
        phone: formData.phone.trim(),
        designation: formData.designation,
        password: formData.password.trim(),
        profilePhoto: formData.profilePhoto,
        profile_photo: formData.profilePhoto,
        status: formData.status,
      });

      setSuccessMessage('Employee details and login credentials updated successfully!');
      setTimeout(() => {
        onNavigate(`employees/${employee.id}`);
      }, 900);
    } catch (err) {
      console.error('Failed to update employee:', err);
      setErrorMessage(err.message || 'Failed to update employee details.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!employee) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-pink-100 shadow-2xs max-w-lg mx-auto">
        <AlertCircle size={40} className="mx-auto text-amber-500 mb-3" />
        <h2 className="text-lg font-bold text-gray-800">Employee Record Not Found</h2>
        <button
          type="button"
          onClick={() => onNavigate('employees')}
          className="mt-4 px-4 py-2 bg-[#CE4270] text-white rounded-xl text-xs font-bold cursor-pointer"
        >
          ← Return to All Employees
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 animate-fade-in max-w-4xl mx-auto">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onNavigate(`employees/${employee.id}`)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-pink-100 text-gray-700 hover:text-[#CE4270] font-bold text-xs transition-all shadow-2xs cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>← Back to Profile</span>
        </button>
      </div>

      {/* Header Card */}
      <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#CE4270] to-[#E25586] text-white flex items-center justify-center font-bold shadow-md">
            <Edit size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">
              Edit Employee: {employee.full_name}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Update credentials, login password, designation, contact info, and portal status.
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs font-semibold animate-shake">
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-bold animate-fade-in">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} autoComplete="off" className="bg-white p-6 sm:p-8 rounded-3xl border border-pink-100 shadow-2xs space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Full Name <span className="text-[#CE4270]">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full p-3.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:border-[#CE4270] outline-none shadow-2xs"
            />
          </div>

          {/* Employee Code */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Employee ID Code <span className="text-[#CE4270]">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.employeeCode}
              onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value.toUpperCase() })}
              className="w-full p-3.5 rounded-xl border border-gray-200 text-xs font-mono font-bold text-gray-900 focus:border-[#CE4270] outline-none shadow-2xs"
            />
          </div>

          {/* Email (Readonly) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Login Email (System Auth ID)
            </label>
            <div className="relative">
              <input
                type="email"
                disabled
                value={employee.email}
                className="w-full p-3.5 pl-10 rounded-xl border border-gray-100 text-xs font-mono font-semibold text-gray-500 bg-gray-50 cursor-not-allowed shadow-2xs"
              />
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <span className="text-[10px] text-gray-400 mt-1 block">Login email cannot be changed directly</span>
          </div>

          {/* Login Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-gray-700">
                Login Password
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-[11px] font-bold text-[#CE4270] hover:text-[#b83760] flex items-center gap-1 cursor-pointer"
              >
                <Sparkles size={11} /> Auto-Generate
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                autoComplete="new-password"
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter new password"
                className="w-full p-3.5 pl-10 pr-10 rounded-xl border border-gray-200 text-xs font-mono font-bold text-gray-900 focus:border-[#CE4270] outline-none shadow-2xs"
              />
              <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/[^0-9]/g, '') })}
                placeholder="9876543210"
                className="w-full p-3.5 pl-10 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:border-[#CE4270] outline-none shadow-2xs"
              />
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Designation (Dropdown with exact 4 options) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Designation <span className="text-[#CE4270]">*</span>
            </label>
            <select
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              className="w-full p-3.5 rounded-xl border border-pink-200 text-xs font-extrabold text-gray-900 focus:border-[#CE4270] outline-none bg-[#FFF8FA] cursor-pointer shadow-2xs"
            >
              <option value="(admin)">1) (admin)</option>
              <option value="manager">2) manager</option>
              <option value="account">3) account</option>
              <option value="employee">4) employee</option>
            </select>
          </div>

          {/* Account Status */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Account Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full p-3.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 focus:border-[#CE4270] outline-none bg-white shadow-2xs"
            >
              <option value="active">Active (Full Portal Access)</option>
              <option value="inactive">Inactive (Temporarily Disabled)</option>
              <option value="suspended">Suspended (Access Revoked)</option>
            </select>
          </div>
        </div>

        {/* Profile Photo */}
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

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => onNavigate(`employees/${employee.id}`)}
            className="px-5 py-2.5 border border-gray-200 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-gradient-to-r from-[#CE4270] to-[#E25586] hover:from-[#b83760] text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
