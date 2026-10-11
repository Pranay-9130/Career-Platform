# Day 31 — API Validation + Authorization

**Phase:** API Validation + Authorization  
**Status:** [ ] Not Started  
**Target Completion:** Day 31 of 40  

---

## 1. Objective
Audit and strengthen API request validation, response schemas, and role authorization across all endpoints.

---

## 2. Key Features to Implement
- Verify all Pydantic v2 schemas, ensure proper HTTP status codes (400, 401, 403, 404, 422), enforce resource ownership checks (prevent IDOR).

---

## 3. Work Breakdown

### Frontend Scope
- Standardize client-side API error handling and toast alerts.

### Backend Scope
- Audit all router dependencies, verify user ownership on project, resume, and application mutations.

### Database & Persistence
- N/A

---

## 4. Testing & Verification Plan
- Security unit tests attempting cross-user data access (IDOR) and role escalation.

---

## 5. Acceptance Criteria
- [ ] All endpoints strictly enforce validation and access control; zero IDOR vulnerabilities.
- [ ] Code passes all linting and type checks.
- [ ] No regression in existing functionality.

---

## 6. Daily Progress Notes
*This section will be updated during the execution of Day 31.*
- Work Started: N/A
- Files Changed: None
- Issues Encountered: None
