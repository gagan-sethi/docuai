# PaddleOCR Service for DocuAI

A FastAPI microservice that provides handwritten & printed document OCR using [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR).

## Quick Start

### Option 1: Run locally

```bash
cd ocr-service
python -m venv venv
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
pip install PyMuPDF  # optional, for PDF support

python main.py
# → Server runs at http://localhost:8000
```

### Option 2: Docker

```bash
docker build -t docuai-ocr .
docker run -p 8000:8000 docuai-ocr
```

## API Endpoints

### `POST /ocr`
Upload a file (image or PDF) for OCR processing.

```bash
curl -X POST http://localhost:8000/ocr \
  -F "file=@handwritten_invoice.jpg"
```

### `POST /ocr/base64`
Send a base64-encoded file for OCR processing.

```bash
curl -X POST http://localhost:8000/ocr/base64 \
  -H "Content-Type: application/json" \
  -d '{"fileData": "base64...", "fileType": "image/png"}'
```

### `GET /health`
Health check endpoint.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OCR_PORT` | `8000` | Port to run the service |
| `OCR_LANG` | `en` | OCR language (`en`, `ar`, `ch`, etc.) |
| `PRELOAD_MODEL` | `true` | Pre-load model on startup |

## Integration with DocuAI

Set this in your Next.js `.env.local`:
```
PADDLE_OCR_URL=http://localhost:8000
```

When uploading documents, toggle "Handwritten Document" to route through PaddleOCR instead of Amazon Textract.
