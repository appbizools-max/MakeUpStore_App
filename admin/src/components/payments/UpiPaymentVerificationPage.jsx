import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  AlertTriangle,
  Search,
  Filter,
  ZoomIn,
  X,
  Building,
  User,
  ShieldCheck,
  CreditCard,
  Phone,
  Calendar,
  FileText,
  DollarSign,
  Loader2,
  Check,
  Ban,
  ArrowUpDown
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { canVerifyUpi, canApproveUpi, canRejectUpi } from '../../utils/permissionEngine';

export default function UpiPaymentVerificationPage() {
  const {
    upiVerifications = [],
    orders = [],
    branches = [],
    currentAuthUser,
    approveUpiPayment,
    rejectUpiPayment,
    refreshUpiVerifications
  } = useAdmin();

  // Search and Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING_VERIFICATION'); // 'all' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED'
  const [selectedBranch, setSelectedBranch] = useState('all');

  // Inspection & Action Modals
  const [zoomedProofUrl, setZoomedProofUrl] = useState(null);
  const [actionRecord, setActionRecord] = useState(null); // record being approved or rejected
  const [actionType, setActionType] = useState(null); // 'approve' | 'reject'
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Check user permissions
  const isAuthorizedToVerify = useMemo(() => {
    return canVerifyUpi(currentAuthUser);
  }, [currentAuthUser]);

  const isAuthorizedToApprove = useMemo(() => {
    return canApproveUpi(currentAuthUser);
  }, [currentAuthUser]);

  const isAuthorizedToReject = useMemo(() => {
    return canRejectUpi(currentAuthUser);
  }, [currentAuthUser]);

  // Combined List: from upiVerifications state, enriched with orders where shipments has UPI proof
  const allVerificationRecords = useMemo(() => {
    const listMap = new Map();

    // 1. Direct upiVerifications from Supabase
    (upiVerifications || []).forEach(v => {
      listMap.set(v.id || v.order_id, {
        id: v.id || `upi_${v.order_id}`,
        orderId: v.order_id || v.orderId,
        customerId: v.customer_id || v.customerId,
        customerName: v.customer_name || v.customerName || 'Customer',
        deliveryPartnerId: v.delivery_partner_id || v.deliveryPartnerId,
        deliveryPartnerName: v.delivery_partner_name || v.deliveryPartnerName || 'Assigned Partner',
        branchId: v.branch_id || v.branchId,
        branchName: v.branch_name || v.branchName || 'Store Branch',
        expectedAmount: Number(v.expected_amount || v.expectedAmount || 0),
        reportedAmount: Number(v.reported_amount || v.reportedAmount || 0),
        upiTransactionId: v.upi_transaction_id || v.upiTransactionId || 'N/A',
        paymentProofUrl: v.payment_proof_url || v.paymentProofUrl || '',
        submissionDate: v.submission_date || v.submissionDate || v.created_at,
        verificationStatus: (v.verification_status || v.verificationStatus || 'PENDING_VERIFICATION').toUpperCase(),
        verifiedBy: v.verified_by || v.verifiedBy,
        verifiedByName: v.verified_by_name || v.verifiedByName,
        verifiedAt: v.verified_at || v.verifiedAt,
        previousStatus: v.previous_status || v.previousStatus,
        rejectionReason: v.rejection_reason || v.rejectionReason,
        notes: v.notes
      });
    });

    // 2. Scan orders where payment is UPI or shipments contain UPI / UTR collection
    (orders || []).forEach(o => {
      const ship = (o.shipments && typeof o.shipments === 'object' && !Array.isArray(o.shipments)) ? o.shipments : {};
      const upi = (ship.upiVerification && typeof ship.upiVerification === 'object') ? ship.upiVerification : {};

      const isUpi = 
        String(o.payment_method || o.paymentMethod || '').toLowerCase() === 'upi' ||
        String(ship.paymentMethod || ship.payment_method || '').toLowerCase() === 'upi' ||
        Boolean(ship.upiUtr) ||
        Boolean(o.upi_ref) ||
        Boolean(o.upiUtr) ||
        Boolean(upi.utr || upi.upiTransactionId || upi.proofUrl || upi.payment_proof_url) ||
        Boolean(o.payment_proof || ship.paymentProofUrl || o.paymentProofUrl);

      if (isUpi) {
        const key = upi.id || `upi_${o.id}`;
        if (!listMap.has(key)) {
          const rawStatus = String(
            upi.verificationStatus ||
            ship.verificationStatus ||
            ship.paymentStatus ||
            o.verification_status ||
            o.verificationStatus ||
            o.payment_status ||
            o.paymentStatus ||
            'PENDING_VERIFICATION'
          ).toUpperCase().trim();

          const normalizedStatus = (rawStatus === 'PENDING' || rawStatus === 'PENDING_VERIFICATION' || rawStatus === 'PENDING_PROOF' || rawStatus === 'UNPAID')
            ? 'PENDING_VERIFICATION'
            : (rawStatus === 'VERIFIED' || rawStatus === 'PAID' || rawStatus === 'COMPLETED')
            ? 'VERIFIED'
            : (rawStatus === 'REJECTED' || rawStatus === 'FAILED')
            ? 'REJECTED'
            : rawStatus;

          const utr = ship.upiUtr || o.upi_ref || o.upiUtr || upi.upiTransactionId || upi.utr || 'N/A';
          const proofUrl = upi.proofUrl || upi.payment_proof_url || ship.paymentProofUrl || o.payment_proof || o.paymentProofUrl || '';

          listMap.set(key, {
            id: key,
            orderId: o.id,
            customerId: o.user_id || o.userId,
            customerName: o.user_name || o.userName || 'Customer',
            customerPhone: o.phone || '',
            deliveryPartnerId: o.assigned_employee_id || o.assignedEmployeeId || ship.assignedEmployeeId || ship.collectedById,
            deliveryPartnerName: o.assigned_employee_name || o.assignedEmployeeName || ship.assignedEmployeeName || ship.collectedBy || 'Store Direct / Customer UPI',
            deliveryPartnerPhone: ship.deliveryPartnerPhone || '',
            branchId: o.branch,
            branchName: o.branch || 'Main Branch',
            expectedAmount: Number(o.total_amount || o.totalAmount || upi.expectedAmount || 0),
            reportedAmount: Number(ship.paymentAmount || upi.reportedAmount || upi.amount || o.total_amount || o.totalAmount || 0),
            upiTransactionId: utr,
            paymentProofUrl: proofUrl,
            submissionDate: ship.collectedAt || ship.deliveredAt || upi.submissionDate || upi.submittedAt || o.placed_at || o.placedAt || o.created_at || o.date,
            verificationStatus: normalizedStatus,
            verifiedBy: upi.verifiedBy || ship.verifiedBy,
            verifiedByName: upi.verifiedByName || ship.verifiedByName,
            verifiedAt: upi.verifiedAt || ship.verifiedAt,
            previousStatus: upi.previousStatus,
            rejectionReason: upi.rejectionReason || ship.paymentRejectionReason,
            notes: upi.notes || ship.deliveryNotes
          });
        }
      }
    });

    return Array.from(listMap.values()).sort((a, b) => new Date(b.submissionDate || 0) - new Date(a.submissionDate || 0));
  }, [upiVerifications, orders]);

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return allVerificationRecords.filter(rec => {
      // Search
      const search = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        (rec.orderId && rec.orderId.toLowerCase().includes(search)) ||
        (rec.customerName && rec.customerName.toLowerCase().includes(search)) ||
        (rec.deliveryPartnerName && rec.deliveryPartnerName.toLowerCase().includes(search)) ||
        (rec.upiTransactionId && rec.upiTransactionId.toLowerCase().includes(search));

      // Status
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'PENDING_VERIFICATION'
          ? (rec.verificationStatus === 'PENDING_VERIFICATION' || rec.verificationStatus === 'PENDING')
          : rec.verificationStatus === statusFilter);

      // Branch
      const matchBranch =
        selectedBranch === 'all' ||
        (rec.branchName && rec.branchName.toLowerCase().includes(selectedBranch.toLowerCase()));

      return matchSearch && matchStatus && matchBranch;
    });
  }, [allVerificationRecords, searchTerm, statusFilter, selectedBranch]);

  // Counts
  const counts = useMemo(() => {
    return {
      all: allVerificationRecords.length,
      pending: allVerificationRecords.filter(r => r.verificationStatus === 'PENDING_VERIFICATION' || r.verificationStatus === 'PENDING').length,
      verified: allVerificationRecords.filter(r => r.verificationStatus === 'VERIFIED' || r.verificationStatus === 'PAID').length,
      rejected: allVerificationRecords.filter(r => r.verificationStatus === 'REJECTED').length
    };
  }, [allVerificationRecords]);

  // Open Approve Confirmation Modal
  const handleOpenApprove = (rec) => {
    setActionRecord(rec);
    setActionType('approve');
    setActionNotes('');
    setActionError('');
    setActionSuccess('');
  };

  // Open Reject Modal
  const handleOpenReject = (rec) => {
    setActionRecord(rec);
    setActionType('reject');
    setRejectionReason('');
    setActionNotes('');
    setActionError('');
    setActionSuccess('');
  };

  // Submit Approval
  const handleConfirmApproval = async () => {
    if (!actionRecord) return;
    setIsProcessing(true);
    setActionError('');

    try {
      const res = await approveUpiPayment({
        id: actionRecord.id,
        orderId: actionRecord.orderId,
        previousStatus: actionRecord.verificationStatus,
        notes: actionNotes,
        verifiedBy: currentAuthUser?.id || 'admin',
        verifiedByName: currentAuthUser?.fullName || currentAuthUser?.name || 'Administrator'
      });

      if (res.success) {
        setActionSuccess(`Payment for Order #${actionRecord.orderId} verified successfully.`);
        setTimeout(() => {
          setActionRecord(null);
          setActionType(null);
          setActionSuccess('');
        }, 1200);
      } else {
        setActionError(res.error || 'Failed to approve payment.');
      }
    } catch (err) {
      setActionError(err.message || 'An error occurred.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Submit Rejection
  const handleConfirmRejection = async () => {
    if (!actionRecord) return;
    if (!rejectionReason.trim()) {
      setActionError('A clear rejection reason is mandatory.');
      return;
    }

    setIsProcessing(true);
    setActionError('');

    try {
      const res = await rejectUpiPayment({
        id: actionRecord.id,
        orderId: actionRecord.orderId,
        previousStatus: actionRecord.verificationStatus,
        rejectionReason: rejectionReason.trim(),
        notes: actionNotes,
        verifiedBy: currentAuthUser?.id || 'admin',
        verifiedByName: currentAuthUser?.fullName || currentAuthUser?.name || 'Administrator'
      });

      if (res.success) {
        setActionSuccess(`Payment for Order #${actionRecord.orderId} marked as REJECTED.`);
        setTimeout(() => {
          setActionRecord(null);
          setActionType(null);
          setActionSuccess('');
        }, 1200);
      } else {
        setActionError(res.error || 'Failed to reject payment.');
      }
    } catch (err) {
      setActionError(err.message || 'An error occurred.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">UPI Payment Verification</h1>
              <p className="text-xs text-gray-500 font-medium">
                Admin Panel → Payments → Verify customer UPI transfers against delivery partner captured proof
              </p>
            </div>
          </div>
        </div>

        {/* Quick status tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('PENDING_VERIFICATION')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'PENDING_VERIFICATION'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Clock size={13} />
            <span>Awaiting Verification ({counts.pending})</span>
          </button>
          <button
            onClick={() => setStatusFilter('VERIFIED')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'VERIFIED'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <CheckCircle2 size={13} />
            <span>Verified ({counts.verified})</span>
          </button>
          <button
            onClick={() => setStatusFilter('REJECTED')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'REJECTED'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <XCircle size={13} />
            <span>Rejected ({counts.rejected})</span>
          </button>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All ({counts.all})
          </button>
        </div>
      </div>

      {/* Permission Notice */}
      {!isAuthorizedToVerify && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-xs text-amber-900">
          <AlertTriangle size={18} className="text-amber-600 shrink-0" />
          <span>
            You have read-only access to this page. You need the <strong>Verify UPI Payments</strong> permission to approve or reject customer transactions.
          </span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by Order ID, Customer, Rider, or UTR..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#D81B60] focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Branch Filter */}
          <select
            value={selectedBranch}
            onChange={e => setSelectedBranch(e.target.value)}
            className="px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:border-[#D81B60]"
          >
            <option value="all">All Branches</option>
            {branches.map(b => (
              <option key={b.id || b.code} value={b.name}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Verification Records Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <CreditCard size={28} />
            </div>
            <h3 className="text-sm font-bold text-gray-800 mb-1">No Payment Verification Records</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {allVerificationRecords.length === 0
                ? 'No UPI payment proofs have been submitted yet. When a delivery partner verifies a customer UPI payment, the record will appear here.'
                : 'No records match your selected filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/90 text-gray-500 font-extrabold uppercase text-[10.5px] border-b border-gray-200 tracking-wider">
                  <th className="py-3.5 px-4">Order ID & Status</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Delivery Partner & Branch</th>
                  <th className="py-3.5 px-4">Expected vs Reported Amount</th>
                  <th className="py-3.5 px-4">Proof Receipt</th>
                  <th className="py-3.5 px-4">UPI Reference (UTR)</th>
                  <th className="py-3.5 px-4">Submission Date</th>
                  <th className="py-3.5 px-4 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRecords.map(rec => {
                  const isVerified = rec.verificationStatus === 'VERIFIED';
                  const isRejected = rec.verificationStatus === 'REJECTED';
                  const isPending = !isVerified && !isRejected;

                  // Amount discrepancy alert
                  const hasDiscrepancy = Math.abs(rec.expectedAmount - rec.reportedAmount) > 0.01;

                  return (
                    <tr key={rec.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Order ID & Status */}
                      <td className="py-3 px-4 font-bold text-gray-900">
                        <div className="font-extrabold text-[#D81B60] text-xs">#{rec.orderId}</div>
                        <div className="mt-1">
                          {isPending && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock size={10} /> Awaiting Verification
                            </span>
                          )}
                          {isVerified && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={10} /> Verified
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle size={10} /> Rejected
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">{rec.customerName}</div>
                        {rec.customerId && (
                          <div className="text-[10px] text-gray-400 font-medium">ID: {rec.customerId}</div>
                        )}
                      </td>

                      {/* Delivery Partner & Branch */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-800 flex items-center gap-1">
                          <User size={12} className="text-[#D81B60]" />
                          <span>{rec.deliveryPartnerName}</span>
                        </div>
                        <div className="text-[11px] text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                          <Building size={11} className="text-gray-400" />
                          <span>{rec.branchName}</span>
                        </div>
                      </td>

                      {/* Expected vs Reported Amount */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase font-black block">Expected</span>
                            <span className="font-black text-xs text-gray-900">₹{rec.expectedAmount.toFixed(2)}</span>
                          </div>
                          <span className="text-gray-300 font-bold">→</span>
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase font-black block">Reported</span>
                            <span className={`font-black text-xs ${hasDiscrepancy ? 'text-rose-600 font-black' : 'text-emerald-700'}`}>
                              ₹{rec.reportedAmount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        {hasDiscrepancy && (
                          <span className="inline-block mt-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            Discrepancy: ₹{(rec.reportedAmount - rec.expectedAmount).toFixed(2)}
                          </span>
                        )}
                      </td>

                      {/* Proof Receipt Photo */}
                      <td className="py-3 px-4">
                        {rec.paymentProofUrl ? (
                          <button
                            onClick={() => setZoomedProofUrl(rec.paymentProofUrl)}
                            className="group relative inline-block cursor-pointer"
                            title="Click to Zoom and Inspect Proof Receipt"
                          >
                            <img
                              src={rec.paymentProofUrl}
                              alt="Payment Proof"
                              className="w-12 h-12 object-cover rounded-xl border border-gray-200 shadow-xs group-hover:scale-105 transition-all"
                            />
                            <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                              <ZoomIn size={14} />
                            </div>
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs italic">No image</span>
                        )}
                      </td>

                      {/* UPI Reference (UTR) */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-gray-800 text-[11px] bg-gray-50 px-2 py-1 rounded-lg border border-gray-200 inline-block">
                          {rec.upiTransactionId || 'N/A'}
                        </div>
                      </td>

                      {/* Submission Date */}
                      <td className="py-3 px-4 text-gray-600 text-[11px]">
                        <div>{new Date(rec.submissionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                        <div className="text-[10px] text-gray-400">{new Date(rec.submissionDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                        {rec.verifiedByName && (
                          <div className="text-[10px] text-gray-500 font-semibold mt-1">
                            By: {rec.verifiedByName}
                          </div>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              disabled={!isAuthorizedToApprove}
                              onClick={() => handleOpenApprove(rec)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Check size={12} />
                              <span>Approve</span>
                            </button>
                            <button
                              disabled={!isAuthorizedToReject}
                              onClick={() => handleOpenReject(rec)}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Ban size={12} />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <div className="text-right">
                            {isVerified && (
                              <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 inline-block">
                                Approved
                              </span>
                            )}
                            {isRejected && (
                              <div className="text-right">
                                <span className="text-[11px] font-black text-rose-700 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200 inline-block">
                                  Rejected
                                </span>
                                {rec.rejectionReason && (
                                  <div className="text-[10px] text-rose-600 font-medium max-w-[140px] truncate mt-0.5 ml-auto" title={rec.rejectionReason}>
                                    Reason: {rec.rejectionReason}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Proof Image Fullscreen Zoom Modal */}
      {zoomedProofUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setZoomedProofUrl(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] bg-white rounded-3xl p-3 shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 px-3 pt-2 border-b border-gray-100">
              <span className="text-xs font-black text-gray-800 uppercase tracking-wider">
                Customer Payment Proof Receipt — Inspection View
              </span>
              <button
                onClick={() => setZoomedProofUrl(null)}
                className="text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-3 flex items-center justify-center overflow-auto max-h-[75vh]">
              <img
                src={zoomedProofUrl}
                alt="Enlarged Proof"
                className="max-h-[70vh] w-auto object-contain rounded-xl shadow-inner border border-gray-100"
              />
            </div>
            <div className="px-3 pb-2 text-center text-xs text-gray-400 font-medium">
              Verify transaction amount, reference number, and date stamp before confirming payment approval.
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {actionRecord && actionType === 'approve' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <CheckCircle2 size={18} />
                </div>
                <h3 className="text-base font-black text-gray-900">Approve UPI Payment</h3>
              </div>
              <button
                onClick={() => setActionRecord(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold mb-3">
                {actionError}
              </div>
            )}
            {actionSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}

            <div className="space-y-3 text-xs mb-5">
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 space-y-2">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-gray-500">Order ID:</span>
                  <span className="text-[#D81B60]">#{actionRecord.orderId}</span>
                </div>
                <div className="flex items-center justify-between font-bold">
                  <span className="text-gray-500">Customer:</span>
                  <span className="text-gray-800">{actionRecord.customerName}</span>
                </div>
                <div className="flex items-center justify-between font-bold">
                  <span className="text-gray-500">Verified Amount:</span>
                  <span className="text-emerald-700 text-sm font-black">₹{actionRecord.reportedAmount.toFixed(2)}</span>
                </div>
                {actionRecord.upiTransactionId && (
                  <div className="flex items-center justify-between font-bold font-mono">
                    <span className="text-gray-500 font-sans">UTR / Ref:</span>
                    <span className="text-gray-800">{actionRecord.upiTransactionId}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Audit Notes (Optional)</label>
                <input
                  type="text"
                  value={actionNotes}
                  onChange={e => setActionNotes(e.target.value)}
                  placeholder="e.g. Verified via Bank Statement / Razorpay"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 outline-none focus:border-[#D81B60]"
                />
              </div>

              <p className="text-[11px] text-gray-500 leading-relaxed">
                Confirming this payment will immediately update the customer order status to <strong>VERIFIED</strong> and send a real-time notification to the customer app.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setActionRecord(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmApproval}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Confirm Approval</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {actionRecord && actionType === 'reject' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <XCircle size={18} />
                </div>
                <h3 className="text-base font-black text-gray-900">Reject Payment Proof</h3>
              </div>
              <button
                onClick={() => setActionRecord(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold mb-3">
                {actionError}
              </div>
            )}
            {actionSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}

            <div className="space-y-3.5 text-xs mb-5">
              <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-100 space-y-1 text-rose-900">
                <div className="font-bold">Order #{actionRecord.orderId} • ₹{actionRecord.expectedAmount.toFixed(2)}</div>
                <div className="text-[11px] text-rose-700 font-medium">
                  Rider: {actionRecord.deliveryPartnerName}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Mandatory Rejection Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="e.g. Transaction receipt is blurry / Amount does not match bank credits / Invalid UTR reference"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 outline-none focus:border-[#D81B60]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Internal Note (Optional)</label>
                <input
                  type="text"
                  value={actionNotes}
                  onChange={e => setActionNotes(e.target.value)}
                  placeholder="Additional audit note"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 outline-none focus:border-[#D81B60]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setActionRecord(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmRejection}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Rejecting...</span>
                  </>
                ) : (
                  <>
                    <Ban size={14} />
                    <span>Confirm Rejection</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

