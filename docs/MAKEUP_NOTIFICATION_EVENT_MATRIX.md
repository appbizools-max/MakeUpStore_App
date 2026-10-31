# SALBEAU MAKEUP STORE — NOTIFICATION EVENT MATRIX & MESSAGING SPECIFICATION

## 1. Architectural Principles

### A. Three-Way Status Separation
To maintain e-commerce state integrity, three distinct status dimensions are strictly separated:

1. **Order Fulfillment Status**:
   Represents physical lifecycle stage (`placed`, `confirmed`, `processing`, `packing`, `ready_to_dispatch`, `out_for_delivery`, `delivered`, `partially_delivered`, `cancelled`, `rejected`).
2. **Payment Status**:
   Represents monetary transaction state (`pending`, `successful`, `failed`, `refund_initiated`, `refund_completed`). *A successful payment never automatically moves an order to shipped or delivered.*
3. **Notification Status**:
   Represents customer delivery and interaction state (`unread`, `read`, `dismissed`, `sent`).

---

## 2. Complete 25-Event Makeup Notification Matrix

| No. | Business Event | In-App Center | Push Notification (FCM) | Updates Order Screen | Category | Standard Message Template |
|:---:|:---|:---:|:---:|:---:|:---:|:---|
| 1 | Order Placed Successfully | Yes | Yes | Yes | `order_status` | **Title:** Order Placed Successfully<br>**Message:** Your makeup order #{orderNumber} has been placed successfully. |
| 2 | Order Confirmed | Yes | Yes | Yes | `order_status` | **Title:** Order Confirmed<br>**Message:** Your makeup order #{orderNumber} has been verified and confirmed by the store. |
| 3 | Payment Successful | Yes | Yes | Yes | `payment` | **Title:** Payment Successful<br>**Message:** Your payment for order #{orderNumber} was successful. |
| 4 | Payment Failed | Yes | Yes | Yes | `payment` | **Title:** Payment Failed<br>**Message:** Payment for order #{orderNumber} could not be processed. Please retry to secure your items. |
| 5 | Payment Pending / Verification | Yes | If action needed | Yes | `payment` | **Title:** Payment Pending<br>**Message:** We are awaiting payment confirmation for order #{orderNumber}. |
| 6 | Order Processing | Yes | Yes | Yes | `order_status` | **Title:** Order Being Prepared<br>**Message:** Your order #{orderNumber} is being prepared by our beauty specialists. |
| 7 | Order Packed | Yes | Yes | Yes | `order_status` | **Title:** Your Order Is Packed<br>**Message:** Your order #{orderNumber} has been packed and is being prepared for dispatch. |
| 8 | Order Shipped / Ready for Dispatch | Yes | Yes | Yes | `order_status` | **Title:** Order Shipped<br>**Message:** Your order #{orderNumber} has been shipped. Check your order details for the latest tracking information. |
| 9 | Shipment Tracking Updated | Yes | If relevant | Yes | `order_status` | **Title:** Shipment Tracking Updated<br>**Message:** Tracking details updated for order #{orderNumber}: {trackingNumber}. |
| 10 | Out for Delivery | Yes | Yes | Yes | `order_status` | **Title:** Out for Delivery<br>**Message:** Your order #{orderNumber} is out for delivery. |
| 11 | Delivery Delayed | Yes | Yes | Yes | `order_status` | **Title:** Delivery Schedule Update<br>**Message:** Delivery for order #{orderNumber} is experiencing a slight delay. We are working to deliver it promptly. |
| 12 | Order Delivered | Yes | Yes | Yes | `order_status` | **Title:** Order Delivered<br>**Message:** Your order #{orderNumber} has been marked as delivered. Enjoy your beauty essentials! |
| 13 | Cancellation Requested | Yes | Yes | Yes | `cancellation` | **Title:** Cancellation Requested<br>**Message:** Cancellation request submitted for order #{orderNumber}. Our team is reviewing it. |
| 14 | Cancellation Approved | Yes | Yes | Yes | `cancellation` | **Title:** Cancellation Approved<br>**Message:** Your cancellation request for order #{orderNumber} was approved. |
| 15 | Cancellation Rejected | Yes | Yes | Yes | `cancellation` | **Title:** Cancellation Not Approved<br>**Message:** Cancellation for order #{orderNumber} could not be approved as items are already in transit. |
| 16 | Order Cancelled | Yes | Yes | Yes | `cancellation` | **Title:** Order Cancelled<br>**Message:** Your order #{orderNumber} has been cancelled. Check your order details for further information. |
| 17 | Return Requested | Yes | Yes | Yes | `return` | **Title:** Return Requested<br>**Message:** Return request received for order #{orderNumber}. We are evaluating your request. |
| 18 | Return Approved | Yes | Yes | Yes | `return` | **Title:** Return Approved<br>**Message:** Return approved for order #{orderNumber}. Please package the beauty items safely. |
| 19 | Return Rejected | Yes | Yes | Yes | `return` | **Title:** Return Request Declined<br>**Message:** Return for order #{orderNumber} could not be accepted under our cosmetics hygiene policy. |
| 20 | Refund Initiated | Yes | Yes | Yes | `refund` | **Title:** Refund Initiated<br>**Message:** A refund has been initiated for order #{orderNumber}. |
| 21 | Refund Completed | Yes | Yes | Yes | `refund` | **Title:** Refund Completed<br>**Message:** Your refund for order #{orderNumber} has been completed. |
| 22 | Refund Failed | Yes | Yes | Yes | `refund` | **Title:** Refund Issue<br>**Message:** Refund processing encountered an issue for order #{orderNumber}. Support is reviewing. |
| 23 | Partial Order Fulfillment | Yes | Yes | Yes | `order_status` | **Title:** Partial Order Dispatched<br>**Message:** Available items from order #{orderNumber} are on their way. Remaining items will follow shortly. |
| 24 | Product Unavailable / Rejected | Yes | Yes | Yes | `order_status` | **Title:** Order Fulfillment Update<br>**Message:** We are unable to fulfill order #{orderNumber}. Any payments will be refunded promptly. |
| 25 | Customer Action Required | Yes | Yes | Yes | `system` | **Title:** Action Required<br>**Message:** Please review order #{orderNumber} and complete the requested action. |

---

## 3. Deep Linking & Notification Payload Schema

Every notification record inserted into `public.notifications` and dispatched via FCM conforms to the following structured contract:

```json
{
  "id": "notif_1730372800000_a8b9c",
  "user_id": "+919876543210",
  "target": "customer",
  "title": "Your Order Is Packed",
  "message": "Your order #928144 has been packed and is being prepared for dispatch.",
  "type": "order_status",
  "data": {
    "orderId": "ORD-928144",
    "orderNumber": "928144",
    "eventType": "packing",
    "amount": 2499,
    "timestamp": "2026-10-31T17:00:00.000Z"
  },
  "is_read": false,
  "created_at": "2026-10-31T17:00:00.000Z"
}
```

### Deep Link Behavior:
- **Tapping Toast Banner**: Sets `selectedOrderIdForDetails` and switches screen to `orders`, automatically rendering the full order details for that exact order.
- **Tapping Notification in Notification Center**: Calls `markNotificationAsRead(item.id)`, sets `selectedOrderIdForDetails`, and opens the Order Details page.
- **Tapping Outside-App Push Notification**: Opens application via `firebase-messaging-sw.js` and routes customer to the relevant order.

