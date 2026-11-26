import json
import random
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func

from app.models.career_discovery import StudentCareerDiscovery
from app.models.project import Project
from app.models.job import Job
from app.models.placement_preparation import PreparationRole, PreparationMaterial
from app.services.skill_intelligence import CURATED_ROLES


QUESTION_BANK: List[Dict[str, Any]] = [
    # ------------------ PYTHON DEVELOPMENT ------------------
    {
        "id": "py-01",
        "domain": "Python Development",
        "difficulty": "beginner",
        "question": "Which of the following data types in Python is immutable?",
        "options": [
            {"id": "A", "text": "list"},
            {"id": "B", "text": "tuple"},
            {"id": "C", "text": "dict"},
            {"id": "D", "text": "set"},
        ],
        "correct_option": "B",
        "explanation": "Tuples, strings, and integers are immutable in Python; their contents cannot be modified in-place after instantiation.",
        "concept": "Python Data Types & Immutability",
    },
    {
        "id": "py-02",
        "domain": "Python Development",
        "difficulty": "beginner",
        "question": "What is the primary purpose of Python's `__init__` method in a class definition?",
        "options": [
            {"id": "A", "text": "To destroy an object when garbage collected"},
            {"id": "B", "text": "To initialize the attributes of a newly created instance"},
            {"id": "C", "text": "To convert the object to a string representation"},
            {"id": "D", "text": "To make class methods static"},
        ],
        "correct_option": "B",
        "explanation": "`__init__` is Python's constructor-like initializer method called automatically when creating a new instance.",
        "concept": "Object-Oriented Programming (OOP)",
    },
    {
        "id": "py-03",
        "domain": "Python Development",
        "difficulty": "intermediate",
        "question": "What is the key advantage of using a generator expression (`yield`) over a list comprehension?",
        "options": [
            {"id": "A", "text": "Generators can only run on multi-threaded CPUs"},
            {"id": "B", "text": "Generators evaluate lazily, consuming minimal memory for large sequences"},
            {"id": "C", "text": "Generators are faster because they skip bytecode compilation"},
            {"id": "D", "text": "Generators allow indexing and slicing just like lists"},
        ],
        "correct_option": "B",
        "explanation": "Generators produce items on demand using lazy evaluation, preventing entire sequences from loading into memory.",
        "concept": "Generators & Memory Optimization",
    },
    {
        "id": "py-04",
        "domain": "Python Development",
        "difficulty": "intermediate",
        "question": "In Python, what is the Global Interpreter Lock (GIL)?",
        "options": [
            {"id": "A", "text": "A firewall mechanism preventing unauthorized network requests"},
            {"id": "B", "text": "A mutex that prevents multiple native threads from executing Python bytecodes simultaneously in CPython"},
            {"id": "C", "text": "A lock that prevents file overwrites during concurrent disk I/O"},
            {"id": "D", "text": "A cryptographic signature required for package imports"},
        ],
        "correct_option": "B",
        "explanation": "In standard CPython, the GIL ensures thread safety by allowing only one native OS thread to run Python bytecodes at any time.",
        "concept": "CPython Internals & Concurrency",
    },
    {
        "id": "py-05",
        "domain": "Python Development",
        "difficulty": "advanced",
        "question": "When defining a custom decorator that accepts parameters, how many nested functions are typically required?",
        "options": [
            {"id": "A", "text": "One function only"},
            {"id": "B", "text": "Two functions (the decorator and wrapper)"},
            {"id": "C", "text": "Three functions (the argument acceptor, the actual decorator, and the inner wrapper)"},
            {"id": "D", "text": "Decorators cannot accept custom arguments"},
        ],
        "correct_option": "C",
        "explanation": "A parameterized decorator has an outer function taking the arguments, returning a decorator function taking the target callable, which returns the wrapper.",
        "concept": "Advanced Python Decorators & Closures",
    },

    # ------------------ JAVA DEVELOPMENT ------------------
    {
        "id": "java-01",
        "domain": "Java Development",
        "difficulty": "beginner",
        "question": "Which OOP concept in Java allows a subclass to provide a specific implementation of a method already defined in its superclass?",
        "options": [
            {"id": "A", "text": "Method Overloading"},
            {"id": "B", "text": "Method Overriding"},
            {"id": "C", "text": "Encapsulation"},
            {"id": "D", "text": "Static Binding"},
        ],
        "correct_option": "B",
        "explanation": "Method Overriding occurs when a child class provides its own runtime implementation of an inherited parent method.",
        "concept": "Java Polymorphism & Method Overriding",
    },
    {
        "id": "java-02",
        "domain": "Java Development",
        "difficulty": "beginner",
        "question": "What is the difference between `==` and `.equals()` when comparing two String objects in Java?",
        "options": [
            {"id": "A", "text": "`==` compares character content, `.equals()` compares memory address"},
            {"id": "B", "text": "`==` compares object references (memory address), `.equals()` compares character content"},
            {"id": "C", "text": "They are completely identical in all Java versions"},
            {"id": "D", "text": "`.equals()` can only be used on primitive numbers"},
        ],
        "correct_option": "B",
        "explanation": "In Java, `==` tests whether both references point to the exact same memory address, whereas `.equals()` evaluates semantic equality of contents.",
        "concept": "Java String Pool & Object Equality",
    },
    {
        "id": "java-03",
        "domain": "Java Development",
        "difficulty": "intermediate",
        "question": "Which interface in the Java Collections Framework provides constant-time average performance O(1) for `get()` and `put()` operations?",
        "options": [
            {"id": "A", "text": "TreeMap"},
            {"id": "B", "text": "LinkedList"},
            {"id": "C", "text": "HashMap"},
            {"id": "D", "text": "TreeSet"},
        ],
        "correct_option": "C",
        "explanation": "`HashMap` uses hashing and bucket array distribution to provide average O(1) time complexity for insertions and lookups.",
        "concept": "Java Collections & Time Complexity",
    },
    {
        "id": "java-04",
        "domain": "Java Development",
        "difficulty": "intermediate",
        "question": "What does the `volatile` keyword in Java guarantee for a variable accessed across multiple threads?",
        "options": [
            {"id": "A", "text": "Atomicity for compound operations like count++"},
            {"id": "B", "text": "Visibility of changes directly to main memory across threads and prevents instruction reordering"},
            {"id": "C", "text": "Automatic thread pooling and synchronization locks"},
            {"id": "D", "text": "Persistence to local disk storage"},
        ],
        "correct_option": "B",
        "explanation": "`volatile` ensures memory visibility (reads/writes go directly to RAM instead of CPU L1/L2 caches) and prevents hardware instruction reordering.",
        "concept": "Java Concurrency & Memory Model",
    },

    # ------------------ WEB DEVELOPMENT (FRONTEND & BACKEND) ------------------
    {
        "id": "web-01",
        "domain": "Web Development",
        "difficulty": "beginner",
        "question": "Which HTTP status code signifies that a requested resource was successfully created on the server?",
        "options": [
            {"id": "A", "text": "200 OK"},
            {"id": "B", "text": "201 Created"},
            {"id": "C", "text": "204 No Content"},
            {"id": "D", "text": "304 Not Modified"},
        ],
        "correct_option": "B",
        "explanation": "HTTP status code 201 indicates that the request succeeded and led to the creation of a new resource on the server.",
        "concept": "RESTful API Standards & HTTP Semantics",
    },
    {
        "id": "web-02",
        "domain": "Web Development",
        "difficulty": "beginner",
        "question": "In React, why is assigning unique `key` props important when rendering dynamic arrays of elements?",
        "options": [
            {"id": "A", "text": "Keys serve as CSS selectors for styling"},
            {"id": "B", "text": "Keys help React's Virtual DOM reconciliation identify which items have changed, been added, or removed"},
            {"id": "C", "text": "Keys encrypt data passed between client and server"},
            {"id": "D", "text": "Keys are required by the browser's native DOM parser"},
        ],
        "correct_option": "B",
        "explanation": "React uses `key` props during virtual DOM reconciliation to stably match existing nodes without unnecessarily re-rendering or unmounting siblings.",
        "concept": "React Virtual DOM Reconciliation",
    },
    {
        "id": "web-03",
        "domain": "Web Development",
        "difficulty": "intermediate",
        "question": "What is the primary difference between `localStorage` and `sessionStorage` in modern web browsers?",
        "options": [
            {"id": "A", "text": "`localStorage` data persists across browser restarts; `sessionStorage` clears when the page session/tab ends"},
            {"id": "B", "text": "`localStorage` sends data automatically with every HTTP request; `sessionStorage` does not"},
            {"id": "C", "text": "`sessionStorage` can store up to 500MB; `localStorage` is restricted to 5KB"},
            {"id": "D", "text": "`sessionStorage` works only with HTTPS; `localStorage` works with HTTP"},
        ],
        "correct_option": "A",
        "explanation": "`localStorage` persists indefinitely until cleared explicitly, whereas `sessionStorage` is scoped to the browser tab session.",
        "concept": "Client-Side Browser Storage",
    },
    {
        "id": "web-04",
        "domain": "Web Development",
        "difficulty": "intermediate",
        "question": "In relational databases, what type of index is best suited for accelerating range queries like `WHERE created_at BETWEEN ? AND ?`?",
        "options": [
            {"id": "A", "text": "Hash Index"},
            {"id": "B", "text": "B-Tree Index"},
            {"id": "C", "text": "Bitmap Index only"},
            {"id": "D", "text": "Full-text Index"},
        ],
        "correct_option": "B",
        "explanation": "B-Trees keep keys sorted in hierarchical order, making them ideal for range scans and inequality comparisons, unlike Hash indexes.",
        "concept": "Database Indexing & Query Optimization",
    },
    {
        "id": "web-05",
        "domain": "Web Development",
        "difficulty": "advanced",
        "question": "What is Cross-Origin Resource Sharing (CORS) preflight request?",
        "options": [
            {"id": "A", "text": "A POST request with user credentials to obtain an auth token"},
            {"id": "B", "text": "An HTTP OPTIONS request sent by the browser to determine whether the server permits the actual cross-origin request"},
            {"id": "C", "text": "A DNS lookup verifying domain ownership before TCP handshake"},
            {"id": "D", "text": "A TLS certificate exchange between microservices"},
        ],
        "correct_option": "B",
        "explanation": "Browsers send an OPTIONS request before non-simple cross-origin requests to check allowed HTTP methods and custom headers.",
        "concept": "Web Security & CORS Architecture",
    },

    # ------------------ DATA SCIENCE & AI / ML ------------------
    {
        "id": "ds-01",
        "domain": "Data Science & AI",
        "difficulty": "beginner",
        "question": "What does a high variance model typically suffer from in supervised machine learning?",
        "options": [
            {"id": "A", "text": "Underfitting (failing to capture trends in training data)"},
            {"id": "B", "text": "Overfitting (modeling noise in training data and failing to generalize to unseen test data)"},
            {"id": "C", "text": "Data leakage from target encoding"},
            {"id": "D", "text": "Vanishing gradient problem"},
        ],
        "correct_option": "B",
        "explanation": "High variance means the model fits training samples too tightly (memorizing noise), causing degraded performance on new test data (overfitting).",
        "concept": "Bias-Variance Tradeoff",
    },
    {
        "id": "ds-02",
        "domain": "Data Science & AI",
        "difficulty": "beginner",
        "question": "Which Pandas function is most commonly used to inspect missing values across columns in a DataFrame?",
        "options": [
            {"id": "A", "text": "df.isna().sum()"},
            {"id": "B", "text": "df.drop_nulls()"},
            {"id": "C", "text": "df.describe(all=True)"},
            {"id": "D", "text": "df.values.count()"},
        ],
        "correct_option": "A",
        "explanation": "`df.isna().sum()` checks boolean null conditions per cell and tallies missing counts per feature column.",
        "concept": "Data Cleaning & Pandas Exploration",
    },
    {
        "id": "ds-03",
        "domain": "Data Science & AI",
        "difficulty": "intermediate",
        "question": "When evaluating an imbalanced binary classification dataset (e.g. fraud detection where 99.5% of transactions are legitimate), why is raw Accuracy misleading?",
        "options": [
            {"id": "A", "text": "Accuracy cannot be calculated on float values"},
            {"id": "B", "text": "A naive model predicting 'no fraud' for all records scores 99.5% accuracy while identifying zero fraudulent cases"},
            {"id": "C", "text": "Accuracy only works with neural network architectures"},
            {"id": "D", "text": "Accuracy does not handle categorical features"},
        ],
        "correct_option": "B",
        "explanation": "In skewed distributions, trivial majority predictors yield deceptively high accuracy. Metrics like Precision, Recall, and PR-AUC are far more diagnostic.",
        "concept": "Model Evaluation on Imbalanced Data",
    },
    {
        "id": "ds-04",
        "domain": "Data Science & AI",
        "difficulty": "intermediate",
        "question": "In deep learning, what is the primary role of an Activation Function (like ReLU or GELU)?",
        "options": [
            {"id": "A", "text": "To serialize tensor weights to disk during training checkpoints"},
            {"id": "B", "text": "To introduce non-linearity, enabling the network to learn complex non-linear decision boundaries"},
            {"id": "C", "text": "To balance the learning rate dynamically across GPU cores"},
            {"id": "D", "text": "To prevent RAM swapping during batch normalization"},
        ],
        "correct_option": "B",
        "explanation": "Without non-linear activations, stacks of linear layers collapse mathematically into a single matrix multiplication incapable of solving non-linear problems.",
        "concept": "Neural Networks & Activation Functions",
    },

    # ------------------ CLOUD & DEVOPS ------------------
    {
        "id": "cloud-01",
        "domain": "Cloud & DevOps",
        "difficulty": "beginner",
        "question": "What is the primary difference between a Docker container and a traditional Virtual Machine (VM)?",
        "options": [
            {"id": "A", "text": "Containers require their own complete guest operating system; VMs do not"},
            {"id": "B", "text": "Containers share the host OS kernel and isolate at process level, making them lightweight; VMs emulate full hardware with a guest OS"},
            {"id": "C", "text": "Containers cannot be networked or assigned IP addresses"},
            {"id": "D", "text": "Containers run slower because they must compile source code on startup"},
        ],
        "correct_option": "B",
        "explanation": "Containers virtualize at the OS layer via Linux namespaces and cgroups, sharing the host kernel rather than emulating virtual hardware.",
        "concept": "Containerization vs Virtualization",
    },
    {
        "id": "cloud-02",
        "domain": "Cloud & DevOps",
        "difficulty": "intermediate",
        "question": "In CI/CD pipelines, what is the role of 'Continuous Integration' (CI)?",
        "options": [
            {"id": "A", "text": "Automatically shipping code to production servers on Friday evenings"},
            {"id": "B", "text": "Automatically merging developer changes to a shared mainline, running unit tests and builds to catch integration bugs early"},
            {"id": "C", "text": "Monitoring cloud infrastructure spending limits"},
            {"id": "D", "text": "Replacing developer code reviews with automated pull requests"},
        ],
        "correct_option": "B",
        "explanation": "Continuous Integration focuses on frequent code integration, automated builds, linting, and automated unit test verification.",
        "concept": "CI/CD Pipeline Automation",
    },

    # ------------------ CYBERSECURITY ------------------
    {
        "id": "sec-01",
        "domain": "Cybersecurity",
        "difficulty": "beginner",
        "question": "How do parameterized queries (prepared statements) protect against SQL Injection attacks?",
        "options": [
            {"id": "A", "text": "By compressing SQL strings to hide table names"},
            {"id": "B", "text": "By separating query structure from user input parameters, preventing user input from altering execution logic"},
            {"id": "C", "text": "By blocking all incoming traffic from unknown IP subnets"},
            {"id": "D", "text": "By executing queries exclusively inside sandboxed docker containers"},
        ],
        "correct_option": "B",
        "explanation": "Prepared statements pre-compile the SQL template; user inputs are bound strictly as parameters, never interpreted as executable syntax.",
        "concept": "SQL Injection Prevention & Input Sanitization",
    },
    {
        "id": "sec-02",
        "domain": "Cybersecurity",
        "difficulty": "intermediate",
        "question": "What is the fundamental difference between Encryption and Cryptographic Hashing?",
        "options": [
            {"id": "A", "text": "Encryption is two-way (can be decrypted with a key); Hashing is one-way (cannot be reversed to original plaintext)"},
            {"id": "B", "text": "Hashing requires private keys; Encryption never uses keys"},
            {"id": "C", "text": "Hashing produces outputs of variable length depending on text size; Encryption always produces fixed length"},
            {"id": "D", "text": "There is no difference; they are interchangeable terms"},
        ],
        "correct_option": "A",
        "explanation": "Encryption transforms plaintext to ciphertext with the intention of authorized decryption; cryptographic hash functions are irreversibly one-way.",
        "concept": "Cryptography (Hashing vs Encryption)",
    },

    # ------------------ GENERAL SOFTWARE ENGINEERING ------------------
    {
        "id": "swe-01",
        "domain": "Software Engineering",
        "difficulty": "beginner",
        "question": "In Big-O notation, what is the average time complexity of searching an element in a balanced Binary Search Tree (BST)?",
        "options": [
            {"id": "A", "text": "O(1)"},
            {"id": "B", "text": "O(log n)"},
            {"id": "C", "text": "O(n)"},
            {"id": "D", "text": "O(n²)"},
        ],
        "correct_option": "B",
        "explanation": "A balanced BST cuts the remaining search space roughly in half with each node comparison, yielding logarithmic O(log n) time.",
        "concept": "Data Structures & Big-O Complexity",
    },
    {
        "id": "swe-02",
        "domain": "Software Engineering",
        "difficulty": "intermediate",
        "question": "In Git, what is the effect of running `git rebase main` on a feature branch compared to `git merge main`?",
        "options": [
            {"id": "A", "text": "Rebase deletes all commit history on the feature branch"},
            {"id": "B", "text": "Rebase replays the feature branch commits on top of main's latest commit, creating a linear history without a merge commit"},
            {"id": "C", "text": "Rebase automatically pushes code to the remote production repository"},
            {"id": "D", "text": "Rebase converts all Git submodules into detached HEADs"},
        ],
        "correct_option": "B",
        "explanation": "Rebase rewinds feature commits, fast-forwards the base to main's tip, and re-applies feature commits one by one for a clean linear history.",
        "concept": "Git Version Control Best Practices",
    },
]


class CareerDiscoveryService:
    """
    Intelligent Career Discovery & Guidance Engine:
    - Generates adaptive 5-7 question technical assessments.
    - Evaluates student competency across domains.
    - Generates personalized recommendations matching real jobs, projects, and guides.
    - Produces a 7-stage actionable roadmap.
    """

    @staticmethod
    async def get_or_create_discovery(db: AsyncSession, user_id: Any) -> StudentCareerDiscovery:
        stmt = select(StudentCareerDiscovery).where(StudentCareerDiscovery.user_id == user_id)
        discovery = (await db.scalars(stmt)).first()

        if not discovery:
            discovery = StudentCareerDiscovery(
                user_id=user_id,
                status="not_started",
                current_step=1,
            )
            db.add(discovery)
            await db.commit()
            await db.refresh(discovery)

        return discovery

    @staticmethod
    async def save_questionnaire_progress(
        db: AsyncSession,
        user_id: Any,
        data: Dict[str, Any]
    ) -> StudentCareerDiscovery:
        discovery = await CareerDiscoveryService.get_or_create_discovery(db, user_id)

        if "current_step" in data:
            discovery.current_step = int(data["current_step"])
        if "education_info" in data:
            discovery.education_info = data["education_info"]
        if "technical_interests" in data:
            discovery.technical_interests = data["technical_interests"]
        if "skill_level" in data:
            discovery.skill_level = data["skill_level"]
        if "self_reported_skills" in data:
            discovery.self_reported_skills = data["self_reported_skills"]
        if "career_goals" in data:
            discovery.career_goals = data["career_goals"]
        if "learning_preferences" in data:
            discovery.learning_preferences = data["learning_preferences"]

        if discovery.status == "not_started":
            discovery.status = "questionnaire_in_progress"

        await db.commit()
        await db.refresh(discovery)
        return discovery

    @staticmethod
    def generate_assessment_questions(
        interests: List[str],
        skill_level: str
    ) -> List[Dict[str, Any]]:
        domain_mapping = {
            "python development": "Python Development",
            "python": "Python Development",
            "java development": "Java Development",
            "java": "Java Development",
            "web development": "Web Development",
            "full stack development": "Web Development",
            "frontend development": "Web Development",
            "backend development": "Web Development",
            "data science & ai": "Data Science & AI",
            "data science": "Data Science & AI",
            "machine learning": "Data Science & AI",
            "cloud & devops": "Cloud & DevOps",
            "devops": "Cloud & DevOps",
            "cloud": "Cloud & DevOps",
            "cybersecurity": "Cybersecurity",
        }

        matched_domains = set()
        for interest in (interests or []):
            normalized = interest.strip().lower()
            for key, val in domain_mapping.items():
                if key in normalized:
                    matched_domains.add(val)

        if not matched_domains:
            matched_domains = {"Python Development", "Web Development", "Software Engineering"}

        target_difficulty = (skill_level or "beginner").lower()
        if target_difficulty not in ["beginner", "intermediate", "advanced"]:
            target_difficulty = "beginner"

        candidates = [
            q for q in QUESTION_BANK
            if q["domain"] in matched_domains or q["domain"] == "Software Engineering"
        ]

        exact_matches = [q for q in candidates if q["difficulty"] == target_difficulty]
        other_matches = [q for q in candidates if q["difficulty"] != target_difficulty]

        combined = exact_matches + other_matches
        if len(combined) < 5:
            combined = QUESTION_BANK.copy()

        # Exact 5-question selection
        count = 5
        seen_ids = set()
        deduped_combined = []
        for q in combined:
            if q["id"] not in seen_ids:
                seen_ids.add(q["id"])
                deduped_combined.append(q)

        if len(deduped_combined) < 5:
            for q in QUESTION_BANK:
                if q["id"] not in seen_ids:
                    seen_ids.add(q["id"])
                    deduped_combined.append(q)

        # Deterministic or sample of exactly 5 questions
        selected = deduped_combined[:count]

        client_questions = []
        for q in selected:
            client_questions.append({
                "id": q["id"],
                "domain": q["domain"],
                "difficulty": q["difficulty"],
                "question": q["question"],
                "options": q["options"],
                "concept": q["concept"],
            })

        return client_questions[:5]

    @staticmethod
    def evaluate_assessment(
        questions: List[Dict[str, Any]],
        answers: Dict[str, str]
    ) -> Dict[str, Any]:
        question_lookup = {q["id"]: q for q in QUESTION_BANK}

        total = len(questions)
        correct_count = 0
        domain_stats: Dict[str, Dict[str, int]] = {}
        question_details = []

        for q in questions:
            q_id = q["id"]
            user_answer = (answers.get(q_id) or "").strip().upper()
            bank_q = question_lookup.get(q_id)

            is_correct = False
            correct_choice = ""
            explanation = ""
            domain = q.get("domain", "General")

            if domain not in domain_stats:
                domain_stats[domain] = {"total": 0, "correct": 0}
            domain_stats[domain]["total"] += 1

            if bank_q:
                correct_choice = bank_q["correct_option"]
                explanation = bank_q["explanation"]
                is_correct = (user_answer == correct_choice)

            if is_correct:
                correct_count += 1
                domain_stats[domain]["correct"] += 1

            question_details.append({
                "id": q_id,
                "question": q["question"],
                "domain": domain,
                "user_answer": user_answer,
                "correct_answer": correct_choice,
                "is_correct": is_correct,
                "explanation": explanation,
                "concept": q.get("concept", ""),
            })

        accuracy = round((correct_count / total * 100), 1) if total > 0 else 0

        if accuracy >= 80:
            level_label = "Strong Foundation"
            recommendation_note = "Your conceptual fundamentals are solid! Focus on advanced architecture, real-world deployment, and complex system design."
        elif accuracy >= 50:
            level_label = "Developing Competence"
            recommendation_note = "Good grasp of core concepts. Deepen your understanding with hands-on coding projects and targeted interview question review."
        else:
            level_label = "Foundational Stage"
            recommendation_note = "Great start. Strengthen fundamental data structures, language patterns, and basic application building through curated guides."

        return {
            "score": correct_count,
            "total": total,
            "accuracy_percentage": accuracy,
            "level_label": level_label,
            "recommendation_note": recommendation_note,
            "disclaimer": "This is an indicative diagnostic assessment for personalized career guidance, not an official certification.",
            "domain_breakdown": domain_stats,
            "details": question_details,
        }

    @staticmethod
    async def generate_recommendations(
        discovery_data: Dict[str, Any],
        db: AsyncSession
    ) -> Dict[str, Any]:
        raw_interests = discovery_data.get("technical_interests") or []
        interests = [str(i).lower() for i in raw_interests if i]
        raw_skills = discovery_data.get("self_reported_skills") or []
        self_skills = [str(s).strip().lower() for s in raw_skills if s]
        assessment_result = discovery_data.get("assessment_result") or {}
        accuracy = assessment_result.get("accuracy_percentage", 60)

        # Match against CURATED_ROLES
        scored_roles = []
        for role_name, role_data in CURATED_ROLES.items():
            role_skills = [s.lower() for s in role_data.get("core_skills", [])]
            role_desc = role_data.get("description", "").lower()
            role_lower = role_name.lower()

            interest_score = 0
            for interest in interests:
                if any(word in role_lower or word in role_desc for word in interest.split()):
                    interest_score += 20
            interest_score = min(interest_score, 40)

            overlap = set(self_skills).intersection(set(role_skills))
            skill_score = min(len(overlap) * 12, 40)

            perf_score = int((accuracy / 100) * 20)
            total_match = min(interest_score + skill_score + perf_score, 98)

            if total_match < 45 and any(word in role_lower for word in ["software", "developer", "engineer"]):
                total_match = 52

            missing_skills = [s for s in role_data.get("core_skills", []) if s.lower() not in self_skills]
            matched_skills_list = [s for s in role_data.get("core_skills", []) if s.lower() in self_skills]

            scored_roles.append({
                "role_name": role_name,
                "match_percentage": total_match,
                "description": role_data.get("description"),
                "core_skills": role_data.get("core_skills", []),
                "matched_skills": matched_skills_list,
                "missing_skills": missing_skills,
                "career_track": role_data.get("category", "Engineering"),
            })

        scored_roles.sort(key=lambda x: x["match_percentage"], reverse=True)
        top_roles = scored_roles[:3]
        primary_role = top_roles[0] if top_roles else None

        # Fetch relevant published projects from DB
        recommended_projects = []
        try:
            stmt = select(Project).where(Project.status == "Published").order_by(Project.created_at.desc()).limit(6)
            projects_query = (await db.scalars(stmt)).all()

            for proj in projects_query:
                p_tech = [t.strip().lower() for t in proj.tech_stack.split(",") if t.strip()] if proj.tech_stack else []
                overlaps_gap = any(t in [s.lower() for s in primary_role["missing_skills"]] for t in p_tech) if primary_role else False

                recommended_projects.append({
                    "id": str(proj.id) if proj.id else None,
                    "title": proj.title,
                    "slug": proj.slug,
                    "domain": proj.domain,
                    "tech_stack": proj.tech_stack,
                    "difficulty": proj.difficulty,
                    "why_recommended": "Builds your gap skills" if overlaps_gap else "Verified showcase project",
                })
        except Exception:
            recommended_projects = []

        # Fetch placement preparation resources from DB
        recommended_prep = []
        try:
            prep_materials = (await db.scalars(select(PreparationMaterial).limit(4))).all()
            for mat in prep_materials:
                recommended_prep.append({
                    "id": str(mat.id) if mat.id else None,
                    "title": mat.title,
                    "file_name": mat.file_name,
                    "topic_id": str(mat.topic_id) if mat.topic_id else None,
                    "link": "/placement-preparation",
                })
        except Exception:
            recommended_prep = []

        # Fetch matching active jobs with transparent criteria
        matched_jobs = []
        try:
            active_jobs = (await db.scalars(select(Job).where(Job.is_active == True).order_by(Job.created_at.desc()).limit(8))).all()

            for job in active_jobs:
                job_skills = [s.strip().lower() for s in job.skills_required.split(",") if s.strip()] if job.skills_required else []
                matching_skills = [s for s in job_skills if s in self_skills]
                match_pct = 50
                if matching_skills:
                    match_pct += min(len(matching_skills) * 15, 45)

                matched_jobs.append({
                    "id": str(job.id) if job.id else None,
                    "title": job.title,
                    "company_name": job.company_name,
                    "location": job.location,
                    "job_type": job.job_type,
                    "work_mode": job.work_mode,
                    "domain": job.domain,
                    "match_score": min(match_pct, 98),
                    "matching_skills": [s.title() for s in matching_skills],
                    "apply_url": job.apply_url,
                    "is_active": True,
                })

            matched_jobs.sort(key=lambda j: j["match_score"], reverse=True)
        except Exception:
            matched_jobs = []

        # 7-Stage Career Roadmap
        roadmap = [
            {
                "stage_id": 1,
                "title": "Core Skill Acquisition",
                "description": f"Master the foundational skills for {primary_role['role_name'] if primary_role else 'your role'}. Focus on high-priority missing competencies.",
                "action_label": "Explore Skill Matrix",
                "target_route": "/skill-intelligence",
                "status": "in_progress",
                "estimated_time": "2-4 Weeks",
            },
            {
                "stage_id": 2,
                "title": "Practical Showcase Projects",
                "description": "Build and publish production-grade projects that demonstrate runnable code, clean architecture, and API design.",
                "action_label": "Browse Showcase Blueprints",
                "target_route": "/projects",
                "status": "pending",
                "estimated_time": "3-5 Weeks",
            },
            {
                "stage_id": 3,
                "title": "Technical Interview Preparation",
                "description": "Review topic-wise interview guides covering OOP, database queries, and role-specific technical problem solving.",
                "action_label": "Study Prep Guides",
                "target_route": "/placement-preparation",
                "status": "pending",
                "estimated_time": "1-2 Weeks",
            },
            {
                "stage_id": 4,
                "title": "ATS-Approved Resume Selection",
                "description": "Choose an ATS-tested resume layout that properly highlights verified projects, technical stack, and education.",
                "action_label": "Select Resume Template",
                "target_route": "/templates",
                "status": "pending",
                "estimated_time": "1 Day",
            },
            {
                "stage_id": 5,
                "title": "ATS Compatibility Scan",
                "description": "Scan your resume against real target job descriptions to identify missing keywords and formatting improvements.",
                "action_label": "Run ATS Scan",
                "target_route": "/ats-analyzer",
                "status": "pending",
                "estimated_time": "2 Days",
            },
            {
                "stage_id": 6,
                "title": "Targeted Job & Internship Applications",
                "description": "Apply to verified openings matching your profile, graduation batch, and technical skills.",
                "action_label": "Explore Matched Jobs",
                "target_route": "/jobs",
                "status": "pending",
                "estimated_time": "Ongoing",
            },
            {
                "stage_id": 7,
                "title": "Active Application Tracking",
                "description": "Keep track of all submitted applications, interview stages, and feedback in your dedicated tracker.",
                "action_label": "View Applications",
                "target_route": "/applications",
                "status": "pending",
                "estimated_time": "Continuous",
            },
        ]

        return {
            "primary_role": primary_role,
            "recommended_roles": top_roles,
            "recommended_projects": recommended_projects[:4],
            "recommended_preparation": recommended_prep[:3],
            "matched_jobs": matched_jobs[:4],
            "roadmap": roadmap,
        }

    @staticmethod
    def get_fallback_recommendations(discovery_data: Dict[str, Any]) -> Dict[str, Any]:
        raw_interests = discovery_data.get("technical_interests") or []
        interests = [str(i).lower() for i in raw_interests if i]
        raw_skills = discovery_data.get("self_reported_skills") or []
        self_skills = [str(s).strip().lower() for s in raw_skills if s]
        assessment_result = discovery_data.get("assessment_result") or {}
        accuracy = assessment_result.get("accuracy_percentage", 60)

        scored_roles = []
        for role_name, role_data in CURATED_ROLES.items():
            role_skills = [s.lower() for s in role_data.get("core_skills", [])]
            role_desc = role_data.get("description", "").lower()
            role_lower = role_name.lower()

            interest_score = 0
            for interest in interests:
                if any(word in role_lower or word in role_desc for word in interest.split()):
                    interest_score += 20
            interest_score = min(interest_score, 40)

            overlap = set(self_skills).intersection(set(role_skills))
            skill_score = min(len(overlap) * 12, 40)
            perf_score = int((accuracy / 100) * 20)
            total_match = min(interest_score + skill_score + perf_score, 98)

            if total_match < 45 and any(word in role_lower for word in ["software", "developer", "engineer"]):
                total_match = 52

            missing_skills = [s for s in role_data.get("core_skills", []) if s.lower() not in self_skills]
            matched_skills_list = [s for s in role_data.get("core_skills", []) if s.lower() in self_skills]

            scored_roles.append({
                "role_name": role_name,
                "match_percentage": total_match,
                "description": role_data.get("description"),
                "core_skills": role_data.get("core_skills", []),
                "matched_skills": matched_skills_list,
                "missing_skills": missing_skills,
                "career_track": role_data.get("category", "Engineering"),
            })

        scored_roles.sort(key=lambda x: x["match_percentage"], reverse=True)
        top_roles = scored_roles[:3]
        primary_role = top_roles[0] if top_roles else None

        role_label = primary_role["role_name"] if primary_role else "Software Engineer"

        fallback_projects = [
            {
                "id": "proj-curated-1",
                "title": f"Production-Grade {role_label} Showcase Project",
                "slug": "production-showcase-application",
                "domain": "Engineering",
                "tech_stack": ", ".join(primary_role.get("core_skills", ["Python", "FastAPI"])[:4]) if primary_role else "Python, React, PostgreSQL",
                "difficulty": "Intermediate",
                "why_recommended": "Builds high-priority skills demonstrated in your gap analysis.",
            },
            {
                "id": "proj-curated-2",
                "title": "Real-Time Distributed Event Processing System",
                "slug": "distributed-event-processor",
                "domain": "Software Engineering",
                "tech_stack": "FastAPI, WebSockets, Redis, Docker",
                "difficulty": "Advanced",
                "why_recommended": "Demonstrates architectural design and throughput optimization.",
            },
        ]

        fallback_prep = [
            {
                "id": "prep-curated-1",
                "title": "Data Structures & Algorithmic Complexity Masterclass",
                "file_name": "dsa-interview-guide.pdf",
                "topic_id": "topic-dsa",
                "link": "/placement-preparation",
            },
            {
                "id": "prep-curated-2",
                "title": "OOP Architecture, Clean Code & System Design",
                "file_name": "oop-system-design-guide.pdf",
                "topic_id": "topic-oop",
                "link": "/placement-preparation",
            },
        ]

        fallback_jobs = [
            {
                "id": "job-curated-1",
                "title": f"Junior / Associate {role_label}",
                "company_name": "AspirePath Tech Partners",
                "location": "Bengaluru / Hybrid",
                "job_type": "Full-time",
                "work_mode": "Hybrid",
                "domain": "Engineering",
                "match_score": primary_role.get("match_percentage", 85) if primary_role else 85,
                "matching_skills": primary_role.get("matched_skills", ["Problem Solving"]) if primary_role else ["Python"],
                "apply_url": "/jobs",
                "is_active": True,
            }
        ]

        roadmap = [
            {
                "stage_id": 1,
                "title": "Core Skill Acquisition",
                "description": f"Master the foundational competencies for {role_label}. Focus on high-priority missing skills: {', '.join(primary_role.get('missing_skills', [])[:3]) if primary_role else 'Core Programming'}.",
                "action_label": "Explore Skill Matrix",
                "target_route": "/skill-intelligence",
                "status": "in_progress",
                "estimated_time": "2-4 Weeks",
            },
            {
                "stage_id": 2,
                "title": "Practical Showcase Projects",
                "description": f"Build and publish production-grade showcase projects demonstrating clean API design and runnable code for {role_label}.",
                "action_label": "Browse Showcase Blueprints",
                "target_route": "/projects",
                "status": "pending",
                "estimated_time": "3-5 Weeks",
            },
            {
                "stage_id": 3,
                "title": "Technical Interview Preparation",
                "description": "Study curated placement preparation guides covering Big-O, OOP, system design, and database queries.",
                "action_label": "Study Prep Guides",
                "target_route": "/placement-preparation",
                "status": "pending",
                "estimated_time": "1-2 Weeks",
            },
            {
                "stage_id": 4,
                "title": "ATS-Approved Resume Selection",
                "description": "Select an ATS-tested resume layout to properly format your verified showcase projects and competencies.",
                "action_label": "Select Resume Template",
                "target_route": "/templates",
                "status": "pending",
                "estimated_time": "1 Day",
            },
            {
                "stage_id": 5,
                "title": "ATS Compatibility Scan",
                "description": "Scan and score your resume against real target job descriptions with deterministic keyword analysis.",
                "action_label": "Run ATS Scan",
                "target_route": "/ats-analyzer",
                "status": "pending",
                "estimated_time": "2 Days",
            },
            {
                "stage_id": 6,
                "title": "Targeted Job & Internship Applications",
                "description": f"Apply to verified openings matching your profile, graduation timeline, and technical skills.",
                "action_label": "Explore Matched Jobs",
                "target_route": "/jobs",
                "status": "pending",
                "estimated_time": "Ongoing",
            },
            {
                "stage_id": 7,
                "title": "Active Application Tracking",
                "description": "Track all submitted job applications, interview milestones, and feedback in your dedicated tracker.",
                "action_label": "View Applications",
                "target_route": "/applications",
                "status": "pending",
                "estimated_time": "Continuous",
            },
        ]

        return {
            "primary_role": primary_role,
            "recommended_roles": top_roles,
            "recommended_projects": fallback_projects,
            "recommended_preparation": fallback_prep,
            "matched_jobs": fallback_jobs,
            "roadmap": roadmap,
        }
