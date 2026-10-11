# Security Architecture & Policies — Student Career Platform

**Document Version:** 1.0.0  
**Compliance Target:** OWASP Top 10 / Production Security  

---

## 1. Threat Model Overview

The Student Career Platform processes user accounts, student resumes, portfolio codebases, and external job data. Key attack surfaces include:
1. **Malicious File Uploads:** Upload of executable malware, web shells, or zip bombs in project ZIPs.
2. **Authentication Attacks:** Credential stuffing, brute-forcing 6-digit OTP codes, session hijacking.
3. **Data Exfiltration & Exposure:** Leaking third-party AI keys (Gemini) or student contact details.
4. **Client-Side Attacks:** XSS through unescaped project markdown or user bios.

---

## 2. Authentication & Credential Security

### 2.1. Password Security
- Passwords must be a minimum of 8 characters, containing uppercase, lowercase, numbers, and symbols.
- Hashing is performed using **Argon2id** (or Bcrypt with cost factor 12).
- Plaintext passwords are never logged, stored in cache, or returned in any API response.

### 2.2. Email OTP Protocol
- **Entropy:** Generated using cryptographically secure random sources (`secrets.randbelow(10)` per digit).
- **Format:** Exactly 6 numerical digits (`[0-9]{6}`).
- **Lifetime:** Strictly 5 minutes from generation.
- **Storage:** OTP codes are hashed (e.g. SHA-256 with salt) in the `otp_verifications` table.
- **Single-Use:** Once verified or invalidated, the record is immediately marked as spent (`verified_at = NOW()`).
- **Attempt Capping:** Maximum of 5 incorrect guesses. On the 5th failed attempt, the OTP is invalidated immediately.
- **Cooldown & Rate Limiting:** A mandatory 60-second cooldown is enforced between resend requests. IPs and email addresses are rate-limited to 5 requests per hour.
- **Zero Exposure Guarantee:** Under no circumstances is the OTP code logged in application logs, returned in JSON API responses, or exposed to frontend client code.

### 2.3. Session & Token Management
- JSON Web Tokens (JWT) use `RS256` or `HS256` with high-entropy 256-bit secret keys.
- Access tokens expire after 15 minutes.
- Refresh tokens expire after 7 days and are rotated on every use.
- Cookies are configured with:
  `SameSite=Lax`, `Secure=True` (in production), and `HttpOnly=True`.

---

## 3. Untrusted ZIP Upload & Code Isolation Security

Students upload ZIP archives representing completed software projects. **Uploaded student archives must be treated as hostile and untrusted by default.**

### 3.1. File Validation Rules
1. **Magic Number Inspection:** Validate binary header `PK\x03\x04` before processing; do not rely solely on the `.zip` file extension.
2. **Size Limits:** Hard limit of 50 MB per ZIP archive.
3. **Zip Bomb Defense:** Verify uncompressed size does not exceed 250 MB and compression ratio does not exceed 10:1. Limit total files inside the archive to 2,000 files.
4. **Path Traversal Defense:** Reject or sanitize archives containing directory traversal sequences (`../`, absolute paths `/etc/`, Windows drive letters `C:\`).
5. **Forbidden File Patterns:** Scan file list inside the ZIP for forbidden extensions and filenames:
   - Executables: `.exe`, `.dll`, `.so`, `.sh`, `.bat`, `.cmd`, `.vbs`, `.msi`
   - Secrets & Environment: `.env`, `.env.*`, `*.pem`, `*.key`, `id_rsa`, `credentials.json`
   - If prohibited files are detected, reject the upload and prompt the student to remove them.

### 3.2. Server Execution Policy
> **ABSOLUTE RULE:** Never execute, run, interpret, or evaluate uploaded student projects on the application servers or backend worker hosts.
- Uploaded files are streamed directly to isolated object storage buckets.
- The backend treats ZIP files strictly as passive binary blobs.

---

## 4. Artificial Intelligence (Gemini) Security

1. **Backend-Only Integration:** The Google Gemini API key is accessible only via backend environment variables (`GEMINI_API_KEY`). It is never referenced or bundled into frontend assets.
2. **Prompt Injection Mitigation:** User input (resume text, job description) is sanitized, length-capped (max 15,000 characters), and wrapped in strict system instructions directing the model to output valid JSON only.
3. **Rate Limiting:** AI analysis is rate-limited per student account (e.g. max 10 analyses per day) to avoid resource exhaustion and quota depletion.

---

## 5. Web Application Protections

### 5.1. SQL Injection Protection
- All database queries are executed through SQLAlchemy ORM or parameterized prepared statements. Raw unparameterized SQL string concatenation is strictly prohibited.

### 5.2. Cross-Site Scripting (XSS)
- React automatically escapes text nodes rendered in JSX.
- Markdown rendering for project descriptions uses a strict sanitizer (e.g. `DOMPurify` / sanitize-html) forbidding inline script tags, dangerous URI schemes (`javascript:`), and iframe injections.

### 5.3. Cross-Origin Resource Sharing (CORS)
- CORS middleware explicitly whitelists only trusted frontend origins:
  `http://localhost:5173` (dev) and `https://app.careerplatform.com` (prod).
- Wildcard `*` origins with credentials enabled are prohibited.

### 5.4. Content Security & Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Referrer-Policy: strict-origin-when-cross-origin`
