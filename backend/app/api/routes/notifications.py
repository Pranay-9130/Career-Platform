import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, desc, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.notification import Notification
from app.models.user import User, UserRole
from app.schemas.notification import (
    NotificationRead,
    UnreadCountResponse,
)
from app.api.dependencies.auth import get_current_active_user

router = APIRouter(prefix="/notifications", tags=["In-App Notifications"])


@router.get("/unread-count", response_model=UnreadCountResponse)
async def get_unread_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieve number of unread in-app notifications for current user.
    """
    stmt = (
        select(func.count(Notification.id))
        .where(Notification.user_id == current_user.id, Notification.is_read.is_(False))
    )
    count = (await db.execute(stmt)).scalar() or 0
    return UnreadCountResponse(unread_count=count)


@router.get("", response_model=List[NotificationRead])
async def list_notifications(
    unread_only: bool = Query(False, description="Filter only unread notifications"),
    limit: int = Query(30, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieve list of notifications for the authenticated student.
    """
    conditions = [Notification.user_id == current_user.id]
    if unread_only:
        conditions.append(Notification.is_read.is_(False))

    stmt = (
        select(Notification)
        .where(*conditions)
        .order_by(desc(Notification.created_at))
        .limit(limit)
    )
    result = await db.execute(stmt)
    notifications = result.scalars().all()
    return [NotificationRead.model_validate(n) for n in notifications]


@router.put("/read-all")
async def mark_all_as_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Mark all unread notifications as read for current user.
    """
    stmt = (
        update(Notification)
        .where(Notification.user_id == current_user.id, Notification.is_read.is_(False))
        .values(is_read=True)
    )
    await db.execute(stmt)
    await db.commit()
    return {"message": "All notifications marked as read."}


@router.put("/{identifier}/read", response_model=NotificationRead)
async def mark_notification_as_read(
    identifier: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Mark a single notification as read.
    """
    try:
        notif_uuid = uuid.UUID(identifier)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invalid notification identifier: '{identifier}'",
        )

    stmt = select(Notification).where(Notification.id == notif_uuid)
    notif = (await db.execute(stmt)).scalar_one_or_none()
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notification '{identifier}' not found.",
        )

    if notif.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this notification.",
        )

    notif.is_read = True
    await db.commit()
    await db.refresh(notif)
    return NotificationRead.model_validate(notif)


@router.delete("/{identifier}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(
    identifier: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Dismiss or delete a notification.
    """
    try:
        notif_uuid = uuid.UUID(identifier)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invalid notification identifier: '{identifier}'",
        )

    stmt = select(Notification).where(Notification.id == notif_uuid)
    notif = (await db.execute(stmt)).scalar_one_or_none()
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notification '{identifier}' not found.",
        )

    if notif.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this notification.",
        )

    await db.delete(notif)
    await db.commit()
    return None
