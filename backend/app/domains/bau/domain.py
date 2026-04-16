import json
import logging
from app.domains.base import BaseDomain
from app.models.schemas import AnalysisItemOut

logger = logging.getLogger(__name__)


class BauDomain(BaseDomain):
    domain_id = "bau"
    display_name = "Bau / Architektur"

    def get_analysis_prompt(self, context: dict) -> str:
        return """Du bist ein Schweizer Bausachverständiger mit Expertise in SIA-Normen, kantonalen Baugesetzen und kommunalen Zonenreglements.

## Ablauf
1. Rufe zuerst das Tool 'get_standards' mit dem Kanton-Code auf (z.B. 'CH-ZH'), um die geltenden Normen aus der Datenbank zu laden.
2. Analysiere danach den Bauplan systematisch gegen diese Normen.
3. Falls keine Normen in der DB vorhanden sind, stütze dich auf dein Fachwissen über Schweizer Bauvorschriften.

## Ausgabe
Gib deine Analyse ausschliesslich als JSON-Array zurück — kein weiterer Text:

```json
[
  {
    "standard_ref": "§ 270 PBG ZH",
    "category": "grenzabstand",
    "status": "fail",
    "note": "Grenzabstand von 3.2m unterschreitet das Minimum von 4.0m.",
    "suggestion": "Gebäude um mind. 0.8m von der Grenze abrücken."
  }
]
```

Status-Werte: "ok" (konform), "fail" (Verstoss), "warn" (unklar / nicht prüfbar).
Identifiziere mindestens 4 konkrete Prüfpunkte."""

    def get_standards_search_prompt(self, location: dict) -> str:
        canton = location.get("canton", "")
        municipality = location.get("municipality", "")
        return f"""Recherchiere die aktuell geltenden Bauvorschriften für:
- Kanton: {canton}
- Gemeinde: {municipality}
- Land: Schweiz

Suche nach:
1. Kantonales Baugesetz (BauG) und Bauverordnung (BauV)
2. Kommunales Zonenreglement und Bau- und Zonenordnung (BZO)
3. SIA-Normen (v.a. SIA 416, SIA 500)
4. Grenzabstände, Gebäudehöhen, Ausnützungsziffern, Abstände

Gib die Normen strukturiert als JSON-Array zurück:
```json
[
  {{
    "category": "grenzabstand",
    "text": "Kleiner Grenzabstand: mind. 4.0m, Grosser Grenzabstand: mind. 7.0m",
    "source": "§ 270 PBG ZH",
    "source_url": "https://..."
  }}
]
```"""

    def parse_analysis_result(self, raw: str) -> list[AnalysisItemOut]:
        try:
            # JSON aus Markdown-Codeblock extrahieren falls nötig
            if "```json" in raw:
                raw = raw.split("```json")[1].split("```")[0].strip()
            elif "```" in raw:
                raw = raw.split("```")[1].split("```")[0].strip()

            items_data = json.loads(raw)
            result = []
            for item in items_data:
                result.append(
                    AnalysisItemOut(
                        id=__import__("uuid").uuid4(),
                        analysis_id=__import__("uuid").uuid4(),
                        standard_id=None,
                        status=item.get("status", "warn"),
                        note=item.get("note", ""),
                        suggestion=item.get("suggestion"),
                    )
                )
            return result
        except Exception as e:
            logger.error("parse_analysis_result failed: %s\nRaw: %s", e, raw[:500])
            return []
