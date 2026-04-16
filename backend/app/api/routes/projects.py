from uuid import UUID
from fastapi import APIRouter, HTTPException
from app.core.auth import AuthDep, CurrentUser
from app.core.supabase import get_supabase
from app.models.schemas import APIResponse, ProjectCreate
from app.services.project_service import ProjectService

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=APIResponse)
async def list_projects(user: CurrentUser = AuthDep):
    service = ProjectService(get_supabase())
    projects = await service.list_projects(user.org_id)
    return APIResponse(data=[p.model_dump() for p in projects])


@router.post("", response_model=APIResponse, status_code=201)
async def create_project(body: ProjectCreate, user: CurrentUser = AuthDep):
    service = ProjectService(get_supabase())
    project = await service.create_project(user.org_id, body)
    return APIResponse(data=project.model_dump())


@router.get("/{project_id}", response_model=APIResponse)
async def get_project(project_id: UUID, user: CurrentUser = AuthDep):
    service = ProjectService(get_supabase())
    project = await service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Projekt nicht gefunden")
    if project.org_id != user.org_id:
        raise HTTPException(status_code=403, detail="Kein Zugriff")
    return APIResponse(data=project.model_dump())


@router.delete("/{project_id}", response_model=APIResponse)
async def delete_project(project_id: UUID, user: CurrentUser = AuthDep):
    service = ProjectService(get_supabase())
    project = await service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Projekt nicht gefunden")
    if project.org_id != user.org_id:
        raise HTTPException(status_code=403, detail="Kein Zugriff")
    await service.delete_project(project_id)
    return APIResponse(data={"deleted": True})
