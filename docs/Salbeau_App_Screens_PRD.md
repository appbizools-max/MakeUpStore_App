# Salbeau — Customer App (React Native) Screen-by-Screen PRD

> Reference inspiration: purplle.com (category structure, product discovery, cart flow) — adapted for Salbeau's role-based pricing, branch/brand model, and no-payment-gateway ordering.
> Theme: **Light pink** palette (customer app only — admin panel stays white/brown as already agreed).
> Status: DRAFT — please review each screen and flag anything to change before UI build starts.

---

## Visual Direction (Customer App)

| Token | Value | Use |
|---|---|---|
| Background | `#FFF8FA` | App background |
| Primary pink | `#F5A8C0` | Buttons, active states |
| Deep pink (text/accent) | `#C2477A` | Headings, price highlight, CTA text |
| Soft pink (surface) | `#FCE4EC` | Cards, chips, category tiles |
| Text | `#3A2430` | Body text |
| Muted text | `#8C7078` | Secondary text |
| Success | `#4C8C5C` | Order confirmed, in-stock |
| Warning | `#C2477A` on `#FDEAF1` | Cancellation-limit / disabled-brand notices |

Typography: one rounded/soft sans-serif for everything (e.g. Poppins/Inter-style), larger weight for prices and headings — a beauty-retail feel, not a generic dashboard.

---

## Screen Index

1. Splash
2. Onboarding — Role Selection
3. Signup / Login
4. Role Profile Completion
5. Home
6. Category Listing
7. Brand Listing
8. Product Listing (search/filter results)
9. Product Detail
10. Cart
11. Place Order (no payment gateway)
12. Order Confirmation
13. My Orders
14. Order Detail (Edit/Cancel window)
15. Cancellation Warning Modal
16. Profile / Account
17. Search

---

## 1. Splash Screen
**Purpose:** Brand entry moment while Firebase auth state resolves.
**Elements:** Salbeau logo centered on light-pink background, tagline placeholder ("Beauty, priced right for you").
**Behavior:** Auto-routes to Home (if logged in) or Onboarding (if not) once auth check completes.

---

## 2. Onboarding — Role Selection
**Purpose:** First decision point post-signup-intent — matches your "select the first user then select the other profile" flow.
**Elements:** Four large tappable cards, one per role:
- **General User** — "Shop at retail price"
- **Salon** — "Get salon pricing for your business"
- **Makeup Artist** — "Professional pricing for artists"
- **Beautician** — "Professional pricing for beauticians"
Each card: icon, role name, one-line benefit. Soft-pink card background, deep-pink border on selection.
**Behavior:** Tapping a card highlights it and reveals a "Continue" button at the bottom. Selection is stored and passed into Signup.

---

## 3. Signup / Login
**Purpose:** Firebase Auth (phone OTP or email/password — **[OPEN QUESTION] which method do you want — phone OTP is standard for Purplle-style Indian beauty apps**).
**Elements:** Phone number / email field, OTP or password field, "Continue" button, small text showing the role picked in step 2 ("Signing up as: Salon — change").
**Behavior:** New users → Role Profile Completion. Returning users → Home directly.

---

## 4. Role Profile Completion
**Purpose:** Capture role-specific details before activating the account.
**Elements (vary by role):**
- General: Name, phone, delivery address, preferred branch
- Salon: Salon name, address, GST/registration no. (**[OPEN QUESTION] required or optional?**), branch
- Makeup Artist / Beautician: Name, phone, certification/ID (**[OPEN QUESTION] required?**), branch
**Behavior:** On submit, `users/{uid}` doc is created with role + profile. **[OPEN QUESTION] does Salon/Artist/Beautician need admin approval before their special pricing unlocks, or is pricing active immediately on signup?**

---

## 5. Home
**Purpose:** Main discovery screen — Purplle-style structure adapted to Salbeau.
**Layout (top to bottom):**
- Top bar: branch selector (pill, e.g. "MG Road ▾"), search icon, cart icon with item-count badge
- Hero banner carousel (promotions — admin-managed)
- Horizontal category strip (Hair / Skin / Lips / ... — pulls from confirmed category list)
- "Shop by Brand" horizontal scroll (only **enabled** brands appear — disabled brands never load here)
- "Best Sellers" / "New In" product grid sections
- Price shown on every product card reflects the logged-in user's role automatically (MRP struck through + role price shown for Salon/Artist/Beautician)
**Behavior:** Pull-to-refresh. All brand/product queries filter out `enabled:false` brands at the query layer for speed.

---

## 6. Category Listing
**Purpose:** Browse all products in a category (Hair, Skin, Lip, etc.)
**Elements:** Filter bar (brand, price, sub-category), product grid (2 columns), sort dropdown (price, popularity).
**Behavior:** Same role-based pricing rule applies to every card.

---

## 7. Brand Listing
**Purpose:** Browse by brand — mirrors Purplle's brand directory.
**Elements:** Searchable alphabetical brand list, brand logo + product count.
**Behavior:** Only shows brands where `enabled == true`. If a brand is disabled mid-session, it disappears on next refresh — no error, just absent (per your loading-time requirement).

---

## 8. Product Listing (Search / Filter Results)
**Purpose:** Results screen for search queries or filter combinations.
**Elements:** Search bar pinned at top, applied-filter chips, product grid, empty-state illustration + "No products found" message if filters return nothing.

---

## 9. Product Detail
**Purpose:** Core conversion screen.
**Elements:**
- Image carousel
- Product name, brand (tap → Brand Listing filtered), category tag
- **Price block** — this is role-sensitive:
  - General: MRP only
  - Salon: MRP (struck through) + Salon Price
  - Makeup Artist: MRP (struck through) + Makeup Artist Price + cutoff info (**pending your clarification on what "cutoff" means**)
  - Beautician: per your answer to the open pricing question
- Stock status, quantity selector
- "Add to Cart" (deep pink, full width)
- Description, how-to-use, ingredients (if provided)
**Behavior:** If the product's brand is disabled after the page was loaded (edge case), attempting Add to Cart re-validates and shows: *"This item is no longer available."*

---

## 10. Cart
**Purpose:** Review before ordering.
**Elements:** Line items with thumbnail, qty stepper, remove option; price summary (subtotal at the user's role price, no tax/payment breakdown needed since no gateway); "Place Order" button.
**Behavior:** Quantity changes recalculate totals live.

---

## 11. Place Order (No Payment Gateway)
**Purpose:** Confirm delivery/branch details and submit the order — no payment step.
**Elements:** Delivery address (or "Pick up from branch" toggle), branch confirmation, order notes field, "Confirm Order" button.
**Behavior:** On submit, creates `orders/{orderId}` with `status:"placed"`, `editableUntil = placedAt + [window]` (**pending your answer on the exact window length**). No payment collection screen — order simply appears in Admin's Orders tab for manual processing.

---

## 12. Order Confirmation
**Purpose:** Reassure + set expectation.
**Elements:** Success illustration, order ID, "You can edit or cancel this order until [time]" countdown/label, "View Order" and "Continue Shopping" buttons.

---

## 13. My Orders
**Purpose:** Order history list.
**Elements:** Tabs — Active / Past / Cancelled. Each row: thumbnail(s), order ID, date, status chip, total.
**Behavior:** Active orders within the edit window show an "Edit" and "Cancel" action inline; once the window lapses, only "View" remains.

---

## 14. Order Detail (Edit / Cancel Window)
**Purpose:** Let the customer add items, edit quantities, or cancel — only while `now < editableUntil`.
**Elements:** Full item list (editable while in window), running total, countdown banner ("Editable for 12 more minutes"), "Save Changes" and "Cancel Order" buttons. Once window closes: read-only view, banner changes to "This order is now being prepared and can no longer be changed."
**Behavior:** Cancel triggers a confirmation dialog → then checks the customer's recent cancellation history (see Screen 15).

---

## 15. Cancellation Warning Modal
**Purpose:** Implements your "cancels more than 2 times continuously" rule.
**Trigger:** On the 3rd (or more) **consecutive** cancellation by the same customer.
**Elements:** Modal: "You've cancelled your last 3 orders in a row. Frequent cancellations may affect your account." (**[OPEN QUESTION] should this modal block/delay the cancel, just warn-and-proceed, or also notify Admin? Your earlier note said the *app* should prompt — I've designed it as customer-facing; let me know if Admin should also get a flag on their Users tab, which I'd assumed yes for in the PRD's data model.**)
**Behavior:** `users/{uid}.cancellationCount` increments on each cancel and resets to 0 on any completed (non-cancelled) order; `flagged:true` set once threshold is crossed, visible to Admin in the Users tab.

---

## 16. Profile / Account
**Purpose:** Account management.
**Elements:** Profile photo/initials, name, role badge (Salon/Artist/Beautician/General), editable contact details, saved addresses, branch preference, "My Orders" shortcut, Logout.
**[Per your note]** — profile background/card kept **white**, consistent with the admin side, while the rest of the app uses the light-pink theme — i.e., Profile is the one screen breaking to white for a cleaner "account" feel.

---

## 17. Search
**Purpose:** Fast product/brand discovery.
**Elements:** Search bar with recent searches + trending searches (admin-curated or auto from popular queries), results feed into Product Listing.

---

## Open Questions Carried Over From This Screen Pass
1. Login method: phone OTP or email/password?
2. Is GST/registration or certification ID required at signup for Salon/Artist/Beautician, or optional?
3. Does special pricing activate immediately on signup, or after admin approval?
4. Does the cancellation-frequency flag also need to reach Admin (I've assumed yes), or customer-facing only?
5. Still pending from before: exact edit/cancel time window, meaning of "cutoff", full category list, whether brands are branch-specific or global.

---

*Once these are settled, next step is a matching screen-by-screen pass for the **Admin panel** (React web) in the brown/white theme, followed by the Firebase schema finalization and then implementation.*
