# Vessli --- Product Requirements Document (PRD)

**Working product name:** Vessli\
**Product type:** Multi-seller digital product marketplace\
**Document version:** 1.0\
**Status:** Draft for MVP development\
**Last updated:** 9 October 2026

> **Naming note:** Vessli is the selected working name. Before public
> launch, verify trademark and business-name availability, along with
> suitable domain and social handles.

## 1. Executive Summary

Vessli is an installable digital marketplace where creators can list and
sell downloadable products such as ebooks, templates, planners, design
assets, business documents, and educational resources. Customers can
browse the catalogue, pay online, and securely access the products they
purchase.

The platform earns revenue through a commission on successful sales. The
initial commission assumption is 10% of the product sale price, before
payment-processing fees, refunds, and operating costs.

The MVP will support seller registration, product uploads, administrator
approval, customer checkout through Paystack, server-side payment
verification, commission accounting, and protected downloads.

## 2. Product Vision

Make it simple for creators to sell digital products and for customers
to discover, purchase, and securely download useful digital resources.

## 3. Problem Statement

Creators may lack a simple way to publish and sell digital products
without building their own ecommerce website. Customers may find it
difficult to discover relevant products and complete purchases through a
consistent, trustworthy checkout experience.

Vessli brings product discovery, creator listings, payment, and download
access into one marketplace.

## 4. Goals and Objectives

### 4.1 MVP goals

-   Allow users to register and authenticate securely.
-   Allow eligible users to create seller profiles.
-   Allow sellers to upload digital products and submit them for review.
-   Allow administrators to approve or reject submitted products.
-   Display approved products in a searchable public catalogue.
-   Allow customers to purchase products using Paystack.
-   Verify transactions on the server before marking orders as paid.
-   Calculate and record marketplace commission for successful orders.
-   Provide authorized customers with protected product downloads.
-   Give sellers visibility into product status, sales, and recorded
    earnings.
-   Make the web app responsive and installable as a Progressive Web App
    (PWA).

### 4.2 Out of scope for the MVP

-   Native iOS and Android apps distributed through app stores.
-   Automatic seller payouts or a stored-value wallet.
-   Multi-seller carts or splitting one checkout across multiple
    sellers.
-   Subscriptions and recurring billing.
-   Product reviews, ratings, messaging, and affiliate programs.
-   Advanced tax automation.
-   AI-generated products or recommendations.
-   DRM or guarantees against customers copying files after download.

## 5. Target Users and Roles

### 5.1 Customer

A user who browses products, makes purchases, views order history, and
downloads products they have paid for.

### 5.2 Seller

A user who creates a seller profile, uploads products, sets prices,
submits listings for approval, and views their sales and earnings
ledger.

### 5.3 Administrator

An authorized platform operator who reviews product submissions,
approves or rejects listings, manages product visibility, and audits
orders and payment records.

A user may be both a customer and a seller. Administrator privileges
must be assigned only through a secure administrative process; users
must not be able to grant themselves the admin role.

## 6. Core User Journeys

### 6.1 Seller onboarding and product approval

1.  User registers and verifies their email.
2.  User completes a seller profile.
3.  Seller creates a product listing with title, description, category,
    price, cover image, and downloadable file.
4.  Product is saved with `pending_review` status.
5.  Administrator reviews the listing and approves or rejects it.
6.  Approved product becomes visible in the public catalogue.
7.  If rejected, the seller can view the reason, edit the listing, and
    resubmit it.

### 6.2 Customer purchase

1.  Customer browses the catalogue and opens a product page.
2.  Customer selects Buy.
3.  Backend creates a pending order using the current product price from
    the database.
4.  Backend initializes a Paystack transaction using a unique reference.
5.  Customer completes checkout on Paystack.
6.  Backend verifies transaction status, reference, amount, and currency
    through a verified server-to-server request and/or correctly
    authenticated webhook.
7.  Order is marked paid only after successful verification.
8.  A commission ledger entry is created exactly once.
9.  Customer can access the purchased product through a protected
    download flow.

### 6.3 Protected download

1.  Customer requests a download while authenticated.
2.  Backend checks for a verified paid order belonging to that customer
    and covering the requested product.
3.  Backend generates a short-lived signed URL for the private storage
    object.
4.  Download event is recorded where appropriate.
5.  Requests without entitlement are denied.

## 7. Functional Requirements

Priority definitions: **P0** = required for MVP; **P1** = desirable if
time permits; **Future** = post-MVP.

### 7.1 Authentication and profiles

-   **P0:** Users can sign up, log in, log out, and reset their
    password.
-   **P0:** Email verification is supported.
-   **P0:** Authenticated users can view and update permitted profile
    fields.
-   **P0:** Seller access requires an authenticated user and a seller
    profile.
-   **P0:** Admin privileges cannot be granted through public signup or
    ordinary profile editing.

### 7.2 Seller management

-   **P0:** Users can submit a seller profile with store name and basic
    profile information.
-   **P0:** Seller profile status is recorded.
-   **P0:** Sellers can access only their own products and
    seller-specific records.
-   **P1:** Seller profile can include a bio, avatar/logo, and public
    storefront URL.

### 7.3 Product management

-   **P0:** Sellers can create, edit, and submit their own product
    listings.
-   **P0:** Product listings include title, description, category,
    price, cover image, file, and status.
-   **P0:** Allowed file types and maximum file sizes are validated.
-   **P0:** New or changed listings require approval before public
    visibility.
-   **P0:** Administrators can approve or reject submissions and provide
    a rejection reason.
-   **P0:** Only approved, active products are visible in public
    catalogue queries.
-   **P0:** Sellers cannot approve their own products or alter
    moderation status.
-   **P1:** Sellers can archive their own products.

### 7.4 Storefront and discovery

-   **P0:** Visitors can browse approved products.
-   **P0:** Product pages show title, description, seller, category,
    price, and preview image.
-   **P0:** Customers can search by product title and filter by
    category.
-   **P0:** The product price used for checkout is retrieved and
    validated server-side.
-   **P1:** Sort by newest and price.

### 7.5 Checkout and payments

-   **P0:** Each checkout contains one seller's product in the MVP.
-   **P0:** Backend creates the order and payment reference before
    checkout.
-   **P0:** Paystack secret credentials remain server-side.
-   **P0:** Backend verifies payment status, transaction reference,
    expected amount, and currency.
-   **P0:** A browser redirect or frontend success message alone never
    marks an order paid.
-   **P0:** Webhook signatures are verified using official provider
    guidance.
-   **P0:** Webhook and verification processing are idempotent.
-   **P0:** Failed, abandoned, pending, and successful payments are
    represented accurately.
-   **P0:** A payment cannot be applied to the wrong order or a
    different amount.
-   **P1:** Admin can review payment and order status for support and
    reconciliation.

### 7.6 Commission ledger and seller earnings

-   **P0:** Commission rate is configurable in trusted server-side
    configuration.
-   **P0:** Initial commission assumption is 10% of the eligible gross
    product sale.
-   **P0:** Commission is recorded only after a payment is verified.
-   **P0:** A unique constraint prevents duplicate commission entries
    for the same order.
-   **P0:** Ledger records gross amount, commission amount, seller net
    entitlement, currency, order, and status.
-   **P0:** Ledger records are auditable; corrections use reversal
    entries rather than silently overwriting financial history.
-   **P0:** Seller dashboard displays recorded sales, commission,
    estimated net earnings, pending payout balance, and payout status.
-   **P0:** Ledger balances are accounting records and are not
    represented as a wallet holding customer funds.
-   **P0:** Automated seller payouts are not part of the MVP.

### 7.7 Protected downloads

-   **P0:** Original digital files are stored in a private Supabase
    Storage bucket.
-   **P0:** Public catalogue responses never expose permanent public
    URLs to paid files.
-   **P0:** Download authorization is enforced server-side.
-   **P0:** Only the purchaser of a verified paid order can access the
    corresponding product file.
-   **P0:** Signed URLs expire after a short configurable period,
    initially five minutes.
-   **P0:** Download requests without a valid entitlement are denied.
-   **P1:** Record download events for basic troubleshooting and usage
    visibility.

### 7.8 Administration

-   **P0:** Admin can view pending product submissions.
-   **P0:** Admin can approve or reject a product with a reason.
-   **P0:** Admin can deactivate an approved listing when required.
-   **P0:** Admin can review orders, payment status, and commission
    records.
-   **P0:** Admin routes and actions require admin authorization on the
    server.
-   **P1:** Basic user and seller account moderation.

## 8. Business Model

### 8.1 Primary revenue stream

Marketplace commission on each successful sale.

Initial assumption: - Product price: ₦10,000 - Commission rate: 10% -
Marketplace gross commission: ₦1,000 - Seller gross entitlement: ₦9,000

This example excludes payment-processing fees, refunds, taxes, and
operating costs. The final seller agreement must clearly state how fees,
refunds, chargebacks, and payout timing are handled.

### 8.2 Future revenue opportunities

-   Featured product listings.
-   Optional seller subscriptions or premium storefront features.
-   Creator analytics.
-   Additional promotional tools.

These are not required for the MVP.

## 9. Proposed Technical Architecture

### 9.1 Frontend

-   React, Vite, and TypeScript.
-   Tailwind CSS for responsive styling.
-   `vite-plugin-pwa` for installability.
-   Separate route/layout groups for storefront, customer account,
    seller dashboard, and admin dashboard.

### 9.2 Backend and data

-   Supabase Auth for identity.
-   PostgreSQL for marketplace data.
-   Supabase Storage for cover images and private downloadable files.
-   Supabase Edge Functions for privileged operations such as creating
    checkout sessions, verifying payments, handling payment webhooks,
    and issuing protected download links.
-   Paystack for checkout and transaction verification.
-   Vercel for frontend deployment.

### 9.3 Trust boundaries

All privileged operations must be enforced by server-side code and
database policies. The frontend must not be trusted to set order status,
payment status, commission values, seller ownership, or admin
privileges.

## 10. Database Requirements

The following tables are proposed for the MVP. Exact types, indexes,
constraints, and foreign keys should be defined in database migrations.

### `profiles`

-   `id` --- matches the Supabase Auth user ID
-   `full_name`
-   Safe profile fields
-   `created_at`
-   `updated_at`

Admin authority must be represented and enforced securely, not granted
by trusting a client-editable role field.

### `seller_profiles`

-   `id`
-   `user_id`
-   `store_name`
-   `bio`
-   `status`
-   `created_at`
-   `updated_at`

### `products`

-   `id`
-   `seller_id`
-   `title`
-   `description`
-   `category`
-   `price_kobo`
-   `currency`
-   `cover_image_path`
-   `status`
-   `rejection_reason`
-   `created_at`
-   `updated_at`
-   `approved_at`

### `product_files`

-   `id`
-   `product_id`
-   `storage_path`
-   `file_type`
-   `file_size`
-   `created_at`

### `orders`

-   `id`
-   `buyer_id`
-   `seller_id`
-   `total_kobo`
-   `currency`
-   `status`
-   `created_at`
-   `updated_at`

### `order_items`

-   `id`
-   `order_id`
-   `product_id`
-   `unit_price_kobo`
-   `quantity`

For the MVP, quantity should generally be one for digital products
unless the product model explicitly supports otherwise.

### `payments`

-   `id`
-   `order_id`
-   `provider`
-   `provider_reference`
-   `amount_kobo`
-   `currency`
-   `status`
-   `verified_at`
-   `created_at`

Provider references must be unique where required to prevent reuse or
accidental duplicate processing.

### `commission_ledger`

-   `id`
-   `order_id`
-   `seller_id`
-   `gross_kobo`
-   `commission_rate`
-   `commission_kobo`
-   `seller_net_kobo`
-   `status`
-   `created_at`

Use a unique constraint on the original order commission entry. Store
financial values as integer kobo, not floating-point values.

### `download_events`

-   `id`
-   `order_id`
-   `product_id`
-   `buyer_id`
-   `created_at`

## 11. Non-Functional Requirements

### Security

-   Enable and test RLS on every exposed table.
-   Keep service-role keys and payment secrets in server-side secret
    storage.
-   Validate and sanitize all user input.
-   Validate file type and size; do not trust filename extensions alone.
-   Apply rate limits or abuse controls to sensitive endpoints where
    feasible.
-   Verify payment webhooks and make processing idempotent.
-   Never expose private storage object paths as public access
    credentials.

### Reliability and integrity

-   Use database transactions or equivalent safe patterns where
    necessary to keep order, payment, and ledger states consistent.
-   Record enough information to reconcile provider transactions with
    local orders.
-   Avoid duplicate orders or commission entries from webhook retries.
-   Preserve an auditable history for financial corrections and refunds.

### Performance

-   Paginate product listings.
-   Optimize cover images.
-   Avoid loading private product files until access is authorized.
-   Ensure the app is usable on typical mobile connections.

### Usability

-   Responsive design for mobile, tablet, and desktop.
-   Clear empty states, validation errors, and payment status messages.
-   Accessible form labels and keyboard navigation for core workflows.

## 12. UX and Visual Direction

Brand direction: refined, modern, creator-focused, and trustworthy.

Suggested visual approach: - Warm neutral backgrounds. - Dark, readable
typography. - One restrained accent color. - Clean product cards with
prominent cover art and price. - Clear seller dashboard navigation. -
Consistent status labels for draft, pending review, approved, rejected,
paid, and failed. - Mobile-first checkout and download experience.

The final brand identity and name should be checked for trademark,
domain, and handle availability before public launch.

## 13. Error and Edge Case Handling

The MVP must handle: - Seller uploads a disallowed or oversized file. -
Product is rejected or deactivated after submission. - Customer abandons
checkout. - Payment succeeds but the browser never returns to the app. -
Paystack sends the same webhook more than once. - Payment amount or
currency does not match the order. - A customer attempts to download
before payment verification. - A user tries to access another seller's
product-management data. - A signed download URL expires. - A refund or
chargeback is reported. - A seller changes a product price after a
customer has started checkout.

For checkout, the server should store the expected order amount and use
that immutable order amount for verification. A price change should not
silently change the amount expected for an already-created order.

## 14. MVP Acceptance Criteria

The MVP is ready for controlled user testing when all the following can
be demonstrated:

1.  A user can register and sign in.
2.  An eligible user can create a seller profile.
3.  A seller can upload a product and submit it for review.
4.  An admin can approve or reject the product.
5.  Only approved products appear in the public catalogue.
6.  A customer can initiate Paystack test checkout.
7.  The backend verifies a successful transaction against the correct
    order, amount, and currency.
8.  An invalid or unverified transaction never grants paid access.
9.  Duplicate webhook delivery does not create duplicate payment or
    commission records.
10. A verified paid order creates one commission ledger entry.
11. The purchaser can obtain a short-lived download link.
12. An unpaid or unrelated user cannot download the file.
13. A seller cannot edit another seller's product or view unauthorized
    records.
14. Admin actions require admin authorization.
15. The app builds successfully and can be installed as a PWA on
    supported devices.
16. Setup and deployment instructions are documented.

## 15. Implementation Plan

A two-day build should be treated as a focused prototype target, not a
guarantee of production readiness. Payment and access-control flows need
dedicated testing before real transactions.

### Day 1 --- Foundation and marketplace workflow

-   Create React/Vite/TypeScript project.
-   Set up GitHub repository and environment configuration.
-   Configure Supabase project and authentication.
-   Write database migrations and RLS policies.
-   Build storefront, product detail pages, seller dashboard, and admin
    moderation UI.
-   Implement seller profiles, product uploads, and approval status.
-   Test basic access permissions.

### Day 2 --- Checkout and delivery prototype

-   Implement private file storage.
-   Implement server-side order creation.
-   Initialize Paystack test checkout.
-   Implement transaction verification and verified webhook handling.
-   Record payment and commission ledger entries idempotently.
-   Implement protected download authorization.
-   Test the successful purchase flow and basic failure cases.

### Phase 2 --- Hardening before public launch

-   Thoroughly test RLS using separate customer, seller, and admin
    accounts.
-   Test duplicate webhook delivery and transaction mismatches.
-   Test expired links, unauthorized downloads, and malicious uploads.
-   Add refund/reversal handling and payout reconciliation procedures.
-   Add monitoring, backups, and support processes.
-   Deploy to Vercel and test PWA installation on real devices.
-   Review marketplace terms, intellectual property policies, privacy
    obligations, payment-provider requirements, and seller payout
    arrangements.

## 16. Open Questions and Decisions

1.  **Seller eligibility:** Can anyone become a seller immediately, or
    must accounts be reviewed?
2.  **Payout method:** What verified provider arrangement will be used
    to pay sellers, and how frequently?
3.  **Fees:** Will the seller or marketplace bear payment-processing
    fees?
4.  **Refund policy:** How will refunds, disputes, and chargebacks
    affect seller earnings and commission?
5.  **File limits:** What file types and maximum file sizes will be
    permitted?
6.  **Content policy:** Which products are prohibited, and how will
    intellectual-property complaints be handled?
7.  **Currency:** Is NGN the only launch currency?
8.  **Brand:** Confirm final name and availability before launch.

## 17. Future Roadmap

After the MVP is stable: - Automated seller payouts, subject to provider
support and compliance. - Multi-seller carts and payment splitting. -
Seller verification and richer storefronts. - Product ratings and
reviews. - Coupons and promotions. - Creator analytics and sales
reports. - Subscription plans and featured listings. - More payment
methods and currencies. - Native mobile apps if market demand justifies
them.

## 18. Summary

Vessli is a multi-seller marketplace for downloadable digital products.
The MVP focuses on the smallest complete and secure marketplace
workflow: seller onboarding, product submission and moderation, verified
customer payment, commission accounting, and protected download access.

The recommended build strategy is to implement and test one complete
path at a time, beginning with authentication and product approval, then
adding Paystack checkout and protected downloads. Real seller payouts
and other complex marketplace capabilities should follow only after the
core flow is reliable.

**Product principle:** Start with a small marketplace that handles one
product, one seller, and one verified payment correctly; then scale the
catalogue and capabilities.
