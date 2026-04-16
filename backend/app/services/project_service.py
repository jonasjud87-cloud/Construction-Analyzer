from uuid import UUID
from supabase import Client
from app.models.schemas import ProjectCreate, ProjectOut


class ProjectService:
    def __init__(self, db: Client) -> None:
        self.db = db

    async def list_projects(self, org_id: UUID) -> list[ProjectOut]:
        res = (
            self.db.table("projects")
            .select("*")
            .eq("org_id", str(org_id))
            .execute()
        )
        return [ProjectOut(**row) for row in res.data]

    async def get_project(self, project_id: UUID) -> ProjectOut | None:
        res = (
            self.db.table("projects")
            .select("*")
            .eq("id", str(project_id))
            .single()
            .execute()
        )
        return ProjectOut(**res.data) if res.data else None

    async def create_project(self, org_id: UUID, data: ProjectCreate) -> ProjectOut:
        payload = {
            "org_id": str(org_id),
            "name": data.name,
            "domain": data.domain,
            "location": data.location.model_dump(),
            "status": "active",
        }
        res = self.db.table("projects").insert(payload).execute()
        return ProjectOut(**res.data[0])

    async def delete_project(self, project_id: UUID) -> None:
        self.db.table("projects").delete().eq("id", str(project_id)).execute()
