from datetime import datetime
from typing import Optional, List
from uuid import UUID
import re
from urllib.parse import urlparse
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

VALID_APPLICATION_METHODS = {"INTERNAL", "GOOGLE_FORM", "EMAIL", "EXTERNAL_URL"}
EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


def validate_safe_https_url(url: Optional[str], field_name: str = "URL") -> str:
    if not url or not str(url).strip():
        raise ValueError(f"{field_name} is required.")
    cleaned = str(url).strip()
    parsed = urlparse(cleaned)
    if parsed.scheme.lower() != "https":
        raise ValueError(f"{field_name} must use a secure 'https://' address.")
    if not parsed.netloc:
        raise ValueError(f"{field_name} must include a valid domain.")
    lower = cleaned.lower()
    for forbidden in ["javascript:", "data:", "vbscript:", "<script"]:
        if forbidden in lower:
            raise ValueError(f"{field_name} contains an unsafe or forbidden URL scheme.")
    return cleaned


def validate_google_form_url(url: Optional[str]) -> str:
    safe_url = validate_safe_https_url(url, "Google Form URL")
    parsed = urlparse(safe_url)
    domain = parsed.netloc.lower()
    if domain.startswith("www."):
        domain = domain[4:]
    if domain == "forms.gle":
        return safe_url
    if domain == "docs.google.com" and "/forms" in parsed.path.lower():
        return safe_url
    raise ValueError(
        "Google Form URL must be a valid Google Forms link (e.g. https://forms.gle/... or https://docs.google.com/forms/...)."
    )


def validate_recruiter_email(email: Optional[str]) -> str:
    if not email or not str(email).strip():
        raise ValueError("Recruiter email is required.")
    cleaned = str(email).strip().lower()
    if not EMAIL_REGEX.match(cleaned):
        raise ValueError("Please provide a valid recruiter email address (e.g. careers@company.com).")
    return cleaned


class JobBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    company_name: str = Field(..., min_length=2, max_length=200)
    company_logo_url: Optional[str] = None
    company_website: Optional[str] = None
    domain: str = Field(default="Software Engineering", max_length=100)
    job_type: str = Field(default="Full-time", max_length=50)  # Full-time, Internship, Contract
    work_mode: str = Field(default="Remote", max_length=50)    # Remote, Hybrid, Onsite
    location: str = Field(default="Remote", max_length=150)
    stipend_or_salary: Optional[str] = Field(default="", max_length=100)
    experience_level: str = Field(default="Entry Level", max_length=50)  # Internship, Entry Level, Mid-Level
    skills_required: List[str] = Field(default_factory=list)
    description: str = Field(default="", max_length=10000)
    responsibilities: List[str] = Field(default_factory=list)
    requirements: List[str] = Field(default_factory=list)
    apply_url: Optional[str] = Field(default="", max_length=500)
    application_method: str = Field(default="INTERNAL", max_length=50)
    application_url: Optional[str] = Field(default=None, max_length=500)
    recruiter_email: Optional[str] = Field(default=None, max_length=255)
    application_instructions: Optional[str] = Field(default=None, max_length=5000)
    is_active: bool = True
    is_featured: bool = False
    application_start_date: Optional[datetime] = None
    deadline: Optional[datetime] = None

    @field_validator("application_method", mode="before")
    @classmethod
    def normalize_method(cls, v):
        if not v:
            return "INTERNAL"
        normalized = str(v).strip().upper()
        if normalized not in VALID_APPLICATION_METHODS:
            raise ValueError(f"Application method must be one of: {', '.join(sorted(VALID_APPLICATION_METHODS))}")
        return normalized

    @model_validator(mode="after")
    def validate_method_details(self):
        method = self.application_method or "INTERNAL"
        if method == "GOOGLE_FORM":
            self.application_url = validate_google_form_url(self.application_url)
            self.apply_url = self.application_url
        elif method == "EXTERNAL_URL":
            self.application_url = validate_safe_https_url(self.application_url, "Application URL")
            self.apply_url = self.application_url
        elif method == "EMAIL":
            self.recruiter_email = validate_recruiter_email(self.recruiter_email)
            self.apply_url = f"mailto:{self.recruiter_email}"
        elif method == "INTERNAL":
            if not self.apply_url:
                self.apply_url = ""

        if self.application_start_date and self.deadline:
            if self.deadline < self.application_start_date:
                raise ValueError("Application deadline cannot be earlier than the application start date.")
        return self

class JobCreate(JobBase):
    pass

class JobUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=200)
    company_name: Optional[str] = Field(None, min_length=2, max_length=200)
    company_logo_url: Optional[str] = None
    company_website: Optional[str] = None
    domain: Optional[str] = None
    job_type: Optional[str] = None
    work_mode: Optional[str] = None
    location: Optional[str] = None
    stipend_or_salary: Optional[str] = None
    experience_level: Optional[str] = None
    skills_required: Optional[List[str]] = None
    description: Optional[str] = None
    responsibilities: Optional[List[str]] = None
    requirements: Optional[List[str]] = None
    apply_url: Optional[str] = None
    application_method: Optional[str] = None
    application_url: Optional[str] = None
    recruiter_email: Optional[str] = None
    application_instructions: Optional[str] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    application_start_date: Optional[datetime] = None
    deadline: Optional[datetime] = None

    @field_validator("application_method", mode="before")
    @classmethod
    def normalize_method(cls, v):
        if v is None:
            return None
        normalized = str(v).strip().upper()
        if normalized not in VALID_APPLICATION_METHODS:
            raise ValueError(f"Application method must be one of: {', '.join(sorted(VALID_APPLICATION_METHODS))}")
        return normalized

    @model_validator(mode="after")
    def validate_update_details(self):
        method = self.application_method
        if method == "GOOGLE_FORM":
            if self.application_url is not None:
                self.application_url = validate_google_form_url(self.application_url)
                self.apply_url = self.application_url
        elif method == "EXTERNAL_URL":
            if self.application_url is not None:
                self.application_url = validate_safe_https_url(self.application_url, "Application URL")
                self.apply_url = self.application_url
        elif method == "EMAIL":
            if self.recruiter_email is not None:
                self.recruiter_email = validate_recruiter_email(self.recruiter_email)
                self.apply_url = f"mailto:{self.recruiter_email}"
        if self.application_start_date is not None and self.deadline is not None:
            if self.deadline < self.application_start_date:
                raise ValueError("Application deadline cannot be earlier than the application start date.")
        return self

class JobBookmarkToggleResponse(BaseModel):
    job_id: UUID
    bookmarked: bool
    message: str

class JobRead(JobBase):
    id: UUID
    is_bookmarked: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class JobFacetItem(BaseModel):
    name: str
    count: int

class JobFacets(BaseModel):
    domains: List[JobFacetItem] = Field(default_factory=list)
    job_types: List[JobFacetItem] = Field(default_factory=list)
    work_modes: List[JobFacetItem] = Field(default_factory=list)
    experience_levels: List[JobFacetItem] = Field(default_factory=list)

class JobListResponse(BaseModel):
    items: List[JobRead]
    total: int
    page: int
    limit: int
    total_pages: int
    facets: Optional[JobFacets] = None
