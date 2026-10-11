from app.schemas.contact import ContactCreate, ContactResponse
from app.schemas.token import Token, TokenPayload
from app.schemas.user import UserBase, UserRead, UserCreate, UserLogin, GoogleLoginRequest, AuthResponse
from app.schemas.otp import (
    OTPRequest,
    OTPVerifyRequest,
    OTPResponse,
    OTPVerificationSuccessResponse,
)
from app.schemas.password_reset import (
    ForgotPasswordRequest,
    VerifyResetTokenRequest,
    ResetPasswordRequest,
    PasswordResetResponse,
)
from app.schemas.dashboard import (
    DashboardStats,
    DashboardActivity,
    DashboardRecommendation,
    DashboardSummaryResponse,
)
from app.schemas.profile import (
    ProfileBase,
    ProfileUpdate,
    ProfileRead,
    PublicProfileRead,
    PublicProjectPreview,
)
from app.schemas.project import (
    ProjectBase,
    ProjectRead,
    ProjectDetailRead,
    ScreenshotItem,
    ProjectFacets,
    ProjectListResponse,
    BookmarkToggleResponse,
)
from app.schemas.resume import (
    ResumeBase,
    ResumeCreate,
    ResumeUpdate,
    ResumeRead,
    ResumeListResponse,
)
from app.schemas.ats import (
    AtsAnalysisRequest,
    AtsAnalysisResponse,
    BulletRewrite,
    AtsBreakdown,
)

__all__ = [
    "ContactCreate",
    "ContactResponse",
    "Token",
    "TokenPayload",
    "UserBase",
    "UserRead",
    "UserCreate",
    "UserLogin",
    "AuthResponse",
    "OTPRequest",
    "OTPVerifyRequest",
    "OTPResponse",
    "OTPVerificationSuccessResponse",
    "ForgotPasswordRequest",
    "VerifyResetTokenRequest",
    "ResetPasswordRequest",
    "PasswordResetResponse",
    "DashboardStats",
    "DashboardActivity",
    "DashboardRecommendation",
    "DashboardSummaryResponse",
    "ProfileBase",
    "ProfileUpdate",
    "ProfileRead",
    "PublicProfileRead",
    "PublicProjectPreview",
    "ProjectBase",
    "ProjectRead",
    "ProjectDetailRead",
    "ScreenshotItem",
    "ProjectFacets",
    "ProjectListResponse",
    "BookmarkToggleResponse",
    "ResumeBase",
    "ResumeCreate",
    "ResumeUpdate",
    "ResumeRead",
    "ResumeListResponse",
    "AtsAnalysisRequest",
    "AtsAnalysisResponse",
    "BulletRewrite",
    "AtsBreakdown",
]
