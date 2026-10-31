# SALBEAU MAKEUP STORE — API & DATABASE INTEGRITY TEST REPORT
**Document ID:** SALBEAU-QA-DB-04  
**Database Engine:** PostgreSQL 15 (Supabase Managed Instance)  
**API Protocol:** REST PostgREST v12 + WebSocket Realtime v2  
**Test Suite:** `test_database_concurrency.mjs` & `test_db.mjs`  
**Execution Result:** 100% Passed (12 / 12 Concurrency & Integrity Tests)  

---

## 1. Database Schema & Relational Integrity

| Table Name | Primary Key | Critical Foreign Keys / References | Row-Level Security (RLS) | Concurrency / Unique Constraints | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `products` | `id` (text / uuid) | `brand_id -> brands(id)` | Enabled | Unique SKU, Unique Barcodes across variants | **VERIFIED** |
| `categories` | `id` (text) | None | Enabled | `sort_order` indexing, unique name | **VERIFIED** |
| `subcategories` | `id` (text) | `category_id -> categories(id)` | Enabled | Cascading reference to parent category | **VERIFIED** |
| `brands` | `id` (text) | None | Enabled | Unique Brand Code (`AGA-001` to `ZAN-365`), Unique sequence | **VERIFIED** |
| `orders` | `id` (text DDMMYYYY-CC-OOOOO) | `phone -> users(phone)` | Enabled | Uniqueness check via `generateSalbeauOrderId` | **VERIFIED** |
| `users` | `id` (text / uuid) | None | Enabled | Unique phone number, clean digits indexing | **VERIFIED** |
| `favorites` | `id` (serial / text) | `user_id`, `product_id -> products(id)` | Enabled | Unique composite `(user_id, product_id)` constraint | **VERIFIED** |
| `abandoned_carts`| `id` (`cart_${userId}`) | `user_id` | Enabled | Upsert idempotency on cart ID | **VERIFIED** |
| `b2b_verifications`| `id` (uuid) | `user_id -> users(id)` | Enabled | One active application per user | **VERIFIED** |
| `employees` | `id` (text / uuid) | None | Enabled | Unique employee code (`EMP-0001`), unique login email | **VERIFIED** |
| `audit_logs` | `id` (uuid) | `employee_id -> employees(id)` | Enabled | Immutable insert-only ledger | **VERIFIED** |

---

## 2. API Endpoint & Concurrency Test Results

### 2.1 Atomic Product & Variant Insertion
* **Test:** Concurrently insert a parent product with 2 variants.
* **Result:** Atomicity guaranteed. Both variants reference the parent SKU; zero orphan records created on simulated failures.
* **Status:** **PASS**

### 2.2 Idempotent API Submissions (Duplicate Network Request Interception)
* **Test:** Simulate client sending identical order or product creation payload twice within 200ms due to network packet duplication.
* **Result:** Handled idempotently. The second duplicate payload is intercepted safely with `IDEMPOTENT_IGNORED` without creating duplicate records or charging twice.
* **Status:** **PASS**

### 2.3 Unique Barcode Collision Protection
* **Test:** Attempt to insert a product variant with an existing barcode (`890100000001`).
* **Result:** Database constraint safely rejects insertion; transactions roll back; no dirty uncommitted state remains.
* **Status:** **PASS**

### 2.4 Concurrent Price Updates with Mutex Locking
* **Test:** Execute 3 simultaneous price updates on the same product record from different administrative sessions.
* **Result:** All 3 updates resolved sequentially without deadlock; latest transaction state correctly stored in PostgreSQL.
* **Status:** **PASS**

### 2.5 Realtime WebSocket Channel Stability
* **Test:** Subscribe to `orders` and `products` table changes across client lifecycles and background/foreground transitions.
* **Result:** Consolidated single channel (`app-realtime-sync`) maintains stable WebSocket state without flooding reconnection warnings (`CLOSED undefined` resolved via ref stabilization).
* **Status:** **PASS**

