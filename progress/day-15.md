# Day 15 — Project Submission Form

**Phase:** Project Submission Form  
**Status:** [x] Completed  
**Target Completion:** Day 15 of 40  

---

## 1. Objective
Build a comprehensive, authenticated multi-step project submission form (`/projects/submit`) and backend persistence endpoints (`POST /api/projects`, `PUT /api/projects/{slug_or_id}`) allowing students to submit engineering projects for platform review or save work-in-progress drafts.

---

## 2. Key Features Implemented

### Frontend Multi-Step Submission Wizard (`/projects/submit`)
- **Interactive 6-Step Stepper Flow:**
  - **Step 1: Basic Information:** Project title, domain category selection (8 domains), difficulty level (Beginner/Intermediate/Advanced), estimated duration, and short description (with live 300-character counter).
  - **Step 2: Problem & Features:** Detailed problem statement, project objectives, and dynamic features list with individual item addition and removal.
  - **Step 3: Tech Stack & Learning Outcomes:** Quick-pick popular technology tag pills (React, Next.js, Python, FastAPI, Docker, PostgreSQL, etc.), custom tech tag addition with Enter key, active tag removals, prerequisites, and expected deliverable.
  - **Step 4: Visuals & Media:** Cover banner image URL with real-time preview thumbnail, dynamic screenshot gallery items with image URLs, captions, and remove triggers.
  - **Step 5: Code Repository & Deployment Links:** GitHub repository URL, live production demo URL, walkthrough/Loom video URL, and simulated ZIP source archive dropzone with 50 MB limit checks.
  - **Step 6: Contributors & Pre-Submission Review:** Co-authors list (name, role, GitHub username), live summary card preview contrasting features, screenshots, and source status, plus security compliance badge.
- **Data Persistence & Local Autosaving:**
  - Automatic debounced synchronization to `localStorage` under `student_project_draft`.
  - Autosaved timestamp indicator (`Autosaved at HH:MM`) and "Discard Draft" action to clear cached state.
  - Seamless restoration on revisit so students never lose in-progress work.
- **Dual Submission Actions:**
  - **Save as Draft:** Persists to database as status `"Draft"` without strict validation gating.
  - **Submit for Review:** Validates required fields across steps, persists to database as status `"Submitted"`, clears local storage draft, and displays celebratory success screen with direct link to the new project.

### Backend Endpoints & Data Model
- **Model & Schema Updates:**
  - `backend/app/models/project.py`: Added `contributors = Column(JSON, default=list, nullable=False)`.
  - `backend/app/schemas/project.py`: Added `ContributorItem`, `ProjectCreate`, and `ProjectUpdate` schemas.
- **RESTful Endpoints (`backend/app/api/routes/projects.py`):**
  - `POST /api/projects`: Authenticated student endpoint generating URL-friendly unique slugs (with automated collision resolution), persisting project details, co-authors, and screenshots, and returning `ProjectDetailRead` with HTTP 201 Created.
  - `PUT /api/projects/{identifier}`: Authenticated endpoint allowing project owners or admins to modify draft or submitted projects, update features, contributors, and screenshot lists.

### Platform Routing & Global Discovery
- **Route Registration:**
  - `/projects/submit` protected by `<ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>` in `frontend/src/App.jsx`.
  - Added "Submit Project" action buttons in discovery catalog controls (`frontend/src/pages/public/ProjectsPage.jsx`).
  - Seamless redirection from Day 14 guidelines gate (`/submission-guidelines`) directly to `/projects/submit`.

---

## 3. Work Breakdown

### Frontend Scope
- `frontend/src/pages/student/ProjectSubmissionPage.jsx`: Production-grade 6-step project submission form with autosave, validation, and review card.
- `frontend/src/services/projectService.js`: Added `createProject(projectData)` and `updateProject(idOrSlug, projectData)` methods.
- `frontend/src/App.jsx`: Registered protected route `/projects/submit`.
- `frontend/src/pages/public/ProjectsPage.jsx`: Added "Submit Project" action button.

### Backend Scope
- `backend/app/models/project.py`: Added `contributors` column.
- `backend/app/schemas/project.py`: Added `ContributorItem`, `ProjectCreate`, and `ProjectUpdate` schemas.
- `backend/app/api/routes/projects.py`: Implemented `POST /api/projects` and `PUT /api/projects/{identifier}`, with `_generate_slug` and unified `_map_project_to_detail_read`.
- `backend/tests/unit/test_projects.py`: Added 3 comprehensive unit test suites covering unauthenticated rejection, full multi-step creation with slug collision handling, and owner/forbidden updates.

---

## 4. Testing & Verification

1. **Backend Test Suite:**
   - Ran `python -m pytest tests/unit/test_projects.py`: **12 passed**.
   - Ran `python -m pytest`: **58 passed in 14.23s** (100% pass rate).
2. **Frontend Production Build:**
   - Ran `npm run build` (`vite build`): **0 errors**, generated production bundle in 4.15s.
