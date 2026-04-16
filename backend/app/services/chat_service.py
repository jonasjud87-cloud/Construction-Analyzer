from uuid import UUID
from collections.abc import AsyncGenerator
import anthropic
from supabase import Client
from app.core.config import settings


class ChatService:
    def __init__(self, db: Client) -> None:
        self.db = db
        self.claude = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    def _build_system_prompt(self, project_id: UUID) -> str:
        # Normen des Projekts laden
        # (In echter Impl. werden nur project-spezifische Normen geladen)
        standards_res = (
            self.db.table("standards")
            .select("category, text")
            .limit(15)
            .execute()
        )
        standards_text = "\n".join(
            f"- [{s['category']}] {s['text']}" for s in standards_res.data
        )

        return f"""Du bist ein Bausachverständiger-Assistent für die KI Analyse Plattform.

Beantworte Fragen zu Bauplänen, Normen und Vorschriften präzise und auf Deutsch.

## Geltende Normen dieses Projekts
{standards_text if standards_text else "Noch keine Normen für dieses Projekt geladen."}

Antworte immer auf Deutsch, klar und prägnant."""

    async def get_history(self, project_id: UUID) -> list[dict]:
        res = (
            self.db.table("chat_messages")
            .select("role, content")
            .eq("project_id", str(project_id))
            .order("created_at")
            .execute()
        )
        return res.data

    async def stream_response(
        self, project_id: UUID, user_message: str
    ) -> AsyncGenerator[str, None]:
        # Nachricht speichern
        self.db.table("chat_messages").insert(
            {"project_id": str(project_id), "role": "user", "content": user_message}
        ).execute()

        history = await self.get_history(project_id)
        system_prompt = self._build_system_prompt(project_id)

        full_response = ""

        with self.claude.messages.stream(
            model="claude-sonnet-4-6",
            max_tokens=2048,
            system=[
                {
                    "type": "text",
                    "text": system_prompt,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            messages=history,
        ) as stream:
            for text in stream.text_stream:
                full_response += text
                yield f"data: {text}\n\n"

        # Antwort persistieren
        self.db.table("chat_messages").insert(
            {
                "project_id": str(project_id),
                "role": "assistant",
                "content": full_response,
            }
        ).execute()
