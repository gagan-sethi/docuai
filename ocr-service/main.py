"""
PaddleOCR Microservice for DocuAI
─────────────────────────────────
FastAPI service that wraps PaddleOCR for handwritten & printed
document text extraction. Designed to be called from the Next.js
backend as part of the processing pipeline.

Endpoints:
  POST /ocr          → Extract text from uploaded file
  POST /ocr/base64   → Extract text from base64-encoded file
  GET  /health       → Health check
"""

import base64
import io
import logging
import os
import time
from typing import Optional

import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel

# ─── Logging ─────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("paddleocr-service")

# ─── FastAPI app ─────────────────────────────────────────────────
app = FastAPI(
    title="DocuAI PaddleOCR Service",
    description="Handwritten & printed document OCR powered by PaddleOCR",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── PaddleOCR singleton ────────────────────────────────────────
_ocr_engine = None


def get_ocr_engine():
    """Lazy-load the PaddleOCR engine (heavy model download on first call)."""
    global _ocr_engine
    if _ocr_engine is None:
        from paddleocr import PaddleOCR

        lang = os.environ.get("OCR_LANG", "en")
        logger.info(f"Initializing PaddleOCR engine (lang={lang})...")
        _ocr_engine = PaddleOCR(
            use_angle_cls=True,
            lang=lang,
            use_gpu=False,  # CPU-only for portability; set True if GPU available
            show_log=True,
            # PaddleOCR v2.10+ defaults are good for handwriting
            det_db_thresh=0.2,      # Lower threshold catches faint handwriting
            det_db_unclip_ratio=1.8, # Larger text region expansion for handwritten
            rec_batch_num=16,
        )
        logger.info("PaddleOCR engine ready ✓")
    return _ocr_engine


# ─── Models ──────────────────────────────────────────────────────
class OcrBlock(BaseModel):
    text: str
    confidence: float
    bbox: list[list[float]]  # [[x1,y1],[x2,y2],[x3,y3],[x4,y4]]


class OcrResponse(BaseModel):
    text: str
    confidence: float
    blocks: list[OcrBlock]
    pages: int
    processingTimeMs: int


class Base64Request(BaseModel):
    fileData: str  # base64-encoded file
    fileType: Optional[str] = "image/png"
    fileName: Optional[str] = "document"


# ─── Helpers ─────────────────────────────────────────────────────

def pdf_to_images(pdf_bytes: bytes) -> list[np.ndarray]:
    """Convert a PDF to a list of numpy images (one per page)."""
    try:
        import fitz  # PyMuPDF
    except ImportError:
        # Fallback: try pdf2image
        try:
            from pdf2image import convert_from_bytes
            pil_images = convert_from_bytes(pdf_bytes, dpi=300)
            return [np.array(img) for img in pil_images]
        except ImportError:
            raise HTTPException(
                status_code=500,
                detail="PDF support requires PyMuPDF (fitz) or pdf2image. "
                       "Install with: pip install PyMuPDF",
            )

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    images = []
    for page in doc:
        # Render at 300 DPI for good OCR quality
        pix = page.get_pixmap(dpi=300)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        images.append(np.array(img))
    doc.close()
    return images


def image_bytes_to_numpy(file_bytes: bytes) -> np.ndarray:
    """Convert raw image bytes to a numpy array."""
    img = Image.open(io.BytesIO(file_bytes))
    if img.mode != "RGB":
        img = img.convert("RGB")
    return np.array(img)


def run_ocr_on_images(images: list[np.ndarray]) -> OcrResponse:
    """Run PaddleOCR on a list of images and aggregate results."""
    ocr = get_ocr_engine()
    start = time.time()

    all_blocks: list[OcrBlock] = []
    all_texts: list[str] = []
    confidences: list[float] = []

    for page_idx, img in enumerate(images):
        result = ocr.ocr(img, cls=True)

        if not result or not result[0]:
            continue

        page_lines = []
        for line in result[0]:
            bbox_raw, (text, conf) = line
            # bbox_raw is [[x1,y1],[x2,y2],[x3,y3],[x4,y4]]
            bbox = [[float(p[0]), float(p[1])] for p in bbox_raw]
            confidence = round(float(conf) * 100, 1)

            all_blocks.append(
                OcrBlock(text=text, confidence=confidence, bbox=bbox)
            )
            page_lines.append(text)
            confidences.append(confidence)

        if page_lines:
            if page_idx > 0:
                all_texts.append(f"\n--- Page {page_idx + 1} ---\n")
            all_texts.append("\n".join(page_lines))

    elapsed_ms = int((time.time() - start) * 1000)

    overall_confidence = (
        round(sum(confidences) / len(confidences), 1) if confidences else 0.0
    )

    return OcrResponse(
        text="\n".join(all_texts),
        confidence=overall_confidence,
        blocks=all_blocks,
        pages=len(images),
        processingTimeMs=elapsed_ms,
    )


# ─── Endpoints ───────────────────────────────────────────────────

@app.get("/health")
async def health():
    """Health check — also reports whether model is loaded."""
    return {
        "status": "ok",
        "modelLoaded": _ocr_engine is not None,
        "service": "paddleocr",
    }


@app.post("/ocr", response_model=OcrResponse)
async def ocr_file(file: UploadFile = File(...)):
    """
    Extract text from an uploaded file (image or PDF).
    Optimized for handwritten documents but works on printed too.
    """
    try:
        file_bytes = await file.read()
        logger.info(
            f"Received file: {file.filename} ({len(file_bytes)} bytes, "
            f"type={file.content_type})"
        )

        # Determine if PDF
        is_pdf = (
            file.content_type == "application/pdf"
            or (file.filename and file.filename.lower().endswith(".pdf"))
        )

        if is_pdf:
            images = pdf_to_images(file_bytes)
        else:
            images = [image_bytes_to_numpy(file_bytes)]

        result = run_ocr_on_images(images)
        logger.info(
            f"OCR complete: {len(result.blocks)} blocks, "
            f"{result.confidence}% confidence, {result.processingTimeMs}ms"
        )
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OCR error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ocr/base64", response_model=OcrResponse)
async def ocr_base64(req: Base64Request):
    """
    Extract text from a base64-encoded file.
    Used by the Next.js backend when file bytes are stored in memory.
    """
    try:
        file_bytes = base64.b64decode(req.fileData)
        logger.info(
            f"Received base64 file: {req.fileName} ({len(file_bytes)} bytes, "
            f"type={req.fileType})"
        )

        is_pdf = (
            req.fileType == "application/pdf"
            or (req.fileName and req.fileName.lower().endswith(".pdf"))
        )

        if is_pdf:
            images = pdf_to_images(file_bytes)
        else:
            images = [image_bytes_to_numpy(file_bytes)]

        result = run_ocr_on_images(images)
        logger.info(
            f"OCR complete: {len(result.blocks)} blocks, "
            f"{result.confidence}% confidence, {result.processingTimeMs}ms"
        )
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OCR error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ─── Startup ─────────────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    """Pre-load model on startup so first request is fast."""
    if os.environ.get("PRELOAD_MODEL", "true").lower() == "true":
        logger.info("Pre-loading PaddleOCR model...")
        get_ocr_engine()
        logger.info("Model pre-loaded ✓")


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("OCR_PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
