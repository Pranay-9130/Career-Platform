import pytest
from app.services.career_discovery_service import CareerDiscoveryService, QUESTION_BANK


def test_question_bank_structure():
    assert len(QUESTION_BANK) >= 15
    for q in QUESTION_BANK:
        assert "id" in q
        assert "domain" in q
        assert "difficulty" in q
        assert "question" in q
        assert "options" in q
        assert len(q["options"]) == 4
        assert "correct_option" in q
        assert q["correct_option"] in ["A", "B", "C", "D"]
        assert "explanation" in q
        assert "concept" in q


def test_generate_assessment_questions_beginner():
    interests = ["Python Development", "Web Development"]
    questions = CareerDiscoveryService.generate_assessment_questions(interests, "beginner")

    assert 5 <= len(questions) <= 7
    for q in questions:
        # Answers and explanations should not be exposed to client in the question prompt
        assert "correct_option" not in q
        assert "explanation" not in q
        assert "id" in q
        assert "options" in q


def test_evaluate_assessment():
    questions = [
        {"id": "py-01", "domain": "Python Development", "question": "q1", "concept": "c1"},
        {"id": "java-01", "domain": "Java Development", "question": "q2", "concept": "c2"},
    ]

    # py-01 correct answer is B, java-01 correct answer is B
    answers = {
        "py-01": "B",
        "java-01": "A",  # incorrect
    }

    result = CareerDiscoveryService.evaluate_assessment(questions, answers)

    assert result["total"] == 2
    assert result["score"] == 1
    assert result["accuracy_percentage"] == 50.0
    assert result["level_label"] == "Developing Competence"
    assert "disclaimer" in result
    assert "Python Development" in result["domain_breakdown"]
    assert result["domain_breakdown"]["Python Development"]["correct"] == 1
    assert result["domain_breakdown"]["Java Development"]["correct"] == 0


def test_student_career_discovery_model_uuid_foreign_key():
    import uuid
    from sqlalchemy import Uuid
    from app.models.career_discovery import StudentCareerDiscovery
    from app.models.user import User

    # Check user_id column type
    user_id_col = StudentCareerDiscovery.__table__.c.user_id
    assert isinstance(user_id_col.type, Uuid), f"user_id must be Uuid, got {type(user_id_col.type)}"
    assert user_id_col.unique is True
    assert user_id_col.nullable is False

    # Check foreign key reference
    foreign_keys = list(user_id_col.foreign_keys)
    assert len(foreign_keys) == 1
    fk = foreign_keys[0]
    assert fk.target_fullname == "users.id"
    assert fk.ondelete.upper() == "CASCADE"

    # Verify type matches User.id
    user_pk_col = User.__table__.c.id
    assert type(user_id_col.type) == type(user_pk_col.type)

    # Verify to_dict serializes UUIDs cleanly
    sample_user_id = uuid.uuid4()
    sample_id = uuid.uuid4()
    discovery = StudentCareerDiscovery(
        id=sample_id,
        user_id=sample_user_id,
        status="not_started",
        current_step=1,
    )
    d = discovery.to_dict()
    assert d["id"] == str(sample_id)
    assert d["user_id"] == str(sample_user_id)


@pytest.mark.asyncio
async def test_generate_recommendations_json_serializability():
    import json
    import uuid
    from unittest.mock import AsyncMock, MagicMock
    from app.models.project import Project
    from app.models.job import Job
    from app.models.placement_preparation import PreparationMaterial

    mock_db = AsyncMock()

    proj = Project(
        id=uuid.uuid4(),
        title="Distributed Task Queue",
        slug="distributed-task-queue",
        domain="Backend",
        tech_stack="Python, FastAPI, Redis",
        difficulty="Intermediate",
        status="Published",
    )
    job = Job(
        id=uuid.uuid4(),
        title="Backend Software Engineer",
        company_name="Tech Corp",
        location="Remote",
        job_type="Full-time",
        work_mode="Remote",
        domain="Backend Development",
        skills_required="Python, FastAPI, PostgreSQL",
        is_active=True,
    )
    mat = PreparationMaterial(
        id=str(uuid.uuid4()),
        role_id=str(uuid.uuid4()),
        topic_id=str(uuid.uuid4()),
        title="Python Interview Preparation Guide",
        file_name="guide.pdf",
    )

    mock_scalars_project = MagicMock()
    mock_scalars_project.all.return_value = [proj]

    mock_scalars_mat = MagicMock()
    mock_scalars_mat.all.return_value = [mat]

    mock_scalars_job = MagicMock()
    mock_scalars_job.all.return_value = [job]

    mock_db.scalars.side_effect = [
        mock_scalars_project,
        mock_scalars_mat,
        mock_scalars_job,
    ]

    discovery_data = {
        "technical_interests": ["Python Development", "Web Development"],
        "self_reported_skills": ["Python", "FastAPI"],
        "assessment_result": {"accuracy_percentage": 85.0},
    }

    recs = await CareerDiscoveryService.generate_recommendations(discovery_data, mock_db)

    # Must be 100% JSON serializable (NO native UUIDs in projects, jobs, or materials)
    dumped = json.dumps(recs)
    assert dumped is not None
    loaded = json.loads(dumped)

    assert loaded["primary_role"]["role_name"] in ["Python Developer", "Backend Developer"]
    assert len(loaded["recommended_projects"]) == 1
    assert loaded["recommended_projects"][0]["id"] == str(proj.id)
    assert len(loaded["matched_jobs"]) == 1
    assert loaded["matched_jobs"][0]["id"] == str(job.id)
    assert len(loaded["roadmap"]) == 7


