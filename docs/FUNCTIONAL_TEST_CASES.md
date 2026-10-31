# SALBEAU MAKEUP STORE — FUNCTIONAL TEST CASES & E-COMMERCE JOURNEYS
**Document ID:** SALBEAU-QA-TC-03  
**Execution Type:** Automated & Manual Verification  
**Coverage:** 100% Core Customer & Admin Workflows  

---

## 1. Registration & Authentication (Journey A)

### TC-AUTH-01: New User Registration & 10-Digit Mobile Validation
* **Preconditions:** Fresh install or logged out state.
* **Steps:**
  1. Open app -> Navigate to Mobile Login screen.
  2. Enter invalid mobile numbers: `12345`, `abcdef`, `987654321099` (12 digits).
  3. Verify validation error prevents request.
  4. Enter valid 10-digit Indian mobile number (`9876543210`) -> Tap "Request OTP".
* **Expected Result:** Strictly requires exactly 10 digits; non-numeric characters stripped automatically; proceeds to OTP screen.
* **Actual Result:** **PASS**

### TC-AUTH-02: OTP Verification & Session Restoration
* **Preconditions:** On OTP screen with mobile number set.
* **Steps:**
  1. Enter incorrect OTP (`000000`).
  2. Verify error message appears.
  3. Enter valid OTP -> Tap "Verify & Continue".
  4. If new user, complete profile; if existing user, observe automatic Home navigation.
  5. Close app process completely and restart app.
* **Expected Result:** Session hydrates from `storage.getSync()` / `storage.getItem()`; splash screen unmounts directly into Home screen without showing login or onboarding.
* **Actual Result:** **PASS**

### TC-AUTH-03: Session Logout & State Cleanup
* **Preconditions:** Authenticated user on Profile screen.
* **Steps:**
  1. Scroll to bottom of Profile screen -> Tap "Log Out".
  2. Confirm logout prompt.
  3. Check persistent storage (`salbeau_auth_session`, `salbeau_user_profile`, `salbeau_cart`).
* **Expected Result:** All user session keys removed; state resets to `EMPTY_USER_PROFILE`; navigates to Onboarding screen; hardware back button does not navigate back to Home.
* **Actual Result:** **PASS**

---

## 2. Home Screen & Navigation (Journey B)

### TC-HOME-01: Continuous Infinite Banner Loop
* **Preconditions:** Home screen mounted.
* **Steps:**
  1. Observe automatic scrolling interval (4000ms).
  2. Swipe left and right across banners.
  3. Tap on a banner with category destination (e.g. "Shop Skincare").
* **Expected Result:** Banners scroll smoothly without jumping or blank gaps; tapping banner navigates directly to the matching category or search screen.
* **Actual Result:** **PASS**

### TC-HOME-02: Top Brands Infinite Continuous Carousel
* **Preconditions:** Brands available in catalog.
* **Steps:**
  1. Observe Top Brands horizontal carousel.
  2. Verify brands scroll continuously via 30ms timer loop.
  3. Touch and hold brand item.
  4. Tap brand logo (e.g., "Lakme").
* **Expected Result:** Carousel pauses while touching; resumes on release; tap triggers global search for the selected brand name.
* **Actual Result:** **PASS**

### TC-HOME-03: Zero-Flicker Home Screen Refresh
* **Preconditions:** Authenticated user on Home screen with cached catalog.
* **Steps:**
  1. Pull down to trigger `RefreshControl` / refresh app.
  2. Observe display of Categories, Trending Now, Top Brands, New Arrivals, Best Sellers.
* **Expected Result:** No 2-second blank screen; sections remain visible from frame 1 using cached data; updates silently in the background when network responds.
* **Actual Result:** **PASS**

---

## 3. Product Catalog & 4-Tier Pricing (Journey C)

### TC-CAT-01: 4-Tier Role Pricing & B2B Gating Rule
* **Preconditions:** Sample product with MRP ₹850, General ₹765, Salon ₹595, Artist ₹550, Beautician ₹575.
* **Steps:**
  1. Log in as General Retail customer -> View product price.
  2. Verify price displays ₹765 with MRP ₹850 crossed out.
  3. Log in as Salon Owner *before* B2B verification is approved.
  4. Verify price displays General Retail price ₹765 (B2B gated).
  5. Admin approves B2B verification -> Refresh customer app.
  6. Verify price unlocks to discounted B2B rate ₹595.
* **Expected Result:** B2B wholesale prices remain locked at General User prices until admin approval; automatically unlock upon approval.
* **Actual Result:** **PASS** (Verified by automated test suite & dynamic price calculation)

### TC-CAT-02: Variant Swatches, SKU & Barcode Integrity
* **Preconditions:** Multi-shade product opened on Product Detail screen.
* **Steps:**
  1. Tap shade swatches (Shade 1 -> Shade 2 -> Shade 3).
  2. Observe product image, SKU, barcode, and price updates.
  3. Add Shade 2 to cart.
* **Expected Result:** Child variant data changes reactively; adding to cart attaches exact variant ID (`{parent_id}_{shade_id}`); no duplicate parent products created.
* **Actual Result:** **PASS**

---

## 4. Cart & Checkout (Journey E)

### TC-CART-01: Quantity Updates & Volume Discount Tiers
* **Preconditions:** Salon Owner viewing product with volume tiers (1 unit = ₹595, 3 units = 3% extra, 10 units = 10% extra).
* **Steps:**
  1. Add 1 unit to cart -> Subtotal is ₹595.
  2. Increase quantity to 3 -> Verify unit price reduces by 3% (₹577) and subtotal updates to ₹1,731.
  3. Increase quantity to 10 -> Verify unit price reduces by 10% (₹536) and subtotal updates to ₹5,360.
  4. Reduce quantity to 0 -> Verify item is removed from cart.
* **Expected Result:** Dynamic tier calculation evaluates correctly in O(1) time without rounding discrepancies.
* **Actual Result:** **PASS**

### TC-CART-02: Abandoned Cart Real-Time Tracking & Order Placement
* **Preconditions:** Customer adds items to cart and navigates to Checkout.
* **Steps:**
  1. Add products to cart.
  2. Check Supabase `abandoned_carts` table -> record exists with status `'abandoned'`.
  3. Select Delivery Address -> Tap "Place Order".
  4. Verify order generation in DDMMYYYY-CC-OOOOO format.
  5. Check `abandoned_carts` table -> status updated to `'converted'`.
  6. Verify cart is cleared.
* **Expected Result:** Order created successfully in database; order status is `'placed'`; abandoned cart marked `'converted'`.
* **Actual Result:** **PASS**

---

## 5. Orders & Fulfillment (Journey G)

### TC-ORD-01: 60-Minute Edit & Cancellation Window
* **Preconditions:** Newly placed order (< 60 minutes old).
* **Steps:**
  1. Open Order History -> Locate newly placed order.
  2. Tap "Cancel Order" -> Modal appears with cancellation reasons.
  3. Select reason and confirm -> Order status updates to `'cancelled'`.
  4. For orders older than 60 minutes: attempt cancel.
* **Expected Result:** System verifies server timestamp; allows cancellation within 60 minutes; strictly blocks cancellation after 60 minutes with explanatory policy message.
* **Actual Result:** **PASS**

### TC-ORD-02: Admin Fulfillment & Customer Real-Time Status Sync
* **Preconditions:** Customer viewing Order Details; Admin logged into Admin Portal.
* **Steps:**
  1. Customer order is in `'placed'` state.
  2. Admin updates order item 1 to `'processing'` and item 2 to `'delivered'`.
  3. Overall order computes to `'partially_delivered'`.
  4. Admin marks all items `'delivered'`.
  5. Observe Customer's Order Details screen.
* **Expected Result:** Supabase Realtime channel pushes updates instantaneously to customer screen without requiring manual pull-to-refresh; status updates to `'delivered'`.
* **Actual Result:** **PASS**

