# Day 24: ATS Analyzer + Google Gemini AI

**Status:** Completed `[x]`  
**Date:** March 2026 (Accelerated 30-Day Master Roadmap)

---

## 1. Objectives & Overview
Day 24 implements an intelligent dual-input ATS Match Analyzer. Candidates can compare their saved or pasted resumes against either platform-listed jobs or custom job descriptions (JDs). The system provides multi-dimensional match scoring (Skills, Experience, Education, Formatting), keyword matrix diagnostics (matched vs. missing keywords), and concrete bullet-by-bullet rewrites powered by Google Gemini AI with automatic graceful fallback to an advanced deterministic NLP rule-based engine.

---

## 2. Key Architecture & Features Implemented

### A. Dual-Engine ATS Analysis Service (`backend/app/services/ats_analyzer.py`)
- **Google Gemini AI Integration**:
  - Leverages Google Gemini REST API (`gemini-1.5-pro` / `v1beta`) via asynchronous `httpx.AsyncClient`.
  - Structured system instructions prompt Gemini to act as a principal technical recruiter and enterprise ATS parsing bot.
  - Generates dimensional score breakdowns, matched and missing technical skills, critical gaps, and bullet rewrite suggestions with recruiter rationale.
- **Deterministic Rule-Based NLP Fallback**:
  - Fully functional when `GEMINI_API_KEY` is unset or in isolated CI/CD test environments.
  - Curated dictionary of 60+ technical keywords across languages, frameworks, databases, and cloud tools.
  - Evaluates action verbs (`architected`, `engineered`, `optimized`), quantifiable impact metrics (`\d+%`, `\d+k`, `\d+x`), and academic credentials.
  - Generates actionable bullet-point recommendations injecting missing job description technologies.
- **Structured Resume Serializer (`extract_resume_text_from_dict`)**:
  - Automatically compiles saved `Resume` model records into normalized plain-text streams for evaluation.

### B. Backend API Endpoints & Schemas
- **Pydantic Schemas (`backend/app/schemas/ats.py`)**:
  - `AtsAnalysisRequest`: Supports `resume_id` (UUID), `resume_text` (str), `job_id` (UUID), and `job_description` (str).
  - `AtsAnalysisResponse`: Returns `overall_score`, `verdict`, `summary`, `breakdown` (skills, experience, education, formatting), `matched_skills`, `missing_skills`, `critical_gaps`, `bullet_recommendations`, and `analyzed_with`.
  - Exported in `backend/app/schemas/__init__.py`.
- **API Route (`backend/app/api/routes/resumes.py`)**:
  - `POST /api/resumes/analyze-ats`: Protected route resolving input references from either saved entities or raw strings with cross-user ownership isolation.

### C. Frontend Service & Interactive Analyzer Page
- **Frontend Service (`frontend/src/services/resumeService.js`)**:
  - Added `analyzeAts(payload)` method for seamless communication with the backend.
- **ATS Analyzer Page (`frontend/src/pages/student/AtsAnalyzerPage.jsx`)**:
  - **Dual-Input Selection Bar**:
    - Resume selector: Switch between saved drafts from `resumes` and raw text paste.
    - Job selector: Switch between platform jobs from `jobs` and custom JD text with 1-click sample button.
  - **Match Results Dashboard**:
    - Circular radial match score dial (0–100%) with dynamic color states (`High Match`, `Moderate Match`, `Needs Optimization`).
    - Dimensional breakdown meters for Technical Skills, Experience & Metrics, Education, and ATS Layout.
    - Executive assessment callout.
  - **Keyword Diagnostic Matrix**:
    - Matched role keywords (green badges).
    - Missing role keywords (rose badges with `+` cues).
  - **Critical Requirements & Gaps**:
    - Actionable callout card highlighting dealbreaker gaps (e.g. missing cloud deployment experience or lack of metric numbers).
  - **Gemini AI Bullet-Point Rewrites**:
    - Before vs. After comparison cards highlighting passive original lines vs. action-driven metric rewrites.
    - Recruiter rationale commentary explaining why the edit increases ATS rank.
    - One-click "Copy Rewrite" button with clipboard toast notification.
    - Direct CTA button navigating into the Live ATS Resume Builder.
- **Route Registration (`frontend/src/App.jsx`)**:
  - Connected `/ats-analyzer` to `<AtsAnalyzerPage />` inside the student workspace.

---

## 3. Verification & Test Results

### A. Automated Backend Pytest Suite
- **New Unit Tests (`backend/tests/unit/test_ats_analyzer.py`)**:
  - `test_unauthenticated_analyze_rejected`: Validates 401 on unauthenticated requests.
  - `test_missing_inputs_rejected`: Validates 400 when resume or JD inputs are missing.
  - `test_analyze_with_raw_text`: Verifies semantic analysis using raw text inputs.
  - `test_analyze_with_saved_resume_and_job_id`: Verifies analysis combining a saved `Resume` entity and a platform `Job` entity.
  - `test_cross_user_resume_analysis_isolated`: Ensures cross-user isolation blocks unauthorized resume access.
- **Full Platform Test Suite Status**:
  - **110 tests passed out of 110** in `pytest tests/unit/` (`100% pass rate`, 0 failures).

### B. Frontend Production Compilation
- **Vite Build (`frontend`)**:
  - Executed `npm run build`.
  - Output: `✓ 1713 modules transformed` with 0 compilation errors.
