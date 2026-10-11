# Product Requirements Document (PRD) — Student Career Platform

**Project:** Student Career Platform  
**Tagline:** *“From your first project to your first job.”*  
**Document Version:** 1.0.0  
**Status:** Approved Foundation  

---

## 1. Product Overview

The Student Career Platform is a unified, production-grade web application engineered to bridge the gap between academic learning and real-world employment. It transforms the unstructured and overwhelming student career preparation experience into a guided, end-to-end pathway:

$$\text{DISCOVER} \longrightarrow \text{BUILD} \longrightarrow \text{SHOWCASE} \longrightarrow \text{PREPARE} \longrightarrow \text{APPLY} \longrightarrow \text{GET HIRED}$$

Rather than treating projects, resumes, and job applications as disconnected activities, the platform integrates them into an intuitive ecosystem where student portfolio projects feed directly into resume creation, ATS matching, and curated job applications.

---

## 2. Mission & Vision

### Mission
> *To help every student discover their potential, build practical skills, showcase their work, and access better career opportunities.*

### Vision
> *To become a trusted career development platform for students worldwide, making career preparation and opportunities accessible to every student regardless of their institutional pedigree or background.*

---

## 3. Target User Personas

| Persona | Role | Primary Needs & Motivations |
| :--- | :--- | :--- |
| **Students** *(Primary)* | College students, fresh graduates, self-taught learners | Needs answers to *"What should I build?"*, *"How can I showcase my work without complex devops?"*, *"Is my resume ATS-ready?"*, and *"Which jobs actually fit my current skills?"* |
| **Administrators** *(Current)* | Platform moderators, platform staff | Needs tooling to curate project submissions, review ZIP uploads for security compliance, verify job listings, inspect reports, and ensure high content quality. |
| **Recruiters** *(Future)* | Talent acquisition leads, tech recruiters | Seeks verified student portfolios, code artifacts, and skill-validated candidates rather than keyword-stuffed resumes. |
| **Companies** *(Future)* | Hiring partners, tech startups, enterprises | Wants to post campus hiring drives, internships, and entry-level positions with targeted student matching. |
| **Mentors** *(Future)* | Industry professionals, alumni | Desires structured channels to review student projects, provide constructive code feedback, and conduct mock interviews. |

---

## 4. Core Product Journey

1. **Discover:** The student explores curated, domain-specific project ideas with defined problem statements, tech stacks, and estimated completion times.
2. **Build:** The student accesses detailed objectives, architecture guides, prerequisites, and resource links to build a functional project.
3. **Showcase:** The student uploads their completed project with screenshots, documentation, and a project ZIP file (without needing mandatory Git/deployment knowledge).
4. **Prepare:** The student uses the integrated Resume Builder with ATS-optimized templates and validates their resume against target Job Descriptions using the AI ATS Analyzer.
5. **Apply:** The student searches verified jobs/internships filtered by experience, tech stack, work mode, and stipend.
6. **Get Hired:** The student tracks their applications through every interview stage in the Application Tracker.

---

## 5. Core Platform Modules

### 5.1. Authentication & Security
- **Email & Password Authentication:** Argon2/Bcrypt hashed password storage.
- **6-Digit Email OTP Verification:** Time-based, 5-minute expiry, single-use, maximum 5 attempts, cooldown rate limiting.
- **Role-Based Access Control (RBAC):** Distinct roles for `STUDENT`, `ADMIN`, `MODERATOR`.
- **Session Management:** Secure HTTP-only cookies / JWT tokens with refresh token rotation.
- **Password Reset:** Cryptographically secure one-time reset tokens delivered via email.

### 5.2. Student Profile & Workspace
- **Personal Information:** Name, headline, bio, university, graduation year, contact information.
- **Skills Matrix:** Categorized technical and soft skills with self-rated proficiency levels.
- **Portfolio Showcase:** Public profile URL (`/u/:username`) displaying approved student projects.
- **Social & Professional Links:** GitHub, LinkedIn, portfolio website, Twitter/X.
- **Profile Completion Metric:** Dynamic progress indicator motivating complete profile creation.

### 5.3. Project Discovery & Showcase Module
- **Public & Authenticated Exploration:** Filterable by Domain (Web, Mobile, AI/ML, Cloud, DevOps, Blockchain, IoT), Technology, Difficulty (Beginner, Intermediate, Advanced), Duration, and Project Type.
- **Project Detail Page:** Problem statement, objectives, feature list, architecture overview, prerequisites, expected outcome, gallery screenshots, and resource links.
- **Student Submission Multi-Step Flow:**
  - *Step 1: Submission Guidelines & Security Warning* (acknowledgement required).
  - *Step 2: Basic Information* (title, domain, short summary, difficulty, estimated hours).
  - *Step 3: Deep Technical Details* (problem statement, key features, prerequisites, learning outcomes).
  - *Step 4: Media & Assets* (cover image, multi-screenshot upload).
  - *Step 5: Code Artifacts & Links* (Project ZIP archive required; GitHub, demo URL, video demo optional).
  - *Step 6: Contributors & Authorship* (co-authors, contributor tags).
  - *Step 7: Final Review & Submission*.
- **Project Status Lifecycle:**
  `Draft` $\rightarrow$ `Submitted` $\rightarrow$ `Under Review` $\rightarrow$ `Approved` / `Changes Requested` $\rightarrow$ `Published` / `Rejected`.
- **ZIP Security Architecture:** Strict validation of ZIP signatures, strict max file size limit (50MB), filename sanitization, zip-bomb protection, path traversal (`../`) mitigation, and strict prohibition of server-side code execution.

### 5.4. Jobs & Internships Module
- **Opportunity Discovery:** Filterable by Opportunity Type (Full-time Job, Internship), Domain, Tech Stack, Work Mode (Remote, Hybrid, On-site), Experience Level, Stipend/Salary range, and Deadline.
- **Job Detail View:** Company profile, role description, key responsibilities, mandatory/preferred qualifications, compensation range, application deadline.
- **Application Linkage:** Transparent redirect to verified employer portal or direct application record creation.
- **Saved Jobs:** Quick bookmarking for future review.

### 5.5. Application Tracker
- **Status Pipeline:** `Saved` $\rightarrow$ `Applied` $\rightarrow$ `Shortlisted` $\rightarrow$ `Interview` $\rightarrow$ `Selected` $\rightarrow$ `Rejected`.
- **Tracking Fields:** Company name, role title, application date, deadline, current status, job posting URL, private student notes, scheduled interview timestamps.

### 5.6. Resume Templates & Builder
- **Template Gallery:** Curated ATS-friendly templates categorized by Freshers, Software Engineers, Data Analysts, Modern, Minimalist, and Creative.
- **Interactive Builder:** Two-pane interface featuring a structured form editor on the left and a pixel-perfect, real-time preview on the right.
- **Structured Sections:** Personal Info, Professional Summary, Education, Technical Skills, Highlighted Projects (importable directly from student showcase), Work Experience / Internships, Certifications, Extracurricular Achievements, Languages.
- **Client/Server Export:** High-fidelity PDF generation maintaining ATS-parsable text layers.

### 5.7. ATS Analyzer
- **Dual-Input Analysis:** Resume text/PDF input combined with target Job Description (JD).
- **Comprehensive Score Engine:**
  - Overall ATS Match Score (0–100%).
  - Technical & Soft Skills Match Breakdown.
  - Keyword Density & Match Percentage.
  - Formatting & Structural Compliance Score.
  - Missing Key Competencies & Actionable Improvement Suggestions.
- **AI Backend Architecture:** Powered by Google Gemini API executed strictly on the backend with sanitized inputs; zero API credentials exposed to client.

### 5.8. Admin & Content Moderation Panel
- **Dashboard Overview:** Key platform statistics (total students, pending reviews, active jobs, flagged items).
- **Project Moderation Console:** Inspect submission details, preview screenshots, audit ZIP metadata, approve, reject, or request changes with detailed reviewer feedback.
- **Job & Template Management:** Create, edit, and deactivate job listings and resume template presets.

### 5.9. Notifications System
- In-app notification center for project moderation updates, application deadline reminders, and critical account security events.

---

## 6. Future Scope (Roadmap Phase 2+)

*These modules are out of scope for the initial foundation and 40-day MVP, but system architecture is designed to accommodate them seamlessly:*
- Verified Mentorship Booking & Code Reviews.
- Live Webinars & Interactive Skill Workshops.
- Virtual Campus Hackathons & Team Formation.
- Company & Recruiter Self-Serve Dashboards.
- Automated Skill Gap Analysis & Personalized Career Roadmaps.
- Interactive AI Technical Mock Interviews.

---

## 7. Success Metrics & Key Performance Indicators (KPIs)

1. **Activation Rate:** Percentage of registered students who submit at least 1 project or build 1 resume within 7 days.
2. **Project Quality Ratio:** Percentage of submitted projects approved upon initial or second review.
3. **ATS Improvement Rate:** Average increase in ATS score after applying analyzer recommendations.
4. **Platform Security & Reliability:** Zero unauthorized access incidents, zero unhandled server exceptions on file uploads, 99.9% uptime.
