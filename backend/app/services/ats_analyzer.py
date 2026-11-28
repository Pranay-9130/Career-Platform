import io
import json
import logging
import os
import re
from typing import Dict, Any, List, Optional
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

# Curated catalog of high-impact technical keywords for ATS detection
COMMON_TECH_KEYWORDS = [
    # Languages
    "python", "javascript", "typescript", "java", "c++", "c#", "go", "golang", "rust",
    "ruby", "php", "swift", "kotlin", "sql", "html", "css", "bash", "shell",
    # Frameworks & Libraries
    "react", "react.js", "next.js", "vue", "vue.js", "angular", "node.js", "nodejs",
    "express", "fastapi", "django", "flask", "spring boot", "rails", "asp.net",
    "tailwind css", "tailwind", "bootstrap", "material ui", "graphql", "rest", "rest api", "restful",
    # Databases & Caching
    "postgresql", "postgres", "mysql", "mongodb", "redis", "elasticsearch",
    "cassandra", "sqlite", "dynamodb", "supabase", "firebase",
    # Cloud, DevOps & Tools
    "aws", "amazon web services", "azure", "gcp", "google cloud", "docker", "kubernetes", "k8s",
    "terraform", "git", "github", "gitlab", "ci/cd", "github actions", "jenkins",
    "linux", "nginx", "prometheus", "grafana", "kafka", "rabbitmq",
    # Testing & Methodologies
    "pytest", "jest", "cypress", "junit", "unit testing", "integration testing",
    "agile", "scrum", "microservices", "distributed systems", "event-driven",
    # Data & AI
    "pytorch", "tensorflow", "scikit-learn", "pandas", "numpy", "machine learning",
    "deep learning", "llm", "nlp", "computer vision", "data pipelines",
]

COMMON_SOFT_SKILLS = [
    "leadership", "communication", "teamwork", "collaboration",
    "problem solving", "critical thinking", "adaptability",
    "time management", "analytical", "mentorship", "creativity",
    "agile", "scrum", "initiative", "stakeholder management",
]


def extract_resume_text_from_dict(resume_data: Dict[str, Any]) -> str:
    """
    Serializes a structured Resume model/dict into normalized ATS plain text.
    """
    lines = []
    personal = resume_data.get("personal_info") or {}
    lines.append(f"Name: {personal.get('full_name', '')}")
    if personal.get("headline"):
        lines.append(f"Headline: {personal.get('headline')}")
    lines.append(f"Email: {personal.get('email', '')} | Phone: {personal.get('phone', '')} | Location: {personal.get('location', '')}")
    if personal.get("github"):
        lines.append(f"GitHub: {personal.get('github')}")
    if personal.get("linkedin"):
        lines.append(f"LinkedIn: {personal.get('linkedin')}")

    summary = resume_data.get("summary")
    if summary:
        lines.append("\nPROFESSIONAL SUMMARY:")
        lines.append(str(summary))

    skills = resume_data.get("skills")
    if skills:
        lines.append("\nTECHNICAL SKILLS:")
        from app.services.skill_categorizer import categorize_skills
        for cat_name, cat_items in categorize_skills(skills):
            items_str = ", ".join(str(i) for i in cat_items)
            if cat_name:
                lines.append(f"{cat_name}: {items_str}")
            else:
                lines.append(items_str)

    experience = resume_data.get("experience") or []
    if experience:
        lines.append("\nWORK EXPERIENCE:")
        for exp in experience:
            lines.append(f"{exp.get('role', '')} at {exp.get('company', '')} ({exp.get('start_date', '')} - {exp.get('end_date', '')})")
            for b in exp.get("bullets", []):
                lines.append(f"- {b}")

    projects = resume_data.get("projects") or []
    if projects:
        lines.append("\nFLAGSHIP PROJECTS:")
        for p in projects:
            lines.append(f"{p.get('name', '')} | Stack: {p.get('tech_stack', '')}")
            for b in p.get("bullets", []):
                lines.append(f"- {b}")

    education = resume_data.get("education") or []
    if education:
        lines.append("\nEDUCATION:")
        for edu in education:
            lines.append(f"{edu.get('degree', '')} from {edu.get('institution', '')} (Grad: {edu.get('end_date', '')}) GPA: {edu.get('gpa', '')}")
            if edu.get("highlights"):
                lines.append(f"Coursework: {edu.get('highlights')}")

    return "\n".join(lines)


def extract_text_from_docx(docx_bytes: bytes) -> str:
    """
    Extracts text from DOCX bytes using python-docx.
    Safely parses paragraphs and table content.
    """
    if not docx_bytes or len(docx_bytes) < 10:
        raise ValueError("The uploaded file is empty or too small to be a valid Word document.")

    # Validate DOCX ZIP magic header
    if not docx_bytes.startswith(b"PK\x03\x04"):
        raise ValueError("The uploaded file does not appear to be a valid Word (.docx) document.")

    try:
        import docx
    except (ImportError, ModuleNotFoundError):
        logger.error("python-docx is not installed on the server.")
        raise RuntimeError("Word document (.docx) parsing engine is not installed on the server.")

    try:
        doc = docx.Document(io.BytesIO(docx_bytes))
        lines: List[str] = []

        for p in doc.paragraphs:
            text = (p.text or "").strip()
            if text:
                lines.append(text)

        for table in doc.tables:
            for row in table.rows:
                row_texts = [cell.text.strip() for cell in row.cells if cell.text and cell.text.strip()]
                if row_texts:
                    lines.append(" | ".join(row_texts))

        full_text = "\n".join(lines).strip()
        if not full_text:
            raise ValueError("The Word document contains no readable text. Please ensure the document is not blank.")
        return full_text
    except ValueError:
        raise
    except Exception as exc:
        logger.warning("DOCX parsing error: %s", exc)
        raise ValueError("Corrupted or invalid Word document: unable to parse document content.")


def extract_text_from_resume_file(file_bytes: bytes, filename: str) -> str:
    """
    Safely extracts text from an uploaded resume file (PDF or DOCX).
    Enforces format validation, content header checks, and readable text extraction.
    """
    safe_name = os.path.basename(filename or "").lower()

    if safe_name.endswith(".pdf"):
        from app.services.skill_intelligence import extract_text_from_pdf
        try:
            return extract_text_from_pdf(file_bytes)
        except ValueError as ve:
            err_msg = str(ve)
            if "readable text" in err_msg.lower() or "selectable text" in err_msg.lower():
                raise ValueError(
                    "Could not extract readable text from the provided PDF. "
                    "If this is a scanned document or image-only PDF, OCR is not supported. "
                    "Please upload a document with selectable text or paste your resume text directly."
                )
            raise
    elif safe_name.endswith(".docx"):
        return extract_text_from_docx(file_bytes)
    else:
        raise ValueError("Unsupported file format. Please upload a PDF (.pdf) or Word document (.docx).")


async def analyze_ats(resume_text: str, job_description: str) -> Dict[str, Any]:
    """
    Analyzes candidate resume against job description using Google Gemini AI
    with automatic graceful fallback to the rule-based NLP ATS engine.
    """
    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip():
        try:
            return await _gemini_analysis(resume_text, job_description)
        except Exception as exc:
            logger.warning("Gemini AI API call encountered an error; falling back to rule-based engine: %s", exc)

    return _rule_based_analysis(resume_text, job_description)


async def _gemini_analysis(resume_text: str, job_description: str) -> Dict[str, Any]:
    """
    Calls Google Gemini REST API with structured prompt expecting valid JSON.
    """
    model = settings.GEMINI_MODEL or "gemini-1.5-pro"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={settings.GEMINI_API_KEY}"

    system_instruction = (
        "You are an expert enterprise ATS (Applicant Tracking System) parser and principal engineering hiring manager. "
        "Analyze the provided Resume against the target Job Description. "
        "Return ONLY a valid JSON object without markdown formatting or code fences. "
        "The JSON MUST follow this exact structure:\n"
        "{\n"
        '  "overall_score": 85,\n'
        '  "verdict": "High Match",\n'
        '  "summary": "Concise 2-3 sentence executive evaluation.",\n'
        '  "breakdown": {\n'
        '    "skills_score": 90,\n'
        '    "experience_score": 80,\n'
        '    "education_score": 85,\n'
        '    "formatting_score": 95\n'
        "  },\n"
        '  "matched_skills": ["Python", "FastAPI", "React"],\n'
        '  "missing_skills": ["Docker", "Kubernetes"],\n'
        '  "critical_gaps": ["Lacks 2+ years experience in cloud deployments"],\n'
        '  "bullet_recommendations": [\n'
        "    {\n"
        '      "original_text": "Worked on backend APIs",\n'
        '      "improved_text": "Architected asynchronous REST microservices using FastAPI and PostgreSQL, cutting P95 latency by 35%",\n'
        '      "reason": "Quantify performance metrics and name explicit frameworks from the job description."\n'
        "    }\n"
        "  ]\n"
        "}"
    )

    prompt = (
        f"{system_instruction}\n\n"
        f"--- TARGET JOB DESCRIPTION ---\n{job_description[:8000]}\n\n"
        f"--- CANDIDATE RESUME ---\n{resume_text[:8000]}\n"
    )

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 2048,
            "responseMimeType": "application/json",
        },
    }

    async with httpx.AsyncClient(timeout=25.0) as client:
        resp = await client.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()

    candidates = data.get("candidates") or []
    if not candidates:
        raise ValueError("Empty response from Gemini API")

    raw_text = candidates[0]["content"]["parts"][0]["text"].strip()
    # Strip any backticks if model wrapped in ```json
    if raw_text.startswith("```"):
        raw_text = re.sub(r"^```(?:json)?\s*", "", raw_text)
        raw_text = re.sub(r"\s*```$", "", raw_text)

    parsed = json.loads(raw_text)
    parsed["analyzed_with"] = model
    return parsed


def _rule_based_analysis(resume_text: str, job_description: str) -> Dict[str, Any]:
    """
    Deterministic rule-based NLP ATS engine providing robust semantic scoring.
    """
    r_lower = resume_text.lower()
    jd_lower = job_description.lower()

    # 1. Identify JD Keywords & Matched Skills
    jd_keywords = set()
    for kw in COMMON_TECH_KEYWORDS:
        pattern = r"\b" + re.escape(kw) + r"\b"
        if re.search(pattern, jd_lower):
            jd_keywords.add(kw)

    # Fallback to default core tech skills if JD has few recognizable keywords
    if len(jd_keywords) < 3:
        jd_keywords.update(["python", "javascript", "react", "sql", "git", "rest"])

    matched_skills = []
    missing_skills = []
    for kw in sorted(jd_keywords):
        pattern = r"\b" + re.escape(kw) + r"\b"
        if re.search(pattern, r_lower):
            matched_skills.append(kw.title() if len(kw) > 3 else kw.upper())
        else:
            missing_skills.append(kw.title() if len(kw) > 3 else kw.upper())

    # 2. Score Dimensions
    # Skills score
    match_ratio = len(matched_skills) / max(len(jd_keywords), 1)
    skills_score = int(min(100, max(20, round(match_ratio * 100))))

    # Experience score (checks for quantifiable metrics & action verbs)
    action_verbs = ["architected", "engineered", "designed", "optimized", "built", "spearheaded", "developed", "automated", "cut", "reduced", "scaled"]
    found_verbs = sum(1 for v in action_verbs if v in r_lower)
    has_metrics = len(re.findall(r"\d+%(?:\s+reduction|\s+increase)?|\d+k|\d+x|\$\d+", r_lower))
    exp_score = min(100, 40 + (found_verbs * 6) + (has_metrics * 8))

    # Education score
    edu_score = 85
    if any(term in r_lower for term in ["b.s.", "bachelor", "master", "m.s.", "ph.d", "computer science"]):
        edu_score = 95
    elif not any(term in r_lower for term in ["education", "university", "college"]):
        edu_score = 50

    # Formatting / ATS Readability score
    formatting_score = 95
    if not any(h in r_lower for h in ["experience", "education", "skills"]):
        formatting_score -= 25

    # Overall weighted score
    overall_score = int(round(
        (skills_score * 0.45) +
        (exp_score * 0.30) +
        (education_score := edu_score * 0.15) +
        (formatting_score * 0.10)
    ))
    overall_score = max(10, min(100, overall_score))

    # Verdict
    if overall_score >= 80:
        verdict = "High Match"
    elif overall_score >= 60:
        verdict = "Moderate Match"
    else:
        verdict = "Needs Optimization"

    # Critical gaps
    critical_gaps = []
    if missing_skills:
        top_missing = missing_skills[:3]
        critical_gaps.append(f"Resume is missing key role skills: {', '.join(top_missing)}")
    if has_metrics < 2:
        critical_gaps.append("Lacks quantifiable metric data points (percentages, latency, scale numbers) in role bullet points")
    if skills_score < 60:
        critical_gaps.append("Skill coverage is below 60% of the target job description criteria")

    # Generate Bullet Rewrite Recommendations
    bullet_recommendations = []
    # Find bullet points in resume text
    raw_bullets = [
        line.strip().lstrip("-*• ")
        for line in resume_text.splitlines()
        if line.strip().startswith(("-", "*", "•")) or (len(line.strip()) > 30 and "worked" in line.lower())
    ]

    missing_sample = missing_skills[0] if missing_skills else "PostgreSQL"
    if raw_bullets:
        target_bullet = raw_bullets[0]
        improved = f"Architected scalable backend workflows using {missing_sample} and optimized query plans, improving response latency by 34%."
        bullet_recommendations.append({
            "original_text": target_bullet,
            "improved_text": improved,
            "reason": f"Transform passive description into action-oriented metric statement incorporating target skill '{missing_sample}'.",
        })
    else:
        bullet_recommendations.append({
            "original_text": "Built features for application dashboard.",
            "improved_text": f"Engineered interactive dashboards leveraging {missing_sample} with automated caching, supporting 5k+ concurrent daily active users.",
            "reason": "Incorporate explicit tech stack keywords and quantify active user traffic.",
        })

    summary = (
        f"Candidate displays a {verdict.lower()} ({overall_score}%) for this role with strong foundational coverage in {', '.join(matched_skills[:4]) if matched_skills else 'core computer science'}. "
        f"To maximize automated ATS pass rates, incorporate high-priority keywords ({', '.join(missing_skills[:3]) if missing_skills else 'advanced architecture patterns'}) into your experience bullet points."
    )

    return {
        "overall_score": overall_score,
        "verdict": verdict,
        "summary": summary,
        "breakdown": {
            "skills_score": skills_score,
            "experience_score": exp_score,
            "education_score": edu_score,
            "formatting_score": formatting_score,
        },
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "critical_gaps": critical_gaps,
        "bullet_recommendations": bullet_recommendations,
        "analyzed_with": "rule-based-nlp-engine",
    }


async def analyze_resume_health(resume_text: str) -> Dict[str, Any]:
    """
    Performs comprehensive Resume Health Check without requiring a job description.
    Evaluates ATS readability, structural completeness, content quality,
    skills balance, metrics presence, and section-by-section improvements.
    Uses Google Gemini AI with automatic graceful fallback to the rule-based NLP engine.
    """
    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip():
        try:
            return await _gemini_health_analysis(resume_text)
        except Exception as exc:
            logger.warning("Gemini AI health analysis error; falling back to rule-based engine: %s", exc)

    return _rule_based_health_analysis(resume_text)


async def _gemini_health_analysis(resume_text: str) -> Dict[str, Any]:
    """
    Calls Google Gemini REST API with structured prompt for Resume Health Check.
    """
    model = settings.GEMINI_MODEL or "gemini-1.5-pro"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={settings.GEMINI_API_KEY}"

    system_instruction = (
        "You are an expert enterprise resume reviewer, executive technical recruiter, and ATS compliance specialist. "
        "Analyze the provided Resume independently (general resume health check, WITHOUT requiring a job description). "
        "Evaluate: Overall Resume Quality, ATS Compatibility & Machine Readability, Structure & Formatting, "
        "Professional Summary Quality, Technical & Soft Skills, Education, Projects & Experience, Certifications, "
        "Missing Sections, and Grammar/Writing Quality. "
        "Do NOT hallucinate skills or experience. Provide honest, constructive, and actionable feedback based strictly on the text. "
        "Return ONLY a valid JSON object without markdown formatting or code fences following this exact structure:\n"
        "{\n"
        '  "overall_score": 82,\n'
        '  "ats_compatibility_score": 88,\n'
        '  "content_quality_score": 78,\n'
        '  "verdict": "Strong Quality",\n'
        '  "summary": "Well-structured technical resume with clear core stack; add more metric-driven bullet points.",\n'
        '  "technical_skills": ["Python", "FastAPI", "React", "Docker"],\n'
        '  "soft_skills": ["Problem Solving", "Collaboration"],\n'
        '  "missing_sections": ["Quantifiable Metrics in Experience"],\n'
        '  "section_feedback": [\n'
        "    {\n"
        '      "section_name": "Structure & Formatting",\n'
        '      "score": 90,\n'
        '      "status": "Strong",\n'
        '      "strengths": ["Clean single-column chronological structure"],\n'
        '      "weaknesses": ["Could improve whitespace density"],\n'
        '      "recommendations": ["Maintain standard heading capitalization"]\n'
        "    },\n"
        "    {\n"
        '      "section_name": "Professional Summary",\n'
        '      "score": 80,\n'
        '      "status": "Strong",\n'
        '      "strengths": ["Clear technical positioning"],\n'
        '      "weaknesses": ["Lacks target specialization"],\n'
        '      "recommendations": ["Highlight years of experience and domain focus"]\n'
        "    },\n"
        "    {\n"
        '      "section_name": "Technical & Soft Skills",\n'
        '      "score": 85,\n'
        '      "status": "Strong",\n'
        '      "strengths": ["Solid core engineering skills identified"],\n'
        '      "weaknesses": ["Group skills into categorized buckets"],\n'
        '      "recommendations": ["Add tools and cloud proficiencies"]\n'
        "    },\n"
        "    {\n"
        '      "section_name": "Projects & Experience",\n'
        '      "score": 75,\n'
        '      "status": "Needs Improvement",\n'
        '      "strengths": ["Good action verbs used in descriptions"],\n'
        '      "weaknesses": ["Few quantifiable metric points (percentages, latency)"],\n'
        '      "recommendations": ["Use XYZ formula: Accomplished X as measured by Y by doing Z"]\n'
        "    },\n"
        "    {\n"
        '      "section_name": "Education Details",\n'
        '      "score": 90,\n'
        '      "status": "Strong",\n'
        '      "strengths": ["Degree and institution are clearly stated"],\n'
        '      "weaknesses": [],\n'
        '      "recommendations": ["Include graduation year and key coursework"]\n'
        "    },\n"
        "    {\n"
        '      "section_name": "Certifications & Achievements",\n'
        '      "score": 70,\n'
        '      "status": "Needs Improvement",\n'
        '      "strengths": ["Demonstrates initiative outside core syllabus"],\n'
        '      "weaknesses": ["Could include verified technical credentials"],\n'
        '      "recommendations": ["Add cloud, competitive programming, or hackathon recognitions"]\n'
        "    }\n"
        "  ],\n"
        '  "actionable_recommendations": [\n'
        '    "Add quantifiable metrics to at least 3 project/work experience bullet points.",\n'
        '    "Group technical skills into Languages, Frameworks, Databases, and Tools for rapid recruiter scanning.",\n'
        '    "Ensure clickable links to GitHub repository and LinkedIn profile are up to date."\n'
        "  ],\n"
        '  "bullet_recommendations": [\n'
        "    {\n"
        '      "original_text": "Worked on backend APIs",\n'
        '      "improved_text": "Architected asynchronous REST microservices with FastAPI and PostgreSQL, cutting P95 latency by 35%",\n'
        '      "reason": "Quantify performance metrics and specify frameworks used."\n'
        "    }\n"
        "  ]\n"
        "}"
    )

    prompt = (
        f"{system_instruction}\n\n"
        f"--- CANDIDATE RESUME TO ANALYZE ---\n{resume_text[:10000]}\n"
    )

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 2500,
            "responseMimeType": "application/json",
        },
    }

    async with httpx.AsyncClient(timeout=25.0) as client:
        resp = await client.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()

    candidates = data.get("candidates") or []
    if not candidates:
        raise ValueError("Empty response from Gemini API")

    raw_text = candidates[0]["content"]["parts"][0]["text"].strip()
    if raw_text.startswith("```"):
        raw_text = re.sub(r"^```(?:json)?\s*", "", raw_text)
        raw_text = re.sub(r"\s*```$", "", raw_text)

    parsed = json.loads(raw_text)
    overall_score = int(parsed.get("overall_score", 75))
    ats_score = int(parsed.get("ats_compatibility_score", 80))
    content_score = int(parsed.get("content_quality_score", 70))
    verdict = parsed.get("verdict", "Good Quality")
    summary = parsed.get("summary", "Resume health check completed successfully.")

    health_data = {
        "overall_score": overall_score,
        "ats_compatibility_score": ats_score,
        "content_quality_score": content_score,
        "verdict": verdict,
        "summary": summary,
        "technical_skills": parsed.get("technical_skills", []),
        "soft_skills": parsed.get("soft_skills", []),
        "missing_sections": parsed.get("missing_sections", []),
        "section_feedback": parsed.get("section_feedback", []),
        "actionable_recommendations": parsed.get("actionable_recommendations", []),
        "disclaimer": (
            "This Resume Health Check provides general readability and structural feedback. "
            "It does not evaluate job-specific fit or guarantee interview shortlists at any specific employer."
        ),
    }

    return {
        "analysis_mode": "health_check",
        "overall_score": overall_score,
        "verdict": verdict,
        "summary": summary,
        "breakdown": {
            "skills_score": int(parsed.get("content_quality_score", 75)),
            "experience_score": int(parsed.get("overall_score", 75)),
            "education_score": 85,
            "formatting_score": ats_score,
        },
        "matched_skills": parsed.get("technical_skills", [])[:10],
        "missing_skills": [],
        "critical_gaps": parsed.get("missing_sections", []),
        "bullet_recommendations": parsed.get("bullet_recommendations", []),
        "analyzed_with": model,
        "health_check": health_data,
    }


def _rule_based_health_analysis(resume_text: str) -> Dict[str, Any]:
    """
    Deterministic rule-based NLP engine evaluating general Resume Health.
    """
    r_lower = resume_text.lower()
    words = resume_text.split()
    word_count = len(words)

    # 1. Section detections
    has_summary = any(h in r_lower for h in ["summary", "profile", "about me", "professional summary", "objective"])
    has_skills = any(h in r_lower for h in ["skills", "technical skills", "technologies", "competencies", "tools"])
    has_experience = any(h in r_lower for h in ["experience", "work experience", "employment", "internship", "intern", "professional experience"])
    has_projects = any(h in r_lower for h in ["projects", "flagship projects", "personal projects", "academic projects", "key projects"])
    has_education = any(h in r_lower for h in ["education", "university", "college", "degree", "bachelor", "b.tech", "b.e.", "master", "m.tech", "gpa", "cgpa"])
    has_certifications = any(h in r_lower for h in ["certifications", "certificates", "licenses", "awards", "achievements", "honors", "hackathon"])
    has_email = bool(re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", resume_text))
    has_phone = bool(re.search(r"\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b|\b\d{10}\b", resume_text))
    has_links = any(link in r_lower for link in ["github.com", "linkedin.com", "portfolio", "http://", "https://"])

    # 2. Extract technical & soft skills
    detected_tech = []
    for kw in COMMON_TECH_KEYWORDS:
        pattern = r"\b" + re.escape(kw) + r"\b"
        if re.search(pattern, r_lower):
            detected_tech.append(kw.title() if len(kw) > 3 else kw.upper())

    detected_soft = []
    for sk in COMMON_SOFT_SKILLS:
        pattern = r"\b" + re.escape(sk) + r"\b"
        if re.search(pattern, r_lower):
            detected_soft.append(sk.title())

    # 3. Action verbs & metrics
    action_verbs = ["architected", "engineered", "designed", "optimized", "built", "spearheaded", "developed", "automated", "created", "maintained", "implemented", "scaled", "led", "managed", "reduced", "increased"]
    found_verbs = [v.title() for v in action_verbs if v in r_lower]
    metrics_matches = re.findall(r"\d+%(?:\s+reduction|\s+increase)?|\b\d+k\b|\b\d+x\b|\$\d+|\b\d+\+\s*(?:users|clients|students|requests|services)\b", r_lower)
    metrics_count = len(metrics_matches)

    # 4. Scoring dimensions
    # ATS Compatibility
    ats_score = 65
    if has_email: ats_score += 10
    if has_phone: ats_score += 5
    if has_links: ats_score += 5
    if has_skills and (has_experience or has_projects) and has_education: ats_score += 10
    if 250 <= word_count <= 1100: ats_score += 5
    elif word_count < 150: ats_score -= 20
    ats_score = max(25, min(96, ats_score))

    # Content Quality
    content_score = 45
    content_score += min(len(detected_tech) * 3, 22)
    content_score += min(len(found_verbs) * 2, 12)
    content_score += min(metrics_count * 5, 15)
    if has_summary: content_score += 6
    if has_projects: content_score += 5
    content_score = max(30, min(95, content_score))

    # Overall Score
    overall_score = int(round((ats_score * 0.40) + (content_score * 0.60)))
    overall_score = max(20, min(96, overall_score))

    if overall_score >= 82:
        verdict = "Excellent Quality"
    elif overall_score >= 68:
        verdict = "Solid Baseline"
    else:
        verdict = "Needs Optimization"

    # Missing items
    missing_sections = []
    if not has_summary:
        missing_sections.append("Professional Summary")
    if not has_links:
        missing_sections.append("GitHub / Portfolio Links")
    if not has_certifications:
        missing_sections.append("Certifications & Achievements")
    if metrics_count < 2:
        missing_sections.append("Quantifiable Metrics in Project / Role Bullets")

    # Section feedback
    section_feedback = [
        {
            "section_name": "Structure & Formatting",
            "score": ats_score,
            "status": "Strong" if ats_score >= 80 else "Needs Improvement",
            "strengths": [
                "Parsable single-column format readable by standard ATS parsers.",
                f"Contact details detected ({'email, ' if has_email else ''}{'phone' if has_phone else ''}).",
            ],
            "weaknesses": [
                "Document length is on the shorter side for technical screening." if word_count < 200 else "Ensure clear line separation between distinct project items."
            ],
            "recommendations": [
                "Use standard bold headings: Technical Skills, Work Experience, Projects, Education.",
                "Ensure all URLs (GitHub, LinkedIn) are accurate and fully qualified.",
            ],
        },
        {
            "section_name": "Professional Summary",
            "score": 85 if has_summary else 40,
            "status": "Strong" if has_summary else "Missing",
            "strengths": [
                "Dedicated summary or profile section detected." if has_summary else "Opportunity to establish your specialization right at the top."
            ],
            "weaknesses": [
                "No professional summary found at the beginning of the resume." if not has_summary else "Keep summary concise (2-3 sentences) avoiding first-person pronouns (I, me)."
            ],
            "recommendations": [
                "Add a 2-3 sentence overview stating your primary stack (e.g. Python & React) and placement/career focus."
            ],
        },
        {
            "section_name": "Technical & Soft Skills",
            "score": min(95, 45 + len(detected_tech) * 3 + len(detected_soft) * 2),
            "status": "Strong" if len(detected_tech) >= 5 else "Needs Improvement",
            "strengths": [
                f"Identified {len(detected_tech)} industry technical skills ({', '.join(detected_tech[:4]) if detected_tech else 'foundational'}).",
                f"Detected {len(detected_soft)} professional competencies ({', '.join(detected_soft[:3]) if detected_soft else 'collaboration'}).",
            ],
            "weaknesses": [
                "Skills could be better grouped into distinct categories for recruiter readability."
            ],
            "recommendations": [
                "Organize skills into Languages, Frameworks, Databases, and Developer Tools.",
                "Ensure every technology listed is reflected in at least one project bullet point.",
            ],
        },
        {
            "section_name": "Projects & Experience",
            "score": min(95, 45 + (len(found_verbs) * 3) + (metrics_count * 6)),
            "status": "Strong" if (len(found_verbs) >= 3 and metrics_count >= 2) else "Needs Improvement",
            "strengths": [
                f"Incorporates active verbs like {', '.join(found_verbs[:3]) if found_verbs else 'built, developed'}."
            ] + ([f"Found {metrics_count} measurable metric point(s)."] if metrics_count > 0 else []),
            "weaknesses": [
                "Lacks quantifiable metrics (% speedup, user count, database query reduction) in project descriptions." if metrics_count < 2 else "Ensure impact is stated before technical implementation details."
            ],
            "recommendations": [
                "Frame bullets using the Google XYZ pattern: 'Accomplished [X], as measured by [Y], by doing [Z]'.",
                "Mention production libraries and architecture tools (e.g. Redis caching, Docker containerization).",
            ],
        },
        {
            "section_name": "Education Details",
            "score": 90 if has_education else 45,
            "status": "Strong" if has_education else "Missing",
            "strengths": [
                "Academic background and institution details successfully identified." if has_education else "Educational credentials need clear prominence."
            ],
            "weaknesses": [
                "Ensure graduation year, degree, and GPA are explicitly listed."
            ],
            "recommendations": [
                "Include relevant coursework (e.g. Data Structures, Operating Systems, DBMS) if you have under 2 years experience."
            ],
        },
        {
            "section_name": "Certifications & Achievements",
            "score": 85 if has_certifications else 50,
            "status": "Strong" if has_certifications else "Needs Improvement",
            "strengths": [
                "Verified credentials or honors detected." if has_certifications else "Adding certifications can provide quick competitive differentiation."
            ],
            "weaknesses": [
                "No formal certifications, awards, or hackathon achievements detected." if not has_certifications else "Ensure certification issuing body and date are noted."
            ],
            "recommendations": [
                "List reputable cloud certifications, coding platform ratings (LeetCode, HackerRank), or technical competition awards."
            ],
        },
    ]

    actionable_recommendations = [
        "Incorporate measurable data points (percentages, latency, throughput, user count) into your experience and project descriptions.",
        "Ensure your contact header includes active links to your GitHub profile and LinkedIn account.",
        "Add a 2-3 sentence Professional Summary at the top emphasizing your primary tech stack and career objective.",
    ]
    if len(detected_tech) < 6:
        actionable_recommendations.append("Explicitly list industry-standard frameworks and tools you have used (e.g. Docker, PostgreSQL, REST APIs).")

    raw_bullets = [
        line.strip().lstrip("-*• ")
        for line in resume_text.splitlines()
        if line.strip().startswith(("-", "*", "•")) or (len(line.strip()) > 30 and "worked" in line.lower())
    ]
    bullet_recs = []
    if raw_bullets:
        target_bullet = raw_bullets[0]
        bullet_recs.append({
            "original_text": target_bullet,
            "improved_text": "Architected modular backend services using FastAPI and PostgreSQL, cutting API response latency by 32% across 5,000+ daily requests.",
            "reason": "Transform passive wording into an action-driven accomplishment highlighting concrete performance metrics.",
        })
    else:
        bullet_recs.append({
            "original_text": "Worked on web application development and bug fixes.",
            "improved_text": "Engineered responsive full-stack modules leveraging React and Node.js with comprehensive unit tests, improving test coverage to 85%.",
            "reason": "Specify the exact framework stack and quantify code quality impact.",
        })

    summary = (
        f"Your resume demonstrates a {verdict.lower()} ({overall_score}/100) with a {ats_score}/100 ATS machine-readability index. "
        f"We identified {len(detected_tech)} core technical skills ({', '.join(detected_tech[:4]) if detected_tech else 'foundational tools'}). "
        f"Focus on quantifying your project achievements with metrics and adding high-yield certifications to maximize interview conversion."
    )

    health_data = {
        "overall_score": overall_score,
        "ats_compatibility_score": ats_score,
        "content_quality_score": content_score,
        "verdict": verdict,
        "summary": summary,
        "technical_skills": detected_tech,
        "soft_skills": detected_soft,
        "missing_sections": missing_sections,
        "section_feedback": section_feedback,
        "actionable_recommendations": actionable_recommendations,
        "disclaimer": (
            "This Resume Health Check provides general readability and structural feedback. "
            "It does not evaluate job-specific fit or guarantee interview shortlists at any specific employer."
        ),
    }

    return {
        "analysis_mode": "health_check",
        "overall_score": overall_score,
        "verdict": verdict,
        "summary": summary,
        "breakdown": {
            "skills_score": content_score,
            "experience_score": overall_score,
            "education_score": 85,
            "formatting_score": ats_score,
        },
        "matched_skills": detected_tech[:12],
        "missing_skills": [],
        "critical_gaps": missing_sections,
        "bullet_recommendations": bullet_recs,
        "analyzed_with": "rule-based-nlp-engine",
        "health_check": health_data,
    }
