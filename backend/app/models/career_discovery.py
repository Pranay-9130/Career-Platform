import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.models.base import BaseUUIDModel, TimestampMixin


class StudentCareerDiscovery(BaseUUIDModel, TimestampMixin):
    """
    Stores a student's Career Discovery questionnaire progress,
    indicative skill assessment answers & scores, generated recommendations,
    and 7-stage actionable career roadmap tracking.
    """
    __tablename__ = "student_career_discoveries"

    user_id = Column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    # Current flow status: 'not_started', 'questionnaire_in_progress', 'assessment_ready', 'completed'
    status = Column(String(50), nullable=False, default="not_started")
    current_step = Column(Integer, nullable=False, default=1)

    # Step 1: Education Info
    # e.g. {"college_name": "...", "degree": "...", "branch": "...", "current_year": "3rd Year", "graduation_year": 2026}
    education_info = Column(JSON, nullable=True)

    # Step 2: Technical Interests (list of strings)
    # e.g. ["Web Development", "Python Development", "Data Science & AI"]
    technical_interests = Column(JSON, nullable=True)

    # Step 3: Current Skill Level ('beginner', 'intermediate', 'advanced')
    skill_level = Column(String(50), nullable=True)

    # Step 3b: Self-reported skills (list of strings)
    # e.g. ["Python", "FastAPI", "React", "PostgreSQL"]
    self_reported_skills = Column(JSON, nullable=True)

    # Step 4: Career Goals
    # e.g. {"target_timing": "internship_now", "target_companies": ["Product-based", "Startups"], "work_preference": "Hybrid"}
    career_goals = Column(JSON, nullable=True)

    # Step 5: Learning Preferences
    # e.g. {"style": "project_based", "weekly_hours": "10-15 hrs"}
    learning_preferences = Column(JSON, nullable=True)

    # Assessment details: 5-7 indicative assessment questions tailored to student
    assessment_questions = Column(JSON, nullable=True)
    assessment_answers = Column(JSON, nullable=True)
    assessment_score = Column(Integer, nullable=True)
    assessment_total = Column(Integer, nullable=True)
    assessment_result = Column(JSON, nullable=True)

    # Generated personalized recommendations & roadmap
    # Includes recommended roles, gap analysis, project suggestions, placement guides, matched jobs
    recommendations = Column(JSON, nullable=True)

    # 7-stage roadmap checklist progress
    # e.g. [{"stage_id": 1, "title": "Core Skill Acquisition", "status": "completed", ...}]
    roadmap_progress = Column(JSON, nullable=True)

    completed_at = Column(DateTime, nullable=True)

    # Relationship to user
    user = relationship("User", backref="career_discovery", lazy="joined")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "status": self.status,
            "current_step": self.current_step,
            "education_info": self.education_info or {},
            "technical_interests": self.technical_interests or [],
            "skill_level": self.skill_level or "beginner",
            "self_reported_skills": self.self_reported_skills or [],
            "career_goals": self.career_goals or {},
            "learning_preferences": self.learning_preferences or {},
            "assessment_questions": self.assessment_questions or [],
            "assessment_answers": self.assessment_answers or {},
            "assessment_score": self.assessment_score,
            "assessment_total": self.assessment_total,
            "assessment_result": self.assessment_result or {},
            "recommendations": self.recommendations or {},
            "roadmap_progress": self.roadmap_progress or [],
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
