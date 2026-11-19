import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  DollarSign,
  TrendingDown,
  ArrowUpRight,
  Download,
  Building,
  CreditCard,
  Tag
} from 'lucide-react';
import {
  EXPENSE_CATEGORIES,
  PAYMENT_MODES,
  fetchExpenses,
  addExpense,
  updateExpense,
  deleteExpense
} from '../../services/expenseService';

export default function ExpenseManager({ currentAuthUser, onExpenseUpdated }) {
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'purchasing',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Bank Transfer / NEFT',
    vendor: '',
    referenceNumber: '',
    notes: '',
    receiptUrl: ''
  });
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchExpenses();
      setExpenses(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setFormData({
      title: '',
      category: 'purchasing',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Bank Transfer / NEFT',
      vendor: '',
      referenceNumber: '',
      notes: '',
      receiptUrl: ''
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      title: expense.title,
      category: expense.category,
      amount: expense.amount,
      date: expense.date,
      paymentMethod: expense.paymentMethod,
      vendor: expense.vendor || '',
      referenceNumber: expense.referenceNumber || '',
      notes: expense.notes || '',
      receiptUrl: expense.receiptUrl || ''
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.amount || Number(formData.amount) <= 0) {
      setFormError('Please enter a valid expense title and amount.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingExpense) {
        const res = await updateExpense(editingExpense.id, formData);
        if (res.success) {
          setExpenses(res.allExpenses);
          if (onExpenseUpdated) onExpenseUpdated();
          setIsModalOpen(false);
        }
      } else {
        const res = await addExpense(formData, currentAuthUser);
        if (res.success) {
          setExpenses(res.allExpenses);
          if (onExpenseUpdated) onExpenseUpdated();
          setIsModalOpen(false);
        }
      }
    } catch (err) {
      setFormError(err.message || 'Failed to save expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await deleteExpense(id);
      if (res.success) {
        setExpenses(res.allExpenses);
        if (onExpenseUpdated) onExpenseUpdated();
        setDeleteConfirmId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const matchesSearch = 
        exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (exp.vendor && exp.vendor.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (exp.referenceNumber && exp.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = selectedCategory === 'all' || exp.category === selectedCategory;

      let matchesDate = true;
      if (dateFilter === 'this_month') {
        const curMonth = new Date().toISOString().substring(0, 7);
        matchesDate = (exp.date || '').startsWith(curMonth);
      } else if (dateFilter === 'last_30_days') {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        matchesDate = (exp.date || '') >= thirtyDaysAgo;
      }

      return matchesSearch && matchesCat && matchesDate;
    });
  }, [expenses, searchQuery, selectedCategory, dateFilter]);

  // Statistics
  const totalAmount = useMemo(() => {
    return expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  }, [expenses]);

  const thisMonthAmount = useMemo(() => {
    const curMonth = new Date().toISOString().substring(0, 7);
    return expenses.filter(e => (e.date || '').startsWith(curMonth)).reduce((s, e) => s + (Number(e.amount) || 0), 0);
  }, [expenses]);

  // Category distribution
  const categoryTotals = useMemo(() => {
    const map = {};
    expenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + (Number(e.amount) || 0);
    });
    return EXPENSE_CATEGORIES.map(cat => ({
      ...cat,
      total: map[cat.id] || 0,
      percentage: totalAmount > 0 ? (((map[cat.id] || 0) / totalAmount) * 100).toFixed(1) : 0
    })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);
  }, [expenses, totalAmount]);

  return (
    <div className="space-y-6 animate-fade-in font-sans text-gray-900">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-100/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#D81B60] uppercase tracking-wider mb-1">
            <Wallet size={15} />
            <span>Operational Outflow & Direct Cost Tracking</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Expense Management
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
            Log procurement, logistics, packaging, marketing and operating costs for accurate Gross & Net P&L calculations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#D81B60] to-[#E25586] hover:from-[#c2185b] hover:to-[#D81B60] text-white text-xs font-black shadow-md shadow-pink-200 hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center gap-2"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Add New Expense</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-pink-100 shadow-2xs">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Total Recorded Expenses</span>
          <div className="text-2xl font-black text-gray-900 mt-2">
            ₹{totalAmount.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] font-bold text-gray-500 mt-1 block">All-time tracked outflow</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-pink-100 shadow-2xs">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">This Month Expenses</span>
          <div className="text-2xl font-black text-[#D81B60] mt-2">
            ₹{thisMonthAmount.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] font-bold text-gray-500 mt-1 block">Current billing cycle</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-pink-100 shadow-2xs">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Largest Expense Category</span>
          <div className="text-lg font-black text-gray-900 mt-2 truncate">
            {categoryTotals[0]?.name || 'N/A'}
          </div>
          <span className="text-[11px] font-bold text-[#D81B60] mt-1 block">
            ₹{categoryTotals[0]?.total.toLocaleString('en-IN') || 0} ({categoryTotals[0]?.percentage || 0}%)
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-pink-100 shadow-2xs">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Expense Entries Count</span>
          <div className="text-2xl font-black text-gray-900 mt-2">
            {expenses.length} Entries
          </div>
          <span className="text-[11px] font-bold text-emerald-600 mt-1 block">100% Audit trail preserved</span>
        </div>
      </div>

      {/* Category Breakdown Bar */}
      {categoryTotals.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-700">Category Expense Distribution</h4>
            <span className="text-xs font-bold text-gray-400">{categoryTotals.length} active categories</span>
          </div>

          <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
            {categoryTotals.map(cat => (
              <div
                key={cat.id}
                title={`${cat.name}: ₹${cat.total.toLocaleString()} (${cat.percentage}%)`}
                style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                className="h-full hover:opacity-90 transition-opacity"
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {categoryTotals.slice(0, 6).map(cat => (
              <div key={cat.id} className="flex items-center gap-1.5 text-[11px] font-bold text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                <span>{cat.name} ({cat.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-pink-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title, vendor, or invoice reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-pink-100 focus:border-[#D81B60] text-xs font-medium outline-none bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-pink-100 bg-white text-xs font-bold text-gray-700 outline-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            {EXPENSE_CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-pink-100 bg-white text-xs font-bold text-gray-700 outline-none cursor-pointer"
          >
            <option value="all">All Time</option>
            <option value="this_month">This Month</option>
            <option value="last_30_days">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-3xl border border-pink-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-pink-50/50 border-b border-pink-100 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Expense Details</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Vendor / Payee</th>
                <th className="py-3.5 px-4">Payment Mode</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-50/80">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 font-medium">
                    Loading expense records...
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 font-medium">
                    No expense records matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const cat = EXPENSE_CATEGORIES.find(c => c.id === exp.category) || { name: exp.category, color: '#6B7280' };
                  return (
                    <tr key={exp.id} className="hover:bg-pink-50/30 transition-colors">
                      <td className="py-4 px-4 font-bold text-gray-700 whitespace-nowrap">
                        {exp.date}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-extrabold text-gray-900">{exp.title}</div>
                        {exp.referenceNumber && (
                          <span className="text-[10px] font-semibold text-gray-400 block mt-0.5">
                            Ref: {exp.referenceNumber}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide uppercase inline-flex items-center gap-1.5"
                          style={{
                            backgroundColor: `${cat.color}15`,
                            color: cat.color,
                            border: `1px solid ${cat.color}30`
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                          {cat.name}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-semibold text-gray-600">
                        {exp.vendor || '—'}
                      </td>
                      <td className="py-4 px-4 text-gray-600 whitespace-nowrap">
                        {exp.paymentMethod}
                      </td>
                      <td className="py-4 px-4 text-right font-black text-sm text-gray-900 whitespace-nowrap">
                        ₹{Number(exp.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(exp)}
                            className="p-1.5 rounded-lg hover:bg-pink-100 text-gray-500 hover:text-[#D81B60] transition-colors cursor-pointer"
                            title="Edit Expense"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(exp.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-100 text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete Expense"
                          >
                            <Trash2 size={14} />
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

      {/* Add / Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-pink-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-pink-100 mb-5">
              <h3 className="text-lg font-black text-gray-900">
                {editingExpense ? 'Edit Business Expense' : 'Log New Business Expense'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-pink-50 text-gray-400 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold text-gray-700">
              <div>
                <label className="block mb-1">Expense Title / Item *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bulk Matte Lipstick Stock, Bubble Packaging"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-3 rounded-xl border border-pink-100 focus:border-[#D81B60] outline-none font-medium text-gray-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 15000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full p-3 rounded-xl border border-pink-100 focus:border-[#D81B60] outline-none font-black text-gray-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block mb-1">Expense Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-3 rounded-xl border border-pink-100 focus:border-[#D81B60] outline-none font-medium text-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-3 rounded-xl border border-pink-100 focus:border-[#D81B60] outline-none font-bold text-gray-900 bg-white"
                  >
                    {EXPENSE_CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Payment Mode *</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full p-3 rounded-xl border border-pink-100 focus:border-[#D81B60] outline-none font-bold text-gray-900 bg-white"
                  >
                    {PAYMENT_MODES.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Vendor / Payee Name</label>
                  <input
                    type="text"
                    placeholder="e.g. PackWell Ltd, Meta Ads"
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    className="w-full p-3 rounded-xl border border-pink-100 focus:border-[#D81B60] outline-none font-medium text-gray-900"
                  />
                </div>

                <div>
                  <label className="block mb-1">Reference / Invoice #</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-99120"
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                    className="w-full p-3 rounded-xl border border-pink-100 focus:border-[#D81B60] outline-none font-medium text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  placeholder="Optional context about this expense..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-3 rounded-xl border border-pink-100 focus:border-[#D81B60] outline-none font-medium text-gray-900"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D81B60] to-[#E25586] text-white font-black shadow-md cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? 'Saving...' : editingExpense ? 'Update Expense' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-pink-100 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <h4 className="text-base font-black text-gray-900">Delete Expense Entry?</h4>
            <p className="text-xs text-gray-500 font-medium">
              This action will permanently delete this expense from financial calculations and P&L audit reports.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="w-1/2 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
