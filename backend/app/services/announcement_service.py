import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.announcement import FeatureAnnouncement, UserAnnouncementTracking
from app.models.user import User


DEFAULT_INITIAL_ANNOUNCEMENTS = [
    {
        "title": "Career Discovery & Personalized Guidance",
        "description": "Discover your strengths, take a 5-question indicative assessment, and unlock a 7-stage personalized roadmap matching real industry opportunities.",
        "icon_or_image": "Compass",
        "link_url": "/career-discovery",
        "link_label": "Discover My Path",
        "status": "PUBLISHED",
    },
    {
        "title": "College Survival Kit & Interactive Calculators",
        "description": "Explore 5 interactive student utility tools: Attendance Bunk & Recovery Planner, In-Hand Salary Estimator, SGPA to CGPA Converter, and more.",
        "icon_or_image": "Sparkles",
        "link_url": "/college-survival-kit",
        "link_label": "Explore Survival Kit",
        "status": "PUBLISHED",
    },
    {
        "title": "Placement Preparation Center",
        "description": "Access curated interview guides, domain-specific coding practice, and downloadable role-based placement roadmaps.",
        "icon_or_image": "BrainCircuit",
        "link_url": "/placement-preparation",
        "link_label": "Start Preparation",
        "status": "PUBLISHED",
    },
]


class AnnouncementService:
    @staticmethod
    async def seed_defaults_if_empty(db: AsyncSession) -> None:
        """Seed initial platform announcements if none exist."""
        stmt = select(func.count(FeatureAnnouncement.id))
        count = (await db.execute(stmt)).scalar() or 0
        if count == 0:
            now = datetime.now(timezone.utc)
            for item in DEFAULT_INITIAL_ANNOUNCEMENTS:
                ann = FeatureAnnouncement(
                    id=uuid.uuid4(),
                    title=item["title"],
                    description=item["description"],
                    icon_or_image=item["icon_or_image"],
                    link_url=item["link_url"],
                    link_label=item["link_label"],
                    status=item["status"],
                    published_at=now,
                )
                db.add(ann)
            await db.commit()

    @staticmethod
    async def get_active_announcements_for_user(
        db: AsyncSession, user_id: uuid.UUID
    ) -> Dict[str, Any]:
        """
        Retrieves published announcements annotated with the user's personal tracking state.
        Identifies:
        - All published announcements
        - unread_count (announcements not marked 'SEEN')
        - pending_popup_announcements (announcements with no tracking entry, i.e. never seen/dismissed/deferred)
        """
        # Ensure initial announcements exist
        await AnnouncementService.seed_defaults_if_empty(db)

        # 1. Fetch published announcements ordered newest first
        stmt = (
            select(FeatureAnnouncement)
            .where(FeatureAnnouncement.status == "PUBLISHED")
            .order_by(desc(FeatureAnnouncement.published_at), desc(FeatureAnnouncement.created_at))
        )
        announcements = (await db.scalars(stmt)).all()

        # 2. Fetch user's tracking records
        track_stmt = select(UserAnnouncementTracking).where(
            UserAnnouncementTracking.user_id == user_id
        )
        tracks = (await db.scalars(track_stmt)).all()
        user_track_map = {t.announcement_id: t.status for t in tracks}

        annotated_list = []
        pending_popups = []
        unread_count = 0

        for ann in announcements:
            status = user_track_map.get(ann.id, "UNSEEN")
            item_dict = ann.to_dict()
            item_dict["user_status"] = status
            item_dict["id"] = ann.id
            item_dict["created_at"] = ann.created_at
            item_dict["updated_at"] = ann.updated_at
            item_dict["published_at"] = ann.published_at
            annotated_list.append(item_dict)

            if status != "SEEN":
                unread_count += 1

            # Only brand-new, completely untracked announcements qualify for the popup
            if status == "UNSEEN":
                pending_popups.append(item_dict)

        return {
            "announcements": annotated_list,
            "unread_count": unread_count,
            "pending_popup_announcements": pending_popups,
        }

    @staticmethod
    async def track_announcement(
        db: AsyncSession,
        user_id: uuid.UUID,
        announcement_id: uuid.UUID,
        new_status: str,
    ) -> UserAnnouncementTracking:
        """
        Persists or updates a user's tracking status ('SEEN', 'DISMISSED', 'DEFERRED')
        against an announcement.
        """
        stmt = select(UserAnnouncementTracking).where(
            UserAnnouncementTracking.user_id == user_id,
            UserAnnouncementTracking.announcement_id == announcement_id,
        )
        tracking = (await db.execute(stmt)).scalar_one_or_none()

        if tracking:
            tracking.status = new_status
            tracking.updated_at = datetime.now(timezone.utc)
        else:
            tracking = UserAnnouncementTracking(
                id=uuid.uuid4(),
                user_id=user_id,
                announcement_id=announcement_id,
                status=new_status,
            )
            db.add(tracking)

        await db.commit()
        await db.refresh(tracking)
        return tracking

    @staticmethod
    async def list_all_for_admin(db: AsyncSession) -> List[Dict[str, Any]]:
        """List all announcements (draft & published) with engagement metrics."""
        stmt = select(FeatureAnnouncement).order_by(desc(FeatureAnnouncement.created_at))
        announcements = (await db.scalars(stmt)).all()

        results = []
        for ann in announcements:
            seen_stmt = select(func.count(UserAnnouncementTracking.id)).where(
                UserAnnouncementTracking.announcement_id == ann.id,
                UserAnnouncementTracking.status == "SEEN",
            )
            dismissed_stmt = select(func.count(UserAnnouncementTracking.id)).where(
                UserAnnouncementTracking.announcement_id == ann.id,
                UserAnnouncementTracking.status.in_(["DISMISSED", "DEFERRED"]),
            )
            seen_count = (await db.execute(seen_stmt)).scalar() or 0
            dismissed_count = (await db.execute(dismissed_stmt)).scalar() or 0

            d = ann.to_dict()
            d["seen_count"] = seen_count
            d["dismissed_count"] = dismissed_count
            results.append(d)

        return results

    @staticmethod
    async def create_announcement(
        db: AsyncSession, data: Dict[str, Any]
    ) -> FeatureAnnouncement:
        now = datetime.now(timezone.utc)
        published_at = now if data.get("status") == "PUBLISHED" else None
        ann = FeatureAnnouncement(
            id=uuid.uuid4(),
            title=data["title"].strip(),
            description=data["description"].strip(),
            icon_or_image=data.get("icon_or_image"),
            link_url=data.get("link_url"),
            link_label=data.get("link_label") or "Explore Feature",
            status=data.get("status", "PUBLISHED"),
            published_at=published_at,
        )
        db.add(ann)
        await db.commit()
        await db.refresh(ann)
        return ann

    @staticmethod
    async def update_announcement(
        db: AsyncSession, announcement_id: uuid.UUID, data: Dict[str, Any]
    ) -> Optional[FeatureAnnouncement]:
        stmt = select(FeatureAnnouncement).where(FeatureAnnouncement.id == announcement_id)
        ann = (await db.execute(stmt)).scalar_one_or_none()
        if not ann:
            return None

        if "title" in data and data["title"] is not None:
            ann.title = data["title"].strip()
        if "description" in data and data["description"] is not None:
            ann.description = data["description"].strip()
        if "icon_or_image" in data:
            ann.icon_or_image = data["icon_or_image"]
        if "link_url" in data:
            ann.link_url = data["link_url"]
        if "link_label" in data and data["link_label"] is not None:
            ann.link_label = data["link_label"].strip()
        if "status" in data and data["status"] is not None:
            prev_status = ann.status
            ann.status = data["status"]
            if ann.status == "PUBLISHED" and (prev_status != "PUBLISHED" or not ann.published_at):
                ann.published_at = datetime.now(timezone.utc)

        ann.updated_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(ann)
        return ann

    @staticmethod
    async def delete_announcement(db: AsyncSession, announcement_id: uuid.UUID) -> bool:
        stmt = select(FeatureAnnouncement).where(FeatureAnnouncement.id == announcement_id)
        ann = (await db.execute(stmt)).scalar_one_or_none()
        if not ann:
            return False
        await db.delete(ann)
        await db.commit()
        return True
