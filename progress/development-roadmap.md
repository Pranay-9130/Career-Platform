# 30-Day Accelerated Master Development Roadmap — Student Career Platform

**Project:** Student Career Platform  
**Tagline:** *“From your first project to your first job.”*  
**Status Legend:**
- `[ ]` Not Started
- `[~]` In Progress
- `[x]` Completed

---

## Roadmap Overview (Accelerated 30-Day Plan)

| Day | Module / Phase | Status | Summary |
| :---: | :--- | :---: | :--- |
| **01** | Project Audit + Architecture | `[x]` | Inspect repo, establish conventions, verify dev environment, baseline docs |
| **02** | Design System + Theme | `[x]` | Light-blue design tokens, Tailwind theme, atomic UI component library |
| **03** | Navbar + Footer | `[x]` | Responsive PublicNavbar, StudentNavbar, AdminNavbar, Footer |
| **04** | Homepage | `[x]` | High-converting hero, benefits, project/resume/ATS preview, CTAs |
| **05** | About + Contact | `[x]` | Mission, story, team, accessible contact form with backend submission |
| **06** | Authentication Architecture | `[x]` | JWT/Cookie handling, route guards, RBAC dependencies, auth store |
| **07** | Registration + Login | `[x]` | Validated credentials forms, error handling, auth state wiring |
| **08** | Email OTP | `[x]` | 6-digit OTP generation, hashing, 5m expiry, cooldown, verification UI |
| **09** | Password Reset | `[x]` | Secure token generation, reset email flow, expiration, new password form |
| **10** | Student Dashboard | `[x]` | Dashboard layout, stats cards, recent activity, recommendations, sidebar |
| **11** | Student Profile | `[x]` | Editable profile, education, skills matrix, links, completion meter |
| **12** | Project Discovery | `[x]` | Multi-filter project catalog, search bar, difficulty tags, bookmarking |
| **13** | Project Details | `[x]` | Problem statement, tech stack, screenshots gallery, author info, CTA |
| **14** | Submission Guidelines | `[x]` | Guidelines page, ZIP rules, security warnings, prerequisite checklist |
| **15** | Project Submission | `[x]` | Multi-step form, details, media, ZIP upload, links, contributors |
| **16** | Project Preview + Drafts | `[x]` | Live submission preview, draft persistence, draft editing, submission |
| **17** | Project Resources + ZIP Handling | `[x]` | Binary validation (`PK\x03\x04`), 50MB limit, safe storage, download presigning |
| **18** | Authors + Contributors | `[x]` | Project owner display, co-authors, contributor attribution, public profile link |
| **19** | Admin Moderation + Jobs Discovery | `[x]` | Review queue (approve/reject/request changes) + curated job/internship search & filters |
| **20** | Job Details + Application Tracker | `[x]` | Role requirements, company bio, external apply + student application pipeline |
| **21** | Saved Workspace + Notifications | `[x]` | Dedicated workspace for saved projects/jobs + in-app notification center |
| **22** | ATS Resume Templates + Builder | `[x]` | ATS-compliant templates gallery + interactive split-pane live resume editor |
| **23** | PDF Resume Generation & Export | `[x]` | High-fidelity ATS-parsable PDF rendering engine and export download |
| **24** | ATS Analyzer + Gemini AI | `[x]` | Dual-input score analyzer (Resume + JD) + backend Google Gemini AI feedback |
| **25** | Backend Review & Security Hardening | `[x]` | Deep role validation, constraints, indexes audit, rate limiting, security headers |
| **26** | SEO, Sitemap & Structured Data | `[x]` | Open Graph tags, dynamic sitemap.xml, robots.txt, canonical links, schema markup |
| **27** | Performance & Accessibility | `[x]` | Code splitting, image optimization, WCAG 2.1 AA audit, ARIA and keyboard focus |
| **28** | Full-Platform QA & Bug Fixing | `[x]` | End-to-end user journeys testing (Discovery -> Build -> Showcase -> Apply), bug remediation |
| **29** | Production Staging & Deployment | `[ ]` | Production frontend (Vercel) & backend (Render) build, containerization & PostgreSQL SSL |
| **30** | Custom Domain, Google & Launch | `[ ]` | Custom domain DNS, SSL, Search Console setup, final smoke tests, official launch |

---

## Production Readiness Checklist

### Frontend
- [x] Responsive UI across mobile, tablet, desktop
- [x] Accessible components (WCAG 2.1 AA)
- [x] Consistent Light-Blue design system implementation
- [x] Graceful error handling and network fallback UI
- [x] Intuitive loading states and skeleton screens

### Backend
- [x] Strict API request validation (Pydantic v2)
- [x] Role-based authorization on all sensitive routes
- [x] Centralized error handling and standard error payloads
- [x] Structured request logging (no sensitive credentials logged)
- [x] Endpoint rate limiting (especially auth, OTP, contact & AI routes)

### Database
- [ ] Managed PostgreSQL configuration
- [x] Explicit foreign key relationships and cascade rules
- [x] Database constraints (uniqueness, not-null, checks)
- [x] Indexes on foreign keys, lookup slugs, and filter columns
- [ ] Version-controlled Alembic migrations
- [ ] Automated backup strategy

### Authentication
- [x] Secure registration flow
- [x] Secure login with password verification
- [ ] 6-digit Email OTP with 5-min expiry and cooldown
- [ ] Secure password reset token flow
- [ ] Session / JWT security (short-lived access tokens, rotated refresh tokens)
- [ ] Role authorization checks (`STUDENT`, `ADMIN`)

### Projects
- [x] Public project discovery and filtering
- [x] Student multi-step project submission
- [x] Draft saving and editing
- [x] Screenshot upload and optimization
- [x] Untrusted ZIP validation and safe storage
- [x] Author and contributor attribution
- [x] Administrative moderation workflow
- [x] Secure presigned ZIP download links

### Jobs
- [x] Curated job and internship discovery
- [x] Granular filters (domain, type, work mode, stipend)
- [x] Detailed job descriptions
- [x] Integrated student application tracker

### Resume & ATS
- [x] ATS-friendly resume templates
- [x] Interactive two-pane resume builder
- [x] Server/client PDF export
- [x] ATS score analyzer with skill matching
- [x] Secure backend Google Gemini AI feedback

### Security
- [x] Zero exposed credentials or API keys in frontend bundles
- [ ] HTTPS enforced everywhere
- [x] Secure password hashing (Argon2 / Bcrypt)
- [x] Input validation and output sanitization
- [x] Strict file validation (magic numbers, zip bomb protection)
- [x] Zero server-side code execution of uploaded projects
- [x] Authorization guards preventing IDOR attacks
- [x] Rate limiting on sensitive endpoints

### SEO
- [x] Dynamic metadata and Open Graph tags
- [x] Automated sitemap.xml generation
- [x] Production robots.txt disallowing private workspaces
- [x] Canonical URL links
- [x] Structured schema.org data markup
- [x] Google Search Console verification readiness

### Deployment
- [ ] Production frontend build on Vercel or equivalent
- [ ] Production backend container on Render or equivalent
- [ ] Managed PostgreSQL database with SSL
- [ ] Environment variables configured across staging & production
- [ ] Custom domain DNS with SSL
- [ ] Health check monitoring (`/api/health`)
