import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Clock,
  MoreVertical,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Key,
  Eye,
  Edit,
  Sliders,
  Activity,
  ArrowRight,
  Sparkles,
  Phone,
  Mail,
  Building2,
  Lock,
  RefreshCw,
  Power
} from 'lucide-react';
import { useAdmin } from '../../../context/AdminContext';
import { EMPLOYEE_DEPARTMENTS, ACCOUNT_STATE_META } from '../../../utils/permissionEngine';

export default function AllEmployeesPage({ onNavigate }) {
  const {
    employees = [],
    toggleEmployeeStatus,
    resetEmployeePassword,
    isLoading
  } = useAdmin();

  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Quick reset password state
  const [resetModalEmp, setResetModalEmp] = useState(null);
  const [newTempPassword, setNewTempPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return (employees || []).filter((emp) => {
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !term ||
        (emp.full_name || '').toLowerCase().includes(term) ||
        (emp.employee_code || '').toLowerCase().includes(term) ||
        (emp.email || '').toLowerCase().includes(term) ||
        (emp.phone || '').includes(term) ||
        (emp.designation || '').toLowerCase().includes(term);

      const matchesDept = departmentFilter === 'all' || emp.department === departmentFilter;
      const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [employees, searchTerm, departmentFilter, statusFilter]);

  // Real KPI metrics from actual database records
  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter((e) => e.status === 'active').length;
    const inactive = employees.filter((e) => e.status !== 'active').length;
    const activeToday = employees.filter((e) => {
      if (!e.last_login) return false;
      const diffHours = (Date.now() - new Date(e.last_login).getTime()) / (1000 * 60 * 60);
      return diffHours <= 24;
    }).length;

    return { total, active, inactive, activeToday };
  }, [employees]);

  // Handle toggle active/inactive
  const handleToggleStatus = async (emp) => {
    const nextStatus = emp.status === 'active' ? 'inactive' : 'active';
    const confirmMsg = emp.status === 'active'
      ? `Disable ${emp.full_name}? The employee will be immediately locked out of the Admin Panel.`
      : `Re-enable account for ${emp.full_name}?`;

    if (window.confirm(confirmMsg)) {
      try {
        await toggleEmployeeStatus(emp.id, nextStatus);
        setActionSuccess(`Employee ${emp.full_name} is now ${nextStatus}.`);
        setTimeout(() => setActionSuccess(null), 3000);
      } catch (err) {
        alert(err.message || 'Failed to update employee status');
      }
    }
  };

  // Handle password reset submit
  const handleConfirmPasswordReset = async (e) => {
    e.preventDefault();
    if (!resetModalEmp || !newTempPassword.trim()) return;
    setIsResetting(true);
    try {
      await resetEmployeePassword(resetModalEmp.id, newTempPassword.trim(), true);
      setActionSuccess(`Password reset for ${resetModalEmp.full_name}. Temporary credentials updated.`);
      setResetModalEmp(null);
      setNewTempPassword('');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      alert(err.message || 'Failed to reset password');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-pink-100 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#C2477A] uppercase tracking-wider mb-1">
            <ShieldCheck size={16} />
            <span>Role-Based Access Control</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Employee Management
          </h1>
          <p className="text-xs text-gray-500 mt-1 max-w-xl">
            Manage employee accounts, credentials, granular permissions, assigned work, and audit activity.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('employees/new')}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#C2477A] to-[#E25586] hover:from-[#b83760] hover:to-[#C2477A] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <UserPlus size={16} />
          <span>+ Add Employee</span>
        </button>
      </div>

      {/* Action Notification Banner */}
      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-800 text-xs font-semibold animate-fade-in shadow-2xs">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Metric Cards (Real Supabase Data) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-pink-100/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">Total Employees</span>
            <div className="w-8 h-8 rounded-xl bg-pink-50 text-[#C2477A] flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 mt-2">{stats.total}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Configured system staff</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-pink-100/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700">Active Accounts</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">{stats.active}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Authorized for portal access</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-pink-100/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700">Inactive / Suspended</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-700 mt-2">{stats.inactive}</div>
          <div className="text-[11px] text-rose-600 font-medium mt-0.5">Access blocked & disabled</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-pink-100/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-black">Active in Last 24h</span>
            <div className="w-8 h-8 rounded-xl bg-[#FFF5F8] text-[#C2477A] flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-black mt-2">{stats.activeToday}</div>
          <div className="text-[11px] text-[#C2477A] font-medium mt-0.5">Recent portal sessions</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-pink-100/80 shadow-2xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by employee name, code (EMP-...), email, phone, designation..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:border-[#C2477A] focus:ring-2 focus:ring-[#C2477A]/20 outline-none bg-white text-gray-900"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="flex-1 md:flex-initial px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 focus:border-[#C2477A] outline-none bg-white"
          >
            <option value="all">All Departments</option>
            {EMPLOYEE_DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 md:flex-initial px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 focus:border-[#C2477A] outline-none bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-3xl border border-pink-100/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-400 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="py-4 px-5">Employee</th>
                <th className="py-4 px-4">Employee ID</th>
                <th className="py-4 px-4">Department & Role</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4">Last Login</th>
                <th className="py-4 px-4">Permissions</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <Users size={36} className="mx-auto mb-2 text-gray-300 stroke-[1.5]" />
                    <p className="text-sm font-bold text-gray-600">No employees found</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {searchTerm ? 'No staff match your search criteria.' : 'Create your first employee account to delegate tasks.'}
                    </p>
                    {!searchTerm && (
                      <button
                        type="button"
                        onClick={() => onNavigate('employees/new')}
                        className="mt-4 px-4 py-2 bg-[#C2477A] text-white rounded-xl text-xs font-bold hover:bg-[#b83760] transition-colors"
                      >
                        + Add First Employee
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const permModules = Object.keys(emp.permissions || {}).filter(
                    (k) => emp.permissions[k]?.enabled
                  );

                  return (
                    <tr key={emp.id} className="hover:bg-pink-50/20 transition-colors group">
                      {/* Employee Photo & Name */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-pink-100 text-[#C2477A] flex items-center justify-center font-bold text-xs shrink-0 border border-pink-200">
                            {emp.profile_photo ? (
                              <img src={emp.profile_photo} alt={emp.full_name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{(emp.full_name || 'E').substring(0, 2).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => onNavigate(`employees/${emp.id}`)}
                              className="font-bold text-gray-900 hover:text-[#C2477A] text-left truncate block transition-colors"
                            >
                              {emp.full_name}
                            </button>
                            <div className="text-[11px] text-gray-400 flex items-center gap-1.5 truncate">
                              <Mail size={11} />
                              <span>{emp.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Employee Code */}
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-800">
                        <span className="px-2 py-0.5 bg-gray-100 rounded-lg text-[11px] border border-gray-200">
                          {emp.employee_code}
                        </span>
                      </td>

                      {/* Department, Designation & Location */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900">{emp.department || 'Operations'}</div>
                        <div className="text-[11px] text-gray-500">{emp.designation || 'Staff'}</div>
                        {emp.work_location && (
                          <div className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[180px]">
                            📍 {emp.work_location}
                          </div>
                        )}
                      </td>

                      {/* Account Lifecycle Status */}
                      <td className="py-3.5 px-4">
                        {(() => {
                          const stateKey = emp.account_status || emp.status || 'active';
                          const meta = ACCOUNT_STATE_META[stateKey] || {
                            label: stateKey,
                            badgeClass: 'bg-gray-100 text-gray-700 border-gray-300'
                          };
                          return (
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shadow-2xs ${meta.badgeClass}`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              <span>{meta.label}</span>
                            </span>
                          );
                        })()}
                      </td>

                      {/* Last Login */}
                      <td className="py-3.5 px-4 text-gray-500 text-[11px]">
                        {emp.last_login ? (
                          <span>{new Date(emp.last_login).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                        ) : (
                          <span className="text-gray-400 italic">Never</span>
                        )}
                      </td>

                      {/* Permissions Summary */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => onNavigate(`employees/${emp.id}/permissions`)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#FFF5F8] text-black hover:bg-[#FDF2F8] border border-[#FCE4EC] font-bold text-[11px] transition-colors"
                          title="Click to configure granular permissions"
                        >
                          <Sliders size={12} />
                          <span>{permModules.length} Modules</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onNavigate(`employees/${emp.id}`)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-[#C2477A] hover:bg-pink-50 transition-colors"
                            title="View Profile & Assigned Work"
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => onNavigate(`employees/${emp.id}/edit`)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-[#C2477A] hover:bg-[#FFF5F8] transition-colors"
                            title="Edit Employee Information"
                          >
                            <Edit size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => onNavigate(`employees/${emp.id}/permissions`)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-[#C2477A] hover:bg-[#FFF5F8] transition-colors"
                            title="Configure Permissions"
                          >
                            <Sliders size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setResetModalEmp(emp);
                              setNewTempPassword('');
                            }}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Reset Credentials / Temporary Password"
                          >
                            <Key size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(emp)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              emp.status === 'active'
                                ? 'text-gray-400 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-rose-600 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={emp.status === 'active' ? 'Disable Employee Account' : 'Re-enable Employee Account'}
                          >
                            <Power size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reset Credentials Dialog */}
      {resetModalEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-pink-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Key size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-gray-900 text-sm">Reset Password</h3>
                <p className="text-xs text-gray-500">Employee: {resetModalEmp.full_name} ({resetModalEmp.employee_code})</p>
              </div>
            </div>

            <form onSubmit={handleConfirmPasswordReset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">New Temporary Password</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={newTempPassword}
                    onChange={(e) => setNewTempPassword(e.target.value)}
                    placeholder="Enter min 8 characters"
                    className="flex-1 p-2.5 rounded-xl border border-gray-200 text-xs font-mono font-bold focus:border-[#C2477A] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const gen = 'Salbeau@' + Math.random().toString(36).substring(2, 7) + '!';
                      setNewTempPassword(gen);
                    }}
                    className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800">
                ⚠️ The employee will be forced to change this password upon their next login. Password is encrypted securely in Supabase Auth.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalEmp(null)}
                  disabled={isResetting}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetting || !newTempPassword.trim()}
                  className="px-5 py-2 bg-gradient-to-r from-[#C2477A] to-[#E25586] hover:from-[#b83760] text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                >
                  {isResetting ? 'Updating...' : 'Save & Force Reset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
