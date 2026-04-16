from fastapi import APIRouter
from app.core.auth import AuthDep, CurrentUser
from app.models.schemas import APIResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=APIResponse)
async def me(user: CurrentUser = AuthDep):
    return APIResponse(
        data={
            "id": str(user.id),
            "email": user.email,
            "org_id": str(user.org_id),
        }
    )
