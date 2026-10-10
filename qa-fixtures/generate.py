#!/usr/bin/env python3
"""
Generate the Phase 2 OCR test corpus.

Every file has a KNOWN expected extraction, recorded in expected.csv and
expected.json, so a test run can be scored objectively instead of judged by
eye. Several fixtures deliberately reproduce defects from the Oct 2026 QA
reports so the fixes can be proven rather than assumed.

    python3 generate.py          # writes ./files and ./expected.{csv,json}
"""

import csv, json, os, random, shutil
from datetime import date
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "files")
EXPECTED: list[dict] = []

CURRENCY_SYMBOL = {"AED": "AED", "USD": "$", "EUR": "EUR", "GBP": "GBP", "SAR": "SAR", "": ""}


def record(filename, **kw):
    row = {
        "file": filename,
        "doc_type": kw.get("doc_type", ""),
        "supplier": kw.get("supplier", ""),
        "invoice_number": kw.get("invoice_number", ""),
        "invoice_date": kw.get("invoice_date", ""),
        "currency": kw.get("currency", ""),
        "subtotal": kw.get("subtotal", ""),
        "vat_rate": kw.get("vat_rate", ""),
        "vat_amount": kw.get("vat_amount", ""),
        "grand_total": kw.get("grand_total", ""),
        "trn": kw.get("trn", ""),
        "pages": kw.get("pages", 1),
        "tests": kw.get("tests", ""),
        "expected_outcome": kw.get("expected_outcome", "extract cleanly"),
    }
    EXPECTED.append(row)


def money(v):
    return f"{v:,.2f}"


def invoice_pdf(path, *, title, supplier, trn, number, inv_date, currency,
                lines, vat_rate, note=None, pages=1, font="Helvetica",
                override_total=None, show_currency=True):
    """A plain, high-contrast invoice — the easy case OCR should ace."""
    c = canvas.Canvas(path, pagesize=A4)
    w, h = A4
    sym = CURRENCY_SYMBOL.get(currency, currency) if show_currency else ""

    subtotal = sum(q * p for _, q, p in lines)
    vat = round(subtotal * vat_rate / 100, 2)
    total = override_total if override_total is not None else round(subtotal + vat, 2)

    for page in range(pages):
        y = h - 25 * mm
        c.setFont(f"{font}-Bold" if font == "Helvetica" else font, 20)
        c.drawString(20 * mm, y, title)
        c.setFont(font, 10)
        y -= 12 * mm
        c.drawString(20 * mm, y, supplier)
        if trn:
            y -= 5 * mm
            c.drawString(20 * mm, y, f"TRN: {trn}")
        y -= 5 * mm
        c.drawString(20 * mm, y, "Dubai, United Arab Emirates")

        c.drawRightString(w - 20 * mm, h - 37 * mm, f"Invoice Number: {number}")
        c.drawRightString(w - 20 * mm, h - 43 * mm, f"Invoice Date: {inv_date}")
        if pages > 1:
            c.drawRightString(w - 20 * mm, h - 49 * mm, f"Page {page + 1} of {pages}")

        y -= 18 * mm
        c.setFont(f"{font}-Bold" if font == "Helvetica" else font, 10)
        c.drawString(20 * mm, y, "Description")
        c.drawRightString(120 * mm, y, "Qty")
        c.drawRightString(150 * mm, y, "Unit Price")
        c.drawRightString(w - 20 * mm, y, "Amount")
        c.line(20 * mm, y - 2 * mm, w - 20 * mm, y - 2 * mm)

        c.setFont(font, 10)
        y -= 8 * mm
        for desc, qty, price in lines:
            c.drawString(20 * mm, y, desc)
            c.drawRightString(120 * mm, y, str(qty))
            c.drawRightString(150 * mm, y, f"{sym} {money(price)}".strip())
            c.drawRightString(w - 20 * mm, y, f"{sym} {money(qty * price)}".strip())
            y -= 6 * mm

        # Totals only on the final page, as a real multi-page invoice does.
        if page == pages - 1:
            y -= 6 * mm
            c.line(110 * mm, y, w - 20 * mm, y)
            y -= 7 * mm
            c.drawRightString(150 * mm, y, "Subtotal:")
            c.drawRightString(w - 20 * mm, y, f"{sym} {money(subtotal)}".strip())
            y -= 6 * mm
            c.drawRightString(150 * mm, y, f"VAT {vat_rate}%:")
            c.drawRightString(w - 20 * mm, y, f"{sym} {money(vat)}".strip())
            y -= 7 * mm
            c.setFont(f"{font}-Bold" if font == "Helvetica" else font, 12)
            c.drawRightString(150 * mm, y, "Grand Total:")
            c.drawRightString(w - 20 * mm, y, f"{sym} {money(total)}".strip())

        if note:
            c.setFont(font, 8)
            c.drawString(20 * mm, 25 * mm, note)
        c.showPage()
    c.save()
    return subtotal, vat, total


# ─── Group A: clean baselines, one per currency and document type ──────
def group_a():
    cases = [
        # file, title, doc type, currency, VAT rate, supplier, TRN
        ("A01-expense-invoice-AED.pdf", "TAX INVOICE", "expense_invoice", "AED", 5,
         "Horizon Technical Supplies LLC", "100445566700003"),
        ("A02-sales-invoice-USD.pdf", "INVOICE", "sales_invoice", "USD", 0,
         "Meridian Exports FZE", ""),
        ("A03-receipt-EUR.pdf", "RECEIPT", "receipt", "EUR", 20,
         "Kaufmann Bürobedarf GmbH", ""),
        ("A04-purchase-order-GBP.pdf", "PURCHASE ORDER", "purchase_order", "GBP", 20,
         "Northgate Industrial Ltd", ""),
        ("A05-expense-invoice-SAR.pdf", "TAX INVOICE", "expense_invoice", "SAR", 15,
         "Al Waha Trading Est.", "300112233400003"),
    ]
    for i, (fn, title, dtype, cur, rate, supplier, trn) in enumerate(cases, start=1):
        lines = [
            ("Industrial pump A300", 5, 1250.00),
            ("Valve assembly V12", 12, 340.00),
            ("Seal kit SK-Pro", 20, 85.50),
        ]
        number = f"INV-2026-{1000 + i}"
        d = f"{10 + i:02d} Sep 2026"
        sub, vat, tot = invoice_pdf(
            os.path.join(OUT, fn), title=title, supplier=supplier, trn=trn,
            number=number, inv_date=d, currency=cur, lines=lines, vat_rate=rate)
        record(fn, doc_type=dtype, supplier=supplier, invoice_number=number,
               invoice_date="2026-09-%02d" % (10 + i), currency=cur,
               subtotal=money(sub), vat_rate=rate, vat_amount=money(vat),
               grand_total=money(tot), trn=trn,
               tests=f"clean baseline; {cur}; {dtype}; VAT {rate}%; line items; totals reconcile")


# ─── Group B: the defects the QA reports found ─────────────────────────
def group_b():
    # CB-06 — subtotal + VAT must equal the grand total. Here it does not.
    lines = [("Office stationery", 1, 55.00)]
    fn = "B01-totals-do-not-reconcile.pdf"
    invoice_pdf(os.path.join(OUT, fn), title="TAX INVOICE",
                supplier="Horizon Technical Supplies LLC", trn="100445566700003",
                number="INV-2026-2001", inv_date="12 Sep 2026", currency="AED",
                lines=lines, vat_rate=5, override_total=55.00,
                note="Stated grand total omits VAT — reconciliation must fail.")
    record(fn, doc_type="expense_invoice", supplier="Horizon Technical Supplies LLC",
           invoice_number="INV-2026-2001", invoice_date="2026-09-12", currency="AED",
           subtotal="55.00", vat_rate=5, vat_amount="2.75", grand_total="57.75",
           trn="100445566700003",
           tests="CB-06 reconciliation: printed total (55.00) excludes VAT",
           expected_outcome="REJECT approval — HTTP 400 FINANCIAL_RECONCILIATION_FAILED; "
                            "must not auto-approve")

    # F-02 — a UAE supplier charging a non-UAE VAT rate.
    lines = [("Consulting services", 1, 55.00)]
    fn = "B02-wrong-vat-rate-for-country.pdf"
    invoice_pdf(os.path.join(OUT, fn), title="TAX INVOICE",
                supplier="Gulf Advisory Partners LLC", trn="100778899100003",
                number="INV-2026-2002", inv_date="13 Sep 2026", currency="AED",
                lines=lines, vat_rate=18,
                note="UAE TRN with an 18% VAT rate — the UAE rate is 5%.")
    record(fn, doc_type="expense_invoice", supplier="Gulf Advisory Partners LLC",
           invoice_number="INV-2026-2002", invoice_date="2026-09-13", currency="AED",
           subtotal="55.00", vat_rate=18, vat_amount="9.90", grand_total="64.90",
           trn="100778899100003",
           tests="F-02 VAT rate sanity: 18% on a UAE TRN",
           expected_outcome="FLAG for review — rate inconsistent with the supplier country")

    # O-03 — no currency marker anywhere on the document.
    lines = [("Replacement parts", 3, 120.00)]
    fn = "B03-no-currency-marker.pdf"
    invoice_pdf(os.path.join(OUT, fn), title="INVOICE",
                supplier="Unmarked Trading Co", trn="", number="INV-2026-2003",
                inv_date="14 Sep 2026", currency="", lines=lines, vat_rate=0,
                show_currency=False,
                note="No currency symbol or code appears on this document.")
    record(fn, doc_type="expense_invoice", supplier="Unmarked Trading Co",
           invoice_number="INV-2026-2003", invoice_date="2026-09-14", currency="",
           subtotal="360.00", vat_rate=0, vat_amount="0.00", grand_total="360.00",
           tests="O-03 currency detection with no marker present",
           expected_outcome="Currency left empty or flagged — must NOT silently assume AED")


# ─── Group C: formats, scans and image quality ─────────────────────────
def _render_invoice_image(size=(1240, 1754), blur=0, noise=0, rotate=0,
                          scale=1.0, text_colour=(20, 20, 20), bg=(255, 255, 255)):
    """Render a simple invoice as an image, optionally degraded."""
    img = Image.new("RGB", size, bg)
    d = ImageDraw.Draw(img)
    try:
        big = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 46)
        reg = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 30)
    except OSError:
        big = reg = ImageFont.load_default()

    lines = [
        (60, 70, "TAX INVOICE", big),
        (60, 160, "Cedar Valley Supplies LLC", reg),
        (60, 205, "TRN: 100556677800003", reg),
        (60, 250, "Dubai, United Arab Emirates", reg),
        (60, 330, "Invoice Number: INV-2026-3001", reg),
        (60, 375, "Invoice Date: 15 Sep 2026", reg),
        (60, 470, "Description            Qty     Amount", reg),
        (60, 520, "Printer toner            4     AED 480.00", reg),
        (60, 565, "A4 paper box             10    AED 220.00", reg),
        (60, 660, "Subtotal:              AED 700.00", reg),
        (60, 705, "VAT 5%:                AED  35.00", reg),
        (60, 755, "Grand Total:           AED 735.00", big),
    ]
    for x, y, text, font in lines:
        d.text((x, y), text, fill=text_colour, font=font)

    if scale != 1.0:
        img = img.resize((int(size[0] * scale), int(size[1] * scale)), Image.LANCZOS)
    if rotate:
        img = img.rotate(rotate, expand=True, fillcolor=bg)
    if blur:
        img = img.filter(ImageFilter.GaussianBlur(blur))
    if noise:
        px = img.load()
        rnd = random.Random(7)
        for _ in range(noise):
            x = rnd.randrange(img.width); y = rnd.randrange(img.height)
            v = rnd.randrange(256)
            px[x, y] = (v, v, v)
    return img


IMAGE_EXPECT = dict(
    doc_type="expense_invoice", supplier="Cedar Valley Supplies LLC",
    invoice_number="INV-2026-3001", invoice_date="2026-09-15", currency="AED",
    subtotal="700.00", vat_rate=5, vat_amount="35.00", grand_total="735.00",
    trn="100556677800003")


def group_c():
    # Same content in each raster format, so format handling is isolated.
    for fn, fmt, kw in [
        ("C01-scan-clean.png", "PNG", {}),
        ("C02-scan-clean.jpg", "JPEG", {}),
        ("C03-scan-clean.tiff", "TIFF", {}),
    ]:
        _render_invoice_image().save(os.path.join(OUT, fn), fmt)
        record(fn, **IMAGE_EXPECT,
               tests=f"format handling: {fmt}; identical content across C01–C03",
               expected_outcome="extract cleanly; all three must agree")

    # A phone photo: slightly rotated, blurred, noisy, lower resolution.
    _render_invoice_image(blur=1.6, noise=40000, rotate=-2.5, scale=0.62,
                          bg=(242, 240, 232)).save(
        os.path.join(OUT, "C04-phone-photo-blurry.jpg"), "JPEG", quality=62)
    record("C04-phone-photo-blurry.jpg", **IMAGE_EXPECT,
           tests="degraded capture: blur, skew, sensor noise, JPEG artefacts",
           expected_outcome="lower confidence expected; must route to review, "
                            "never badge AI Verified (HB-06)")

    # Very low contrast — near the limit of what OCR can read.
    _render_invoice_image(text_colour=(168, 168, 168), bg=(236, 236, 236)).save(
        os.path.join(OUT, "C05-low-contrast.png"), "PNG")
    record("C05-low-contrast.png", **IMAGE_EXPECT,
           tests="low contrast grey-on-grey",
           expected_outcome="partial or failed extraction; must route to review "
                            "with no AI Verified badge")

    # Multi-page PDF — totals appear only on the last page.
    lines = [("Server rack unit", 2, 2400.00), ("Cable management kit", 8, 95.00)]
    sub, vat, tot = invoice_pdf(
        os.path.join(OUT, "C06-multipage-3pages.pdf"), title="TAX INVOICE",
        supplier="Pinnacle Datacentre LLC", trn="100334455600003",
        number="INV-2026-3006", inv_date="16 Sep 2026", currency="AED",
        lines=lines, vat_rate=5, pages=3)
    record("C06-multipage-3pages.pdf", doc_type="expense_invoice",
           supplier="Pinnacle Datacentre LLC", invoice_number="INV-2026-3006",
           invoice_date="2026-09-16", currency="AED", subtotal=money(sub),
           vat_rate=5, vat_amount=money(vat), grand_total=money(tot),
           trn="100334455600003", pages=3,
           tests="multi-page PDF; totals only on page 3; page counting for plan limits",
           expected_outcome="totals read from the final page; counts as 3 pages "
                            "against the plan allowance")


# ─── Group D: Arabic and mixed-language ────────────────────────────────
def _arabic_font():
    for p in ["/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
              "/Library/Fonts/Arial Unicode.ttf",
              "/System/Library/Fonts/Supplemental/Geeza Pro.ttc"]:
        if os.path.exists(p):
            return p
    return None


def _shape_arabic(text):
    """
    Apply Arabic contextual shaping and the bidi algorithm.

    PIL draws glyphs strictly left to right. Arabic is stored in logical
    order, so drawing it raw renders the words in reverse — the letters
    join correctly but the line reads backwards, which would test the OCR
    against text no real invoice contains. arabic_reshaper picks the
    correct contextual glyph forms and python-bidi reorders for display.
    """
    try:
        import arabic_reshaper
        from bidi.algorithm import get_display
        return get_display(arabic_reshaper.reshape(text))
    except ImportError:
        return None


def group_d():
    """Arabic fixtures, rendered as images through the system font."""
    path = _arabic_font()
    if not path:
        print("  ! no Arabic-capable font found — skipping group D")
        return
    if _shape_arabic("test") is None:
        print("  ! arabic-reshaper/python-bidi not installed — skipping group D.")
        print("    Install them first:  pip install arabic-reshaper python-bidi")
        return

    img = Image.new("RGB", (1240, 1754), "white")
    d = ImageDraw.Draw(img)
    ar = ImageFont.truetype(path, 38)
    en = ImageFont.truetype(path, 30)

    rows = [
        (60, 80,  "فاتورة ضريبية", ar),
        (60, 150, "TAX INVOICE", en),
        (60, 230, "شركة الواحة للتجارة", ar),
        (60, 290, "Al Waha Trading Company", en),
        (60, 340, "TRN: 100998877600003", en),
        (60, 430, "رقم الفاتورة: INV-2026-4001", en),
        (60, 480, "التاريخ: 17 Sep 2026", en),
        (60, 580, "الوصف / Description", en),
        (60, 640, "مواد مكتبية / Office supplies      AED 1,200.00", en),
        (60, 690, "خدمات صيانة / Maintenance          AED   800.00", en),
        (60, 800, "المجموع الفرعي / Subtotal:         AED 2,000.00", en),
        (60, 850, "ضريبة القيمة المضافة 5% / VAT:     AED   100.00", en),
        (60, 910, "الإجمالي / Grand Total:            AED 2,100.00", en),
    ]
    for x, y, text, font in rows:
        # Shape only the runs that actually contain Arabic; the mixed
        # lines keep their Latin and numeric parts in place.
        if any("\u0600" <= ch <= "\u06FF" for ch in text):
            text = _shape_arabic(text) or text
        d.text((x, y), text, fill=(15, 15, 15), font=font)

    fn = "D01-arabic-bilingual.png"
    img.save(os.path.join(OUT, fn), "PNG")
    record(fn, doc_type="expense_invoice", supplier="Al Waha Trading Company",
           invoice_number="INV-2026-4001", invoice_date="2026-09-17",
           currency="AED", subtotal="2,000.00", vat_rate=5, vat_amount="100.00",
           grand_total="2,100.00", trn="100998877600003",
           tests="Arabic + English bilingual; right-to-left script; Arabic numerals",
           expected_outcome="supplier and totals extracted; Arabic must not corrupt "
                            "the numeric fields")


# ─── Group E: duplicates ───────────────────────────────────────────────
def group_e():
    src = os.path.join(OUT, "A01-expense-invoice-AED.pdf")
    dup = os.path.join(OUT, "E01-exact-duplicate-of-A01.pdf")
    shutil.copyfile(src, dup)
    record("E01-exact-duplicate-of-A01.pdf", doc_type="expense_invoice",
           supplier="Horizon Technical Supplies LLC", invoice_number="INV-2026-1001",
           invoice_date="2026-09-11", currency="AED", subtotal="12,040.00",
           vat_rate=5, vat_amount="602.00", grand_total="12,642.00",
           trn="100445566700003",
           tests="duplicate detection: byte-identical copy of A01",
           expected_outcome="flagged as a duplicate of A01; approval blocked until resolved")

    # Same invoice number and totals, re-typed — not byte-identical.
    lines = [("Industrial pump A300", 5, 1250.00), ("Valve assembly V12", 12, 340.00),
             ("Seal kit SK-Pro", 20, 85.50)]
    fn = "E02-same-invoice-number-reissued.pdf"
    sub, vat, tot = invoice_pdf(
        os.path.join(OUT, fn), title="TAX INVOICE  (REISSUED COPY)",
        supplier="Horizon Technical Supplies LLC", trn="100445566700003",
        number="INV-2026-1001", inv_date="11 Sep 2026", currency="AED",
        lines=lines, vat_rate=5, note="Reissued copy — same invoice number as A01.")
    record(fn, doc_type="expense_invoice", supplier="Horizon Technical Supplies LLC",
           invoice_number="INV-2026-1001", invoice_date="2026-09-11", currency="AED",
           subtotal=money(sub), vat_rate=5, vat_amount=money(vat),
           grand_total=money(tot), trn="100445566700003",
           tests="duplicate by invoice number + supplier, different bytes",
           expected_outcome="flagged as a probable duplicate of A01 by fingerprint, "
                            "not by file hash")


# ─── Group F: rejection and limit cases ────────────────────────────────
def group_f():
    """
    These must FAIL, and fail cleanly. A clear error is the pass condition;
    a 500, a hang, or a silently accepted file is the defect.
    """
    # Executable with a document-ish name — must be rejected on type, not name.
    p = os.path.join(OUT, "F01-not-a-document.exe")
    with open(p, "wb") as f:
        f.write(b"MZ\x90\x00\x03" + os.urandom(2048))   # DOS/PE header
    record("F01-not-a-document.exe",
           tests="invalid type: real PE/EXE header",
           expected_outcome="REJECT with a clear 'unsupported file type' message; "
                            "no processing, no plan usage consumed")

    # PDF extension, executable content — extension must not be trusted.
    p = os.path.join(OUT, "F02-exe-renamed-as.pdf")
    with open(p, "wb") as f:
        f.write(b"MZ\x90\x00\x03" + os.urandom(2048))
    record("F02-exe-renamed-as.pdf",
           tests="type spoofing: executable bytes behind a .pdf extension",
           expected_outcome="REJECT on content sniffing, not on the extension")

    # Zero bytes.
    open(os.path.join(OUT, "F03-empty-file.pdf"), "wb").close()
    record("F03-empty-file.pdf",
           tests="zero-byte upload",
           expected_outcome="REJECT with a clear message; must not 500")

    # Valid PDF header, truncated body.
    src = os.path.join(OUT, "A01-expense-invoice-AED.pdf")
    with open(src, "rb") as f:
        head = f.read(900)
    with open(os.path.join(OUT, "F04-corrupt-truncated.pdf"), "wb") as f:
        f.write(head)
    record("F04-corrupt-truncated.pdf",
           tests="corrupt PDF: valid header, truncated body",
           expected_outcome="REJECT or mark failed with a reason; must not hang or 500")

    # A page with no extractable text at all.
    img = Image.new("RGB", (1240, 1754), "white")
    ImageDraw.Draw(img).rectangle([200, 300, 1040, 1400], outline=(205, 205, 205), width=3)
    img.save(os.path.join(OUT, "F05-blank-no-text.png"), "PNG")
    record("F05-blank-no-text.png",
           tests="HB-06: nothing to extract",
           expected_outcome="status failed or needs review; MUST NOT be badged "
                            "'AI Verified'; empty fields must show no confidence score")

    # Oversized file, built from incompressible data so it stays large.
    big = os.path.join(OUT, "F06-oversized-25mb.pdf")
    c = canvas.Canvas(big, pagesize=A4)
    c.setFont("Helvetica", 10)
    c.drawString(20 * mm, 270 * mm, "Oversized upload test")
    c.showPage(); c.save()
    with open(big, "ab") as f:
        f.write(b"%% padding to exceed the upload limit\n")
        f.write(os.urandom(25 * 1024 * 1024))
    record("F06-oversized-25mb.pdf",
           tests="upload size limit (~25 MB)",
           expected_outcome="REJECT with a size message before processing; "
                            "no partial upload left behind, no storage consumed")


def main():
    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT):
        os.remove(os.path.join(OUT, f))

    for fn in (group_a, group_b, group_c, group_d, group_e, group_f):
        fn()
        print(f"  {fn.__name__} done")

    base = os.path.dirname(os.path.abspath(__file__))
    cols = list(EXPECTED[0].keys())
    with open(os.path.join(base, "expected.csv"), "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader(); w.writerows(EXPECTED)
    with open(os.path.join(base, "expected.json"), "w") as f:
        json.dump(EXPECTED, f, indent=2)

    total_mb = sum(os.path.getsize(os.path.join(OUT, f))
                   for f in os.listdir(OUT)) / 1024 / 1024
    print(f"\n{len(EXPECTED)} fixtures, {total_mb:.1f} MB total")


if __name__ == "__main__":
    main()
