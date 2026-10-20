from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.middleware import SecurityHeadersMiddleware
from app.api.routes import api_router
from pathlib import Path
from fastapi.responses import FileResponse

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup and shutdown lifecycle management.
    Initializes database schema. Accounts are registered or provisioned explicitly.
    """
    from app.core.database import engine, Base, AsyncSessionLocal
    from sqlalchemy import select, func

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    if settings.ENVIRONMENT.strip().lower() in {"production", "prod", "release"}:
        yield
        return

    async with AsyncSessionLocal() as session:
        # Seed demo jobs for jobs & internship discovery if not present
        from app.models.job import Job
        from datetime import datetime, timezone, timedelta
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
                    location="Remote (India / Global)",
                    stipend_or_salary="₹45,000/mo",
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
                    deadline=None,
                ),
                Job(
                    title="Junior Backend Developer",
                    company_name="Stripe",
                    company_logo_url="https://images.ctfassets.net/f60q1anpxzid/fidelity-hero/f2ea1c322b72f1cefb52199f7d4e51ec/stripe-logo.png",
                    company_website="https://stripe.com",
                    domain="Backend",
                    job_type="Full-time",
                    work_mode="Hybrid",
                    location="Bengaluru, Karnataka",
                    stipend_or_salary="₹12,00,000 - ₹15,00,000/yr",
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
                    deadline=None,
                ),
                Job(
                    title="AI Research & ML Engineering Intern",
                    company_name="Scale AI",
                    company_logo_url="https://scale.com/favicon.ico",
                    company_website="https://scale.com",
                    domain="AI / Machine Learning",
                    job_type="Internship",
                    work_mode="Onsite",
                    location="Hyderabad, Telangana",
                    stipend_or_salary="₹60,000/mo",
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
                    deadline=datetime.now(timezone.utc) + timedelta(days=30),
                ),
                Job(
                    title="Full-Stack Software Engineer (New Grad)",
                    company_name="Datadog",
                    company_logo_url="https://img.datadoghq.com/img/favicon.ico",
                    company_website="https://datadoghq.com",
                    domain="Full-Stack Development",
                    job_type="Full-time",
                    work_mode="Remote",
                    location="Remote (India)",
                    stipend_or_salary="",
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
                    deadline=None,
                ),
                Job(
                    title="Cloud Infrastructure & DevOps Intern",
                    company_name="Cloudflare",
                    company_logo_url="https://www.cloudflare.com/favicon.ico",
                    company_website="https://cloudflare.com",
                    domain="Cloud & DevOps",
                    job_type="Internship",
                    work_mode="Remote",
                    location="Pune, Maharashtra",
                    stipend_or_salary="₹35,000/mo",
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
                    deadline=datetime.now(timezone.utc) + timedelta(days=45),
                ),
                Job(
                    title="Junior Mobile Engineer (React Native)",
                    company_name="Airbnb",
                    company_logo_url="https://a0.muscache.com/airbnb/static/icons/apple-touch-icon-180x180.png",
                    company_website="https://airbnb.com",
                    domain="Mobile Development",
                    job_type="Full-time",
                    work_mode="Hybrid",
                    location="Gurugram, Haryana",
                    stipend_or_salary="₹14,00,000 - ₹18,00,000/yr",
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
                    deadline=None,
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
    if settings.FRONTEND_DIST_DIR:
        return FileResponse(Path(settings.FRONTEND_DIST_DIR) / "index.html", headers={"Cache-Control": "no-store"})
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


if settings.FRONTEND_DIST_DIR:
    from app.core.frontend import FrontendFiles
    app.mount('/', FrontendFiles(directory=settings.FRONTEND_DIST_DIR, html=True), name='frontend')
