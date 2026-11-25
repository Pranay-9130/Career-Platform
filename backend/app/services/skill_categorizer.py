"""
Skill Categorization Engine for AspirePath ATS Resume Builder.
Automatically groups user skills into clear, professional, ATS-friendly categories.
Matches the frontend taxonomy identically for seamless preview and PDF export fidelity.
"""

from typing import List, Dict, Tuple, Any, Union

CATEGORY_ORDER: List[str] = [
    "Programming Languages",
    "Frontend",
    "Backend",
    "Databases",
    "Cloud & DevOps",
    "Tools",
    "Testing",
    "Data Science & AI",
    "Frameworks & Libraries",
    "Design",
    "Soft Skills",
    "Other Skills",
]

SKILL_MAP: Dict[str, str] = {
    # Programming Languages
    "python": "Programming Languages",
    "java": "Programming Languages",
    "javascript": "Programming Languages",
    "js": "Programming Languages",
    "typescript": "Programming Languages",
    "ts": "Programming Languages",
    "c": "Programming Languages",
    "c++": "Programming Languages",
    "cpp": "Programming Languages",
    "c#": "Programming Languages",
    "csharp": "Programming Languages",
    "c-sharp": "Programming Languages",
    "go": "Programming Languages",
    "golang": "Programming Languages",
    "rust": "Programming Languages",
    "kotlin": "Programming Languages",
    "swift": "Programming Languages",
    "php": "Programming Languages",
    "ruby": "Programming Languages",
    "scala": "Programming Languages",
    "r": "Programming Languages",
    "dart": "Programming Languages",
    "perl": "Programming Languages",
    "lua": "Programming Languages",
    "haskell": "Programming Languages",
    "elixir": "Programming Languages",
    "clojure": "Programming Languages",
    "shell": "Programming Languages",
    "bash": "Programming Languages",
    "powershell": "Programming Languages",
    "zsh": "Programming Languages",
    "objective-c": "Programming Languages",
    "objective c": "Programming Languages",
    "assembly": "Programming Languages",
    "julia": "Programming Languages",
    "matlab": "Programming Languages",
    "solidity": "Programming Languages",
    "groovy": "Programming Languages",
    "cobol": "Programming Languages",
    "fortran": "Programming Languages",
    "vba": "Programming Languages",

    # Frontend
    "html": "Frontend",
    "html5": "Frontend",
    "css": "Frontend",
    "css3": "Frontend",
    "html/css": "Frontend",
    "html & css": "Frontend",
    "react": "Frontend",
    "react.js": "Frontend",
    "reactjs": "Frontend",
    "next.js": "Frontend",
    "nextjs": "Frontend",
    "next": "Frontend",
    "vue": "Frontend",
    "vue.js": "Frontend",
    "vuejs": "Frontend",
    "nuxt": "Frontend",
    "nuxt.js": "Frontend",
    "nuxtjs": "Frontend",
    "angular": "Frontend",
    "angularjs": "Frontend",
    "svelte": "Frontend",
    "sveltekit": "Frontend",
    "tailwind": "Frontend",
    "tailwind css": "Frontend",
    "tailwindcss": "Frontend",
    "bootstrap": "Frontend",
    "jquery": "Frontend",
    "redux": "Frontend",
    "redux toolkit": "Frontend",
    "zustand": "Frontend",
    "mobx": "Frontend",
    "sass": "Frontend",
    "scss": "Frontend",
    "less": "Frontend",
    "webpack": "Frontend",
    "vite": "Frontend",
    "babel": "Frontend",
    "semantic ui": "Frontend",
    "material ui": "Frontend",
    "mui": "Frontend",
    "chakra ui": "Frontend",
    "ant design": "Frontend",
    "antd": "Frontend",
    "shadcn": "Frontend",
    "shadcn ui": "Frontend",
    "astro": "Frontend",
    "remix": "Frontend",
    "flexbox": "Frontend",
    "css grid": "Frontend",
    "responsive design": "Frontend",

    # Backend
    "node": "Backend",
    "node.js": "Backend",
    "nodejs": "Backend",
    "express": "Backend",
    "express.js": "Backend",
    "expressjs": "Backend",
    "fastapi": "Backend",
    "django": "Backend",
    "flask": "Backend",
    "spring": "Backend",
    "spring boot": "Backend",
    "springboot": "Backend",
    "asp.net": "Backend",
    "asp.net core": "Backend",
    ".net": "Backend",
    ".net core": "Backend",
    "dotnet": "Backend",
    "ruby on rails": "Backend",
    "rails": "Backend",
    "nestjs": "Backend",
    "nest.js": "Backend",
    "laravel": "Backend",
    "gin": "Backend",
    "echo": "Backend",
    "actix": "Backend",
    "axum": "Backend",
    "tornado": "Backend",
    "ktor": "Backend",
    "fastify": "Backend",
    "graphql": "Backend",
    "rest": "Backend",
    "rest api": "Backend",
    "rest apis": "Backend",
    "restful": "Backend",
    "restful api": "Backend",
    "restful apis": "Backend",
    "grpc": "Backend",
    "microservices": "Backend",
    "websockets": "Backend",
    "socket.io": "Backend",
    "celery": "Backend",
    "rabbitmq": "Backend",
    "kafka": "Backend",
    "apache kafka": "Backend",
    "apollo": "Backend",
    "nats": "Backend",

    # Databases
    "sql": "Databases",
    "mysql": "Databases",
    "postgresql": "Databases",
    "postgres": "Databases",
    "mongodb": "Databases",
    "mongo": "Databases",
    "sqlite": "Databases",
    "redis": "Databases",
    "oracle": "Databases",
    "oracle database": "Databases",
    "microsoft sql server": "Databases",
    "mssql": "Databases",
    "sql server": "Databases",
    "dynamodb": "Databases",
    "cassandra": "Databases",
    "mariadb": "Databases",
    "couchdb": "Databases",
    "neo4j": "Databases",
    "firebase firestore": "Databases",
    "firestore": "Databases",
    "supabase": "Databases",
    "elasticsearch": "Databases",
    "opensearch": "Databases",
    "prisma": "Databases",
    "sqlalchemy": "Databases",
    "typeorm": "Databases",
    "hibernate": "Databases",
    "mongoose": "Databases",
    "nosql": "Databases",
    "relational databases": "Databases",

    # Cloud & DevOps
    "aws": "Cloud & DevOps",
    "amazon web services": "Cloud & DevOps",
    "azure": "Cloud & DevOps",
    "microsoft azure": "Cloud & DevOps",
    "gcp": "Cloud & DevOps",
    "google cloud": "Cloud & DevOps",
    "google cloud platform": "Cloud & DevOps",
    "docker": "Cloud & DevOps",
    "kubernetes": "Cloud & DevOps",
    "k8s": "Cloud & DevOps",
    "ci/cd": "Cloud & DevOps",
    "ci / cd": "Cloud & DevOps",
    "ci-cd": "Cloud & DevOps",
    "continuous integration": "Cloud & DevOps",
    "continuous deployment": "Cloud & DevOps",
    "github actions": "Cloud & DevOps",
    "gitlab ci": "Cloud & DevOps",
    "jenkins": "Cloud & DevOps",
    "terraform": "Cloud & DevOps",
    "ansible": "Cloud & DevOps",
    "linux": "Cloud & DevOps",
    "unix": "Cloud & DevOps",
    "ubuntu": "Cloud & DevOps",
    "centos": "Cloud & DevOps",
    "debian": "Cloud & DevOps",
    "nginx": "Cloud & DevOps",
    "apache": "Cloud & DevOps",
    "serverless": "Cloud & DevOps",
    "cloudflare": "Cloud & DevOps",
    "helm": "Cloud & DevOps",
    "prometheus": "Cloud & DevOps",
    "grafana": "Cloud & DevOps",
    "openshift": "Cloud & DevOps",
    "podman": "Cloud & DevOps",
    "cloud computing": "Cloud & DevOps",

    # Tools
    "git": "Tools",
    "github": "Tools",
    "gitlab": "Tools",
    "bitbucket": "Tools",
    "postman": "Tools",
    "jira": "Tools",
    "confluence": "Tools",
    "vs code": "Tools",
    "vscode": "Tools",
    "visual studio code": "Tools",
    "visual studio": "Tools",
    "pycharm": "Tools",
    "intellij": "Tools",
    "intellij idea": "Tools",
    "eclipse": "Tools",
    "webstorm": "Tools",
    "android studio": "Tools",
    "xcode": "Tools",
    "trello": "Tools",
    "notion": "Tools",
    "slack": "Tools",
    "npm": "Tools",
    "yarn": "Tools",
    "pnpm": "Tools",
    "maven": "Tools",
    "gradle": "Tools",
    "homebrew": "Tools",
    "vim": "Tools",
    "neovim": "Tools",
    "insomnia": "Tools",
    "swagger": "Tools",
    "excel": "Tools",
    "microsoft excel": "Tools",
    "ms excel": "Tools",
    "word": "Tools",
    "microsoft word": "Tools",
    "ms word": "Tools",
    "powerpoint": "Tools",
    "ms powerpoint": "Tools",
    "ms office": "Tools",
    "microsoft office": "Tools",
    "google workspace": "Tools",
    "google sheets": "Tools",
    "google docs": "Tools",

    # Testing
    "jest": "Testing",
    "cypress": "Testing",
    "playwright": "Testing",
    "selenium": "Testing",
    "selenium webdriver": "Testing",
    "junit": "Testing",
    "pytest": "Testing",
    "mocha": "Testing",
    "chai": "Testing",
    "testng": "Testing",
    "cucumber": "Testing",
    "vitest": "Testing",
    "karma": "Testing",
    "jasmine": "Testing",
    "robot framework": "Testing",
    "appium": "Testing",
    "sonarqube": "Testing",
    "unit testing": "Testing",
    "integration testing": "Testing",
    "e2e testing": "Testing",
    "automated testing": "Testing",
    "manual testing": "Testing",

    # Data Science & AI
    "machine learning": "Data Science & AI",
    "ml": "Data Science & AI",
    "deep learning": "Data Science & AI",
    "dl": "Data Science & AI",
    "artificial intelligence": "Data Science & AI",
    "ai": "Data Science & AI",
    "data science": "Data Science & AI",
    "data analysis": "Data Science & AI",
    "data analytics": "Data Science & AI",
    "tensorflow": "Data Science & AI",
    "pytorch": "Data Science & AI",
    "keras": "Data Science & AI",
    "scikit-learn": "Data Science & AI",
    "scikit learn": "Data Science & AI",
    "sklearn": "Data Science & AI",
    "pandas": "Data Science & AI",
    "numpy": "Data Science & AI",
    "scipy": "Data Science & AI",
    "matplotlib": "Data Science & AI",
    "seaborn": "Data Science & AI",
    "opencv": "Data Science & AI",
    "nlp": "Data Science & AI",
    "natural language processing": "Data Science & AI",
    "computer vision": "Data Science & AI",
    "llms": "Data Science & AI",
    "llm": "Data Science & AI",
    "large language models": "Data Science & AI",
    "langchain": "Data Science & AI",
    "hugging face": "Data Science & AI",
    "huggingface": "Data Science & AI",
    "rag": "Data Science & AI",
    "power bi": "Data Science & AI",
    "powerbi": "Data Science & AI",
    "tableau": "Data Science & AI",
    "spark": "Data Science & AI",
    "apache spark": "Data Science & AI",
    "hadoop": "Data Science & AI",
    "bigquery": "Data Science & AI",
    "databricks": "Data Science & AI",
    "statistics": "Data Science & AI",
    "generative ai": "Data Science & AI",
    "genai": "Data Science & AI",

    # Frameworks & Libraries
    "flutter": "Frameworks & Libraries",
    "react native": "Frameworks & Libraries",
    "react-native": "Frameworks & Libraries",
    "electron": "Frameworks & Libraries",
    "ionic": "Frameworks & Libraries",
    "qt": "Frameworks & Libraries",
    "tkinter": "Frameworks & Libraries",
    "pygame": "Frameworks & Libraries",
    "core data": "Frameworks & Libraries",
    "swiftui": "Frameworks & Libraries",
    "jetpack compose": "Frameworks & Libraries",

    # Design
    "figma": "Design",
    "adobe xd": "Design",
    "photoshop": "Design",
    "adobe photoshop": "Design",
    "illustrator": "Design",
    "adobe illustrator": "Design",
    "ui/ux": "Design",
    "ui/ux design": "Design",
    "ui design": "Design",
    "ux design": "Design",
    "wireframing": "Design",
    "prototyping": "Design",
    "invision": "Design",
    "sketch": "Design",
    "canva": "Design",
    "blender": "Design",
    "user research": "Design",
    "interaction design": "Design",

    # Soft Skills
    "communication": "Soft Skills",
    "leadership": "Soft Skills",
    "problem solving": "Soft Skills",
    "problem-solving": "Soft Skills",
    "teamwork": "Soft Skills",
    "critical thinking": "Soft Skills",
    "time management": "Soft Skills",
    "adaptability": "Soft Skills",
    "collaboration": "Soft Skills",
    "project management": "Soft Skills",
    "agile": "Soft Skills",
    "scrum": "Soft Skills",
    "presentation skills": "Soft Skills",
    "conflict resolution": "Soft Skills",
    "mentoring": "Soft Skills",
    "public speaking": "Soft Skills",
    "analytical thinking": "Soft Skills",
    "decision making": "Soft Skills",
    "work ethic": "Soft Skills",
    "interpersonal skills": "Soft Skills",
    "customer service": "Soft Skills",
    "negotiation": "Soft Skills",
    "emotional intelligence": "Soft Skills",
}


def normalize_key(text: str) -> str:
    """Normalizes skill string by trimming, lowercasing, and replacing punctuation."""
    if not text:
        return ""
    import re
    cleaned = re.sub(r"[._-]+", " ", str(text).lower().strip())
    return re.sub(r"\s+", " ", cleaned).strip()


def categorize_single_skill(skill: str) -> str:
    """
    Classifies a single skill string into its best matching category.
    Returns 'Other Skills' if not confidently recognized.
    """
    if not skill or not isinstance(skill, str):
        return "Other Skills"
    raw_lower = skill.strip().lower()

    # 1. Exact lookup
    if raw_lower in SKILL_MAP:
        return SKILL_MAP[raw_lower]

    # 2. Normalized lookup
    norm = normalize_key(skill)
    if norm in SKILL_MAP:
        return SKILL_MAP[norm]

    return "Other Skills"


def categorize_skills(raw_skills: Union[List[Any], Dict[str, Any], None]) -> List[Tuple[str, List[str]]]:
    """
    Deduplicates and groups skills into structured, ordered categories.
    Returns a list of (category_name, skill_items) tuples.

    Rule 6: If the user enters only one type of skill:
      - If that only category is 'Other Skills', returns [("", skills)] for a clean layout without unnecessary headings.
      - If it is a single specific category (e.g. 'Programming Languages'), returns [(category, skills)].
    """
    if not raw_skills:
        return []

    # If already a dictionary mapping categories to skills
    if isinstance(raw_skills, dict):
        result: List[Tuple[str, List[str]]] = []
        for cat, items in raw_skills.items():
            item_list = items if isinstance(items, list) else [items]
            valid_items = [str(s).strip() for s in item_list if str(s).strip()]
            if valid_items:
                result.append((str(cat), valid_items))
        return result

    if not isinstance(raw_skills, list) or len(raw_skills) == 0:
        return []

    # Deduplicate case-insensitively while preserving original user casing
    seen_lower = set()
    unique_skills: List[str] = []
    for item in raw_skills:
        if not item:
            continue
        trimmed = str(item).strip()
        if not trimmed:
            continue
        lower = trimmed.lower()
        if lower not in seen_lower:
            seen_lower.add(lower)
            unique_skills.append(trimmed)

    if not unique_skills:
        return []

    # Group unique skills into buckets
    buckets: Dict[str, List[str]] = {cat: [] for cat in CATEGORY_ORDER}

    for skill in unique_skills:
        cat = categorize_single_skill(skill)
        if cat not in buckets:
            buckets[cat] = []
        buckets[cat].append(skill)

    # Gather active (non-empty) categories in designated order
    active_categories: List[Tuple[str, List[str]]] = []
    for cat in CATEGORY_ORDER:
        if buckets[cat]:
            active_categories.append((cat, buckets[cat]))

    # Rule 6: Handle single-category layout
    if len(active_categories) == 1:
        single_cat, single_skills = active_categories[0]
        if single_cat == "Other Skills":
            return [("", single_skills)]
        return [(single_cat, single_skills)]

    return active_categories
