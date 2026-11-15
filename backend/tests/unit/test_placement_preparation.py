import pytest
from app.services.placement_prep_service import (
    validate_pdf_content,
    format_file_size,
    slugify,
    generate_sample_pdf,
    INITIAL_ROLE_CATALOG,
)
from app.models.placement_preparation import (
    PreparationRole,
    PreparationTopic,
    PreparationMaterial,
)


def test_format_file_size():
    assert format_file_size(500) == "500 B"
    assert format_file_size(2048) == "2.0 KB"
    assert format_file_size(1048576 * 3) == "3.0 MB"


def test_slugify():
    assert slugify("Python Developer") == "python-developer"
    assert slugify("Software Tester / QA Engineer") == "software-tester-qa-engineer"
    assert slugify("Data Structures & Algorithms") == "data-structures-algorithms"


def test_validate_pdf_content():
    # Empty bytes
    valid, err = validate_pdf_content(b"")
    assert not valid
    assert "empty" in err.lower()

    # Invalid header
    valid, err = validate_pdf_content(b"NOT_A_PDF_DOCUMENT_CONTENT")
    assert not valid
    assert "header" in err.lower() or "invalid" in err.lower()

    # Valid PDF bytes
    valid, err = validate_pdf_content(b"%PDF-1.4\n1 0 obj\n<<>>\nendobj")
    assert valid
    assert err is None


def test_generate_sample_pdf():
    sections = [
        {
            "heading": "1. Python Concurrency",
            "paragraphs": ["Threading vs Multiprocessing in Python."],
            "code": "import asyncio\nprint('async')",
        }
    ]
    pdf_bytes = generate_sample_pdf("Test Preparation Guide", "AspirePath Series", sections)
    assert pdf_bytes.startswith(b"%PDF-")
    assert len(pdf_bytes) > 500


def test_initial_catalog_structure():
    assert len(INITIAL_ROLE_CATALOG) == 7
    role_names = [r["name"] for r in INITIAL_ROLE_CATALOG]
    assert "Python Developer" in role_names
    assert "Java Developer" in role_names
    assert "Frontend Developer" in role_names
    assert "Backend Developer" in role_names
    assert "Data Analyst" in role_names
    assert "Software Tester / QA Engineer" in role_names
    assert "Cloud / DevOps Engineer" in role_names


def test_models_instantiation():
    role = PreparationRole(
        name="Python Developer",
        slug="python-developer",
        icon_name="Terminal",
        description="Python placement track",
        display_order=1,
        is_active=True,
    )
    assert role.name == "Python Developer"
    assert role.icon_name == "Terminal"
    assert role.is_active is True

    topic = PreparationTopic(
        role_id=role.id,
        name="Python Fundamentals",
        slug="python-fundamentals",
        display_order=1,
    )
    assert topic.name == "Python Fundamentals"

    material = PreparationMaterial(
        role_id=role.id,
        topic_id=topic.id,
        title="Python Guide",
        file_path="uploads/placement_materials/sample.pdf",
        file_name="sample.pdf",
        file_size_bytes=1024,
        is_published=True,
        download_count=0,
    )
    assert material.title == "Python Guide"
    assert material.is_published is True
    assert material.download_count == 0
