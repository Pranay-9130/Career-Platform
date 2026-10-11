from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.middleware import SecurityHeadersMiddleware
from app.api.routes import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup and shutdown lifecycle management.
    Initializes database schema and default demo accounts if not present.
    """
    from app.core.database import engine, Base, AsyncSessionLocal
    from app.models.user import User, UserRole
    from app.core.security import get_password_hash
    from sqlalchemy import select

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed demo users for instant previewing & testing
    async with AsyncSessionLocal() as session:
        stmt_student = select(User).where(User.email == "student@university.edu")
        existing_student = (await session.execute(stmt_student)).scalar_one_or_none()
        if not existing_student:
            student = User(
                email="student@university.edu",
                hashed_password=get_password_hash("Student123!"),
                full_name="Alex Student",
                role=UserRole.STUDENT,
                headline="Computer Science Major",
                is_active=True,
                is_verified=True,
            )
            session.add(student)

        stmt_admin = select(User).where(User.email == "admin@careerplatform.com")
        existing_admin = (await session.execute(stmt_admin)).scalar_one_or_none()
        if not existing_admin:
            admin = User(
                email="admin@careerplatform.com",
                hashed_password=get_password_hash("Admin123!"),
                full_name="Morgan Admin",
                role=UserRole.ADMIN,
                headline="Platform Administrator",
                is_active=True,
                is_verified=True,
            )
            session.add(admin)

        await session.commit()

        # Seed demo profile for demo student if not present
        from app.models.profile import Profile
        stmt_alex = select(User).where(User.email == "student@university.edu")
        alex = (await session.execute(stmt_alex)).scalar_one_or_none()
        if alex:
            stmt_alex_prof = select(Profile).where(Profile.user_id == alex.id)
            alex_prof = (await session.execute(stmt_alex_prof)).scalar_one_or_none()
            if not alex_prof:
                profile = Profile(
                    user_id=alex.id,
                    username="alexstudent",
                    headline="Computer Science Senior @ Stanford University",
                    bio="Passionate about building cloud architectures and full-stack web platforms using FastAPI, React, and PostgreSQL.",
                    university="Stanford University",
                    degree="B.S. in Computer Science",
                    graduation_year=2026,
                    skills=["React", "TypeScript", "Python", "FastAPI", "Docker", "PostgreSQL", "Tailwind CSS"],
                    github_url="https://github.com/alexstudent",
                    linkedin_url="https://linkedin.com/in/alexstudent",
                    portfolio_url="https://alexstudent.dev",
                )
                session.add(profile)
                await session.commit()

        # Seed demo projects for discovery catalog if not present
        from app.models.project import Project
        from sqlalchemy import func
        stmt_proj_count = select(func.count(Project.id))
        proj_count = (await session.execute(stmt_proj_count)).scalar() or 0
        if alex and proj_count == 0:
            demo_projects = [
                Project(
                    owner_id=alex.id,
                    title="AI Resume Matcher & ATS Scorer",
                    slug="ai-resume-matcher",
                    domain="AI / Machine Learning",
                    short_description="NLP pipeline comparing student resumes with job specs, calculating ATS alignment and actionable skill gap recommendations.",
                    problem_statement="Students struggle to understand why their resumes are filtered out by automated applicant tracking systems (ATS). This platform uses NLP and semantic vector embeddings to analyze match scores and recommend exact keyword enhancements.",
                    objectives="Implement PDF text parsing, vectorize resume content, compute cosine similarity against job descriptions, and deliver interactive recommendations.",
                    features=["ATS compatibility score (0-100%)", "Missing skills and keyword gap report", "Interactive PDF resume parser", "Gemini AI suggestion rewrite engine"],
                    tech_stack=["FastAPI", "React", "Gemini AI", "PostgreSQL", "Python"],
                    prerequisites="Basic Python, knowledge of REST APIs, basic React fundamentals.",
                    difficulty="Intermediate",
                    estimated_duration="2-3 weeks",
                    expected_outcome="A deployed web app where students can upload any resume and job description to get instant ATS scoring.",
                    views_count=342,
                    stars_count=89,
                    bookmarks_count=42,
                    status="Published",
                    github_url="https://github.com/alexstudent/ai-resume-matcher",
                    live_demo_url="https://ats-matcher-demo.dev",
                    screenshots=[
                        {
                            "image_url": "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=1200&q=80",
                            "caption": "Live ATS parsing and semantic match score breakdown",
                            "order_index": 0,
                        },
                        {
                            "image_url": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
                            "caption": "Actionable skill gap matrix and missing keyword detections",
                            "order_index": 1,
                        },
                        {
                            "image_url": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
                            "caption": "Gemini AI interactive resume bullet enhancement editor",
                            "order_index": 2,
                        },
                    ],
                ),
                Project(
                    owner_id=alex.id,
                    title="Multi-Cloud Kubernetes Cost Optimizer",
                    slug="cloud-cost-optimizer",
                    domain="Cloud & DevOps",
                    short_description="Automated controller collecting node telemetry and pod utilization to cut idle Kubernetes cluster spend by up to 40%.",
                    problem_statement="Startups and cloud teams overprovision Kubernetes worker nodes by default, generating thousands of dollars in wasted monthly cloud compute spend.",
                    objectives="Develop custom metrics CRD, Horizontal Pod Autoscaling integrations, and cost visualization dashboards.",
                    features=["Custom metrics CRD", "Horizontal Pod Autoscaling integration", "Prometheus metrics exporter", "Grafana cost forecasting dashboard"],
                    tech_stack=["Go", "Kubernetes", "AWS", "Prometheus", "Docker"],
                    prerequisites="Go syntax, Docker containerization, Kubernetes basic architecture.",
                    difficulty="Advanced",
                    estimated_duration="3-4 weeks",
                    expected_outcome="A lightweight cluster agent running in-cluster that delivers real-time right-sizing suggestions.",
                    views_count=215,
                    stars_count=64,
                    bookmarks_count=31,
                    status="Published",
                    github_url="https://github.com/alexstudent/k8s-cost-optimizer",
                ),
                Project(
                    owner_id=alex.id,
                    title="CampusBite — University Food Delivery App",
                    slug="campus-bite-delivery",
                    domain="Mobile Development",
                    short_description="Hyper-local ordering app connecting campus dining halls and student dorms with real-time driver tracking and peer couriers.",
                    problem_statement="Commercial delivery apps charge high delivery and service fees that college students cannot afford, while dining halls experience huge lunch rushes.",
                    objectives="Create a cross-platform mobile app allowing students to order from campus spots and pick up or peer-deliver.",
                    features=["Real-time order geolocation tracker", "Campus dining hall menu sync", "Student wallet & discount codes", "Push notification alert system"],
                    tech_stack=["React Native", "Expo", "FastAPI", "PostgreSQL", "Tailwind CSS"],
                    prerequisites="JavaScript / TypeScript, React Native basics, REST API integration.",
                    difficulty="Intermediate",
                    estimated_duration="2-3 weeks",
                    expected_outcome="A smooth mobile application running in iOS simulator and Android emulator.",
                    views_count=198,
                    stars_count=52,
                    bookmarks_count=28,
                    status="Published",
                    github_url="https://github.com/alexstudent/campus-bite-app",
                ),
                Project(
                    owner_id=alex.id,
                    title="DevLink — Student Developer Showcase & Network",
                    slug="devlink-portfolio-hub",
                    domain="Web Development",
                    short_description="Modern web application enabling engineering students to showcase verified projects, GitHub repositories, and interactive demos to tech recruiters.",
                    problem_statement="Students often have scattered repositories and PDF resumes without an engaging, verified public URL to share with hiring managers.",
                    objectives="Build an authenticated profile builder with interactive skills tagging and public portfolio slugs.",
                    features=["Public profile slug (/u/:username)", "GitHub OAuth integration", "Project showcase cards", "Recruiter direct contact form"],
                    tech_stack=["React", "Tailwind CSS", "FastAPI", "PostgreSQL", "Docker"],
                    prerequisites="HTML, CSS, React hooks, FastAPI basics.",
                    difficulty="Beginner",
                    estimated_duration="1-2 weeks",
                    expected_outcome="A responsive full-stack platform with authentication and public portfolio views.",
                    views_count=512,
                    stars_count=110,
                    bookmarks_count=67,
                    status="Published",
                    github_url="https://github.com/alexstudent/devlink-platform",
                    live_demo_url="https://devlink-showcase.dev",
                ),
                Project(
                    owner_id=alex.id,
                    title="Real-Time Collaborative Code Editor",
                    slug="realtime-collaborative-editor",
                    domain="Web Development",
                    short_description="Browser-based multiplayer code IDE with synchronized cursor markers, syntax highlighting, and live in-memory execution.",
                    problem_statement="Pair programming remotely often requires clunky screen-sharing rather than seamless concurrent coding in the same file.",
                    objectives="Implement WebSockets with Conflict-free Replicated Data Types (CRDTs) to synchronize keystrokes across multiple connected clients.",
                    features=["CRDT concurrent conflict resolution", "Live presence indicators and multiple cursors", "Monaco code editor embedding", "Dockerized code execution sandbox"],
                    tech_stack=["TypeScript", "React", "WebSocket", "Node.js", "Redis"],
                    prerequisites="Async JavaScript, WebSocket protocols, state synchronization concepts.",
                    difficulty="Advanced",
                    estimated_duration="3-4 weeks",
                    expected_outcome="A multiplayer web IDE supporting real-time simultaneous edits with low latency.",
                    views_count=430,
                    stars_count=95,
                    bookmarks_count=54,
                    status="Published",
                    github_url="https://github.com/alexstudent/collab-code-editor",
                ),
                Project(
                    owner_id=alex.id,
                    title="FinTrack — Student Budget & Expense Analytics",
                    slug="fintrack-personal-finance",
                    domain="Web Development",
                    short_description="Visual budget planner designed for college students to track loans, rent, recurring subscriptions, and campus dining budgets.",
                    problem_statement="College students frequently lose track of small recurring subscriptions and struggle with monthly budgeting under tight allowances.",
                    objectives="Provide clean interactive visualizations, monthly budgeting envelopes, and CSV import capabilities.",
                    features=["Categorized monthly expense breakdown", "Recurring subscription detector", "Export to CSV and PDF reports", "Predictive end-of-semester balance forecast"],
                    tech_stack=["React", "Chart.js", "Python", "SQLite", "Tailwind CSS"],
                    prerequisites="Basic React, component state management, data visualization libraries.",
                    difficulty="Beginner",
                    estimated_duration="1-2 weeks",
                    expected_outcome="A clean personal finance dashboard with interactive chart breakdowns.",
                    views_count=175,
                    stars_count=38,
                    bookmarks_count=19,
                    status="Published",
                    github_url="https://github.com/alexstudent/fintrack-student",
                ),
                Project(
                    owner_id=alex.id,
                    title="Deep Learning Chest X-Ray Diagnosis Assistant",
                    slug="medical-pneumonia-detector",
                    domain="AI / Machine Learning",
                    short_description="Convolutional neural network diagnostic tool classifying chest X-rays to detect pneumonia with Grad-CAM visual heatmaps.",
                    problem_statement="Radiologists in remote clinics face heavy backlogs; AI diagnostic triage can assist by highlighting suspicious pulmonary regions.",
                    objectives="Train a CNN on public NIH chest X-ray datasets, calculate Grad-CAM saliency maps, and expose a clean web inference endpoint.",
                    features=["96.2% validation accuracy ResNet-50 backbone", "Grad-CAM explainability heatmap overlay", "DICOM and PNG image upload parser", "Clinical findings summary generator"],
                    tech_stack=["Python", "PyTorch", "OpenCV", "FastAPI", "React"],
                    prerequisites="Deep learning fundamentals, PyTorch tensor manipulation, CNN architectures.",
                    difficulty="Advanced",
                    estimated_duration="3-4 weeks",
                    expected_outcome="An end-to-end model and web interface generating diagnostic probabilities and visual heatmap overlays.",
                    views_count=380,
                    stars_count=88,
                    bookmarks_count=49,
                    status="Published",
                    github_url="https://github.com/alexstudent/chest-xray-ai",
                ),
                Project(
                    owner_id=alex.id,
                    title="Real-Time Stock Market Streaming Data Pipeline",
                    slug="stock-market-streaming-pipeline",
                    domain="Data Engineering",
                    short_description="High-throughput streaming ETL pipeline ingesting live market ticker websockets, processing windowed aggregations, and persisting to analytical lakehouse.",
                    problem_statement="Financial algorithmic analysis requires millisecond streaming ingestion and rolling volume-weighted average price (VWAP) computations.",
                    objectives="Set up Kafka topics, PySpark streaming processors, and DuckDB analytical storage.",
                    features=["Sub-second ticker ingestion", "1-minute and 5-minute rolling VWAP calculations", "Outlier trade anomaly detection", "Real-time websocket broadcast to client dashboard"],
                    tech_stack=["Apache Kafka", "Python", "PySpark", "DuckDB", "FastAPI"],
                    prerequisites="Distributed systems basics, Python streaming generators, SQL query design.",
                    difficulty="Intermediate",
                    estimated_duration="2-3 weeks",
                    expected_outcome="A running streaming pipeline with real-time console metrics and data persistence.",
                    views_count=260,
                    stars_count=71,
                    bookmarks_count=36,
                    status="Published",
                    github_url="https://github.com/alexstudent/kafka-market-pipeline",
                ),
                Project(
                    owner_id=alex.id,
                    title="Zero-Trust Identity & API Gatekeeper",
                    slug="zero-trust-api-gateway",
                    domain="Cyber Security",
                    short_description="Reverse proxy micro-gateway enforcing mutual TLS, cryptographically signed JWT validation, and dynamic rate limiting.",
                    problem_statement="Modern microservice architectures need perimeter security that verifies every request rather than trusting internal networks implicitly.",
                    objectives="Implement high-performance reverse proxy routing in Go with token bucket rate limiting and Redis caching.",
                    features=["Distributed token bucket rate limiter", "mTLS upstream client verification", "Automated IP reputation and blocklist", "Structured audit log streaming"],
                    tech_stack=["Go", "Docker", "Redis", "OAuth2", "Linux"],
                    prerequisites="Networking basics (TCP, TLS, HTTP/2), Go concurrency primitives.",
                    difficulty="Advanced",
                    estimated_duration="3-4 weeks",
                    expected_outcome="A containerized reverse proxy protecting downstream services with sub-millisecond overhead.",
                    views_count=210,
                    stars_count=61,
                    bookmarks_count=33,
                    status="Published",
                    github_url="https://github.com/alexstudent/zero-trust-gateway",
                ),
            ]
            for p in demo_projects:
                session.add(p)
            await session.commit()

        # Seed demo jobs for jobs & internship discovery if not present
        from app.models.job import Job
        stmt_job_count = select(func.count(Job.id))
        job_count = (await session.execute(stmt_job_count)).scalar() or 0
        if job_count == 0:
            demo_jobs = [
                Job(
                    title="Frontend Software Engineer Intern",
                    company_name="Vercel",
                    company_logo_url="https://assets.vercel.com/image/upload/v1588863393/front/favicon/vercel/180x180.png",
                    company_website="https://vercel.com",
                    domain="Frontend",
                    job_type="Internship",
                    work_mode="Remote",
                    location="Remote (US / Canada)",
                    stipend_or_salary="$45/hr (~$7,200/mo)",
                    experience_level="Internship",
                    skills_required=["React", "TypeScript", "Next.js", "Tailwind CSS"],
                    description="Join Vercel's design systems and web framework team building the future of the Frontend Cloud. You will work closely with staff engineers optimizing component performance and developer experience.",
                    responsibilities=[
                        "Develop accessible, responsive UI primitives for Next.js starter templates.",
                        "Collaborate with senior designers and engineers to implement micro-interactions.",
                        "Write unit and end-to-end component tests using Vitest and Playwright.",
                    ],
                    requirements=[
                        "Currently enrolled in or recent graduate of a Computer Science or related degree.",
                        "Hands-on proficiency with React, TypeScript, and modern CSS frameworks.",
                        "Demonstrated personal portfolio projects or open-source contributions.",
                    ],
                    apply_url="https://vercel.com/careers",
                    is_active=True,
                    is_featured=True,
                ),
                Job(
                    title="Junior Backend Developer",
                    company_name="Stripe",
                    company_logo_url="https://images.ctfassets.net/f60q1anpxzid/fidelity-hero/f2ea1c322b72f1cefb52199f7d4e51ec/stripe-logo.png",
                    company_website="https://stripe.com",
                    domain="Backend",
                    job_type="Full-time",
                    work_mode="Hybrid",
                    location="Seattle, WA / San Francisco, CA",
                    stipend_or_salary="$115,000 - $135,000/yr",
                    experience_level="Entry Level",
                    skills_required=["Python", "FastAPI", "PostgreSQL", "Docker", "Redis"],
                    description="Stripe is expanding its payments infrastructure team. As an entry-level backend engineer, you will write robust APIs that power millions of financial transactions per minute worldwide.",
                    responsibilities=[
                        "Design and build resilient, high-throughput RESTful and RPC microservices.",
                        "Manage relational database schemas, migrations, and query indexing.",
                        "Participate in design reviews and incident post-mortems.",
                    ],
                    requirements=[
                        "Strong computer science fundamentals (data structures, algorithms, concurrency).",
                        "Proficiency in Python, Go, or Java with database query optimization experience.",
                        "Strong communication and collaborative problem-solving skills.",
                    ],
                    apply_url="https://stripe.com/jobs",
                    is_active=True,
                    is_featured=True,
                ),
                Job(
                    title="AI Research & ML Engineering Intern",
                    company_name="Scale AI",
                    company_logo_url="https://scale.com/favicon.ico",
                    company_website="https://scale.com",
                    domain="AI / Machine Learning",
                    job_type="Internship",
                    work_mode="Onsite",
                    location="San Francisco, CA",
                    stipend_or_salary="$8,000/mo ($50/hr)",
                    experience_level="Internship",
                    skills_required=["PyTorch", "Python", "Transformers", "NLP", "LLMs"],
                    description="Work directly with leading AI researchers benchmarking frontier foundation models, fine-tuning task-specific LLMs, and developing evaluation harness suites.",
                    responsibilities=[
                        "Train and evaluate transformer checkpoints using PyTorch and Hugging Face.",
                        "Curate synthetic data generation pipelines for multi-modal evaluation.",
                        "Document benchmark results and present insights to engineering leads.",
                    ],
                    requirements=[
                        "Experience training neural networks in PyTorch or JAX.",
                        "Familiarity with RLHF, LoRA, and LLM fine-tuning techniques.",
                        "Strong Python scripting and Linux environment fluency.",
                    ],
                    apply_url="https://scale.com/careers",
                    is_active=True,
                    is_featured=True,
                ),
                Job(
                    title="Full-Stack Software Engineer (New Grad)",
                    company_name="Datadog",
                    company_logo_url="https://img.datadoghq.com/img/favicon.ico",
                    company_website="https://datadoghq.com",
                    domain="Full-Stack Development",
                    job_type="Full-time",
                    work_mode="Remote",
                    location="Remote (Global)",
                    stipend_or_salary="$120,000 - $140,000/yr",
                    experience_level="Entry Level",
                    skills_required=["React", "Go", "TypeScript", "PostgreSQL", "Kubernetes"],
                    description="Datadog's Observability Platform team is seeking junior engineers passionate about building real-time telemetry dashboards and scalable telemetry ingestion endpoints.",
                    responsibilities=[
                        "Implement interactive dashboard widgets visualizing live telemetry metrics.",
                        "Maintain backend services handling high-frequency time-series data.",
                        "Collaborate with UX designers to refine data visualization workflows.",
                    ],
                    requirements=[
                        "Bachelor's degree in CS, Software Engineering, or equivalent practical experience.",
                        "Knowledge of web protocols, asynchronous programming, and REST APIs.",
                        "Experience building full-stack web applications with React.",
                    ],
                    apply_url="https://datadoghq.com/careers",
                    is_active=True,
                    is_featured=False,
                ),
                Job(
                    title="Cloud Infrastructure & DevOps Intern",
                    company_name="Cloudflare",
                    company_logo_url="https://www.cloudflare.com/favicon.ico",
                    company_website="https://cloudflare.com",
                    domain="Cloud & DevOps",
                    job_type="Internship",
                    work_mode="Remote",
                    location="Remote (Americas & EMEA)",
                    stipend_or_salary="$40/hr (~$6,400/mo)",
                    experience_level="Internship",
                    skills_required=["Terraform", "Docker", "AWS", "Linux", "CI/CD"],
                    description="Help secure and accelerate the internet. Our Infrastructure Engineering team invites interns to contribute directly to edge edge routing, automated deployment pipelines, and zero-downtime infrastructure.",
                    responsibilities=[
                        "Automate CI/CD pipelines using GitHub Actions and container registries.",
                        "Write infrastructure-as-code definitions with Terraform.",
                        "Monitor edge cluster health and diagnostic alerts.",
                    ],
                    requirements=[
                        "Knowledge of Linux system administration and containerization (Docker).",
                        "Basic understanding of TCP/IP, DNS, and TLS handshakes.",
                        "Curiosity about distributed systems and edge networking.",
                    ],
                    apply_url="https://cloudflare.com/careers",
                    is_active=True,
                    is_featured=False,
                ),
                Job(
                    title="Junior Mobile Engineer (React Native)",
                    company_name="Airbnb",
                    company_logo_url="https://a0.muscache.com/airbnb/static/icons/apple-touch-icon-180x180.png",
                    company_website="https://airbnb.com",
                    domain="Mobile Development",
                    job_type="Full-time",
                    work_mode="Hybrid",
                    location="San Francisco, CA",
                    stipend_or_salary="$110,000 - $130,000/yr",
                    experience_level="Entry Level",
                    skills_required=["React Native", "TypeScript", "iOS", "Android", "GraphQL"],
                    description="Join Airbnb's Guest Experience mobile engineering guild. You will craft fluid, accessible mobile screens that empower millions of travelers around the world.",
                    responsibilities=[
                        "Build native and cross-platform UI views adhering to design guidelines.",
                        "Integrate GraphQL client queries with Apollo and offline cache management.",
                        "Debug cross-device performance and animation framerate drops.",
                    ],
                    requirements=[
                        "Hands-on experience developing mobile applications using React Native.",
                        "Solid foundation in JavaScript/TypeScript and asynchronous event handling.",
                        "Portfolio of mobile project applications or app store releases.",
                    ],
                    apply_url="https://airbnb.com/careers",
                    is_active=True,
                    is_featured=False,
                ),
            ]
            for j in demo_jobs:
                session.add(j)
            await session.commit()


    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for Student Career Platform — From your first project to your first job.",
    version="0.1.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

# CORS Middleware Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OWASP Security Headers Middleware
app.add_middleware(SecurityHeadersMiddleware)

# Register API Router & Root SEO endpoints
from app.api.routes.seo import router as seo_router
app.include_router(api_router)
app.include_router(seo_router)

@app.get("/", tags=["Root"])
async def root():
    """
    Root entrypoint verifying API service status.
    """
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "docs": "/docs" if settings.DEBUG else "disabled in production",
        "status": "online",
    }


@app.get("/health", tags=["Health"])
async def health_root():
    """
    Direct root health check endpoint for cloud orchestrators (Render, AWS, GCP).
    """
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "version": "0.1.0",
    }
