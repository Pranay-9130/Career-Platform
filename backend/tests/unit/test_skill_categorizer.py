import pytest
from app.services.skill_categorizer import categorize_skills, categorize_single_skill
from app.services.pdf_generator import generate_resume_pdf


def test_programming_languages_only():
    input_skills = ["Python", "Java", "C++", "TypeScript", "Rust"]
    categorized = categorize_skills(input_skills)

    assert len(categorized) == 1
    assert categorized[0][0] == "Programming Languages"
    assert categorized[0][1] == ["Python", "Java", "C++", "TypeScript", "Rust"]


def test_mixed_technical_skills_matches_specification():
    input_skills = ["Python", "Java", "HTML", "CSS", "React", "FastAPI", "MySQL", "Git", "Postman"]
    categorized = categorize_skills(input_skills)

    cat_map = dict(categorized)
    assert cat_map["Programming Languages"] == ["Python", "Java"]
    assert cat_map["Frontend"] == ["HTML", "CSS", "React"]
    assert cat_map["Backend"] == ["FastAPI"]
    assert cat_map["Databases"] == ["MySQL"]
    assert cat_map["Tools"] == ["Git", "Postman"]


def test_non_programming_skills():
    input_skills = ["Communication", "Leadership", "Excel", "Figma", "AWS", "Docker"]
    categorized = categorize_skills(input_skills)

    cat_map = dict(categorized)
    assert cat_map["Soft Skills"] == ["Communication", "Leadership"]
    assert cat_map["Tools"] == ["Excel"]
    assert cat_map["Design"] == ["Figma"]
    assert cat_map["Cloud & DevOps"] == ["AWS", "Docker"]


def test_custom_or_unfamiliar_skills():
    input_skills = ["Python", "Quantum Circuit Design", "Neurobiology Mapping"]
    categorized = categorize_skills(input_skills)

    cat_map = dict(categorized)
    assert cat_map["Programming Languages"] == ["Python"]
    assert cat_map["Other Skills"] == ["Quantum Circuit Design", "Neurobiology Mapping"]


def test_single_unfamiliar_skill_uses_clean_layout():
    input_skills = ["Quantum Circuit Design", "Neurobiology Mapping"]
    categorized = categorize_skills(input_skills)

    assert len(categorized) == 1
    # Category name is empty string for clean layout without unnecessary headings
    assert categorized[0][0] == ""
    assert categorized[0][1] == ["Quantum Circuit Design", "Neurobiology Mapping"]


def test_empty_and_null_skills():
    assert categorize_skills([]) == []
    assert categorize_skills(None) == []


def test_duplicate_skills_deduplication():
    input_skills = ["Python", "python", "PYTHON", "React", "react", "FASTAPI", "FastAPI"]
    categorized = categorize_skills(input_skills)

    cat_map = dict(categorized)
    assert cat_map["Programming Languages"] == ["Python"]
    assert cat_map["Frontend"] == ["React"]
    assert cat_map["Backend"] == ["FASTAPI"]


def test_pdf_generation_renders_categorized_skills():
    sample_data = {
        "title": "Full Stack Engineer Resume",
        "personal_info": {
            "full_name": "Alex Rivera",
            "email": "alex.rivera@example.com",
            "phone": "+1 555-019-2834",
        },
        "skills": ["Python", "Java", "HTML", "CSS", "React", "FastAPI", "MySQL", "Git", "Postman"],
        "education": [],
        "experience": [],
        "projects": [],
    }

    pdf_bytes = generate_resume_pdf(sample_data)
    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 1000
    assert pdf_bytes.startswith(b"%PDF-")
