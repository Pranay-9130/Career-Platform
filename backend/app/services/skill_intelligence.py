import io
import json
import logging
import re
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple, Set
import httpx
from sqlalchemy import select, func, desc, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.job import Job
from app.models.project import Project
from app.models.resume import Resume
from app.models.skill_intelligence import StudentTargetRole, StudentSkill, SkillStatus, SkillSource

logger = logging.getLogger(__name__)

# ==============================================================================
# 1. CANONICAL SKILL CATALOG & NORMALIZATION
# ==============================================================================

CANONICAL_SKILL_LOOKUP = {
    # Languages
    "python": ("Python", "Languages"),
    "python3": ("Python", "Languages"),
    "javascript": ("JavaScript", "Languages"),
    "js": ("JavaScript", "Languages"),
    "typescript": ("TypeScript", "Languages"),
    "ts": ("TypeScript", "Languages"),
    "java": ("Java", "Languages"),
    "c++": ("C++", "Languages"),
    "cpp": ("C++", "Languages"),
    "c#": ("C#", "Languages"),
    "csharp": ("C#", "Languages"),
    "golang": ("Go", "Languages"),
    "go": ("Go", "Languages"),
    "rust": ("Rust", "Languages"),
    "ruby": ("Ruby", "Languages"),
    "php": ("PHP", "Languages"),
    "swift": ("Swift", "Languages"),
    "kotlin": ("Kotlin", "Languages"),
    "sql": ("SQL", "Languages"),
    "html": ("HTML5", "Languages"),
    "html5": ("HTML5", "Languages"),
    "css": ("CSS3", "Languages"),
    "css3": ("CSS3", "Languages"),
    "bash": ("Bash & Shell Scripting", "Languages"),
    "shell": ("Bash & Shell Scripting", "Languages"),

    # Frontend Frameworks & UI
    "react": ("React", "Frameworks & Libraries"),
    "react.js": ("React", "Frameworks & Libraries"),
    "reactjs": ("React", "Frameworks & Libraries"),
    "next.js": ("Next.js", "Frameworks & Libraries"),
    "nextjs": ("Next.js", "Frameworks & Libraries"),
    "vue": ("Vue.js", "Frameworks & Libraries"),
    "vue.js": ("Vue.js", "Frameworks & Libraries"),
    "angular": ("Angular", "Frameworks & Libraries"),
    "tailwind": ("Tailwind CSS", "Frameworks & Libraries"),
    "tailwind css": ("Tailwind CSS", "Frameworks & Libraries"),
    "bootstrap": ("Bootstrap", "Frameworks & Libraries"),
    "material ui": ("Material UI", "Frameworks & Libraries"),
    "redux": ("Redux", "Frameworks & Libraries"),

    # Backend Frameworks & Runtimes
    "node": ("Node.js", "Frameworks & Libraries"),
    "node.js": ("Node.js", "Frameworks & Libraries"),
    "nodejs": ("Node.js", "Frameworks & Libraries"),
    "express": ("Express", "Frameworks & Libraries"),
    "express.js": ("Express", "Frameworks & Libraries"),
    "fastapi": ("FastAPI", "Frameworks & Libraries"),
    "django": ("Django", "Frameworks & Libraries"),
    "flask": ("Flask", "Frameworks & Libraries"),
    "spring": ("Spring Boot", "Frameworks & Libraries"),
    "spring boot": ("Spring Boot", "Frameworks & Libraries"),
    ".net": (".NET", "Frameworks & Libraries"),
    "asp.net": ("ASP.NET", "Frameworks & Libraries"),

    # Databases & Caching
    "postgresql": ("PostgreSQL", "Databases & Storage"),
    "postgres": ("PostgreSQL", "Databases & Storage"),
    "mysql": ("MySQL", "Databases & Storage"),
    "mongodb": ("MongoDB", "Databases & Storage"),
    "mongo": ("MongoDB", "Databases & Storage"),
    "redis": ("Redis", "Databases & Storage"),
    "sqlite": ("SQLite", "Databases & Storage"),
    "elasticsearch": ("Elasticsearch", "Databases & Storage"),
    "firebase": ("Firebase", "Databases & Storage"),
    "supabase": ("Supabase", "Databases & Storage"),

    # Cloud, DevOps & Infrastructure
    "docker": ("Docker", "Cloud & DevOps"),
    "kubernetes": ("Kubernetes", "Cloud & DevOps"),
    "k8s": ("Kubernetes", "Cloud & DevOps"),
    "aws": ("AWS", "Cloud & DevOps"),
    "amazon web services": ("AWS", "Cloud & DevOps"),
    "azure": ("Azure", "Cloud & DevOps"),
    "gcp": ("Google Cloud (GCP)", "Cloud & DevOps"),
    "google cloud": ("Google Cloud (GCP)", "Cloud & DevOps"),
    "terraform": ("Terraform", "Cloud & DevOps"),
    "ci/cd": ("CI/CD Pipelines", "Cloud & DevOps"),
    "github actions": ("GitHub Actions", "Cloud & DevOps"),
    "linux": ("Linux System Administration", "Cloud & DevOps"),
    "nginx": ("Nginx", "Cloud & DevOps"),

    # Architecture, APIs & Methodologies
    "rest": ("RESTful APIs", "Architecture & APIs"),
    "rest api": ("RESTful APIs", "Architecture & APIs"),
    "restful": ("RESTful APIs", "Architecture & APIs"),
    "graphql": ("GraphQL", "Architecture & APIs"),
    "microservices": ("Microservices Architecture", "Architecture & APIs"),
    "system design": ("System Design", "Architecture & APIs"),
    "agile": ("Agile & Scrum", "Methodologies"),
    "scrum": ("Agile & Scrum", "Methodologies"),

    # Testing & Quality
    "git": ("Git Version Control", "Tools & Testing"),
    "github": ("GitHub", "Tools & Testing"),
    "pytest": ("Pytest", "Tools & Testing"),
    "jest": ("Jest", "Tools & Testing"),
    "cypress": ("Cypress", "Tools & Testing"),
    "unit testing": ("Unit & Integration Testing", "Tools & Testing"),
    "automated testing": ("Unit & Integration Testing", "Tools & Testing"),

    # Data & AI / ML
    "pandas": ("Pandas", "Data & AI"),
    "numpy": ("NumPy", "Data & AI"),
    "scikit-learn": ("Scikit-Learn", "Data & AI"),
    "sklearn": ("Scikit-Learn", "Data & AI"),
    "pytorch": ("PyTorch", "Data & AI"),
    "tensorflow": ("TensorFlow", "Data & AI"),
    "data analysis": ("Data Analysis", "Data & AI"),
    "machine learning": ("Machine Learning", "Data & AI"),
    "deep learning": ("Deep Learning", "Data & AI"),
    "nlp": ("Natural Language Processing (NLP)", "Data & AI"),
    "transformers": ("Transformers & LLMs", "Data & AI"),
    "llm": ("Transformers & LLMs", "Data & AI"),
    "tableau": ("Tableau", "Data & AI"),
    "power bi": ("Power BI", "Data & AI"),

    # Cybersecurity
    "cybersecurity": ("Cybersecurity Fundamentals", "Security & Systems"),
    "penetration testing": ("Penetration Testing", "Security & Systems"),
    "owasp": ("OWASP Top 10 Security", "Security & Systems"),
    "network security": ("Network Security & Protocols", "Security & Systems"),
    "cryptography": ("Applied Cryptography", "Security & Systems"),

    # Professional & Soft Skills
    "communication": ("Technical Communication", "Professional Skills"),
    "problem solving": ("Problem Solving & Debugging", "Professional Skills"),
    "code review": ("Code Review Best Practices", "Professional Skills"),
    "team collaboration": ("Team Collaboration", "Professional Skills"),
}


def normalize_skill_name(raw_name: str) -> Tuple[str, str]:
    """
    Normalizes any raw or casing-variant skill name into its canonical name and category.
    """
    clean = raw_name.strip()
    key = clean.lower()
    if key in CANONICAL_SKILL_LOOKUP:
        return CANONICAL_SKILL_LOOKUP[key]

    # Clean punctuation and common suffixes
    clean_key = re.sub(r"[\s\-_.]+", " ", key).strip()
    if clean_key in CANONICAL_SKILL_LOOKUP:
        return CANONICAL_SKILL_LOOKUP[clean_key]

    # Default capitalization if unmapped
    words = clean.split()
    capitalized = " ".join(w.capitalize() if not (w.isupper() and len(w) <= 4) else w for w in words)
    return capitalized, "Technical Skills"


# ==============================================================================
# 2. PDF & RESUME SKILL EXTRACTION
# ==============================================================================

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """
    Extracts text from PDF bytes safely using PyMuPDF (fitz), pdfplumber,
    and pypdf fallbacks.
    Handles malformed files, empty files, password-protected PDFs, and provides
    clear distinction between uninstalled parsers, corrupted files, and PDFs
    that truly lack selectable text.
    """
    if not pdf_bytes or len(pdf_bytes) < 10:
        raise ValueError("The uploaded file is empty or too small to be a valid PDF.")

    # Validate PDF magic header
    if b"%PDF-" not in pdf_bytes[:1024]:
        raise ValueError("The uploaded file does not appear to be a valid PDF document.")

    extracted_pages = []
    installed_engines = []
    successful_engines = []
    engine_errors = {}
    is_encrypted = False

    # Strategy A: PyMuPDF (fitz)
    try:
        import fitz
        installed_engines.append("PyMuPDF")
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        if doc.is_encrypted:
            is_encrypted = True
            try:
                if not doc.authenticate(""):
                    raise ValueError("Password-protected PDF files cannot be processed.")
                is_encrypted = False
            except ValueError:
                raise
            except Exception:
                raise ValueError("Password-protected PDF files cannot be processed.")

        for page in doc:
            page_text = page.get_text() or ""
            if page_text.strip():
                extracted_pages.append(page_text.strip())
        doc.close()
        successful_engines.append("PyMuPDF")
    except (ImportError, ModuleNotFoundError):
        logger.warning("PyMuPDF (fitz) is not installed in this environment.")
    except ValueError:
        raise
    except Exception as exc:
        engine_errors["PyMuPDF"] = str(exc)
        logger.warning("PyMuPDF failed to parse PDF; trying fallback extractor: %s", exc)

    # Strategy B: pdfplumber fallback if PyMuPDF yielded nothing
    if not extracted_pages and not is_encrypted:
        try:
            import pdfplumber
            installed_engines.append("pdfplumber")
            with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                for page in pdf.pages:
                    text = page.extract_text() or ""
                    if text.strip():
                        extracted_pages.append(text.strip())
            successful_engines.append("pdfplumber")
        except (ImportError, ModuleNotFoundError):
            logger.warning("pdfplumber is not installed in this environment.")
        except Exception as exc:
            engine_errors["pdfplumber"] = str(exc)
            logger.warning("pdfplumber fallback encountered error: %s", exc)

    # Strategy C: pypdf fallback if PyMuPDF and pdfplumber yielded nothing
    if not extracted_pages and not is_encrypted:
        try:
            import pypdf
            installed_engines.append("pypdf")
            reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
            if reader.is_encrypted:
                is_encrypted = True
                try:
                    if not reader.decrypt(""):
                        raise ValueError("Password-protected PDF files cannot be processed.")
                    is_encrypted = False
                except ValueError:
                    raise
                except Exception:
                    raise ValueError("Password-protected PDF files cannot be processed.")

            for page in reader.pages:
                text = page.extract_text() or ""
                if text.strip():
                    extracted_pages.append(text.strip())
            successful_engines.append("pypdf")
        except (ImportError, ModuleNotFoundError):
            logger.warning("pypdf is not installed in this environment.")
        except ValueError:
            raise
        except Exception as exc:
            engine_errors["pypdf"] = str(exc)
            logger.warning("pypdf fallback encountered error: %s", exc)

    if not installed_engines:
        logger.error("No PDF parsing engine is available on the server (PyMuPDF, pdfplumber, pypdf).")
        raise RuntimeError("PDF text extraction service is not configured on the server. Please contact support.")

    if not successful_engines and engine_errors:
        err_details = "; ".join(f"{k}: {v}" for k, v in engine_errors.items())
        logger.error("All available PDF engines failed to parse the file: %s", err_details)
        raise ValueError(f"Corrupted or invalid PDF document: unable to parse pages ({err_details}).")

    full_text = "\n".join(extracted_pages).strip()
    if not full_text:
        raise ValueError("Could not extract readable text from the provided PDF. Please ensure it contains selectable text.")

    return full_text


def extract_skills_from_text(text: str) -> List[Dict[str, str]]:
    """
    Scans text against canonical technical keywords and returns deduplicated extracted skills.
    """
    t_lower = " " + text.lower() + " "
    found_skills: Dict[str, str] = {}

    for alias, (canonical_name, category) in CANONICAL_SKILL_LOOKUP.items():
        # Match standalone word boundaries
        pattern = r"(?<![a-zA-Z0-9_#+])" + re.escape(alias) + r"(?![a-zA-Z0-9_#+])"
        if re.search(pattern, t_lower):
            found_skills[canonical_name] = category

    # Also detect skills from explicit comma-separated sections (e.g. "Skills: Python, React, Docker")
    lines = text.splitlines()
    for line in lines:
        if re.match(r"^(?:technical\s+)?skills\s*[:\-]", line, re.IGNORECASE):
            parts = re.split(r"[,;|•]", line.split(":", 1)[-1])
            for p in parts:
                cleaned = p.strip()
                if 2 <= len(cleaned) <= 30:
                    c_name, c_cat = normalize_skill_name(cleaned)
                    found_skills[c_name] = c_cat

    results = [
        {"skill_name": name, "category": cat, "source": "resume"}
        for name, cat in sorted(found_skills.items())
    ]
    return results


# ==============================================================================
# 3. CURATED ROLE-TO-SKILL TAXONOMY
# ==============================================================================

CURATED_ROLES = {
    "Frontend Developer": {
        "domain": "Frontend",
        "description": "Crafts accessible, high-performance web applications and fluid interactive user experiences.",
        "skills": [
            {
                "name": "JavaScript",
                "category": "Languages",
                "is_essential": True,
                "why_it_matters": "Fundamental runtime language powering modern web browsers and reactive client interfaces.",
                "prerequisites": [],
                "estimated_duration": "2-3 weeks",
                "learning_stage": 1,
                "learning_objectives": ["ES6+ syntax & arrow functions", "Promises, async/await, and event loop", "DOM manipulation & event propagation"],
                "practice_exercise": "Build an asynchronous weather dashboard fetching data from a public REST API.",
                "resources": [
                    {"title": "MDN JavaScript Guide", "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide", "resource_type": "Documentation"},
                    {"title": "javascript.info Modern Tutorial", "url": "https://javascript.info/", "resource_type": "Tutorial"},
                ],
            },
            {
                "name": "TypeScript",
                "category": "Languages",
                "is_essential": True,
                "why_it_matters": "Prevents runtime bugs at scale with compile-time type safety and advanced generic modeling.",
                "prerequisites": ["JavaScript"],
                "estimated_duration": "2 weeks",
                "learning_stage": 1,
                "learning_objectives": ["Interface & type alias declarations", "Generic functions & component props", "Type narrowing and discriminating unions"],
                "practice_exercise": "Refactor a vanilla JS stateful form into strict TypeScript with typed event handlers.",
                "resources": [
                    {"title": "Official TypeScript Handbook", "url": "https://www.typescriptlang.org/docs/handbook/intro.html", "resource_type": "Documentation"},
                ],
            },
            {
                "name": "HTML5",
                "category": "Languages",
                "is_essential": True,
                "why_it_matters": "Provides accessible document structure, semantics, and search engine discoverability.",
                "prerequisites": [],
                "estimated_duration": "1 week",
                "learning_stage": 1,
                "learning_objectives": ["Semantic tags (article, section, nav)", "WCAG 2.1 accessibility landmarks & ARIA", "Form validation attributes"],
                "practice_exercise": "Construct an accessible multi-step checkout form meeting WCAG AAA contrast and keyboard navigation.",
                "resources": [
                    {"title": "MDN HTML Semantics", "url": "https://developer.mozilla.org/en-US/docs/Learn/HTML", "resource_type": "Documentation"},
                ],
            },
            {
                "name": "CSS3",
                "category": "Languages",
                "is_essential": True,
                "why_it_matters": "Powers visual design, layout computation, responsive breakpoints, and animations.",
                "prerequisites": ["HTML5"],
                "estimated_duration": "1-2 weeks",
                "learning_stage": 1,
                "learning_objectives": ["CSS Flexbox & CSS Grid systems", "Custom properties (CSS variables)", "Media queries & responsive container queries"],
                "practice_exercise": "Design a responsive 12-column masonry grid layout with dark mode toggle.",
                "resources": [
                    {"title": "CSS-Tricks Guide to Flexbox", "url": "https://css-tricks.com/snippets/css/a-guide-to-flexbox/", "resource_type": "Guide"},
                ],
            },
            {
                "name": "React",
                "category": "Frameworks & Libraries",
                "is_essential": True,
                "why_it_matters": "Dominant component-driven library for building scalable, reactive single-page applications.",
                "prerequisites": ["JavaScript", "HTML5"],
                "estimated_duration": "3-4 weeks",
                "learning_stage": 2,
                "learning_objectives": ["Hooks lifecycle (useState, useEffect, useMemo, useCallback)", "Component decomposition & prop drilling solutions", "Context API & client state management"],
                "practice_exercise": "Create an interactive e-commerce shopping cart with localStorage persistence and optimistic UI.",
                "resources": [
                    {"title": "React.dev Official Documentation", "url": "https://react.dev/", "resource_type": "Documentation"},
                ],
            },
            {
                "name": "Tailwind CSS",
                "category": "Frameworks & Libraries",
                "is_essential": True,
                "why_it_matters": "Industry-standard utility-first CSS framework enabling rapid, consistent design system development.",
                "prerequisites": ["CSS3"],
                "estimated_duration": "1 week",
                "learning_stage": 2,
                "learning_objectives": ["Utility layout & typography classes", "Responsive modifier prefixes (sm, md, lg)", "Theme customization & design tokens"],
                "practice_exercise": "Recreate a polished SaaS pricing table with interactive monthly/annual switch using Tailwind.",
                "resources": [
                    {"title": "Tailwind CSS Documentation", "url": "https://tailwindcss.com/docs", "resource_type": "Documentation"},
                ],
            },
            {
                "name": "Next.js",
                "category": "Frameworks & Libraries",
                "is_essential": False,
                "why_it_matters": "Enables server-side rendering (SSR), static site generation (SSG), and optimal SEO for production web apps.",
                "prerequisites": ["React", "TypeScript"],
                "estimated_duration": "2 weeks",
                "learning_stage": 3,
                "learning_objectives": ["App Router architecture & Server Components", "API routes & server actions", "Image optimization & dynamic metadata"],
                "practice_exercise": "Build a server-rendered developer blog fetching markdown posts with dynamic OpenGraph cards.",
                "resources": [
                    {"title": "Next.js Learn Course", "url": "https://nextjs.org/learn", "resource_type": "Course"},
                ],
            },
            {
                "name": "RESTful APIs",
                "category": "Architecture & APIs",
                "is_essential": True,
                "why_it_matters": "Enables frontend apps to securely communicate, exchange JSON data, and synchronize backend states.",
                "prerequisites": ["JavaScript"],
                "estimated_duration": "1 week",
                "learning_stage": 2,
                "learning_objectives": ["HTTP verbs (GET, POST, PUT, DELETE, PATCH)", "Status codes & error handling conventions", "CORS, authentication tokens, and headers"],
                "practice_exercise": "Integrate a frontend app with an authenticated backend API using Axios interceptors.",
                "resources": [
                    {"title": "REST API Tutorial", "url": "https://restfulapi.net/", "resource_type": "Tutorial"},
                ],
            },
            {
                "name": "Git Version Control",
                "category": "Tools & Testing",
                "is_essential": True,
                "why_it_matters": "Enables professional team code collaboration, branching, pull request workflows, and release versioning.",
                "prerequisites": [],
                "estimated_duration": "1 week",
                "learning_stage": 1,
                "learning_objectives": ["Branching, rebasing, and merge conflict resolution", "Conventional commit messages", "GitHub Pull Request reviews"],
                "practice_exercise": "Fork an open repository, create a feature branch, resolve a simulated merge conflict, and submit a PR.",
                "resources": [
                    {"title": "Pro Git Book", "url": "https://git-scm.com/book/en/v2", "resource_type": "Documentation"},
                ],
            },
            {
                "name": "Jest",
                "category": "Tools & Testing",
                "is_essential": False,
                "why_it_matters": "Automates unit testing of UI components and utility logic, preventing costly regression defects.",
                "prerequisites": ["JavaScript", "React"],
                "estimated_duration": "1-2 weeks",
                "learning_stage": 4,
                "learning_objectives": ["Snapshot & assertion testing", "Mocking API calls & timers", "React Testing Library user event interactions"],
                "practice_exercise": "Write comprehensive unit test coverage for an authentication modal including form validation.",
                "resources": [
                    {"title": "Testing Library Documentation", "url": "https://testing-library.com/docs/react-testing-library/intro/", "resource_type": "Documentation"},
                ],
            },
        ],
    },
    "Backend Developer": {
        "domain": "Backend",
        "description": "Architects resilient distributed microservices, database schemas, and high-throughput APIs.",
        "skills": [
            {
                "name": "Python",
                "category": "Languages",
                "is_essential": True,
                "why_it_matters": "High-productivity language for web backends, automation, data engineering, and modern APIs.",
                "prerequisites": [],
                "estimated_duration": "2-3 weeks",
                "learning_stage": 1,
                "learning_objectives": ["Object-oriented & functional paradigms", "Asyncio & concurrent programming", "Type hints and Pydantic validation"],
                "practice_exercise": "Build an asynchronous worker processing simulated background jobs with asyncio queues.",
                "resources": [
                    {"title": "Official Python Tutorial", "url": "https://docs.python.org/3/tutorial/", "resource_type": "Documentation"},
                ],
            },
            {
                "name": "FastAPI",
                "category": "Frameworks & Libraries",
                "is_essential": True,
                "why_it_matters": "Modern, high-performance async Python framework with automatic OpenAPI documentation.",
                "prerequisites": ["Python"],
                "estimated_duration": "2 weeks",
                "learning_stage": 2,
                "learning_objectives": ["Dependency injection system", "Request validation with Pydantic v2", "OAuth2 & JWT authentication middlewares"],
                "practice_exercise": "Build a production-grade CRUD microservice with rate limiting and JWT session auth.",
                "resources": [
                    {"title": "FastAPI Official Tutorial", "url": "https://fastapi.tiangolo.com/tutorial/", "resource_type": "Documentation"},
                ],
            },
            {
                "name": "SQL",
                "category": "Languages",
                "is_essential": True,
                "why_it_matters": "Essential language for querying, aggregating, and joining relational business data.",
                "prerequisites": [],
                "estimated_duration": "2 weeks",
                "learning_stage": 1,
                "learning_objectives": ["Complex INNER/LEFT/FULL OUTER joins", "Aggregations (GROUP BY, HAVING, Window Functions)", "Subqueries and CTEs"],
                "practice_exercise": "Write queries calculating monthly recurring revenue (MRR) and customer churn cohort analysis.",
                "resources": [
                    {"title": "SQLBolt Interactive Lessons", "url": "https://sqlbolt.com/", "resource_type": "Tutorial"},
                ],
            },
            {
                "name": "PostgreSQL",
                "category": "Databases & Storage",
                "is_essential": True,
                "why_it_matters": "Enterprise-grade relational database known for ACID compliance, indexing flexibility, and JSONB support.",
                "prerequisites": ["SQL"],
                "estimated_duration": "2-3 weeks",
                "learning_stage": 3,
                "learning_objectives": ["B-tree, GIN, and Hash index optimizations", "EXPLAIN ANALYZE query planning", "Transaction isolation levels and locks"],
                "practice_exercise": "Optimize a slow query executing on a 100k-row table using appropriate composite indexes.",
                "resources": [
                    {"title": "PostgreSQL Documentation", "url": "https://www.postgresql.org/docs/", "resource_type": "Documentation"},
                ],
            },
            {
                "name": "Redis",
                "category": "Databases & Storage",
                "is_essential": True,
                "why_it_matters": "In-memory key-value data store used for sub-millisecond caching, rate-limiting, and pub/sub queues.",
                "prerequisites": [],
                "estimated_duration": "1 week",
                "learning_stage": 3,
                "learning_objectives": ["Strings, Hashes, Sets, and Sorted Sets", "Cache expiration (TTL) & eviction strategies", "Sliding window rate limit implementation"],
                "practice_exercise": "Implement an API rate-limiter using Redis that throttles clients to 60 requests per minute.",
                "resources": [
                    {"title": "Redis University", "url": "https://redis.io/learn", "resource_type": "Documentation"},
                ],
            },
            {
                "name": "Docker",
                "category": "Cloud & DevOps",
                "is_essential": True,
                "why_it_matters": "Standardizes application runtime containers across development, staging, and production servers.",
                "prerequisites": ["Linux System Administration"],
                "estimated_duration": "1-2 weeks",
                "learning_stage": 3,
                "learning_objectives": ["Multi-stage Dockerfile builds", "Layer caching optimization", "Docker Compose multi-service topologies"],
                "practice_exercise": "Containerize a FastAPI service + PostgreSQL + Redis stack with health checks via Compose.",
                "resources": [
                    {"title": "Docker Getting Started", "url": "https://docs.docker.com/get-started/", "resource_type": "Documentation"},
                ],
            },
            {
                "name": "Pytest",
                "category": "Tools & Testing",
                "is_essential": True,
                "why_it_matters": "Standard Python automated testing framework for unit tests, fixtures, and API integration suites.",
                "prerequisites": ["Python"],
                "estimated_duration": "1 week",
                "learning_stage": 2,
                "learning_objectives": ["Fixtures and scope management", "Async test execution with pytest-asyncio", "Test isolation & mock clients"],
                "practice_exercise": "Write integration test suites with 90%+ branch coverage for an e-commerce checkout route.",
                "resources": [
                    {"title": "Pytest Documentation", "url": "https://docs.pytest.org/", "resource_type": "Documentation"},
                ],
            },
            {
                "name": "RESTful APIs",
                "category": "Architecture & APIs",
                "is_essential": True,
                "why_it_matters": "Standard architecture for reliable client-server contract design.",
                "prerequisites": [],
                "estimated_duration": "1 week",
                "learning_stage": 2,
                "learning_objectives": ["Idempotency & HTTP status design", "Pagination (cursor vs offset)", "API versioning strategies"],
                "practice_exercise": "Design a paginated search API with filtering, sorting, and metadata response headers.",
                "resources": [
                    {"title": "Microsoft REST API Guidelines", "url": "https://github.com/microsoft/api-guidelines", "resource_type": "Guide"},
                ],
            },
            {
                "name": "System Design",
                "category": "Architecture & APIs",
                "is_essential": False,
                "why_it_matters": "Guides architectural trade-offs: CAP theorem, caching, load balancing, and horizontal scalability.",
                "prerequisites": ["PostgreSQL", "Redis"],
                "estimated_duration": "3 weeks",
                "learning_stage": 4,
                "learning_objectives": ["Load balancing (round robin, least connections)", "Database sharding and replication", "Message queues & event-driven decoupling"],
                "practice_exercise": "Draft an architectural blueprint for a URL shortener scaling to 10M daily active users.",
                "resources": [
                    {"title": "System Design Primer", "url": "https://github.com/donnemartin/system-design-primer", "resource_type": "Guide"},
                ],
            },
        ],
    },
    "Full Stack Developer": {
        "domain": "Full-Stack Development",
        "description": "Builds complete end-to-end applications from responsive frontend interfaces to scalable backend infrastructure.",
        "skills": [
            {
                "name": "JavaScript",
                "category": "Languages",
                "is_essential": True,
                "why_it_matters": "Connects browser interactions with backend Node or full-stack framework runtimes.",
                "prerequisites": [],
                "estimated_duration": "2 weeks",
                "learning_stage": 1,
                "learning_objectives": ["Async JavaScript and promises", "Modules and modern build tools", "DOM and browser APIs"],
                "practice_exercise": "Build an end-to-end task manager app with vanilla JS frontend communicating to an API.",
                "resources": [{"title": "MDN JS", "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript", "resource_type": "Documentation"}],
            },
            {
                "name": "TypeScript",
                "category": "Languages",
                "is_essential": True,
                "why_it_matters": "Provides end-to-end type safety shared across both client views and API schemas.",
                "prerequisites": ["JavaScript"],
                "estimated_duration": "2 weeks",
                "learning_stage": 1,
                "learning_objectives": ["Shared DTO types between frontend and backend", "Strict null checks", "Generics in API responses"],
                "practice_exercise": "Define a shared TypeScript interface package consumed by both frontend and backend.",
                "resources": [{"title": "TypeScript Handbook", "url": "https://www.typescriptlang.org/", "resource_type": "Documentation"}],
            },
            {
                "name": "React",
                "category": "Frameworks & Libraries",
                "is_essential": True,
                "why_it_matters": "Powers reactive, modular user interfaces with predictable state transitions.",
                "prerequisites": ["JavaScript"],
                "estimated_duration": "3 weeks",
                "learning_stage": 2,
                "learning_objectives": ["Component architecture", "Hooks & custom hooks", "API state fetching & mutation"],
                "practice_exercise": "Build a responsive kanban board with drag-and-drop column organization.",
                "resources": [{"title": "React Docs", "url": "https://react.dev/", "resource_type": "Documentation"}],
            },
            {
                "name": "Node.js",
                "category": "Frameworks & Libraries",
                "is_essential": True,
                "why_it_matters": "Asynchronous event-driven runtime enabling JavaScript execution on the server.",
                "prerequisites": ["JavaScript"],
                "estimated_duration": "2 weeks",
                "learning_stage": 2,
                "learning_objectives": ["Event loop, streams, and file system", "HTTP servers & middlewares", "npm package management"],
                "practice_exercise": "Build a file upload service with streaming processing and disk persistence.",
                "resources": [{"title": "Node.js Guide", "url": "https://nodejs.org/en/learn", "resource_type": "Documentation"}],
            },
            {
                "name": "Express",
                "category": "Frameworks & Libraries",
                "is_essential": True,
                "why_it_matters": "Standard minimalist web framework for building Node.js HTTP microservices.",
                "prerequisites": ["Node.js"],
                "estimated_duration": "1-2 weeks",
                "learning_stage": 2,
                "learning_objectives": ["Router modularization", "Error handling middlewares", "CORS & security headers"],
                "practice_exercise": "Create an authenticated REST API for bookmarking articles with Express.",
                "resources": [{"title": "Express Guide", "url": "https://expressjs.com/", "resource_type": "Documentation"}],
            },
            {
                "name": "PostgreSQL",
                "category": "Databases & Storage",
                "is_essential": True,
                "why_it_matters": "Reliable relational database for storing structured business entities and relational data.",
                "prerequisites": ["SQL"],
                "estimated_duration": "2 weeks",
                "learning_stage": 3,
                "learning_objectives": ["Relational modeling & foreign keys", "Transactions & data integrity", "ORM integration"],
                "practice_exercise": "Design a relational schema for an online learning platform with courses, enrollments, and lessons.",
                "resources": [{"title": "PostgreSQL Tutorial", "url": "https://www.postgresqltutorial.com/", "resource_type": "Tutorial"}],
            },
            {
                "name": "Docker",
                "category": "Cloud & DevOps",
                "is_essential": True,
                "why_it_matters": "Guarantees full-stack parity across developer machines and cloud deployment targets.",
                "prerequisites": [],
                "estimated_duration": "1 week",
                "learning_stage": 3,
                "learning_objectives": ["Containerizing frontend & backend", "Environment variable injection", "Docker networking"],
                "practice_exercise": "Compose a multi-container full-stack app with React client, Node backend, and Postgres.",
                "resources": [{"title": "Docker Docs", "url": "https://docs.docker.com/", "resource_type": "Documentation"}],
            },
            {
                "name": "Tailwind CSS",
                "category": "Frameworks & Libraries",
                "is_essential": False,
                "why_it_matters": "Speeds up custom UI development with utility classes without leaving markup.",
                "prerequisites": [],
                "estimated_duration": "1 week",
                "learning_stage": 2,
                "learning_objectives": ["Grid, Flex, responsive utilities", "Tailwind plugins & typography", "Reusability patterns"],
                "practice_exercise": "Style an administrative analytics dashboard using Tailwind grid primitives.",
                "resources": [{"title": "Tailwind Docs", "url": "https://tailwindcss.com/", "resource_type": "Documentation"}],
            },
        ],
    },
    "Python Developer": {
        "domain": "Backend",
        "description": "Specializes in Python programming for web backends, automation scripts, and data platforms.",
        "skills": [
            {
                "name": "Python",
                "category": "Languages",
                "is_essential": True,
                "why_it_matters": "Core language mastery covering OOP, iterators, generators, decorators, and modern typing.",
                "prerequisites": [],
                "estimated_duration": "3 weeks",
                "learning_stage": 1,
                "learning_objectives": ["Advanced decorators & context managers", "Generators, iterators, and itertools", "Asyncio event loop"],
                "practice_exercise": "Build a custom caching decorator supporting TTL expiration and in-memory eviction.",
                "resources": [{"title": "Real Python", "url": "https://realpython.com/", "resource_type": "Tutorial"}],
            },
            {
                "name": "FastAPI",
                "category": "Frameworks & Libraries",
                "is_essential": True,
                "why_it_matters": "High-speed asynchronous Python framework for modern cloud APIs.",
                "prerequisites": ["Python"],
                "estimated_duration": "2 weeks",
                "learning_stage": 2,
                "learning_objectives": ["Path operations & dependency injection", "Pydantic request models", "Async SQLAlchemy integration"],
                "practice_exercise": "Build a secure REST API with user registration, JWT auth, and database persistence.",
                "resources": [{"title": "FastAPI Docs", "url": "https://fastapi.tiangolo.com/", "resource_type": "Documentation"}],
            },
            {
                "name": "SQL",
                "category": "Languages",
                "is_essential": True,
                "why_it_matters": "Querying and mutating relational records via raw queries and SQLAlchemy ORM.",
                "prerequisites": [],
                "estimated_duration": "2 weeks",
                "learning_stage": 1,
                "learning_objectives": ["Joins, aggregations, and grouping", "Transactions and ACID guarantees", "Indexes and performance"],
                "practice_exercise": "Write queries calculating rolling 7-day user activity counts.",
                "resources": [{"title": "SQLBolt", "url": "https://sqlbolt.com/", "resource_type": "Tutorial"}],
            },
            {
                "name": "PostgreSQL",
                "category": "Databases & Storage",
                "is_essential": True,
                "why_it_matters": "Standard database of choice for production Python backend services.",
                "prerequisites": ["SQL"],
                "estimated_duration": "2 weeks",
                "learning_stage": 3,
                "learning_objectives": ["Asyncpg connection pooling", "Alembic schema migrations", "Indexes & query plans"],
                "practice_exercise": "Implement an asynchronous database repository using SQLAlchemy 2.0 select syntax.",
                "resources": [{"title": "PostgreSQL Docs", "url": "https://www.postgresql.org/docs/", "resource_type": "Documentation"}],
            },
            {
                "name": "Pytest",
                "category": "Tools & Testing",
                "is_essential": True,
                "why_it_matters": "Automates verification of backend routes and business logic.",
                "prerequisites": ["Python"],
                "estimated_duration": "1 week",
                "learning_stage": 2,
                "learning_objectives": ["Fixtures and parameterization", "Mocking third party calls", "Code coverage metrics"],
                "practice_exercise": "Write unit tests for a payment processing module using mock HTTP clients.",
                "resources": [{"title": "Pytest Docs", "url": "https://docs.pytest.org/", "resource_type": "Documentation"}],
            },
            {
                "name": "Docker",
                "category": "Cloud & DevOps",
                "is_essential": True,
                "why_it_matters": "Package Python applications with dependencies for clean reproducible deployments.",
                "prerequisites": [],
                "estimated_duration": "1 week",
                "learning_stage": 3,
                "learning_objectives": ["Slim base image selection", "Multi-stage dependency caching", "Non-root user execution"],
                "practice_exercise": "Write an optimized Dockerfile for a FastAPI app keeping final image size under 150MB.",
                "resources": [{"title": "Docker Docs", "url": "https://docs.docker.com/", "resource_type": "Documentation"}],
            },
        ],
    },
    "Java Developer": {
        "domain": "Backend",
        "description": "Develops robust enterprise services, transactional applications, and Spring microservices.",
        "skills": [
            {
                "name": "Java",
                "category": "Languages",
                "is_essential": True,
                "why_it_matters": "Strongly typed OOP language standard in enterprise finance, banking, and big tech systems.",
                "prerequisites": [],
                "estimated_duration": "3-4 weeks",
                "learning_stage": 1,
                "learning_objectives": ["OOP & interface design patterns", "Java Collections Framework & Streams API", "Concurrency & Multithreading"],
                "practice_exercise": "Build a multithreaded order processing queue simulating inventory allocation.",
                "resources": [{"title": "Oracle Java Tutorials", "url": "https://docs.oracle.com/javase/tutorial/", "resource_type": "Documentation"}],
            },
            {
                "name": "Spring Boot",
                "category": "Frameworks & Libraries",
                "is_essential": True,
                "why_it_matters": "Dominant Java framework for building cloud-native, production-grade microservices.",
                "prerequisites": ["Java"],
                "estimated_duration": "3 weeks",
                "learning_stage": 2,
                "learning_objectives": ["Dependency Injection & Inversion of Control", "Spring Data JPA & Hibernate", "Spring Security & JWT"],
                "practice_exercise": "Build an authenticated REST microservice with JPA entity relationships and pagination.",
                "resources": [{"title": "Spring Quickstart", "url": "https://spring.io/quickstart", "resource_type": "Guide"}],
            },
            {
                "name": "SQL",
                "category": "Languages",
                "is_essential": True,
                "why_it_matters": "Relational data querying and transactional manipulation for enterprise applications.",
                "prerequisites": [],
                "estimated_duration": "2 weeks",
                "learning_stage": 1,
                "learning_objectives": ["Relational schemas and constraints", "Transactions and rollback isolation", "Indexes and execution plans"],
                "practice_exercise": "Write queries managing bank account transfers with atomic transaction guarantees.",
                "resources": [{"title": "SQL Tutorial", "url": "https://www.w3schools.com/sql/", "resource_type": "Tutorial"}],
            },
            {
                "name": "PostgreSQL",
                "category": "Databases & Storage",
                "is_essential": True,
                "why_it_matters": "Standard open-source enterprise relational database used with Spring Data JPA.",
                "prerequisites": ["SQL"],
                "estimated_duration": "2 weeks",
                "learning_stage": 3,
                "learning_objectives": ["Connection pooling with HikariCP", "Database schema versioning with Flyway", "Hibernate query caching"],
                "practice_exercise": "Integrate Spring Data JPA with PostgreSQL and run automated Flyway migrations.",
                "resources": [{"title": "PostgreSQL Tutorial", "url": "https://www.postgresqltutorial.com/", "resource_type": "Tutorial"}],
            },
            {
                "name": "Docker",
                "category": "Cloud & DevOps",
                "is_essential": True,
                "why_it_matters": "Containerizes JVM runtimes for seamless cloud deployment.",
                "prerequisites": [],
                "estimated_duration": "1 week",
                "learning_stage": 3,
                "learning_objectives": ["Multi-stage build with Gradle/Maven", "JVM memory limit configuration inside containers", "Docker Compose"],
                "practice_exercise": "Containerize a Spring Boot application using multi-stage Maven build.",
                "resources": [{"title": "Spring Docker Guide", "url": "https://spring.io/guides/gs/spring-boot-docker/", "resource_type": "Guide"}],
            },
        ],
    },
    "Data Analyst": {
        "domain": "Data & Analytics",
        "description": "Transforms raw transactional data into actionable business intelligence, dashboards, and KPI metrics.",
        "skills": [
            {
                "name": "SQL",
                "category": "Languages",
                "is_essential": True,
                "why_it_matters": "Primary tool for querying relational databases, filtering cohorts, and computing business metrics.",
                "prerequisites": [],
                "estimated_duration": "3 weeks",
                "learning_stage": 1,
                "learning_objectives": ["Window functions (ROW_NUMBER, RANK, LEAD, LAG)", "Cohort retention & churn queries", "CTEs and query modularity"],
                "practice_exercise": "Calculate customer retention rates across monthly signup cohorts using window functions.",
                "resources": [{"title": "Mode Analytics SQL Tutorial", "url": "https://mode.com/sql-tutorial/", "resource_type": "Tutorial"}],
            },
            {
                "name": "Python",
                "category": "Languages",
                "is_essential": True,
                "why_it_matters": "Scripting language for data cleaning, statistical modeling, and programmatic analysis.",
                "prerequisites": [],
                "estimated_duration": "2 weeks",
                "learning_stage": 1,
                "learning_objectives": ["Basic syntax & data structures", "Handling missing values & data wrangling", "Automating report generation"],
                "practice_exercise": "Write a script cleaning dirty customer survey responses and outputting standardized summaries.",
                "resources": [{"title": "Python for Data Analysis", "url": "https://wesmckinney.com/book/", "resource_type": "Documentation"}],
            },
            {
                "name": "Pandas",
                "category": "Data & AI",
                "is_essential": True,
                "why_it_matters": "Industry standard library for data frame manipulation, merging, reshaping, and aggregations.",
                "prerequisites": ["Python"],
                "estimated_duration": "2-3 weeks",
                "learning_stage": 2,
                "learning_objectives": ["DataFrame indexing & filtering", "Merge, join, and concatenate datasets", "GroupBy aggregations and pivot tables"],
                "practice_exercise": "Analyze 500,000 retail sales transactions and compute monthly category growth rates.",
                "resources": [{"title": "Pandas Documentation", "url": "https://pandas.pydata.org/docs/", "resource_type": "Documentation"}],
            },
            {
                "name": "Tableau",
                "category": "Data & AI",
                "is_essential": False,
                "why_it_matters": "Visual dashboard creation enabling executive leadership to explore metrics intuitively.",
                "prerequisites": [],
                "estimated_duration": "2 weeks",
                "learning_stage": 3,
                "learning_objectives": ["Calculated fields & parameters", "Interactive filters & drilldowns", "Visual storytelling principles"],
                "practice_exercise": "Build an executive sales performance dashboard with dynamic region and quarter filters.",
                "resources": [{"title": "Tableau Free Training", "url": "https://www.tableau.com/learn/training", "resource_type": "Tutorial"}],
            },
            {
                "name": "Technical Communication",
                "category": "Professional Skills",
                "is_essential": True,
                "why_it_matters": "Translates complex numerical findings into crisp business recommendations for non-technical stakeholders.",
                "prerequisites": [],
                "estimated_duration": "1 week",
                "learning_stage": 4,
                "learning_objectives": ["Data storytelling techniques", "Executive memo synthesis", "Presenting data insights to stakeholders"],
                "practice_exercise": "Draft a 1-page executive brief summarizing why product churn increased last quarter.",
                "resources": [{"title": "Storytelling with Data", "url": "https://www.storytellingwithdata.com/", "resource_type": "Guide"}],
            },
        ],
    },
    "Data Scientist": {
        "domain": "AI / Machine Learning",
        "description": "Applies statistical modeling, exploratory data analysis, and predictive machine learning algorithms.",
        "skills": [
            {
                "name": "Python",
                "category": "Languages",
                "is_essential": True,
                "why_it_matters": "Ecosystem language for scientific computing, statistical experiments, and machine learning.",
                "prerequisites": [],
                "estimated_duration": "3 weeks",
                "learning_stage": 1,
                "learning_objectives": ["Vectorized computations", "Statistical modeling concepts", "Jupyter notebook workflows"],
                "practice_exercise": "Conduct an exploratory data analysis (EDA) notebook identifying key churn drivers.",
                "resources": [{"title": "Python Data Science Handbook", "url": "https://jakevdp.github.io/PythonDataScienceHandbook/", "resource_type": "Guide"}],
            },
            {
                "name": "Pandas",
                "category": "Data & AI",
                "is_essential": True,
                "why_it_matters": "Tabular data transformation, feature engineering, and outlier detection.",
                "prerequisites": ["Python"],
                "estimated_duration": "2 weeks",
                "learning_stage": 2,
                "learning_objectives": ["Feature engineering and one-hot encoding", "Imputation of missing features", "Time series resample & rolling averages"],
                "practice_exercise": "Engineer 5 predictive features from raw user clickstream event logs.",
                "resources": [{"title": "Pandas User Guide", "url": "https://pandas.pydata.org/docs/user_guide/", "resource_type": "Documentation"}],
            },
            {
                "name": "NumPy",
                "category": "Data & AI",
                "is_essential": True,
                "why_it_matters": "High-performance N-dimensional array manipulation and linear algebra foundations.",
                "prerequisites": ["Python"],
                "estimated_duration": "1 week",
                "learning_stage": 1,
                "learning_objectives": ["Array broadcasting & vectorization", "Matrix multiplication and transformations", "Random sampling and probability distributions"],
                "practice_exercise": "Implement linear regression gradient descent from scratch using only NumPy arrays.",
                "resources": [{"title": "NumPy Quickstart", "url": "https://numpy.org/doc/stable/user/quickstart.html", "resource_type": "Documentation"}],
            },
            {
                "name": "Scikit-Learn",
                "category": "Data & AI",
                "is_essential": True,
                "why_it_matters": "Standard library for classification, regression, clustering, and model validation pipelines.",
                "prerequisites": ["NumPy", "Pandas"],
                "estimated_duration": "3 weeks",
                "learning_stage": 3,
                "learning_objectives": ["Pipeline construction & cross-validation", "Hyperparameter grid search tuning", "ROC-AUC, Precision-Recall evaluation"],
                "practice_exercise": "Train and evaluate a Random Forest classifier predicting loan defaults with balanced recall.",
                "resources": [{"title": "Scikit-Learn Tutorials", "url": "https://scikit-learn.org/stable/tutorial/", "resource_type": "Documentation"}],
            },
            {
                "name": "SQL",
                "category": "Languages",
                "is_essential": True,
                "why_it_matters": "Extracting massive training datasets from data warehouses like Snowflake, BigQuery, and Postgres.",
                "prerequisites": [],
                "estimated_duration": "2 weeks",
                "learning_stage": 1,
                "learning_objectives": ["Complex aggregations and joins", "Window functions", "Sampling and cohort extraction"],
                "practice_exercise": "Write a query extracting labeled training records for machine learning model training.",
                "resources": [{"title": "SQL Tutorial", "url": "https://mode.com/sql-tutorial/", "resource_type": "Tutorial"}],
            },
        ],
    },
    "Machine Learning Engineer": {
        "domain": "AI / Machine Learning",
        "description": "Designs, trains, and deploys scalable machine learning models into real-time production environments.",
        "skills": [
            {
                "name": "Python",
                "category": "Languages",
                "is_essential": True,
                "why_it_matters": "Standard language for deep learning architectures and ML engineering pipelines.",
                "prerequisites": [],
                "estimated_duration": "3 weeks",
                "learning_stage": 1,
                "learning_objectives": ["Advanced Python paradigms", "Asynchronous data loaders", "GPU memory management"],
                "practice_exercise": "Write a custom asynchronous batch data preprocessor for image dataset streaming.",
                "resources": [{"title": "Python Docs", "url": "https://docs.python.org/3/", "resource_type": "Documentation"}],
            },
            {
                "name": "PyTorch",
                "category": "Data & AI",
                "is_essential": True,
                "why_it_matters": "Frontier deep learning framework for neural network training and model fine-tuning.",
                "prerequisites": ["Python", "NumPy"],
                "estimated_duration": "4 weeks",
                "learning_stage": 2,
                "learning_objectives": ["Tensors, Autograd, and Computation Graphs", "Custom Dataset & DataLoader pipelines", "Training loops, loss functions, and optimizers"],
                "practice_exercise": "Train a convolutional neural network (CNN) on CIFAR-10 with data augmentation.",
                "resources": [{"title": "PyTorch Deep Learning with PyTorch", "url": "https://pytorch.org/tutorials/", "resource_type": "Documentation"}],
            },
            {
                "name": "Transformers & LLMs",
                "category": "Data & AI",
                "is_essential": True,
                "why_it_matters": "Powers contemporary language modeling, fine-tuning (LoRA), and semantic search embeddings.",
                "prerequisites": ["PyTorch"],
                "estimated_duration": "3 weeks",
                "learning_stage": 3,
                "learning_objectives": ["Self-attention mechanisms", "Hugging Face transformers API", "Parameter-efficient fine-tuning (PEFT/LoRA)"],
                "practice_exercise": "Fine-tune a lightweight BERT classifier for domain-specific customer sentiment analysis.",
                "resources": [{"title": "Hugging Face NLP Course", "url": "https://huggingface.co/learn/nlp-course", "resource_type": "Course"}],
            },
            {
                "name": "Docker",
                "category": "Cloud & DevOps",
                "is_essential": True,
                "why_it_matters": "Packages models with CUDA runtimes and serving frameworks for cloud deployments.",
                "prerequisites": [],
                "estimated_duration": "1 week",
                "learning_stage": 3,
                "learning_objectives": ["NVIDIA GPU container runtimes", "Model checkpoint packaging", "Serving container optimization"],
                "practice_exercise": "Build a Docker container serving a PyTorch inference endpoint with FastAPI.",
                "resources": [{"title": "NVIDIA Container Toolkit", "url": "https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/index.html", "resource_type": "Documentation"}],
            },
            {
                "name": "FastAPI",
                "category": "Frameworks & Libraries",
                "is_essential": True,
                "why_it_matters": "Lightweight serving layer exposing low-latency model inference endpoints.",
                "prerequisites": ["Python"],
                "estimated_duration": "1-2 weeks",
                "learning_stage": 3,
                "learning_objectives": ["Batch prediction handling", "Async inference pipelines", "Health checks & latency monitoring"],
                "practice_exercise": "Build a real-time embedding generation API supporting batch requests.",
                "resources": [{"title": "FastAPI Docs", "url": "https://fastapi.tiangolo.com/", "resource_type": "Documentation"}],
            },
        ],
    },
    "AI Engineer": {
        "domain": "AI / Machine Learning",
        "description": "Integrates foundation models, prompt engineering, agentic workflows, and RAG architectures into software products.",
        "skills": [
            {
                "name": "Python",
                "category": "Languages",
                "is_essential": True,
                "why_it_matters": "Language powering modern LLM frameworks, vector indexing, and AI agent orchestrators.",
                "prerequisites": [],
                "estimated_duration": "2 weeks",
                "learning_stage": 1,
                "learning_objectives": ["API client scripting", "Pydantic structured output parsing", "Asynchronous stream handling"],
                "practice_exercise": "Build a streaming CLI assistant using function calling and structured JSON outputs.",
                "resources": [{"title": "Python Docs", "url": "https://docs.python.org/3/", "resource_type": "Documentation"}],
            },
            {
                "name": "Transformers & LLMs",
                "category": "Data & AI",
                "is_essential": True,
                "why_it_matters": "Core knowledge of frontier foundation models, tokens, context windows, and embeddings.",
                "prerequisites": ["Python"],
                "estimated_duration": "3 weeks",
                "learning_stage": 2,
                "learning_objectives": ["Retrieval-Augmented Generation (RAG) architecture", "Vector embeddings & chunking strategies", "Prompt engineering & system prompting"],
                "practice_exercise": "Build a RAG system searching a private document repository using semantic vector similarity.",
                "resources": [{"title": "LangChain Documentation", "url": "https://python.langchain.com/", "resource_type": "Documentation"}],
            },
            {
                "name": "FastAPI",
                "category": "Frameworks & Libraries",
                "is_essential": True,
                "why_it_matters": "Serves LLM generation streams, rate-limits API keys, and orchestrates agent workflows.",
                "prerequisites": ["Python"],
                "estimated_duration": "2 weeks",
                "learning_stage": 2,
                "learning_objectives": ["Server-sent events (SSE) streaming", "Token bucket rate limiting", "Async background task execution"],
                "practice_exercise": "Create an API streaming real-time token responses to a client interface.",
                "resources": [{"title": "FastAPI Docs", "url": "https://fastapi.tiangolo.com/", "resource_type": "Documentation"}],
            },
            {
                "name": "PostgreSQL",
                "category": "Databases & Storage",
                "is_essential": True,
                "why_it_matters": "Stores transactional application data alongside vector embeddings using pgvector extension.",
                "prerequisites": ["SQL"],
                "estimated_duration": "2 weeks",
                "learning_stage": 3,
                "learning_objectives": ["pgvector extension indexing (HNSW / IVFFlat)", "Hybrid keyword + vector search queries", "Embedding storage & distance metrics"],
                "practice_exercise": "Store 10,000 document embeddings in PostgreSQL and perform sub-10ms nearest neighbor queries.",
                "resources": [{"title": "pgvector GitHub", "url": "https://github.com/pgvector/pgvector", "resource_type": "Documentation"}],
            },
            {
                "name": "Docker",
                "category": "Cloud & DevOps",
                "is_essential": False,
                "why_it_matters": "Containerizes AI backend services, background workers, and vector databases for cloud hosting.",
                "prerequisites": [],
                "estimated_duration": "1 week",
                "learning_stage": 3,
                "learning_objectives": ["Multi-container compose", "Environment secrets management", "Cloud container deployments"],
                "practice_exercise": "Containerize an AI service with PostgreSQL + pgvector via Docker Compose.",
                "resources": [{"title": "Docker Docs", "url": "https://docs.docker.com/", "resource_type": "Documentation"}],
            },
        ],
    },
    "Cybersecurity Analyst": {
        "domain": "Security & Infrastructure",
        "description": "Protects networks, applications, and cloud environments from vulnerabilities and cyber threats.",
        "skills": [
            {
                "name": "Linux System Administration",
                "category": "Cloud & DevOps",
                "is_essential": True,
                "why_it_matters": "Understanding operating system permissions, log analysis, processes, and network interfaces.",
                "prerequisites": [],
                "estimated_duration": "2 weeks",
                "learning_stage": 1,
                "learning_objectives": ["File permissions, chmod/chown, and sudoers", "Systemd services and process monitoring", "Syslog & auth.log forensic auditing"],
                "practice_exercise": "Configure a hardened Linux server disabling root SSH, setting up UFW firewalls and fail2ban.",
                "resources": [{"title": "Linux Journey", "url": "https://linuxjourney.com/", "resource_type": "Tutorial"}],
            },
            {
                "name": "Network Security & Protocols",
                "category": "Security & Systems",
                "is_essential": True,
                "why_it_matters": "Deep knowledge of TCP/IP handshakes, DNS, TLS certificates, routing, and packet filtering.",
                "prerequisites": [],
                "estimated_duration": "2 weeks",
                "learning_stage": 1,
                "learning_objectives": ["OSI & TCP/IP stack layers", "Wireshark packet inspection and capture", "Firewalls, NAT, and VPN protocols"],
                "practice_exercise": "Capture and analyze suspicious network traffic in Wireshark identifying port scans.",
                "resources": [{"title": "Professor Messer Security+", "url": "https://www.professormesser.com/", "resource_type": "Course"}],
            },
            {
                "name": "OWASP Top 10 Security",
                "category": "Security & Systems",
                "is_essential": True,
                "why_it_matters": "Knowledge of the most critical web application security risks (SQLi, XSS, CSRF, broken auth).",
                "prerequisites": ["Network Security & Protocols"],
                "estimated_duration": "3 weeks",
                "learning_stage": 2,
                "learning_objectives": ["SQL injection prevention & parameterization", "Cross-site scripting (XSS) mitigation & CSP", "Broken object level authorization (BOLA) testing"],
                "practice_exercise": "Audit a vulnerable demo web application and patch 3 critical OWASP vulnerabilities.",
                "resources": [{"title": "OWASP Top 10 Project", "url": "https://owasp.org/www-project-top-ten/", "resource_type": "Documentation"}],
            },
            {
                "name": "Python",
                "category": "Languages",
                "is_essential": True,
                "why_it_matters": "Scripting security audits, parsing log events, and automating vulnerability scanners.",
                "prerequisites": [],
                "estimated_duration": "2 weeks",
                "learning_stage": 2,
                "learning_objectives": ["Socket programming & port scanning scripts", "Log parsing with regular expressions", "Automating API security checks"],
                "practice_exercise": "Write a Python script monitoring server access logs and alerting on brute-force login attempts.",
                "resources": [{"title": "Violent Python Guide", "url": "https://docs.python.org/3/", "resource_type": "Documentation"}],
            },
        ],
    },
    "DevOps Engineer": {
        "domain": "Cloud & DevOps",
        "description": "Automates continuous integration, infrastructure as code, container clusters, and site reliability.",
        "skills": [
            {
                "name": "Linux System Administration",
                "category": "Cloud & DevOps",
                "is_essential": True,
                "why_it_matters": "Foundational operating system environment for all production servers and cloud instances.",
                "prerequisites": [],
                "estimated_duration": "2 weeks",
                "learning_stage": 1,
                "learning_objectives": ["Shell scripting and pipes", "Kernel tuning and networking tools", "Systemd and journalctl diagnostics"],
                "practice_exercise": "Write an automated bash script performing daily database backups with rotation.",
                "resources": [{"title": "Linux Journey", "url": "https://linuxjourney.com/", "resource_type": "Tutorial"}],
            },
            {
                "name": "Docker",
                "category": "Cloud & DevOps",
                "is_essential": True,
                "why_it_matters": "Core container standard isolating application processes across staging and production.",
                "prerequisites": ["Linux System Administration"],
                "estimated_duration": "2 weeks",
                "learning_stage": 2,
                "learning_objectives": ["Dockerfile layer caching", "Non-root security hardening", "Container networking and volumes"],
                "practice_exercise": "Create minimal, zero-vulnerability Docker images using distroless or alpine bases.",
                "resources": [{"title": "Docker Docs", "url": "https://docs.docker.com/", "resource_type": "Documentation"}],
            },
            {
                "name": "Kubernetes",
                "category": "Cloud & DevOps",
                "is_essential": True,
                "why_it_matters": "Orchestrates container deployment, self-healing, rolling updates, and horizontal autoscaling.",
                "prerequisites": ["Docker"],
                "estimated_duration": "3-4 weeks",
                "learning_stage": 3,
                "learning_objectives": ["Pods, Deployments, and Services", "ConfigMaps, Secrets, and Ingress controllers", "Horizontal Pod Autoscaling (HPA)"],
                "practice_exercise": "Deploy a multi-replica web service with zero-downtime rolling updates in Minikube.",
                "resources": [{"title": "Kubernetes Official Tutorials", "url": "https://kubernetes.io/docs/tutorials/", "resource_type": "Documentation"}],
            },
            {
                "name": "CI/CD Pipelines",
                "category": "Cloud & DevOps",
                "is_essential": True,
                "why_it_matters": "Automates linting, test execution, container builds, and deployment verification.",
                "prerequisites": ["Git Version Control", "Docker"],
                "estimated_duration": "2 weeks",
                "learning_stage": 2,
                "learning_objectives": ["GitHub Actions workflow syntax", "Automated test and build matrix", "Deployment stages with manual approval gates"],
                "practice_exercise": "Build a GitHub Actions workflow that runs pytest, builds a Docker image, and tags a release.",
                "resources": [{"title": "GitHub Actions Documentation", "url": "https://docs.github.com/en/actions", "resource_type": "Documentation"}],
            },
            {
                "name": "Terraform",
                "category": "Cloud & DevOps",
                "is_essential": True,
                "why_it_matters": "Infrastructure-as-Code (IaC) tool standardizing cloud provisioning declaratively.",
                "prerequisites": [],
                "estimated_duration": "2 weeks",
                "learning_stage": 3,
                "learning_objectives": ["HCL syntax, variables, and outputs", "State management & remote backends", "Reusable cloud infrastructure modules"],
                "practice_exercise": "Write Terraform modules provisioning a VPC with public/private subnets and cloud instances.",
                "resources": [{"title": "Terraform Tutorials", "url": "https://developer.hashicorp.com/terraform/tutorials", "resource_type": "Documentation"}],
            },
            {
                "name": "AWS",
                "category": "Cloud & DevOps",
                "is_essential": False,
                "why_it_matters": "Leading enterprise cloud provider offering scalable compute, storage, and networking primitives.",
                "prerequisites": ["Linux System Administration"],
                "estimated_duration": "3 weeks",
                "learning_stage": 3,
                "learning_objectives": ["EC2, ECS, and S3 architectures", "IAM security policies & roles", "VPC routing, security groups, and Route 53"],
                "practice_exercise": "Host a containerized web application behind an Application Load Balancer with SSL.",
                "resources": [{"title": "AWS Skill Builder", "url": "https://explore.skillbuilder.aws/", "resource_type": "Course"}],
            },
        ],
    },
    "Cloud Engineer": {
        "domain": "Cloud & DevOps",
        "description": "Designs and operates secure, highly available cloud infrastructures across AWS, Azure, and GCP.",
        "skills": [
            {
                "name": "AWS",
                "category": "Cloud & DevOps",
                "is_essential": True,
                "why_it_matters": "Premier cloud computing platform hosting millions of modern internet workloads.",
                "prerequisites": [],
                "estimated_duration": "3-4 weeks",
                "learning_stage": 1,
                "learning_objectives": ["EC2, Lambda, S3, RDS primitives", "IAM least-privilege security", "VPC subnets, NAT gateways, and routing"],
                "practice_exercise": "Deploy a serverless REST API using AWS Lambda, API Gateway, and DynamoDB.",
                "resources": [{"title": "AWS Free Tier & Guides", "url": "https://aws.amazon.com/free/", "resource_type": "Documentation"}],
            },
            {
                "name": "Terraform",
                "category": "Cloud & DevOps",
                "is_essential": True,
                "why_it_matters": "Declarative Infrastructure as Code for reliable multi-cloud environment replication.",
                "prerequisites": [],
                "estimated_duration": "2 weeks",
                "learning_stage": 2,
                "learning_objectives": ["State locking with DynamoDB/S3", "Resource dependency graphs", "Cloud security compliance automation"],
                "practice_exercise": "Write IaC templates creating an auto-scaling group with health check alarms.",
                "resources": [{"title": "HashiCorp Learn", "url": "https://developer.hashicorp.com/terraform", "resource_type": "Documentation"}],
            },
            {
                "name": "Docker",
                "category": "Cloud & DevOps",
                "is_essential": True,
                "why_it_matters": "Package services into cloud-portable images deployed to ECS, EKS, or Cloud Run.",
                "prerequisites": [],
                "estimated_duration": "1-2 weeks",
                "learning_stage": 2,
                "learning_objectives": ["Multi-stage builds", "Container registries (ECR)", "Task definitions & secrets injection"],
                "practice_exercise": "Publish a container to AWS ECR and deploy it to AWS ECS Fargate.",
                "resources": [{"title": "Docker Guides", "url": "https://docs.docker.com/", "resource_type": "Documentation"}],
            },
            {
                "name": "Linux System Administration",
                "category": "Cloud & DevOps",
                "is_essential": True,
                "why_it_matters": "Operating system underlying virtual machines and cloud compute instances.",
                "prerequisites": [],
                "estimated_duration": "2 weeks",
                "learning_stage": 1,
                "learning_objectives": ["SSH key authentication & bastion hosts", "Storage volumes (EBS) mounting & formatting", "System metrics (top, iostat, netstat)"],
                "practice_exercise": "Configure an automated CloudWatch alarm alerting when instance CPU exceeds 80%.",
                "resources": [{"title": "Linux Journey", "url": "https://linuxjourney.com/", "resource_type": "Tutorial"}],
            },
        ],
    },
    "Software Engineer": {
        "domain": "Software Engineering",
        "description": "Generalist software engineer mastering computer science algorithms, systems design, and production code.",
        "skills": [
            {
                "name": "Python",
                "category": "Languages",
                "is_essential": True,
                "why_it_matters": "Versatile programming language for writing algorithms, tools, backend logic, and automated tests.",
                "prerequisites": [],
                "estimated_duration": "3 weeks",
                "learning_stage": 1,
                "learning_objectives": ["Data structures (lists, dicts, heaps, graphs)", "Algorithm complexity (Big-O analysis)", "Object-oriented design patterns"],
                "practice_exercise": "Implement an LRU cache data structure with O(1) get and put operations.",
                "resources": [{"title": "Python Docs", "url": "https://docs.python.org/3/", "resource_type": "Documentation"}],
            },
            {
                "name": "SQL",
                "category": "Languages",
                "is_essential": True,
                "why_it_matters": "Essential language for querying and structuring database records.",
                "prerequisites": [],
                "estimated_duration": "2 weeks",
                "learning_stage": 1,
                "learning_objectives": ["Relational schemas and primary keys", "Joins, grouping, and aggregations", "Transactions and indexing"],
                "practice_exercise": "Write SQL queries solving common interview aggregation and deduplication problems.",
                "resources": [{"title": "SQLBolt", "url": "https://sqlbolt.com/", "resource_type": "Tutorial"}],
            },
            {
                "name": "Git Version Control",
                "category": "Tools & Testing",
                "is_essential": True,
                "why_it_matters": "Foundational version control system for all modern software engineering teams.",
                "prerequisites": [],
                "estimated_duration": "1 week",
                "learning_stage": 1,
                "learning_objectives": ["Branching strategies (Git flow)", "Commit hygiene & rebase workflows", "Resolving merge conflicts"],
                "practice_exercise": "Create a release branch with git tags and changelog generation.",
                "resources": [{"title": "Git SCM", "url": "https://git-scm.com/", "resource_type": "Documentation"}],
            },
            {
                "name": "RESTful APIs",
                "category": "Architecture & APIs",
                "is_essential": True,
                "why_it_matters": "Connecting client applications with backend services via robust contracts.",
                "prerequisites": [],
                "estimated_duration": "1-2 weeks",
                "learning_stage": 2,
                "learning_objectives": ["HTTP protocol fundamentals", "JSON serialization & validation", "Authentication & status codes"],
                "practice_exercise": "Build a modular REST API with comprehensive error handling and documentation.",
                "resources": [{"title": "REST API Tutorial", "url": "https://restfulapi.net/", "resource_type": "Tutorial"}],
            },
            {
                "name": "Docker",
                "category": "Cloud & DevOps",
                "is_essential": False,
                "why_it_matters": "Standard application containerization tool for local testing and cloud deployments.",
                "prerequisites": [],
                "estimated_duration": "1 week",
                "learning_stage": 3,
                "learning_objectives": ["Dockerfiles and images", "Volume mounting for local dev", "Docker Compose"],
                "practice_exercise": "Containerize a full-stack application and run it with a single command.",
                "resources": [{"title": "Docker Getting Started", "url": "https://docs.docker.com/get-started/", "resource_type": "Documentation"}],
            },
            {
                "name": "Unit & Integration Testing",
                "category": "Tools & Testing",
                "is_essential": True,
                "why_it_matters": "Ensures software correctness, prevents regressions, and enables confident refactoring.",
                "prerequisites": [],
                "estimated_duration": "1 week",
                "learning_stage": 2,
                "learning_objectives": ["Test-Driven Development (TDD) concepts", "Mocks, stubs, and test fixtures", "Automated CI test execution"],
                "practice_exercise": "Write comprehensive unit tests achieving 85%+ code coverage for a business rules engine.",
                "resources": [{"title": "Martin Fowler on Testing", "url": "https://martinfowler.com/testing/", "resource_type": "Guide"}],
            },
        ],
    },
}


def calculate_suggested_roles_for_skills(skill_names: List[str]) -> List[Dict[str, Any]]:
    """
    Given a list of skill names (extracted from resume or confirmed on profile),
    evaluates deterministic alignment against all 13 curated engineering roles.
    Returns ranked role fit recommendations with match percentages, matched skills,
    missing essential competencies, and fit levels.
    """
    # Build set of normalized aliases and canonical names for flexible lookup
    normalized_inputs = set()
    for s in skill_names:
        if s and isinstance(s, str) and s.strip():
            raw_clean = s.strip().lower()
            normalized_inputs.add(raw_clean)
            c_name, _ = normalize_skill_name(s.strip())
            normalized_inputs.add(c_name.strip().lower())

    suggestions = []

    for role_title, role_data in CURATED_ROLES.items():
        curated_skills = role_data.get("skills", [])
        domain = role_data.get("domain", "Engineering")

        matched_skills = []
        missing_essential_skills = []
        total_weight = 0
        matched_weight = 0

        for s_meta in curated_skills:
            s_name = s_meta["name"]
            s_norm = s_name.strip().lower()
            c_name, _ = normalize_skill_name(s_name)
            c_norm = c_name.strip().lower()

            is_essential = s_meta.get("is_essential", True)
            weight = 15 if is_essential else 10
            total_weight += weight

            # Check if skill matches any user extracted skill
            if s_norm in normalized_inputs or c_norm in normalized_inputs:
                matched_skills.append(s_name)
                matched_weight += weight
            else:
                if is_essential:
                    missing_essential_skills.append(s_name)

        total_role_skills = len(curated_skills)
        match_percentage = round((matched_weight / max(total_weight, 1)) * 100, 1) if total_weight > 0 else 0.0

        if match_percentage >= 60.0:
            fit_level = "Strong Match"
        elif match_percentage >= 35.0:
            fit_level = "Good Fit"
        elif match_percentage >= 15.0:
            fit_level = "Moderate Fit"
        else:
            fit_level = "Developing"

        top_matched_display = ", ".join(matched_skills[:3]) if matched_skills else ""
        if top_matched_display:
            why_rec = f"Your extracted skills ({top_matched_display}) match {match_percentage}% of {role_title} requirements."
        else:
            why_rec = f"Entry-level pathway for {role_title} ({domain})."

        suggestions.append({
            "role_title": role_title,
            "domain": domain,
            "match_percentage": match_percentage,
            "matched_skills_count": len(matched_skills),
            "total_role_skills": total_role_skills,
            "matched_skills": matched_skills,
            "missing_essential_skills": missing_essential_skills,
            "fit_level": fit_level,
            "is_recommended": False,
            "why_recommended": why_rec,
        })

    # Sort descending by match percentage, then matched skills count
    suggestions.sort(key=lambda x: (x["match_percentage"], x["matched_skills_count"]), reverse=True)

    # Flag top matches as recommended
    if suggestions:
        highest = suggestions[0]["match_percentage"]
        for idx, item in enumerate(suggestions):
            if idx == 0 and item["match_percentage"] > 0:
                item["is_recommended"] = True
                item["why_recommended"] = f"Top Recommended Role: highest alignment ({item['match_percentage']}%) based on your resume skills."
            elif item["match_percentage"] >= 50.0 and item["match_percentage"] >= (highest - 15.0):
                item["is_recommended"] = True

    return suggestions


# ==============================================================================
# 4. SKILL GAP & RECOMMENDATION ENGINE
# ==============================================================================

async def analyze_role_skill_gap(
    db: AsyncSession,
    user_id: Any,
    target_role: str,
    experience_level: str = "Student / Entry Level",
) -> Dict[str, Any]:
    """
    Performs deterministic skill-gap analysis comparing authenticated student's confirmed
    skills against requirements of their selected target role.

    Priority order for role requirements:
    1. Actual active job descriptions in the platform matching the role or domain.
    2. Curated role-to-skill mappings stored in CURATED_ROLES.
    """
    # 1. Fetch user's confirmed skills from DB
    stmt_skills = select(StudentSkill).where(StudentSkill.user_id == user_id, StudentSkill.is_confirmed == True)
    user_skill_records = (await db.scalars(stmt_skills)).all()
    user_skill_map = {s.normalized_name: s for s in user_skill_records}

    # 2. Resolve Role Configuration
    role_info = CURATED_ROLES.get(target_role)
    if not role_info:
        # Fallback to Software Engineer if custom role not in curated list
        role_info = CURATED_ROLES["Software Engineer"]

    role_domain = role_info.get("domain", "Software Engineering")
    curated_skills = role_info.get("skills", [])

    # 3. Query real Platform Jobs for live market demand frequency
    job_stmt = select(Job).where(
        Job.is_active == True,
        or_(
            Job.domain.ilike(f"%{role_domain}%"),
            Job.title.ilike(f"%{target_role}%"),
        ),
    )
    matching_jobs = (await db.scalars(job_stmt)).all()
    total_matching_jobs = len(matching_jobs)

    job_skill_freq: Dict[str, int] = {}
    if total_matching_jobs > 0:
        for job in matching_jobs:
            req_skills = job.skills_required or []
            if isinstance(req_skills, list):
                for s in req_skills:
                    c_name, _ = normalize_skill_name(str(s))
                    job_skill_freq[c_name.lower()] = job_skill_freq.get(c_name.lower(), 0) + 1

    data_sources_used = []
    if total_matching_jobs > 0:
        data_sources_used.append(f"Live Platform Job Catalog ({total_matching_jobs} active matching positions in {role_domain})")
    data_sources_used.append(f"Curated Industry Competency Matrix for {target_role}")

    # 4. Compare role skills with confirmed user skills
    matched_skills = []
    missing_skills = []
    total_essential = 0
    matched_essential = 0
    total_weight = 0
    matched_weight = 0

    for idx, skill_meta in enumerate(curated_skills, start=1):
        s_name = skill_meta["name"]
        s_norm = s_name.strip().lower()
        is_essential = skill_meta.get("is_essential", True)
        weight = 15 if is_essential else 10
        total_weight += weight
        if is_essential:
            total_essential += 1

        freq_pct = 0.0
        if total_matching_jobs > 0:
            freq_pct = round((job_skill_freq.get(s_norm, 0) / total_matching_jobs) * 100, 1)

        user_skill = user_skill_map.get(s_norm)
        if user_skill:
            matched_weight += weight
            if user_skill.source == "verified":
                ev_status = "Demonstrated"
            elif user_skill.source == "resume":
                ev_status = "Demonstrated"
            elif user_skill.is_confirmed:
                ev_status = "Student Confirmed"
            else:
                ev_status = "Needs Confirmation"

            matched_skills.append({
                "name": s_name,
                "category": skill_meta.get("category", "Technical Skills"),
                "is_essential": is_essential,
                "why_it_matters": skill_meta.get("why_it_matters", ""),
                "prerequisites": skill_meta.get("prerequisites", []),
                "current_status": user_skill.status,
                "evidence_status": ev_status,
                "weight": weight,
                "job_frequency_percentage": freq_pct if total_matching_jobs > 0 else None,
                "learning_order": idx,
            })
            if is_essential:
                matched_essential += 1
        else:
            missing_skills.append({
                "name": s_name,
                "category": skill_meta.get("category", "Technical Skills"),
                "is_essential": is_essential,
                "why_it_matters": skill_meta.get("why_it_matters", ""),
                "prerequisites": skill_meta.get("prerequisites", []),
                "current_status": SkillStatus.NOT_STARTED.value,
                "evidence_status": "Not Detected",
                "weight": weight,
                "job_frequency_percentage": freq_pct if total_matching_jobs > 0 else None,
                "learning_order": idx,
            })

    total_role_skills = len(curated_skills)
    coverage_pct = round((matched_weight / max(total_weight, 1)) * 100, 1)
    essential_coverage_pct = round((matched_essential / max(total_essential, 1)) * 100, 1)

    # Read previous evaluation snapshot from preferences if available
    stmt_target_role = select(StudentTargetRole).where(StudentTargetRole.user_id == user_id)
    pref_row = (await db.scalars(stmt_target_role)).first()
    prev_match = None
    last_reassessed = None
    if pref_row and pref_row.preferences:
        prev_match = pref_row.preferences.get("previous_match_percentage")
        last_str = pref_row.preferences.get("last_reassessed_at")
        if last_str:
            try:
                last_reassessed = datetime.fromisoformat(last_str)
            except Exception:
                pass

    return {
        "target_role": target_role,
        "experience_level": experience_level,
        "total_role_skills": total_role_skills,
        "matched_skills_count": len(matched_skills),
        "missing_skills_count": len(missing_skills),
        "coverage_percentage": coverage_pct,
        "essential_coverage_percentage": essential_coverage_pct,
        "previous_coverage_percentage": prev_match,
        "last_reassessed_at": last_reassessed,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "data_sources_used": data_sources_used,
        "evaluation_formula": "Role Match (%) = (Sum of weights for matched evaluated requirements / Sum of weights for evaluated requirements) × 100",
        "disclaimer": "Role match percentage reflects evaluated technical skills and does not represent a guarantee of employment.",
    }


async def generate_skill_recommendations(
    db: AsyncSession,
    user_id: Any,
    target_role: str,
    experience_level: str = "Student / Entry Level",
) -> Dict[str, Any]:
    """
    Generates personalized prioritized skill recommendations with transparent,
    documented scoring weights:
    - Demand in relevant jobs: 40%
    - Essential requirement status: 35%
    - Skill gap / development status: 25%
    """
    # 1. Fetch user's confirmed skills
    stmt_skills = select(StudentSkill).where(StudentSkill.user_id == user_id, StudentSkill.is_confirmed == True)
    user_skills = (await db.scalars(stmt_skills)).all()
    user_skill_map = {s.normalized_name: s for s in user_skills}

    # 2. Get role taxonomy
    role_info = CURATED_ROLES.get(target_role) or CURATED_ROLES["Software Engineer"]
    role_domain = role_info.get("domain", "Software Engineering")
    skills_catalog = role_info.get("skills", [])

    # 3. Query matching active jobs
    job_stmt = select(Job).where(
        Job.is_active == True,
        or_(
            Job.domain.ilike(f"%{role_domain}%"),
            Job.title.ilike(f"%{target_role}%"),
        ),
    )
    matching_jobs = (await db.scalars(job_stmt)).all()
    total_matching_jobs = len(matching_jobs)

    job_skill_freq: Dict[str, int] = {}
    if total_matching_jobs > 0:
        for j in matching_jobs:
            req_skills = j.skills_required or []
            if isinstance(req_skills, list):
                for s in req_skills:
                    c_name, _ = normalize_skill_name(str(s))
                    job_skill_freq[c_name.lower()] = job_skill_freq.get(c_name.lower(), 0) + 1

    # 4. Fetch published platform projects for suggestion linking
    stmt_proj = select(Project).where(Project.status == "Published").order_by(desc(Project.stars_count))
    published_projects = (await db.scalars(stmt_proj)).all()

    # 5. Fetch student resource progress map
    stmt_pref = select(StudentTargetRole).where(StudentTargetRole.user_id == user_id)
    target_role_rec = (await db.scalars(stmt_pref)).first()
    res_prog_map = (target_role_rec.preferences or {}).get("resource_progress", {}) if target_role_rec else {}

    items = []
    high_count = 0
    med_count = 0
    low_count = 0

    for skill in skills_catalog:
        name = skill["name"]
        norm = name.strip().lower()
        is_essential = skill.get("is_essential", True)
        user_record = user_skill_map.get(norm)
        status = user_record.status if user_record else SkillStatus.NOT_STARTED.value

        # A. Job Demand Score (0 to 100)
        if total_matching_jobs > 0:
            job_demand_score = (job_skill_freq.get(norm, 0) / total_matching_jobs) * 100
        else:
            job_demand_score = 90 if is_essential else 50

        # B. Essentiality Score (0 to 100)
        essential_score = 100 if is_essential else 50

        # C. Gap / Development Status Score (0 to 100)
        if status == SkillStatus.NOT_STARTED.value:
            gap_score = 100
        elif status == SkillStatus.LEARNING.value:
            gap_score = 65
        elif status == SkillStatus.PRACTICED.value:
            gap_score = 35
        else:  # Completed
            gap_score = 10

        # Combined transparent weighted priority score:
        # Weights: 40% Job Demand, 35% Essential Role Requirement, 25% Gap Need
        priority_score = int(round(
            (job_demand_score * 0.40) +
            (essential_score * 0.35) +
            (gap_score * 0.25)
        ))
        priority_score = max(5, min(100, priority_score))

        if priority_score >= 70:
            priority = "High"
            high_count += 1
        elif priority_score >= 45:
            priority = "Medium"
            med_count += 1
        else:
            priority = "Low"
            low_count += 1

        # Match practical platform project if available
        matched_proj = None
        for p in published_projects:
            stack = [s.lower() for s in (p.tech_stack or [])]
            if norm in stack or any(norm in s for s in stack) or (name.lower() in (p.title.lower() + " " + p.short_description.lower())):
                matched_proj = {
                    "id": str(p.id),
                    "title": p.title,
                    "slug": p.slug,
                    "short_description": p.short_description,
                    "difficulty": p.difficulty,
                    "tech_stack": p.tech_stack or [],
                    "teaches_skills": [name],
                    "relevance_reason": f"Builds hands-on verified competency in {name} through real codebase architecture.",
                    "cover_image_url": p.cover_image_url,
                }
                break

        relevance_str = "Essential Core Requirement" if is_essential else "High-Value Industry Complement"
        reason = skill.get("why_it_matters", f"Key skill for professional {target_role} positions.")
        if status == SkillStatus.NOT_STARTED.value:
            reason = f"Missing skill gap: {reason}"
        elif status == SkillStatus.LEARNING.value:
            reason = f"In progress: Continue advancing from practice exercises to flagship projects."
        elif status == SkillStatus.PRACTICED.value:
            reason = f"Practiced: Apply in a showcase project to reach verified completion."

        # Decorate resources with student progress
        raw_resources = skill.get("resources", [])
        decorated_resources = []
        for r in raw_resources:
            r_dict = dict(r)
            url = r_dict.get("url", "")
            r_dict["status"] = res_prog_map.get(url, {}).get("status", "not_started")
            decorated_resources.append(r_dict)

        items.append({
            "skill_name": name,
            "category": skill.get("category", "Technical Skills"),
            "current_status": status,
            "priority": priority,
            "priority_score": priority_score,
            "reason": reason,
            "relevance": relevance_str,
            "is_essential": is_essential,
            "prerequisites": skill.get("prerequisites", []),
            "estimated_duration": skill.get("estimated_duration", "2 weeks"),
            "learning_stage": skill.get("learning_stage", 1),
            "learning_objectives": skill.get("learning_objectives", []),
            "resources": decorated_resources,
            "practice_exercise": skill.get("practice_exercise"),
            "related_project": matched_proj,
        })

    # Sort items: High priority first, then descending priority_score
    items.sort(key=lambda x: (x["priority_score"]), reverse=True)

    scoring_weights_explanation = {
        "job_market_demand_weight": "40% (Derived from actual matching jobs in the platform)",
        "role_essentiality_weight": "35% (Core requirement vs optional specialization)",
        "skill_gap_need_weight": "25% (Not Started = 100%, Learning = 65%, Practiced = 35%, Completed = 10%)",
        "priority_thresholds": "High: >= 70, Medium: 45-69, Low: < 45",
    }

    return {
        "target_role": target_role,
        "total_recommendations": len(items),
        "high_priority_count": high_count,
        "medium_priority_count": med_count,
        "low_priority_count": low_count,
        "items": items,
        "scoring_weights_explanation": scoring_weights_explanation,
    }


async def generate_learning_roadmap(
    db: AsyncSession,
    user_id: Any,
    target_role: str,
    experience_level: str = "Student / Entry Level",
) -> Dict[str, Any]:
    """
    Constructs an ordered, staged learning roadmap arranging prerequisites before
    advanced skills, with objectives, exercises, and authentic student progress tracking.
    """
    rec_result = await generate_skill_recommendations(db, user_id, target_role, experience_level)
    items = rec_result["items"]

    stage_definitions = [
        {
            "stage_number": 1,
            "stage_title": "Stage 1: Core Fundamentals & Prerequisite Tools",
            "stage_description": "Master essential programming syntax, version control, and core runtime concepts required before touching frameworks.",
        },
        {
            "stage_number": 2,
            "stage_title": "Stage 2: Modern Frameworks & API Architecture",
            "stage_description": "Build interactive, component-driven UI views or modular server endpoints adhering to industry standards.",
        },
        {
            "stage_number": 3,
            "stage_title": "Stage 3: Data Systems, Storage & Infrastructure",
            "stage_description": "Integrate relational databases, in-memory caching, multi-stage containerization, and data layers.",
        },
        {
            "stage_number": 4,
            "stage_title": "Stage 4: Production Engineering, Testing & Capstones",
            "stage_description": "Harden software with automated test coverage, CI/CD pipelines, system design scalability, and portfolio showcase code.",
        },
    ]

    stages = []
    overall_completed = 0
    overall_total = len(items)

    for s_def in stage_definitions:
        s_num = s_def["stage_number"]
        # Find skills belonging to this stage
        stage_skills = [item for item in items if item.get("learning_stage", 1) == s_num]

        # Topological sorting within stage: items without prerequisites in this stage come first
        def sort_key(item):
            has_prereqs = len(item.get("prerequisites", [])) > 0
            is_completed = item.get("current_status") == SkillStatus.COMPLETED.value
            return (1 if is_completed else 0, 1 if has_prereqs else 0, -item.get("priority_score", 0))

        stage_skills.sort(key=sort_key)

        completed_in_stage = sum(1 for item in stage_skills if item.get("current_status") == SkillStatus.COMPLETED.value)
        overall_completed += completed_in_stage

        # Calculate estimated stage duration
        durations = [item.get("estimated_duration", "2 weeks") for item in stage_skills]
        total_weeks = 0
        for d in durations:
            m = re.search(r"(\d+)", d)
            if m:
                total_weeks += int(m.group(1))
            else:
                total_weeks += 2

        stages.append({
            "stage_number": s_num,
            "stage_title": s_def["stage_title"],
            "stage_description": s_def["stage_description"],
            "skills": stage_skills,
            "completed_count": completed_in_stage,
            "total_count": len(stage_skills),
            "estimated_stage_duration": f"~{max(total_weeks, 2)} weeks",
        })

    progress_pct = round((overall_completed / max(overall_total, 1)) * 100, 1)

    return {
        "target_role": target_role,
        "stages": stages,
        "overall_completed_count": overall_completed,
        "overall_total_skills": overall_total,
        "overall_progress_percentage": progress_pct,
    }


async def get_dashboard_skill_summary(
    db: AsyncSession,
    user_id: Any,
) -> Dict[str, Any]:
    """
    Computes dashboard summary card data from real student records in the database.
    """
    # 1. Fetch user's target role preference
    stmt_role = select(StudentTargetRole).where(StudentTargetRole.user_id == user_id)
    pref = (await db.scalars(stmt_role)).first()

    if not pref:
        # Student has not set a target role yet
        return {
            "has_target_role": False,
            "target_role": None,
            "experience_level": None,
            "recommended_skills_count": 0,
            "top_recommendations": [],
            "progress_summary": {"completed": 0, "learning": 0, "practiced": 0, "not_started": 0, "total": 0},
            "completion_percentage": 0.0,
            "has_skills_confirmed": False,
        }

    # 2. Check confirmed skills
    stmt_skills = select(StudentSkill).where(StudentSkill.user_id == user_id, StudentSkill.is_confirmed == True)
    skills = (await db.scalars(stmt_skills)).all()
    has_skills = len(skills) > 0

    # 3. Generate recommendations
    recs = await generate_skill_recommendations(db, user_id, pref.target_role, pref.experience_level)
    items = recs["items"]

    # Filter top 3 prioritized recommendations that are not yet Completed
    actionable_recs = [item for item in items if item["current_status"] != SkillStatus.COMPLETED.value]
    if len(actionable_recs) < 3:
        # Include completed if all are completed
        top_recs = items[:3]
    else:
        top_recs = actionable_recs[:3]

    # Calculate real progress counts
    prog_counts = {
        "completed": sum(1 for s in items if s["current_status"] == SkillStatus.COMPLETED.value),
        "practiced": sum(1 for s in items if s["current_status"] == SkillStatus.PRACTICED.value),
        "learning": sum(1 for s in items if s["current_status"] == SkillStatus.LEARNING.value),
        "not_started": sum(1 for s in items if s["current_status"] == SkillStatus.NOT_STARTED.value),
        "total": len(items),
    }

    completion_pct = round((prog_counts["completed"] / max(prog_counts["total"], 1)) * 100, 1)

    return {
        "has_target_role": True,
        "target_role": pref.target_role,
        "experience_level": pref.experience_level,
        "recommended_skills_count": len(items),
        "top_recommendations": top_recs,
        "progress_summary": prog_counts,
        "completion_percentage": completion_pct,
        "has_skills_confirmed": has_skills,
    }


async def generate_ai_skill_advice(
    target_role: str,
    experience_level: str,
    confirmed_skills: List[str],
    missing_skills: List[str],
    custom_question: Optional[str] = None,
) -> Dict[str, str]:
    """
    Calls Google Gemini AI to provide structured mentor advice grounded in the student's actual gaps,
    with automatic graceful fallback if Gemini API is unconfigured or encounters an error.
    """
    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip():
        try:
            model = settings.GEMINI_MODEL or "gemini-1.5-pro"
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={settings.GEMINI_API_KEY}"

            prompt = (
                f"You are a principal software engineering mentor on CareerPlatform. "
                f"A student aiming for the role of '{target_role}' ({experience_level}) has asked for skill advice.\n\n"
                f"Confirmed current skills: {', '.join(confirmed_skills) if confirmed_skills else 'None confirmed yet'}\n"
                f"Identified high-priority skill gaps: {', '.join(missing_skills[:5]) if missing_skills else 'None identified'}\n"
            )
            if custom_question:
                prompt += f"Student specific question: {custom_question}\n\n"
            prompt += (
                "Provide a concise, highly actionable 3-paragraph learning roadmap advice. "
                "1. Focus on what to prioritize first and why. "
                "2. Suggest a practical project to build that demonstrates these skills. "
                "3. Offer an encouraging interview prep tip. Do not use generic filler."
            )

            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.3, "maxOutputTokens": 800},
            }

            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(url, json=payload)
                resp.raise_for_status()
                data = resp.json()

            candidates = data.get("candidates") or []
            if candidates:
                advice_text = candidates[0]["content"]["parts"][0]["text"].strip()
                return {"advice": advice_text, "source": f"gemini-ai ({model})", "target_role": target_role}
        except Exception as exc:
            logger.warning("Gemini AI skill advice failed, falling back to rule-based engine: %s", exc)

    # Rule-based fallback
    top_missing_str = ", ".join(missing_skills[:3]) if missing_skills else "advanced system design and testing"
    fallback_advice = (
        f"For your target role as a {target_role} ({experience_level}), your highest return on investment comes from addressing your top skill gaps: {top_missing_str}.\n\n"
        f"We recommend dedicating 2-3 focused weeks per stage on our structured roadmap. Rather than just watching tutorials, build a practical flagship project that exercises these tools in tandem. For example, integrate a REST API with persistent database storage and automated unit testing.\n\n"
        f"When applying for internships and jobs, recruiters value verified GitHub repositories with clear documentation and measurable impact metrics far more than passive course certificates."
    )
    return {"advice": fallback_advice, "source": "structured-mentor-engine", "target_role": target_role}


async def chat_with_ai_mentor(
    db: AsyncSession,
    user_id: uuid.UUID,
    messages: List[Dict[str, str]],
    session_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Multi-turn conversational career mentorship grounded in the authenticated student's
    actual target role, confirmed skills, skill gaps, learning roadmap, and project catalog.
    Uses Google Gemini with automatic intelligent fallback to our structured career coaching engine.
    """
    # 1. Fetch authorized student context
    stmt_role = select(StudentTargetRole).where(StudentTargetRole.user_id == user_id)
    pref = (await db.scalars(stmt_role)).first()
    target_role = pref.target_role if pref else "Software Engineer"
    experience_level = pref.experience_level if pref else "Student / Entry Level"

    # Confirmed skills
    stmt_skills = select(StudentSkill).where(StudentSkill.user_id == user_id, StudentSkill.is_confirmed == True)
    skills = (await db.scalars(stmt_skills)).all()
    confirmed_skills = [s.skill_name for s in skills]

    # Gap analysis
    gap = await analyze_role_skill_gap(db, user_id, target_role, experience_level)
    missing_skills = [item["name"] for item in gap.get("missing_skills", [])]
    coverage_pct = gap.get("coverage_percentage", 0)

    # Active learning roadmap skills
    stmt_all_skills = select(StudentSkill).where(StudentSkill.user_id == user_id)
    all_student_skills = (await db.scalars(stmt_all_skills)).all()
    in_progress_skills = [s.skill_name for s in all_student_skills if s.status in ("Learning", "Practiced")]

    # Student's existing projects
    stmt_user_projects = select(Project).where(Project.owner_id == user_id)
    user_projs = (await db.scalars(stmt_user_projects)).all()
    user_project_titles = [f"{p.title} ({p.status})" for p in user_projs]

    # Relevant Project Hub ideas
    matched_hub_projects = []
    stmt_hub = select(Project).where(Project.status == "Published").order_by(desc(Project.stars_count)).limit(3)
    hub_projects = (await db.scalars(stmt_hub)).all()
    for hp in hub_projects:
        matched_hub_projects.append(f"{hp.title} ({', '.join(hp.tech_stack or [])})")

    # 2. Extract latest user message
    user_messages = [m for m in messages if m.get("role") == "user"]
    latest_user_message = user_messages[-1].get("content", "").strip() if user_messages else ""

    # Bounded conversation turns (last 6 messages)
    bounded_messages = messages[-6:] if len(messages) > 6 else messages

    # 3. Grounded System Instruction
    system_instruction = (
        f"You are the CareerPlatform AI Engineering Mentor, an expert technical career coach. "
        f"Your mission is to guide students from their first project to their first job.\n\n"
        f"AUTHENTICATED STUDENT CONTEXT (Use strictly as ground truth):\n"
        f"- Target Career Role: {target_role} ({experience_level})\n"
        f"- Target Role Competency Coverage: {coverage_pct}%\n"
        f"- Confirmed Skills: {', '.join(confirmed_skills) if confirmed_skills else 'None confirmed yet'}\n"
        f"- Top Missing Skill Gaps: {', '.join(missing_skills[:6]) if missing_skills else 'None identified'}\n"
        f"- Currently Learning / In-Progress: {', '.join(in_progress_skills) if in_progress_skills else 'None marked in-progress'}\n"
        f"- Student Showcase Projects: {', '.join(user_project_titles) if user_project_titles else 'No projects created yet'}\n"
        f"- Featured Project Hub Ideas: {'; '.join(matched_hub_projects) if matched_hub_projects else 'Platform Full Stack Starter'}\n\n"
        f"STRICT BEHAVIORAL & PRIVACY RULES:\n"
        f"1. Never claim the student has completed a skill, published a project, or applied for a job unless it appears in their context above.\n"
        f"2. Ground all advice in the student's actual gaps for {target_role}.\n"
        f"3. Explain skill prerequisites, roadmap sequencing, and practical application.\n"
        f"4. Recommend building practical portfolio projects from the Project Hub or custom GitHub repos to verify skills for recruiters.\n"
        f"5. Keep responses concise, direct, and well-structured (2-3 short paragraphs or bullet points). Do not write excessively long essays.\n"
        f"6. Conclude your response with exactly 2 to 3 suggested follow-up questions tailored to this conversation, each starting on a new line with '[FOLLOWUP]: '."
    )

    # 4. Attempt Google Gemini Call
    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip():
        try:
            model = settings.GEMINI_MODEL or "gemini-1.5-pro"
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={settings.GEMINI_API_KEY}"

            contents = [
                {
                    "role": "user",
                    "parts": [{"text": f"[SYSTEM INSTRUCTION]\n{system_instruction}\n[END SYSTEM INSTRUCTION]\n\nStudent initialized session."}],
                },
                {
                    "role": "model",
                    "parts": [{"text": f"Hello! I am your CareerPlatform AI Mentor. I have your progress as an aspiring {target_role} loaded. How can I help accelerate your learning today?"}],
                },
            ]

            for m in bounded_messages:
                g_role = "user" if m.get("role") == "user" else "model"
                contents.append({"role": g_role, "parts": [{"text": m.get("content", "")}]})

            payload = {
                "contents": contents,
                "generationConfig": {
                    "temperature": 0.4,
                    "maxOutputTokens": 900,
                },
            }

            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(url, json=payload)
                resp.raise_for_status()
                data = resp.json()

            candidates = data.get("candidates") or []
            if candidates:
                raw_text = candidates[0]["content"]["parts"][0]["text"].strip()
                # Parse [FOLLOWUP]: lines
                reply_lines = []
                followups = []
                for line in raw_text.split("\n"):
                    if line.strip().startswith("[FOLLOWUP]:"):
                        fu = line.replace("[FOLLOWUP]:", "").strip()
                        if fu:
                            followups.append(fu)
                    else:
                        reply_lines.append(line)

                cleaned_reply = "\n".join(reply_lines).strip()
                if not followups:
                    followups = [
                        f"What practical project should I build to master {missing_skills[0]}?" if missing_skills else "How do I optimize my resume for recruiters?",
                        f"Explain the prerequisites for {missing_skills[1]} on my roadmap." if len(missing_skills) > 1 else "How do I reach Career Ready stage?",
                    ]

                return {
                    "reply": cleaned_reply,
                    "source": f"gemini-ai ({model})",
                    "target_role": target_role,
                    "suggested_followups": followups[:3],
                }
        except Exception as exc:
            logger.warning("Gemini AI mentor chat failed, falling back to structured career engine: %s", exc)

    # 5. Intelligent Rule-Based Career Guidance Fallback
    q_lower = latest_user_message.lower()
    top_gap = missing_skills[0] if missing_skills else "System Design"
    second_gap = missing_skills[1] if len(missing_skills) > 1 else "Cloud Deployment & Docker"

    if any(k in q_lower for k in ["priorit", "start", "focus", "first", "order"]):
        reply = (
            f"Based on your current role profile for **{target_role}** ({coverage_pct}% competency coverage), your highest priority focus should be **{top_gap}**.\n\n"
            f"Why prioritize {top_gap}? In technical recruiting, {top_gap} forms the core prerequisite for downstream technologies like {second_gap}. "
            f"Spending 2 focused weeks completing practice exercises in {top_gap} will directly close your biggest role gap and immediately move your roadmap forward.\n\n"
            f"Recommended Next Step: Work through the learning objectives for {top_gap} on your roadmap, and build a focused code prototype demonstrating it."
        )
        followups = [
            f"What project should I build to demonstrate {top_gap}?",
            f"What are the key prerequisites before learning {second_gap}?",
            "How does closing this gap impact my Career Readiness score?",
        ]
    elif any(k in q_lower for k in ["project", "build", "showcase", "portfolio", "code"]):
        reply = (
            f"To effectively showcase your skills as a **{target_role}**, we recommend building a production-ready application that integrates **{top_gap}** and **{second_gap}**.\n\n"
            f"Key Architecture Recommendations:\n"
            f"• Implement clean modular architecture with separated data access, business logic, and API routes.\n"
            f"• Include an automated test suite verifying edge cases and integration points.\n"
            f"• Provide an engineer-grade README with architecture diagrams, setup instructions, and design trade-offs.\n\n"
            f"You can also browse verified open-source guides in the **Project Hub** for benchmark specifications."
        )
        followups = [
            "What features make a portfolio project stand out to hiring managers?",
            f"How do I submit this project for platform verification in My Projects?",
            f"What are the best testing frameworks to use for {target_role}?",
        ]
    elif any(k in q_lower for k in ["readiness", "score", "stage", "criteria", "boost"]):
        reply = (
            f"Career Readiness tracks your holistic preparation across 5 transparent criteria totalling 100 points:\n\n"
            f"1. **Profile Foundation (20%)**: Complete headline, bio, academic background, and social links.\n"
            f"2. **Resume & ATS (20%)**: Create a structured ATS resume and run an ATS match scan.\n"
            f"3. **Skills & Roadmap (20%)**: Select target role, confirm at least 3 skills, and maintain active roadmap progress.\n"
            f"4. **Practical Projects (25%)**: Build, submit, and verify software projects with source code repositories.\n"
            f"5. **Applications & Outreach (15%)**: Submit internship or job applications to connect with employers.\n\n"
            f"Click **Boost Score** on your dashboard anytime to jump straight to your highest-impact incomplete task!"
        )
        followups = [
            "Which criteria can I complete today to boost my score the fastest?",
            "What is required to reach Stage 4: Career Ready?",
            "How do I run an ATS scan on my resume?",
        ]
    elif any(k in q_lower for k in ["prereq", "prerequisite", "before", "docker", "system design"]):
        reply = (
            f"Understanding prerequisite chains is essential for efficient skill acquisition in **{target_role}**.\n\n"
            f"For advanced topics like {second_gap}, you should first ensure confidence in fundamentals: HTTP status protocols, data persistence, and foundational testing. "
            f"Attempting advanced orchestration or distributed architecture before mastering core backend and API design leads to confusion and fragile projects.\n\n"
            f"Follow the staged learning roadmap in Skill Intelligence to master each layer in sequence."
        )
        followups = [
            f"What practice exercise proves I have mastered {top_gap}?",
            "How long should I spend on each stage of the roadmap?",
            "Can you explain the difference between junior and mid-level requirements?",
        ]
    else:
        reply = (
            f"As an aspiring **{target_role}** ({experience_level}), you currently have **{len(confirmed_skills)} confirmed competencies** and **{coverage_pct}% coverage** of standard industry requirements.\n\n"
            f"Your most critical missing competencies are: **{', '.join(missing_skills[:3]) if missing_skills else 'advanced architecture and performance optimization'}**.\n\n"
            f"How would you like to proceed? We can explore practical project ideas, break down specific skill prerequisites, or create a personalized weekly study schedule."
        )
        followups = [
            f"What should I prioritize first between {top_gap} and {second_gap}?",
            "Recommend a flagship project for my portfolio.",
            "How do I improve my ATS resume match score?",
        ]

    return {
        "reply": reply,
        "source": "structured-mentor-engine",
        "target_role": target_role,
        "suggested_followups": followups,
    }


async def reassess_student_career_fit(
    db: AsyncSession,
    user_id: uuid.UUID,
    target_role: Optional[str] = None,
    experience_level: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Reruns career fit analysis against current student records, tracks score progression,
    and updates historical snapshot in preferences.
    """
    stmt_role = select(StudentTargetRole).where(StudentTargetRole.user_id == user_id)
    pref = (await db.scalars(stmt_role)).first()
    resolved_role = target_role or (pref.target_role if pref else "Frontend Developer")
    resolved_level = experience_level or (pref.experience_level if pref else "Student / Entry Level")

    if not pref:
        pref = StudentTargetRole(
            user_id=user_id,
            target_role=resolved_role,
            experience_level=resolved_level,
            preferences={},
        )
        db.add(pref)
        await db.flush()

    gap = await analyze_role_skill_gap(db, user_id, resolved_role, resolved_level)
    current_match = gap["coverage_percentage"]

    prefs = dict(pref.preferences or {})
    prev_match = prefs.get("current_match_percentage", prefs.get("previous_match_percentage", current_match))
    score_delta = round(current_match - float(prev_match), 1)

    # Detect improved skills
    stmt_skills = select(StudentSkill).where(StudentSkill.user_id == user_id)
    all_skills = (await db.scalars(stmt_skills)).all()
    improved = [s.skill_name for s in all_skills if s.status in ("Practiced", "Completed")]
    remaining = [s["name"] for s in gap.get("missing_skills", [])[:5]]

    now = datetime.now(timezone.utc)
    prefs["previous_match_percentage"] = float(prev_match)
    prefs["current_match_percentage"] = float(current_match)
    prefs["last_reassessed_at"] = now.isoformat()
    pref.preferences = prefs
    await db.commit()

    if score_delta > 0:
        explanation = f"Your role match increased by +{score_delta}%! You have strengthened competencies in {', '.join(improved[:3]) if improved else 'key technologies'}."
    elif score_delta < 0:
        explanation = f"Your match score adjusted to {current_match}% based on current evaluated requirements for {resolved_role}."
    else:
        explanation = f"Your role match is currently steady at {current_match}%. Complete practice exercises or showcase projects in {remaining[0] if remaining else 'your roadmap'} to increase your score."

    readiness_impact = (
        "Your verified progress in Skill Intelligence contributes up to 20 points directly toward your overall platform Career Readiness score."
    )

    return {
        "target_role": resolved_role,
        "previous_match_percentage": float(prev_match),
        "current_match_percentage": float(current_match),
        "score_delta": float(score_delta),
        "improved_skills": improved[:5],
        "remaining_gaps": remaining,
        "explanation": explanation,
        "career_readiness_impact": readiness_impact,
        "reassessed_at": now,
    }


async def update_resource_progress(
    db: AsyncSession,
    user_id: uuid.UUID,
    resource_url: str,
    skill_name: str,
    status: str,
) -> Dict[str, Any]:
    """
    Persists student resource progress (started | completed) in StudentTargetRole preferences.
    """
    stmt = select(StudentTargetRole).where(StudentTargetRole.user_id == user_id)
    pref = (await db.scalars(stmt)).first()
    if not pref:
        pref = StudentTargetRole(
            user_id=user_id,
            target_role="Frontend Developer",
            experience_level="Student / Entry Level",
            preferences={},
        )
        db.add(pref)
        await db.flush()

    prefs = dict(pref.preferences or {})
    res_map = dict(prefs.get("resource_progress", {}))
    res_map[resource_url] = {
        "status": status,
        "skill_name": skill_name,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    prefs["resource_progress"] = res_map
    pref.preferences = prefs
    await db.commit()

    return {
        "resource_url": resource_url,
        "skill_name": skill_name,
        "status": status,
        "updated_at": datetime.now(timezone.utc),
    }


