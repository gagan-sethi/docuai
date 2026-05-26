import type {
  CategoryBucket,
  FinancialTotals,
  MonthlyBucket,
} from "./finance";
import {
  aggregateTotals,
  buildCategoryBuckets,
  buildMonthlyBuckets,
  deriveFinancialSummary,
  formatMoney,
  resolveDocTypeCode,
} from "./finance";
import type { ProcessedDocument } from "./types";

// ─── CSV helpers ────────────────────────────────────────────────

function csvEscape(v: unknown): string {
  const s = v == null ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rowsToCsv(rows: Array<Array<unknown>>): string {
  return rows.map((r) => r.map(csvEscape).join(",")).join("\n");
}

function downloadBlob(content: string | Blob, filename: string, mime: string) {
  const blob =
    typeof content === "string"
      ? new Blob([content], { type: `${mime};charset=utf-8` })
      : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ─── VAT Summary Report (CSV) ───────────────────────────────────

export function buildVatSummaryCsv(docs: ProcessedDocument[]): string {
  const totals = aggregateTotals(docs);
  const monthly = buildMonthlyBuckets(docs);
  const rows: Array<Array<unknown>> = [];

  rows.push(["VAT SUMMARY REPORT"]);
  rows.push(["Generated", new Date().toISOString()]);
  rows.push(["Currency", totals.currency]);
  rows.push([]);

  rows.push(["VAT INCOME (Sales Invoices)"]);
  rows.push(["Month", "Sales Total", "VAT Collected"]);
  for (const m of monthly) {
    if (m.salesAmount === 0 && m.salesVat === 0) continue;
    rows.push([m.monthLabel, m.salesAmount.toFixed(2), m.salesVat.toFixed(2)]);
  }
  rows.push(["TOTAL", totals.revenue.toFixed(2), totals.vatCollected.toFixed(2)]);
  rows.push([]);

  rows.push(["VAT EXPENSES (Expense Invoices + Receipts)"]);
  rows.push(["Month", "Expense Total", "VAT Paid"]);
  for (const m of monthly) {
    if (m.expenseAmount === 0 && m.expenseVat === 0) continue;
    rows.push([m.monthLabel, m.expenseAmount.toFixed(2), m.expenseVat.toFixed(2)]);
  }
  rows.push(["TOTAL", totals.expenses.toFixed(2), totals.vatPaid.toFixed(2)]);
  rows.push([]);

  rows.push(["FINAL VAT CALCULATION"]);
  rows.push(["VAT Collected", totals.vatCollected.toFixed(2)]);
  rows.push(["VAT Paid", totals.vatPaid.toFixed(2)]);
  rows.push(["TOTAL VAT PAYABLE", totals.vatPayable.toFixed(2)]);

  return rowsToCsv(rows);
}

export function downloadVatSummaryCsv(docs: ProcessedDocument[]) {
  const csv = buildVatSummaryCsv(docs);
  const stamp = new Date().toISOString().slice(0, 10);
  downloadBlob(csv, `vat-summary-${stamp}.csv`, "text/csv");
}

// ─── P&L Report (CSV) ───────────────────────────────────────────

export function buildPnlCsv(docs: ProcessedDocument[]): string {
  const totals = aggregateTotals(docs);
  const monthly = buildMonthlyBuckets(docs);
  const categories = buildCategoryBuckets(docs);
  const rows: Array<Array<unknown>> = [];

  rows.push(["PROFIT & LOSS STATEMENT"]);
  rows.push(["Generated", new Date().toISOString()]);
  rows.push(["Currency", totals.currency]);
  rows.push([]);

  rows.push(["Month", "Revenue", "Expenses", "Net Profit"]);
  for (const m of monthly) {
    rows.push([
      m.monthLabel,
      m.salesAmount.toFixed(2),
      m.expenseAmount.toFixed(2),
      m.netProfit.toFixed(2),
    ]);
  }
  rows.push([
    "TOTAL",
    totals.revenue.toFixed(2),
    totals.expenses.toFixed(2),
    totals.netProfit.toFixed(2),
  ]);
  rows.push([]);

  rows.push(["EXPENSES BY CATEGORY"]);
  rows.push(["Category", "Amount", "VAT", "Documents"]);
  for (const c of categories) {
    rows.push([c.label, c.amount.toFixed(2), c.vat.toFixed(2), c.count]);
  }

  return rowsToCsv(rows);
}

export function downloadPnlCsv(docs: ProcessedDocument[]) {
  const csv = buildPnlCsv(docs);
  const stamp = new Date().toISOString().slice(0, 10);
  downloadBlob(csv, `profit-loss-${stamp}.csv`, "text/csv");
}

// ─── Accounting-ready ledger (CSV) ──────────────────────────────

export function buildLedgerCsv(docs: ProcessedDocument[]): string {
  const rows: Array<Array<unknown>> = [];
  rows.push([
    "Date",
    "Type",
    "Invoice #",
    "Counterparty",
    "TRN",
    "Currency",
    "Subtotal",
    "VAT %",
    "VAT Amount",
    "Grand Total",
    "Category",
    "Status",
    "File",
  ]);
  for (const d of docs) {
    const code = resolveDocTypeCode(d);
    const fin = deriveFinancialSummary(d);
    rows.push([
      fin.invoiceDate || d.createdAt.slice(0, 10),
      code,
      fin.invoiceNumber || "",
      fin.counterparty || "",
      fin.trn || "",
      fin.currency,
      fin.subtotal.toFixed(2),
      fin.vatRate.toFixed(2),
      fin.vatAmount.toFixed(2),
      fin.grandTotal.toFixed(2),
      d.expenseCategory || "",
      d.status,
      d.fileName,
    ]);
  }
  return rowsToCsv(rows);
}

export function downloadLedgerCsv(docs: ProcessedDocument[]) {
  const csv = buildLedgerCsv(docs);
  const stamp = new Date().toISOString().slice(0, 10);
  downloadBlob(csv, `ledger-${stamp}.csv`, "text/csv");
}

// ─── Excel (xlsx via ExcelJS) ───────────────────────────────────

export async function downloadVatSummaryXlsx(docs: ProcessedDocument[]) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const totals = aggregateTotals(docs);
  const monthly = buildMonthlyBuckets(docs);

  const headerStyle = {
    font: { bold: true, color: { argb: "FFFFFFFF" } },
    fill: {
      type: "pattern" as const,
      pattern: "solid" as const,
      fgColor: { argb: "FF1E3A8A" },
    },
    alignment: { horizontal: "center" as const },
  };

  // Summary sheet
  const s = wb.addWorksheet("VAT Summary");
  s.columns = [
    { header: "", width: 28 },
    { header: "", width: 18 },
    { header: "", width: 18 },
  ];
  s.addRow(["VAT SUMMARY REPORT"]);
  s.getRow(1).font = { bold: true, size: 14 };
  s.mergeCells("A1:C1");
  s.addRow(["Currency", totals.currency]);
  s.addRow(["Generated", new Date().toLocaleString("en-GB")]);
  s.addRow([]);

  s.addRow(["VAT INCOME — Sales Invoices"]).font = { bold: true };
  const h1 = s.addRow(["Month", "Sales Total", "VAT Collected"]);
  h1.eachCell((c) => Object.assign(c, headerStyle));
  for (const m of monthly) {
    if (m.salesAmount || m.salesVat) s.addRow([m.monthLabel, m.salesAmount, m.salesVat]);
  }
  const tIncome = s.addRow(["TOTAL", totals.revenue, totals.vatCollected]);
  tIncome.font = { bold: true };
  s.addRow([]);

  s.addRow(["VAT EXPENSES — Expense Invoices & Receipts"]).font = { bold: true };
  const h2 = s.addRow(["Month", "Expense Total", "VAT Paid"]);
  h2.eachCell((c) => Object.assign(c, headerStyle));
  for (const m of monthly) {
    if (m.expenseAmount || m.expenseVat) s.addRow([m.monthLabel, m.expenseAmount, m.expenseVat]);
  }
  const tExp = s.addRow(["TOTAL", totals.expenses, totals.vatPaid]);
  tExp.font = { bold: true };
  s.addRow([]);

  s.addRow(["FINAL VAT CALCULATION"]).font = { bold: true };
  s.addRow(["VAT Collected", totals.vatCollected]);
  s.addRow(["VAT Paid", totals.vatPaid]);
  const payable = s.addRow(["TOTAL VAT PAYABLE", totals.vatPayable]);
  payable.font = { bold: true, color: { argb: "FFFFFFFF" } };
  payable.eachCell((c) => {
    c.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: totals.vatPayable >= 0 ? "FF059669" : "FFDC2626" },
    };
  });

  // Format currency columns
  s.getColumn(2).numFmt = "#,##0.00";
  s.getColumn(3).numFmt = "#,##0.00";

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const stamp = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `vat-summary-${stamp}.xlsx`, "application/vnd.ms-excel");
}

export async function downloadPnlXlsx(docs: ProcessedDocument[]) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const totals = aggregateTotals(docs);
  const monthly = buildMonthlyBuckets(docs);
  const categories = buildCategoryBuckets(docs);

  const s = wb.addWorksheet("Profit & Loss");
  s.columns = [
    { header: "", width: 22 },
    { header: "", width: 16 },
    { header: "", width: 16 },
    { header: "", width: 16 },
  ];
  s.addRow(["PROFIT & LOSS STATEMENT"]).font = { bold: true, size: 14 };
  s.mergeCells("A1:D1");
  s.addRow(["Currency", totals.currency]);
  s.addRow([]);

  const h = s.addRow(["Month", "Revenue", "Expenses", "Net Profit"]);
  h.eachCell((c) => {
    c.font = { bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E3A8A" },
    };
  });
  for (const m of monthly) {
    s.addRow([m.monthLabel, m.salesAmount, m.expenseAmount, m.netProfit]);
  }
  const tr = s.addRow(["TOTAL", totals.revenue, totals.expenses, totals.netProfit]);
  tr.font = { bold: true };
  s.addRow([]);

  s.addRow(["EXPENSES BY CATEGORY"]).font = { bold: true };
  const hc = s.addRow(["Category", "Amount", "VAT", "Documents"]);
  hc.eachCell((c) => {
    c.font = { bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
  });
  for (const c of categories) {
    s.addRow([c.label, c.amount, c.vat, c.count]);
  }

  ["B", "C", "D"].forEach((col) => {
    s.getColumn(col).numFmt = "#,##0.00";
  });

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const stamp = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `profit-loss-${stamp}.xlsx`, "application/vnd.ms-excel");
}

// ─── PDF (print-window technique) ───────────────────────────────

/**
 * Lightweight PDF export — opens a print-ready window the user can save as
 * PDF via the browser. Avoids pulling in a heavy jsPDF dependency.
 */
export function printVatSummary(docs: ProcessedDocument[]) {
  const totals = aggregateTotals(docs);
  const monthly = buildMonthlyBuckets(docs);
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return;

  const incomeRows = monthly
    .filter((m) => m.salesAmount || m.salesVat)
    .map(
      (m) =>
        `<tr><td>${m.monthLabel}</td><td class="num">${formatMoney(m.salesAmount, totals.currency)}</td><td class="num">${formatMoney(m.salesVat, totals.currency)}</td></tr>`
    )
    .join("");
  const expenseRows = monthly
    .filter((m) => m.expenseAmount || m.expenseVat)
    .map(
      (m) =>
        `<tr><td>${m.monthLabel}</td><td class="num">${formatMoney(m.expenseAmount, totals.currency)}</td><td class="num">${formatMoney(m.expenseVat, totals.currency)}</td></tr>`
    )
    .join("");

  win.document.write(`<!doctype html><html><head><title>VAT Summary</title>
<style>
  body { font-family: -apple-system, system-ui, sans-serif; padding: 32px; color: #0f172a; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 14px; margin: 24px 0 8px; color: #334155; text-transform: uppercase; letter-spacing: 0.06em; }
  .meta { color: #64748b; font-size: 12px; margin-bottom: 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border-bottom: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; }
  th { background: #f1f5f9; font-weight: 600; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .total td { font-weight: 700; background: #f8fafc; }
  .payable { margin-top: 24px; padding: 16px; border-radius: 8px; background: ${totals.vatPayable >= 0 ? "#dcfce7" : "#fee2e2"}; }
  .payable .row { display: flex; justify-content: space-between; font-size: 14px; padding: 4px 0; }
  .payable .total { font-size: 18px; font-weight: 700; border-top: 1px solid rgba(0,0,0,0.1); margin-top: 8px; padding-top: 12px; }
</style></head><body>
<h1>VAT Summary Report</h1>
<div class="meta">Generated ${new Date().toLocaleString("en-GB")} · Currency ${totals.currency}</div>

<h2>VAT Income — Sales Invoices</h2>
<table><thead><tr><th>Month</th><th class="num">Sales Total</th><th class="num">VAT Collected</th></tr></thead>
<tbody>${incomeRows || '<tr><td colspan="3" style="color:#94a3b8">No sales invoices.</td></tr>'}
<tr class="total"><td>Total</td><td class="num">${formatMoney(totals.revenue, totals.currency)}</td><td class="num">${formatMoney(totals.vatCollected, totals.currency)}</td></tr>
</tbody></table>

<h2>VAT Expenses — Expense Invoices &amp; Receipts</h2>
<table><thead><tr><th>Month</th><th class="num">Expense Total</th><th class="num">VAT Paid</th></tr></thead>
<tbody>${expenseRows || '<tr><td colspan="3" style="color:#94a3b8">No expense invoices.</td></tr>'}
<tr class="total"><td>Total</td><td class="num">${formatMoney(totals.expenses, totals.currency)}</td><td class="num">${formatMoney(totals.vatPaid, totals.currency)}</td></tr>
</tbody></table>

<div class="payable">
  <div class="row"><span>VAT Collected</span><span>${formatMoney(totals.vatCollected, totals.currency)}</span></div>
  <div class="row"><span>VAT Paid</span><span>${formatMoney(totals.vatPaid, totals.currency)}</span></div>
  <div class="row total"><span>Total VAT Payable</span><span>${formatMoney(totals.vatPayable, totals.currency)}</span></div>
</div>
</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

export type { FinancialTotals, MonthlyBucket, CategoryBucket };
