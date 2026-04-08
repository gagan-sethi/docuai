# Referral & Promo Code System

## Overview

DocuAI has two account types — **Business** and **Accounting Firm**. Accounting firms can create promo codes and share them with their clients (businesses). When a business signs up using a promo code, they get a discount and the accounting firm can track all their referred clients from a dedicated dashboard.

An **Admin / Super Admin** oversees the entire referral program — setting discount limits, reviewing all codes, and managing commission payouts.

---

## Who Manages What

### Role Hierarchy

```
Super Admin / Admin
  └── Full control over referral program
        ├── Set global max discount cap (e.g. 20%)
        ├── View & manage ALL promo codes across ALL firms
        ├── Override / disable any code
        ├── Approve codes that exceed the cap (optional)
        ├── Set commission rates for accounting firms
        └── View all referred users across the platform

Accounting Firm
  └── Self-service promo code management (within limits)
        ├── Create promo codes (up to admin-set max discount)
        ├── Activate / deactivate their own codes
        ├── Track their referred clients
        └── View their commission earnings

Business User
  └── Consumer of promo codes
        ├── Apply a promo code during signup
        └── Receive the discount on their plan
```

### Management Matrix

| Action                                | Business | Accounting Firm | Admin |
| ------------------------------------- | :------: | :-------------: | :---: |
| Apply promo code at signup            | ✓        | ✗               | ✗     |
| Create promo codes                    | ✗        | ✓ (within cap)  | ✓     |
| Set any discount %                    | ✗        | ✗               | ✓     |
| Set max discount cap globally         | ✗        | ✗               | ✓     |
| View own codes + referred clients     | ✗        | ✓               | ✓     |
| View ALL codes across all firms       | ✗        | ✗               | ✓     |
| Disable/override any firm's code      | ✗        | ✗               | ✓     |
| Approve high-discount codes           | ✗        | ✗               | ✓     |
| Set commission rates                  | ✗        | ✗               | ✓     |
| View platform-wide referral analytics | ✗        | ✗               | ✓     |

---

## Ideal Scenario — How It Should Work

### 1. Admin Sets the Rules (one-time / occasional)

```
Admin Panel → Referral Settings
  ├── Max Discount Cap:  20%  (firms can't create codes above this)
  ├── Default Discount:  10%  (pre-filled when firms create codes)
  ├── Max Codes Per Firm: 10  (optional limit)
  ├── Commission Rate:   15%  (% of referred user's subscription revenue)
  └── Auto-approve:      ON   (codes within cap are auto-approved)
```

- If a firm tries to create a code with 30% discount and the cap is 20%, the system blocks it with a message: _"Maximum discount allowed is 20%. Contact admin for higher discounts."_
- Admin can manually create codes with any discount (no cap for admin).

### 2. Accounting Firm Creates Codes (self-service)

```
Firm Dashboard → Referrals → Create Promo Code
  ├── Code:       ACME20
  ├── Discount:   20%        (max allowed: 20% — enforced by system)
  ├── Max Uses:   50         (0 = unlimited)
  └── Description: "For Q2 2026 clients"
```

- Code is created **instantly** (if within cap and auto-approve is ON).
- If the firm requests a discount above the cap, the code goes into **"Pending Approval"** status → admin gets a notification.

### 3. Business User Signs Up with Code

```
Signup Page → Role: Business
  ├── Fills in name, email, company, password
  ├── Enters promo code: ACME20
  ├── System validates → shows "20% discount applied! Referred by Acme Accounting"
  ├── Completes signup
  └── Discount is locked into their account
```

### 4. Discount is Applied to Billing

When the business user upgrades to a paid plan:

```
Plan: Professional — $149/mo
Promo Discount:     -20% ($29.80)
────────────────────────────
You Pay:            $119.20/mo (first billing cycle)
```

**Discount application options** (admin-configurable):

| Option | Description |
|--------|-------------|
| First month only | Discount applies to the first billing cycle |
| First 3 months | Discount applies to first 3 billing cycles |
| First year | Discount applies for the first 12 months |
| Lifetime | Discount applies forever (rare, admin-only) |

### 5. Commission Tracking (Admin + Firm)

When a referred user pays for a plan, the referring firm earns a commission:

```
Business User pays:    $119.20/mo (after 20% discount)
Commission Rate:       15%
Firm Earns:            $17.88/mo per referred paying user
```

The accounting firm sees this in their Referrals dashboard. Admin sees aggregated data across all firms.

---

## Admin Panel — Referral Management (Future)

The admin panel should include these sections:

### Referral Settings (Global Config)

```
/admin/settings/referrals
  ├── Max Discount Cap:         [20] %
  ├── Default Discount:         [10] %
  ├── Max Codes Per Firm:       [10]
  ├── Commission Rate:          [15] %
  ├── Discount Duration:        [First 3 months ▼]
  ├── Auto-approve within cap:  [ON]
  └── Save Settings
```

### All Promo Codes (across all firms)

```
/admin/referrals
  ┌──────────┬──────────────┬──────────┬──────┬────────┬──────────┐
  │ Code     │ Firm         │ Discount │ Uses │ Status │ Actions  │
  ├──────────┼──────────────┼──────────┼──────┼────────┼──────────┤
  │ ACME20   │ Acme Acc.    │ 20%      │ 12   │ Active │ ✎ ✗     │
  │ TAXSAVE  │ TaxPro LLC   │ 15%      │ 3    │ Active │ ✎ ✗     │
  │ BIGDEAL  │ Acme Acc.    │ 35%      │ 0    │ Pending│ ✓ ✗     │
  └──────────┴──────────────┴──────────┴──────┴────────┴──────────┘
```

### Pending Approvals

Codes with discount above the cap go here for admin review:

```
BIGDEAL — Acme Accounting wants 35% discount (cap is 20%)
  [Approve] [Reject] [Adjust to 20%]
```

### Referral Analytics (platform-wide)

```
/admin/referrals/analytics
  ├── Total Promo Codes:       47
  ├── Active Codes:            32
  ├── Total Referred Users:    189
  ├── Converted to Paid:       67 (35%)
  ├── Total Revenue from Referrals: $8,200/mo
  ├── Total Commissions Owed:      $1,230/mo
  └── Top Referring Firms:     [chart]
```

---

## Implementation Phases

### Phase 1 — Current (✅ Done)

What we've built so far:

- [x] `ReferralCode` model + `User` referral fields
- [x] CRUD API routes for promo codes
- [x] Promo code validation endpoint (public)
- [x] Signup accepts and processes promo codes
- [x] Accounting firm self-service dashboard (create codes, view referrals)
- [x] Sidebar conditional "Referrals" link
- [x] Signup UI with promo code input + discount badge

### Phase 2 — Admin Controls (Next)

- [ ] Add `ReferralSettings` model (global config: maxDiscount, commissionRate, etc.)
- [ ] Add admin API routes for managing all codes across firms
- [ ] Enforce max discount cap when firms create codes
- [ ] Add "Pending Approval" status for codes above cap
- [ ] Admin notification when approval is needed
- [ ] Admin panel UI for referral settings + code management

### Phase 3 — Billing Integration

- [ ] Apply promo discount to Stripe/payment checkout
- [ ] Configure discount duration (first month, 3 months, etc.)
- [ ] Commission calculation and tracking
- [ ] Commission payout dashboard for firms
- [ ] Admin commission management + payout reports

### Phase 4 — Analytics & Reporting

- [ ] Platform-wide referral analytics (admin)
- [ ] Top referring firms leaderboard
- [ ] Revenue attribution from referrals
- [ ] Conversion funnel (signup → paid) per promo code
- [ ] Export referral reports (CSV/Excel)

---

## Architecture

### Database Models

#### `ReferralCode` (new collection)

| Field             | Type       | Description                                      |
| ----------------- | ---------- | ------------------------------------------------ |
| `code`            | String     | Unique, uppercase (e.g. `ACME20`). 3–30 chars.   |
| `ownerId`         | ObjectId   | References the accounting-firm `User` who created it |
| `discountPercent` | Number     | 1–100. The discount percentage for referred users |
| `maxUses`         | Number     | 0 = unlimited. Max number of times code can be used |
| `usageCount`      | Number     | How many times the code has been redeemed          |
| `isActive`        | Boolean    | Soft-delete toggle. Inactive codes cannot be used  |
| `status`          | String     | `active`, `pending_approval`, `rejected` (Phase 2) |
| `description`     | String     | Optional label for the firm's own reference        |
| `createdAt`       | Date       | Auto-generated                                     |

#### `ReferralSettings` (Phase 2 — global config, single document)

| Field               | Type    | Description                                         |
| ------------------- | ------- | --------------------------------------------------- |
| `maxDiscountCap`    | Number  | Max discount % firms can set (e.g. 20)              |
| `defaultDiscount`   | Number  | Pre-filled default discount (e.g. 10)               |
| `maxCodesPerFirm`   | Number  | 0 = unlimited. Max codes a single firm can create   |
| `commissionRate`    | Number  | % of referred user's subscription revenue (e.g. 15) |
| `discountDuration`  | String  | `first_month`, `first_3_months`, `first_year`, `lifetime` |
| `autoApprove`       | Boolean | Auto-approve codes within the cap, or require manual review |

#### `User` (3 new fields added)

| Field                 | Type       | Description                                        |
| --------------------- | ---------- | -------------------------------------------------- |
| `referredBy`          | ObjectId   | The accounting-firm user who referred this business |
| `appliedPromoCode`    | String     | The promo code string used at signup                |
| `promoDiscountPercent`| Number     | The discount % that was locked in at signup         |

---

## API Endpoints

### Referral Routes (`/api/referrals`)

| Method   | Endpoint                        | Auth       | Description                                  |
| -------- | ------------------------------- | ---------- | -------------------------------------------- |
| `GET`    | `/api/referrals/validate?code=X`| Public     | Validate a promo code. Returns discount %, firm name |
| `POST`   | `/api/referrals`                | Accounting | Create a new promo code                      |
| `GET`    | `/api/referrals`                | Accounting | List all codes + referred users + stats      |
| `PATCH`  | `/api/referrals/:id`            | Accounting | Update code (discount, maxUses, active, desc)|
| `DELETE` | `/api/referrals/:id`            | Accounting | Soft-delete (deactivate) a code              |

### Signup Route (updated)

`POST /api/auth/signup` now accepts an optional `promoCode` field:

```json
{
  "fullName": "John Doe",
  "email": "john@acme.com",
  "password": "securepass",
  "companyName": "Acme Corp",
  "mobile": "+971501234567",
  "role": "business",
  "promoCode": "ACME20"      // ← optional
}
```

**What happens when a promo code is provided:**

1. Code is looked up in `ReferralCode` collection
2. Validated: must exist, be active, and not exceed `maxUses`
3. If invalid → `400` error, signup blocked with message
4. If valid → user is created with `referredBy`, `appliedPromoCode`, `promoDiscountPercent`
5. `usageCount` on the `ReferralCode` document is incremented by 1

---

## Frontend Pages

### Signup Page (`/signup`)

**Role selection** — two cards with clear differences:

| Feature              | Business                     | Accounting Firm               |
| -------------------- | ---------------------------- | ----------------------------- |
| Purpose              | Process my documents         | Manage multiple clients       |
| Promo codes          | Can **apply** promo codes    | Can **create** promo codes    |
| Referral tracking    | ✗                            | ✓ (dedicated dashboard)       |
| Commissions          | ✗                            | ✓ (earn from referrals)       |

**Promo code input** (Business role only):
- Text input + "Apply" button
- Calls `GET /api/referrals/validate?code=ACME20`
- On success → shows green badge: "20% discount applied! Referred by Acme Accounting"
- On failure → shows red error: "Invalid or expired promo code"
- Valid code is sent to backend in the signup API call

### Referrals Dashboard (`/dashboard/referrals`)

Only visible to accounting-firm users (sidebar link hidden for business users).

**Sections:**

1. **Stats Cards** — Total Codes, Active Codes, Total Referrals, Total Redemptions
2. **Promo Codes List** — Each code shows:
   - Code (with copy button)
   - Active/Inactive badge + toggle
   - Discount percentage
   - Usage count (e.g. "5/20 used" or "12 used" if unlimited)
   - Description
   - Delete button
3. **Referred Clients Table** — columns:
   - Client name + email
   - Company name
   - Promo code used
   - Discount applied
   - Current plan
   - Email verification status
   - Join date
4. **Create Promo Code Modal** — form fields:
   - Code (uppercase, alphanumeric)
   - Discount percentage (1–100%)
   - Max uses (0 = unlimited)
   - Description (optional)
5. **How It Works** — 3-step guide (Create → Share → Track)

---

## Flow Diagrams

### Business User Signup with Promo Code

```
Business User                     Frontend                        Backend
     │                               │                               │
     ├── Selects "Business" role ────►│                               │
     ├── Fills signup form ──────────►│                               │
     ├── Types promo code: ACME20 ──►│                               │
     ├── Clicks "Apply" ────────────►│── GET /referrals/validate ───►│
     │                               │◄── { valid, 20%, "Acme" } ───│
     │                               │── Shows discount badge        │
     ├── Clicks "Continue" ─────────►│── POST /auth/signup ─────────►│
     │                               │   (includes promoCode)        │
     │                               │                               ├── Validates code
     │                               │                               ├── Creates user with
     │                               │                               │   referredBy + discount
     │                               │                               ├── Increments usageCount
     │                               │◄── 201 Created ──────────────│
     │◄── Proceeds to OTP step ──────│                               │
```

### Accounting Firm Creating a Promo Code

```
Accounting Firm User              Frontend                        Backend
     │                               │                               │
     ├── Goes to /dashboard/referrals►│                               │
     │                               │── GET /referrals ────────────►│
     │                               │◄── { codes, users, stats } ──│
     │◄── Sees dashboard ────────────│                               │
     ├── Clicks "Create Promo Code" ►│                               │
     ├── Fills: ACME20, 20%, etc ───►│                               │
     ├── Clicks "Create Code" ──────►│── POST /referrals ───────────►│
     │                               │                               ├── Validates uniqueness
     │                               │                               ├── Creates ReferralCode
     │                               │◄── 201 { referral } ─────────│
     │◄── Code appears in list ──────│                               │
```

---

## Role Differences Summary

| Capability                        | Business | Accounting Firm |
| --------------------------------- | :------: | :-------------: |
| Upload & process documents        | ✓        | ✓               |
| AI OCR extraction                 | ✓        | ✓               |
| WhatsApp integration              | ✓        | ✓               |
| Apply promo codes at signup       | ✓        | ✗               |
| Create promo codes                | ✗        | ✓               |
| Referrals dashboard               | ✗        | ✓               |
| Track referred clients            | ✗        | ✓               |
| Earn commissions from referrals   | ✗        | ✓               |
| Sidebar "Referrals" link visible  | ✗        | ✓               |

---

## Files Changed / Created

### Backend (`docuai-api`)

| File | Status | What |
| ---- | ------ | ---- |
| `src/models/ReferralCode.ts` | **New** | Mongoose model for promo codes |
| `src/models/User.ts` | Modified | Added `referredBy`, `appliedPromoCode`, `promoDiscountPercent` fields |
| `src/routes/referrals.ts` | **New** | CRUD routes for promo codes + validation endpoint |
| `src/routes/auth.ts` | Modified | Signup route now validates & applies promo codes; cleaned up duplicate routes |
| `src/server.ts` | Modified | Registered `/api/referrals` route |

### Frontend (`docuai`)

| File | Status | What |
| ---- | ------ | ---- |
| `src/app/signup/page.tsx` | Modified | Role cards with perks, promo code input, discount badge, accounting firm banner |
| `src/components/dashboard/Sidebar.tsx` | Modified | "Referrals" nav item (Gift icon) visible only for accounting-firm users |
| `src/app/dashboard/referrals/layout.tsx` | **New** | Layout with metadata |
| `src/app/dashboard/referrals/page.tsx` | **New** | Full referrals dashboard (stats, codes, clients, create modal) |

---

## Deployment

After merging, both projects need redeployment:

1. **API (AWS EC2)** — rebuild and restart the Express server
2. **Frontend (Vercel)** — `vercel --prod` or push to trigger auto-deploy

No database migration needed — new fields are optional and Mongoose handles schema evolution automatically.
