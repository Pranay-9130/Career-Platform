import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.dependencies.auth import get_current_active_user, require_role
from app.models.user import User, UserRole
from app.schemas.announcement import (
    AnnouncementCreate,
    AnnouncementUpdate,
    AnnouncementRead,
    AnnouncementTrackRequest,
    ActiveAnnouncementsResponse,
)
from app.services.announcement_service import AnnouncementService

router = APIRouter(prefix="/announcements", tags=["Feature Announcements"])
admin_router = APIRouter(prefix="/admin/announcements", tags=["Admin - Feature Announcements"])


# =========================================================================
# User / Student Endpoints
# =========================================================================

@router.get("/active", response_model=ActiveAnnouncementsResponse)
async def get_active_announcements(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieves all published feature announcements annotated with the current user's
    tracking state (SEEN, DISMISSED, DEFERRED, or UNSEEN).
    Includes pending popup announcements (brand-new announcements never before shown).
    """
    data = await AnnouncementService.get_active_announcements_for_user(db, current_user.id)
    return data


@router.post("/{announcement_id}/track", status_code=status.HTTP_200_OK)
async def track_announcement(
    announcement_id: uuid.UUID,
    payload: AnnouncementTrackRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Records or updates the user's interaction with a feature announcement:
    - SEEN: Explored or viewed in full
    - DISMISSED: Closed permanently from popup
    - DEFERRED: User clicked 'Maybe Later', allowing them to re-access from the dashboard
    """
    tracking = await AnnouncementService.track_announcement(
        db=db,
        user_id=current_user.id,
        announcement_id=announcement_id,
        new_status=payload.status,
    )
    return {"status": "success", "tracking": tracking.to_dict()}


# =========================================================================
# Administrator Management Endpoints
# =========================================================================

@admin_router.get("", response_model=List[Dict[str, Any]])
async def list_announcements_for_admin(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_role(UserRole.ADMIN)),
):
    """Lists all published and draft announcements along with user engagement counts."""
    return await AnnouncementService.list_all_for_admin(db)


@admin_router.post("", status_code=status.HTTP_201_CREATED)
async def create_announcement_admin(
    payload: AnnouncementCreate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_role(UserRole.ADMIN)),
):
    """Creates a new feature announcement in draft or published status."""
    ann = await AnnouncementService.create_announcement(db, payload.model_dump())
    return ann.to_dict()


@admin_router.put("/{announcement_id}", status_code=status.HTTP_200_OK)
async def update_announcement_admin(
    announcement_id: uuid.UUID,
    payload: AnnouncementUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_role(UserRole.ADMIN)),
):
    """Modifies an existing feature announcement."""
    ann = await AnnouncementService.update_announcement(
        db, announcement_id, payload.model_dump(exclude_unset=True)
    )
    if not ann:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feature announcement not found.",
        )
    return ann.to_dict()


@admin_router.delete("/{announcement_id}", status_code=status.HTTP_200_OK)
async def delete_announcement_admin(
    announcement_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_role(UserRole.ADMIN)),
):
    """Permanently deletes a feature announcement and cascades tracking records."""
    success = await AnnouncementService.delete_announcement(db, announcement_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feature announcement not found.",
        )
    return {"status": "success", "message": "Announcement deleted successfully."}
