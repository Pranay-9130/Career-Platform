import logging
from fastapi import APIRouter, Depends, status
from app.schemas.contact import ContactCreate, ContactResponse
from app.core.rate_limiter import contact_rate_limiter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/contact", tags=["Contact"])

@router.post("", response_model=ContactResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(contact_rate_limiter)])
async def submit_contact_inquiry(payload: ContactCreate):
    """
    Submit a contact inquiry from the public website.
    Validates form fields and processes the message for staff response.
    """
    logger.info(
        f"Contact inquiry received from {payload.name} ({payload.email}) - Subject: {payload.subject}"
    )

    return ContactResponse(
        success=True,
        message=f"Thank you, {payload.name}. Your inquiry regarding '{payload.subject}' has been received."
    )
