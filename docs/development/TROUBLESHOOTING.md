# SALBEAU MAKEUPSTORE — TROUBLESHOOTING & FAQ GUIDE

## 1. Build & Module Resolution Issues

### 1.1 "Could not resolve `./components/...`" or Relative Import Error
**Symptom:**
Vite build or dev server throws: `[vite] Internal server error: Failed to resolve import "...".`

**Root Cause:**
Components were reorganized into domain subfolders (`products/`, `categories/`, `media/`, `orders/`, `b2b/`, `governance/`, `common/`). Relative imports that previously looked at `./` now require `../` or `../../`.

**Solution:**
Use the central component barrel or configured path aliases:
```javascript
// Recommended approach: Central Barrel
import { AddNewProductPage, ImageManagerModal } from '../components';

// Or use Vite path aliases:
import { useAdmin } from '@context/AdminContext';
import { supabase } from '@config/supabase';
import { optimizeImage } from '@utils/imageOptimizer';
```

---

### 1.2 Port 3001 Already in Use
**Symptom:**
`Error: listen EADDRINUSE: address already in use :::3001`

**Solution:**
Kill the orphaned Node process or let Vite select the next available port:
- **Windows (PowerShell):**
  ```powershell
  Get-Process node | Stop-Process -Force
  ```
- Or pass a custom port:
  ```bash
  npm run dev -- --port 3005
  ```

---

## 2. Supabase & Database Issues

### 2.1 "Permission Denied for Relation (HTTP 403 / 401)"
**Symptom:**
API calls return 401 Unauthorized or 403 Forbidden when creating products, updating roles, or approving B2B accounts.

**Root Cause:**
PostgreSQL Row Level Security (RLS) is blocking the request because the current user is unauthenticated or lacks the required role.

**Solution:**
1. Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct in `admin/.env`.
2. For administrative governance operations (e.g. employee permissions, approval center), ensure `VITE_SUPABASE_SERVICE_ROLE_KEY` is configured in `admin/.env`.
3. Check RLS policies in [`database/migrations/001_supabase_schema.sql`](file:///e:/MakeUpStore_App-main/MakeUpStore_App/database/migrations/001_supabase_schema.sql) and [`003_custom_modules_migration.sql`](file:///e:/MakeUpStore_App-main/MakeUpStore_App/database/migrations/003_custom_modules_migration.sql).

---

### 2.2 Image Upload Fails ("Bucket not found" or "new row violates row-level security")
**Symptom:**
Uploading images via `ImageManagerModal` displays an upload error toast.

**Solution:**
1. Verify that the bucket `product-images` exists in your Supabase project under **Storage**.
2. Ensure the bucket is set to **Public**.
3. Add the following storage RLS policy in Supabase SQL editor:
   ```sql
   CREATE POLICY "Allow public read on product-images"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'product-images');

   CREATE POLICY "Allow authenticated insert on product-images"
   ON storage.objects FOR INSERT
   WITH CHECK (bucket_id = 'product-images');
   ```

---

## 3. Barcode & Scanner Issues

### 3.1 Hardware Barcode Scanner Drops First or Last Digits
**Symptom:**
A 13-digit EAN barcode appears as 11 or 12 digits in the input box.

**Root Cause:**
Hardware USB HID scanners emit rapid keystroke events. If the inter-character delay threshold is too tight, the buffer may flush prematurely.

**Solution:**
Open [`admin/src/utils/useHardwareBarcodeScanner.js`](file:///e:/MakeUpStore_App-main/MakeUpStore_App/admin/src/utils/useHardwareBarcodeScanner.js) and increase `BUFFER_TIMEOUT_MS`:
```javascript
// Default is 50ms; adjust to 75ms or 100ms for slower scanners
const BUFFER_TIMEOUT_MS = 75;
```

---

### 3.2 Camera Scanner Fails to Open
**Symptom:**
Modal says "Camera permission denied" or video feed is black.

**Solution:**
1. Web browsers require an **HTTPS** connection or `localhost` to access `navigator.mediaDevices.getUserMedia`.
2. Ensure browser permissions allow camera access on `http://localhost:3001`.
3. If using an external USB webcam, ensure no other application (e.g., Zoom/Teams) is locking the device.

---

## 4. Bulk Excel Import Issues

### 4.1 "Missing Required Columns" or "Format Invalid"
**Symptom:**
Excel import modal rejects uploaded spreadsheet.

**Solution:**
1. Always download the official template directly from the modal (`Download Sample Excel Template`).
2. Do not modify the header text in row 1.
3. Ensure numeric fields (Retail Price, Wholesale Price) do not contain currency symbols (`$`, `€`, `₹`). The parser expects raw numbers (e.g. `49.99`).

---

## 5. Mobile App Issues

### 5.1 AsyncStorage Error on Web Preview
**Symptom:**
`[@RNC/AsyncStorage]: Native code is not available on web preview.`

**Root Cause:**
AsyncStorage is a React Native native module. When running the mobile code in a desktop browser or Vite preview, standard `window.localStorage` must be used instead.

**Solution:**
The repository provides dual context files:
- Use [`app/src/context/AppContext.jsx`](file:///e:/MakeUpStore_App-main/MakeUpStore_App/app/src/context/AppContext.jsx) for Web environments (`localStorage`).
- Use [`app/src/context/AppContext.js`](file:///e:/MakeUpStore_App-main/MakeUpStore_App/app/src/context/AppContext.js) for React Native / Expo (`AsyncStorage`).

---

## 6. Inventory Removal Confirmation

### 6.1 "Why are there no stock fields in product forms?"
**Explanation:**
Salbeau MakeUpStore operates strictly under a **Zero Stock Tracking** architectural model. Product availability is determined solely by active status toggles (`status = 'active'`) and catalog merchandising flags (`is_in_stock = true`), not finite numerical inventory counts.

Do not attempt to add `stock_quantity`, `reorder_level`, or warehouse ledgers back to the project.
