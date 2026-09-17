import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import {
  ChevronLeft,
  Clock,
  RotateCcw,
  FileText,
  HelpCircle,
  XCircle,
  CheckCircle2,
  AlertOctagon,
  Phone,
  MessageCircle,
  Mail,
  X
} from 'lucide-react';

export const OrderHistoryScreen = () => {
  const {
    orders,
    userProfile,
    requestCancelOrder,
    cancelSpecificOrderItem,
    reorderOrderItems,
    setCurrentScreen,
    consecutiveCancels,
    showCancelWarningModal,
    setShowCancelWarningModal,
    pendingCancelOrderId,
    executeCancelOrder
  } = useApp();

  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);
  const [showSupportModal, setShowSupportModal] = useState(false);

  // Filter orders so each user ONLY sees their own placed orders
  const displayOrders = orders.filter(o =>
    !userProfile ? true : (o.phone === userProfile.phone || o.userName === userProfile.name)
  );

  const getStatusBadge = (status, rejectionReason) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return (
          <span className="bg-emerald-50 text-[#4C8C5C] text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
            <CheckCircle2 size={12} /> Delivered
          </span>
        );
      case 'partially_delivered':
        return (
          <span className="bg-teal-50 text-teal-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-teal-200 flex items-center gap-1">
            <CheckCircle2 size={12} /> Partially Delivered
          </span>
        );
      case 'partially_delivered_rejected':
        return (
          <span className="bg-orange-50 text-orange-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-orange-200 flex items-center gap-1">
            <AlertOctagon size={12} /> Partially Delivered — Item Rejected
          </span>
        );
      case 'partially_delivered_cancelled':
        return (
          <span className="bg-purple-50 text-purple-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-purple-200 flex items-center gap-1">
            <XCircle size={12} /> Partially Delivered — Remaining Cancelled
          </span>
        );
      case 'preparing':
      case 'processing':
        return (
          <span className="bg-[#FCE4EC] text-[#C2477A] text-[10px] font-bold px-2.5 py-1 rounded-full border border-[#F5A8C0]">
            Preparing at Branch
          </span>
        );
      case 'rejected':
        return (
          <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-rose-200 flex items-center gap-1">
            <XCircle size={12} /> Rejected by Store
          </span>
        );
      case 'cancelled':
        return (
          <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2.5 py-1 rounded-full border border-gray-200">
            Cancelled
          </span>
        );
      case 'placed':
      default:
        return (
          <span className="bg-[#FCE4EC] text-[#C2477A] text-[10px] font-bold px-2.5 py-1 rounded-full border border-[#F5A8C0]">
            Placed (Pending Store)
          </span>
        );
    }
  };

  const getItemStatusBadge = (status) => {
    const s = (status || 'processing').toLowerCase();
    if (s === 'delivered' || s === 'completed') {
      return (
        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 shadow-2xs">
          <CheckCircle2 size={11} className="text-emerald-600" /> Delivered
        </span>
      );
    }
    if (s === 'rejected') {
      return (
        <span className="bg-rose-50 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-200 flex items-center gap-1 shadow-2xs">
          <XCircle size={11} className="text-rose-600" /> Rejected by Store
        </span>
      );
    }
    if (s === 'cancelled') {
      return (
        <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-200 flex items-center gap-1 shadow-2xs">
          <XCircle size={11} className="text-gray-400" /> Cancelled
        </span>
      );
    }
    return (
      <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1 shadow-2xs">
        <Clock size={11} className="text-amber-600" /> Processing
      </span>
    );
  };

  return (
    <div className="pb-28 min-h-screen bg-[#FFF8FA] animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-[#FCE4EC] flex items-center justify-between">
        <button
          onClick={() => setCurrentScreen('home')}
          className="flex items-center gap-1 text-xs font-bold text-[#C2477A]"
        >
          <ChevronLeft size={18} /> Home
        </button>
        <h1 className="text-sm font-extrabold text-[#3A2430] uppercase tracking-wider">
          My Order History
        </h1>
        <button
          onClick={() => setShowSupportModal(true)}
          className="text-[#C2477A] font-bold text-xs flex items-center gap-1"
        >
          <HelpCircle size={16} /> Help
        </button>
      </div>

      <div className="p-4 space-y-4">
        {orders.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-[#FCE4EC]">
            <p className="text-xs text-[#8C7078] font-medium">No order history found.</p>
            <button
              onClick={() => setCurrentScreen('home')}
              className="mt-3 bg-[#C2477A] text-white text-xs font-bold px-4 py-2 rounded-xl"
            >
              Browse Products
            </button>
          </div>
        ) : (
          orders.map((order) => {
            const orderTime = new Date(order.date || order.placedAt).getTime();
            const elapsedMs = Date.now() - orderTime;
            const isWithinGraceWindow = !isNaN(orderTime) && elapsedMs <= 15 * 60 * 1000;
            const isEditable = (order.status === 'placed' || order.status === 'processing') && isWithinGraceWindow;

            return (
              <div key={order.id} className="bg-white rounded-2xl border border-[#FCE4EC] p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#FCE4EC]">
                  <div>
                    <span className="text-xs font-extrabold text-[#C2477A] block">{order.id}</span>
                    <span className="text-[10px] text-[#8C7078] font-medium">
                      {new Date(order.date || order.placedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {getStatusBadge(order.status, order.rejectionReason)}
                </div>

                {/* Feature 4: Store Rejection Notice */}
                {order.status === 'rejected' && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2">
                    <AlertOctagon size={16} className="text-rose-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-[11px]">Store Rejection Reason:</span>
                      <span className="text-[11px] opacity-90">{order.rejectionReason || 'Item temporarily unavailable at branch.'}</span>
                    </div>
                  </div>
                )}

                {/* Items List with Per-Item Status Badges */}
                <div className="space-y-2 text-xs text-[#3A2430]">
                  {order.items.map((item, idx) => {
                    const itemStatus = item.status || order.status || 'placed';
                    const canCancelItem = (itemStatus === 'placed' || itemStatus === 'processing') && isWithinGraceWindow;

                    return (
                      <div key={idx} className="p-2.5 bg-[#FFF8FA] rounded-xl border border-[#FCE4EC] flex items-center justify-between gap-2 shadow-2xs">
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          {item.product?.image ? (
                            <img
                              src={item.product.image}
                              alt={item.product?.name || 'Product'}
                              className="w-10 h-10 object-cover rounded-lg border border-[#FCE4EC] flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-[#FCE4EC]/50 border border-[#FCE4EC] flex items-center justify-center text-[#C2477A] font-bold text-xs flex-shrink-0">
                              {item.quantity}x
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-[11px] text-[#3A2430] block truncate">
                              {item.quantity}x {item.product?.name || 'Beauty Product'}
                            </span>
                            <span className="font-extrabold text-[11px] text-[#C2477A]">₹{(item.unitPrice || item.price || 0) * item.quantity}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          {getItemStatusBadge(itemStatus)}
                          {canCancelItem && (
                            <button
                              onClick={() => cancelSpecificOrderItem(order.id, idx)}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold px-2 py-0.5 rounded border border-rose-200 text-[9px]"
                            >
                              Cancel Item
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-[#FCE4EC] flex justify-between items-center text-xs">
                  <span className="text-[#8C7078] font-medium">Total Bill: <strong className="text-[#3A2430] text-sm">₹{order.totalAmount}</strong></span>
                  <span className="text-[10px] font-semibold text-[#8C7078] bg-[#FFF8FA] px-2 py-0.5 rounded border border-[#FCE4EC]">
                    {order.branch}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {/* Feature 8: Receipt View */}
                  <button
                    onClick={() => setSelectedReceiptOrder(order)}
                    className="flex-1 bg-[#FFF8FA] hover:bg-[#FCE4EC] text-[#3A2430] py-2 rounded-xl text-xs font-bold border border-[#FCE4EC] flex items-center justify-center gap-1.5"
                  >
                    <FileText size={14} className="text-[#C2477A]" />
                    <span>Receipt / Invoice</span>
                  </button>

                  {/* Feature 6: Reorder Action */}
                  {reorderOrderItems && (
                    <button
                      onClick={() => reorderOrderItems(order)}
                      className="flex-1 bg-[#FCE4EC] hover:bg-[#F5A8C0] text-[#C2477A] py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw size={14} />
                      <span>Reorder</span>
                    </button>
                  )}

                  {/* Cancel Entire Order Button (if in Grace Window) */}
                  {isEditable && (
                    <button
                      onClick={() => requestCancelOrder(order.id)}
                      className="w-full mt-1 bg-rose-50 text-rose-600 hover:bg-rose-100 py-2 rounded-xl text-xs font-bold border border-rose-200"
                    >
                      Cancel Entire Order (15m Grace Window)
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Feature 8: Invoice / Receipt Modal */}
      {selectedReceiptOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#FCE4EC] shadow-2xl w-full max-w-sm p-6 relative overflow-hidden text-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#FCE4EC]">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-[#C2477A]" />
                <div>
                  <h3 className="font-extrabold text-sm text-[#3A2430]">Official Store Receipt</h3>
                  <span className="text-[10px] text-[#8C7078]">{selectedReceiptOrder.id}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedReceiptOrder(null)}
                className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-[#FFF8FA] rounded-xl border border-[#FCE4EC] space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#8C7078]">Store Branch:</span>
                  <span className="font-bold text-[#3A2430]">{selectedReceiptOrder.branch}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8C7078]">Date & Time:</span>
                  <span className="font-medium text-[#3A2430]">
                    {new Date(selectedReceiptOrder.date || selectedReceiptOrder.placedAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8C7078]">Overall Status:</span>
                  <span className="font-bold uppercase text-[#C2477A]">{selectedReceiptOrder.status}</span>
                </div>
              </div>

              <div className="border border-[#FCE4EC] rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead className="bg-[#FCE4EC] text-[#C2477A] font-bold uppercase">
                    <tr>
                      <th className="p-2">Item</th>
                      <th className="p-2 text-center">Status</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#FCE4EC]/60">
                    {selectedReceiptOrder.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-medium text-[#3A2430]">{it.product?.name}</td>
                        <td className="p-2 flex justify-center">
                          {getItemStatusBadge(it.status || selectedReceiptOrder.status)}
                        </td>
                        <td className="p-2 text-center font-bold">{it.quantity}</td>
                        <td className="p-2 text-right font-bold text-[#C2477A]">₹{(it.unitPrice || it.price || 0) * it.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-2 border-t border-[#FCE4EC] flex justify-between items-center text-sm font-extrabold text-[#3A2430]">
                <span>Grand Total</span>
                <span className="text-[#C2477A]">₹{selectedReceiptOrder.totalAmount}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedReceiptOrder(null)}
              className="w-full mt-5 bg-[#C2477A] text-white py-3 rounded-xl font-bold text-xs"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}

      {/* Feature 9: Contact Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#FCE4EC] shadow-2xl w-full max-w-sm p-6 relative overflow-hidden text-xs text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#FCE4EC] text-[#C2477A] flex items-center justify-center font-bold mx-auto mb-3">
              <HelpCircle size={24} />
            </div>

            <h3 className="font-extrabold text-base text-[#3A2430]">Salbeau Store Support</h3>
            <p className="text-xs text-[#8C7078] mt-1 mb-5">
              Need assistance with your order, verification, or branch collection?
            </p>

            <div className="space-y-2.5 text-left">
              <a
                href="tel:+918007252328"
                className="p-3 bg-[#FFF8FA] hover:bg-[#FCE4EC] rounded-xl border border-[#FCE4EC] flex items-center gap-3 font-bold text-[#3A2430]"
              >
                <Phone size={18} className="text-[#C2477A]" />
                <div>
                  <span className="block text-xs">Call Customer Desk</span>
                  <span className="text-[10px] text-[#8C7078] font-normal">+91 800 725 2328 (Toll Free)</span>
                </div>
              </a>

              <a
                href="https://wa.me/919876543210"
                target="_blank"
                rel="noreferrer"
                className="p-3 bg-[#FFF8FA] hover:bg-[#FCE4EC] rounded-xl border border-[#FCE4EC] flex items-center gap-3 font-bold text-[#3A2430]"
              >
                <MessageCircle size={18} className="text-emerald-600" />
                <div>
                  <span className="block text-xs">WhatsApp Branch Helpdesk</span>
                  <span className="text-[10px] text-[#8C7078] font-normal">+91 98765 43210 (Instant Chat)</span>
                </div>
              </a>

              <a
                href="mailto:support@salbeau.com"
                className="p-3 bg-[#FFF8FA] hover:bg-[#FCE4EC] rounded-xl border border-[#FCE4EC] flex items-center gap-3 font-bold text-[#3A2430]"
              >
                <Mail size={18} className="text-[#C2477A]" />
                <div>
                  <span className="block text-xs">Email Salbeau Support</span>
                  <span className="text-[10px] text-[#8C7078] font-normal">support@salbeau.com</span>
                </div>
              </a>
            </div>

            <button
              onClick={() => setShowSupportModal(false)}
              className="w-full mt-5 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-xs"
            >
              Close Helpdesk
            </button>
          </div>
        </div>
      )}

      {/* Cancellation Warning Modal */}
      {showCancelWarningModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#FCE4EC] shadow-2xl w-full max-w-sm p-6 relative overflow-hidden text-center text-xs">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold mx-auto mb-3">
              <AlertOctagon size={24} />
            </div>

            <h3 className="font-extrabold text-base text-[#3A2430]">Cancellation Limit Warning</h3>
            <p className="text-xs text-[#8C7078] mt-1 mb-5">
              You have cancelled 3 consecutive orders. Future late cancellations will incur a late cancellation fee on store settlement.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelWarningModal(false)}
                className="w-1/2 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold"
              >
                Keep Order
              </button>
              <button
                onClick={() => executeCancelOrder(pendingCancelOrderId)}
                className="w-1/2 bg-rose-600 text-white py-3 rounded-xl font-bold"
              >
                Proceed Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
