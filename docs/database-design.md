# Database Schema Design — Student Career Platform

**Target Database:** PostgreSQL 15+  
**ORM:** SQLAlchemy 2.0 (Python)  
**Migration Tool:** Alembic  
**Document Version:** 1.0.0  

---

## 1. Design Principles & Conventions

1. **Identifiers:** All tables use UUIDv4 (`UUID(as_uuid=True)`) or autoincrementing BigInt for primary keys. UUIDs prevent ID enumeration in public APIs.
2. **Timestamps:** Every table contains `created_at` and `updated_at` timestamps stored in UTC (`TIMESTAMP WITH TIME ZONE`).
3. **Soft Deletion:** Core entities (projects, applications, users) support `is_deleted` or state-driven lifecycle flags to prevent unintended cascading data loss.
4. **Data Integrity:** Foreign keys are explicitly defined with strict `ON DELETE` rules (`CASCADE` or `RESTRICT`/`SET NULL` where appropriate).
5. **Indexing:** B-Tree indexes are applied on foreign keys, lookup slugs, status flags, and search fields.

---

## 2. Entity-Relationship Diagram (ERD Overview)

```
       ┌───────────────┐
       │     roles     │
       └───────┬───────┘
               │ 1:N
               ▼
       ┌───────────────┐        1:1       ┌──────────────────┐
       │     users     ├─────────────────►│     profiles     │
       └───┬───────────┘                  └──────────────────┘
           │
           ├──────► otp_verifications (1:N)
           ├──────► projects (1:N - owner)
           │           ├──► project_screenshots (1:N)
           │           ├──► project_resources (1:N)
           │           ├──► project_contributors (1:N)
           │           └──► project_reviews (1:N)
           ├──────► saved_projects (1:N)
           ├──────► saved_jobs (1:N)
           ├──────► applications (1:N) ◄────── jobs ◄── companies
           ├──────► resumes (1:N) ◄────────── resume_templates
           │           └──► resume_sections (1:N)
           ├──────► ats_analyses (1:N)
           └──────► notifications (1:N)
```

---

## 3. Detailed Entity Schemas

### 3.1. Authentication & User Management

#### `roles`
*Purpose:* Defines platform access levels.
```sql
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL, -- 'STUDENT', 'ADMIN', 'MODERATOR'
    description VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `users`
*Purpose:* Primary account credential and identity entity.
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_users_email ON users(email);
```

#### `otp_verifications`
*Purpose:* Manages single-use email/SMS verification tokens, attempt limits, and expiration.
```sql
CREATE TABLE otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    otp_hash VARCHAR(255) NOT NULL,
    delivery_method VARCHAR(20) DEFAULT 'EMAIL' NOT NULL, -- 'EMAIL', 'SMS'
    destination_mask VARCHAR(100) NOT NULL,               -- e.g. 'p*****@gmail.com'
    expires_at TIMESTAMPTZ NOT NULL,
    attempt_count INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    verified_at TIMESTAMPTZ,
    invalidated_at TIMESTAMPTZ
);
CREATE INDEX idx_otp_user_active ON otp_verifications(user_id, expires_at) WHERE verified_at IS NULL AND invalidated_at IS NULL;
```

#### `profiles`
*Purpose:* Extended student profile information, bio, social links, and skills.
```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    username VARCHAR(80) UNIQUE NOT NULL,
    headline VARCHAR(200),
    bio TEXT,
    avatar_url VARCHAR(500),
    university VARCHAR(200),
    degree VARCHAR(100),
    graduation_year INT,
    github_url VARCHAR(255),
    linkedin_url VARCHAR(255),
    portfolio_url VARCHAR(255),
    skills JSONB DEFAULT '[]'::jsonb, -- Array of skills with proficiency
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_profiles_username ON profiles(username);
```

---

### 3.2. Project Showcase & Moderation

#### `projects`
*Purpose:* Core showcase projects submitted by students or curated by the platform.
```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(250) UNIQUE NOT NULL,
    short_description VARCHAR(300) NOT NULL,
    problem_statement TEXT NOT NULL,
    objectives TEXT,
    features JSONB DEFAULT '[]'::jsonb NOT NULL,
    tech_stack JSONB DEFAULT '[]'::jsonb NOT NULL,
    prerequisites TEXT,
    difficulty VARCHAR(30) NOT NULL, -- 'Beginner', 'Intermediate', 'Advanced'
    estimated_duration VARCHAR(50),
    expected_outcome TEXT,
    cover_image_url VARCHAR(500),
    zip_storage_key VARCHAR(500) NOT NULL, -- S3/R2 object key
    zip_file_size_bytes BIGINT NOT NULL,
    github_url VARCHAR(500),
    live_demo_url VARCHAR(500),
    video_demo_url VARCHAR(500),
    domain VARCHAR(100) NOT NULL, -- 'Web', 'Mobile', 'AI/ML', 'Cloud', etc.
    status VARCHAR(50) DEFAULT 'Draft' NOT NULL, -- Draft, Submitted, Under Review, Approved, Changes Requested, Published, Rejected
    published_at TIMESTAMPTZ,
    views_count INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_projects_slug ON projects(slug);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_domain ON projects(domain);
CREATE INDEX idx_projects_difficulty ON projects(difficulty);
```

#### `project_screenshots`
*Purpose:* Stores image gallery screenshots attached to a project showcase.
```sql
CREATE TABLE project_screenshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    caption VARCHAR(200),
    display_order INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_project_screenshots_project ON project_screenshots(project_id, display_order);
```

#### `project_contributors`
*Purpose:* Links co-authors and contributors to collaborative student projects.
```sql
CREATE TABLE project_contributors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    contributor_name VARCHAR(150) NOT NULL,
    role_description VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

#### `project_reviews`
*Purpose:* Stores administrative moderation reviews, approvals, and changes requested.
```sql
CREATE TABLE project_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    review_status VARCHAR(50) NOT NULL, -- 'Approved', 'Changes Requested', 'Rejected'
    moderation_notes TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_project_reviews_project ON project_reviews(project_id);
```

#### `saved_projects`
*Purpose:* Bookmarks saved by students for later review.
```sql
CREATE TABLE saved_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_user_saved_project UNIQUE (user_id, project_id)
);
```

---

### 3.3. Jobs, Companies & Applications

#### `companies`
*Purpose:* Employer profiles and metadata.
```sql
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(220) UNIQUE NOT NULL,
    logo_url VARCHAR(500),
    website_url VARCHAR(500),
    location VARCHAR(200),
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

#### `jobs`
*Purpose:* Job and internship listings available for students.
```sql
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(250) UNIQUE NOT NULL,
    job_type VARCHAR(50) NOT NULL, -- 'Job', 'Internship'
    work_mode VARCHAR(50) NOT NULL, -- 'Remote', 'Hybrid', 'On-site'
    domain VARCHAR(100) NOT NULL,
    experience_level VARCHAR(50) NOT NULL, -- 'Fresher', '0-1 Years', '1-3 Years'
    location VARCHAR(200) NOT NULL,
    salary_range VARCHAR(100),
    description TEXT NOT NULL,
    responsibilities TEXT,
    requirements TEXT,
    skills_required JSONB DEFAULT '[]'::jsonb NOT NULL,
    external_apply_url VARCHAR(500) NOT NULL,
    deadline TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_jobs_slug ON jobs(slug);
CREATE INDEX idx_jobs_type ON jobs(job_type);
CREATE INDEX idx_jobs_active ON jobs(is_active);
```

#### `saved_jobs`
*Purpose:* Jobs bookmarked by students.
```sql
CREATE TABLE saved_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_user_saved_job UNIQUE (user_id, job_id)
);
```

#### `applications`
*Purpose:* Student application tracking pipeline.
```sql
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    company_name VARCHAR(200) NOT NULL,
    role_title VARCHAR(200) NOT NULL,
    job_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'Applied' NOT NULL, -- 'Saved', 'Applied', 'Shortlisted', 'Interview', 'Selected', 'Rejected'
    applied_date DATE NOT NULL,
    deadline_date DATE,
    interview_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_applications_user ON applications(user_id, status);
```

---

### 3.4. Resumes, Templates & ATS Analysis

#### `resume_templates`
*Purpose:* Predefined ATS-friendly design layouts and styles.
```sql
CREATE TABLE resume_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'Fresher', 'Technical', 'Modern', 'Minimal', etc.
    preview_image_url VARCHAR(500) NOT NULL,
    template_config JSONB NOT NULL, -- layout, font, margins, color schema
    is_ats_friendly BOOLEAN DEFAULT TRUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

#### `resumes`
*Purpose:* Student created resumes.
```sql
CREATE TABLE resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES resume_templates(id) ON DELETE RESTRICT,
    title VARCHAR(150) DEFAULT 'My Resume' NOT NULL,
    content_data JSONB NOT NULL, -- complete structured sections
    pdf_storage_key VARCHAR(500),
    is_default BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_resumes_user ON resumes(user_id);
```

#### `ats_analyses`
*Purpose:* Results of resume scoring against job descriptions via Gemini AI.
```sql
CREATE TABLE ats_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
    target_job_title VARCHAR(200),
    job_description_snippet TEXT,
    overall_score INT NOT NULL, -- 0 to 100
    skills_match_score INT NOT NULL,
    keyword_match_score INT NOT NULL,
    formatting_score INT NOT NULL,
    matched_skills JSONB DEFAULT '[]'::jsonb NOT NULL,
    missing_skills JSONB DEFAULT '[]'::jsonb NOT NULL,
    strengths JSONB DEFAULT '[]'::jsonb NOT NULL,
    weaknesses JSONB DEFAULT '[]'::jsonb NOT NULL,
    actionable_suggestions JSONB DEFAULT '[]'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_ats_user ON ats_analyses(user_id);
```

---

### 3.5. Notifications

#### `notifications`
*Purpose:* In-app updates for moderation reviews, reminders, and account activity.
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL, -- 'PROJECT_UPDATE', 'APPLICATION_REMINDER', 'SYSTEM'
    reference_url VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);
```
