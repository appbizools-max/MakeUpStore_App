import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  Clock,
  Shield,
  Sliders,
  Edit,
  Activity,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Key,
  ExternalLink,
  Layers,
  Power
} from 'lucide-react';
import { useAdmin } from '../../../context/AdminContext';
import { MODULE_DEFINITIONS } from '../../../utils/permissionEngine';

export default function EmployeeProfilePage({ employeeId, onNavigate }) {
  const {
    employees = [],
    orders = [],
    employeeActivityLogs = [],
    toggleEmployeeStatus
  } = useAdmin();

  const [activeTab, setActiveTab] = useState('overview');

  const employee = useMemo(() => {
    return employees.find((e) => e.id === employeeId || e.employee_code === employeeId);
  }, [employees, employeeId]);

  // Assigned orders for this employee
  const assignedOrders = useMemo(() => {
    if (!employee) return [];
    return (orders || []).filter(
      (o) => o.assigned_employee_id === employee.id || o.assignedEmployeeId === employee.id || o.assigned_employee_id === employee.employee_code || o.assignedEmployeeId === employee.employee_code
    );
  }, [orders, employee]);

  // Activity logs for this employee
  const employeeLogs = useMemo(() => {
    if (!employee) return [];
    return (employeeActivityLogs || []).filter(
      (log) => log.employee_id === employee.id || log.employee_id === employee.employee_code
    );
  }, [employeeActivityLogs, employee]);

  if (!employee) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-pink-100 shadow-2xs max-w-lg mx-auto">
        <AlertCircle size={40} className="mx-auto text-amber-500 mb-3" />
        <h2 className="text-lg font-bold text-gray-800">Employee Record Not Found</h2>
        <button
          type="button"
          onClick={() => onNavigate('employees')}
          className="mt-4 px-4 py-2 bg-[#CE4270] text-white rounded-xl text-xs font-bold"
        >
          ← Return to All Employees
        </button>
      </div>
    );
  }

  // Count active permissions
  const activeModules = MODULE_DEFINITIONS.filter(
    (m) => employee.permissions?.[m.key]?.enabled
  );

  return (
    <div className="space-y-6 pb-16 animate-fade-in max-w-6xl mx-auto">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => onNavigate('employees')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-pink-100 text-gray-700 hover:text-[#CE4270] font-bold text-xs transition-all shadow-2xs cursor-pointer w-fit"
        >
          <ArrowLeft size={16} />
          <span>← Back to Employees</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate(`employees/${employee.id}/edit`)}
            className="px-4 py-2 rounded-xl bg-white border border-gray-200 hover:border-pink-300 text-gray-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Edit size={14} />
            <span>Edit Information</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate(`employees/${employee.id}/permissions`)}
            className="px-4 py-2 rounded-xl bg-[#CE4270] hover:bg-[#b83760] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Sliders size={14} />
            <span>Manage Permissions</span>
          </button>
        </div>
      </div>

      {/* Main Profile Card Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-pink-100 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-3xl overflow-hidden bg-pink-100 text-[#CE4270] flex items-center justify-center font-bold text-xl border-2 border-pink-200 shadow-md shrink-0">
              {employee.profile_photo ? (
                <img src={employee.profile_photo} alt={employee.full_name} className="w-full h-full object-cover" />
              ) : (
                <span>{(employee.full_name || 'E').substring(0, 2).toUpperCase()}</span>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                  {employee.full_name}
                </h1>
                <span className="px-2.5 py-0.5 bg-gray-100 font-mono text-xs font-bold rounded-lg text-gray-700 border border-gray-200">
                  {employee.employee_code}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    employee.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}
                >
                  ● {employee.status}
                </span>
              </div>

              <p className="text-xs font-semibold text-gray-600 flex items-center gap-2">
                <span className="text-[#CE4270] font-extrabold uppercase">{employee.designation || 'Staff'}</span>
                <span>•</span>
                <span className="text-gray-500 font-medium">{employee.role === 'admin' ? 'Admin Access' : 'Employee Access'}</span>
              </p>

              <div className="flex items-center gap-4 text-xs text-gray-400 pt-1 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Mail size={13} />
                  <span>{employee.email}</span>
                </span>
                {employee.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone size={13} />
                    <span>{employee.phone}</span>
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} />
                  <span>Joined {employee.joining_date || 'Recently'}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Tabs Navigation */}
        <div className="flex items-center gap-2 border-t border-gray-100 mt-6 pt-4 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Overview', icon: User },
            { id: 'permissions', label: `Permissions (${activeModules.length})`, icon: Sliders },
            { id: 'work', label: `Assigned Work (${assignedOrders.length})`, icon: ShoppingBag },
            { id: 'activity', label: `Activity (${employeeLogs.length})`, icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-[#CE4270] text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-2xs space-y-4">
              <h2 className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                Account Summary
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="text-gray-400 font-semibold text-[11px]">System Role</div>
                  <div className="text-gray-900 font-extrabold mt-1 uppercase text-sm">
                    {employee.role || 'Employee'}
                  </div>
                </div>
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="text-gray-400 font-semibold text-[11px]">Last Session</div>
                  <div className="text-gray-900 font-bold mt-1">
                    {employee.last_login ? new Date(employee.last_login).toLocaleDateString('en-IN') : 'Never'}
                  </div>
                </div>
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="text-gray-400 font-semibold text-[11px]">Password Reset</div>
                  <div className="text-gray-900 font-bold mt-1">
                    {employee.force_password_reset ? 'Required on login' : 'Configured'}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Permissions Preview Card */}
            <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                  Assigned Module Access
                </h2>
                <button
                  type="button"
                  onClick={() => onNavigate(`employees/${employee.id}/permissions`)}
                  className="text-xs font-bold text-[#CE4270] hover:underline"
                >
                  Configure All →
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {MODULE_DEFINITIONS.map((mod) => {
                  const isEnabled = employee.permissions?.[mod.key]?.enabled;
                  return (
                    <div
                      key={mod.key}
                      className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
                        isEnabled
                          ? 'border-emerald-200 bg-emerald-50/40 text-emerald-900 font-bold'
                          : 'border-gray-200 bg-gray-50/30 text-gray-400 font-medium'
                      }`}
                    >
                      <span className="truncate">{mod.name}</span>
                      {isEnabled ? (
                        <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle size={14} className="text-gray-300 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Work & Activity Snapshot */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-2xs space-y-3">
              <h2 className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                Assigned Work Load
              </h2>
              <div className="text-3xl font-black text-[#CE4270]">{assignedOrders.length}</div>
              <p className="text-xs text-gray-500">
                Customer orders currently assigned to {employee.full_name} for confirmation or dispatch.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('work')}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors mt-2"
              >
                View Assigned Orders
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Granular Permissions Detail */}
      {activeTab === 'permissions' && (
        <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base font-black text-gray-900">Module & Action Permissions</h2>
              <p className="text-xs text-gray-400">Detailed overview of granular actions permitted for this account</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate(`employees/${employee.id}/permissions`)}
              className="px-4 py-2 bg-[#CE4270] text-white rounded-xl text-xs font-bold hover:bg-[#b83760]"
            >
              Edit Permissions
            </button>
          </div>

          <div className="space-y-4 pt-2">
            {MODULE_DEFINITIONS.map((mod) => {
              const modPerm = employee.permissions?.[mod.key];
              const isEnabled = Boolean(modPerm?.enabled);
              const actions = mod.actions || [];

              return (
                <div key={mod.key} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-xs text-gray-900">{mod.name}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  {isEnabled ? (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {actions.map((act) => {
                        const hasAction = Boolean(modPerm?.actions?.[act.key]);
                        return (
                          <span
                            key={act.key}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                              hasAction
                                ? 'bg-pink-100 text-[#CE4270] border border-pink-200'
                                : 'bg-gray-100 text-gray-400 border border-gray-200 line-through'
                            }`}
                          >
                            {act.label}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-400 italic">No access to this module</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Assigned Work */}
      {activeTab === 'work' && (
        <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h2 className="text-base font-black text-gray-900">
              Assigned Orders ({assignedOrders.length})
            </h2>
          </div>

          {assignedOrders.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <ShoppingBag size={36} className="mx-auto text-gray-300 mb-2 stroke-[1.5]" />
              <p className="font-bold text-gray-600 text-sm">No work currently assigned</p>
              <p className="text-xs text-gray-400 mt-0.5">Admin can assign orders to {employee.full_name} from the Orders page.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {assignedOrders.map((order) => (
                <div key={order.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-mono font-bold text-gray-900 text-xs">Order #{order.id}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      Customer: {order.userName || order.user_name || 'Retail Customer'} • ₹{order.totalAmount || order.total_amount || 0}
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-pink-50 text-[#CE4270] border border-pink-100">
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Activity Log */}
      {activeTab === 'activity' && (
        <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h2 className="text-base font-black text-gray-900">
              Activity History ({employeeLogs.length})
            </h2>
            <button
              type="button"
              onClick={() => onNavigate(`employees/activity`)}
              className="text-xs font-bold text-[#CE4270] hover:underline"
            >
              Full Activity Feed →
            </button>
          </div>

          {employeeLogs.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Activity size={36} className="mx-auto text-gray-300 mb-2 stroke-[1.5]" />
              <p className="font-bold text-gray-600 text-sm">No activity recorded yet</p>
              <p className="text-xs text-gray-400 mt-0.5">Actions performed by {employee.full_name} will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {employeeLogs.map((log) => (
                <div key={log.id} className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-gray-900">{log.action}</span>
                    <span className="text-gray-400 ml-2">in {log.module}</span>
                    {log.entity_id && <span className="font-mono text-gray-500 ml-2">#{log.entity_id}</span>}
                  </div>
                  <span className="text-[11px] text-gray-400">
                    {new Date(log.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
