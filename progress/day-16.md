# Day 16 — Project Preview + Drafts

**Phase:** Project Preview + Drafts  
**Status:** [x] Completed  
**Target Completion:** Day 16 of 40  

---

## 1. Objective
Build live submission preview capabilities, draft editing workflows, student submission portfolio management (`/my-projects`), and project deletion endpoints (`DELETE /api/projects/{slug_or_id}`), enabling students to inspect simulated public layouts before submitting and manage work-in-progress drafts.

---

## 2. Key Features Implemented

### Live Submission Preview Modal
- **Full-Fidelity Simulation:**
  - Accessible via the **"Live Full Preview"** action button in the submission header and in Step 6 (Review & Submit).
  - Renders the exact public project detail page presentation before committing:
    - Cover banner or gradient hero with domain, difficulty, and duration badges.
    - Project title and short description.
    - Student author tag with avatar, role, and name.
    - External links row: GitHub repository, live production demo, walkthrough/video demo.
    - Detailed problem statement container with formatted markdown whitespace.
    - Objectives container.
    - Key features checklist with emerald checkmarks.
    - Interactive tech stack tags.
    - Screenshots gallery with lightbox image cards and captions.
    - Contributors list with roles.
  - Modal footer actions: "Back to Editing", "Save Draft", and "Submit Project".

### Draft Editing Flow (`/projects/:slug/edit`)
- **Pre-Populated Edit Mode:**
  - Registered `/projects/:slug/edit` and `/projects/edit/:slug` routes in `frontend/src/App.jsx`.
  - Automatically fetches existing project specs via `projectService.getProjectBySlug(slug)`.
  - Pre-populates all 6 steps of the wizard (Basic Info, Problem & Features, Tech Stack, Visuals, External Links, Contributors).
  - Visual indicator: Amber badge displaying `Editing Existing Submission: :slug`.
  - Seamlessly routes updates to `PUT /api/projects/{slug}` (`projectService.updateProject`) instead of creating duplicates.

### Student Submissions Portfolio (`/my-projects`)
- **`MyProjectsPage.jsx` Dedicated Workspace:**
  - Replaced the placeholder routing with a dedicated, feature-complete portfolio management page.
  - **Portfolio Metrics Bar:** Total projects, drafts in progress, projects under review, and published projects.
  - **Interactive Filter Tabs:** `All`, `Drafts`, `Under Review`, `Published`.
  - **Search & Filtering:** Real-time filter across title, domain, and tech stack tags.
  - **Project Card Actions:**
    - **View:** Opens the public project page `/projects/:slug`.
    - **Edit:** Opens the 6-step submission form pre-populated at `/projects/:slug/edit`.
    - **Delete:** Triggers modal confirmation dialog and removes the project via `DELETE /api/projects/:slug`.
  - **Empty States:** Custom empty state illustrations with quick CTA to start a new submission.

### Backend Endpoints
- **`GET /api/projects/my/submissions`**:
  - Authenticated endpoint returning all projects created by the logged-in student across all statuses (`Draft`, `Submitted`, `Published`).
  - Pre-loads relationships (`owner`, `profile`) and sorts by creation timestamp descending.
- **`DELETE /api/projects/{identifier}`**:
  - Authenticated endpoint allowing project owners or admins to delete drafts or submitted projects.
  - Automatically cleans up associated bookmarks and cascades screenshot records.

---

## 3. Work Breakdown

### Frontend Scope
- `frontend/src/pages/student/MyProjectsPage.jsx`: Production student project dashboard with metrics, filter tabs, search, and action cards.
- `frontend/src/pages/student/ProjectSubmissionPage.jsx`: Integrated edit mode (`useParams`), pre-population from server, and Live Full Preview modal.
- `frontend/src/services/projectService.js`: Added `getMySubmissions()` and `deleteProject(idOrSlug)`.
- `frontend/src/App.jsx`: Wired `/my-projects` and `/projects/:slug/edit` routes.

### Backend Scope
- `backend/app/api/routes/projects.py`: Added `GET /api/projects/my/submissions` and `DELETE /api/projects/{identifier}`.
- `backend/tests/unit/test_projects.py`: Added unit test suites verifying draft retrieval in `my/submissions` and owner/forbidden access controls on `DELETE`.

---

## 4. Testing & Verification

1. **Backend Test Suite:**
   - Ran `python -m pytest tests/unit/test_projects.py`: **14 passed**.
   - Ran `python -m pytest`: **60 passed in 16.73s** (100% pass rate).
2. **Frontend Production Build:**
   - Ran `npm run build` (`vite build`): **0 errors**, generated bundle in 4.89s.
