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

