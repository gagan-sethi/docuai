"""Sanity-check the generated corpus against what expected.json claims."""
import json, os
from pypdf import PdfReader
from PIL import Image

base = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(base, "files")
exp = json.load(open(os.path.join(base, "expected.json")))

ok = fail = 0
def check(cond, msg):
    global ok, fail
    if cond: ok += 1
    else:
        fail += 1
        print("   FAIL:", msg)

print(f"{'file':<36} {'size':>9}  detail")
print("-" * 86)
for row in exp:
    fn = row["file"]; p = os.path.join(OUT, fn)
    if not os.path.exists(p):
        check(False, f"{fn} missing"); continue
    size = os.path.getsize(p)
    detail = ""
    try:
        if fn.endswith(".pdf"):
            if fn.startswith(("F02", "F03", "F04")):
                detail = "intentionally invalid"
            else:
                r = PdfReader(p)
                detail = f"{len(r.pages)} page(s)"
                if row.get("pages"):
                    check(len(r.pages) == int(row["pages"]),
                          f"{fn}: {len(r.pages)} pages, expected {row['pages']}")
                txt = (r.pages[0].extract_text() or "")
                if row.get("invoice_number"):
                    check(row["invoice_number"] in txt,
                          f"{fn}: invoice number not in extracted text")
        elif fn.lower().endswith((".png", ".jpg", ".jpeg", ".tiff")):
            im = Image.open(p); im.load()
            detail = f"{im.width}x{im.height} {im.mode}"
        elif fn.endswith(".exe"):
            detail = "PE header" if open(p, "rb").read(2) == b"MZ" else "NOT a PE header"
            check(open(p, "rb").read(2) == b"MZ", f"{fn}: not a PE header")
    except Exception as e:
        if fn.startswith(("F02", "F03", "F04")):
            detail = f"unreadable as intended ({type(e).__name__})"
        else:
            check(False, f"{fn}: {type(e).__name__}: {e}")
            detail = "ERROR"
    print(f"{fn:<36} {size:>9,}  {detail}")

# targeted assertions on the negative cases
check(os.path.getsize(os.path.join(OUT, "F03-empty-file.pdf")) == 0, "F03 not empty")
check(os.path.getsize(os.path.join(OUT, "F06-oversized-25mb.pdf")) > 25 * 1024 * 1024,
      "F06 under 25MB")
check(open(os.path.join(OUT, "F02-exe-renamed-as.pdf"), "rb").read(2) == b"MZ",
      "F02 does not carry executable bytes")
print(f"\nchecks passed: {ok}   failed: {fail}")
