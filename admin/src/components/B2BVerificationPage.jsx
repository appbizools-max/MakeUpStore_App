import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  Award,
  Sparkles,
  FileText,
  Calendar,
  AlertTriangle,
  ExternalLink,
  Eye,
  Check,
  X,
  RotateCcw,
  Ban,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Briefcase,
  Globe,
  SlidersHorizontal,
  Download,
  Info,
  Navigation,
  MessageSquare,
  Send,
  CheckSquare,
  Square,
  PhoneCall,
  HelpCircle
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import {
  B2B_ROLES,
  ROLE_LABELS,
  ROLE_SHORT_TITLES,
  VERIFICATION_STATUSES,
  STANDARD_DOCUMENT_SLOTS
} from '../utils/b2bVerificationService';

export default function B2BVerificationPage({ initialSubTab = 'all', rolePreset = 'all' }) {
  const {
    b2bVerifications = [],
    b2bLoading = false,
    refreshB2BVerifications,
    approveB2BVerification,
    rejectB2BVerification,
    requestResubmissionB2BVerification,
    suspendB2BVerification,
    users = []
  } = useAdmin();

  const normalizedRolePreset = useMemo(() => {
    if (!rolePreset || rolePreset === 'all') return 'all';
    const lower = rolePreset.toLowerCase();
    if (lower === 'makeup-artist' || lower === 'makeup_artist') return 'artist';
    return lower;
  }, [rolePreset]);

  const isPresetRole = normalizedRolePreset !== 'all';
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab || 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState(isPresetRole ? normalizedRolePreset : 'all');
  const [selectedCityFilter, setSelectedCityFilter] = useState('all');
  const [selectedDateSort, setSelectedDateSort] = useState('newest'); // 'newest' | 'oldest'

  // Selected application for detailed review modal
  const [reviewApplication, setReviewApplication] = useState(null);

  // Action Modals State
  // type: 'approve' | 'reject' | 'request_documents' | 'request_info' | 'suspend'
  const [actionModal, setActionModal] = useState(null);
  const [actionReason, setActionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [selectedDocsForRequest, setSelectedDocsForRequest] = useState([]);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [showContactDropdown, setShowContactDropdown] = useState(false);

  // Sync initialSubTab when changed from sidebar menu
  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Sync rolePreset when route changes
  useEffect(() => {
    if (normalizedRolePreset !== 'all') {
      setSelectedRoleFilter(normalizedRolePreset);
    } else {
      setSelectedRoleFilter('all');
    }
  }, [normalizedRolePreset]);

  // Keep reviewApplication synced if b2bVerifications updates in background
  useEffect(() => {
    if (reviewApplication) {
      const updated = b2bVerifications.find(v => v.id === reviewApplication.id);
      if (updated) {
        setReviewApplication(updated);
      }
    }
  }, [b2bVerifications]);

  // Unique cities list for filter dropdown
  const uniqueCities = useMemo(() => {
    const set = new Set();
    const sourceList = isPresetRole
      ? b2bVerifications.filter(v => (v.role || '').toLowerCase() === normalizedRolePreset)
      : b2bVerifications;
    sourceList.forEach(v => {
      if (v.city && v.city.trim()) set.add(v.city.trim());
    });
    return Array.from(set).sort();
  }, [b2bVerifications, isPresetRole, normalizedRolePreset]);

  // Metrics summary
  const metrics = useMemo(() => {
    const list = isPresetRole
      ? b2bVerifications.filter(v => (v.role || '').toLowerCase() === normalizedRolePreset)
      : b2bVerifications;
    const total = list.length;
    const submitted = list.filter(v => v.verification_status === 'submitted').length;
    const underReview = list.filter(v => v.verification_status === 'under_review').length;
    const approved = list.filter(v => v.verification_status === 'approved').length;
    const rejected = list.filter(v => v.verification_status === 'rejected').length;
    const resubmission = list.filter(v => v.verification_status === 'resubmission_required').length;
    const suspended = list.filter(v => v.verification_status === 'suspended').length;
    const pendingTotal = submitted + underReview;
    return { total, submitted, underReview, approved, rejected, resubmission, suspended, pendingTotal };
  }, [b2bVerifications, isPresetRole, normalizedRolePreset]);

  const pageTitle = useMemo(() => {
    if (normalizedRolePreset === 'salon') return 'Salon Verification Panel';
    if (normalizedRolePreset === 'artist') return 'Makeup Artist Verification Panel';
    if (normalizedRolePreset === 'beautician') return 'Beautician Verification Panel';
    return 'B2B Professional Verification';
  }, [normalizedRolePreset]);

  const pageSubtitle = useMemo(() => {
    if (normalizedRolePreset === 'salon') return 'Review complete Salon profiles, personal & business addresses, verify location, optional documents, and approve wholesale salon pricing.';
    if (normalizedRolePreset === 'artist') return 'Review Makeup Artist profiles, personal & studio addresses, verify location, optional documents, and approve professional artist pricing.';
    if (normalizedRolePreset === 'beautician') return 'Review Beautician profiles, personal & business addresses, verify location, optional documents, and approve beautician wholesale pricing.';
    return 'Review business credentials, personal & business addresses, optional verification documents, and approve wholesale pricing for Salons, Makeup Artists & Beauticians.';
  }, [normalizedRolePreset]);

  // Helper to find document matching slot
  const findDocForSlot = (slotKey, docs = []) => {
    if (!Array.isArray(docs)) return null;
    return docs.find(d => {
      const type = (d.document_type || d.type || d.key || '').toLowerCase().replace(/[\s-]+/g, '_');
      const target = slotKey.toLowerCase().replace(/[\s-]+/g, '_');
      return type === target || (d.file_name || '').toLowerCase().includes(slotKey.replace('_', ' '));
    });
  };

  // Count submitted documents
  const getSubmittedDocCount = (app) => {
    if (!app || !Array.isArray(app.documents)) return 0;
    return app.documents.length;
  };

  // Helper to build Google Maps Search URL
  const getMapUrl = (coords, address) => {
    if (coords && coords.trim()) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coords.trim())}`;
    }
    if (address && address.trim()) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`;
    }
    return null;
  };

  // Filtered & Sorted Applications
  const filteredApplications = useMemo(() => {
    return b2bVerifications.filter(app => {
      // 1. Status Filter (Tab)
      if (activeSubTab !== 'all') {
        const curStatus = (app.verification_status || 'submitted').toLowerCase();
        if (activeSubTab === 'pending') {
          if (curStatus !== 'submitted') return false;
        } else if (curStatus !== activeSubTab) {
          return false;
        }
      }

      // 2. Role Filter (locked if rolePreset provided, otherwise uses dropdown)
      const activeRole = isPresetRole ? normalizedRolePreset : selectedRoleFilter.toLowerCase();
      if (activeRole !== 'all') {
        const checkRole = (activeRole === 'makeup-artist' || activeRole === 'makeup_artist') ? 'artist' : activeRole;
        if ((app.role || '').toLowerCase() !== checkRole) {
          return false;
        }
      }

      // 3. City Filter
      if (selectedCityFilter !== 'all') {
        if ((app.city || '').toLowerCase() !== selectedCityFilter.toLowerCase()) {
          return false;
        }
      }

      // 4. Search Filter (Name, Phone, Business Name, Professional Name)
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const applicantName = (app.professional_name || app.name || '').toLowerCase();
        const bizName = (app.business_name || '').toLowerCase();
        const phone = (app.phone || '').toLowerCase();
        const email = (app.email || '').toLowerCase();
        const city = (app.city || '').toLowerCase();

        if (
          !applicantName.includes(q) &&
          !bizName.includes(q) &&
          !phone.includes(q) &&
          !email.includes(q) &&
          !city.includes(q)
        ) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      const dateA = new Date(a.submitted_at || a.created_at || 0).getTime();
      const dateB = new Date(b.submitted_at || b.created_at || 0).getTime();
      return selectedDateSort === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [b2bVerifications, activeSubTab, selectedRoleFilter, selectedCityFilter, searchTerm, selectedDateSort]);

  // Format date helper
  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (_) {
      return isoString;
    }
  };

  // Open Action Modal
  const openActionModal = (type, app, preSelectedDocKey = null) => {
    setActionModal({ type, app });
    setAdminNotes('');
    setShowContactDropdown(false);

    if (type === 'request_documents') {
      if (preSelectedDocKey) {
        setSelectedDocsForRequest([preSelectedDocKey]);
      } else {
        // Find documents that are not yet submitted
        const missing = STANDARD_DOCUMENT_SLOTS
          .filter(slot => !findDocForSlot(slot.key, app.documents))
          .map(s => s.key);
        // Default select top 2 missing or empty
        setSelectedDocsForRequest(missing.slice(0, 2));
      }
      setActionReason('Please upload your requested documents to complete professional verification.');
    } else if (type === 'request_info') {
      setSelectedDocsForRequest([]);
      setActionReason('Please provide additional details regarding your professional business setup.');
    } else if (type === 'reject') {
      setSelectedDocsForRequest([]);
      setActionReason('Details provided could not be verified.');
    } else {
      setSelectedDocsForRequest([]);
      setActionReason('');
    }
  };

  // Submit Action Modal
  const handleConfirmAction = async () => {
    if (!actionModal) return;
    const { type, app } = actionModal;

    if ((type === 'reject' || type === 'request_documents' || type === 'request_info' || type === 'suspend') && !actionReason.trim()) {
      alert('Please enter a note or reason for this action.');
      return;
    }

    if (type === 'request_documents' && selectedDocsForRequest.length === 0) {
      alert('Please select at least one document to request from the checklist.');
      return;
    }

    try {
      setIsProcessingAction(true);
      if (type === 'approve') {
        await approveB2BVerification(app.id, adminNotes);
      } else if (type === 'reject') {
        await rejectB2BVerification(app.id, actionReason, adminNotes);
      } else if (type === 'request_documents') {
        await requestResubmissionB2BVerification(app.id, actionReason, adminNotes, selectedDocsForRequest);
      } else if (type === 'request_info') {
        await requestResubmissionB2BVerification(app.id, actionReason, adminNotes, []);
      } else if (type === 'suspend') {
        await suspendB2BVerification(app.id, actionReason, adminNotes);
      }

      setActionModal(null);
    } catch (err) {
      alert(`Action failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Toggle document selection for request
  const toggleDocSelection = (docKey) => {
    setSelectedDocsForRequest(prev => {
      if (prev.includes(docKey)) {
        return prev.filter(k => k !== docKey);
      } else {
        return [...prev, docKey];
      }
    });
  };

  // Quick Preset Reasons
  const presetReasons = {
    reject: [
      'Identity proof provided is expired or unclear.',
      'GSTIN details do not match the business name.',
      'Business address could not be verified.',
      'Duplicate account or unverified business details.'
    ],
    request_documents: [
      'Please upload your GST Certificate and Business Registration Proof to complete verification.',
      'Please upload your Professional License / Certificate to verify wholesale salon tier.',
      'Please upload your Government ID and Business Proof for address verification.',
      'Please upload your PAN Card and Business Registration Certificate.'
    ],
    request_info: [
      'Please provide your current active studio / salon location address.',
      'Please confirm the primary contact person and business operational hours.',
      'Please clarify whether you offer on-site client services or salon visits.',
      'Please verify the shop name and landmark near your salon.'
    ],
    suspend: [
      'Business operations ceased or salon closed.',
      'Policy violation: unauthorized retail reselling of professional stocks.',
      'Administrative review requested by management.'
    ]
  };

  // Status Badge Component
  const renderStatusBadge = (status) => {
    const st = (status || 'submitted').toLowerCase();
    const conf = VERIFICATION_STATUSES[st] || VERIFICATION_STATUSES.submitted;

    let icon = <Clock size={13} />;
    if (st === 'approved') icon = <CheckCircle2 size={13} />;
    if (st === 'rejected') icon = <XCircle size={13} />;
    if (st === 'resubmission_required') icon = <RotateCcw size={13} />;
    if (st === 'suspended') icon = <Ban size={13} />;

    return (
      <span
        style={{ color: conf.badgeColor, backgroundColor: conf.badgeBg }}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
      >
        {icon}
        {conf.label}
      </span>
    );
  };

  // Role Badge Component
  const renderRoleBadge = (role) => {
    const r = (role || 'salon').toLowerCase();
    let badgeClass = 'bg-pink-100 text-pink-700 border-pink-200';
    let icon = <Building2 size={13} />;
    if (r === 'artist') {
      badgeClass = 'bg-purple-100 text-purple-700 border-purple-200';
      icon = <Sparkles size={13} />;
    } else if (r === 'beautician') {
      badgeClass = 'bg-emerald-100 text-emerald-700 border-emerald-200';
      icon = <Award size={13} />;
    }

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${badgeClass}`}>
        {icon}
        {ROLE_SHORT_TITLES[r] || r}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#C2477A] to-pink-500 text-white flex items-center justify-center shadow-md">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#3A2430] tracking-tight">
                {pageTitle}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {pageSubtitle}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button
            onClick={refreshB2BVerifications}
            disabled={b2bLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={b2bLoading ? 'animate-spin text-[#C2477A]' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* 2. Top Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3.5">
        {/* Total Applications */}
        <div
          onClick={() => setActiveSubTab('all')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeSubTab === 'all'
              ? 'bg-[#3A2430] text-white border-[#3A2430] shadow-md'
              : 'bg-white text-gray-800 border-gray-200/80 hover:border-gray-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold opacity-80 mb-1">
            <span>All Applications</span>
            <FileText size={15} />
          </div>
          <div className="text-2xl font-black">{metrics.total}</div>
        </div>

        {/* Pending / Submitted */}
        <div
          onClick={() => setActiveSubTab('submitted')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeSubTab === 'submitted'
              ? 'bg-amber-600 text-white border-amber-600 shadow-md'
              : 'bg-white text-gray-800 border-gray-200/80 hover:border-amber-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold opacity-80 mb-1">
            <span>Pending</span>
            <Clock size={15} className={activeSubTab === 'submitted' ? 'text-white' : 'text-amber-500'} />
          </div>
          <div className="text-2xl font-black text-amber-600" style={{ color: activeSubTab === 'submitted' ? '#FFFFFF' : '#D97706' }}>
            {metrics.submitted}
          </div>
        </div>

        {/* Under Review */}
        <div
          onClick={() => setActiveSubTab('under_review')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeSubTab === 'under_review'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md'
              : 'bg-white text-gray-800 border-gray-200/80 hover:border-blue-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold opacity-80 mb-1">
            <span>Under Review</span>
            <Eye size={15} className={activeSubTab === 'under_review' ? 'text-white' : 'text-blue-500'} />
          </div>
          <div className="text-2xl font-black" style={{ color: activeSubTab === 'under_review' ? '#FFFFFF' : '#2563EB' }}>
            {metrics.underReview}
          </div>
        </div>

        {/* Approved */}
        <div
          onClick={() => setActiveSubTab('approved')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeSubTab === 'approved'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
              : 'bg-white text-gray-800 border-gray-200/80 hover:border-emerald-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold opacity-80 mb-1">
            <span>Approved (B2B)</span>
            <CheckCircle2 size={15} className={activeSubTab === 'approved' ? 'text-white' : 'text-emerald-500'} />
          </div>
          <div className="text-2xl font-black" style={{ color: activeSubTab === 'approved' ? '#FFFFFF' : '#059669' }}>
            {metrics.approved}
          </div>
        </div>

        {/* Resubmission Required */}
        <div
          onClick={() => setActiveSubTab('resubmission_required')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeSubTab === 'resubmission_required'
              ? 'bg-orange-600 text-white border-orange-600 shadow-md'
              : 'bg-white text-gray-800 border-gray-200/80 hover:border-orange-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold opacity-80 mb-1">
            <span>Resubmission</span>
            <RotateCcw size={15} className={activeSubTab === 'resubmission_required' ? 'text-white' : 'text-orange-500'} />
          </div>
          <div className="text-2xl font-black" style={{ color: activeSubTab === 'resubmission_required' ? '#FFFFFF' : '#EA580C' }}>
            {metrics.resubmission}
          </div>
        </div>

        {/* Rejected & Suspended */}
        <div
          onClick={() => setActiveSubTab('rejected')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeSubTab === 'rejected' || activeSubTab === 'suspended'
              ? 'bg-rose-700 text-white border-rose-700 shadow-md'
              : 'bg-white text-gray-800 border-gray-200/80 hover:border-rose-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold opacity-80 mb-1">
            <span>Rejected / Suspend</span>
            <Ban size={15} className={activeSubTab === 'rejected' ? 'text-white' : 'text-rose-500'} />
          </div>
          <div className="text-2xl font-black" style={{ color: (activeSubTab === 'rejected' || activeSubTab === 'suspended') ? '#FFFFFF' : '#DC2626' }}>
            {metrics.rejected + metrics.suspended}
          </div>
        </div>
      </div>

      {/* 3. Submenu Tabs & Search/Filter Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
        {/* Status Submenus */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-gray-100">
          {[
            { key: 'all', label: 'All Applications', count: metrics.total },
            { key: 'submitted', label: 'Pending', count: metrics.submitted },
            { key: 'under_review', label: 'Under Review', count: metrics.underReview },
            { key: 'approved', label: 'Approved', count: metrics.approved },
            { key: 'rejected', label: 'Rejected', count: metrics.rejected },
            { key: 'resubmission_required', label: 'Resubmission Required', count: metrics.resubmission },
            { key: 'suspended', label: 'Suspended', count: metrics.suspended }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveSubTab(tab.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === tab.key
                  ? 'bg-[#C2477A] text-white shadow-xs'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  activeSubTab === tab.key ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Name, Phone, Business Name, or City..."
              className="w-full pl-10 pr-9 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:border-[#C2477A] focus:ring-1 focus:ring-[#C2477A] transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filters: Role, City, Date Sort */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Role Filter */}
            {isPresetRole ? (
              <div className="px-3 py-2 bg-pink-50 border border-pink-200 rounded-xl text-xs font-bold text-[#C2477A] flex items-center gap-1.5 shadow-2xs">
                <Building2 size={13} className="text-[#C2477A]" />
                <span>
                  {normalizedRolePreset === 'salon' ? 'Salon Applications' : (normalizedRolePreset === 'artist' ? 'Makeup Artist Applications' : 'Beautician Applications')}
                </span>
              </div>
            ) : (
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-hidden focus:border-[#C2477A] cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="salon">Salon (B2B)</option>
                <option value="artist">Makeup Artist (B2B)</option>
                <option value="beautician">Beautician (B2B)</option>
              </select>
            )}

            {/* City Filter */}
            {uniqueCities.length > 0 && (
              <select
                value={selectedCityFilter}
                onChange={(e) => setSelectedCityFilter(e.target.value)}
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-hidden focus:border-[#C2477A] cursor-pointer"
              >
                <option value="all">All Cities</option>
                {uniqueCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            )}

            {/* Date Sort */}
            <select
              value={selectedDateSort}
              onChange={(e) => setSelectedDateSort(e.target.value)}
              className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-hidden focus:border-[#C2477A] cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Admin Verification List Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200/80 text-[11px] font-black uppercase text-gray-500 tracking-wider">
                <th className="py-3.5 px-4">Applicant Name</th>
                <th className="py-3.5 px-4">Business / Professional</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Professional Address</th>
                <th className="py-3.5 px-4">Business Address</th>
                <th className="py-3.5 px-4">Documents</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    <ShieldCheck size={36} className="mx-auto mb-2 text-gray-300 opacity-60" />
                    <p className="font-semibold text-sm">No applications found</p>
                    <p className="text-[11px] mt-0.5">Try clearing filters or search term.</p>
                  </td>
                </tr>
              ) : (
                filteredApplications.map(app => {
                  const applicantName = app.professional_name || app.name || 'Applicant';
                  const bizName = app.business_name || 'Individual Professional';
                  const isVerifiedB2B = (app.verification_status === 'approved' && (app.b2b_verified === true || app.b2bVerified === true));
                  const isSameAddress = (app.is_business_address_same !== false && app.isBusinessAddressSame !== false);
                  const docCount = getSubmittedDocCount(app);

                  return (
                    <tr
                      key={app.id}
                      className="hover:bg-pink-50/30 transition-colors group cursor-pointer"
                      onClick={() => setReviewApplication(app)}
                    >
                      {/* Applicant Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-100 to-rose-200 text-[#C2477A] font-black text-sm flex items-center justify-center shrink-0 border border-pink-200">
                            {applicantName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-extrabold text-[#3A2430] group-hover:text-[#C2477A] transition-colors">
                              {applicantName}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              ID: {app.user_id ? String(app.user_id).replace(/^u_/, '') : app.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Business Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-800 flex items-center gap-1.5">
                          <Building2 size={13} className="text-gray-400 shrink-0" />
                          <span>{bizName}</span>
                        </div>
                        {app.gstin && (
                          <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                            GST: {app.gstin}
                          </div>
                        )}
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        {renderRoleBadge(app.role)}
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-700 flex items-center gap-1">
                          <Phone size={11} className="text-gray-400" />
                          <span>{app.phone || '—'}</span>
                        </div>
                        {app.email && (
                          <div className="text-[10px] text-gray-400 truncate max-w-[150px] flex items-center gap-1 mt-0.5">
                            <Mail size={11} className="text-gray-400 shrink-0" />
                            <span>{app.email}</span>
                          </div>
                        )}
                      </td>

                      {/* Professional Address */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-700 flex items-center gap-1">
                          <MapPin size={12} className="text-gray-400 shrink-0" />
                          <span className="truncate max-w-[140px]">{app.city || '—'}</span>
                        </div>
                        {app.state && (
                          <div className="text-[10px] text-gray-400 ml-4">
                            {app.state} {app.pincode ? `(${app.pincode})` : ''}
                          </div>
                        )}
                      </td>

                      {/* Business Address Status (Same or Different) */}
                      <td className="py-3.5 px-4">
                        {isSameAddress ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                            <Check size={11} /> Same Address
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
                            • Separate Address
                          </span>
                        )}
                      </td>

                      {/* Documents Status */}
                      <td className="py-3.5 px-4">
                        {docCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <FileText size={11} /> {docCount} of 7
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-gray-100 text-gray-500 border border-gray-200">
                            Optional (0)
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {renderStatusBadge(app.verification_status)}
                        {isVerifiedB2B && (
                          <div className="text-[9.5px] font-extrabold text-emerald-700 mt-0.5">
                            • Wholesale Active
                          </div>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setReviewApplication(app)}
                            className="px-3 py-1.5 bg-[#C2477A] text-white rounded-lg text-xs font-bold hover:bg-[#a63563] transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                          >
                            <Eye size={12} />
                            Review
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

      {/* 5. Complete Verification Review Modal */}
      {reviewApplication && (() => {
        const isSame = (reviewApplication.is_business_address_same !== false && reviewApplication.isBusinessAddressSame !== false);
        const submittedDocCount = getSubmittedDocCount(reviewApplication);
        const profCoords = reviewApplication.location_coords || reviewApplication.locationCoords || '';
        const profAddressFull = [reviewApplication.address, reviewApplication.city, reviewApplication.state, reviewApplication.pincode, reviewApplication.country].filter(Boolean).join(', ');
        const bizAddressFull = isSame
          ? profAddressFull
          : [
              reviewApplication.business_address || reviewApplication.businessAddress,
              reviewApplication.business_city || reviewApplication.businessCity,
              reviewApplication.business_state || reviewApplication.businessState,
              reviewApplication.business_pincode || reviewApplication.businessPincode,
              reviewApplication.business_country || reviewApplication.businessCountry
            ].filter(Boolean).join(', ');
        const bizCoords = isSame ? profCoords : (reviewApplication.business_location_coords || reviewApplication.businessLocationCoords || '');

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-pink-100 overflow-hidden animate-in fade-in zoom-in-95">
              {/* Modal Header */}
              <div className="p-6 bg-gradient-to-r from-[#3A2430] to-[#5a364b] text-white flex items-start justify-between shrink-0">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 text-pink-300 flex items-center justify-center font-black text-xl shadow-inner">
                    {(reviewApplication.professional_name || reviewApplication.name || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-black tracking-tight text-white">
                        {reviewApplication.professional_name || reviewApplication.name || 'Professional Applicant'}
                      </h2>
                      {renderRoleBadge(reviewApplication.role)}
                      {renderStatusBadge(reviewApplication.verification_status)}
                    </div>
                    <p className="text-xs text-pink-200 mt-1 flex items-center gap-3">
                      <span>Business: <strong>{reviewApplication.business_name || 'Individual Professional'}</strong></span>
                      <span>•</span>
                      <span>Submitted: {formatDate(reviewApplication.submitted_at)}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setReviewApplication(null);
                    setShowContactDropdown(false);
                  }}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body - Scrollable Sections */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-gray-700">
                {/* Alert banner if rejected or requested documents */}
                {reviewApplication.rejection_reason && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                    <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
                    <div className="text-xs flex-1">
                      <div className="font-bold text-amber-900">
                        Previous Admin Feedback / Request Note:
                      </div>
                      <div className="text-amber-800 mt-0.5 italic">
                        "{reviewApplication.rejection_reason}"
                      </div>
                      {Array.isArray(reviewApplication.requested_documents) && reviewApplication.requested_documents.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                          <span className="font-bold text-amber-900">Requested Documents:</span>
                          {reviewApplication.requested_documents.map(k => {
                            const found = STANDARD_DOCUMENT_SLOTS.find(s => s.key === k);
                            return (
                              <span key={k} className="px-2 py-0.5 bg-amber-200/60 text-amber-900 rounded-md font-bold text-[10px]">
                                {found ? found.label : k}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SUMMARY CHECKLIST TABLE (ADMIN REQUIREMENTS) */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
                  <div className="bg-gradient-to-r from-gray-50 to-pink-50/40 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <span className="text-xs font-black text-[#3A2430] uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle2 size={15} className="text-[#C2477A]" />
                      B2B Verification Status Checklist
                    </span>
                    <span className="text-[11px] font-bold text-gray-500">
                      Workflow Status: {renderStatusBadge(reviewApplication.verification_status)}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50/70 text-[10px] uppercase font-bold text-gray-500 border-b border-gray-100">
                        <tr>
                          <th className="py-2.5 px-4">Verification Check</th>
                          <th className="py-2.5 px-4">Status</th>
                          <th className="py-2.5 px-4 text-right">Details & Match</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium">
                        {/* 1. Professional Details */}
                        <tr>
                          <td className="py-2.5 px-4 font-semibold text-gray-800">Professional Details</td>
                          <td className="py-2.5 px-4">
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md text-[11px] border border-emerald-100">
                              <Check size={12} /> Provided
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right text-gray-500">
                            {reviewApplication.professional_name || reviewApplication.name} ({ROLE_SHORT_TITLES[reviewApplication.role] || reviewApplication.role})
                          </td>
                        </tr>

                        {/* 2. Professional Address */}
                        <tr>
                          <td className="py-2.5 px-4 font-semibold text-gray-800">Professional Address</td>
                          <td className="py-2.5 px-4">
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md text-[11px] border border-emerald-100">
                              <Check size={12} /> Provided
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right text-gray-500">
                            {reviewApplication.city || '—'}, {reviewApplication.state || '—'} {reviewApplication.pincode ? `(${reviewApplication.pincode})` : ''}
                          </td>
                        </tr>

                        {/* 3. Location / Map location */}
                        <tr>
                          <td className="py-2.5 px-4 font-semibold text-gray-800">Location / Map Location</td>
                          <td className="py-2.5 px-4">
                            {profCoords ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md text-[11px] border border-emerald-100">
                                <Check size={12} /> GPS Captured
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md text-[11px] border border-amber-100">
                                <MapPin size={12} /> Manual Address
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-right text-gray-500">
                            {profCoords ? (
                              <a
                                href={getMapUrl(profCoords, profAddressFull)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#C2477A] font-bold hover:underline inline-flex items-center gap-1"
                              >
                                {profCoords} <ExternalLink size={10} />
                              </a>
                            ) : (
                              <span>{reviewApplication.city || 'India'}</span>
                            )}
                          </td>
                        </tr>

                        {/* 4. Business Address */}
                        <tr>
                          <td className="py-2.5 px-4 font-semibold text-gray-800">Business Address</td>
                          <td className="py-2.5 px-4">
                            {isSame ? (
                              <span className="inline-flex items-center gap-1 text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md text-[11px] border border-blue-100">
                                <Check size={12} /> Same as Professional
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-md text-[11px] border border-purple-100">
                                • Different / Separate
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-right text-gray-500">
                            {reviewApplication.business_name || 'Individual Studio'}
                          </td>
                        </tr>

                        {/* 5. Documents */}
                        <tr>
                          <td className="py-2.5 px-4 font-semibold text-gray-800">Documents</td>
                          <td className="py-2.5 px-4">
                            {submittedDocCount > 0 ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md text-[11px] border border-emerald-100">
                                <Check size={12} /> {submittedDocCount} of 7 Submitted
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-gray-600 font-semibold bg-gray-100 px-2 py-0.5 rounded-md text-[11px] border border-gray-200">
                                Optional (0 Submitted)
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-right text-gray-500">
                            Optional at registration
                          </td>
                        </tr>

                        {/* 6. Verification Status */}
                        <tr>
                          <td className="py-2.5 px-4 font-semibold text-gray-800">Verification</td>
                          <td className="py-2.5 px-4">
                            {renderStatusBadge(reviewApplication.verification_status)}
                          </td>
                          <td className="py-2.5 px-4 text-right text-gray-500 font-bold">
                            {reviewApplication.verification_status === 'approved' ? 'Wholesale Pricing Active' : 'Pending Verification'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* SECTION 1: Personal & Professional Details */}
                <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-200/70">
                  <h3 className="text-xs font-black uppercase text-[#C2477A] tracking-wider mb-3.5 flex items-center gap-2">
                    <User size={14} />
                    1. Professional Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-gray-400 block text-[11px] font-semibold">Professional Name</span>
                      <span className="font-extrabold text-gray-800 text-sm">
                        {reviewApplication.professional_name || reviewApplication.name || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px] font-semibold">Professional Type / Role</span>
                      <span className="font-extrabold text-gray-800">
                        {ROLE_LABELS[reviewApplication.role] || reviewApplication.role}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px] font-semibold">Phone Number</span>
                      <a
                        href={`tel:${reviewApplication.phone}`}
                        className="font-extrabold text-[#C2477A] hover:underline flex items-center gap-1 text-sm"
                      >
                        <Phone size={12} />
                        {reviewApplication.phone || '—'}
                      </a>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px] font-semibold">Email Address</span>
                      <span className="font-bold text-gray-800">
                        {reviewApplication.email || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px] font-semibold">Experience</span>
                      <span className="font-bold text-gray-800">
                        {reviewApplication.experience ? `${reviewApplication.experience} Years` : 'Not specified'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px] font-semibold">GSTIN</span>
                      <span className="font-mono font-bold text-gray-800">
                        {reviewApplication.gstin || 'Not Provided / Unregistered'}
                      </span>
                    </div>
                    {reviewApplication.website_or_social_link && (
                      <div className="sm:col-span-2">
                        <span className="text-gray-400 block text-[11px] font-semibold">Portfolio / Website Link</span>
                        <a
                          href={reviewApplication.website_or_social_link.startsWith('http') ? reviewApplication.website_or_social_link : `https://${reviewApplication.website_or_social_link}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-[#C2477A] hover:underline flex items-center gap-1.5"
                        >
                          <Globe size={13} />
                          {reviewApplication.website_or_social_link}
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* SECTION 2: Personal / Professional Address */}
                <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-200/70">
                  <div className="flex items-center justify-between mb-3.5">
                    <h3 className="text-xs font-black uppercase text-[#C2477A] tracking-wider flex items-center gap-2">
                      <MapPin size={14} />
                      2. Personal / Professional Address
                    </h3>
                    {profAddressFull && (
                      <a
                        href={getMapUrl(profCoords, profAddressFull)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-[#C2477A] hover:underline flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-pink-200 shadow-2xs"
                      >
                        <Navigation size={12} />
                        Open Map Location
                        <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div className="sm:col-span-2">
                      <span className="text-gray-400 block text-[11px] font-semibold">Street Address</span>
                      <span className="font-medium text-gray-800">
                        {reviewApplication.address || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px] font-semibold">City</span>
                      <span className="font-bold text-gray-800">
                        {reviewApplication.city || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px] font-semibold">State</span>
                      <span className="font-bold text-gray-800">
                        {reviewApplication.state || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px] font-semibold">Pincode</span>
                      <span className="font-bold text-gray-800">
                        {reviewApplication.pincode || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px] font-semibold">Country</span>
                      <span className="font-bold text-gray-800">
                        {reviewApplication.country || 'India'}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-gray-400 block text-[11px] font-semibold">Location / Map Coordinates</span>
                      {profCoords ? (
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                          📍 {profCoords}
                        </span>
                      ) : (
                        <span className="text-gray-500 italic">
                          Manual address entry (No GPS coordinates recorded)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* SECTION 3: Business Address (Same or Different) */}
                <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-200/70">
                  <div className="flex items-center justify-between mb-3.5">
                    <h3 className="text-xs font-black uppercase text-[#C2477A] tracking-wider flex items-center gap-2">
                      <Building2 size={14} />
                      3. Business Address
                    </h3>
                    {isSame ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        <Check size={13} />
                        Business address is same as professional address
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                        • Separate Business Address
                      </span>
                    )}
                  </div>

                  {isSame ? (
                    <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl text-xs space-y-2">
                      <div className="flex items-center gap-2 text-blue-900 font-bold">
                        <CheckCircle2 size={15} className="text-blue-600" />
                        <span>The professional selected "Business address is same as professional/home address".</span>
                      </div>
                      <div className="text-gray-700">
                        <strong>Business / Studio Name:</strong> {reviewApplication.business_name || 'Individual Professional'}
                      </div>
                      <div className="text-gray-600 text-[11.5px]">
                        <strong>Effective Business Address:</strong> {profAddressFull || 'Same as professional address'}
                      </div>
                      {profCoords && (
                        <div className="text-gray-600 text-[11.5px] font-mono">
                          <strong>Location:</strong> {profCoords}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div className="sm:col-span-2">
                        <span className="text-gray-400 block text-[11px] font-semibold">Business / Salon Name</span>
                        <span className="font-extrabold text-gray-800 text-sm">
                          {reviewApplication.business_name || '—'}
                        </span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-gray-400 block text-[11px] font-semibold">Business Address</span>
                        <span className="font-medium text-gray-800">
                          {reviewApplication.business_address || reviewApplication.businessAddress || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[11px] font-semibold">Business City</span>
                        <span className="font-bold text-gray-800">
                          {reviewApplication.business_city || reviewApplication.businessCity || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[11px] font-semibold">Business State</span>
                        <span className="font-bold text-gray-800">
                          {reviewApplication.business_state || reviewApplication.businessState || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[11px] font-semibold">Business Pincode</span>
                        <span className="font-bold text-gray-800">
                          {reviewApplication.business_pincode || reviewApplication.businessPincode || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[11px] font-semibold">Business Country</span>
                        <span className="font-bold text-gray-800">
                          {reviewApplication.business_country || reviewApplication.businessCountry || 'India'}
                        </span>
                      </div>
                      <div className="sm:col-span-4 flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200">
                        <div>
                          <span className="text-gray-400 block text-[11px] font-semibold">Business Location / Map</span>
                          <span className="font-mono text-xs font-bold text-purple-800">
                            {bizCoords ? `📍 ${bizCoords}` : 'Manual business address entry'}
                          </span>
                        </div>
                        {bizAddressFull && (
                          <a
                            href={getMapUrl(bizCoords, bizAddressFull)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] font-bold text-[#C2477A] hover:underline flex items-center gap-1 bg-pink-50 px-2.5 py-1.5 rounded-lg border border-pink-200"
                          >
                            <Navigation size={12} />
                            View on Google Maps
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* SECTION 4: Verification Documents — Optional */}
                <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-200/70">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div>
                      <h3 className="text-xs font-black uppercase text-[#C2477A] tracking-wider flex items-center gap-2">
                        <FileText size={14} />
                        4. Verification Documents (Optional)
                      </h3>
                    </div>
                    <span className="text-[11px] font-bold text-gray-500">
                      Submitted: {submittedDocCount} of 7 slots
                    </span>
                  </div>

                  {/* Informational Callout (User requirement) */}
                  <div className="p-3.5 rounded-xl bg-pink-50/60 border border-pink-100 flex items-start gap-2.5 mb-4 text-xs text-gray-700">
                    <Info size={16} className="text-[#C2477A] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#C2477A]">Documents are optional at registration.</span>
                      <p className="text-[11px] text-gray-600 mt-0.5">
                        Our verification team may request additional documents if required.
                      </p>
                    </div>
                  </div>

                  {/* 7 Standard Document Slots Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                    {STANDARD_DOCUMENT_SLOTS.map((slot) => {
                      const uploadedDoc = findDocForSlot(slot.key, reviewApplication.documents);

                      return (
                        <div
                          key={slot.key}
                          className={`bg-white p-3 rounded-xl border transition-all flex flex-col justify-between ${
                            uploadedDoc ? 'border-emerald-200 shadow-2xs hover:border-emerald-400' : 'border-gray-200'
                          }`}
                        >
                          <div>
                            {/* Card Header */}
                            <div className="flex items-start justify-between gap-1 mb-2">
                              <span className="text-[11px] font-extrabold text-gray-800 block">
                                {slot.label}
                              </span>
                              {uploadedDoc ? (
                                <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                                  ✓ Uploaded
                                </span>
                              ) : (
                                <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 whitespace-nowrap">
                                  Optional
                                </span>
                              )}
                            </div>

                            {/* Thumbnail Preview or Placeholder */}
                            {uploadedDoc ? (
                              <div>
                                {uploadedDoc.file_url ? (
                                  <div
                                    onClick={() => setPreviewImage(uploadedDoc.file_url)}
                                    className="w-full h-28 rounded-lg bg-gray-100 overflow-hidden relative group cursor-pointer border border-gray-100 mb-2"
                                  >
                                    <img
                                      src={uploadedDoc.file_url}
                                      alt={slot.label}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400';
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                                      <Eye size={14} /> Click to enlarge
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-full h-20 rounded-lg bg-emerald-50/50 flex items-center justify-center text-emerald-700 text-xs mb-2 border border-emerald-100">
                                    <FileText size={20} />
                                  </div>
                                )}
                                <div className="text-[11px] font-bold text-gray-800 truncate" title={uploadedDoc.file_name}>
                                  {uploadedDoc.file_name || 'Document File'}
                                </div>
                                <div className="text-[10px] text-gray-400">
                                  Uploaded: {formatDate(uploadedDoc.uploaded_at).split(',')[0]}
                                </div>
                              </div>
                            ) : (
                              <div className="py-4 px-2 text-center bg-gray-50/80 rounded-lg border border-dashed border-gray-200 mb-2">
                                <FileText size={20} className="mx-auto mb-1 text-gray-300" />
                                <span className="text-[10.5px] text-gray-400 block font-medium">Not submitted</span>
                                <span className="text-[9.5px] text-gray-400 block mt-0.5">{slot.hint}</span>
                              </div>
                            )}
                          </div>

                          {/* Footer Action */}
                          <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
                            {uploadedDoc ? (
                              <a
                                href={uploadedDoc.file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="font-bold text-[#C2477A] hover:underline flex items-center gap-1"
                              >
                                <ExternalLink size={11} /> Open full size
                              </a>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openActionModal('request_documents', reviewApplication, slot.key)}
                                className="text-[#C2477A] font-bold hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
                              >
                                + Request this document
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Any extra attachments outside standard 7 slots */}
                  {Array.isArray(reviewApplication.documents) && reviewApplication.documents.some(d => !STANDARD_DOCUMENT_SLOTS.some(s => s.key === d.document_type)) && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <h4 className="text-[11px] font-bold text-gray-700 mb-2">Other Uploaded Attachments:</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {reviewApplication.documents
                          .filter(d => !STANDARD_DOCUMENT_SLOTS.some(s => s.key === d.document_type))
                          .map((doc, idx) => (
                            <div key={doc.id || idx} className="bg-white p-2.5 rounded-xl border border-gray-200 text-xs flex items-center justify-between">
                              <span className="font-bold text-gray-800 truncate">{doc.file_name || doc.document_type}</span>
                              <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-[#C2477A] font-bold text-[10px] ml-2">
                                View
                              </a>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* SECTION 5: Verification History & Audit Trail */}
                <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-200/70">
                  <h3 className="text-xs font-black uppercase text-[#C2477A] tracking-wider mb-3.5 flex items-center gap-2">
                    <Clock size={14} />
                    5. Verification History & Audit Trail
                  </h3>

                  {Array.isArray(reviewApplication.history) && reviewApplication.history.length > 0 ? (
                    <div className="space-y-2.5">
                      {reviewApplication.history.map((h, i) => (
                        <div
                          key={h.id || i}
                          className="bg-white p-3 rounded-xl border border-gray-200 text-xs flex items-start justify-between gap-3"
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="w-6 h-6 rounded-full bg-pink-100 text-[#C2477A] flex items-center justify-center shrink-0 mt-0.5">
                              <Clock size={12} />
                            </div>
                            <div>
                              <div className="font-bold text-gray-800">
                                Action: <span className="uppercase text-[#C2477A]">{h.action || h.new_status}</span>
                              </div>
                              {h.reason && (
                                <div className="text-gray-600 mt-0.5 text-[11px]">
                                  Note: {h.reason}
                                </div>
                              )}
                              <div className="text-[10px] text-gray-400 mt-0.5">
                                By: {h.admin_name || 'Admin'}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] text-gray-400 whitespace-nowrap">
                            {formatDate(h.created_at)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 italic">
                      Initial submission pending review. No prior revision history.
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer - 5 Admin Verification Actions */}
              <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="text-xs text-gray-500">
                  Status: <strong>{(reviewApplication.verification_status || 'submitted').toUpperCase()}</strong>
                  {reviewApplication.b2b_verified && (
                    <span className="ml-2 text-emerald-600 font-bold">• Wholesale Pricing Active</span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap relative">
                  {/* Action 1: Reject */}
                  <button
                    onClick={() => openActionModal('reject', reviewApplication)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <XCircle size={13} />
                    Reject
                  </button>

                  {/* Action 2: Contact (Dropdown: Phone Call, WhatsApp, Email) */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowContactDropdown(prev => !prev)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <PhoneCall size={13} className="text-[#C2477A]" />
                      Contact
                      <ChevronDown size={12} />
                    </button>

                    {showContactDropdown && (
                      <div className="absolute bottom-full right-0 mb-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                        <a
                          href={`tel:${reviewApplication.phone}`}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-pink-50 hover:text-[#C2477A]"
                          onClick={() => setShowContactDropdown(false)}
                        >
                          <Phone size={13} className="text-emerald-600" />
                          Call {reviewApplication.phone}
                        </a>
                        <a
                          href={`https://wa.me/${String(reviewApplication.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${reviewApplication.professional_name || 'there'}, this is Salbeau Professional Verification team regarding your B2B account application.`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-pink-50 hover:text-[#C2477A]"
                          onClick={() => setShowContactDropdown(false)}
                        >
                          <MessageSquare size={13} className="text-emerald-500" />
                          Chat on WhatsApp
                        </a>
                        {reviewApplication.email && (
                          <a
                            href={`mailto:${reviewApplication.email}?subject=${encodeURIComponent('Salbeau B2B Verification Inquiry')}`}
                            className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-pink-50 hover:text-[#C2477A]"
                            onClick={() => setShowContactDropdown(false)}
                          >
                            <Mail size={13} className="text-blue-500" />
                            Send Email
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action 3: Request Information */}
                  <button
                    onClick={() => openActionModal('request_info', reviewApplication)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <HelpCircle size={13} />
                    Request Information
                  </button>

                  {/* Action 4: Request Documents (Checklist Modal) */}
                  <button
                    onClick={() => openActionModal('request_documents', reviewApplication)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText size={13} />
                    Request Documents
                  </button>

                  {/* Suspend Action (if currently approved) */}
                  {reviewApplication.verification_status === 'approved' && (
                    <button
                      onClick={() => openActionModal('suspend', reviewApplication)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gray-800 text-white hover:bg-black transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Ban size={13} />
                      Suspend B2B
                    </button>
                  )}

                  {/* Action 5: Approve */}
                  <button
                    onClick={() => openActionModal('approve', reviewApplication)}
                    className="px-5 py-2 rounded-xl text-xs font-black bg-emerald-600 text-white hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <CheckCircle2 size={14} />
                    Approve
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 6. Action Confirmation & Reason Dialog Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white ${
                    actionModal.type === 'approve'
                      ? 'bg-emerald-600'
                      : actionModal.type === 'reject'
                      ? 'bg-rose-600'
                      : actionModal.type === 'request_documents'
                      ? 'bg-amber-600'
                      : actionModal.type === 'request_info'
                      ? 'bg-blue-600'
                      : 'bg-gray-800'
                  }`}
                >
                  {actionModal.type === 'approve' && <CheckCircle2 size={18} />}
                  {actionModal.type === 'reject' && <XCircle size={18} />}
                  {actionModal.type === 'request_documents' && <FileText size={18} />}
                  {actionModal.type === 'request_info' && <HelpCircle size={18} />}
                  {actionModal.type === 'suspend' && <Ban size={18} />}
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">
                    {actionModal.type === 'approve' && 'Approve B2B Professional Account'}
                    {actionModal.type === 'reject' && 'Reject B2B Application'}
                    {actionModal.type === 'request_documents' && 'Request Documents from B2B User'}
                    {actionModal.type === 'request_info' && 'Request Information / Clarification'}
                    {actionModal.type === 'suspend' && 'Suspend B2B Professional Account'}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Applicant: {actionModal.app.professional_name || actionModal.app.name} ({ROLE_SHORT_TITLES[actionModal.app.role] || actionModal.app.role})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActionModal(null)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Explanatory description banner */}
            <div className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3.5 rounded-xl border border-gray-200">
              {actionModal.type === 'approve' && (
                <p>
                  Approving this application will immediately activate wholesale pricing across all product categories for this user and send a confirmation notification.
                </p>
              )}
              {actionModal.type === 'reject' && (
                <p>
                  Rejecting this application will revoke professional pricing access and display the rejection reason to the customer, allowing them to resubmit if desired.
                </p>
              )}
              {actionModal.type === 'request_documents' && (
                <p>
                  Select the required documents below. The customer will receive a prompt in their mobile notification center and verification screen with upload slots for the selected items.
                </p>
              )}
              {actionModal.type === 'request_info' && (
                <p>
                  Send a clarification query or request additional business information. The user will be notified to update their information.
                </p>
              )}
              {actionModal.type === 'suspend' && (
                <p>
                  Suspending this account immediately revokes professional B2B pricing.
                </p>
              )}
            </div>

            {/* CHECKLIST: Document Selection (for request_documents action) */}
            {actionModal.type === 'request_documents' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-gray-800">
                    Select Required Documents <span className="text-rose-500">*</span>:
                  </label>
                  <span className="text-[10.5px] text-gray-400">
                    {selectedDocsForRequest.length} selected
                  </span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto p-1 bg-gray-50/60 rounded-xl border border-gray-200">
                  {STANDARD_DOCUMENT_SLOTS.map((slot) => {
                    const isSelected = selectedDocsForRequest.includes(slot.key);
                    const isAlreadySubmitted = !!findDocForSlot(slot.key, actionModal.app.documents);

                    return (
                      <div
                        key={slot.key}
                        onClick={() => toggleDocSelection(slot.key)}
                        className={`p-2.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-2xs'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // Handled by div onClick
                            className="w-4 h-4 text-[#C2477A] accent-[#C2477A] rounded cursor-pointer"
                          />
                          <div>
                            <span className="font-bold block">{slot.label}</span>
                            <span className="text-[10px] text-gray-400 block">{slot.hint}</span>
                          </div>
                        </div>

                        {isAlreadySubmitted && (
                          <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                            Already uploaded
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Reason Presets */}
            {actionModal.type !== 'approve' && presetReasons[actionModal.type] && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-700 block">
                  Quick Message Presets:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {presetReasons[actionModal.type].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActionReason(preset)}
                      className="text-[10px] bg-gray-100 hover:bg-pink-50 hover:text-[#C2477A] text-gray-700 px-2 py-1 rounded-lg border border-gray-200 transition-colors text-left cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message / Reason Input */}
            {actionModal.type !== 'approve' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block">
                  {actionModal.type === 'request_documents' ? 'Instructions for Customer' : actionModal.type === 'request_info' ? 'Query / Requested Information' : 'Rejection Reason'} <span className="text-rose-500">*</span>:
                </label>
                <textarea
                  rows={3}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder={actionModal.type === 'request_documents' ? 'e.g. Please upload your GST Certificate and Business Registration Proof to complete verification.' : 'Enter detailed reason or instruction...'}
                  className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:border-[#C2477A] focus:ring-1 focus:ring-[#C2477A]"
                />
              </div>
            )}

            {/* Optional Internal Admin Note */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 block">
                Internal Admin Note (Optional):
              </label>
              <input
                type="text"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="e.g. Verified trade license via phone with owner on 7th Oct"
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:border-[#C2477A]"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingAction}
                onClick={handleConfirmAction}
                className={`px-5 py-2.5 rounded-xl text-xs font-black text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                  actionModal.type === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : actionModal.type === 'reject'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : actionModal.type === 'request_documents'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : actionModal.type === 'request_info'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-900 hover:bg-black'
                }`}
              >
                {isProcessingAction && <RefreshCw size={13} className="animate-spin" />}
                {actionModal.type === 'approve' && 'Confirm Approval'}
                {actionModal.type === 'reject' && 'Confirm Rejection'}
                {actionModal.type === 'request_documents' && 'Send Document Request'}
                {actionModal.type === 'request_info' && 'Send Information Request'}
                {actionModal.type === 'suspend' && 'Confirm Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Image Enlarge Lightbox Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-70 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[90vh] bg-transparent" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewImage}
              alt="Enlarged Document"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-gray-800 flex items-center justify-center shadow-lg font-bold cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
