import React, { useState, useMemo } from 'react';
import {
  FileText,
  Activity,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShoppingBag,
  Package,
  Layers,
  Sparkles,
  Users,
  Settings,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Download,
  Calendar,
  Tag
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

export default function AuditTrailPage({ onNavigate }) {
  const {
    employeeActivityLogs = [],
    employees = [],
    refreshData
  } = useAdmin();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOperator, setSelectedOperator] = useState('all');
  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (refreshData) await refreshData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const filteredLogs = useMemo(() => {
    return (employeeActivityLogs || []).filter((log) => {
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !term ||
        (log.employee_name || '').toLowerCase().includes(term) ||
        (log.action || '').toLowerCase().includes(term) ||
        (log.module || '').toLowerCase().includes(term) ||
        (log.entity_id || '').toLowerCase().includes(term) ||
        (log.entity_type || '').toLowerCase().includes(term);

      const matchesOp = selectedOperator === 'all' || log.employee_id === selectedOperator;
      const matchesMod = selectedModule === 'all' || (log.module || '').toLowerCase() === selectedModule.toLowerCase();
      const matchesStatus = selectedStatus === 'all' || (log.status || '').toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesOp && matchesMod && matchesStatus;
    });
  }, [employeeActivityLogs, searchTerm, selectedOperator, selectedModule, selectedStatus]);

  const metrics = useMemo(() => {
    const total = employeeActivityLogs.length;
    const actionsToday = employeeActivityLogs.filter(l => {
      if (!l.created_at) return false;
      const d = new Date(l.created_at);
      const today = new Date();
      return d.toDateString() === today.toDateString();
    }).length;
    const distinctOperators = new Set(employeeActivityLogs.map(l => l.employee_id)).size;
    const approvals = employeeActivityLogs.filter(l => (l.action || '').toUpperCase().includes('APPROV')).length;
    return { total, actionsToday, distinctOperators, approvals };
  }, [employeeActivityLogs]);

  const formatDateTime = (isoDate) => {
    if (!isoDate) return 'N/A';
    try {
      return new Date(isoDate).toLocaleString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  const getModuleIcon = (mod) => {
    switch ((mod || '').toLowerCase()) {
      case 'orders':
        return <ShoppingBag size={14} className="text-pink-600" />;
      case 'products':
        return <Package size={14} className="text-[#C2477A]" />;
      case 'categories':
        return <Layers size={14} className="text-amber-600" />;
      case 'employees':
        return <Users size={14} className="text-purple-600" />;
      case 'auth':
        return <ShieldCheck size={14} className="text-indigo-600" />;
      default:
        return <Activity size={14} className="text-gray-600" />;
    }
  };

  const exportAuditCSV = () => {
    if (!filteredLogs.length) return;
    const headers = ['Timestamp', 'Operator Name', 'Operator ID', 'Action', 'Module', 'Entity Type', 'Entity ID', 'Status', 'Metadata'];
    const rows = filteredLogs.map(l => [
      l.created_at || '',
      `"${(l.employee_name || '').replace(/"/g, '""')}"`,
      l.employee_id || '',
      l.action || '',
      l.module || '',
      l.entity_type || '',
      l.entity_id || '',
      l.status || '',
      `"${JSON.stringify(l.metadata || {}).replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `audit_trail_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in bg-white text-black min-h-screen pb-16">
      {/* 1. Page Header */}
      <div className="bg-white border border-[#FCE4EC] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-9 h-9 rounded-xl bg-[#C2477A] text-white flex items-center justify-center shadow-xs">
              <FileText size={18} />
            </div>
            <h1 className="text-xl font-bold text-black tracking-tight">
              Audit Trail & Immutable Activity Log
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFF5F8] text-[#C2477A] border border-[#F8B4CB]">
              Security Compliance
            </span>
          </div>
          <p className="text-xs text-black font-normal">
            Complete immutable activity and audit history for Administrator and Employees detailing who performed what action, when, on which record, and whether it was approved or rejected.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={exportAuditCSV}
            disabled={!filteredLogs.length}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#FCE4EC] hover:border-[#C2477A] text-black text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-40"
          >
            <Download size={14} className="text-[#C2477A]" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#FCE4EC] hover:border-[#C2477A] hover:bg-[#FFF5F8] text-black text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            <RefreshCw size={14} className={`text-[#C2477A] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync Live</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#FCE4EC] rounded-2xl p-4 shadow-sm hover:border-[#C2477A] transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-black uppercase tracking-wider">Total Audit Records</span>
            <div className="w-7 h-7 rounded-lg bg-[#FFF5F8] text-[#C2477A] flex items-center justify-center">
              <FileText size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-black">{metrics.total}</div>
          <p className="text-[11px] text-black font-normal mt-0.5">Immutable database events</p>
        </div>

        <div className="bg-white border border-[#FCE4EC] rounded-2xl p-4 shadow-sm hover:border-[#C2477A] transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-black uppercase tracking-wider">Today's Activity</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Calendar size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700">{metrics.actionsToday}</div>
          <p className="text-[11px] text-black font-normal mt-0.5">Actions recorded today</p>
        </div>

        <div className="bg-white border border-[#FCE4EC] rounded-2xl p-4 shadow-sm hover:border-[#C2477A] transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-black uppercase tracking-wider">Active Operators</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Users size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700">{metrics.distinctOperators}</div>
          <p className="text-[11px] text-black font-normal mt-0.5">Staff & Admin users</p>
        </div>

        <div className="bg-white border border-[#FCE4EC] rounded-2xl p-4 shadow-sm hover:border-[#C2477A] transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-black uppercase tracking-wider">Approvals Handled</span>
            <div className="w-7 h-7 rounded-lg bg-[#FFF5F8] text-[#C2477A] flex items-center justify-center">
              <ShieldCheck size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-[#C2477A]">{metrics.approvals}</div>
          <p className="text-[11px] text-black font-normal mt-0.5">Review events logged</p>
        </div>
      </div>

      {/* 3. Filters */}
      <div className="bg-white border border-[#FCE4EC] rounded-2xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative sm:col-span-2">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C2477A]" />
            <input
              type="text"
              placeholder="Search operator, action, module, or entity ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs text-black font-medium bg-white border border-[#FCE4EC] rounded-xl focus:outline-none focus:border-[#C2477A] focus:ring-2 focus:ring-[#C2477A]/15 placeholder:text-gray-400 transition-all"
            />
          </div>

          {/* Operator Filter */}
          <div>
            <select
              value={selectedOperator}
              onChange={(e) => setSelectedOperator(e.target.value)}
              className="w-full text-xs font-bold text-black bg-white border border-[#FCE4EC] rounded-xl px-3 py-2 outline-none focus:border-[#C2477A] cursor-pointer"
            >
              <option value="all">All Operators (Admin & Staff)</option>
              <option value="admin_root">Administrator</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.employee_code || emp.id})</option>
              ))}
            </select>
          </div>

          {/* Module Filter */}
          <div>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="w-full text-xs font-bold text-black bg-white border border-[#FCE4EC] rounded-xl px-3 py-2 outline-none focus:border-[#C2477A] cursor-pointer"
            >
              <option value="all">All Modules</option>
              <option value="products">Products</option>
              <option value="categories">Categories</option>
              <option value="brands">Brands</option>
              <option value="orders">Orders</option>
              <option value="employees">Employees</option>
              <option value="auth">Auth & Security</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Table / Feed */}
      <div className="bg-white border border-[#FCE4EC] rounded-2xl shadow-sm overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center p-6">
            <div className="w-16 h-16 rounded-full bg-[#FFF5F8] border border-[#FCE4EC] flex items-center justify-center text-[#C2477A] mb-3">
              <Activity size={26} />
            </div>
            <h3 className="text-base font-bold text-black mb-1">No Audit Records Found</h3>
            <p className="text-xs text-black font-normal max-w-sm">
              Try adjusting your search criteria or filter options above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FFF5F8] border-b border-[#FCE4EC] text-[11px] font-black uppercase tracking-wider text-black">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Operator</th>
                  <th className="py-3 px-4">Module</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Affected Record</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FCE4EC]/70 text-xs">
                {filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === (log.id || log.created_at);
                  return (
                    <React.Fragment key={log.id || `${log.created_at}_${log.action}`}>
                      <tr className="hover:bg-[#FFF5F8]/40 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-gray-700 whitespace-nowrap">
                          {formatDateTime(log.created_at)}
                        </td>
                        <td className="py-3 px-4 font-bold text-black whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <User size={12} className="text-[#C2477A]" />
                            <span>{log.employee_name || 'System User'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 font-semibold text-gray-800 capitalize">
                            {getModuleIcon(log.module)}
                            <span>{log.module || 'General'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-black">
                          <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 border border-gray-200 text-[10.5px]">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-600 text-[11px] max-w-xs truncate">
                          {log.entity_type ? `${log.entity_type}: ` : ''}{log.entity_id || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            log.status === 'success' || !log.status
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {log.status === 'success' || !log.status ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                            {log.status || 'SUCCESS'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setExpandedLogId(isExpanded ? null : (log.id || log.created_at))}
                            className="text-[#C2477A] hover:underline font-bold text-xs inline-flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>{isExpanded ? 'Hide' : 'Inspect'}</span>
                            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-gray-50/70">
                          <td colSpan={7} className="py-3 px-4 text-xs font-mono">
                            <div className="bg-white border border-[#FCE4EC] rounded-xl p-3 shadow-2xs">
                              <div className="text-[11px] font-bold text-black uppercase mb-1">Payload Metadata:</div>
                              <pre className="text-[11px] font-mono text-gray-700 overflow-x-auto whitespace-pre-wrap">
                                {JSON.stringify(log.metadata || {}, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
