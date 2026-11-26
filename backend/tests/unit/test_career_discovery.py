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


def test_generate_assessment_questions_exactly_five():
    interests = ["Python Development", "Web Development"]
    questions = CareerDiscoveryService.generate_assessment_questions(interests, "beginner")

    # The assessment must contain EXACTLY 5 questions
    assert len(questions) == 5
    for q in questions:
        # Answers and explanations should not be exposed to client in the question prompt
        assert "correct_option" not in q
        assert "explanation" not in q
        assert "id" in q
        assert "options" in q
        assert len(q["options"]) == 4


def test_evaluate_assessment_five_questions_scenarios():
    # Includes swe-01 (BST average complexity question from user issue)
    questions = [
        {"id": "swe-01", "domain": "Software Engineering", "question": "BST search", "concept": "Complexity"},
        {"id": "py-01", "domain": "Python Development", "question": "Immutability", "concept": "Types"},
        {"id": "py-02", "domain": "Python Development", "question": "OOP init", "concept": "OOP"},
        {"id": "web-01", "domain": "Web Development", "question": "Status 201", "concept": "HTTP"},
        {"id": "web-02", "domain": "Web Development", "question": "CORS", "concept": "Security"},
    ]

    # Scenario 1: All 5 correct (swe-01: B, py-01: B, py-02: B, web-01: B, web-02: B)
    all_correct = {
        "swe-01": "B",
        "py-01": "B",
        "py-02": "B",
        "web-01": "B",
        "web-02": "B",
    }
    res_perfect = CareerDiscoveryService.evaluate_assessment(questions, all_correct)
    assert res_perfect["total"] == 5
    assert res_perfect["score"] == 5
    assert res_perfect["accuracy_percentage"] == 100.0
    assert res_perfect["level_label"] == "Strong Foundation"

    # Specific check: BST question evaluates O(log n) (Option B) as correct
    bst_detail = next(d for d in res_perfect["details"] if d["id"] == "swe-01")
    assert bst_detail["is_correct"] is True
    assert bst_detail["correct_answer"] == "B"

    # Scenario 2: All 5 incorrect
    all_incorrect = {q["id"]: "Z" for q in questions}
    res_zero = CareerDiscoveryService.evaluate_assessment(questions, all_incorrect)
    assert res_zero["total"] == 5
    assert res_zero["score"] == 0
    assert res_zero["accuracy_percentage"] == 0.0

    # Scenario 3: Mixed (3 correct, 2 incorrect)
    mixed = {
        "swe-01": "B",  # Correct
        "py-01": "B",   # Correct
        "py-02": "A",   # Incorrect
        "web-01": "B",  # Correct
        "web-02": "C",  # Incorrect
    }
    res_mixed = CareerDiscoveryService.evaluate_assessment(questions, mixed)
    assert res_mixed["total"] == 5
    assert res_mixed["score"] == 3
    assert res_mixed["accuracy_percentage"] == 60.0
    assert res_mixed["level_label"] == "Developing Competence"

    # Scenario 4: Incomplete / partially answered
    incomplete = {"swe-01": "B"}
    res_incomplete = CareerDiscoveryService.evaluate_assessment(questions, incomplete)
    assert res_incomplete["total"] == 5
    assert res_incomplete["score"] == 1


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


@pytest.mark.asyncio
async def test_get_career_discovery_summary_admin_and_student_roles():
    import uuid
    from unittest.mock import AsyncMock, MagicMock
    from app.api.routes.career_discovery import get_career_discovery_summary
    from app.models.user import User, UserRole
    from app.models.career_discovery import StudentCareerDiscovery

    # 1. Admin should receive show_card = False
    admin_user = User(id=uuid.uuid4(), email="admin@aspirepath.com", role=UserRole.ADMIN, full_name="Admin User")
    mock_db = AsyncMock()

    admin_summary = await get_career_discovery_summary(db=mock_db, current_user=admin_user)
    assert admin_summary == {"show_card": False}

    # 2. Incomplete student should receive show_card = True, is_completed = False
    student_user = User(id=uuid.uuid4(), email="student@aspirepath.com", role=UserRole.STUDENT, full_name="Student User")
    incomplete_disc = StudentCareerDiscovery(
        id=uuid.uuid4(),
        user_id=student_user.id,
        status="questionnaire_in_progress",
        current_step=3,
    )
    CareerDiscoveryService.get_or_create_discovery = AsyncMock(return_value=incomplete_disc)

    student_summary = await get_career_discovery_summary(db=mock_db, current_user=student_user)
    assert student_summary["show_card"] is True
    assert student_summary["is_completed"] is False
    assert student_summary["status"] == "questionnaire_in_progress"
    assert student_summary["current_step"] == 3

    # 3. Completed student should receive strengths, skill_gaps, and recommended_roles
    completed_disc = StudentCareerDiscovery(
        id=uuid.uuid4(),
        user_id=student_user.id,
        status="completed",
        current_step=7,
        recommendations={
            "primary_role": {
                "role_name": "Full Stack Developer",
                "match_percentage": 92,
                "matched_skills": ["React", "Node.js"],
                "missing_skills": ["Docker", "Kubernetes"],
            },
            "top_roles": [
                {"role_name": "Full Stack Developer"},
                {"role_name": "Frontend Engineer"},
                {"role_name": "Backend Engineer"},
            ],
            "matched_jobs": [{"id": "job-1"}],
        },
        roadmap_progress=[
            {"stage_id": 1, "title": "Core Skill Acquisition", "status": "completed"},
            {"stage_id": 2, "title": "Practical Showcase Projects", "status": "in_progress"},
        ],
    )
    CareerDiscoveryService.get_or_create_discovery = AsyncMock(return_value=completed_disc)

    completed_summary = await get_career_discovery_summary(db=mock_db, current_user=student_user)
    assert completed_summary["show_card"] is True
    assert completed_summary["is_completed"] is True
    assert completed_summary["primary_role"] == "Full Stack Developer"
    assert completed_summary["match_percentage"] == 92
    assert "React" in completed_summary["strengths"]
    assert "Docker" in completed_summary["skill_gaps"]
    assert "Frontend Engineer" in completed_summary["recommended_roles"]
    assert completed_summary["next_stage"]["title"] == "Practical Showcase Projects"


