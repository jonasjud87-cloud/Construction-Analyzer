import base64
from uuid import UUID
import anthropic
from supabase import Client
from app.core.config import settings
from app.domains import get_domain
from app.models.schemas import AnalysisOut, AnalysisItemOut
from app.services.standards_upload_service import StandardsUploadService

TOOLS = [
    {
        "name": "get_standards",
        "description": (
            "Holt die geltenden Normen und Vorschriften für einen bestimmten Standort "
            "aus der Normen-Datenbank. Rufe dieses Tool auf bevor du den Plan analysierst."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "region": {
                    "type": "string",
                    "description": "Kanton-Code im Format 'CH-ZH', 'CH-BE' usw.",
                },
            },
            "required": ["region"],
        },
    }
]


class AnalysisService:
    def __init__(self, db: Client) -> None:
        self.db = db
        self.claude = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    async def run_analysis(
        self,
        document_id: UUID,
        project_id: UUID,
        domain_id: str,
        file_bytes: bytes = b"",
        content_type: str = "application/pdf",
        location: dict = {},
    ) -> AnalysisOut:
        domain = get_domain(domain_id)

        # Analyse-Eintrag anlegen
        res = (
            self.db.table("analyses")
            .insert({"document_id": str(document_id), "status": "running"})
            .execute()
        )
        analysis_id = res.data[0]["id"]

        try:
            canton = location.get("canton", "")
            municipality = location.get("municipality", "")
            region = f"CH-{canton}" if canton else ""

            # Datei als base64 kodieren
            encoded = base64.standard_b64encode(file_bytes).decode("utf-8")
            is_pdf = "pdf" in content_type.lower()
            if is_pdf:
                doc_block = {
                    "type": "document",
                    "source": {
                        "type": "base64",
                        "media_type": "application/pdf",
                        "data": encoded,
                    },
                }
            else:
                media_type = content_type if content_type.startswith("image/") else "image/jpeg"
                doc_block = {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": media_type,
                        "data": encoded,
                    },
                }

            system_prompt = domain.get_analysis_prompt({})
            location_text = f"{municipality}, Kanton {canton}, Schweiz" if canton else "Schweiz"

            messages = [
                {
                    "role": "user",
                    "content": [
                        doc_block,
                        {
                            "type": "text",
                            "text": (
                                f"Analysiere diesen Bauplan. Standort: {location_text}.\n"
                                f"Hole zuerst mit dem Tool 'get_standards' die geltenden Normen "
                                f"für {region or 'diesen Standort'}, dann analysiere den Plan systematisch."
                            ),
                        },
                    ],
                }
            ]

            # Agentic loop: Claude ruft get_standards auf, wir liefern die Daten
            total_input_tokens = 0
            total_output_tokens = 0

            while True:
                response = self.claude.messages.create(
                    model="claude-sonnet-4-6",
                    max_tokens=4096,
                    system=[
                        {
                            "type": "text",
                            "text": system_prompt,
                            "cache_control": {"type": "ephemeral"},
                        }
                    ],
                    tools=TOOLS,
                    messages=messages,
                )

                total_input_tokens += response.usage.input_tokens
                total_output_tokens += response.usage.output_tokens

                if response.stop_reason != "tool_use":
                    break

                # Tool-Aufruf verarbeiten
                tool_block = next(
                    b for b in response.content if b.type == "tool_use"
                )
                requested_region = tool_block.input.get("region", region)

                svc = StandardsUploadService(self.db)
                standards = await svc.list_all(domain=domain_id, region=requested_region)

                if standards:
                    tool_result = "\n\n---\n\n".join(
                        f"Datei: {s.source_url or s.id}\nKategorie: {s.category}\n\n{s.text}"
                        for s in standards
                    )
                else:
                    tool_result = (
                        f"Keine Normen für {requested_region} in der Datenbank vorhanden. "
                        f"Nutze dein allgemeines Wissen über Schweizer Bauvorschriften."
                    )

                messages = messages + [
                    {"role": "assistant", "content": response.content},
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "tool_result",
                                "tool_use_id": tool_block.id,
                                "content": tool_result,
                            }
                        ],
                    },
                ]

            raw_text = next(
                (b.text for b in response.content if hasattr(b, "text")), "[]"
            )
            items = domain.parse_analysis_result(raw_text)

            cost_usd = (
                total_input_tokens * 3.0 / 1_000_000
                + total_output_tokens * 15.0 / 1_000_000
            )

            items_payload = [
                {
                    "analysis_id": analysis_id,
                    "status": item.status,
                    "note": item.note,
                    "suggestion": item.suggestion,
                }
                for item in items
            ]
            if items_payload:
                self.db.table("analysis_items").insert(items_payload).execute()

            self.db.table("analyses").update(
                {"status": "done", "cost_usd": cost_usd, "result_json": {"raw": raw_text}}
            ).eq("id", analysis_id).execute()

            return await self._get_analysis(UUID(analysis_id))

        except Exception as e:
            self.db.table("analyses").update({"status": "error"}).eq(
                "id", analysis_id
            ).execute()
            raise e

    async def _get_analysis(self, analysis_id: UUID) -> AnalysisOut:
        res = (
            self.db.table("analyses")
            .select("*, analysis_items(*)")
            .eq("id", str(analysis_id))
            .single()
            .execute()
        )
        data = res.data
        items = [AnalysisItemOut(**i) for i in data.pop("analysis_items", [])]
        return AnalysisOut(**data, items=items)
