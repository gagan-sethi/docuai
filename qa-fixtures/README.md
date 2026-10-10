# Phase 2 OCR test corpus

23 documents with **known expected values**, so an extraction run can be
scored objectively instead of judged by eye.

Built for the test plan in section 7 of the Oct 2026 Customer Portal QA
report: *"about 15 test files with known totals: English and Arabic
invoices, a multi-page PDF, JPG/PNG/TIFF, a blurry phone photo, a
duplicate, an invalid .exe, a 25 MB file. Covers AED, USD, EUR, GBP and
SAR, plus the four document types."*

## Using it

1. Upload everything in `files/` to a **test workspace** — never production.
2. For each document, compare what the portal extracted against the row for
   that filename in `expected.csv`.
3. Record a pass only where the extracted value matches exactly. For the
   `F` fixtures, a pass means the file was **rejected with a clear
   message** — not that it was processed.

`expected.json` carries the same data for scripted comparison.

### Regenerating

```bash
pip install reportlab pillow arabic-reshaper python-bidi
python3 generate.py     # rewrites files/ and both manifests
python3 verify.py       # checks the output is structurally sound
```

One fixture is not committed: `F06-oversized-25mb.pdf` is 26 MB of random
padding, so it is generated rather than stored. Run `generate.py` before
testing upload limits.

## What each group covers

**A — clean baselines (5 files).** One per currency (AED, USD, EUR, GBP,
SAR) across all four document types, with line items and totals that
reconcile. If any of these fail, nothing else is worth running.

**B — the defects the QA reports found (3 files).** These should *not*
sail through:

| File | Reproduces | A pass looks like |
|---|---|---|
| `B01-totals-do-not-reconcile.pdf` | **CB-06** — printed total omits VAT | Approval **blocked**, `FINANCIAL_RECONCILIATION_FAILED` |
| `B02-wrong-vat-rate-for-country.pdf` | **F-02** — 18% VAT on a UAE TRN | Flagged for review |
| `B03-no-currency-marker.pdf` | **O-03** — no currency anywhere | Currency empty or flagged, **not** silently AED |

**C — formats and capture quality (6 files).** PNG, JPG and TIFF carry
identical content, so a difference between them is a format bug and
nothing else. The blurry phone photo and the low-contrast scan should come
back with low confidence and route to review — per **HB-06**, neither may
be badged "AI Verified". The 3-page PDF puts totals only on the last page
and should count as 3 pages against the plan allowance.

**D — Arabic (1 file).** Bilingual Arabic/English with correct
right-to-left shaping. Arabic text must not corrupt the numeric fields.

**E — duplicates (2 files).** `E01` is byte-identical to `A01`. `E02` has
the same invoice number and supplier but different bytes, so it only
trips a fingerprint check, not a file hash.

**F — rejection cases (6 files).** Every one of these **must fail, and
fail cleanly**. A clear error is the pass condition; an HTTP 500, a hang,
or a silently accepted file is the defect.

| File | Tests |
|---|---|
| `F01-not-a-document.exe` | Real PE header, obvious extension |
| `F02-exe-renamed-as.pdf` | Executable bytes behind a `.pdf` name — must sniff content, not trust the extension |
| `F03-empty-file.pdf` | Zero bytes |
| `F04-corrupt-truncated.pdf` | Valid PDF header, truncated body |
| `F05-blank-no-text.png` | Nothing to extract — **HB-06**: must not be "AI Verified" |
| `F06-oversized-25mb.pdf` | Upload size limit; no storage or plan usage consumed |

## Also worth checking while these are loaded

- **Plan limits** — uploading all 23 crosses the Free plan's allowance.
  Watch for the 80 / 90 / 100% warnings (**HB-03 / C-06**).
- **Company isolation** — upload `A01` to company A and `A02` to company
  B, then confirm the dashboard, Documents and Finance each show only the
  selected company's documents (**HB-01**).
- **Exports** — export after approving, and reconcile every figure in the
  file against `expected.csv`.

## A caveat on these fixtures

They are **digitally generated**, so they are cleaner than real scans even
where degraded on purpose. Passing group A proves the pipeline works; it
does not prove accuracy on real supplier paperwork. Keep a handful of
genuine documents alongside these for that.
