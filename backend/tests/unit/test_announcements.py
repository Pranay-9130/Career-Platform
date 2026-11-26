import pytest
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock
from app.models.announcement import FeatureAnnouncement, UserAnnouncementTracking
from app.models.user import User, UserRole
from app.services.announcement_service import AnnouncementService
from app.schemas.announcement import AnnouncementCreate, AnnouncementUpdate, AnnouncementRead


def test_announcement_model_structure():
    ann = FeatureAnnouncement(
        id=uuid.uuid4(),
        title="New ATS Resume Analyzer",
        description="Optimize your resume for applicant tracking systems.",
        link_url="/resume-builder",
        link_label="Try ATS Builder",
        status="PUBLISHED",
    )
    d = ann.to_dict()
    assert d["title"] == "New ATS Resume Analyzer"
    assert d["status"] == "PUBLISHED"
    assert d["link_url"] == "/resume-builder"
    assert d["link_label"] == "Try ATS Builder"


def test_user_tracking_model_structure():
    user_id = uuid.uuid4()
    ann_id = uuid.uuid4()
    track = UserAnnouncementTracking(
        id=uuid.uuid4(),
        user_id=user_id,
        announcement_id=ann_id,
        status="SEEN",
    )
    d = track.to_dict()
    assert d["user_id"] == str(user_id)
    assert d["announcement_id"] == str(ann_id)
    assert d["status"] == "SEEN"


@pytest.mark.asyncio
async def test_active_announcements_for_user_tracking_states():
    user_id = uuid.uuid4()
    ann1_id = uuid.uuid4()
    ann2_id = uuid.uuid4()

    ann1 = FeatureAnnouncement(
        id=ann1_id,
        title="Career Discovery",
        description="7-stage roadmap",
        status="PUBLISHED",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        published_at=datetime.now(timezone.utc),
    )
    ann2 = FeatureAnnouncement(
        id=ann2_id,
        title="College Survival Kit",
        description="5 calculators",
        status="PUBLISHED",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        published_at=datetime.now(timezone.utc),
    )

    mock_db = AsyncMock()

    # Mock count check to avoid re-seeding in test
    mock_count_result = MagicMock()
    mock_count_result.scalar.return_value = 2

    # Return the 2 announcements
    mock_ann_result = MagicMock()
    mock_ann_result.all.return_value = [ann1, ann2]

    # First run: User has no tracking (all UNSEEN)
    mock_track_result_empty = MagicMock()
    mock_track_result_empty.all.return_value = []

    mock_db.execute.side_effect = [mock_count_result]
    mock_db.scalars.side_effect = [mock_ann_result, mock_track_result_empty]

    res = await AnnouncementService.get_active_announcements_for_user(mock_db, user_id)
    assert len(res["announcements"]) == 2
    assert res["unread_count"] == 2
    assert len(res["pending_popup_announcements"]) == 2

    # Second run: User deferred ann1, seen ann2
    track1 = UserAnnouncementTracking(user_id=user_id, announcement_id=ann1_id, status="DEFERRED")
    track2 = UserAnnouncementTracking(user_id=user_id, announcement_id=ann2_id, status="SEEN")
    mock_track_result_tracked = MagicMock()
    mock_track_result_tracked.all.return_value = [track1, track2]

    mock_db.execute.side_effect = [mock_count_result]
    mock_db.scalars.side_effect = [mock_ann_result, mock_track_result_tracked]

    res2 = await AnnouncementService.get_active_announcements_for_user(mock_db, user_id)
    assert len(res2["announcements"]) == 2
    # ann1 is DEFERRED (still unread/unexplored), ann2 is SEEN (read)
    assert res2["unread_count"] == 1
    # Both have been interacted with, so NO popup should be triggered
    assert len(res2["pending_popup_announcements"]) == 0
    statuses = {item["id"]: item["user_status"] for item in res2["announcements"]}
    assert statuses[ann1_id] == "DEFERRED"
    assert statuses[ann2_id] == "SEEN"
