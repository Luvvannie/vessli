# Vessli — Implementation Plan (Simple Terms)

**Source:** Vessli_Product_Requirements_Document.md v1.0
**Goal:** Build the smallest marketplace that works safely: one seller, one product, one verified payment, one protected download — then grow.

---

## Phase 1: Design System (How it looks and feels)

**In simple terms:** Decide the look once, reuse it everywhere so the app feels clean and trustworthy.

1. **Brand basics**
   - Confirm name Vessli, pick logo, one accent color, warm neutral background, dark readable text.
   - Pick fonts (one for headings, one for body).

2. **Style rules in code (Tailwind)**
   - Set up Tailwind with your colors, spacing, rounded corners, shadows.
   - Define status labels: draft (grey), pending_review (yellow), approved (green), rejected (red), paid (green), failed (red).

3. **Reusable parts (components)**
   - Buttons, inputs, product cards (cover + title + price), navbar, footer, empty states ("No products yet"), error messages, loading spinners.
   - Mobile-first: must look good on phone first, then tablet, desktop.

4. **Page layouts**
   - Storefront layout (browse + product page)
   - Customer account layout (orders + downloads)
   - Seller dashboard layout (my products + sales + earnings)
   - Admin layout (pending reviews + orders)

5. **PWA shell**
   - Add app icon, app name, install prompt so it can be installed on phones.

**Done when:** You have a demo site with fake data that looks like Vessli on mobile and desktop, with no backend yet.

---

## Phase 2: Architectural System (How it is built)

**In simple terms:** Set up the house structure — frontend, backend, database — and decide who is allowed to do what.

**Tech from PRD:**
- Frontend: React + Vite + TypeScript + Tailwind, deployed on Vercel
- Backend: Supabase Auth + Postgres + Storage + Edge Functions
- Payments: Paystack

1. **Project setup**
   - Create Vite + React + TS app, add Tailwind, add `vite-plugin-pwa`.
   - Create GitHub repo (done: Luvvannie/vessli), set up `.env` files for keys.
   - Folder structure: `storefront/`, `account/`, `seller/`, `admin/`, `components/`, `lib/`.

2. **Supabase setup**
   - Create Supabase project, turn on Auth (email + password, email verification).
   - Storage is AWS S3 (not Supabase Storage) in eu-north-1 Stockholm: `vessli-covers` (public images via bucket policy) + `vessli-product-files` (private, block all public access).
   - Create Edge Functions for secret jobs: `create-order`, `init-paystack`, `verify-paystack`, `paystack-webhook`, `get-download-link` (generates 5-min S3 presigned URL), `get-upload-url` (generates upload URL for sellers).

3. **Trust rules (very important)**
   - Frontend NEVER decides: order paid, price, commission, who owns what, who is admin.
   - Only server (Edge Functions + database rules) decides those.
   - Paystack secret key stays on server only.

4. **Database tables (from PRD Section 10)**
   - `profiles` (id = auth user, full_name)
   - `seller_profiles` (user_id, store_name, bio, status)
   - `products` (seller_id, title, description, category, price_kobo, currency, cover_image_path, status, rejection_reason)
   - `product_files` (product_id, storage_path, file_type, file_size)
   - `orders` (buyer_id, seller_id, total_kobo, currency, status)
   - `order_items` (order_id, product_id, unit_price_kobo, quantity=1)
   - `payments` (order_id, provider=paystack, provider_reference unique, amount_kobo, currency, status, verified_at)
   - `commission_ledger` (order_id unique, seller_id, gross_kobo, commission_rate=0.10, commission_kobo, seller_net_kobo, status)
   - `download_events` (order_id, product_id, buyer_id)
   - Money in kobo (integer), not naira with decimals.
   - Turn on Row Level Security (RLS) on every table.

**Done when:** Empty app builds, connects to Supabase, login works, database tables exist, private files cannot be opened without permission.

---

## Phase 3: Login and Profiles

**In simple terms:** Let people create accounts safely.

- Sign up, log in, log out, reset password, verify email.
- Profile page: view / edit name only.
- Admin role cannot be set by user — only set directly in database by you.
- Seller access requires login + seller profile.

**Done when:** You can register, verify email, log in/out, and a normal user cannot make themselves admin.

---

## Phase 4: Seller Onboarding + Product Upload + Approval

**In simple terms:** Let creators list products, but hide them until admin says yes.

- Seller form: store_name + bio. Save with status.
- Seller creates product: title, description, category, price (₦ → save as kobo), cover image upload, digital file upload.
- Check file type and size (e.g., PDF, ZIP, MP4 — decide max, e.g., 100MB). Don't trust filename alone.
- New product = `pending_review`, not visible publicly.
- Admin page: list pending, view details, Approve / Reject with reason.
- Rejected → seller sees reason, can edit and resubmit.
- Sellers can only see/edit their own products. Cannot change status to approved themselves.
- Admin can deactivate an approved listing.

**Done when:** Seller A cannot edit Seller B's product, and only approved products show in public queries.

---

## Phase 5: Storefront and Discovery

**In simple terms:** The shop window customers see.

- Public home: grid of approved product cards.
- Product page: title, description, seller store name, category, price, cover image.
- Search by title, filter by category, paginate (e.g., 12 per page).
- Price for checkout always comes from database on server, not from what frontend sends.
- Sort by newest / price (P1 if time).

**Done when:** Visitor without login can browse and search, but never sees pending/rejected products or private file links.

---

## Phase 6: Checkout, Paystack, and Commission

**In simple terms:** Take money correctly. Only mark as paid after Paystack confirms on the server.

- MVP rule: one product, one seller per checkout (no cart).
- Flow:
  1. Frontend asks server: "buy this product"
  2. Server looks up real price, creates `orders` (pending) + `payments` (pending) with unique reference
  3. Server starts Paystack transaction, returns checkout URL
  4. Customer pays on Paystack
  5. Server verifies via server-to-server call: check reference, status=success, amount matches order, currency matches (NGN)
  6. If ok → mark order paid, payment verified, create commission entry once (10%: e.g., ₦10,000 → ₦1,000 commission, ₦9,000 seller net)
  7. If amount mismatch → do NOT mark paid, flag for review
- Webhook: verify signature per Paystack docs, handle same webhook twice without duplicates (idempotent, unique constraints).
- Frontend success message alone never marks paid.
- Seller dashboard shows: sales count, gross, commission taken, net earnings, pending payout balance (no auto-payout in MVP).

**Done when:** Test payment works, duplicate webhook doesn't double-count, wrong amount never grants access.

---

## Phase 7: Protected Downloads + Order History

**In simple terms:** Only buyers who paid can download, with a link that expires fast.

- Files live in private AWS S3 `vessli-product-files` bucket (S3 keys stored in DB, never full URLs).
- Customer → My Orders → Download button.
- Server checks: logged in? Is there a paid order for this buyer + this product? If yes → make 5-minute signed URL → record `download_events`.
- If no → deny.
- Public API never returns permanent file URLs.
- Handle expired link: show "Link expired, get a new one" button.

**Done when:** Buyer can download, non-buyer gets denied, link stops working after 5 minutes.

---

## Phase 8: Admin Dashboard

**In simple terms:** Control room for the marketplace owner.

- See pending products, approve/reject.
- See orders, payment status, commission ledger for support.
- All admin pages check admin permission on server, not just hiding buttons.
- Basic user/seller moderation (P1).

**Done when:** Non-admin visiting `/admin` is blocked by server, not just redirected on frontend.

---

## Phase 9: Hardening, Testing, and Launch

**In simple terms:** Break it on purpose before real money is involved.

Must test:
1. Register → seller → upload → approve → buy (test Paystack) → download works
2. Invalid payment never grants access
3. Duplicate webhook → still one payment + one commission
4. Unpaid user cannot download (try direct URL)
5. Seller cannot edit another seller's product
6. Non-admin cannot do admin actions
7. Upload bad file type / oversized file is rejected
8. Abandoned checkout stays pending, not paid
9. Price changed after order created does not change order amount
10. Expired download link fails safely
11. App installs as PWA on real phone, works on slow network

Plus:
- Optimize images, paginate lists.
- Write README: setup, env vars, deploy to Vercel, Supabase migrations.
- Backups, monitoring, refund/reversal process (use reversal ledger entries, never edit history).

**MVP ready when:** All 16 acceptance criteria in PRD Section 14 pass.

---

## Phase 10: After MVP (Do NOT build now)

- Auto payouts to sellers
- Multi-seller cart
- Reviews, ratings, messaging, affiliates
- Coupons, subscriptions, featured listings
- More currencies / payment methods
- Native mobile apps

---

## Build Order Summary

1. Design system → 2. Architecture → 3. Auth → 4. Seller + Approval → 5. Storefront → 6. Paystack + Commission → 7. Downloads → 8. Admin polish → 9. Test + Deploy

**Rule:** Finish one full path before adding extras. Start with one product, one seller, one verified payment done correctly.
