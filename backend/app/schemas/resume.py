from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

class ResumeBase(BaseModel):
    title: str = Field(default="Software Engineering Resume", max_length=200)
    template_id: str = Field(default="classic-tech", max_length=50)
    personal_info: Dict[str, Any] = Field(default_factory=dict)
    summary: Optional[str] = Field(default="", max_length=5000)
    education: List[Dict[str, Any]] = Field(default_factory=list)
    experience: List[Dict[str, Any]] = Field(default_factory=list)
    projects: List[Dict[str, Any]] = Field(default_factory=list)
    skills: List[Any] = Field(default_factory=list)
    certifications: List[Dict[str, Any]] = Field(default_factory=list)
    is_primary: bool = False

class ResumeCreate(ResumeBase):
    pass

class ResumeUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    template_id: Optional[str] = Field(None, max_length=50)
    personal_info: Optional[Dict[str, Any]] = None
    summary: Optional[str] = Field(None, max_length=5000)
    education: Optional[List[Dict[str, Any]]] = None
    experience: Optional[List[Dict[str, Any]]] = None
    projects: Optional[List[Dict[str, Any]]] = None
    skills: Optional[List[Any]] = None
    certifications: Optional[List[Dict[str, Any]]] = None
    is_primary: Optional[bool] = None

class ResumeRead(ResumeBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ResumeListResponse(BaseModel):
    items: List[ResumeRead]
    total: int
