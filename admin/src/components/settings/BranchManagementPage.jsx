import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  Phone,
  MapPin,
  User,
  Loader2,
  X,
  AlertCircle,
  Building
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

export default function BranchManagementPage() {
  const {
    branches = [],
    addBranch,
    updateBranch,
    deleteBranch,
    toggleBranchStatus
  } = useAdmin();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State — strictly 4 user fields:
  // 1. Branch Name
  // 2. Branch Location
  // 3. Contact Person Name
  // 4. Contact Number
  const initialFormState = {
    name: '',
    address: '', // Branch Location
    manager_name: '', // Contact Person Name
    contact_number: '', // Contact Number
    code: '',
    is_active: true
  };
  const [formData, setFormData] = useState(initialFormState);

  // Filtered branches
  const filteredBranches = useMemo(() => {
    return (branches || []).filter(b => {
      const matchSearch =
        !searchTerm ||
        (b.name && b.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (b.address && b.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (b.manager_name && b.manager_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (b.contact_number && b.contact_number.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && b.is_active !== false) ||
        (statusFilter === 'inactive' && b.is_active === false);

      return matchSearch && matchStatus;
    });
  }, [branches, searchTerm, statusFilter]);

  const handleOpenAdd = () => {
    setEditingBranch(null);
    setFormData(initialFormState);
    setErrorMsg('');
    setSuccessMsg('');
    setShowModal(true);
  };

  const handleOpenEdit = (branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name || '',
      address: branch.address || branch.location || '',
      manager_name: branch.manager_name || branch.contact_person || '',
      contact_number: branch.contact_number || '',
      code: branch.code || '',
      is_active: branch.is_active !== false
    });
    setErrorMsg('');
    setSuccessMsg('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.name.trim()) {
      setErrorMsg('Branch Name is required.');
      return;
    }
    if (!formData.address.trim()) {
      setErrorMsg('Branch Location is required.');
      return;
    }
    if (!formData.manager_name.trim()) {
      setErrorMsg('Contact Person Name is required.');
      return;
    }
    if (!formData.contact_number.trim()) {
      setErrorMsg('Contact Number is required.');
      return;
    }

    // Auto-generate code if empty to satisfy DB constraint
    const autoCode = editingBranch?.code || (
      'BR-' +
      formData.name.trim().replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() +
      '-' +
      Date.now().toString().slice(-4)
    );

    const payload = {
      name: formData.name.trim(),
      address: formData.address.trim(),
      manager_name: formData.manager_name.trim(),
      contact_number: formData.contact_number.trim(),
      code: autoCode,
      is_active: formData.is_active !== false
    };

    setIsSubmitting(true);
    try {
      if (editingBranch) {
        const res = await updateBranch(editingBranch.id, payload);
        if (res.success) {
          setSuccessMsg('Branch details updated successfully.');
          setShowModal(false);
        } else {
          setErrorMsg(res.error || 'Failed to update branch.');
        }
      } else {
        const res = await addBranch(payload);
        if (res.success) {
          setSuccessMsg('New branch created successfully.');
          setShowModal(false);
        } else {
          setErrorMsg(res.error || 'Failed to create branch.');
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (branch) => {
    if (window.confirm(`Are you sure you want to delete branch "${branch.name}"? This action cannot be undone.`)) {
      try {
        const res = await deleteBranch(branch.id);
        if (!res.success) {
          alert(res.error || 'Failed to delete branch.');
        }
      } catch (err) {
        alert(err.message || 'Error deleting branch.');
      }
    }
  };

  const handleToggle = async (branch) => {
    try {
      await toggleBranchStatus(branch.id);
    } catch (err) {
      alert(err.message || 'Error updating branch status.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#D81B60]/10 text-[#D81B60] flex items-center justify-center">
              <Building2 size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">Branch Management</h1>
              <p className="text-xs text-gray-500 font-medium">
                Admin Settings — Configure and manage store branches.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-[#D81B60] hover:bg-[#a63965] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            <span>Add New Branch</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search branches by name, location, contact..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#D81B60] focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:border-[#D81B60]"
          >
            <option value="all">All Branches ({branches.length})</option>
            <option value="active">Active Only ({branches.filter(b => b.is_active !== false).length})</option>
            <option value="inactive">Inactive Only ({branches.filter(b => b.is_active === false).length})</option>
          </select>
        </div>
      </div>

      {/* Branches List / Grid */}
      {filteredBranches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center shadow-sm">
          <div className="w-14 h-14 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Building2 size={28} />
          </div>
          <h3 className="text-sm font-bold text-gray-800 mb-1">
            {branches.length === 0 ? 'No Branches Configured' : 'No Matching Branches'}
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mb-5">
            {branches.length === 0
              ? 'No branch records found. Click below to add your first store branch.'
              : 'Try clearing your search query or status filter to see other branches.'}
          </p>
          {branches.length === 0 && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-[#D81B60] hover:bg-[#a63965] text-white text-xs font-bold rounded-xl shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={15} />
              <span>Create First Branch</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBranches.map(branch => {
            const isActive = branch.is_active !== false;
            return (
              <div
                key={branch.id}
                className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm hover:border-[#D81B60]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${isActive ? 'bg-[#D81B60]/10 text-[#D81B60]' : 'bg-gray-100 text-gray-400'
                        }`}>
                        <Building size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-gray-900 leading-tight">{branch.name}</h3>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Branch Details: Location, Contact Person, Contact Number */}
                  <div className="space-y-2 text-xs text-gray-600 mb-4 bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                    <div className="flex items-start gap-2">
                      <MapPin size={13} className="text-[#D81B60] shrink-0 mt-0.5" />
                      <span className="leading-tight text-[11px] font-medium text-gray-700">
                        {branch.address || branch.location || 'Location not specified'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <User size={13} className="text-[#D81B60] shrink-0" />
                      <span className="text-[11px] font-semibold text-gray-700">
                        Contact Person: <strong className="font-bold text-gray-900">{branch.manager_name || branch.contact_person || 'Not specified'}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-[#D81B60] shrink-0" />
                      <span className="text-[11px] font-semibold text-gray-700">
                        Contact: {branch.contact_number || 'Not specified'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggle(branch)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${isActive
                        ? 'bg-gray-100 text-gray-600 hover:bg-rose-50 hover:text-rose-700'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                  >
                    {isActive ? 'Deactivate' : 'Activate'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(branch)}
                      className="p-1.5 text-gray-500 hover:text-[#D81B60] hover:bg-[#D81B60]/10 rounded-lg transition-all cursor-pointer"
                      title="Edit Branch"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(branch)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                      title="Delete Branch"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Branch Modal — ONLY 4 FIELDS:
          1. Branch Name
          2. Branch Location
          3. Contact Person Name
          4. Contact Number
      */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#D81B60]/10 text-[#D81B60] flex items-center justify-center">
                  <Building2 size={18} />
                </div>
                <h2 className="text-base font-black text-gray-900">
                  {editingBranch ? 'Edit Branch Details' : 'Add New Branch'}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={15} className="text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 1. Branch Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Branch Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Hyderabad Central Store"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 outline-none focus:border-[#D81B60]"
                />
              </div>

              {/* 2. Branch Location */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Branch Location <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Road No. 36, Jubilee Hills, Hyderabad"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 outline-none focus:border-[#D81B60]"
                />
              </div>

              {/* 3. Contact Person Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Contact Person Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.manager_name}
                  onChange={e => setFormData({ ...formData, manager_name: e.target.value })}
                  placeholder="e.g. Rajesh Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 outline-none focus:border-[#D81B60]"
                />
              </div>

              {/* 4. Contact Number */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Contact Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.contact_number}
                  onChange={e => setFormData({ ...formData, contact_number: e.target.value })}
                  placeholder="e.g. +91 80197 94556 or 10-digit number"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 outline-none focus:border-[#D81B60]"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-[#D81B60] hover:bg-[#a63965] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingBranch ? 'Save Changes' : 'Create Branch'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
