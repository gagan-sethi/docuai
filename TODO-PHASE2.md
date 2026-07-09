# Phase 2 — Simplified Admin Controls for Referral System

> **Status:** Not started  
> **Date:** 6 April 2026  
> **Context:** Phase 1 (promo codes, referral dashboard, signup integration) is complete and working. This is the next step.

---

## Goal

Add a **simple max discount cap** and **admin visibility** over all promo codes — without over-engineering. No approval workflows, no commission tracking, no ReferralSettings model. Just enforce a cap and let admin view/manage codes.

---

## What to Build

### 1. Max Discount Cap (constant or env var)

- Add `MAX_DISCOUNT_CAP = 20` as a constant in the referral route (or `.env` variable `REFERRAL_MAX_DISCOUNT=20`)
- When an accounting firm creates a code via `POST /api/referrals`:
  - If `discountPercent > MAX_DISCOUNT_CAP` → reject with 400: _"Maximum discount allowed is 20%. Contact admin for higher discounts."_
- Admin role is exempt from the cap (can create any discount)
- Show the cap in the firm's "Create Code" modal UI so they know the limit upfront

**Files to change:**
- `docuai-api/src/routes/referrals.ts` — Add cap check in POST route
- `docuai/src/app/dashboard/referrals/page.tsx` — Show max discount hint in create modal

### 2. Admin Routes (2 new endpoints)

Add these to a new file `docuai-api/src/routes/admin.ts` (or extend `referrals.ts`):

| Method  | Endpoint                       | Auth  | Description                                  |
| ------- | ------------------------------ | ----- | -------------------------------------------- |
| `GET`   | `/api/admin/referrals`         | Admin | View ALL promo codes across ALL firms         |
| `PATCH` | `/api/admin/referrals/:id`     | Admin | Override any code (disable, change discount)  |

**GET /api/admin/referrals** should return:
```json
{
  "codes": [
    {
      "code": "ACME20",
      "firm": { "fullName": "Acme Accounting", "email": "..." },
      "discountPercent": 20,
      "usageCount": 12,
      "maxUses": 50,
      "isActive": true,
      "createdAt": "2026-04-01"
    }
  ],
  "stats": {
    "totalCodes": 47,
    "activeCodes": 32,
    "totalReferredUsers": 189
  }
}
```

**PATCH /api/admin/referrals/:id** should accept:
```json
{
  "isActive": false,
  "discountPercent": 15
}
```

**Files to create/change:**
- `docuai-api/src/routes/admin.ts` — New file with 2 routes
- `docuai-api/src/server.ts` — Register `/api/admin` routes

### 3. Update Firm's Create Code Modal

In the referrals dashboard, when creating a new code:
- Show helper text: _"Maximum discount: 20%"_
- Cap the discount input to the max value
- If the API rejects (above cap), show the error message

**Files to change:**
- `docuai/src/app/dashboard/referrals/page.tsx` — Add max hint + input cap

---

## What NOT to Build (Yet)

| Feature                      | Why Skip                                        | When to Add               |
| ---------------------------- | ----------------------------------------------- | ------------------------- |
| `ReferralSettings` model     | One number doesn't need a DB collection         | When you have 5+ settings |
| Approval workflows           | Just enforce the cap, block anything above it    | When firms request exceptions often |
| Commission tracking          | No Stripe/billing yet — commissions are meaningless | After Stripe integration |
| Discount duration config     | Hardcode "first month" for now                   | After billing is live    |
| Platform-wide analytics page | Run DB queries manually when needed              | When you have 50+ firms  |
| Admin panel UI               | Admin can use the API routes directly or Postman  | When admin needs a dashboard |

---

## Implementation Order

```
Step 1 → Add MAX_DISCOUNT_CAP constant to referrals.ts + enforce in POST route
Step 2 → Create admin.ts with GET + PATCH routes (admin-only)
Step 3 → Register admin routes in server.ts
Step 4 → Update referrals dashboard — show cap hint in create modal
Step 5 → Test: firm tries 25% discount → blocked. Admin disables a code → works.
Step 6 → Deploy API (AWS) + Frontend (Vercel)
```

---

## Quick Reference — Current State

### What's Already Built (Phase 1 ✅)

**Backend (`docuai-api`):**
- `src/models/ReferralCode.ts` — Promo code model (code, ownerId, discountPercent, maxUses, usageCount, isActive, description)
- `src/models/User.ts` — Added referredBy, appliedPromoCode, promoDiscountPercent fields
- `src/routes/referrals.ts` — 5 endpoints (validate, create, list, update, delete)
- `src/routes/auth.ts` — Signup validates & applies promo codes
- `src/server.ts` — Referral routes registered

**Frontend (`docuai`):**
- `src/app/signup/page.tsx` — Role cards, promo code input (business only), discount badge
- `src/components/dashboard/Sidebar.tsx` — "Referrals" nav (accounting users only)
- `src/app/dashboard/referrals/page.tsx` — Stats, code management, referred clients table, create modal
- `src/app/dashboard/referrals/layout.tsx` — Layout with metadata

### API Endpoints Live

| Method   | Endpoint                         | Auth       |
| -------- | -------------------------------- | ---------- |
| `GET`    | `/api/referrals/validate?code=X` | Public     |
| `POST`   | `/api/referrals`                 | Accounting |
| `GET`    | `/api/referrals`                 | Accounting |
| `PATCH`  | `/api/referrals/:id`             | Accounting |
| `DELETE` | `/api/referrals/:id`             | Accounting |

---

## Notes

- The full plan is documented in `REFERRALS.md` — this file is the simplified actionable TODO
- Admin panel UI (full dashboard) can come later as Phase 3 when there's enough data to justify it
- For now, admin manages codes via API (Postman / curl) — 2 endpoints is all that's needed
