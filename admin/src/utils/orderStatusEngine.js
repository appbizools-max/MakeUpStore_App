/**
 * SALBEAU MAKEUPSTORE — ORDER STATUS & LIFECYCLE ENGINE
 * 
 * Provides pure state calculation functions and status metadata definitions
 * for multi-item fulfillment, partial fulfillment, and lifecycle state transitions.
 */

export const STATUS_META = {
  placed: {
    title: 'Order Placed',
    message: 'Your order has been received and queued for store acceptance.',
    adminLabel: 'Order Placed'
  },
  confirmed: {
    title: 'Order Confirmed',
    message: 'Store has verified and accepted your order.',
    adminLabel: 'Confirmed'
  },
  processing: {
    title: 'Processing Order',
    message: 'Store team is gathering and verifying your items.',
    adminLabel: 'Processing'
  },
  packing: {
    title: 'Packed & Sealed',
    message: 'Order items packed securely with quality seal.',
    adminLabel: 'Packed & Sealed'
  },
  ready_to_dispatch: {
    title: 'Ready for Dispatch',
    message: 'Package staged for courier pickup.',
    adminLabel: 'Ready for Dispatch'
  },
  out_for_delivery: {
    title: 'Out for Delivery',
    message: 'Delivery partner / rider is en route to customer.',
    adminLabel: 'Out for Delivery'
  },
  delivered: {
    title: 'Delivered',
    message: 'Order delivered successfully to customer.',
    adminLabel: 'Delivered'
  },
  completed: {
    title: 'Completed',
    message: 'Order successfully completed.',
    adminLabel: 'Completed'
  },
  partially_delivered: {
    title: 'Partially Delivered',
    message: 'Some items delivered. Remaining items arriving separately.',
    adminLabel: 'Partially Delivered'
  },
  partially_delivered_rejected: {
    title: 'Partially Delivered',
    message: 'Delivered available items. Remaining items unable to be fulfilled.',
    adminLabel: 'Partially Delivered (Unavailable Items)'
  },
  partially_delivered_cancelled: {
    title: 'Partially Delivered',
    message: 'Delivered available items. Remaining items cancelled.',
    adminLabel: 'Partially Delivered (Cancelled Items)'
  },
  cancelled: {
    title: 'Order Cancelled',
    message: 'Order cancelled.',
    adminLabel: 'Cancelled'
  },
  rejected: {
    title: 'Store Rejection',
    message: 'We were unable to fulfill this order.',
    adminLabel: 'Store Rejected'
  }
};

/**
 * Computes the unified parent order status from an array of child item line statuses.
 * Respects partial fulfillment, rejected items, and active processing states.
 */
export const computeOverallOrderStatus = (items, currentOrderStatus = 'placed') => {
  if (!items || items.length === 0) return currentOrderStatus;

  const statuses = items.map(i => (i.status || '').toLowerCase() || 'placed');

  const allPlaced = statuses.every(s => s === 'placed');
  if (allPlaced) return 'placed';

  const allDelivered = statuses.every(s => s === 'delivered' || s === 'completed');
  if (allDelivered) return 'delivered';

  const allRejected = statuses.every(s => s === 'rejected');
  if (allRejected) return 'rejected';

  const allCancelled = statuses.every(s => s === 'cancelled');
  if (allCancelled) return 'cancelled';

  const deliveredCount = statuses.filter(s => s === 'delivered' || s === 'completed').length;
  const rejectedCount = statuses.filter(s => s === 'rejected').length;
  const cancelledCount = statuses.filter(s => s === 'cancelled').length;
  const processingCount = statuses.filter(s =>
    ['processing', 'placed', 'pending_fulfillment', 'confirmed', 'packing', 'ready_to_dispatch', 'out_for_delivery'].includes(s)
  ).length;

  if (deliveredCount > 0) {
    if (processingCount > 0) return 'partially_delivered';
    if (rejectedCount > 0 && cancelledCount === 0) return 'partially_delivered_rejected';
    if (cancelledCount > 0 && rejectedCount === 0) return 'partially_delivered_cancelled';
    return 'partially_delivered';
  }

  if (processingCount > 0) {
    if (['confirmed', 'packing', 'ready_to_dispatch', 'out_for_delivery', 'placed'].includes(currentOrderStatus)) {
      return currentOrderStatus;
    }
    return 'processing';
  }

  if (processingCount === 0) {
    if (rejectedCount >= cancelledCount) return 'rejected';
    return 'cancelled';
  }

  return currentOrderStatus;
};
