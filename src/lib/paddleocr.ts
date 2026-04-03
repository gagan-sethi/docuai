/**
 * PaddleOCR client — calls the Python FastAPI microservice
 * for handwritten document OCR processing.
 *
 * Falls back gracefully if the service is unavailable.
 */

// ─── Config ─────────────────────────────────────────────────────

const PADDLE_OCR_URL =
  process.env.PADDLE_OCR_URL?.replace(/\/+$/, "") || "http://localhost:8000";

// ─── Types ──────────────────────────────────────────────────────

export interface PaddleOcrBlock {
  text: string;
  confidence: number;
  bbox: number[][]; // [[x1,y1],[x2,y2],[x3,y3],[x4,y4]]
}

export interface PaddleOcrResponse {
  text: string;
  confidence: number;
  blocks: PaddleOcrBlock[];
  pages: number;
  processingTimeMs: number;
}

// ─── Health check ───────────────────────────────────────────────

export async function isPaddleOcrAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${PADDLE_OCR_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === "ok";
  } catch {
    return false;
  }
}

// ─── OCR via file upload ────────────────────────────────────────

export async function paddleOcrFromFile(
  fileBytes: Uint8Array,
  fileName: string,
  fileType: string
): Promise<PaddleOcrResponse | null> {
  try {
    const formData = new FormData();
    const blob = new Blob([Buffer.from(fileBytes)], { type: fileType });
    formData.append("file", blob, fileName);

    const res = await fetch(`${PADDLE_OCR_URL}/ocr`, {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(120_000), // 2 min timeout for large docs
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Unknown error" }));
      console.error("[paddleocr] OCR failed:", err);
      return null;
    }

    return (await res.json()) as PaddleOcrResponse;
  } catch (error) {
    console.error("[paddleocr] Service error:", error);
    return null;
  }
}

// ─── OCR via base64 ─────────────────────────────────────────────

export async function paddleOcrFromBase64(
  base64Data: string,
  fileName: string,
  fileType: string
): Promise<PaddleOcrResponse | null> {
  try {
    const res = await fetch(`${PADDLE_OCR_URL}/ocr/base64`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileData: base64Data,
        fileType,
        fileName,
      }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Unknown error" }));
      console.error("[paddleocr] Base64 OCR failed:", err);
      return null;
    }

    return (await res.json()) as PaddleOcrResponse;
  } catch (error) {
    console.error("[paddleocr] Service error:", error);
    return null;
  }
}
