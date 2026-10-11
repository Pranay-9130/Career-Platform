from app.models.base import Base, BaseUUIDModel, TimestampMixin
from app.models.user import User, UserRole
from app.models.profile import Profile
from app.models.project import Project
from app.models.project_bookmark import ProjectBookmark
from app.models.project_screenshot import ProjectScreenshot
from app.models.otp import OTPVerification
from app.models.password_reset import PasswordResetToken
from app.models.job import Job
from app.models.job_application import JobApplication
from app.models.job_bookmark import JobBookmark
from app.models.notification import Notification
from app.models.resume import Resume

__all__ = [
    "Base",
    "BaseUUIDModel",
    "TimestampMixin",
    "User",
    "UserRole",
    "Profile",
    "Project",
    "ProjectBookmark",
    "ProjectScreenshot",
    "OTPVerification",
    "PasswordResetToken",
    "Job",
    "JobApplication",
    "JobBookmark",
    "Notification",
    "Resume",
]



