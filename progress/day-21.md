# Day 21 — Saved Workspace + Notifications

**Phase:** Saved Workspace + Notifications  
**Status:** [x] Completed  
**Target Completion:** Day 21 of 30 (Accelerated Roadmap)  

---

## 1. Objective
Build a student saved workspace (`/saved`) consolidating bookmarked projects and saved career opportunities, along with an in-app notification center in the student navbar for real-time moderation outcomes, application status shifts, and platform reminders.

---

## 2. Key Features Implemented

### Saved Workspace ([SavedWorkspacePage.jsx](file:///c:/Users/PRANAY/Desktop/HIRING/frontend/src/pages/student/SavedWorkspacePage.jsx))
- **Unified Dual-Collection Tabs:**
  - **Saved Projects Tab:** Displays saved project blueprints with tags, domains, difficulty, view/star counts, direct links to `/projects/:slug`, and quick remove bookmark actions.
  - **Saved Jobs & Internships Tab:** Displays saved job opportunities with company logo, verification status, work mode, location, compensation, deadline, direct apply buttons, and link to `/jobs/:id`.
  - Live item count badges on each tab.
- **Search & Filtering:**
  - Real-time search filter within saved items across titles, companies, domains, and technologies.
- **Empty States & CTAs:**
  - Informative placeholders guiding students back to `/projects` and `/jobs` discovery catalogs when collections are empty.

### In-App Notification Center ([NotificationDropdown.jsx](file:///c:/Users/PRANAY/Desktop/HIRING/frontend/src/components/navbar/NotificationDropdown.jsx))
- **Dynamic Navbar Bell Trigger:**
  - Integrated into [StudentNavbar.jsx](file:///c:/Users/PRANAY/Desktop/HIRING/frontend/src/components/navbar/StudentNavbar.jsx) with live unread badge counter and pulse animation for unread notifications.
- **Interactive Flyout Popover:**
  - Filter tabs: `All` and `Unread only`.
  - "Mark all read" quick action button.
  - Status type icons (Success, Moderation, Application, Warning, Info).
  - Unread indicator dots and relative timestamps.
  - Click notification to mark as read and deep-link to target page (e.g. `/projects/:slug`, `/applications`).
  - Dismiss / delete action on hover.

### Backend Saved Items & Notifications Architecture
- **Job Bookmark Entity ([job_bookmark.py](file:///c:/Users/PRANAY/Desktop/HIRING/backend/app/models/job_bookmark.py)):**
  - Relational mapping between `User` and `Job` with unique constraint `uq_user_job_bookmark`.
  - API Endpoints in [jobs.py](file:///c:/Users/PRANAY/Desktop/HIRING/backend/app/api/routes/jobs.py):
    - `POST /api/jobs/{id}/bookmark`: Toggle save/unsave for authenticated student.
    - `GET /api/jobs/bookmarks/my`: Retrieve all saved job postings for current student.
    - Public jobs catalog (`GET /api/jobs`) automatically checks bookmark state and populates `is_bookmarked`.
- **Notification Entity ([notification.py](file:///c:/Users/PRANAY/backend/app/models/notification.py)):**
  - Fields: `user_id` (FK User, cascade), `title`, `message`, `type` (INFO, SUCCESS, WARNING, MODERATION, APPLICATION), `link_url`, `is_read`.
  - API Endpoints in [notifications.py](file:///c:/Users/PRANAY/Desktop/HIRING/backend/app/api/routes/notifications.py):
    - `GET /api/notifications`: List notifications for current student with `unread_only` filter.
    - `GET /api/notifications/unread-count`: Get unread count for navbar badge.
    - `PUT /api/notifications/{id}/read`: Mark single notification as read.
    - `PUT /api/notifications/read-all`: Mark all unread notifications as read.
    - `DELETE /api/notifications/{id}`: Delete notification.
- **Automated Moderation Alert Dispatch:**
  - Integrated into [admin.py](file:///c:/Users/PRANAY/Desktop/HIRING/backend/app/api/routes/admin.py):
    - When an administrator approves a project, dispatches a `SUCCESS` notification to the student author.
    - When revisions are requested, dispatches a `MODERATION` notification with reviewer feedback notes.
    - When rejected, dispatches a `WARNING` notification with reason notes.

---

## 3. Verification & Testing

### Automated Unit Test Suite
- **Notifications Tests ([test_notifications.py](file:///c:/Users/PRANAY/Desktop/HIRING/backend/tests/unit/test_notifications.py)):**
  - `test_unauthenticated_notifications_rejected`: Verified HTTP 401 Unauthorized.
  - `test_notifications_crud_and_counts`: Verified listing, unread count badge, mark single as read, mark all read, and delete.
  - `test_notification_cross_user_isolation`: Verified strict HTTP 403 Forbidden preventing access to other students' notifications.
  - `test_moderation_triggers_notification`: Verified project moderation automatically generates notifications for project owner.
- **Saved Items Tests ([test_saved_items.py](file:///c:/Users/PRANAY/Desktop/HIRING/backend/tests/unit/test_saved_items.py)):**
  - `test_job_bookmark_toggle_and_listing`: Verified job bookmark toggling, retrieval in `/api/jobs/bookmarks/my`, and untoggling.
  - `test_project_and_job_saved_workspace`: Verified dual bookmarking of projects and jobs and simultaneous retrieval.

### Frontend Production Build
- Executed `npm run build` in `frontend/`.
- 1,710 modules transformed, production assets compiled cleanly in 7.67s with **0 errors**.
