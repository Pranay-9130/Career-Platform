# Day 12 — Project Discovery

**Phase:** Project Discovery  
**Status:** [x] Completed  
**Target Completion:** Day 12 of 40  

---

## 1. Objective
Build the public and authenticated project discovery catalog with search, multi-faceted filtering, bookmarking, and responsive pagination.

---

## 2. Key Features Implemented
- **Project Discovery & Bookmarking Database Schema:**
  - `ProjectBookmark` entity (`backend/app/models/project_bookmark.py`) linking authenticated students to bookmarked projects with unique constraint `(user_id, project_id)`.
  - Registered `ProjectBookmark` model in `backend/app/models/__init__.py`.
- **Backend Endpoints:**
  - `GET /api/projects`: Public and authenticated discovery endpoint supporting:
    - Debounced full-text keyword search across title, description, domain, and tech stack.
    - Multi-faceted filtering for Domain, Difficulty, Duration, and Technologies.
    - Sorting by `newest`, `popular` (views), `stars`, `bookmarks`, and `title`.
    - Pagination (`page`, `limit`, `total`, `total_pages`).
    - Facet calculation returning live counts for domains and difficulties, plus distinct technology tags.
    - Dynamic bookmark resolution (`is_bookmarked`) when requested by authenticated users.
  - `GET /api/projects/facets`: Explicit metadata endpoint returning domains, difficulties, and technology lists.
  - `GET /api/projects/{slug}`: Project detail endpoint with automatic view counter increment.
  - `POST /api/projects/{identifier}/bookmark`: Authenticated endpoint toggling project bookmark status and updating aggregate `bookmarks_count`.
  - `GET /api/projects/bookmarks/my`: Authenticated endpoint returning all projects saved by the logged-in student.
- **Seeded Project Catalog:**
  - Lifespan initialization in `backend/app/main.py` seeding 9 production-grade real-world projects across Web Development, AI / Machine Learning, Mobile Development, Cloud & DevOps, Data Engineering, and Cyber Security.
- **Project Filter Sidebar (`frontend/src/components/discovery/ProjectFilterSidebar.jsx`):**
  - Domain selector with count badges.
  - Skill difficulty selector with color-coded dot badges (Beginner, Intermediate, Advanced).
  - Duration selector (1-2 weeks, 2-3 weeks, 3-4 weeks, 4+ weeks).
  - Searchable multi-select technology tags with chip toggling.
  - Reset filters action and mobile slide-over drawer mode.
- **Project Card Enhancement (`frontend/src/components/cards/ProjectCard.jsx`):**
  - Flexible prop aliasing for camelCase and snake_case schema properties.
  - Reactive bookmark toggle connected to backend API with guest localStorage fallback.
  - Metric badges (difficulty, duration chip, stars, author avatar).
- **Project Discovery Page (`frontend/src/pages/public/ProjectsPage.jsx`):**
  - Hero banner with headline, search bar with clear button, and quick-access domain chips.
  - Responsive layout (sticky desktop sidebar + slide-over mobile drawer).
  - Dynamic results bar with sort selector, active filter chips with 1-click removal, and clear all action.
  - Skeleton loading states and empty state with reset suggestions.
  - Full pagination controls with page numbers, prev/next buttons, and smooth scroll.
  - Toast feedback for bookmarking operations.

---

## 3. Work Breakdown

### Frontend Scope
- `frontend/src/services/projectService.js`: Created API client methods (`getProjects`, `getFacets`, `getProjectBySlug`, `toggleBookmark`, `getMyBookmarks`).
- `frontend/src/components/cards/ProjectCard.jsx`: Enhanced with prop fallbacks, reactive bookmarking, and metrics.
- `frontend/src/components/discovery/ProjectFilterSidebar.jsx`: Created reusable multi-faceted filter sidebar and mobile drawer.
- `frontend/src/pages/public/ProjectsPage.jsx`: Production project discovery catalog with search, facets, and pagination.

### Backend Scope
- `backend/app/models/project_bookmark.py`: Created `ProjectBookmark` SQLAlchemy entity.
- `backend/app/models/__init__.py`: Registered `ProjectBookmark`.
- `backend/app/schemas/project.py`: Updated `ProjectRead` with `is_bookmarked` and added `BookmarkToggleResponse`.
- `backend/app/schemas/__init__.py`: Exported project schemas.
- `backend/app/api/dependencies/auth.py`: Added `get_optional_current_user` dependency.
- `backend/app/api/dependencies/__init__.py`: Exported `get_optional_current_user`.
- `backend/app/api/routes/projects.py`: Created comprehensive projects discovery router.
- `backend/app/api/routes/__init__.py`: Registered `projects_router` in `api_router`.
- `backend/app/main.py`: Seeded 9 production projects during startup lifespan.

### Testing & Verification
- `backend/tests/unit/test_projects.py`: 7 unit tests covering empty catalog handling, multi-filter combinations, facets endpoint, slug retrieval with view counter increment, 404/draft handling, bookmark authentication guards, and full bookmark lifecycle.
- Full test suite: **53 passed** (`pytest`).
- Production build: `vite build` completed with 0 errors.

---

## 4. Acceptance Criteria Status
- [x] Fast, responsive project browsing with accurate filter and pagination results.
- [x] Code passes all linting and type checks (`vite build` succeeded).
- [x] No regression in existing functionality (all 53 backend unit tests passing).

---

## 5. Daily Progress Notes
- **Work Started:** Day 12 execution completed.
- **Files Changed:**
  - `backend/app/models/project_bookmark.py` (created)
  - `backend/app/models/__init__.py` (updated)
  - `backend/app/schemas/project.py` (updated)
  - `backend/app/schemas/__init__.py` (updated)
  - `backend/app/api/dependencies/auth.py` (updated)
  - `backend/app/api/dependencies/__init__.py` (updated)
  - `backend/app/api/routes/projects.py` (created)
  - `backend/app/api/routes/__init__.py` (updated)
  - `backend/app/main.py` (updated)
  - `backend/tests/unit/test_projects.py` (created)
  - `frontend/src/services/projectService.js` (created)
  - `frontend/src/components/cards/ProjectCard.jsx` (updated)
  - `frontend/src/components/discovery/ProjectFilterSidebar.jsx` (created)
  - `frontend/src/pages/public/ProjectsPage.jsx` (updated)
  - `progress/day-12.md` (updated)
  - `progress/development-roadmap.md` (updated)
- **Issues Encountered:** None. All tests and production builds passed cleanly.
