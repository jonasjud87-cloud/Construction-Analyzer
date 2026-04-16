from uuid import UUID
from supabase import Client


class ExportService:
    def __init__(self, db: Client) -> None:
        self.db = db

    async def export_analysis_json(self, analysis_id: UUID) -> dict:
        """Gibt vollständige Analyse als JSON zurück (für PDF/XLSX Export)."""
        res = (
            self.db.table("analyses")
            .select("*, analysis_items(*), documents(project_id, doc_type, file_url)")
            .eq("id", str(analysis_id))
            .single()
            .execute()
        )
        return res.data
