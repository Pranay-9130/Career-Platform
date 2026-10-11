# Day 17 — Project Resources + ZIP Handling

**Phase:** Project Resources + ZIP Handling  
**Status:** [x] Completed  
**Target Completion:** Day 17 of 40  

---

## 1. Objective
Build a robust, security-hardened ZIP file upload, validation, local storage, and download distribution subsystem for project starter kits and source code archives. Enforce binary header inspection (`PK\x03\x04`), strict file size caps (50 MB), zip-bomb defense (250 MB uncompressed limit, 2000 files limit), path traversal security, and strict rejection of compiled binaries and leaked secrets.

---

## 2. Key Features Implemented

### ZIP Security Engine (`backend/app/services/zip_service.py`)
- **Binary Signature Inspection:**
  - Verifies the standard 4-byte ZIP magic header (`b"PK\x03\x04"`, `0x50 0x4B 0x03 0x04`) directly on the raw byte stream before parsing with `zipfile.ZipFile`.
  - Rejects spoofed files (e.g. text/scripts renamed to `.zip`) with HTTP 400.
- **50 MB Compressed Size Limit:**
  - Streaming size check prevents disk saturation and oversized uploads.
- **Zip Bomb & Decompression Ratio Protection:**
  - Limits maximum uncompressed extracted footprint to **250 MB**.
  - Limits total file entry count to **2,000 files**.
  - Aborts immediately if archive contents exceed safety ratios.
- **Path Traversal & Archive Extraction Defense:**
  - Validates all member file paths in the archive against directory traversal sequences (`..`, absolute paths `/`, `\\`, drive letters).
  - Normalizes relative paths safely.
- **Executable Binary Blacklist:**
  - Automatically scans all internal filenames and extensions, rejecting executable binaries:
    - Windows: `.exe`, `.dll`, `.bat`, `.cmd`, `.msi`, `.vbs`, `.ps1`
    - Linux/Unix: `.so`, `.dylib`, `.sh`, `.bin`
    - Bytecode: `.pyc`, `.class`
- **Leaked Secret & Sensitive File Shield:**
  - Scans for and rejects accidental leaks of environment configuration or private keys:
    - Environment configs: `.env`, `.env.local`, `.env.production`
    - Private cryptographic keys: `id_rsa`, `id_ed25519`, `.pem`, `.key`
    - Git internals: `.git/` tree bundles
- **Safe Local File System Storage:**
  - Stores validated project archives in `uploads/projects/<uuid>_<safe_filename>.zip`.
  - Directory structure initialized automatically with isolated permissions.

---

### Backend Endpoints (`backend/app/api/routes/projects.py`)
- **`POST /api/projects/upload-zip` (Standalone Draft Upload):**
  - Authenticated endpoint accepting multipart/form-data ZIP upload.
  - Runs full binary verification, zip bomb protection, and security policy checks.
  - Returns `zip_storage_key`, `zip_file_size_bytes`, `filename`, `file_count`, and `uncompressed_size_bytes`.
- **`POST /api/projects/{identifier}/upload-zip` (Attach to Project):**
  - Authenticated endpoint allowing the project owner or admin to attach a validated ZIP directly to an existing draft, submitted, or published project.
  - Updates `project.zip_storage_key` and `project.zip_file_size_bytes` in SQLite/PostgreSQL.
- **`GET /api/projects/{slug}/download` (Secure Download Endpoint):**
  - Publicly accessible for `Published` projects.
  - For unapproved drafts or pending submissions, strictly requires project owner or admin authentication.
  - Streams the file as an attachment (`Content-Disposition: attachment; filename="{slug}-source.zip"`) with `media_type="application/zip"`.

---

### Frontend Integration
- **`frontend/src/services/projectService.js`:**
  - `uploadStandaloneZip(file)`: Sends multipart form data to `/projects/upload-zip`.
  - `uploadProjectZip(idOrSlug, file)`: Sends multipart form data to `/projects/{idOrSlug}/upload-zip`.
  - `getDownloadUrl(slug)`: Returns direct download route `/api/projects/{slug}/download`.
- **`frontend/src/pages/student/ProjectSubmissionPage.jsx`:**
  - Client-side pre-validation checking file extension (`.zip`) and 50 MB hard limit.
  - Client-side binary inspection using `file.slice(0, 4).arrayBuffer()` checking `bytes[0..3] === [0x50, 0x4B, 0x03, 0x04]`.
  - Dynamic spinner state (`isUploadingZip`) and detailed security feedback alerts (`zipUploadError`).
  - Verified package attachment card displaying verified status, file size in KB, and one-click removal.
- **`frontend/src/pages/public/ProjectDetailPage.jsx`:**
  - Header action CTA row includes **"Download ZIP"** primary button when `zip_download_url` is available.
  - Right sidebar displays **"Download Project Starter Kit"** button with exact formatted archive size (`(XXX KB ZIP)`).

---

## 3. Verification & Testing

### Automated Backend Tests
- **Created `backend/tests/unit/test_project_zip.py`** with 7 unit test cases:
  1. `test_upload_valid_zip_standalone`: Validates successful archive upload, inspection metrics, and storage key generation.
  2. `test_upload_zip_invalid_magic_bytes`: Confirms rejection of plain text files disguised as `.zip` with HTTP 400.
  3. `test_upload_zip_forbidden_binary`: Verifies HTTP 400 rejection when `.exe` or `.dll` files are detected inside archive.
  4. `test_upload_zip_forbidden_secret_env`: Verifies HTTP 400 rejection when `.env` configuration file is detected inside archive.
  5. `test_upload_zip_path_traversal`: Verifies HTTP 400 rejection on zip members containing path traversal segments (`../secret.txt`).
  6. `test_attach_zip_to_project_and_download`: Confirms end-to-end attachment to project record and file retrieval via `GET /api/projects/{slug}/download`.
  7. `test_download_draft_project_zip_forbidden_for_other_users`: Confirms HTTP 403 authorization boundary preventing non-owners from downloading draft source archives.
- **Full Pytest Suite:** All 67 backend unit tests passing in `54.64s`.

### Frontend Build
- **Vite Production Compilation:** `npm run build` executed and passed cleanly with 0 errors (`✓ built in 49.40s`).

---

## 4. Next Step
Proceed to **Day 18 — Authors + Contributors** (Co-authors attribution, user profile linking, public portfolio badges, contributor contribution display).
