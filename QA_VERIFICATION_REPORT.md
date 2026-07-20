# Independent QA Verification Report

Date: 2026-07-20
Scope: `docuai` (Next.js frontend) and `docuai-api` (Express backend), verified against the
live beta environment `https://betazone.promaticstechnologies.com/doc-api`.

Verification method: full code audit of both repositories (every finance, auth, usage,
billing and tenant-scoping path), plus live API reproduction with a throwaway QA account
(`qa-verify-20260720@mailinator.com` — created on the beta environment for this test; it can
be deleted).

Summary of outcomes:

| # | QA item | Verdict | Status |
|---|---|---|---|
| 1 | Finance API 401s | **Confirmed — auth transport defect** | Fixed |
| 2 | Frontend financial calculations | **Confirmed — partially still client-side** | Fixed (aggregation); display-only derivation documented |
| 3 | Cross-page reconciliation | **Confirmed — filters diverged** | Fixed |
| 4 | Eligibility rules | **Confirmed — review docs counted in analytics** | Fixed |
| 5 | Purchase Order classification | **Confirmed — POs became expense invoices** | Fixed |
| 6 | AI categorization | **Working as designed, with a known gap** | Verified; gap documented |
| 7 | Usage counters | **Confirmed — WhatsApp page leak + counting asymmetry** | Partially fixed; rest documented |
| 8 | Billing/subscription | **Confirmed — model gap (no company dimension)** | Documented (design decision needed) |
| 9 | Tenant isolation | **One confirmed vector (WhatsApp phone match)** | Fixed; hardening list documented |
| 10 | Final verification | — | This report |

---

## 1. Finance API returning 401

**Is it expected?** 401 without credentials is expected — every `/api/finance/*` route
requires auth (`src/routes/finance.ts`). The defect is that a *logged-in browser user*
could hit it.

**Root cause (confirmed).** Authentication relied exclusively on a cookie set by the API
domain with `SameSite=None; Secure` (`docuai-api/src/routes/auth.ts:230-236`). The app runs
on `docuai-pearl.vercel.app` while the API runs on `betazone.promaticstechnologies.com` —
a cross-site request, so the auth cookie is a **third-party cookie**. Safari (ITP), Chrome
Incognito, Firefox strict mode and Chrome's third-party-cookie phase-out silently drop it;
every API call then returns 401 even though login itself returned 200. The login/signup
responses already include the JWT in the JSON body and the backend already accepts
`Authorization: Bearer` (`src/lib/auth.ts:89-93`), but the frontend never stored or sent
it — no `Authorization` header existed anywhere in the frontend. A second contributor: the
cookie's `maxAge` is `sessionTimeoutHours` (default 8h), so sessions also die mid-day
without any refresh.

There was **no client-side calculation fallback on 401** (see item 2) — what QA saw as a
"fallback" were the independent client-computed surfaces that render from `/api/documents`
data.

**Evidence.**
- Endpoints work whenever credentials arrive: live test with a fresh account returned
  `200` for `/api/finance/summary`, `/api/finance/report`, `/api/documents` with the
  session cookie, and `401` without.
- After the fix, **Bearer-only (no cookie at all)**: `finance/summary → 200`,
  `finance/report → 200`, `documents/analytics → 200` against the live API.

**Resolution implemented (frontend).**
- [api.ts](src/lib/api.ts): token persistence (`setAuthToken`/`getAuthToken`/`clearAuthToken`),
  an `apiFetch()` wrapper that attaches `Authorization: Bearer` + `credentials: "include"`,
  and `downloadApiFile()` for authenticated file downloads.
- All **102** `fetch(apiUrl(...))` call sites across 34 files migrated to `apiFetch`.
- Login, Google login and signup now store the returned token
  ([login/page.tsx:65,149](src/app/login/page.tsx#L149), signup page); logout clears it
  (TopBar, Sidebar, settings); `handleUnauthorized` clears it before redirecting.
- All 11 finance export `window.open(...)` calls and 7 per-document Excel links now
  download via `downloadApiFile` (window.open/anchor navigation cannot carry a header).

**Deployment note.** For exports and any cookie-only flows to also work in old bundles,
keep `FRONTEND_URL` in the API env aligned with the deployed frontend origin (CORS +
CSRF origin guard depend on it).

## 2. Frontend financial calculations

**Verdict: not fully removed (confirmed), now corrected at the aggregation level.**

What was actually true before this audit:
- The three financial pages (Finance dashboard, P&L, VAT) already consumed
  `GET /api/finance/report` and rendered backend aggregates ([financeApi.ts](src/lib/financeApi.ts)).
  There is **no** 401→client-recalculation fallback; on failure the page shows zeros.
- However a complete client finance engine still shipped and ran:
  - `src/lib/finance.ts` (`aggregateTotals`, `buildMonthlyBuckets`, `buildCategoryBuckets`,
    `deriveFinancialSummary`) — still used for per-document amounts in the finance page's
    Recent lists, the Documents-page CSV/XLSX/PDF export (`src/lib/financeExport.ts`),
    the review page's Financial Summary card, and merge-CSV Subtotal/VAT/Total backfill
    (`src/lib/csvUtils.ts:682-736`).
  - A dead legacy page `src/app/dashboard/analytics/oldPage.tsx` computed everything
    client-side. **Deleted in this pass** (unrouted, unreferenced).

**Position after fixes.** All *aggregate* figures on financial surfaces come from
`/api/finance/report` and `/api/documents/analytics` (both backend-computed). Remaining
client-side arithmetic is per-document display derivation (showing one document's own
extracted totals) and the merge-CSV preview tool — these do not feed any financial report.
Recommended follow-up if you want a strict "zero client arithmetic" guarantee: serve the
Documents-page export and merge-preview totals from a backend endpoint as well.

## 3. Financial reconciliation across pages

**Confirmed.** The pages could disagree because their queries and headline rules diverged.
Root causes found and fixed in `docuai-api/src/routes/finance.ts`:

| Divergence | Before | Fix |
|---|---|---|
| Eligible types | `approvedFinancialQuery` included `purchase_order`, while the aggregators and the API's own `purchaseOrdersIncluded: false` contract excluded them — POs appeared in document counts, report samples, ledger/CSV/XLSX/PDF export rows (with VAT/gross populated) | `purchase_order` removed from the query; the query now matches `isCanonicalFinancialDocument` exactly |
| `/finance/monthly` | additionally required `financial.invoiceDate` to exist — documents without an invoice date were in `/summary` totals but missing from monthly rows | extra `$exists` filter removed; such documents bucket by upload month, same set as `/summary`/`/report` |
| Headline currency | `/summary` and `/export` used `totalsByCurrency[0]` (alphabetical) while `/monthly`/`/categories` used the most-frequent currency | all endpoints now select the primary (most frequent) currency row |
| `/finance/categories` | `totalExpenses` summed net amounts **across mixed currencies** | now sums only the reported currency |
| `/finance/insights` | an `$or` arm (`docType: {$exists: true}`) made the type restriction confusing/redundant | removed; the canonical query governs |

`/api/documents/analytics` previously used a completely different basis (all statuses,
`createdAt` dates, gross amounts) — addressed under item 4.

**Evidence:** backend test `P&L, VAT, monthly summaries, categories, and currencies remain
consistent` plus the full 14-test regression suite pass after the change. Dashboard, P&L,
VAT, exports and the JSON APIs now all derive from one query
(`approvedFinancialQuery`) and one aggregation module (`financialReporting.ts`).

## 4. Financial eligibility rules

**Confirmed.** The canonical rule (approved + reconciled + sales/expense/receipt) existed
(`financialReporting.ts:29-41`) but two surfaces bypassed it:

1. `GET /api/documents/analytics` summed **every** document — review, rejected, error,
   purchase orders, unknown — into `totalAmount`, `totalVat`, monthly VAT and supplier
   amounts (`src/lib/analytics.ts`). This is exactly QA's "documents under review affect
   dashboard totals". **Fixed:** `computeAnalytics` now applies `isMoneyEligible()`
   (mirror of the canonical rule) to every money metric, while operational counts
   (status breakdown, daily volume, type/source mix, confidence) still cover all documents.
2. `financialIntelligence.isCountedForIntelligence` accepted `review` status. **Fixed:**
   approved only.

After these fixes plus item 3, review documents, rejected documents, purchase orders,
unknown types, and invalid reconciliations are excluded from **every** money figure:
finance summary/report/monthly/categories/insights/exports and documents-analytics.
(The admin ops dashboard's `usage-summary` intentionally still counts review documents as
*workload*, not money.)

## 5. Purchase Order classification

**Confirmed, and it was the worst finance bug found.** Root cause chain in
`src/lib/financialClassification.ts`:
- PO detection (Rule 1) only looked at the *extracted* title/doc-type for the literal
  strings `"purchase order"` / `"po #"`; file names were ignored by design.
- On a purchase order, the company itself is the buyer — so any PO whose OCR title missed
  Rule 1 fell into Rule 2 ("buyer matches company → `expense_invoice`, confidence 96"),
  which is **above** the auto-approve threshold (95). With valid reconciliation the PO was
  auto-approved and counted as a real expense in every report.
- Compounding it, `approvedFinancialQuery` itself admitted `purchase_order` (item 3).

**Resolution.**
- Rule 1 now also treats a PO-number field label (`purchase order number`, `P.O. no`, …)
  or a PO-styled file name (`purchase order`, `PO_123`, …) as decisive PO evidence, and it
  runs **before** the buyer-match rule.
- Even a still-misclassified PO can no longer reach financial reports: correctly-typed POs
  are excluded by the query and by all aggregators.

**Can POs ever enter financial reports?** No. They are visible in the UI (pending-PO list,
document counts) but never in revenue/expense/VAT/ledger figures.

## 6. AI expense categorization

**Verdict: implemented and live, with one dominant failure path explaining QA's "everything
is Other".**

Verified against code (all in `docuai-api`):
- **Executes:** categorization runs in both live paths — `routes/process.ts` (§ expense
  classification, gated on `expense_invoice`/`receipt`) and the WhatsApp worker.
- **Confidence stored:** `expenseCategory`, `expenseCategoryConfidence`,
  `expenseCategoryManual` persist on `DocumentRecord` (schema-validated) and surface in the
  UI as the "AI n%" badge.
- **Manual corrections feed back:** `PATCH /documents/:id` marks corrections
  (`expenseCategoryManual: true`, confidence forced to 100);
  `findExpenseCategoryLearningHints` queries past manual/approved documents by supplier and
  content similarity and injects them into the AI prompt and as the preferred fallback.
- **Supplier learning:** implicit (similarity over past documents' counterparty/fields) —
  no separate supplier table. Works when supplier extraction is consistent; scoped per
  workspace and selected company.
- **Beyond "Other":** the taxonomy (29 categories) and rule fallback are capable; the
  "Other" pile comes from documents that never reach the categorizer.

**The gap:** if document-type classification returns `unknown` (typically: no company
profile configured to match buyer/seller AND the AI call fails or is unconfigured), the
category gate never opens; `expenseCategory` stays undefined and every reporting layer
coalesces it to `uncategorized`, whose group label is "Other". The PO fix (item 5) also
reduces `unknown` outcomes. Operational recommendations: ensure a company profile is set
for each workspace (it drives Rule 2) and monitor documents with `docTypeCode: "unknown"`.

## 7. Usage counters

**Confirmed discrepancies; root causes identified, the unambiguous ones fixed.**

Counters live on the workspace owner (`documentsUsedThisMonth`, `pagesUsedThisMonth`,
`storageUsedBytes`) with one atomic reserve/release path (`lib/planLimits.ts`).

Fixed in this pass:
- **WhatsApp page leak (fixed):** WhatsApp documents stored their page count only in
  `whatsappPageCount`; deletion released `pageCount || 1`, permanently leaking N−1 pages
  per deleted multi-page WhatsApp document. Creation now stamps `pageCount` as well, and
  the delete path releases `pageCount || whatsappPageCount || 1`
  ([documents.ts delete route](../docuai-api/src/routes/documents.ts)).
- Delete now also scopes the DB delete by owner (defense in depth).

Documented, needs a product decision (not silently changed):
- **Web vs WhatsApp counting asymmetry:** a 10-page PDF uploaded on the web is split into
  10 documents (counts 10 docs/10 pages); the same PDF via WhatsApp is one document
  (1 doc/10 pages). Both are self-consistent but produce different "documents used" for
  identical activity.
- **Failed processing still consumes quota:** usage is reserved at upload; OCR/processing
  failures do not release it (OCR attempts are separately recorded in `OcrMonitoring`, so
  admin "OCR usage" and plan counters legitimately differ).
- Deleting documents from a previous month decrements the *current* month's counters
  (upload→delete→upload can recycle quota).
- Admin dashboard's `whatsappUploads` counts DocumentRecords (all-time) — a different
  source of truth than plan counters by design.

## 8. Billing and subscription data

**Confirmed anomaly root causes; these are model/display issues, not data corruption. No
code changed here without your sign-off, because each has product implications.**

- **Company association:** `Subscription` and `Payment` have **no company field at all** —
  billing is keyed to the workspace owner (`userId`). Any UI/report showing a company next
  to a payment derives it from the payer's *current* profile, so multi-company owners or
  renamed companies display a "wrong" company on historical records. Recommendation: stamp
  `companyId`/`companyName` snapshot on `Payment` at creation.
- **Plan pricing displays:**
  - Campaign discounts are applied as a one-off negative invoice item on the **first**
    invoice only, while price lists show the discounted price without a "first period"
    qualifier — renewals bill full price and look "wrong".
  - The marketing pricing component double-divides some amounts: backend `/plan/list`
    already returns major units, but `Pricing.tsx` heuristically treats yearly amounts
    ≥ 1000 as cents (a $1,188/yr plan can display as $11.88). Recommendation: delete the
    minor-unit heuristic and trust the API's units.
  - Some modals hardcode USD formatting regardless of `plan.currency`.
  - `Payment` documents mix minor units (checkout path) and major units (webhook path) in
    the `amountDue/amountPaid` fields; `Payment.amount` itself is consistent. Reports must
    not sum the mixed fields.
- **Webhook attribution is safe:** Stripe webhooks resolve strictly via
  `stripeSubscriptionId`/`stripeInvoiceId` with unique sparse indexes and event-ID
  idempotency — no email/customer-based cross-account attachment exists. One residual risk:
  an invoice arriving before the local Subscription record exists is skipped and marked
  processed (payment permanently missing locally); worth a retry/backfill.
- **Tenant isolation in billing:** payments/spend queries are owner-scoped. Note that any
  teammate (not just the owner) can read the workspace's payment history.

## 9. Company / tenant isolation

**One concrete cross-tenant vector confirmed and closed; overall scoping is sound.**

- **Fixed — WhatsApp phone matching:** inbound documents were matched to a user with a
  *last-10-digit suffix regex*, so two users sharing the same national number with
  different country codes could receive each other's documents. Now exact normalized
  matches only ([whatsapp-webhook.ts](../docuai-api/src/routes/whatsapp-webhook.ts)).
- **Fixed — merge-CSV fail-open:** a document record with a missing `userId` was mergeable
  by anyone; ownership check now fails closed.
- **Fixed — delete scoping:** `DELETE /documents/:id` now deletes with
  `{documentId, userId}` instead of relying solely on the earlier read check.
- Verified sound: documents/finance/batches/company/team/notifications/support/referrals
  routes all scope queries by `workspaceOwnerId(user)` (+ validated `selectedCompanyId`);
  the company-switch cookie is verified against ownership before being honored
  (`lib/auth.ts:116-133`); backend test *"document APIs enforce workspace and company
  isolation"* and *"forged company selection is ignored"* pass.
- **Hardening backlog (recommended before GA):**
  1. Verify Meta's `X-Hub-Signature-256` on the WhatsApp webhook (currently any
     well-shaped POST is accepted; can burn quota/AI spend).
  2. Verify phone ownership (OTP) when a user links a WhatsApp number.
  3. Namespace S3 keys per workspace and sanitize file names (isolation currently rests on
     UUID unguessability; objects are addressable via the public media base URL).
  4. `POST /plan/payment` accepts a plan-invitation token as a full bearer credential
     (single-use and entropy-checked, but consider requiring a matching session).
  5. WhatsApp documents carry no `companyId`; company-filtered views special-case them in
     the list route but not in every single-document route.

## 10. Verification summary and evidence

**Code changes (docuai-api):** `routes/finance.ts`, `routes/documents.ts`,
`routes/whatsapp-webhook.ts`, `routes/merge-csv.ts`, `lib/analytics.ts`,
`lib/financialClassification.ts`, `lib/financialIntelligence.ts`.
**Code changes (docuai):** `lib/api.ts` (new auth layer), 34 files migrated to `apiFetch`
(102 call sites), token wiring in login/signup/logout, 18 export/download sites made
header-authenticated, dead `analytics/oldPage.tsx` removed.

**Test evidence:**
- `docuai-api`: `npx tsc --noEmit` clean; `npm run build` clean; `npm test` — **14/14 pass**,
  including tenant-isolation, CSRF-origin, canonical-finance-consistency, Stripe
  idempotency and money-precision suites.
- `docuai`: `npx tsc --noEmit` clean; `npm run lint` clean.
- Live API (beta): unauthenticated `/api/finance/summary` → 401 (expected);
  cookie-authenticated → 200; **Bearer-only, no cookie → 200** on
  `finance/summary`, `finance/report`, `documents/analytics` (proves the 401 class of
  failure is eliminated even with third-party cookies blocked).

**Independent testing still recommended before launch** (needs real tenant data or Meta
credentials, so not executable from this environment):
- Browser E2E in Safari/Incognito against staging (validates the cookie-blocked path in situ).
- Re-run QA's original dataset and diff Dashboard vs P&L vs VAT vs Export figures.
- A labelled OCR/AI evaluation set for categorization quality (beyond structural checks).
- Backfill/cleanup pass on existing data: documents already misclassified as
  `expense_invoice` that are POs, and inflated `pagesUsedThisMonth` from past WhatsApp
  deletions, will not fix themselves retroactively.

Cleanup note: delete the QA test account `qa-verify-20260720@mailinator.com` from the beta
database when convenient.
