# Day 18 — Authors + Contributors

**Phase:** Authors + Contributors  
**Status:** [x] Completed  
**Target Completion:** Day 18 of 40  

---

## 1. Objective
Implement verified author attribution, co-authorship recognition, contributor profile enrichment, and student portfolio integration across project blueprints, public detail views, and dedicated student portfolio pages (`/u/:username`).

---

## 2. Key Features Implemented

### Public Portfolio System (`GET /api/users/{username}` & `/u/:username`)
- **Real Database Aggregation:**
  - Replaced legacy static mocks in `get_public_profile` with real relational queries over SQLite/PostgreSQL.
  - Queries all published projects authored directly by the student (`Project.owner_id == profile.user_id`).
  - Queries all published collaborative projects where the student is attributed in `Project.contributors` (matching by profile username, GitHub handle, or full name).
  - Dynamically computes platform engagement metrics: `total_stars_count`, `total_views_count`, and `projects_count`.
- **Public Profile View ([PublicProfilePage.jsx](file:///c:/Users/PRANAY/Desktop/HIRING/frontend/src/pages/public/PublicProfilePage.jsx)):**
  - **Portfolio Stats Bar:** Published Projects, Community Stars, Total Views, and Skills Mastered.
  - **Clickable Showcase Cards:** Projects link directly to `/projects/:slug` with role badges (`Lead Author`, `Co-Author`), domain category chips, and live star/view counters.
  - **Empty State UX:** Informative and clean placeholder when a student has not yet published projects.

---

### Project Detail Co-Authors & Contributors ([ProjectDetailPage.jsx](file:///c:/Users/PRANAY/Desktop/HIRING/frontend/src/pages/public/ProjectDetailPage.jsx))
- **Dedicated Co-Authors & Contributors Section:**
  - Rendered dynamically in the main blueprint specification column whenever contributors exist on a project.
  - Individual contributor cards displaying:
    - Contributor avatar image or gradient initials pill.
    - Full name and assigned architectural role (e.g. `Computer Vision Lead`, `Backend Architect`, `Contributor`).
    - Clickable `@profile_username` link pointing to their verified public student portfolio (`/u/:username`).
    - External GitHub icon link (`https://github.com/:github_username`).
- **Enhanced Author Sidebar Card:**
  - Displays author avatar, full name, headline, university affiliation, and bio.
  - Includes author social icons: GitHub, LinkedIn, and Personal Portfolio website.
  - Direct CTA button: **"View Full Student Portfolio"** leading to `/u/:author_username`.

---

### Project Submission Contributor Tooling ([ProjectSubmissionPage.jsx](file:///c:/Users/PRANAY/Desktop/HIRING/frontend/src/pages/student/ProjectSubmissionPage.jsx))
- **Enhanced Step 6 Contributor Input Grid:**
  - Added dedicated input field for Platform `@username` alongside Full Name, Role, and GitHub username.
  - Contributor chips in Step 6 display `@username` tags and GitHub references.
  - Preserves contributor attribution across draft saves and submissions.

---

### Backend Schema & Route Enhancements
- **[profile.py (Schemas)](file:///c:/Users/PRANAY/Desktop/HIRING/backend/app/schemas/profile.py):**
  - `PublicProjectPreview`: Added `id`, `slug`, `domain`, `difficulty`, `role`, `stars_count`, `views_count`.
  - `PublicProfileRead`: Added `total_stars_count`, `total_views_count`.
- **[project.py (Schemas)](file:///c:/Users/PRANAY/Desktop/HIRING/backend/app/schemas/project.py):**
  - `ContributorItem`: Added `profile_username`, `avatar_url`.
- **[projects.py (Routes)](file:///c:/Users/PRANAY/Desktop/HIRING/backend/app/api/routes/projects.py):**
  - Updated `_map_project_to_detail_read` and `get_project_by_slug` to resolve author profile details and contributor avatars/usernames.

---

## 3. Verification & Testing

### Automated Backend Tests
- **Created [test_authors_contributors.py](file:///c:/Users/PRANAY/Desktop/HIRING/backend/tests/unit/test_authors_contributors.py)** with 6 test cases:
  1. `test_public_profile_returns_authored_projects`: Confirms authored projects, roles, and aggregate stars/views.
  2. `test_public_profile_returns_coauthored_projects`: Confirms co-author attribution on collaborative projects.
  3. `test_public_profile_excludes_draft_projects`: Confirms unpublished drafts are strictly omitted from public portfolios.
  4. `test_public_profile_not_found`: Confirms HTTP 404 response for unknown student usernames.
  5. `test_project_detail_enriches_contributors`: Confirms contributor avatar and profile username enrichment.
  6. `test_project_detail_includes_author_social_links`: Confirms author GitHub, LinkedIn, and portfolio propagation.
- **Full Pytest Suite:** All 73 tests passing (`73 passed in 53.64s`).

### Frontend Production Build
- `npm run build` executed and passed cleanly (`✓ built in 10.51s`).

---

## 4. Next Step
Proceed to **Day 19 — Admin Project Moderation** (Review queue, approve/reject/request changes, moderation status transitions, reviewer notes).
