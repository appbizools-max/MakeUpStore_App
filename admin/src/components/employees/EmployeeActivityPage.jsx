import React, { useState, useMemo } from 'react';
import {
  Activity,
  Search,
  Filter,
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShoppingBag,
  Package,
  Layers,
  Image as ImageIcon,
  Users,
  Settings,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

export default function EmployeeActivityPage({ onNavigate }) {
  const {
    employeeActivityLogs = [],
    employees = []
  } = useAdmin();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedAction, setSelectedAction] = useState('all');
  const [expandedLogId, setExpandedLogId] = useState(null);

  // Filtered activity logs
  const filteredLogs = useMemo(() => {
    return (employeeActivityLogs || []).filter((log) => {
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !term ||
        (log.employee_name || '').toLowerCase().includes(term) ||
        (log.action || '').toLowerCase().includes(term) ||
        (log.module || '').toLowerCase().includes(term) ||
        (log.entity_id || '').toLowerCase().includes(term);

      const matchesEmp = selectedEmployee === 'all' || log.employee_id === selectedEmployee;
      const matchesMod = selectedModule === 'all' || log.module.toLowerCase() === selectedModule.toLowerCase();
      const matchesAction = selectedAction === 'all' || log.action.toLowerCase().includes(selectedAction.toLowerCase());

      return matchesSearch && matchesEmp && matchesMod && matchesAction;
    });
  }, [employeeActivityLogs, searchTerm, selectedEmployee, selectedModule, selectedAction]);

  const getModuleIcon = (mod) => {
    switch ((mod || '').toLowerCase()) {
      case 'orders':
        return <ShoppingBag size={14} className="text-pink-600" />;
      case 'products':
        return <Package size={14} className="text-[#C2477A]" />;
      case 'categories':
      case 'subcategories':
        return <Layers size={14} className="text-amber-600" />;
      case 'images':
        return <ImageIcon size={14} className="text-emerald-600" />;
      case 'employees':
        return <Users size={14} className="text-[#C2477A]" />;
      default:
        return <Activity size={14} className="text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6 pb-16 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-pink-100 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF5F8] text-[#C2477A] flex items-center justify-center font-bold shadow-xs">
            <Activity size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#C2477A] uppercase tracking-wider mb-0.5">
              <span>Security & Audit Monitoring</span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Employee Activity Feed
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Live audit logs of orders processed, product catalog edits, image updates, and employee operations.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('employees')}
          className="px-4 py-2.5 rounded-2xl bg-white border border-gray-200 hover:border-pink-300 text-gray-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer w-fit"
        >
          <ArrowLeft size={16} />
          <span>Employees List</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-pink-100/80 shadow-2xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by action, employee name, module, record ID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:border-[#C2477A] focus:ring-2 focus:ring-[#C2477A]/20 outline-none bg-white text-gray-900"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          {/* Employee Filter */}
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 focus:border-[#C2477A] outline-none bg-white"
          >
            <option value="all">All Employees</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.full_name} ({emp.employee_code})
              </option>
            ))}
          </select>

          {/* Module Filter */}
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 focus:border-[#C2477A] outline-none bg-white"
          >
            <option value="all">All Modules</option>
            <option value="orders">Orders</option>
            <option value="products">Products</option>
            <option value="categories">Categories</option>
            <option value="images">Images</option>
            <option value="employees">Employees</option>
            <option value="banners">Banners</option>
          </select>

          {/* Action Filter */}
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 focus:border-[#C2477A] outline-none bg-white"
          >
            <option value="all">All Actions</option>
            <option value="create">Created</option>
            <option value="update">Updated</option>
            <option value="delete">Deleted</option>
            <option value="status">Status Changes</option>
            <option value="assign">Work Assignments</option>
          </select>
        </div>
      </div>

      {/* Activity Table */}
      <div className="bg-white rounded-3xl border border-pink-100/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-400 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="py-4 px-5">Employee</th>
                <th className="py-4 px-4">Action</th>
                <th className="py-4 px-4">Module</th>
                <th className="py-4 px-4">Record / Entity</th>
                <th className="py-4 px-4">Date & Time</th>
                <th className="py-4 px-4">Result</th>
                <th className="py-4 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <Activity size={36} className="mx-auto mb-2 text-gray-300 stroke-[1.5]" />
                    <p className="text-sm font-bold text-gray-600">No activity recorded</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Actions performed by staff members will appear in this audit log.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  const dateStr = new Date(log.created_at).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  });

                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-gray-50/50 transition-colors">
                        {/* Employee */}
                        <td className="py-3.5 px-5 font-bold text-gray-900">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-pink-50 text-[#C2477A] flex items-center justify-center font-bold text-[10px]">
                              {(log.employee_name || 'E').substring(0, 2).toUpperCase()}
                            </div>
                            <span className="truncate">{log.employee_name || log.employee_id}</span>
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 font-mono font-bold text-xs text-gray-800">
                          {log.action}
                        </td>

                        {/* Module */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-gray-100 text-gray-700 font-semibold text-[11px] capitalize">
                            {getModuleIcon(log.module)}
                            <span>{log.module}</span>
                          </span>
                        </td>

                        {/* Record / Entity */}
                        <td className="py-3.5 px-4 font-mono text-[11px] text-gray-600">
                          {log.entity_id ? (
                            <span className="px-2 py-0.5 bg-gray-50 rounded border border-gray-200">
                              {log.entity_type ? `${log.entity_type} #` : '#'}{log.entity_id}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>

                        {/* Date & Time */}
                        <td className="py-3.5 px-4 text-gray-500 text-[11px]">
                          {dateStr}
                        </td>

                        {/* Result Status */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              log.status === 'success'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {log.status === 'success' ? (
                              <CheckCircle2 size={12} className="text-emerald-600" />
                            ) : (
                              <XCircle size={12} className="text-rose-600" />
                            )}
                            <span>{log.status || 'success'}</span>
                          </span>
                        </td>

                        {/* Details Toggle */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                            title="View log metadata"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Metadata Row */}
                      {isExpanded && (
                        <tr className="bg-gray-50/80 border-b border-gray-100">
                          <td colSpan={7} className="p-4 px-6">
                            <div className="p-3 bg-white rounded-xl border border-gray-200/80 font-mono text-[11px] text-gray-700 overflow-x-auto">
                              <div className="font-bold text-gray-900 mb-1 text-[10px] uppercase text-gray-400">
                                Metadata Payload:
                              </div>
                              <pre className="text-xs">
                                {JSON.stringify(log.metadata || {}, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
