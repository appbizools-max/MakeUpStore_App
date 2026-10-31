import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Save,
  Check,
  RotateCcw,
  Building2,
  User,
  Info
} from 'lucide-react';
import { useAdmin } from '../../../context/AdminContext';
import {
  MODULE_DEFINITIONS,
  PERMISSION_PRESETS,
  applyPreset,
  createEmptyPermissions
} from '../../../utils/permissionEngine';

export default function EmployeePermissionsPage({ employeeId, onNavigate }) {
  const {
    employees = [],
    updateEmployeePermissions
  } = useAdmin();

  // Find target employee
  const employee = useMemo(() => {
    return employees.find((e) => e.id === employeeId || e.employee_code === employeeId);
  }, [employees, employeeId]);

  // Working permissions state
  const [permissions, setPermissions] = useState(() => createEmptyPermissions());
  const [activePreset, setActivePreset] = useState('custom');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Initialize permissions from employee object
  useEffect(() => {
    if (employee && employee.permissions) {
      const base = createEmptyPermissions();
      // Merge saved permissions with full definitions schema
      Object.keys(base).forEach((modKey) => {
        if (employee.permissions[modKey]) {
          base[modKey].enabled = Boolean(employee.permissions[modKey].enabled);
          if (employee.permissions[modKey].actions) {
            Object.keys(base[modKey].actions).forEach((actKey) => {
              base[modKey].actions[actKey] = Boolean(employee.permissions[modKey].actions[actKey]);
            });
          }
        }
      });
      setPermissions(base);
    }
  }, [employee]);

  // Handle master toggle for a module
  const handleToggleModule = (moduleKey, enabled) => {
    setPermissions((prev) => {
      const updated = { ...prev };
      const currentMod = updated[moduleKey] || { enabled: false, actions: {} };

      const newActions = { ...currentMod.actions };
      // If turning ON, default view to true
      if (enabled) {
        newActions.view = true;
      } else {
        // If turning OFF, turn all actions off
        Object.keys(newActions).forEach((act) => {
          newActions[act] = false;
        });
      }

      updated[moduleKey] = {
        enabled,
        actions: newActions,
      };
      return updated;
    });
    setActivePreset('custom');
  };

  // Handle individual action toggle
  const handleToggleAction = (moduleKey, actionKey, checked) => {
    setPermissions((prev) => {
      const updated = { ...prev };
      const currentMod = updated[moduleKey] || { enabled: false, actions: {} };
      const newActions = { ...currentMod.actions, [actionKey]: checked };

      // If any action is checked, ensure master module is ON
      const isAnyActionChecked = Object.values(newActions).some(Boolean);

      updated[moduleKey] = {
        enabled: isAnyActionChecked || currentMod.enabled,
        actions: newActions,
      };
      return updated;
    });
    setActivePreset('custom');
  };

  // Quick preset application
  const handleApplyPreset = (presetId) => {
    const presetPerms = applyPreset(presetId);
    setPermissions(presetPerms);
    setActivePreset(presetId);
  };

  // Save permissions to Supabase
  const handleSave = async () => {
    if (!employee) return;
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      await updateEmployeePermissions(employee.id, permissions);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to update permissions:', err);
      setErrorMessage(err.message || 'Failed to update employee permissions');
    } finally {
      setIsSaving(false);
    }
  };

  if (!employee) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-pink-100 shadow-2xs">
        <AlertCircle size={40} className="mx-auto text-amber-500 mb-3" />
        <h2 className="text-lg font-bold text-gray-800">Employee Not Found</h2>
        <p className="text-xs text-gray-400 mt-1">The requested employee record does not exist or was deleted.</p>
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

  // Summary counts
  const enabledModuleCount = Object.values(permissions).filter((m) => m.enabled).length;

  return (
    <div className="space-y-6 pb-20 animate-fade-in max-w-6xl mx-auto">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate(`employees/${employee.id}`)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:text-[#CE4270] hover:bg-pink-50/50 font-bold text-xs transition-all shadow-2xs cursor-pointer"
          >
            <ArrowLeft size={15} />
            <span>Profile</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('employees')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:text-[#CE4270] hover:bg-pink-50/50 font-bold text-xs transition-all shadow-2xs cursor-pointer"
          >
            <span>All Employees</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#CE4270] to-[#E25586] hover:from-[#b83760] hover:to-[#ce4270] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Saving Permissions...</span>
            </>
          ) : (
            <>
              <Save size={16} />
              <span>Save & Apply Permissions</span>
            </>
          )}
        </button>
      </div>

      {/* Target Employee Summary Header Card */}
      <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-pink-100 text-[#CE4270] flex items-center justify-center font-bold text-base border border-pink-200 shadow-xs overflow-hidden shrink-0">
            {employee.profile_photo ? (
              <img src={employee.profile_photo} alt={employee.full_name} className="w-full h-full object-cover" />
            ) : (
              <span>{(employee.full_name || 'E').substring(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-black text-gray-900 tracking-tight">
                {employee.full_name}
              </h1>
              <span className="px-2.5 py-0.5 bg-gray-100 font-mono text-[11px] font-bold rounded-lg text-gray-700 border border-gray-200">
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
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-3 flex-wrap">
              <span className="text-[#CE4270] font-extrabold uppercase">{employee.designation || 'Staff'}</span>
              <span>•</span>
              <span className="font-mono text-gray-400">{employee.email}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
          <div className="text-right">
            <div className="text-xs font-bold text-gray-400">Authorized Modules</div>
            <div className="text-lg font-black text-[#CE4270]">
              {enabledModuleCount} / {MODULE_DEFINITIONS.length} Active
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-bold animate-fade-in shadow-2xs">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>Permissions saved successfully! Changes are applied in real time to the employee's portal session.</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs font-semibold animate-shake">
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Presets Bar */}
      <div className="bg-white p-5 rounded-3xl border border-pink-100 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#CE4270]" />
            <span className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
              Quick Role Presets
            </span>
          </div>
          <span className="text-[11px] text-gray-400">
            Clicking a preset enables pre-configured modules & actions
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {PERMISSION_PRESETS.map((preset) => {
            const isActive = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#CE4270] text-white shadow-sm'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {isActive && <Check size={13} />}
                <span>{preset.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Granular Permission Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {MODULE_DEFINITIONS.map((mod) => {
          const modState = permissions[mod.key] || { enabled: false, actions: {} };
          const isModuleEnabled = Boolean(modState.enabled);

          return (
            <div
              key={mod.key}
              className={`rounded-3xl border transition-all overflow-hidden ${
                isModuleEnabled
                  ? 'bg-white border-pink-200/90 shadow-2xs'
                  : 'bg-gray-50/50 border-gray-200/80 opacity-75'
              }`}
            >
              {/* Module Header / Master Toggle */}
              <div
                className={`p-4 flex items-center justify-between border-b transition-colors ${
                  isModuleEnabled
                    ? 'bg-gradient-to-r from-[#FFF5F8] to-white border-pink-100'
                    : 'bg-gray-100/70 border-gray-200'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-gray-900">{mod.name}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isModuleEnabled
                          ? 'bg-pink-100 text-[#CE4270]'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isModuleEnabled ? 'ACCESS ENABLED' : 'BLOCKED'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{mod.description}</p>
                </div>

                {/* Master Switch */}
                <label className="relative inline-flex items-center cursor-pointer ml-3 shrink-0">
                  <input
                    type="checkbox"
                    checked={isModuleEnabled}
                    onChange={(e) => handleToggleModule(mod.key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#CE4270]"></div>
                </label>
              </div>

              {/* Action Toggles */}
              <div className="p-4 space-y-2.5">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Granular Action Permissions
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {mod.actions.map((act) => {
                    const isChecked = Boolean(modState.actions?.[act.key]);

                    return (
                      <label
                        key={act.key}
                        className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs font-semibold transition-all select-none ${
                          !isModuleEnabled
                            ? 'opacity-40 cursor-not-allowed border-gray-100 bg-gray-50'
                            : isChecked
                            ? 'border-pink-200 bg-pink-50/40 text-gray-900 cursor-pointer'
                            : 'border-gray-100 hover:border-gray-200 text-gray-500 cursor-pointer'
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={!isModuleEnabled}
                          checked={isChecked}
                          onChange={(e) => handleToggleAction(mod.key, act.key, e.target.checked)}
                          className="w-4 h-4 text-[#CE4270] accent-[#CE4270] rounded cursor-pointer disabled:cursor-not-allowed"
                        />
                        <span className="truncate">{act.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Save Footer */}
      <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md p-4 rounded-3xl border border-pink-100 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
          <Info size={16} className="text-[#CE4270]" />
          <span>
            Changes take effect immediately on next request. Unauthorized endpoints will return <code className="font-mono font-bold text-rose-600">ACCESS DENIED</code>.
          </span>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#CE4270] to-[#E25586] hover:from-[#b83760] hover:to-[#ce4270] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save size={16} />
              <span>Save & Apply Permissions</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
