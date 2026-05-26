# Backend Contract — Financial Engine (Phase 2)

The frontend has been extended to support automatic document classification,
P&L, VAT, and expense categorisation. All UI is live and works against
**existing** data, but to make the financial engine *correct & automatic* the
external Express API (`NEXT_PUBLIC_API_URL = betazone.promaticstechnologies.com/doc-api`)
needs the changes documented below.

---

## 1. Persisted document fields (new)

Extend the document document/Mongo schema with these optional fields. The
frontend already reads them and falls back gracefully if missing.

| Field                     | Type                                       | Notes                                                            |
| ------------------------- | ------------------------------------------ | ---------------------------------------------------------------- |
| `docTypeCode`             | enum                                       | `sales_invoice` \| `expense_invoice` \| `purchase_order` \| `receipt` \| `unknown` |
| `docTypeConfidence`       | number (0–100)                             | AI confidence in the classification                              |
| `docTypeManual`           | boolean                                    | `true` if the user overrode the AI                               |
| `expenseCategory`         | enum                                       | `logistics` \| `marketing` \| `printing` \| `utilities` \| `rent` \| `food_beverage` \| `transport` \| `raw_materials` \| `other` |
| `expenseCategoryManual`   | boolean                                    | `true` if the user overrode the AI                               |
| `financial`               | `FinancialSummary`                         | see below                                                        |

### `FinancialSummary` shape

```ts
{
  currency: string;        // ISO 4217 (e.g. "AED", "USD")
  subtotal: number;        // pre-VAT
  vatRate: number;         // 0–100, e.g. 5
  vatAmount: number;
  grandTotal: number;      // subtotal + vatAmount
  invoiceDate?: string;    // ISO date (YYYY-MM-DD)
  trn?: string;
  counterparty?: string;   // supplier (expenses) OR customer (sales)
  invoiceNumber?: string;
}
```

The existing `docType` (free-text label) **must remain** for back-compat and
should be set to the human label corresponding to `docTypeCode` (e.g.
`"Sales Invoice"`).

---

## 2. Auto-classification logic

When processing a document, the backend must decide `docTypeCode`. Use the
**company profile** (the authenticated tenant) plus the extracted fields:

1. **Compare seller/supplier against company profile.**
   - If the *seller* on the invoice matches the client company (name, TRN, address
     fuzzy-match) → `sales_invoice`.
   - If the *buyer* on the invoice matches the client company → `expense_invoice`.
2. **Document layout signals.**
   - Title contains `purchase order` or `PO #` → `purchase_order`.
   - No tax breakdown, single total, retail receipt format → `receipt`.
3. **Fallback to GPT-4o.** Pass: extracted fields + the company-profile JSON
   (name, TRN, aliases) and ask for one of the five codes plus a confidence
   0–100.

Persist both `docTypeCode` and `docTypeConfidence`.

**Re-classification:** when a user PATCHes `docTypeCode` with `docTypeManual: true`,
**do not overwrite** on re-processing.

---

## 3. Expense categorisation

For documents classified as `expense_invoice` or `receipt`, ask GPT-4o to
choose one of the nine categories above based on `counterparty` + line-item
descriptions. Persist `expenseCategory` and `expenseCategoryManual: false`.

Users can override via `PATCH /api/documents/:id` with
`{ expenseCategory, expenseCategoryManual: true }`. Do not auto-overwrite when
`expenseCategoryManual === true`.

---

## 4. Financial summary extraction

After OCR + structuring, populate `financial` from the extracted fields:

- `currency`: detect from currency code/symbol on the document; default to the
  company's preferred currency (AED for UAE clients).
- `subtotal`: prefer label `Subtotal` / `Net Amount` / `Amount Excluding VAT`.
- `vatRate`, `vatAmount`: from `VAT %` / `VAT Amount` fields. If only one is
  present, derive the other (`vatAmount = subtotal × vatRate / 100`).
- `grandTotal`: prefer `Grand Total` / `Total Amount` / `Total Due`.
- `invoiceDate`: normalise to ISO `YYYY-MM-DD`.
- `trn`, `counterparty`, `invoiceNumber`: best-effort from fields.

Cross-check: `subtotal + vatAmount ≈ grandTotal` (1 currency-unit tolerance).
If mismatch, prefer `grandTotal` and recompute `subtotal = grandTotal − vatAmount`.

---

## 5. API endpoints (changes)

### `GET /api/documents`

The response `documents[]` already returns `ProcessedDocument`. Add the new
fields (`docTypeCode`, `docTypeManual`, `expenseCategory`, `expenseCategoryManual`,
`financial`, `docTypeConfidence`) to every record.

Optional aggregate fields to add to the response root for performance (the
frontend currently computes these client-side and will keep working without
them, but server-side will be more scalable):

```ts
{
  documents: ProcessedDocument[];
  stats: {
    // existing keys ...
    finance?: {
      currency: string;
      revenue: number;
      expenses: number;
      netProfit: number;
      vatCollected: number;
      vatPaid: number;
      vatPayable: number;
    };
  };
}
```

### `PATCH /api/documents/:id`

Already exists for `fields` / `lineItems` / `status`. Extend to accept any of:

```json
{
  "docTypeCode": "sales_invoice",
  "docTypeManual": true,
  "docType": "Sales Invoice",
  "expenseCategory": "logistics",
  "expenseCategoryManual": true,
  "financial": { /* FinancialSummary */ }
}
```

When `financial` is patched, re-validate `subtotal + vatAmount = grandTotal`
and round to 2dp. When `docTypeCode` changes from/to `purchase_order`, the
document toggles in/out of P&L automatically (no extra work — frontend filters).

### New (optional) endpoints

Frontend works without these but they make reporting cheaper:

- `GET /api/finance/summary?from=YYYY-MM-DD&to=YYYY-MM-DD&currency=AED`
  → returns the same shape as `stats.finance` above.
- `GET /api/finance/monthly?from=YYYY-MM-DD&to=YYYY-MM-DD`
  → returns `MonthlyBucket[]` (month, salesAmount, salesVat, expenseAmount, expenseVat, netVat, netProfit).
- `GET /api/finance/categories` → `CategoryBucket[]` (category, amount, vat, count).
- `GET /api/finance/export?format=xlsx|csv|pdf&report=vat|pnl|ledger`
  → server-rendered file. Frontend already has client-side equivalents.

---

## 6. Company profile

For the seller/buyer matcher you need a per-tenant company profile. If one
doesn't exist yet, add:

```ts
GET  /api/company/profile
POST /api/company/profile  // body: { name, aliases[], trn, address, currency }
```

The UI for editing this can live in `/dashboard/settings` (existing page) or
`/dashboard/company` (already in the workspace tree).

---

## 7. Migration notes

- Existing documents will arrive with no `docTypeCode`. The frontend falls back
  to a regex normaliser (`resolveDocTypeCode` in `src/lib/finance.ts`) that maps
  the legacy `docType` string. To migrate, run a one-off backfill that:
  1. Reads each document.
  2. If `docTypeCode` is missing, applies the same regex (or AI classifier) and
     persists it.
- `financial` likewise has a frontend fallback (`deriveFinancialSummary`) — but
  the values it derives are best-effort. A backfill that runs the proper
  extraction will give much better dashboard numbers.

---

## 8. Frontend additions (already shipped, no backend dependency)

- **Sidebar →** new "Financial" entry under Documents.
- `/dashboard/finance` — KPI cards, monthly trends, category breakdown, recent
  sales / expenses / POs, export menu.
- `/dashboard/finance/vat` — VAT Summary report (monthly income + monthly
  expenses + final VAT calculation).
- `/dashboard/finance/pnl` — P&L statement + expenses-by-category.
- `/dashboard/documents` — new "Type" filter + inline doc-type dropdown
  (colour-coded: 🟢 Sales / 🔴 Expense / 🟡 PO / 🔵 Receipt).
- `/dashboard/review` — inline doc-type dropdown in the header, financial-summary
  card, expense-category dropdown for expenses/receipts.
- Exports: VAT Summary (xlsx, csv, pdf), P&L (xlsx, csv), Accounting Ledger (csv).

All client-side computation lives in
[src/lib/finance.ts](src/lib/finance.ts) and
[src/lib/financeExport.ts](src/lib/financeExport.ts).
