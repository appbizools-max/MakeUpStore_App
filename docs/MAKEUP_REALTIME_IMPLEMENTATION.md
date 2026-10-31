# SALBEAU MAKEUP STORE — REAL-TIME SYNCHRONIZATION & NOTIFICATION IMPLEMENTATION

## 1. Real-Time Infrastructure Architecture

The Salbeau real-time synchronization architecture combines **Supabase PostgreSQL Realtime CDC (Change Data Capture)** with **Firebase Cloud Messaging (FCM)** to provide an instantaneous, multi-tiered customer notification experience.

```
       ┌────────────────────────┐
       │   Admin Panel Action   │
       │  (Fulfillment Update)  │
       └───────────┬────────────┘
                   │
                   ▼
       ┌────────────────────────┐
       │ PostgreSQL (Supabase)  │
       │  - UPDATE public.orders│
       │  - INSERT notifications│
       │  - INSERT order_history│
       └─────┬────────────┬─────┘
             │            │
  PostgreSQL │ CDC        │ FCM Push Dispatch
  Replication│            │ (Non-blocking)
             ▼            ▼
┌──────────────────┐  ┌───────────────────────┐
│ App Realtime Bus │  │ Outside-App FCM Push  │
│(Supabase Channel)│  │ (Service Worker / OS) │
└────────┬─────────┘  └───────────┬───────────┘
         │                        │
         ▼                        ▼
┌──────────────────┐  ┌───────────────────────┐
│ Customer App UI  │  │ System Notification   │
│ - Order Details  │  │ - Lock Screen Alert   │
│ - Toast Banner   │  │ - Banner / Push       │
│ - Notif Center   │  │ - Deep Link Click     │
└──────────────────┘  └───────────────────────┘
```

---

## 2. Real-Time State Reactive Flow

### A. The Admin Side (`AdminContext.jsx` & `orderNotificationService.js`)
When an administrator modifies an order's status:
1. `updateOrderStatus(orderId, newStatus, rejectionReason, customItems)` executes:
   - Validates state transition via `isValidStatusTransition()`.
   - Computes composite status (supporting multi-item partial fulfillment).
   - Generates status history audit entry.
   - Updates `public.orders` in Supabase.
   - Non-blocking call to `dispatchOrderNotification()`:
     - Formats message using `NOTIFICATION_EVENT_TEMPLATES`.
     - Inserts record into `public.notifications`.
     - Queries `public.users.fcm_token` and dispatches outside-app push notification.

### B. The Customer App Side (`AppContext.jsx`)
`AppContext.jsx` maintains an active channel subscription:
```javascript
const channel = supabase
  .channel('app-web-realtime-sync')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
    // Updates local orders array immutably
  })
  .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
    // Inserts new notification into notification center and triggers in-app toast
  });
```

### C. Zero-Refresh Order Details Update (`OrderHistoryScreen.jsx`)
In `OrderHistoryScreen.jsx`:
```javascript
// Keep selectedFullOrder dynamically synchronized with orders state
const currentFullOrder = useMemo(() => {
  if (!selectedFullOrder) return null;
  return displayOrders.find(o => o.id === selectedFullOrder.id) || selectedFullOrder;
}, [selectedFullOrder, displayOrders]);
```
- Because `currentFullOrder` is derived directly from `displayOrders` (which derives from `orders`), any real-time order update received from Supabase automatically triggers a component re-render.
- The order progression timeline, stage description, activity feed, and individual item fulfillment badges update on screen in real time with **zero manual page refresh**.

---

## 3. Dual-Channel Notification Engine

### Channel 1: In-App Notification Center
- Accessible at any time via the notification bell icon in the top header.
- Displays an unread count badge indicator that updates in real time.
- Features:
  - Categorization pills: `All`, `Orders`, `Unread`.
  - Notification items with category icons, order # badges, relative timestamps ("2m ago"), read/unread indicator dots.
  - "View Order Details" quick button deep links straight to that order.
  - "Mark All Read" bulk action and individual item "Mark Read".

### Channel 2: Outside-App Push Notifications (FCM)
- Managed by `MakeUpStore_App/app/src/utils/fcmService.js` and `MakeUpStore_App/app/firebase-messaging-sw.js`.
- Connected to Firebase Project `salbeauapp` (Sender ID `286964052282`).
- **Foreground Mode**: Incoming push triggers the floating in-app banner with "Track Progress →" CTA button.
- **Background Mode**: Handled by `firebase-messaging-sw.js` to show OS native notifications with the Salbeau logo and order payload.
- **Deep Linking**: Tapping the system notification opens the application and directly focuses the targeted order.

---

## 4. Offline Resilience & Connectivity Restoration
- **Local Cache Hydration**: On app startup, cached orders from `salbeau_cache_orders` provide instant offline viewing.
- **Auto-Sync on Reconnection**: When device connectivity returns, `fetchNotifications()` and `fetchUserOrders()` automatically re-query the latest state from Supabase.
- **Reliable Truth Source**: Push notifications are treated purely as delivery alerts; `public.orders` in PostgreSQL remains the authoritative single source of truth.

