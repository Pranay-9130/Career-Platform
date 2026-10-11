import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_submit_contact_inquiry_success():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "name": "Jane Student",
            "email": "jane@university.edu",
            "subject": "Platform Partnership",
            "message": "We would like to introduce the platform to our student CS club.",
        }
        response = await client.post("/api/contact", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert "Jane Student" in data["message"]

@pytest.mark.asyncio
async def test_submit_contact_inquiry_invalid_email():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "name": "Jane Student",
            "email": "not-an-email",
            "subject": "Question",
            "message": "This is a test message that has sufficient length.",
        }
        response = await client.post("/api/contact", json=payload)
        assert response.status_code == 422

@pytest.mark.asyncio
async def test_submit_contact_inquiry_short_message():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "name": "Jane Student",
            "email": "jane@university.edu",
            "subject": "Question",
            "message": "Hi",  # Too short (< 10 chars)
        }
        response = await client.post("/api/contact", json=payload)
        assert response.status_code == 422
