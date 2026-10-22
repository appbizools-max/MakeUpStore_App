import React, { useState, useMemo } from 'react';
import {
  Search,
  RefreshCw,
  PlusCircle,
  TrendingUp,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  ArrowUpDown,
  Filter,
  PackagePlus,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  Phone,
  Barcode,
  ShoppingBag,
  Eye,
  Check,
  Package
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

export default function CustomerSearchRequestsPage({ onNavigateToNewProduct }) {
  const {
    searchRequests = [],
    searchRequestsLoading = false,
    refreshSearchRequests,
    updateSearchRequestStatus,
    deleteSearchRequest
  } = useAdmin();

  const [filterQuery, setFilterQuery] = useState('');
  const [selectedScope, setSelectedScope] = useState('all'); // all | not_found | found
  const [selectedStatus, setSelectedStatus] = useState('all'); // all | pending | reviewed | product_added | dismissed
  const [sortBy, setSortBy] = useState('count_desc'); // count_desc | latest_desc | oldest_asc
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [inspectMatchedReq, setInspectMatchedReq] = useState(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshSearchRequests();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    const totalSearches = searchRequests.reduce((sum, r) => sum + (Number(r.search_count) || 1), 0);
    const uniqueTerms = searchRequests.length;
    const notFoundCount = searchRequests.filter(r => r.is_found === false).length;
    const foundCount = searchRequests.filter(r => r.is_found !== false).length;
    const pendingCount = searchRequests.filter((r) => (!r.status || r.status === 'pending') && r.is_found === false).length;
    const addedCount = searchRequests.filter((r) => r.status === 'product_added').length;

    return { totalSearches, uniqueTerms, notFoundCount, foundCount, pendingCount, addedCount };
  }, [searchRequests]);

  // Filtering & Sorting
  const filteredRequests = useMemo(() => {
    let list = [...searchRequests];

    // Found / Not Found Scope Filter
    if (selectedScope === 'not_found') {
      list = list.filter(r => r.is_found === false);
    } else if (selectedScope === 'found') {
      list = list.filter(r => r.is_found !== false);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'pending') {
        list = list.filter((r) => !r.status || r.status === 'pending');
      } else {
        list = list.filter((r) => r.status === selectedStatus);
      }
    }

    // Text search filter
    if (filterQuery.trim()) {
      const q = filterQuery.trim().toLowerCase();
      list = list.filter(
        (r) =>
          (r.query && r.query.toLowerCase().includes(q)) ||
          (r.barcode && r.barcode.toLowerCase().includes(q)) ||
          (r.user_name && r.user_name.toLowerCase().includes(q)) ||
          (r.user_phone && r.user_phone.toLowerCase().includes(q))
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'count_desc') {
        const countDiff = (Number(b.search_count) || 1) - (Number(a.search_count) || 1);
        if (countDiff !== 0) return countDiff;
        return new Date(b.latest_searched_at || 0) - new Date(a.latest_searched_at || 0);
      }
      if (sortBy === 'latest_desc') {
        return new Date(b.latest_searched_at || 0) - new Date(a.latest_searched_at || 0);
      }
      if (sortBy === 'oldest_asc') {
        return new Date(a.created_at || a.latest_searched_at || 0) - new Date(b.created_at || b.latest_searched_at || 0);
      }
      return 0;
    });

    return list;
  }, [searchRequests, selectedScope, selectedStatus, filterQuery, sortBy]);

  // Format relative time
  const formatTimeAgo = (isoDate) => {
    if (!isoDate) return 'Recently';
    try {
      const diffMs = Date.now() - new Date(isoDate).getTime();
      const mins = Math.floor(diffMs / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days < 30) return `${days}d ago`;
      return new Date(isoDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
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

  return (
    <div className="space-y-6 animate-fade-in bg-white text-black min-h-screen pb-16">
      {/* ────────── 1. Page Header & Actions ────────── */}
      <div className="bg-white border border-[#FCE4EC] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-9 h-9 rounded-xl bg-[#C2477A] text-white flex items-center justify-center shadow-xs">
              <Search size={18} />
            </div>
            <h1 className="text-xl font-bold text-black tracking-tight">
              Customer Search Requests & Search Activity
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFF5F8] text-[#C2477A] border border-[#F8B4CB]">
              100% Real-Time Tracking
            </span>
          </div>
          <p className="text-xs text-black font-normal">
            Track every product search performed by every user in the User App (whether found or not found) with keyword, barcode, matched products, search count, and user timestamps.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing || searchRequestsLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#FCE4EC] hover:border-[#C2477A] hover:bg-[#FFF5F8] text-black text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
            title="Refresh requests from Supabase"
          >
            <RefreshCw size={14} className={`text-[#C2477A] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync Live</span>
          </button>
        </div>
      </div>

      {/* ────────── 2. Top Metric KPI Cards ────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Searches */}
        <div
          onClick={() => setSelectedScope('all')}
          className={`bg-white border rounded-2xl p-4 shadow-sm cursor-pointer transition-all ${
            selectedScope === 'all' ? 'border-[#C2477A] ring-2 ring-[#C2477A]/10 bg-[#FFF5F8]/20' : 'border-[#FCE4EC] hover:border-[#C2477A]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-black uppercase tracking-wider">Total Customer Searches</span>
            <div className="w-7 h-7 rounded-lg bg-[#FFF5F8] text-[#C2477A] flex items-center justify-center">
              <TrendingUp size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-[#C2477A]">{metrics.totalSearches}</div>
          <p className="text-[11px] text-black font-normal mt-0.5">{metrics.uniqueTerms} distinct search queries</p>
        </div>

        {/* KPI 2: Missing Searches (Not Found) */}
        <div
          onClick={() => setSelectedScope('not_found')}
          className={`bg-white border rounded-2xl p-4 shadow-sm cursor-pointer transition-all ${
            selectedScope === 'not_found' ? 'border-[#C2477A] ring-2 ring-[#C2477A]/10 bg-[#FFF5F8]/20' : 'border-[#FCE4EC] hover:border-[#C2477A]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-black uppercase tracking-wider">Zero Results (Missing)</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600">{metrics.notFoundCount}</div>
          <p className="text-[11px] text-black font-normal mt-0.5">High demand missing from catalog</p>
        </div>

        {/* KPI 3: Matched Searches (Found) */}
        <div
          onClick={() => setSelectedScope('found')}
          className={`bg-white border rounded-2xl p-4 shadow-sm cursor-pointer transition-all ${
            selectedScope === 'found' ? 'border-[#C2477A] ring-2 ring-[#C2477A]/10 bg-[#FFF5F8]/20' : 'border-[#FCE4EC] hover:border-[#C2477A]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-black uppercase tracking-wider">Matched Searches (Found)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700">{metrics.foundCount}</div>
          <p className="text-[11px] text-black font-normal mt-0.5">Successfully found store products</p>
        </div>

        {/* KPI 4: Action Needed */}
        <div className="bg-white border border-[#FCE4EC] rounded-2xl p-4 shadow-sm hover:border-[#C2477A] transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-black uppercase tracking-wider">Added To Catalog</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <PackagePlus size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700">{metrics.addedCount}</div>
          <p className="text-[11px] text-black font-normal mt-0.5">Fulfilled customer demands</p>
        </div>
      </div>

      {/* ────────── 3. Filters & Search Bar ────────── */}
      <div className="bg-white border border-[#FCE4EC] rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C2477A]" />
            <input
              type="text"
              placeholder="Search keyword, barcode, customer name, phone..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs text-black font-medium bg-white border border-[#FCE4EC] rounded-xl focus:outline-none focus:border-[#C2477A] focus:ring-2 focus:ring-[#C2477A]/15 placeholder:text-gray-400 transition-all"
            />
            {filterQuery && (
              <button
                type="button"
                onClick={() => setFilterQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-black flex items-center gap-1 shrink-0">
              <ArrowUpDown size={13} className="text-[#C2477A]" /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs font-bold text-black bg-white border border-[#FCE4EC] rounded-xl px-3 py-2 outline-none focus:border-[#C2477A] cursor-pointer"
            >
              <option value="count_desc">🔥 Most Searched (Highest Frequency)</option>
              <option value="latest_desc">🕒 Most Recent</option>
              <option value="oldest_asc">📅 First Requested</option>
            </select>
          </div>
        </div>

        {/* Filter Scope & Status Tabs */}
        <div className="flex items-center justify-between gap-3 flex-wrap pt-2 border-t border-[#FCE4EC]/60">
          {/* Search Result Status: All vs Not Found vs Found */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'All Searches', count: searchRequests.length },
              { id: 'not_found', label: '❌ Not Found (Missing Demand)', count: metrics.notFoundCount },
              { id: 'found', label: '✅ Found (Catalog Matches)', count: metrics.foundCount }
            ].map((tab) => {
              const isActive = selectedScope === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedScope(tab.id)}
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

          {/* Workflow Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-gray-500">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs font-bold text-black bg-white border border-[#FCE4EC] rounded-xl px-2.5 py-1 outline-none focus:border-[#C2477A] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending">⏳ Needs Review</option>
              <option value="reviewed">🔍 Under Review</option>
              <option value="product_added">✅ Product Added</option>
              <option value="dismissed">✕ Dismissed</option>
            </select>
          </div>
        </div>
      </div>

      {/* ────────── 4. Main Requests Table ────────── */}
      <div className="bg-white border border-[#FCE4EC] rounded-2xl shadow-sm overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center p-6">
            <div className="w-16 h-16 rounded-full bg-[#FFF5F8] border border-[#FCE4EC] flex items-center justify-center text-[#C2477A] mb-3">
              <Search size={26} />
            </div>
            <h3 className="text-base font-bold text-black mb-1">No customer searches found</h3>
            <p className="text-xs text-black font-normal max-w-sm">
              Try changing your scope filter or search keywords above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FFF5F8] border-b border-[#FCE4EC] text-[11px] font-black uppercase tracking-wider text-black">
                  <th className="py-3 px-4">Search Query / Barcode</th>
                  <th className="py-3 px-4">Result Status</th>
                  <th className="py-3 px-4">Search Count</th>
                  <th className="py-3 px-4">Latest Searched</th>
                  <th className="py-3 px-4">Customer Info</th>
                  <th className="py-3 px-4">Review Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FCE4EC]/70 text-xs">
                {filteredRequests.map((request) => {
                  const count = Number(request.search_count) || 1;
                  const isFound = request.is_found !== false;
                  const matchedList = Array.isArray(request.matched_products) ? request.matched_products : [];

                  return (
                    <tr
                      key={request.id}
                      className="hover:bg-[#FFF5F8]/40 transition-colors group"
                    >
                      {/* Search Query */}
                      <td className="py-3.5 px-4 font-bold text-black">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-[#FFF5F8] text-[#C2477A] flex items-center justify-center shrink-0 border border-[#FCE4EC]">
                            {request.barcode ? <Barcode size={13} /> : <Search size={12} />}
                          </span>
                          <div>
                            <div className="text-sm font-bold text-black leading-snug">
                              {request.query || request.barcode}
                            </div>
                            {request.barcode && (
                              <div className="text-[10px] text-purple-700 font-mono font-bold flex items-center gap-1">
                                <Barcode size={10} /> Barcode: {request.barcode}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Result Status: Found vs Not Found */}
                      <td className="py-3.5 px-4">
                        {isFound ? (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={11} /> Matched ({request.matched_count || matchedList.length || 1})
                            </span>
                            {matchedList.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setInspectMatchedReq(request)}
                                className="text-[10.5px] font-bold text-[#C2477A] hover:underline flex items-center gap-0.5 cursor-pointer"
                              >
                                <Eye size={10} /> View
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertCircle size={11} /> Not Found (0 Results)
                          </span>
                        )}
                      </td>

                      {/* Search Count */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black border ${
                            count >= 5
                              ? 'bg-[#C2477A] text-white border-[#C2477A] shadow-xs'
                              : count >= 2
                              ? 'bg-[#FFF5F8] text-[#C2477A] border-[#F8B4CB]'
                              : 'bg-gray-50 text-black border-gray-200'
                          }`}
                        >
                          {count >= 3 && '🔥'} {count} {count === 1 ? 'search' : 'searches'}
                        </span>
                      </td>

                      {/* Latest Searched Time */}
                      <td className="py-3.5 px-4">
                        <div className="text-black font-semibold">
                          {formatDateTime(request.latest_searched_at)}
                        </div>
                        <div className="text-[10px] text-[#C2477A] font-bold">
                          {formatTimeAgo(request.latest_searched_at)}
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="py-3.5 px-4">
                        {request.user_name || request.user_phone ? (
                          <div>
                            <div className="font-bold text-black flex items-center gap-1">
                              <User size={11} className="text-[#C2477A]" />
                              <span>{request.user_name || 'Customer'}</span>
                            </div>
                            {request.user_phone && (
                              <div className="text-[10px] text-gray-600 flex items-center gap-1 font-mono">
                                <Phone size={10} className="text-gray-400" />
                                <span>{request.user_phone}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-500 font-medium italic">
                            Guest Shopper
                          </span>
                        )}
                      </td>

                      {/* Review Status */}
                      <td className="py-3.5 px-4">
                        <select
                          value={request.status || 'pending'}
                          onChange={(e) => updateSearchRequestStatus(request.id, e.target.value)}
                          className="text-xs font-bold text-black bg-white border border-[#FCE4EC] rounded-xl px-2.5 py-1.5 outline-none focus:border-[#C2477A] cursor-pointer shadow-2xs hover:border-[#C2477A]"
                        >
                          <option value="pending">⏳ Needs Review</option>
                          <option value="reviewed">🔍 Under Review</option>
                          <option value="product_added">✅ Product Added</option>
                          <option value="dismissed">✕ Dismissed</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isFound && (
                            <button
                              type="button"
                              onClick={() => {
                                if (onNavigateToNewProduct) {
                                  onNavigateToNewProduct(request.query);
                                }
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#C2477A] hover:bg-[#9E2D5B] text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                              title="Add this product to store catalog"
                            >
                              <PackagePlus size={13} />
                              <span>Create Product</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete search record for "${request.query}"?`)) {
                                deleteSearchRequest(request.id);
                              }
                            }}
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                            title="Delete this search record"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Matched Products Inspection Modal */}
      {inspectMatchedReq && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-pink-100 shadow-2xl animate-scale-up space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 size={18} />
                </div>
                <h3 className="text-base font-bold text-black">
                  Matched Products for "{inspectMatchedReq.query}"
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectMatchedReq(null)}
                className="w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-500 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {(inspectMatchedReq.matched_products || []).map((p, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-black">{p.name || p.id}</div>
                    <div className="text-[11px] text-gray-500">{p.brand} • {p.category}</div>
                  </div>
                  {p.price && (
                    <div className="text-xs font-black text-[#C2477A]">₹{p.price}</div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setInspectMatchedReq(null)}
                className="px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
