# DocuAI — Implementation Documentation

> **Intelligent Document Processing Platform**
> Built with Next.js 16 · Amazon Textract · OpenAI GPT-4o · AWS S3

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Architecture Overview](#4-architecture-overview)
5. [Processing Pipeline — Deep Dive](#5-processing-pipeline--deep-dive)
6. [Backend Implementation](#6-backend-implementation)
   - [Shared Types](#61-shared-types-srclibtypests)
   - [Document Store](#62-document-store-srclibstorets)
   - [AWS S3 Client](#63-aws-s3-client-srclibawsts)
   - [Amazon Textract Client](#64-amazon-textract-client-srclibtextractts)
   - [OpenAI Client](#65-openai-client-srclibopenaiits)
7. [API Routes](#7-api-routes)
   - [POST /api/upload](#71-post-apiupload)
   - [POST /api/process](#72-post-apiprocess)
   - [GET /api/documents](#73-get-apidocuments)
   - [GET /api/documents/[id]](#74-get-apidocumentsid)
   - [PATCH /api/documents/[id]](#75-patch-apidocumentsid)
8. [Frontend Implementation](#8-frontend-implementation)
   - [Upload Page](#81-upload-page)
   - [Review Page](#82-review-page)
   - [Dashboard Page](#83-dashboard-page)
9. [Handwritten Document Support](#9-handwritten-document-support)
10. [OpenAI Structuring — Prompt Engineering](#10-openai-structuring--prompt-engineering)
11. [Configuration](#11-configuration)
12. [Environment Variables](#12-environment-variables)
13. [AWS IAM Permissions](#13-aws-iam-permissions)
14. [Setup & Installation](#14-setup--installation)
15. [Deployment (Vercel)](#15-deployment-vercel)
16. [API Reference — Quick Cheat Sheet](#16-api-reference--quick-cheat-sheet)
17. [Future Enhancements](#17-future-enhancements)

---

## 1. Project Overview

**DocuAI** is a full-stack intelligent document processing platform that automates the extraction, structuring, and validation of data from business documents — including invoices, purchase orders, delivery notes, receipts, and handwritten forms.

### Core Capabilities

| Capability | Technology | Description |
|------------|-----------|-------------|
| **OCR & Text Extraction** | Amazon Textract | Extracts printed + handwritten text, key-value pairs, and tables |
| **AI Structuring** | OpenAI GPT-4o | Classifies document types, structures fields, validates data accuracy |
| **File Storage** | AWS S3 | Secure cloud storage for uploaded documents |
| **Human Review** | Next.js UI | Split-screen review interface for validation and approval |
| **Dashboard Analytics** | Real-time Polling | Live stats, pipeline visualization, recent document tracking |

### User Flow

```
Upload Document → S3 Storage → Textract OCR → GPT-4o Structuring → Human Review → Approve/Reject
```

---

## 2. Tech Stack

### Core Framework

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 16.2.1 | Full-stack React framework (App Router, Turbopack) |
| **TypeScript** | 5.x | Type safety across frontend + backend |
| **React** | 19.2.4 | UI components |
| **Tailwind CSS** | 4.x | Utility-first styling with `@theme inline` directives |

### Backend / Cloud Services

| Technology | Version | Purpose |
|-----------|---------|---------|
| **@aws-sdk/client-s3** | 3.1017.0 | Upload & retrieve documents from S3 |
| **@aws-sdk/client-textract** | 3.1017.0 | OCR — extract text, forms, tables |
| **@aws-sdk/s3-request-presigner** | 3.1017.0 | Generate pre-signed URLs (future use) |
| **openai** | 6.33.0 | GPT-4o for intelligent document structuring |
| **uuid** | 13.0.0 | Unique document ID generation |

### Frontend Libraries

| Technology | Version | Purpose |
|-----------|---------|---------|
| **framer-motion** | 12.38.0 | Animations and transitions |
| **lucide-react** | 1.7.0 | SVG icon library |

---

## 3. Project Structure

```
docuai/
├── .env.example                    # Environment variable template
├── .env.local                      # Actual secrets (gitignored)
├── next.config.ts                  # Next.js configuration
├── package.json                    # Dependencies & scripts
├── IMPLEMENTATION.md               # This file
│
├── src/
│   ├── lib/                        # ── Backend Core Libraries ──
│   │   ├── types.ts                # Shared TypeScript types & interfaces
│   │   ├── store.ts                # In-memory document store (singleton)
│   │   ├── aws.ts                  # AWS S3 client configuration
│   │   ├── textract.ts             # Amazon Textract client configuration
│   │   └── openai.ts               # OpenAI GPT-4o client configuration
│   │
│   ├── app/
│   │   ├── layout.tsx              # Root layout (Inter font, metadata)
│   │   ├── page.tsx                # Landing page
│   │   ├── globals.css             # Global styles + Tailwind theme
│   │   │
│   │   ├── api/                    # ── API Routes ──
│   │   │   ├── upload/
│   │   │   │   └── route.ts        # POST: File upload to S3
│   │   │   ├── process/
│   │   │   │   └── route.ts        # POST: Textract + OpenAI pipeline
│   │   │   └── documents/
│   │   │       ├── route.ts        # GET: List documents + stats
│   │   │       └── [id]/
│   │   │           └── route.ts    # GET/PATCH: Single document ops
│   │   │
│   │   ├── dashboard/              # ── Dashboard Pages ──
│   │   │   ├── layout.tsx          # Dashboard layout metadata
│   │   │   ├── page.tsx            # Main dashboard with live stats
│   │   │   ├── upload/
│   │   │   │   └── page.tsx        # Upload documents page
│   │   │   └── review/
│   │   │       └── page.tsx        # Document review & approval page
│   │   │
│   │   ├── login/page.tsx          # Login page (OTP + WhatsApp)
│   │   ├── signup/page.tsx         # Signup page
│   │   └── pricing/page.tsx        # Pricing page
│   │
│   └── components/                 # ── Reusable Components ──
│       ├── Navbar.tsx              # Landing page navigation
│       ├── Hero.tsx                # Hero section with typing animation
│       ├── Features.tsx            # Feature showcase
│       ├── Stats.tsx               # Statistics section
│       ├── HowItWorks.tsx          # Process explanation
│       ├── DemoSection.tsx         # Interactive demo
│       ├── Testimonials.tsx        # Customer testimonials
│       ├── Pricing.tsx             # Pricing cards
│       ├── Partners.tsx            # Partner logos
│       ├── CTA.tsx                 # Call-to-action section
│       ├── Footer.tsx              # Site footer
│       ├── auth/
│       │   └── AuthLayout.tsx      # Shared auth page layout
│       └── dashboard/
│           ├── Sidebar.tsx         # Collapsible sidebar navigation
│           └── TopBar.tsx          # Dashboard top bar
```

---

## 4. Architecture Overview

```
┌────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                        │
│                                                                │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐   │
│  │  Upload Page │  │  Dashboard  │  │   Review Page        │   │
│  │  (Drag+Drop) │  │  (Polling)  │  │  (Approve/Reject)   │   │
│  └──────┬───────┘  └──────┬──────┘  └──────────┬───────────┘   │
│         │                 │                     │              │
└─────────┼─────────────────┼─────────────────────┼──────────────┘
          │                 │                     │
          ▼                 ▼                     ▼
┌────────────────────────────────────────────────────────────────┐
│                    NEXT.JS API ROUTES                          │
│                                                                │
│  POST /api/upload    GET /api/documents    PATCH /api/docs/[id]│
│  POST /api/process   GET /api/docs/[id]                       │
│                                                                │
└─────┬──────────────────────────┬───────────────────────────────┘
      │                          │
      ▼                          ▼
┌──────────────┐         ┌──────────────┐       ┌──────────────┐
│   AWS S3     │         │   Amazon     │       │   OpenAI     │
│  (Storage)   │◄───────►│  Textract    │──────►│   GPT-4o     │
│              │         │  (OCR)       │       │  (Structure) │
└──────────────┘         └──────────────┘       └──────────────┘
                                                       │
                                                       ▼
                                              ┌──────────────┐
                                              │  In-Memory   │
                                              │  Document    │
                                              │  Store       │
                                              └──────────────┘
```

---

## 5. Processing Pipeline — Deep Dive

The document processing pipeline consists of **4 sequential stages**, each reflected in the document's `status` field:

### Stage 1: Upload to S3 (`uploading` → `uploaded`)

```
Client                    API (/api/upload)              AWS S3
  │                            │                           │
  │── FormData (file) ────────►│                           │
  │                            │── PutObjectCommand ──────►│
  │                            │                           │── Stored ──►
  │                            │◄── Success ───────────────│
  │                            │                           │
  │                            │── Create document record  │
  │                            │   (in-memory store)       │
  │◄── { documentId, s3Key } ──│                           │
```

- File is sent as `FormData` with the key `"file"`
- Validated for type (PDF, JPG, PNG, TIFF, WebP) and size (max 50MB)
- Stored in S3 under `documents/{uuid}/{originalFilename}`
- A `ProcessedDocument` record is created in the in-memory store with `status: "uploaded"`

### Stage 2: Textract OCR (`processing`)

```
API (/api/process)         AWS S3              Amazon Textract
  │                          │                       │
  │── GetObjectCommand ─────►│                       │
  │◄── File bytes ───────────│                       │
  │                          │                       │
  │── AnalyzeDocumentCommand ────────────────────────►│
  │   (FORMS + TABLES)       │                       │
  │◄── Blocks[] (OCR output) ────────────────────────│
  │                          │                       │
  │── Extract:               │                       │
  │   • Key-Value pairs      │                       │
  │   • Tables               │                       │
  │   • Full text            │                       │
```

- File bytes are retrieved from S3
- Amazon Textract's `AnalyzeDocument` is called with **FORMS** and **TABLES** feature types
- FORMS feature automatically enables handwritten text detection
- Three extraction functions parse the Textract `Block[]` response:
  - `extractKeyValuePairs()` — maps KEY → VALUE blocks with confidence scores
  - `extractTables()` — extracts tabular data as `string[][][]` (array of tables, each containing rows of cells)
  - `extractFullText()` — concatenates all LINE blocks into readable text

### Stage 3: AI Structuring (`structuring`)

```
API (/api/process)                      OpenAI GPT-4o
  │                                          │
  │── Chat completion request ──────────────►│
  │   • Raw OCR text                         │
  │   • Key-value pairs                      │
  │   • Tables                               │
  │   • File name                            │
  │                                          │
  │◄── Structured JSON ─────────────────────│
  │   {                                      │
  │     docType: "Invoice",                  │
  │     overallConfidence: 92,               │
  │     fields: [...],                       │
  │     lineItems: [...]                     │
  │   }                                      │
```

- All Textract outputs (raw text, key-value pairs, tables) are sent to GPT-4o
- A carefully engineered prompt instructs the model to:
  1. Classify the document type
  2. Extract header fields with confidence scores
  3. Extract line items (code, description, qty, price, total)
  4. Cross-validate totals and fix OCR errors
  5. Handle handwritten text with best-effort extraction
- Temperature is set to `0.1` for deterministic output
- Response is parsed as JSON with fallback error handling

### Stage 4: Ready for Review (`review`)

```
API (/api/process)              In-Memory Store
  │                                  │
  │── Update document: ────────────►│
  │   status: "review"              │
  │   docType: "Invoice"            │
  │   fields: [...]                 │
  │   lineItems: [...]              │
  │   overallConfidence: 92         │
  │   rawOcrText: "..."             │
  │   processedAt: "..."            │
  │                                 │
  │◄── Updated document ────────────│
```

- The structured data is stored in the document record
- Status changes to `"review"` — the document now appears in the Review Queue
- The review page allows human operators to:
  - View extracted fields side-by-side with confidence badges
  - Edit incorrect values inline
  - View line items in a table format
  - Approve or reject the document

---

## 6. Backend Implementation

### 6.1 Shared Types (`src/lib/types.ts`)

Defines all TypeScript interfaces shared between API routes and frontend.

#### Document Status Flow

```
uploading → uploaded → processing → structuring → review → approved
                                                         → rejected
                                              error ←────┘ (any stage)
```

| Status | Description |
|--------|-------------|
| `uploading` | File is being uploaded to S3 |
| `uploaded` | File stored in S3, ready for processing |
| `processing` | Textract OCR is running |
| `structuring` | OpenAI GPT-4o is structuring the data |
| `review` | Extraction complete, awaiting human review |
| `approved` | Document reviewed and approved |
| `rejected` | Document reviewed and rejected |
| `error` | An error occurred during any stage |

#### Key Interfaces

```typescript
interface ProcessedDocument {
  id: string;                          // UUID v4
  fileName: string;                    // Original file name
  fileSize: number;                    // Size in bytes
  fileType: string;                    // MIME type
  s3Key: string;                       // S3 object key
  status: DocumentStatus;              // Current pipeline status
  source: DocumentSource;              // "upload" | "whatsapp"
  docType?: string;                    // Classified type (Invoice, PO, etc.)
  overallConfidence: number;           // 0-100 overall extraction confidence
  fields: ExtractedField[];            // Extracted key-value fields
  lineItems: LineItem[];               // Extracted line items
  rawTextractOutput?: Record<string, unknown>;  // Textract metadata
  rawOcrText?: string;                 // Full OCR text
  createdAt: string;                   // ISO timestamp
  updatedAt: string;                   // ISO timestamp
  processedAt?: string;               // When processing completed
  approvedAt?: string;                // When approved
  error?: string;                      // Error message if failed
}

interface ExtractedField {
  id: string;          // e.g. "f1", "f2"
  label: string;       // Field label (e.g. "Invoice Number")
  value: string;       // Extracted value
  confidence: number;  // 0-100 confidence score
  edited: boolean;     // Whether user has edited this field
  textractKey?: string; // Original Textract key name
}

interface LineItem {
  id: string;           // e.g. "l1", "l2"
  code: string;         // Item/product code
  description: string;  // Item description
  qty: number;          // Quantity
  unitPrice: string;    // Unit price as string for precision
  total: string;        // Line total
  confidence: number;   // 0-100 confidence
}
```

---

### 6.2 Document Store (`src/lib/store.ts`)

An **in-memory singleton store** that persists across API calls within the same server process. Uses the `globalThis` pattern to survive module hot-reloading in development.

#### Singleton Pattern

```typescript
const globalStore = globalThis as typeof globalThis & { _documentStore?: DocumentStore };
if (!globalStore._documentStore) {
  globalStore._documentStore = new DocumentStore();
}
export const documentStore: DocumentStore = globalStore._documentStore;
```

#### Available Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `create` | `(doc: ProcessedDocument) → ProcessedDocument` | Create a new document record |
| `get` | `(id: string) → ProcessedDocument \| undefined` | Get document by ID |
| `update` | `(id: string, updates: Partial<ProcessedDocument>) → ProcessedDocument \| undefined` | Partial update (auto-sets `updatedAt`) |
| `delete` | `(id: string) → boolean` | Delete document |
| `list` | `(options?: { status?, limit? }) → ProcessedDocument[]` | List documents with filters, sorted by `createdAt` desc |
| `count` | `(status?: string) → number` | Count documents, optionally by status |
| `stats` | `() → StatsObject` | Aggregate stats (total, by-status counts, avg confidence) |

#### Stats Response Shape

```typescript
{
  total: number;
  uploading: number;
  processing: number;   // includes "structuring"
  review: number;
  approved: number;
  rejected: number;
  errors: number;
  avgConfidence: number; // average of all docs with confidence > 0
}
```

> **Note:** In production, this should be replaced with a database (PostgreSQL, DynamoDB, MongoDB, etc.). The in-memory store is designed for demo/prototype purposes.

---

### 6.3 AWS S3 Client (`src/lib/aws.ts`)

```typescript
import { S3Client } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export const S3_BUCKET = process.env.AWS_S3_BUCKET || "docuai-uploads";
```

- Uses AWS SDK v3 (modular imports)
- Credentials are read from environment variables
- Bucket name is configurable via `AWS_S3_BUCKET`

---

### 6.4 Amazon Textract Client (`src/lib/textract.ts`)

```typescript
import { TextractClient } from "@aws-sdk/client-textract";

export const textractClient = new TextractClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});
```

- Shares the same AWS credentials as S3
- Region must support Amazon Textract (e.g., `us-east-1`, `eu-west-1`)

---

### 6.5 OpenAI Client (`src/lib/openai.ts`)

```typescript
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});
```

- Uses the official OpenAI SDK v6
- Model used: **GPT-4o** (selected for multimodal capabilities and accuracy)

---

## 7. API Routes

### 7.1 POST `/api/upload`

**Purpose:** Receive a file upload, store it in S3, and create a document record.

| Parameter | Type | Location | Required | Description |
|-----------|------|----------|----------|-------------|
| `file` | `File` | FormData body | Yes | The document file to upload |

**Validation Rules:**
- Maximum file size: **50 MB**
- Accepted MIME types: `application/pdf`, `image/jpeg`, `image/png`, `image/tiff`, `image/webp`
- Files ending in `.pdf` are also accepted regardless of MIME type

**S3 Key Format:**
```
documents/{uuid}/{originalFilename}
```

**Success Response (200):**
```json
{
  "documentId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "s3Key": "documents/a1b2c3d4-e5f6-7890-abcd-ef1234567890/Invoice_123.pdf",
  "status": "uploaded",
  "message": "File uploaded successfully. Ready for processing."
}
```

**Error Responses:**
| Status | Condition |
|--------|-----------|
| 400 | No file provided |
| 400 | File exceeds 50MB limit |
| 400 | Unsupported file type |
| 500 | S3 upload failure |

---

### 7.2 POST `/api/process`

**Purpose:** Run the full Textract → OpenAI processing pipeline on an uploaded document.

| Parameter | Type | Location | Required | Description |
|-----------|------|----------|----------|-------------|
| `documentId` | `string` | JSON body | Yes | UUID of the uploaded document |

**Processing Steps:**
1. Retrieve file bytes from S3 via `GetObjectCommand`
2. Call `AnalyzeDocumentCommand` with `FeatureType.FORMS` + `FeatureType.TABLES`
3. Parse Textract blocks into key-value pairs, tables, and full text
4. Send to OpenAI GPT-4o for intelligent structuring
5. Store structured results and update status to `"review"`

**Runtime Configuration:**
```typescript
export const runtime = "nodejs";
export const maxDuration = 60; // 60 seconds timeout
```

**Success Response (200):**
```json
{
  "documentId": "a1b2c3d4-...",
  "status": "review",
  "docType": "Invoice",
  "overallConfidence": 92,
  "fields": [
    { "id": "f1", "label": "Invoice Number", "value": "INV-2026-001", "confidence": 95, "edited": false },
    { "id": "f2", "label": "Vendor Name", "value": "Hamdan Trading LLC", "confidence": 97, "edited": false }
  ],
  "lineItems": [
    { "id": "l1", "code": "PRD-001", "description": "Steel Plates", "qty": 100, "unitPrice": "45.00", "total": "4500.00", "confidence": 94 }
  ],
  "processedAt": "2026-03-26T10:30:00.000Z"
}
```

**Error Responses:**
| Status | Condition |
|--------|-----------|
| 400 | `documentId` not provided |
| 404 | Document not found in store |
| 422 | Textract extracted no text (empty/corrupted document) |
| 500 | S3 retrieval, Textract, or OpenAI failure |

---

### 7.3 GET `/api/documents`

**Purpose:** List all documents with optional filtering. Also returns aggregate stats.

| Parameter | Type | Location | Required | Description |
|-----------|------|----------|----------|-------------|
| `status` | `string` | Query param | No | Filter by document status |
| `limit` | `number` | Query param | No | Limit number of results |

**Example Request:**
```
GET /api/documents?status=review&limit=10
```

**Success Response (200):**
```json
{
  "documents": [ /* array of ProcessedDocument */ ],
  "total": 5,
  "stats": {
    "total": 25,
    "uploading": 0,
    "processing": 2,
    "review": 5,
    "approved": 15,
    "rejected": 2,
    "errors": 1,
    "avgConfidence": 91
  }
}
```

---

### 7.4 GET `/api/documents/[id]`

**Purpose:** Retrieve a single document with all extracted data.

**Next.js 16 Params Pattern:**
```typescript
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ...
}
```

> Note: Next.js 16 requires `params` to be a `Promise` that must be awaited.

**Success Response (200):** Full `ProcessedDocument` object.

**Error Response (404):** `{ "error": "Document not found" }`

---

### 7.5 PATCH `/api/documents/[id]`

**Purpose:** Update a document — edit fields, change status, approve, or reject.

**Allowed Update Fields:**
- `status` — Change document status
- `fields` — Update extracted fields (after human edits)
- `lineItems` — Update extracted line items
- `docType` — Change classified document type
- `overallConfidence` — Update confidence score

**Special Behavior:**
- Setting `status: "approved"` automatically sets `approvedAt` to current timestamp

**Example — Approve a document:**
```json
PATCH /api/documents/a1b2c3d4-...
{
  "status": "approved"
}
```

**Example — Save edited fields:**
```json
PATCH /api/documents/a1b2c3d4-...
{
  "fields": [
    { "id": "f1", "label": "Invoice Number", "value": "INV-2026-002", "confidence": 95, "edited": true }
  ]
}
```

---

## 8. Frontend Implementation

### 8.1 Upload Page (`src/app/dashboard/upload/page.tsx`)

The upload page provides a complete document upload experience with real-time pipeline visualization.

#### Features
- **Drag & drop** file upload zone with click-to-browse fallback
- **Multi-file** support — queue and process multiple documents simultaneously
- **Real-time status** tracking through 4 stages: Queued → Uploading → Textract OCR → AI Structuring → Complete
- **3-step pipeline visualization** cards showing S3 Upload, Textract OCR, and AI Structuring stages
- **Supported formats** display: PDF, JPG, PNG, TIFF
- **File size formatting** and type-specific icons
- **Error handling** with retry capability
- **Direct link** to review page with `?doc={documentId}` param after processing

#### Processing Flow (Client-Side)

```typescript
async function processFile(file, onUpdate) {
  // Step 1: Upload to S3 via /api/upload
  onUpdate({ status: "uploading", progress: 20 });
  const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
  
  // Step 2: Trigger Textract + OpenAI via /api/process
  onUpdate({ status: "processing", progress: 60 });
  const processRes = await fetch("/api/process", { 
    method: "POST", 
    body: JSON.stringify({ documentId }) 
  });
  
  // Step 3: Structuring status
  onUpdate({ status: "structuring", progress: 80 });
  
  // Step 4: Complete
  onUpdate({ status: "done", progress: 100, confidence, docType });
}
```

#### File Status Configuration

| Status | Label | Visual |
|--------|-------|--------|
| `queued` | Queued | Gray badge |
| `uploading` | Uploading to S3 | Blue/primary animated |
| `processing` | Textract OCR | Cyan/secondary animated |
| `structuring` | AI Structuring | Purple animated |
| `done` | Complete | Green success |
| `error` | Failed | Red with retry button |

---

### 8.2 Review Page (`src/app/dashboard/review/page.tsx`)

A split-screen document review interface for human validation of extracted data.

#### Features
- **Document queue** panel (left) showing all documents with `status: "review"`
- **Extraction details** panel (right) with editable fields and line items
- **Confidence badges** color-coded: ≥90% green, ≥80% amber, <80% red
- **Inline editing** — click any field value to edit, mark as `edited: true`
- **Line items table** showing code, description, qty, unit price, total
- **Raw OCR text** display for reference
- **Approve / Reject** buttons with API integration
- **Save edits** functionality via PATCH API
- **Copy JSON** export of all extracted data
- **URL param support** — `?doc={id}` to auto-select a specific document
- **Refresh queue** button to reload documents
- **Loading / empty states** with appropriate CTAs
- **Suspense boundary** wrapping for `useSearchParams()` (Next.js 16 requirement)

#### API Integration

```typescript
// Fetch review queue
const res = await fetch("/api/documents?status=review");
const data = await res.json();

// Approve document
await fetch(`/api/documents/${doc.id}`, {
  method: "PATCH",
  body: JSON.stringify({ status: "approved" }),
});

// Save field edits
await fetch(`/api/documents/${doc.id}`, {
  method: "PATCH",
  body: JSON.stringify({ fields: editedFields, lineItems }),
});

// Reject document
await fetch(`/api/documents/${doc.id}`, {
  method: "PATCH",
  body: JSON.stringify({ status: "rejected" }),
});
```

---

### 8.3 Dashboard Page (`src/app/dashboard/page.tsx`)

The main dashboard provides an overview of all document processing activity.

#### Dynamic Data Features
- **Real-time polling** — fetches `/api/documents` every 10 seconds
- **Stats grid** — shows total documents, pending review, accuracy rate, with fallback to demo values
- **Processing pipeline** — visual pipeline showing counts at each stage (Uploaded → OCR → AI → Review → Completed)
- **Recent documents** — displays real API documents when available, falls back to demo data
- **Quick actions** — dynamic descriptions based on real queue counts
- **Relative time display** — "2 min ago", "1 hr ago", etc.

#### Data Merging Strategy

The dashboard gracefully merges real API data with demo data:

```typescript
// Pipeline: use real stats if available, else demo defaults
const pipeline = apiStats
  ? [
      { stage: "Uploaded", count: computed },
      { stage: "OCR Running", count: apiStats.processing },
      { stage: "Pending Review", count: apiStats.review },
      { stage: "Completed Today", count: apiStats.approved },
    ]
  : pipelineDefaults;

// Documents: show API docs if available, else demo docs
const displayDocs = apiDocs.length > 0
  ? apiDocs.slice(0, 6).map(d => ({ /* transform API shape */ }))
  : recentDocs;
```

---

## 9. Handwritten Document Support

DocuAI supports handwritten documents through Amazon Textract's built-in handwriting detection.

### How It Works

When `FeatureType.FORMS` is passed to `AnalyzeDocument`, Textract automatically enables:
- **Printed text detection** — standard OCR
- **Handwritten text detection** — recognizes handwriting on forms
- **Mixed mode** — handles documents with both printed and handwritten content

### Textract Configuration

```typescript
const textractResponse = await textractClient.send(
  new AnalyzeDocumentCommand({
    Document: { Bytes: fileBytes },
    FeatureTypes: [FeatureType.FORMS, FeatureType.TABLES],
    // FORMS feature includes handwriting detection automatically
  })
);
```

### OpenAI Enhancement

The GPT-4o prompt specifically instructs:
```
**Handle handwritten text** — if the text appears handwritten or has low OCR confidence,
flag it but still attempt best-effort extraction.
```

This means even when Textract produces lower confidence for handwritten characters, GPT-4o applies contextual reasoning to improve accuracy.

### Supported Handwritten Scenarios
| Scenario | Support Level |
|----------|--------------|
| Printed forms with handwritten fills | Excellent |
| Fully handwritten notes | Good (depends on legibility) |
| Mixed printed + handwritten | Excellent |
| Signatures | Detected but not interpreted |
| Checkboxes / selection elements | Supported (☑ / ☐) |

---

## 10. OpenAI Structuring — Prompt Engineering

The GPT-4o prompt is carefully engineered for maximum extraction accuracy.

### System Message
```
You are a document data extraction specialist. Always respond with valid JSON only.
No markdown, no explanations. Extract business document data with high accuracy.
```

### User Prompt Structure

The prompt provides GPT-4o with:
1. **File name** — for context about expected document type
2. **Raw OCR text** — the full extracted text from Textract
3. **Key-value pairs** — structured form fields with confidence scores
4. **Table data** — extracted tabular content

### Instructions Given to GPT-4o

1. **Document type classification** — Invoice, Purchase Order, Delivery Note, Receipt, Bill of Lading, Quotation, Credit Note, or Other
2. **Header field extraction** — Document Number, Date, Vendor/Supplier, Customer, PO Number, Payment Terms, Currency, Amounts, etc.
3. **Line item extraction** — Item codes, descriptions, quantities, unit prices, totals
4. **Accuracy improvement** — Cross-validate totals, fix OCR errors (`l` → `1`, `O` → `0`), standardize dates, clean currency values
5. **Handwritten handling** — Best-effort extraction with appropriate confidence flags
6. **Confidence scoring** — 0-100 per field based on OCR quality and cross-validation

### Model Configuration

| Parameter | Value | Reason |
|-----------|-------|--------|
| Model | `gpt-4o` | Best accuracy for document understanding |
| Temperature | `0.1` | Near-deterministic output for data extraction |
| Max Tokens | `4000` | Sufficient for complex documents with many fields |

### Response Parsing

```typescript
// Clean any markdown fences GPT might add
const cleaned = content
  .replace(/```json\s*/g, "")
  .replace(/```\s*/g, "")
  .trim();

const parsed = JSON.parse(cleaned);

// Add IDs and defaults
const fields = parsed.fields.map((f, i) => ({
  id: `f${i + 1}`,
  ...f,
  edited: false,
}));
```

---

## 11. Configuration

### `next.config.ts`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@aws-sdk/client-textract", "@aws-sdk/client-s3"],
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
```

| Setting | Value | Purpose |
|---------|-------|---------|
| `serverExternalPackages` | `["@aws-sdk/client-textract", "@aws-sdk/client-s3"]` | Prevent Turbopack from bundling AWS SDKs (they use Node.js APIs) |
| `bodySizeLimit` | `"50mb"` | Allow large file uploads for documents |

---

## 12. Environment Variables

Create a `.env.local` file in the project root:

```bash
# ─── AWS Configuration ───────────────────────────────────────────
AWS_ACCESS_KEY_ID=AKIA...your_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1

# ─── S3 Bucket ───────────────────────────────────────────────────
AWS_S3_BUCKET=docuai-uploads

# ─── OpenAI ──────────────────────────────────────────────────────
OPENAI_API_KEY=sk-proj-...your_key

# ─── App ─────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

| Variable | Required | Description |
|----------|----------|-------------|
| `AWS_ACCESS_KEY_ID` | Yes | IAM user access key ID |
| `AWS_SECRET_ACCESS_KEY` | Yes | IAM user secret access key |
| `AWS_REGION` | Yes | AWS region (must support Textract) |
| `AWS_S3_BUCKET` | Yes | S3 bucket name for document storage |
| `OPENAI_API_KEY` | Yes | OpenAI API key (needs GPT-4o access) |
| `NEXT_PUBLIC_APP_URL` | No | Application URL (for CORS, webhooks) |

---

## 13. AWS IAM Permissions

Create an IAM user with the following permissions:

### Minimum Required Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3DocumentAccess",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::docuai-uploads",
        "arn:aws:s3:::docuai-uploads/*"
      ]
    },
    {
      "Sid": "TextractAccess",
      "Effect": "Allow",
      "Action": [
        "textract:AnalyzeDocument",
        "textract:DetectDocumentText"
      ],
      "Resource": "*"
    }
  ]
}
```

### S3 Bucket Configuration

1. Create a bucket named `docuai-uploads` (or your chosen name)
2. Block all public access (documents are accessed via SDK, not public URLs)
3. Enable versioning (recommended for production)
4. No special CORS configuration needed (server-side only access)

---

## 14. Setup & Installation

### Prerequisites
- **Node.js** 18.17+ (recommended: 20.x)
- **npm** 9+ or **pnpm** / **yarn**
- **AWS Account** with S3 and Textract access
- **OpenAI Account** with GPT-4o API access

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/gagan-sethi/docuai.git
cd docuai

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your actual keys

# 4. Create S3 bucket
# Via AWS Console or CLI:
aws s3 mb s3://docuai-uploads --region us-east-1

# 5. Run development server
npm run dev

# 6. Open in browser
open http://localhost:3000
```

### Build for Production

```bash
# Build
npm run build

# Start production server
npm start
```

---

## 15. Deployment (Vercel)

The project is deployed on Vercel at: **[docuai-pearl.vercel.app](https://docuai-pearl.vercel.app)**

### Vercel Configuration

1. **Framework:** Auto-detected as Next.js
2. **Build Command:** `next build`
3. **Output Directory:** `.next`
4. **Node.js Version:** 20.x

### Environment Variables on Vercel

Add all variables from `.env.local` to Vercel's Environment Variables:

```
Settings → Environment Variables → Add:
  AWS_ACCESS_KEY_ID      = AKIA...
  AWS_SECRET_ACCESS_KEY  = ...
  AWS_REGION             = us-east-1
  AWS_S3_BUCKET          = docuai-uploads
  OPENAI_API_KEY         = sk-proj-...
  NEXT_PUBLIC_APP_URL    = https://docuai-pearl.vercel.app
```

### Important Vercel Notes

| Setting | Requirement |
|---------|-------------|
| **Function Duration** | Upgrade to Pro for 60s timeout (needed for Textract + OpenAI processing) |
| **Serverless Functions** | API routes run as serverless functions with `runtime: "nodejs"` |
| **Body Size** | `50mb` limit configured in `next.config.ts` |
| **Cold Starts** | In-memory store resets on cold starts; use database for persistence |

### Deploy via CLI

```bash
npm i -g vercel
vercel --yes
vercel --prod
```

---

## 16. API Reference — Quick Cheat Sheet

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/api/upload` | `FormData { file }` | Upload document to S3 |
| `POST` | `/api/process` | `{ documentId }` | Run Textract + OpenAI pipeline |
| `GET` | `/api/documents` | — | List all documents + stats |
| `GET` | `/api/documents?status=review` | — | List documents by status |
| `GET` | `/api/documents/[id]` | — | Get single document |
| `PATCH` | `/api/documents/[id]` | `{ status, fields, ... }` | Update document |

### cURL Examples

```bash
# Upload a document
curl -X POST http://localhost:3000/api/upload \
  -F "file=@/path/to/invoice.pdf"

# Process it
curl -X POST http://localhost:3000/api/process \
  -H "Content-Type: application/json" \
  -d '{"documentId": "a1b2c3d4-..."}'

# List review queue
curl http://localhost:3000/api/documents?status=review

# Approve a document
curl -X PATCH http://localhost:3000/api/documents/a1b2c3d4-... \
  -H "Content-Type: application/json" \
  -d '{"status": "approved"}'
```

---

## 17. Future Enhancements

| Enhancement | Description | Priority |
|-------------|-------------|----------|
| **Database Integration** | Replace in-memory store with PostgreSQL/DynamoDB | High |
| **Async Processing** | Use SQS/SNS for long-running Textract jobs (`StartDocumentAnalysis`) | High |
| **Authentication** | Add NextAuth.js / Clerk for real user auth | High |
| **WhatsApp Integration** | Twilio/Meta API for receiving documents via WhatsApp | Medium |
| **Batch Processing** | Process multiple documents in parallel | Medium |
| **Document Preview** | Render PDF/image preview in the review page | Medium |
| **Export to Excel** | Generate XLSX from approved documents | Medium |
| **Audit Trail** | Track all edits, approvals, rejections with timestamps | Medium |
| **Multi-tenant** | Organization-based data isolation | Low |
| **Textract Async API** | Use `StartDocumentAnalysis` for documents >5MB or multi-page | Low |
| **Custom ML Models** | Train Textract Custom Queries or Comprehend for domain-specific extraction | Low |
| **Webhooks** | Notify external systems when documents are approved | Low |

---

## License

Private — All rights reserved.

---

*Documentation generated on March 26, 2026*
*DocuAI v0.1.0 — Intelligent Document Processing Platform*
