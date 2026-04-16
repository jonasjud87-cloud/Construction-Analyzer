from uuid import UUID
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.core.auth import AuthDep, CurrentUser
from app.core.supabase import get_supabase
from app.models.schemas import APIResponse, ChatMessageCreate
from app.services.chat_service import ChatService

router = APIRouter(prefix="/projects/{project_id}/chat", tags=["chat"])


def _assert_access(project_id: UUID, user: CurrentUser) -> None:
    db = get_supabase()
    proj = (
        db.table("projects")
        .select("org_id")
        .eq("id", str(project_id))
        .single()
        .execute()
    )
    if not proj.data:
        raise HTTPException(status_code=404, detail="Projekt nicht gefunden")
    if proj.data["org_id"] != str(user.org_id):
        raise HTTPException(status_code=403, detail="Kein Zugriff")


@router.get("", response_model=APIResponse)
async def get_chat_history(project_id: UUID, user: CurrentUser = AuthDep):
    _assert_access(project_id, user)
    service = ChatService(get_supabase())
    history = await service.get_history(project_id)
    return APIResponse(data=history)


@router.post("", response_class=StreamingResponse)
async def send_message(
    project_id: UUID,
    body: ChatMessageCreate,
    user: CurrentUser = AuthDep,
):
    _assert_access(project_id, user)
    service = ChatService(get_supabase())
    return StreamingResponse(
        service.stream_response(project_id, body.content),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
