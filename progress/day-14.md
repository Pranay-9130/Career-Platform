# Day 14 — Submission Guidelines

**Phase:** Submission Guidelines  
**Status:** [x] Completed  
**Target Completion:** Day 14 of 40  

---

## 1. Objective
Build the Project Submission Guidelines and Security Policy compliance gate informing students on upload standards, archive requirements, code safety, and review procedures.

---

## 2. Key Features Implemented
- **Security Policy & Credential Warnings:**
  - Clear red/amber callout strictly forbidding `.env`, `.env.*`, `*.pem`, `*.key`, `id_rsa`, and hardcoded cloud/database credentials.
  - Explanation of the automated security scan and zero-tolerance policy for leaked secrets.
- **ZIP Packaging Standards:**
  - 50 MB hard limit on compressed archives.
  - Binary header validation (`PK\x03\x04`).
  - Max 10:1 compression ratio (uncompressed size capped at 250 MB, file count <= 2,000 files).
  - Path traversal restrictions (blocking `../` sequences).
- **Code Quality & Visual Standards:**
  - Root `README.md` structure requirements (overview, prerequisites, clean installation, run commands).
  - Visuals standard requiring 1 to 5 widescreen (16:9) screenshots (PNG, JPG, WebP <= 5 MB each).
  - Prohibited file rules excluding executables (`.exe`, `.dll`, `.so`, `.msi`) and script binaries (`.bat`, `.cmd`, `.vbs`).
- **Include vs. Exclude Visual Comparison:**
  - Side-by-side terminal-style tree checklist contrasting required source files (`src/`, `README.md`, `.env.example`, `package.json`) against bulky or sensitive files to exclude (`node_modules/`, `.venv/`, `.env`, `dist/`, `.git/`).
- **Interactive FAQ Accordion:**
  - 5 expandable accordion items covering secret stripping, `.env.example` templates, `node_modules` exclusions, moderation timelines, and intellectual property ownership (100% student ownership).
- **Mandatory Pre-Submission Acknowledgement Gate:**
  - 5 interactive confirmation checkboxes verifying secrets removal, archive size, dependencies exclusion, README presence, and code originality.
  - Real-time confirmation progress indicator (`X / 5 Confirmed`).
  - "Select All" / "Deselect All" convenience action.
  - Gated "Continue to Project Submission" button which unlocks only when all 5 criteria are satisfied, persisting compliance timestamp to `localStorage`.
- **Global Application Routing & Navigation:**
  - Registered `/submission-guidelines`, `/guidelines`, and `/projects/submit/guidelines` routes in `frontend/src/App.jsx`.
  - Updated footer link in `frontend/src/components/footer/PublicFooter.jsx` from `/about` to `/submission-guidelines`.
  - Linked from Project Details sidebar (`frontend/src/pages/public/ProjectDetailPage.jsx`).

---

## 3. Work Breakdown

### Frontend Scope
- `frontend/src/pages/public/SubmissionGuidelinesPage.jsx`: Production guidelines and security warning page with compliance gate and expandable FAQs.
- `frontend/src/App.jsx`: Updated routes for `/submission-guidelines`, `/guidelines`, and `/projects/submit/guidelines`.
- `frontend/src/components/footer/PublicFooter.jsx`: Linked "Submission Rules" directly to `/submission-guidelines`.
- `frontend/src/pages/public/ProjectDetailPage.jsx`: Added direct link to submission rules.

### Backend Scope
- N/A (Compliance and informational gateway; verified all existing 55 backend endpoints operate without regression).

### Testing & Verification
- Compliance gate test: verified submission proceed action remains disabled until all 5 checklist items are checked.
- Routing test: verified `/submission-guidelines`, `/guidelines`, and `/projects/submit/guidelines` resolve properly.
- Full test suite: **55 passed** (`pytest`).
- Production build: `vite build` completed with 0 errors.

---

## 4. Acceptance Criteria Status
- [x] Students are thoroughly informed regarding upload standards and security policies.
- [x] Mandatory acknowledgement gate prevents proceeding without confirming all 5 criteria.
- [x] Code passes all linting and type checks (`vite build` succeeded).
- [x] No regression in existing functionality (all 55 backend unit tests passing).

---

## 5. Daily Progress Notes
- **Work Started:** Day 14 execution completed.
- **Files Changed:**
  - `frontend/src/pages/public/SubmissionGuidelinesPage.jsx` (created)
  - `frontend/src/App.jsx` (updated)
  - `frontend/src/components/footer/PublicFooter.jsx` (updated)
  - `frontend/src/pages/public/ProjectDetailPage.jsx` (updated)
  - `progress/day-14.md` (updated)
  - `progress/development-roadmap.md` (updated)
- **Issues Encountered:** None. All tests and builds passed cleanly.
