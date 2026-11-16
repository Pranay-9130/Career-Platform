import os
import re
import uuid
import logging
from pathlib import Path
from typing import Optional, Tuple
from io import BytesIO

from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

logger = logging.getLogger(__name__)

UPLOAD_DIR = Path("uploads/placement_materials")
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB


def get_upload_dir() -> Path:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    return UPLOAD_DIR


def slugify(text: str) -> str:
    cleaned = re.sub(r"[^\w\s-]", "", text.strip().lower())
    return re.sub(r"[-\s]+", "-", cleaned).strip("-")


def format_file_size(size_bytes: int) -> str:
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.1f} MB"


def validate_pdf_content(file_bytes: bytes) -> Tuple[bool, Optional[str]]:
    """
    Validates that the uploaded content is a legitimate PDF file.
    Checks file size and PDF magic bytes.
    """
    if not file_bytes or len(file_bytes) == 0:
        return False, "Uploaded file is empty."
    if len(file_bytes) > MAX_FILE_SIZE:
        return False, f"File size exceeds the 25MB limit ({format_file_size(len(file_bytes))})."
    if not file_bytes.startswith(b"%PDF-"):
        return False, "Invalid file format: File header does not match a valid PDF document."
    return True, None


def get_pdf_page_count(file_path: Path) -> int:
    """
    Counts pages in a PDF file using pypdf or PyMuPDF, with graceful fallback.
    """
    try:
        from pypdf import PdfReader
        reader = PdfReader(str(file_path))
        return max(1, len(reader.pages))
    except Exception:
        try:
            import fitz
            doc = fitz.open(str(file_path))
            count = len(doc)
            doc.close()
            return max(1, count)
        except Exception as e:
            logger.warning(f"Failed to extract page count from {file_path}: {e}")
            return 1


def generate_sample_pdf(title: str, subtitle: str, content_sections: list) -> bytes:
    """
    Generates a clean, professional technical preparation PDF using ReportLab.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#1E3A8A"),
        spaceAfter=6,
    )
    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#3B82F6"),
        spaceAfter=14,
    )
    section_heading_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#0F172A"),
        spaceBefore=12,
        spaceAfter=6,
    )
    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=15,
        textColor=colors.HexColor("#334155"),
        spaceAfter=8,
    )
    code_style = ParagraphStyle(
        "CodeBlock",
        parent=styles["Normal"],
        fontName="Courier",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1E293B"),
        backColor=colors.HexColor("#F1F5F9"),
        borderColor=colors.HexColor("#CBD5E1"),
        borderWidth=1,
        borderPadding=6,
        spaceAfter=10,
    )

    elements = [
        Paragraph(title, title_style),
        Paragraph(subtitle, subtitle_style),
        HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#3B82F6"), spaceAfter=14),
    ]

    for section in content_sections:
        elements.append(Paragraph(section["heading"], section_heading_style))
        for paragraph in section.get("paragraphs", []):
            elements.append(Paragraph(paragraph, body_style))
        if "code" in section:
            elements.append(Paragraph(section["code"], code_style))
        elements.append(Spacer(1, 8))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()


# Initial Roles and Topics definitions
INITIAL_ROLE_CATALOG = [
    {
        "name": "Python Developer",
        "slug": "python-developer",
        "icon_name": "Terminal",
        "display_order": 1,
        "description": "Master core Python syntax, OOP, algorithms, SQL queries, memory management, and backend interview challenges.",
        "topics": [
            "Python Fundamentals",
            "Data Structures",
            "OOP",
            "Exception Handling",
            "Advanced Python",
            "SQL",
            "Coding Questions",
            "Interview Questions",
        ],
    },
    {
        "name": "Java Developer",
        "slug": "java-developer",
        "icon_name": "Code",
        "display_order": 2,
        "description": "Comprehensive guides on Java OOP, Collections, Multithreading, JVM internals, Spring basics, and coding questions.",
        "topics": [
            "Java Fundamentals",
            "OOP",
            "Collections",
            "Exception Handling",
            "Multithreading",
            "SQL",
            "Coding Questions",
            "Interview Questions",
        ],
    },
    {
        "name": "Frontend Developer",
        "slug": "frontend-developer",
        "icon_name": "Layout",
        "display_order": 3,
        "description": "HTML5, CSS3, modern JavaScript ES6+, React ecosystem, DOM manipulation, state management, and web performance.",
        "topics": [
            "HTML",
            "CSS",
            "JavaScript",
            "React",
            "Web Development",
            "Interview Questions",
        ],
    },
    {
        "name": "Backend Developer",
        "slug": "backend-developer",
        "icon_name": "Server",
        "display_order": 4,
        "description": "REST APIs, database optimization, caching, authentication, microservices architecture, and scalable system design.",
        "topics": [
            "Python / Java / Node.js",
            "REST APIs",
            "Databases",
            "SQL",
            "Authentication",
            "Backend Interview Questions",
        ],
    },
    {
        "name": "Data Analyst",
        "slug": "data-analyst",
        "icon_name": "BarChart3",
        "display_order": 5,
        "description": "SQL data extraction, Python Pandas, descriptive statistics, visualization with Power BI, and exploratory data analysis.",
        "topics": [
            "SQL",
            "Python",
            "Pandas",
            "Statistics",
            "Excel",
            "Power BI",
            "Data Analysis Questions",
        ],
    },
    {
        "name": "Software Tester / QA Engineer",
        "slug": "software-tester-qa-engineer",
        "icon_name": "CheckSquare",
        "display_order": 6,
        "description": "Manual testing methodologies, SDLC & STLC, test case writing, bug life cycle, API testing, and automation suites.",
        "topics": [
            "Manual Testing",
            "SDLC and STLC",
            "Test Cases",
            "Bug Life Cycle",
            "API Testing",
            "Automation Testing",
        ],
    },
    {
        "name": "Cloud / DevOps Engineer",
        "slug": "cloud-devops-engineer",
        "icon_name": "Cloud",
        "display_order": 7,
        "description": "Linux internals, networking, Docker containerization, Kubernetes orchestration, CI/CD pipelines, and AWS cloud basics.",
        "topics": [
            "Linux",
            "Networking",
            "AWS",
            "Docker",
            "Kubernetes",
            "CI/CD",
        ],
    },
]


async def seed_placement_preparation_defaults(session):
    """
    Seeds initial preparation roles, topics, and initial sample materials for Python Developer.
    """
    from sqlalchemy import select, func
    from app.models.placement_preparation import (
        PreparationRole,
        PreparationTopic,
        PreparationMaterial,
    )

    stmt_count = select(func.count(PreparationRole.id))
    role_count = (await session.execute(stmt_count)).scalar() or 0

    if role_count > 0:
        return

    logger.info("Seeding default Placement Preparation roles, topics, and sample materials...")
    upload_dir = get_upload_dir()

    created_roles = {}
    created_topics = {}

    for r_idx, r_data in enumerate(INITIAL_ROLE_CATALOG):
        role = PreparationRole(
            name=r_data["name"],
            slug=r_data["slug"],
            icon_name=r_data["icon_name"],
            description=r_data["description"],
            display_order=r_data["display_order"],
            is_active=True,
        )
        session.add(role)
        await session.flush()
        created_roles[r_data["slug"]] = role

        for t_idx, topic_name in enumerate(r_data["topics"]):
            topic = PreparationTopic(
                role_id=role.id,
                name=topic_name,
                slug=slugify(topic_name),
                display_order=t_idx + 1,
            )
            session.add(topic)
            await session.flush()
            created_topics[(r_data["slug"], topic_name)] = topic

    # Seed 4 high-quality initial PDF materials for Python Developer
    python_role = created_roles.get("python-developer")
    if python_role:
        sample_materials = [
            {
                "title": "Python Fundamentals & Memory Management Guide",
                "topic_name": "Python Fundamentals",
                "filename": "python-fundamentals-guide.pdf",
                "description": "Complete breakdown of Python data types, mutability vs immutability, pass-by-assignment, memory management, and garbage collection mechanisms.",
                "sections": [
                    {
                        "heading": "1. Python Execution & Memory Model",
                        "paragraphs": [
                            "Python utilizes automatic reference counting combined with a generational garbage collector to identify and clean circular references.",
                            "Variables in Python act as named references pointing to memory addresses where objects reside, rather than static memory containers.",
                        ],
                        "code": "# Pass-by-object-reference Demonstration\ndef modify_list(items):\n    items.append('new_entry')\n\nnums = [1, 2, 3]\nmodify_list(nums)\nprint(nums)  # Output: [1, 2, 3, 'new_entry']",
                    },
                    {
                        "heading": "2. Mutable vs Immutable Objects",
                        "paragraphs": [
                            "Immutable: int, float, str, tuple, frozenset, bool. Any modification creates a new object in memory.",
                            "Mutable: list, dict, set, bytearray. Modifications update the existing object in-place without altering its memory ID.",
                        ],
                    },
                    {
                        "heading": "3. High-Frequency Interview Questions",
                        "paragraphs": [
                            "Q: What is the Python GIL (Global Interpreter Lock)?<br/>A: A mutex that prevents multiple native threads from executing Python bytecodes simultaneously. It ensures CPython memory management is thread-safe.",
                            "Q: Difference between `is` and `==` in Python?<br/>A: `is` checks reference identity (memory addresses match: id(a) == id(b)), while `==` checks value equality.",
                        ],
                    },
                ],
            },
            {
                "title": "Top 50 Technical Python Interview Questions & Solutions",
                "topic_name": "Interview Questions",
                "filename": "python-interview-questions-50.pdf",
                "description": "Handpicked collection of top 50 technical interview questions asked by leading tech companies, covering language subtleties, decorators, generators, and complexity.",
                "sections": [
                    {
                        "heading": "Section A: Language Internals & Decorators",
                        "paragraphs": [
                            "Understanding how first-class functions enable decorators and closure scoping is crucial for senior and entry-level technical rounds.",
                        ],
                        "code": "# Custom Execution Timer Decorator\nimport time\n\ndef time_execution(fn):\n    def wrapper(*args, **kwargs):\n        start = time.perf_counter()\n        result = fn(*args, **kwargs)\n        print(f'{fn.__name__} executed in {time.perf_counter() - start:.4f}s')\n        return result\n    return wrapper",
                    },
                    {
                        "heading": "Section B: Generators vs Iterators",
                        "paragraphs": [
                            "An iterator is an object with __iter__() and __next__() methods. A generator is an elegant way to produce iterators using functions and `yield` without loading entire datasets into memory.",
                        ],
                    },
                    {
                        "heading": "Section C: Concurrency & Asynchronous Programming",
                        "paragraphs": [
                            "Threading is best for I/O-bound tasks. Multiprocessing is best for CPU-bound computations. Asyncio enables single-threaded cooperative multitasking using an event loop.",
                        ],
                    },
                ],
            },
            {
                "title": "Python Object-Oriented Programming (OOP) & Design Patterns",
                "topic_name": "OOP",
                "filename": "python-oop-design-patterns.pdf",
                "description": "Deep-dive into Python classes, MRO (Method Resolution Order), polymorphism, abstract base classes, and popular Gang-of-Four design patterns implemented cleanly.",
                "sections": [
                    {
                        "heading": "1. The 4 Pillars of OOP in Python",
                        "paragraphs": [
                            "Encapsulation: Protected attributes with single underscore `_var`, private with double underscore `__var` (name mangling).",
                            "Inheritance & MRO: Uses the C3 linearization algorithm. Inspect hierarchy using `ClassName.mro()`.",
                        ],
                        "code": "# Abstract Base Class Example\nfrom abc import ABC, abstractmethod\n\nclass PaymentGateway(ABC):\n    @abstractmethod\n    def process_payment(self, amount: float) -> bool:\n        pass",
                    },
                    {
                        "heading": "2. Singleton & Factory Patterns",
                        "paragraphs": [
                            "The Factory pattern centralizes object creation without exposing instantiating logic to the caller.",
                        ],
                    },
                ],
            },
            {
                "title": "Data Structures & Algorithmic Problem Solving in Python",
                "topic_name": "Coding Questions",
                "filename": "python-dsa-coding-problems.pdf",
                "description": "Essential coding patterns: Two Pointers, Sliding Window, Fast & Slow Pointers, Tree Traversals, and Dynamic Programming with Python collections.",
                "sections": [
                    {
                        "heading": "1. Two-Pointer Technique (Sorted Arrays)",
                        "paragraphs": [
                            "Optimal for finding pairs, reversing in-place, or removing duplicates in O(N) time and O(1) space.",
                        ],
                        "code": "# Two-Sum on Sorted Array\ndef two_sum_sorted(nums, target):\n    left, right = 0, len(nums) - 1\n    while left < right:\n        current = nums[left] + nums[right]\n        if current == target:\n            return [left, right]\n        elif current < target:\n            left += 1\n        else:\n            right -= 1\n    return []",
                    },
                    {
                        "heading": "2. Built-in Collections Complexity",
                        "paragraphs": [
                            "list.append: O(1) amortized, list.pop(0): O(N).",
                            "collections.deque: O(1) appendleft and popleft.",
                            "dict & set lookups: Average O(1), worst-case O(N).",
                        ],
                    },
                ],
            },
        ]

        for m_data in sample_materials:
            pdf_bytes = generate_sample_pdf(
                title=m_data["title"],
                subtitle="AspirePath Placement Preparation Series",
                content_sections=m_data["sections"],
            )
            file_uuid = f"{uuid.uuid4()}.pdf"
            file_disk_path = upload_dir / file_uuid
            with open(file_disk_path, "wb") as f:
                f.write(pdf_bytes)

            page_count = get_pdf_page_count(file_disk_path)
            topic_obj = created_topics.get(("python-developer", m_data["topic_name"]))

            material = PreparationMaterial(
                role_id=python_role.id,
                topic_id=topic_obj.id if topic_obj else None,
                title=m_data["title"],
                description=m_data["description"],
                file_path=str(file_disk_path.as_posix()),
                file_name=m_data["filename"],
                file_content=pdf_bytes,
                file_size_bytes=len(pdf_bytes),
                page_count=page_count,
                is_published=True,
                download_count=12,
            )
            session.add(material)

    await session.commit()
    logger.info("Successfully seeded Placement Preparation roles and materials!")

