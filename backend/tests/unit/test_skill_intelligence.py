import io
from unittest.mock import patch
from reportlab.pdfgen import canvas
import pytest
import pytest_asyncio
import uuid
from datetime import datetime, timezone
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select

from app.main import app
from app.core.database import Base, get_db
from app.models.user import User, UserRole
from app.models.resume import Resume
from app.models.project import Project
from app.models.job import Job
from app.models.skill_intelligence import (
    StudentTargetRole,
    StudentSkill,
    SkillStatus,
    SkillSource,
)
from app.api.dependencies.auth import get_current_active_user
from app.services.skill_intelligence import (
    normalize_skill_name,
    extract_skills_from_text,
    extract_text_from_pdf,
    analyze_role_skill_gap,
    generate_skill_recommendations,
    generate_learning_roadmap,
)

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest_asyncio.fixture(scope="function")
async def db_session():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with session_factory() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


student_1 = User(
    id=uuid.UUID("11111111-1111-1111-1111-111111111111"),
    email="student1@university.edu",
    hashed_password="hash",
    full_name="Alex Chen",
    role=UserRole.STUDENT,
    headline="Frontend Aspiring Engineer",
    is_active=True,
    is_verified=True,
    created_at=datetime.now(timezone.utc),
    updated_at=datetime.now(timezone.utc),
)

student_2 = User(
    id=uuid.UUID("22222222-2222-2222-2222-222222222222"),
    email="student2@university.edu",
    hashed_password="hash",
    full_name="Sam Taylor",
    role=UserRole.STUDENT,
    headline="Backend Enthusiast",
    is_active=True,
    is_verified=True,
    created_at=datetime.now(timezone.utc),
    updated_at=datetime.now(timezone.utc),
)


@pytest.mark.asyncio
async def test_target_role_preferences_save_and_retrieve(db_session):
    """1. Target-role preferences can be saved and retrieved."""
    app.dependency_overrides[get_current_active_user] = lambda: student_1
    app.dependency_overrides[get_db] = lambda: db_session
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Check initial empty preference
        res = await client.get("/api/skill-intelligence/target-role")
        assert res.status_code == 200
        assert res.json() is None

        # Save preference
        payload = {
            "target_role": "Frontend Developer",
            "experience_level": "Student / Entry Level",
            "preferences": {"work_mode": "Remote", "weekly_hours": 15},
        }
        put_res = await client.put("/api/skill-intelligence/target-role", json=payload)
        assert put_res.status_code == 200
        data = put_res.json()
        assert data["target_role"] == "Frontend Developer"
        assert data["experience_level"] == "Student / Entry Level"
        assert data["preferences"]["work_mode"] == "Remote"

        # Retrieve preference later
        get_res = await client.get("/api/skill-intelligence/target-role")
        assert get_res.status_code == 200
        saved = get_res.json()
        assert saved["target_role"] == "Frontend Developer"
        assert saved["preferences"]["weekly_hours"] == 15

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_student_isolation_and_ownership(db_session):
    """2. Students cannot access or modify another student's skills or progress."""
    # Create skill for student 1
    skill_1 = StudentSkill(
        user_id=student_1.id,
        skill_name="React",
        normalized_name="react",
        category="Frameworks & Libraries",
        source="manual",
        is_confirmed=True,
        status="Learning",
    )
    db_session.add(skill_1)
    await db_session.commit()
    await db_session.refresh(skill_1)

    # Act as student 2
    app.dependency_overrides[get_current_active_user] = lambda: student_2
    app.dependency_overrides[get_db] = lambda: db_session
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Student 2 should see empty skills
        list_res = await client.get("/api/skill-intelligence/skills")
        assert list_res.status_code == 200
        assert len(list_res.json()) == 0

        # Student 2 cannot update student 1's skill
        update_res = await client.put(
            f"/api/skill-intelligence/skills/{skill_1.id}",
            json={"status": "Completed"},
        )
        assert update_res.status_code == 404

        # Student 2 cannot delete student 1's skill
        del_res = await client.delete(f"/api/skill-intelligence/skills/{skill_1.id}")
        assert del_res.status_code == 404

    # Verify skill 1 remained untouched
    refreshed = (await db_session.scalars(select(StudentSkill).where(StudentSkill.id == skill_1.id))).first()
    assert refreshed.status == "Learning"

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_resume_skill_extraction_valid_and_invalid_inputs(db_session):
    """3. Resume skill extraction handles valid text, empty inputs, and PDF errors gracefully."""
    app.dependency_overrides[get_current_active_user] = lambda: student_1
    app.dependency_overrides[get_db] = lambda: db_session
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Valid text
        valid_payload = {
            "resume_text": "Experienced building responsive web interfaces with React, TypeScript, Tailwind CSS, and Python FastAPI backend APIs."
        }
        res = await client.post("/api/skill-intelligence/extract-skills", json=valid_payload)
        assert res.status_code == 200
        extracted = res.json()["skills"]
        extracted_names = [s["skill_name"] for s in extracted]
        assert "React" in extracted_names
        assert "TypeScript" in extracted_names
        assert "FastAPI" in extracted_names
        assert "Python" in extracted_names

        # Empty text
        empty_payload = {"resume_text": "   "}
        bad_res = await client.post("/api/skill-intelligence/extract-skills", json=empty_payload)
        assert bad_res.status_code == 400

        # Malformed PDF upload
        fake_files = {"file": ("corrupted.pdf", b"NOT_A_REAL_PDF_DATA", "application/pdf")}
        pdf_res = await client.post("/api/skill-intelligence/extract-skills-from-pdf", files=fake_files)
        assert pdf_res.status_code == 400

        # Non-PDF upload
        txt_files = {"file": ("resume.txt", b"Hello text", "text/plain")}
        non_pdf = await client.post("/api/skill-intelligence/extract-skills-from-pdf", files=txt_files)
        assert non_pdf.status_code == 400

    app.dependency_overrides.clear()


def _create_test_pdf(text: str) -> bytes:
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer)
    c.drawString(72, 750, text)
    c.save()
    return buffer.getvalue()


def _create_blank_pdf() -> bytes:
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer)
    c.showPage()
    c.save()
    return buffer.getvalue()


@pytest.mark.asyncio
async def test_pdf_extraction_regression_and_error_handling(db_session):
    """Regression tests for PDF skill extraction, multipart uploads, blank PDFs, and server errors."""
    # Seed a confirmed skill for student 1: Python
    s_confirmed = StudentSkill(
        user_id=student_1.id,
        skill_name="Python",
        normalized_name="python",
        category="Programming Languages",
        is_confirmed=True,
        status="Completed",
    )
    db_session.add(s_confirmed)
    await db_session.commit()

    valid_pdf_bytes = _create_test_pdf("Skills: Python, FastAPI, React, Docker, PostgreSQL")

    # 1. Unauthenticated upload rejected with 401
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        unauth_res = await client.post(
            "/api/skill-intelligence/extract-skills-from-pdf",
            files={"file": ("resume.pdf", valid_pdf_bytes, "application/pdf")},
        )
        assert unauth_res.status_code == 401

    app.dependency_overrides[get_current_active_user] = lambda: student_1
    app.dependency_overrides[get_db] = lambda: db_session

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 2. Valid PDF upload extracts selectable skills and marks confirmed skills
        pdf_res = await client.post(
            "/api/skill-intelligence/extract-skills-from-pdf",
            files={"file": ("my_resume.pdf", valid_pdf_bytes, "application/pdf")},
        )
        assert pdf_res.status_code == 200
        data = pdf_res.json()
        assert data["source_type"] == "pdf_upload"
        assert data["total_extracted"] >= 4
        skill_names = [s["skill_name"] for s in data["skills"]]
        assert "FastAPI" in skill_names
        assert "React" in skill_names
        assert "Docker" in skill_names

        # Verify already_confirmed flag
        python_skill = next(s for s in data["skills"] if s["skill_name"] == "Python")
        assert python_skill["already_confirmed"] is True
        assert python_skill["current_status"] == "Completed"

        # Verify suggested roles
        assert len(data["suggested_roles"]) > 0

        # 3. Blank PDF (has valid %PDF- header but no selectable text)
        blank_pdf_bytes = _create_blank_pdf()
        blank_res = await client.post(
            "/api/skill-intelligence/extract-skills-from-pdf",
            files={"file": ("blank.pdf", blank_pdf_bytes, "application/pdf")},
        )
        assert blank_res.status_code == 400
        assert "Could not extract readable text from the provided PDF. Please ensure it contains selectable text." in blank_res.json()["detail"]

        # 4. Corrupted PDF with %PDF- header but invalid stream
        corrupt_bytes = b"%PDF-1.4\ncorrupt body data that breaks all engines"
        corrupt_res = await client.post(
            "/api/skill-intelligence/extract-skills-from-pdf",
            files={"file": ("corrupt.pdf", corrupt_bytes, "application/pdf")},
        )
        assert corrupt_res.status_code == 400
        assert "Corrupted or invalid PDF document: unable to parse pages" in corrupt_res.json()["detail"]

        # 5. Empty PDF file (< 10 bytes)
        empty_res = await client.post(
            "/api/skill-intelligence/extract-skills-from-pdf",
            files={"file": ("empty.pdf", b"", "application/pdf")},
        )
        assert empty_res.status_code == 400
        assert "The uploaded file is empty or too small" in empty_res.json()["detail"]

        # 6. Non-PDF upload
        txt_res = await client.post(
            "/api/skill-intelligence/extract-skills-from-pdf",
            files={"file": ("doc.txt", b"plain text", "text/plain")},
        )
        assert txt_res.status_code == 400
        assert "Invalid file format" in txt_res.json()["detail"]

        # 7. Server-side missing engines raises 503 instead of misleading 400
        with patch("app.api.routes.skill_intelligence.extract_text_from_pdf", side_effect=RuntimeError("PDF text extraction service is not configured on the server. Please contact support.")):
            missing_engine_res = await client.post(
                "/api/skill-intelligence/extract-skills-from-pdf",
                files={"file": ("test.pdf", valid_pdf_bytes, "application/pdf")},
            )
            assert missing_engine_res.status_code == 503
            assert "PDF text extraction service is not configured on the server" in missing_engine_res.json()["detail"]

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_duplicate_skills_normalization(db_session):
    """4. Duplicate skills with differences in capitalization or naming are deduplicated."""
    app.dependency_overrides[get_current_active_user] = lambda: student_1
    app.dependency_overrides[get_db] = lambda: db_session
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Add "react.js" and later "React"
        payload = {
            "skills": [
                {"skill_name": "react.js", "category": "Frameworks & Libraries", "status": "Learning"},
                {"skill_name": "React", "category": "Frameworks & Libraries", "status": "Learning"},
                {"skill_name": "reactjs", "category": "Frameworks & Libraries", "status": "Completed"},
            ]
        }
        res = await client.post("/api/skill-intelligence/skills", json=payload)
        assert res.status_code == 201

        # Check total skills saved
        list_res = await client.get("/api/skill-intelligence/skills")
        assert list_res.status_code == 200
        skills = list_res.json()
        assert len(skills) == 1
        assert skills[0]["skill_name"] == "React"
        assert skills[0]["status"] == "Completed"

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_skill_gap_analysis(db_session):
    """5. Skill-gap analysis identifies missing and matched skills against target role."""
    # Seed confirmed skills for student 1: React, JavaScript
    s1 = StudentSkill(user_id=student_1.id, skill_name="React", normalized_name="react", is_confirmed=True)
    s2 = StudentSkill(user_id=student_1.id, skill_name="JavaScript", normalized_name="javascript", is_confirmed=True)
    db_session.add_all([s1, s2])
    await db_session.commit()

    gap = await analyze_role_skill_gap(db_session, student_1.id, "Frontend Developer")
    matched_names = [s["name"] for s in gap["matched_skills"]]
    missing_names = [s["name"] for s in gap["missing_skills"]]

    assert "React" in matched_names
    assert "JavaScript" in matched_names
    assert "TypeScript" in missing_names
    assert "Tailwind CSS" in missing_names
    assert gap["matched_skills_count"] >= 2
    assert gap["coverage_percentage"] > 0


@pytest.mark.asyncio
async def test_recommendations_scoring_and_explanations(db_session):
    """6 & 7. Recommendations use correct target role, confirmed skills, and valid priorities."""
    # Seed target role: Backend Developer
    pref = StudentTargetRole(user_id=student_1.id, target_role="Backend Developer", experience_level="Student / Entry Level")
    db_session.add(pref)
    await db_session.commit()

    recs = await generate_skill_recommendations(db_session, student_1.id, "Backend Developer")
    assert recs["target_role"] == "Backend Developer"
    assert recs["total_recommendations"] > 0
    assert len(recs["items"]) > 0

    first = recs["items"][0]
    assert first["priority"] in ["High", "Medium", "Low"]
    assert 0 <= first["priority_score"] <= 100
    assert len(first["reason"]) > 10
    assert "learning_stage" in first
    assert "prerequisites" in first
    assert "estimated_duration" in first


@pytest.mark.asyncio
async def test_roadmap_ordering_respects_prerequisites(db_session):
    """8. Roadmap ordering arranges prerequisites before advanced skills."""
    roadmap = await generate_learning_roadmap(db_session, student_1.id, "Frontend Developer")
    assert len(roadmap["stages"]) == 4

    stage_1 = roadmap["stages"][0]
    stage_1_skills = [s["skill_name"] for s in stage_1["skills"]]
    assert "JavaScript" in stage_1_skills or "HTML5" in stage_1_skills

    stage_2 = roadmap["stages"][1]
    stage_2_skills = [s["skill_name"] for s in stage_2["skills"]]
    assert "React" in stage_2_skills or "Tailwind CSS" in stage_2_skills


@pytest.mark.asyncio
async def test_progress_status_persistence_and_validation(db_session):
    """9. Progress updates persist across states and reject invalid status values."""
    app.dependency_overrides[get_current_active_user] = lambda: student_1
    app.dependency_overrides[get_db] = lambda: db_session
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create a skill
        add_res = await client.post(
            "/api/skill-intelligence/skills",
            json={"skills": [{"skill_name": "Docker", "status": "Not Started"}]},
        )
        assert add_res.status_code == 201
        skill_id = add_res.json()[0]["id"]

        # Transition to Learning
        res_learn = await client.put(f"/api/skill-intelligence/skills/{skill_id}", json={"status": "Learning"})
        assert res_learn.status_code == 200
        assert res_learn.json()["status"] == "Learning"

        # Transition to Practiced
        res_prac = await client.put(f"/api/skill-intelligence/skills/{skill_id}", json={"status": "Practiced"})
        assert res_prac.status_code == 200
        assert res_prac.json()["status"] == "Practiced"

        # Transition to Completed
        res_comp = await client.put(f"/api/skill-intelligence/skills/{skill_id}", json={"status": "Completed"})
        assert res_comp.status_code == 200
        assert res_comp.json()["status"] == "Completed"

        # Reject invalid status
        res_inv = await client.put(f"/api/skill-intelligence/skills/{skill_id}", json={"status": "Expert Master"})
        assert res_inv.status_code == 422

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_dashboard_summary_card_metrics(db_session):
    """10 & 12. Dashboard summary accurately computes real metrics and handles empty new-student state."""
    app.dependency_overrides[get_current_active_user] = lambda: student_1
    app.dependency_overrides[get_db] = lambda: db_session
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Empty state: no target role saved yet
        sum_res = await client.get("/api/skill-intelligence/dashboard-summary")
        assert sum_res.status_code == 200
        data = sum_res.json()
        assert data["has_target_role"] is False
        assert data["target_role"] is None
        assert data["completion_percentage"] == 0.0

        # Set target role
        await client.put(
            "/api/skill-intelligence/target-role",
            json={"target_role": "Python Developer", "experience_level": "Beginner"},
        )

        # Confirm a skill as Completed
        await client.post(
            "/api/skill-intelligence/skills",
            json={"skills": [{"skill_name": "Python", "status": "Completed"}]},
        )

        # Check summary again
        sum_res2 = await client.get("/api/skill-intelligence/dashboard-summary")
        assert sum_res2.status_code == 200
        data2 = sum_res2.json()
        assert data2["has_target_role"] is True
        assert data2["target_role"] == "Python Developer"
        assert len(data2["top_recommendations"]) > 0
        assert data2["progress_summary"]["completed"] >= 1
        assert data2["completion_percentage"] > 0

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_project_suggestions_return_only_existing_projects(db_session):
    """11. Project suggestions return only published existing projects matching skills."""
    # Seed a real published project teaching React and Node.js
    proj = Project(
        owner_id=student_1.id,
        title="Interactive E-Commerce Platform",
        slug="interactive-ecommerce-platform",
        short_description="Full-stack shopping application built with React, Node.js, and PostgreSQL.",
        problem_statement="Modern web storefront needing fast checkout.",
        tech_stack=["React", "Node.js", "PostgreSQL", "Tailwind CSS"],
        difficulty="Intermediate",
        status="Published",
    )
    db_session.add(proj)
    await db_session.commit()

    app.dependency_overrides[get_current_active_user] = lambda: student_1
    app.dependency_overrides[get_db] = lambda: db_session
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/skill-intelligence/project-suggestions?target_role=Frontend%20Developer")
        assert res.status_code == 200
        suggestions = res.json()
        assert len(suggestions) > 0
        assert suggestions[0]["slug"] == "interactive-ecommerce-platform"
        assert "React" in suggestions[0]["tech_stack"]

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_ai_advice_fallback_on_unconfigured_or_failure(db_session):
    """13. AI advice falls back gracefully to structured engine without crashing."""
    app.dependency_overrides[get_current_active_user] = lambda: student_1
    app.dependency_overrides[get_db] = lambda: db_session
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/api/skill-intelligence/ai-advice",
            json={"custom_question": "How do I best study for technical interviews?"},
        )
        assert res.status_code == 200
        data = res.json()
        assert len(data["advice"]) > 50
        assert data["source"] in ["structured-mentor-engine", "gemini-ai"]

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_mentor_chat_conversation_flow(db_session):
    """14. Conversational AI Mentor returns grounded response and follow-up prompts."""
    # Seed target role for student
    pref = StudentTargetRole(
        user_id=student_1.id,
        target_role="Frontend Developer",
        experience_level="Student / Entry Level",
    )
    db_session.add(pref)
    await db_session.commit()

    app.dependency_overrides[get_current_active_user] = lambda: student_1
    app.dependency_overrides[get_db] = lambda: db_session
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # First turn
        res = await client.post(
            "/api/skill-intelligence/mentor-chat",
            json={
                "messages": [
                    {"role": "user", "content": "What should I prioritize first for Frontend Developer?"}
                ]
            },
        )
        assert res.status_code == 200
        data = res.json()
        assert "reply" in data
        assert len(data["reply"]) > 50
        assert data["target_role"] == "Frontend Developer"
        assert isinstance(data["suggested_followups"], list)
        assert len(data["suggested_followups"]) > 0

        # Follow-up turn with message history
        res_turn2 = await client.post(
            "/api/skill-intelligence/mentor-chat",
            json={
                "messages": [
                    {"role": "user", "content": "What should I prioritize first for Frontend Developer?"},
                    {"role": "assistant", "content": data["reply"]},
                    {"role": "user", "content": "What project should I build to showcase this?"},
                ]
            },
        )
        assert res_turn2.status_code == 200
        data2 = res_turn2.json()
        assert len(data2["reply"]) > 50

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_mentor_chat_validation_rejects_empty(db_session):
    """15. Mentor chat rejects empty messages or invalid conversation turns."""
    app.dependency_overrides[get_current_active_user] = lambda: student_1
    app.dependency_overrides[get_db] = lambda: db_session
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Empty messages list
        res_empty = await client.post(
            "/api/skill-intelligence/mentor-chat",
            json={"messages": []},
        )
        assert res_empty.status_code in (400, 422)

        # Trailing message not from user
        res_invalid_role = await client.post(
            "/api/skill-intelligence/mentor-chat",
            json={"messages": [{"role": "assistant", "content": "Hello"}]},
        )
        assert res_invalid_role.status_code == 400

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_career_fit_reassessment(db_session):
    """16. Career fit reassessment recalculates match score, tracks delta, and highlights improved skills."""
    pref = StudentTargetRole(
        user_id=student_1.id,
        target_role="Frontend Developer",
        experience_level="Student / Entry Level",
        preferences={"current_match_percentage": 20.0},
    )
    db_session.add(pref)
    # Add newly practiced skill
    s1 = StudentSkill(
        user_id=student_1.id,
        skill_name="React",
        normalized_name="react",
        status="Completed",
        is_confirmed=True,
    )
    s2 = StudentSkill(
        user_id=student_1.id,
        skill_name="TypeScript",
        normalized_name="typescript",
        status="Practiced",
        is_confirmed=True,
    )
    db_session.add_all([s1, s2])
    await db_session.commit()

    app.dependency_overrides[get_current_active_user] = lambda: student_1
    app.dependency_overrides[get_db] = lambda: db_session
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post("/api/skill-intelligence/reassess?target_role=Frontend%20Developer")
        assert res.status_code == 200
        data = res.json()
        assert data["target_role"] == "Frontend Developer"
        assert "score_delta" in data
        assert "improved_skills" in data
        assert "React" in data["improved_skills"]
        assert "TypeScript" in data["improved_skills"]
        assert len(data["explanation"]) > 20
        assert "career_readiness_impact" in data

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_resource_progress_tracking(db_session):
    """17. Persist learning resource progress (started | completed) per student."""
    app.dependency_overrides[get_current_active_user] = lambda: student_1
    app.dependency_overrides[get_db] = lambda: db_session
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Mark resource as started
        payload = {
            "resource_url": "https://react.dev/",
            "skill_name": "React",
            "status": "started",
        }
        res_started = await client.post("/api/skill-intelligence/resource-progress", json=payload)
        assert res_started.status_code == 200
        assert res_started.json()["status"] == "started"

        # Verify decorated in recommendations
        rec_res = await client.get("/api/skill-intelligence/recommendations?target_role=Frontend%20Developer")
        assert rec_res.status_code == 200
        items = rec_res.json()["items"]
        react_item = next((i for i in items if i["skill_name"] == "React"), None)
        assert react_item is not None
        react_res = next((r for r in react_item["resources"] if r["url"] == "https://react.dev/"), None)
        assert react_res is not None
        assert react_res["status"] == "started"

        # Mark resource as completed
        payload["status"] = "completed"
        res_completed = await client.post("/api/skill-intelligence/resource-progress", json=payload)
        assert res_completed.status_code == 200
        assert res_completed.json()["status"] == "completed"

    app.dependency_overrides.clear()

