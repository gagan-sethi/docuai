# ─── PaddleOCR Service Docker Image ──────────────────────────────
FROM python:3.11-slim

# System dependencies for OpenCV & image processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# Optional: PDF support
RUN pip install --no-cache-dir PyMuPDF

# Copy application
COPY main.py .

# Pre-download the PaddleOCR model on build
ENV PRELOAD_MODEL=true
RUN python -c "from paddleocr import PaddleOCR; PaddleOCR(use_angle_cls=True, lang='en', use_gpu=False, show_log=False)"

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
