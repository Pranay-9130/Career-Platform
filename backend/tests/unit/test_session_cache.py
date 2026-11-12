import os
import sys
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

BACKEND_DIR = Path(__file__).resolve().parents[2]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.api.dependencies.auth import (  # noqa: E402
    _ACTIVE_SESSION_CACHE,
    _ACTIVE_SESSION_CACHE_MAX_SIZE,
    _is_multi_worker_mode,
    invalidate_session_cache,
    register_active_session,
    session_is_active,
)


class SessionCacheSafetyTests(unittest.TestCase):
    def setUp(self):
        _ACTIVE_SESSION_CACHE.clear()
        self._prev_concurrency = os.environ.get("WEB_CONCURRENCY")
        os.environ["WEB_CONCURRENCY"] = "1"

    def tearDown(self):
        _ACTIVE_SESSION_CACHE.clear()
        if self._prev_concurrency is None:
            os.environ.pop("WEB_CONCURRENCY", None)
        else:
            os.environ["WEB_CONCURRENCY"] = self._prev_concurrency

    def test_logout_and_rotation_invalidate_specific_session(self):
        register_active_session("sid-1", "user-a")
        register_active_session("sid-2", "user-a")
        self.assertIn(("sid-1", "user-a"), _ACTIVE_SESSION_CACHE)
        self.assertIn(("sid-2", "user-a"), _ACTIVE_SESSION_CACHE)

        invalidate_session_cache(session_id="sid-1", user_id="user-a")
        self.assertNotIn(("sid-1", "user-a"), _ACTIVE_SESSION_CACHE)
        self.assertIn(("sid-2", "user-a"), _ACTIVE_SESSION_CACHE)

    def test_password_reset_invalidates_all_sessions_for_user_only(self):
        register_active_session("sid-a1", "user-a")
        register_active_session("sid-a2", "user-a")
        register_active_session("sid-b1", "user-b")

        invalidate_session_cache(user_id="user-a")
        self.assertNotIn(("sid-a1", "user-a"), _ACTIVE_SESSION_CACHE)
        self.assertNotIn(("sid-a2", "user-a"), _ACTIVE_SESSION_CACHE)
        self.assertIn(("sid-b1", "user-b"), _ACTIVE_SESSION_CACHE)

    def test_cache_memory_is_bounded(self):
        for i in range(_ACTIVE_SESSION_CACHE_MAX_SIZE + 100):
            register_active_session(f"sid-{i}", "user-bulk")
        self.assertLessEqual(len(_ACTIVE_SESSION_CACHE), _ACTIVE_SESSION_CACHE_MAX_SIZE)

    def test_multi_worker_mode_disables_in_memory_session_cache(self):
        os.environ["WEB_CONCURRENCY"] = "2"
        self.assertTrue(_is_multi_worker_mode())
        register_active_session("sid-mw", "user-mw")
        self.assertEqual(len(_ACTIVE_SESSION_CACHE), 0)

    def test_auth_routes_call_invalidate_on_rotation_logout_and_reset(self):
        auth_routes_path = BACKEND_DIR / "app" / "api" / "routes" / "auth.py"
        source = auth_routes_path.read_text(encoding="utf-8")
        self.assertIn("invalidate_session_cache(session_id=consumed_sid, user_id=user.id)", source)
        self.assertIn("invalidate_session_cache(session_id=decoded.get(\"sid\"), user_id=decoded.get(\"sub\"))", source)
        self.assertIn("invalidate_session_cache(user_id=user.id)", source)


if __name__ == "__main__":
    unittest.main()

