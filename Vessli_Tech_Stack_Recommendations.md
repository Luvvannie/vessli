# Vessli — Tech Stack Recommendations (Simple Terms)

How to read: For each job, I list 3 options with good / bad in plain language, then my pick for Vessli MVP.

---

## 1. Frontend — What customers see (Phase 1 + 2)

| Option | What it is | Good | Bad | Best for |
|---|---|---|---|---|
| **React + Vite + TypeScript (Recommended)** | Website toolkit, fast to build | Fast, huge help online, works well with Supabase + Vercel, PWA easy | You must arrange pages yourself | Vessli MVP — matches your PRD |
| **Next.js** | React with extra powers | Great for Google search, images auto-optimized | Harder to learn, more settings, overkill for MVP | Big stores that need SEO |
| **Vue + Nuxt** | Simpler toolkit | Easy to learn, clean code | Fewer Nigeria devs / examples, fewer jobs to hire for | Small teams who love Vue |

**Pick: React + Vite + TS.** It is fastest for your 2-day prototype and your team can find help easily.

---

## 2. Design / Styling — How it looks (Phase 1)

| Option | What it is | Good | Bad | Best for |
|---|---|---|---|---|
| **Tailwind CSS (Recommended)** | Style with small codes like `bg-white p-4` | Fast, mobile-first easy, same look everywhere | Looks messy at first until you learn it | Vessli — clean modern shop |
| **shadcn/ui + Tailwind** | Ready-made buttons, cards, popups built on Tailwind | Looks professional fast, copy-paste | More files to manage | Dashboards (seller/admin) |
| **MUI (Material UI)** | Ready Google-style parts | Very complete, fast to start | Heavy, hard to make it look unique, big app size | Admin panels built quickly |

**Pick: Tailwind + shadcn/ui for dashboards.** Use Tailwind for storefront, copy shadcn parts for seller/admin to save time.

---

## 3. Backend + Database + Login — The engine (Phase 2 + 3)

This is the most important choice. It stores users, products, orders, money records.

| Option | What it is | Good | Bad | Best for |
|---|---|---|---|---|
| **Supabase (Recommended)** | Login + Postgres database + file storage + server code in one place | One account does all, free to start, Row Security keeps sellers apart, Edge Functions keep secrets safe | You must learn its rules (RLS), vendor lock-in | Vessli MVP — exactly what PRD needs |
| **Firebase** | Google's version | Easy login, fast setup, good docs | Database (NoSQL) is bad for money math, commissions harder, costs rise fast | Chat apps, quick prototypes |
| **Custom: Node.js + Neon Postgres + Clerk** | Build your own server | Full control, can do anything | Slow to build, you manage security, passwords, servers yourself | Large companies with backend team |

**Pick: Supabase.** It already gives you Auth, Postgres (good for kobo money math), Storage (private files), Edge Functions (for Paystack secrets).

---

## 4. File Storage — Where PDFs, ZIPs, covers live (Phase 4 + 7)

| Option | What it is | Good | Bad | Best for |
|---|---|---|---|---|
| **Supabase Storage (Recommended)** | File box inside Supabase | Private by default, 5-min links easy, no extra account | Large videos can get costly | Vessli MVP — private downloads |
| **AWS S3 + CloudFront (Used for Vessli)** | Amazon file box | Very cheap at scale, super reliable, private + 5-min presigned links via server | Hard to set up, many settings, needs IAM + CORS done right | Vessli — chosen for files |
| **Cloudinary** | Image/video specialist | Auto-resizes covers, fast images | Not good for private ZIPs/PDFs, pricey | Instagram-like apps |

**Pick: Supabase Storage.** Two buckets: `covers` (public) + `product-files` (private, no public access).

---

## 5. Payments — How you collect Naira (Phase 6)

| Option | What it is | Good | Bad | Best for |
|---|---|---|---|---|
| **Paystack (Recommended)** | Nigerian checkout | Test mode easy, webhooks + verify API, banks/cards/USSD, good docs | Only some countries, you handle webhook checks correctly | Vessli MVP — PRD already says Paystack |
| **Flutterwave** | Paystack competitor | Many countries + currencies, cards + mobile money | Docs change often, support slower, fees vary | Selling across Africa |
| **Monnify / Squad** | Nigerian alternatives | Good bank transfer focus, local support | Smaller community, fewer code examples | Backup option if others fail |

**Pick: Paystack only for MVP.** Don't add 2 providers now — it doubles testing. Use test keys, verify amount + currency + reference on server every time.

---

## 6. Hosting — Where website lives (Phase 9)

| Option | What it is | Good | Bad | Best for |
|---|---|---|---|---|
| **Vercel (Recommended)** | Puts React online fast | Connect GitHub → auto-deploy, free to start, fast in Nigeria with CDN | Backend functions limited (use Supabase for that) | Vessli frontend |
| **Netlify** | Like Vercel | Easy forms, easy setup | Slower new features, less React-focused | Simple sites |
| **Cloudflare Pages** | Cloudflare hosting | Very fast, cheap, strong protection | Setup slightly harder | High-traffic stores |

**Pick: Vercel.** Push to `main` → live. Keep secrets in Vercel env + Supabase secrets, never in code.

---

## 7. Emails — Login codes, receipts (Phase 3 + 6)

| Option | What it is | Good | Bad | Best for |
|---|---|---|---|---|
| **Supabase Auth Email (Recommended to start)** | Built-in | Zero setup, free, handles verify + reset | Basic design, limits on free plan | MVP |
| **Resend** | Pretty email sender | Beautiful receipts, easy React templates | Extra account | Launch when you want branded receipts |
| **SendGrid** | Old big sender | Sends millions, reliable | Hard setup, ugly dashboard | Large companies |

**Pick: Start with Supabase email, move to Resend after MVP.**

---

## 8. Extra Tools (Phase 9 — Hardening)

| Job | Recommended | Why in simple terms |
|---|---|---|
| Error tracking | Sentry | Tells you when checkout breaks on a real phone |
| Analytics | Plausible / Vercel Analytics | See what products people view, no cookie stress |
| Uptime | UptimeRobot (free) | Pings you if site goes down |

---

## Final Stack for Vessli MVP (Copy This)

- **Design:** Tailwind + shadcn/ui, mobile-first, warm neutrals + 1 accent
- **Frontend:** React + Vite + TypeScript + vite-plugin-pwa
- **Backend:** Supabase (Auth + Postgres + Storage + Edge Functions)
- **Payments:** Paystack only
- **Hosting:** Vercel
- **Email:** Supabase built-in → Resend later
- **Money rule:** Store in kobo (integer), commission 10% in server config, one ledger row per order

**What NOT to add now:** Next.js switch, Firebase, AWS, second payment provider, native apps, auto-payouts. They slow you down.
