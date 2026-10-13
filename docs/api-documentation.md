# REST API Specification — Student Career Platform

**Base URL:** `/api`  
**Protocol:** HTTPS / JSON REST  
**Authentication:** Bearer JWT Header (`Authorization: Bearer <token>`) or Secure HTTP-only Cookie  
**Document Version:** 1.0.0  

---

## 1. Global Standards & Error Format

### 1.1. Standard Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### 1.2. Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": [
      { "field": "email", "issue": "value is not a valid email address" }
    ]
  }
}
```

### 1.3. Standard HTTP Status Codes
- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Validation failure or business logic error.
- `401 Unauthorized`: Missing, expired, or invalid authentication credentials.
- `403 Forbidden`: Authenticated user lacks required permissions/roles.
- `404 Not Found`: Target resource does not exist.
- `422 Unprocessable Entity`: Request body failed schema validation.
- `429 Too Many Requests`: Rate limit exceeded (e.g. OTP requests).
- `500 Internal Server Error`: Unhandled server exception.

---

## 2. API Endpoints Catalog

### 2.1. Authentication (`/api/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new student account and trigger email OTP |
| `POST` | `/api/auth/login` | Public | Verify credentials and issue an access token plus HttpOnly refresh cookie |
| `POST` | `/api/auth/verify-otp` | Public | Validate the registration OTP and mark the account verified |
| `POST` | `/api/auth/resend-otp` | Public | Re-dispatch 6-digit OTP (subject to 60s cooldown) |
| `POST` | `/api/auth/forgot-password` | Public | Send password reset token to user email |
| `POST` | `/api/auth/reset-password` | Public | Reset account password with verified reset token |
| `POST` | `/api/auth/refresh` | Refresh cookie | Rotate the HttpOnly refresh cookie and issue a new access token |
| `POST` | `/api/auth/logout` | Browser session | Clear the HttpOnly refresh cookie |

---

### 2.2. Users & Profiles (`/api/users`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users/me` | Auth (Self) | Retrieve current authenticated user profile |
| `PUT` | `/api/users/me` | Auth (Self) | Update student profile information, bio, skills |
| `POST` | `/api/users/me/avatar` | Auth (Self) | Upload avatar photo (multipart/form-data) |
| `GET` | `/api/users/:username` | Public | Get public student portfolio and approved projects |

---

### 2.3. Projects (`/api/projects`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/projects` | Public | Search & list published projects with filters & pagination |
| `GET` | `/api/projects/:slug` | Public | Retrieve full project details, screenshots, and metadata |
| `POST` | `/api/projects` | Auth | Create new project submission or save draft |
| `PUT` | `/api/projects/:id` | Auth (Owner) | Update an existing draft or modify requested changes |
| `POST` | `/api/projects/:id/submit`| Auth (Owner) | Submit draft project for admin review |
| `POST` | `/api/projects/:id/upload-zip`| Auth (Owner)| Securely upload project ZIP archive (max 50MB) |
| `POST` | `/api/projects/:id/screenshots`| Auth (Owner)| Upload screenshots gallery |
| `GET` | `/api/projects/:id/download`| Auth | Get time-limited presigned URL to download project ZIP |
| `POST` | `/api/projects/:id/save` | Auth | Bookmark or unbookmark project |
| `GET` | `/api/projects/my-projects`| Auth (Owner)| List all projects authored by current student |

---

### 2.4. Jobs & Internships (`/api/jobs`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/jobs` | Public | Discover jobs and internships with query filters |
| `GET` | `/api/jobs/:slug` | Public | Get comprehensive job description and apply metadata |
| `POST` | `/api/jobs/:id/save` | Auth | Bookmark or unbookmark job |
| `GET` | `/api/jobs/saved` | Auth | Retrieve all saved jobs for current student |

---

### 2.5. Applications Tracker (`/api/applications`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/applications` | Auth | List all tracked student job applications |
| `POST` | `/api/applications` | Auth | Create a new tracked application record |
| `PUT` | `/api/applications/:id` | Auth (Owner) | Update status (`Applied`, `Interview`, etc.) and notes |
| `DELETE`| `/api/applications/:id` | Auth (Owner) | Remove an application from tracker |

---

### 2.6. Resumes & Templates (`/api/resumes` & `/api/templates`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/templates` | Public | List ATS-friendly resume templates with preview images |
| `GET` | `/api/templates/:id` | Public | Get specific template styling configuration |
| `GET` | `/api/resumes` | Auth | List resumes created by the authenticated student |
| `POST` | `/api/resumes` | Auth | Create new resume from selected template |
| `GET` | `/api/resumes/:id` | Auth (Owner) | Get structured resume data |
| `PUT` | `/api/resumes/:id` | Auth (Owner) | Save updated resume content sections |
| `POST` | `/api/resumes/:id/export-pdf`| Auth (Owner)| Trigger server-side PDF generation & return download link |

---

### 2.7. ATS Analyzer (`/api/ats`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/ats/analyze` | Auth | Send resume content + job description for Gemini AI scoring |
| `GET` | `/api/ats/history` | Auth | Retrieve historical ATS analysis reports for current user |
| `GET` | `/api/ats/:id` | Auth (Owner) | Retrieve specific ATS score report details |

---

### 2.8. Notifications (`/api/notifications`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Auth | Get student notifications list |
| `PATCH` | `/api/notifications/:id/read`| Auth | Mark single notification as read |
| `POST` | `/api/notifications/read-all`| Auth | Mark all unread notifications as read |

---

### 2.9. Administration Console (`/api/admin`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/metrics` | Admin | High-level platform statistics and KPIs |
| `GET` | `/api/admin/projects/pending`| Admin | List all projects currently awaiting moderation |
| `POST` | `/api/admin/projects/:id/review`| Admin | Submit review decision (`Approved`, `Changes Requested`, `Rejected`) |
| `POST` | `/api/admin/jobs` | Admin | Create official verified job or internship listing |
| `PUT` | `/api/admin/jobs/:id` | Admin | Edit or deactivate job listing |
| `GET` | `/api/admin/students` | Admin | Query student list, inspect activity, or moderate accounts |
