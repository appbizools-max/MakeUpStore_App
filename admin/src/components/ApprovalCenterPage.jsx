import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Package,
  Layers,
  Sparkles,
  ShoppingBag,
  BadgePlus,
  ArrowRight,
  User,
  AlertCircle,
  Eye,
  Check,
  X,
  FileText,
  Calendar,
  ChevronDown,
  ChevronUp,
  Tag
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

export default function ApprovalCenterPage({ onNavigate }) {
  const {
    employeeOperations = [],
    approveEmployeeOperation,
    rejectEmployeeOperation,
    refreshEmployeeOperations,
    currentAuthUser
  } = useAdmin();

  const [filterStatus, setFilterStatus] = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'all'
  const [filterModule, setFilterModule] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedOpId, setExpandedOpId] = useState(null);
  const [isProcessingId, setIsProcessingId] = useState(null);
  const [rejectionModalOp, setRejectionModalOp] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (refreshEmployeeOperations) {
      await refreshEmployeeOperations();
    }
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const metrics = useMemo(() => {
    const total = employeeOperations.length;
    const pending = employeeOperations.filter(op => op.status === 'pending').length;
    const approved = employeeOperations.filter(op => op.status === 'approved').length;
    const rejected = employeeOperations.filter(op => op.status === 'rejected').length;
    return { total, pending, approved, rejected };
  }, [employeeOperations]);

  const filteredOperations = useMemo(() => {
    return employeeOperations.filter(op => {
      // Status Filter
      if (filterStatus !== 'all' && op.status !== filterStatus) return false;

      // Module Filter
      if (filterModule !== 'all' && (op.module || '').toLowerCase() !== filterModule.toLowerCase()) return false;

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchesName = (op.employee_name || '').toLowerCase().includes(q);
        const matchesOp = (op.operation_type || '').toLowerCase().includes(q);
        const matchesMod = (op.module || '').toLowerCase().includes(q);
        const matchesRecord = (op.record_title || op.entity_id || '').toLowerCase().includes(q);
        if (!matchesName && !matchesOp && !matchesMod && !matchesRecord) return false;
      }

      return true;
    });
  }, [employeeOperations, filterStatus, filterModule, searchTerm]);

  const handleApprove = async (op) => {
    if (!window.confirm(`Approve this ${op.operation_type} operation by ${op.employee_name}? Changes will be published to the live store immediately.`)) {
      return;
    }
    try {
      setIsProcessingId(op.id);
      await approveEmployeeOperation(op.id);
    } catch (err) {
      alert(`Approval failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsProcessingId(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectionModalOp) return;
    try {
      setIsProcessingId(rejectionModalOp.id);
      await rejectEmployeeOperation(rejectionModalOp.id, rejectionReason.trim());
      setRejectionModalOp(null);
      setRejectionReason('');
    } catch (err) {
      alert(`Rejection failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsProcessingId(null);
    }
  };

  const formatDateTime = (isoDate) => {
    if (!isoDate) return 'N/A';
    try {
      return new Date(isoDate).toLocaleString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  const getModuleBadge = (mod) => {
    const m = (mod || '').toLowerCase();
    switch (m) {
      case 'products':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-pink-50 text-[#C2477A] border border-pink-200">
            <Package size={11} /> Products
          </span>
        );
      case 'categories':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Layers size={11} /> Categories
          </span>
        );
      case 'brands':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <BadgePlus size={11} /> Brands
          </span>
        );
      case 'orders':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <ShoppingBag size={11} /> Orders
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-50 text-gray-700 border border-gray-200">
            <Tag size={11} /> {mod || 'General'}
          </span>
        );
    }
  };

  const getOperationTypeBadge = (opType) => {
    const t = (opType || '').toUpperCase();
    if (t.includes('CREATE') || t.includes('ADD')) {
      return <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-black text-[10.5px] border border-emerald-200">➕ {opType}</span>;
    }
    if (t.includes('UPDATE') || t.includes('EDIT')) {
      return <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-black text-[10.5px] border border-sky-200">✏️ {opType}</span>;
    }
    if (t.includes('DELETE') || t.includes('REMOVE')) {
      return <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-black text-[10.5px] border border-rose-200">🗑️ {opType}</span>;
    }
    return <span className="px-2 py-0.5 rounded-md bg-gray-50 text-gray-700 font-black text-[10.5px] border border-gray-200">{opType}</span>;
  };

  const renderDataDiff = (oldData, newData) => {
    if (!oldData && !newData) {
      return <div className="text-xs text-gray-500 italic">No diff payload recorded</div>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
        {oldData && (
          <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3">
            <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider mb-1 flex items-center gap-1">
              <span>Previous / Live Data</span>
            </div>
            <pre className="text-[11px] font-mono text-gray-700 overflow-x-auto max-h-48 whitespace-pre-wrap">
              {typeof oldData === 'object' ? JSON.stringify(oldData, null, 2) : String(oldData)}
            </pre>
          </div>
        )}
        {newData && (
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3">
            <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1 flex items-center gap-1">
              <span>Proposed Changes (Pending Approval)</span>
            </div>
            <pre className="text-[11px] font-mono text-gray-700 overflow-x-auto max-h-48 whitespace-pre-wrap">
              {typeof newData === 'object' ? JSON.stringify(newData, null, 2) : String(newData)}
            </pre>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in bg-white text-black min-h-screen pb-16">
      {/* 1. Header */}
      <div className="bg-white border border-[#FCE4EC] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-9 h-9 rounded-xl bg-[#C2477A] text-white flex items-center justify-center shadow-xs">
              <ShieldCheck size={20} />
            </div>
            <h1 className="text-xl font-bold text-black tracking-tight">
              Employee Operations & Approval Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFF5F8] text-[#C2477A] border border-[#F8B4CB]">
              Production Gatekeeper
            </span>
          </div>
          <p className="text-xs text-black font-normal">
            Every product catalog modification, category change, or price update submitted by an employee is queued here for review. Employee changes do not affect the live User App until approved.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
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

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setFilterStatus('pending')}
          className={`bg-white border rounded-2xl p-4 shadow-sm cursor-pointer transition-all ${
            filterStatus === 'pending' ? 'border-[#C2477A] ring-2 ring-[#C2477A]/10 bg-[#FFF5F8]/20' : 'border-[#FCE4EC] hover:border-[#C2477A]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-black uppercase tracking-wider">Pending Approval</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700">{metrics.pending}</div>
          <p className="text-[11px] text-black font-normal mt-0.5">Awaiting Administrator Review</p>
        </div>

        <div
          onClick={() => setFilterStatus('approved')}
          className={`bg-white border rounded-2xl p-4 shadow-sm cursor-pointer transition-all ${
            filterStatus === 'approved' ? 'border-[#C2477A] ring-2 ring-[#C2477A]/10 bg-[#FFF5F8]/20' : 'border-[#FCE4EC] hover:border-[#C2477A]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-black uppercase tracking-wider">Approved & Live</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700">{metrics.approved}</div>
          <p className="text-[11px] text-black font-normal mt-0.5">Published to production User App</p>
        </div>

        <div
          onClick={() => setFilterStatus('rejected')}
          className={`bg-white border rounded-2xl p-4 shadow-sm cursor-pointer transition-all ${
            filterStatus === 'rejected' ? 'border-[#C2477A] ring-2 ring-[#C2477A]/10 bg-[#FFF5F8]/20' : 'border-[#FCE4EC] hover:border-[#C2477A]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-black uppercase tracking-wider">Rejected</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <XCircle size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-700">{metrics.rejected}</div>
          <p className="text-[11px] text-black font-normal mt-0.5">Declined operations</p>
        </div>

        <div
          onClick={() => setFilterStatus('all')}
          className={`bg-white border rounded-2xl p-4 shadow-sm cursor-pointer transition-all ${
            filterStatus === 'all' ? 'border-[#C2477A] ring-2 ring-[#C2477A]/10 bg-[#FFF5F8]/20' : 'border-[#FCE4EC] hover:border-[#C2477A]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-black uppercase tracking-wider">Total Operations</span>
            <div className="w-7 h-7 rounded-lg bg-[#FFF5F8] text-[#C2477A] flex items-center justify-center">
              <FileText size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-[#C2477A]">{metrics.total}</div>
          <p className="text-[11px] text-black font-normal mt-0.5">Full operation history</p>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="bg-white border border-[#FCE4EC] rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C2477A]" />
            <input
              type="text"
              placeholder="Search by employee name, operation type, record title, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs text-black font-medium bg-white border border-[#FCE4EC] rounded-xl focus:outline-none focus:border-[#C2477A] focus:ring-2 focus:ring-[#C2477A]/15 placeholder:text-gray-400 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-black flex items-center gap-1 shrink-0">
              <Filter size={13} className="text-[#C2477A]" /> Module:
            </span>
            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              className="text-xs font-bold text-black bg-white border border-[#FCE4EC] rounded-xl px-3 py-2 outline-none focus:border-[#C2477A] cursor-pointer"
            >
              <option value="all">All Modules</option>
              <option value="products">Products</option>
              <option value="categories">Categories</option>
              <option value="brands">Brands</option>
              <option value="orders">Orders</option>
              <option value="attributes">Attributes</option>
            </select>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-[#FCE4EC]/60">
          {[
            { id: 'pending', label: 'Pending Approval', count: metrics.pending },
            { id: 'approved', label: 'Approved', count: metrics.approved },
            { id: 'rejected', label: 'Rejected', count: metrics.rejected },
            { id: 'all', label: 'All Operations', count: metrics.total }
          ].map((tab) => {
            const isActive = filterStatus === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterStatus(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#C2477A] text-white shadow-xs'
                    : 'bg-white text-black border border-[#FCE4EC] hover:bg-[#FFF5F8] hover:border-[#C2477A]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isActive ? 'bg-white/25 text-white' : 'bg-[#FFF5F8] text-[#C2477A]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Operations Feed */}
      <div className="bg-white border border-[#FCE4EC] rounded-2xl shadow-sm overflow-hidden">
        {filteredOperations.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center p-6">
            <div className="w-16 h-16 rounded-full bg-[#FFF5F8] border border-[#FCE4EC] flex items-center justify-center text-[#C2477A] mb-3">
              <ShieldCheck size={28} />
            </div>
            <h3 className="text-base font-bold text-black mb-1">
              {filterStatus === 'pending' ? 'No Operations Pending Approval' : 'No Operations Found'}
            </h3>
            <p className="text-xs text-black font-normal max-w-sm">
              {filterStatus === 'pending'
                ? 'All employee product additions, price updates, and category edits have been reviewed and approved.'
                : 'Try adjusting your search query or module filters.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#FCE4EC]/70">
            {filteredOperations.map((op) => {
              const isExpanded = expandedOpId === op.id;
              const isPending = op.status === 'pending';
              const isApproved = op.status === 'approved';
              const isRejected = op.status === 'rejected';

              return (
                <div key={op.id} className="p-4 hover:bg-[#FFF5F8]/30 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Operation Info */}
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-[#FFF5F8] border border-[#FCE4EC] flex items-center justify-center text-[#C2477A] shrink-0 font-bold">
                        <User size={16} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-black text-sm">{op.employee_name || 'Staff Member'}</span>
                          <span className="text-[11px] font-mono text-gray-500">({op.employee_id})</span>
                          {getModuleBadge(op.module)}
                          {getOperationTypeBadge(op.operation_type)}
                        </div>

                        <div className="text-xs text-black font-medium flex items-center gap-2">
                          <span className="text-gray-500">Record:</span>
                          <span className="font-bold text-black">{op.record_title || op.entity_id || 'N/A'}</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-500 flex items-center gap-1 font-mono">
                            <Clock size={11} /> {formatDateTime(op.created_at)}
                          </span>
                        </div>

                        {op.status === 'rejected' && op.rejection_reason && (
                          <div className="text-xs font-medium text-rose-700 bg-rose-50 px-2 py-1 rounded-md border border-rose-200">
                            Reason: {op.rejection_reason}
                          </div>
                        )}
                        {op.status === 'approved' && op.approved_at && (
                          <div className="text-[11px] font-medium text-emerald-700">
                            Approved by {op.approved_by || 'Admin'} at {formatDateTime(op.approved_at)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                      <button
                        type="button"
                        onClick={() => setExpandedOpId(isExpanded ? null : op.id)}
                        className="px-3 py-1.5 rounded-xl border border-[#FCE4EC] hover:border-[#C2477A] text-xs font-bold text-black bg-white flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <Eye size={12} className="text-[#C2477A]" />
                        <span>{isExpanded ? 'Hide Diff' : 'View Diff'}</span>
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>

                      {isPending ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleApprove(op)}
                            disabled={isProcessingId === op.id}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer active:scale-95 disabled:opacity-50"
                          >
                            <Check size={13} />
                            <span>{isProcessingId === op.id ? 'Applying...' : 'Approve'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setRejectionModalOp(op)}
                            disabled={isProcessingId === op.id}
                            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer active:scale-95 disabled:opacity-50"
                          >
                            <X size={13} />
                            <span>Reject</span>
                          </button>
                        </>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black border ${
                            isApproved
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {isApproved ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          <span>{isApproved ? 'Approved' : 'Rejected'}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded Diff Viewer */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-[#FCE4EC]/60 animate-fade-in">
                      <div className="text-xs font-bold text-black mb-1 flex items-center gap-1">
                        <FileText size={13} className="text-[#C2477A]" />
                        <span>Data Payload Diff Inspection:</span>
                      </div>
                      {renderDataDiff(op.old_data, op.new_data)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {rejectionModalOp && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-pink-100 shadow-2xl animate-scale-up space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertCircle size={18} />
                </div>
                <h3 className="text-base font-bold text-black">Reject Operation</h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectionModalOp(null)}
                className="w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-500 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600 font-medium">
              You are rejecting the <strong>{rejectionModalOp.operation_type}</strong> operation on{' '}
              <strong>{rejectionModalOp.record_title || rejectionModalOp.entity_id}</strong> submitted by{' '}
              <strong>{rejectionModalOp.employee_name}</strong>.
            </p>

            <div>
              <label className="block text-xs font-bold text-black mb-1">
                Rejection Reason (Optional):
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Price too low, Incorrect brand specification, Duplicate SKU..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full text-xs p-3 border border-[#FCE4EC] rounded-xl focus:border-[#C2477A] focus:outline-none placeholder:text-gray-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectionModalOp(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-black hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
                disabled={isProcessingId === rejectionModalOp.id}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                {isProcessingId === rejectionModalOp.id ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
