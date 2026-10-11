import json
import logging
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
        if isinstance(skills, list):
            lines.append(", ".join(str(s) for s in skills))
        elif isinstance(skills, dict):
            for k, v in skills.items():
                items_str = ", ".join(str(i) for i in v) if isinstance(v, list) else str(v)
                lines.append(f"{k}: {items_str}")

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
