# KI Analyse Plattform — Projektkontext für Claude Code

## Was ist dieses Projekt?

Eine Multi-Domain KI-Plattform zur automatischen Prüfung von technischen Dokumenten (Baupläne, Industriezeichnungen, Maschinendokumentation) gegen geltende Normen und Vorschriften.

**MVP-Fokus: Bau/Architektur, Markt: DACH (Schweiz zuerst)**

---

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend | FastAPI (Python 3.12) + Async |
| Datenbank | Supabase (PostgreSQL 16 + pgvector + Storage + Auth) |
| KI | Anthropic Claude API (claude-sonnet-4-6) |
| Queue | Redis + Celery |
| Frontend Hosting | Vercel |
| Backend Hosting | Railway |
| CI/CD | GitHub Actions |
| Monitoring | Sentry + Posthog |

---

## Projektstruktur (Monorepo)

```
/
├── frontend/          # Next.js App
│   ├── app/
│   │   ├── (auth)/
│   │   ├── dashboard/         # Projekt-Übersicht (alle Boards)
│   │   └── projects/[id]/     # Einzelnes Projekt-Board
│   │       ├── standards/     # Teil 1: Normen
│   │       ├── analysis/      # Teil 2: Plan-Analyse
│   │       ├── chat/          # Teil 3: KI Chat
│   │       └── database/      # Teil 4: Standards-DB
│   ├── components/
│   └── lib/
├── backend/           # FastAPI App
│   ├── app/
│   │   ├── api/routes/
│   │   ├── services/
│   │   │   ├── standards_service.py
│   │   │   ├── analysis_service.py
│   │   │   ├── chat_service.py
│   │   │   ├── project_service.py
│   │   │   └── export_service.py
│   │   ├── domains/           # Domain Plugin System
│   │   │   ├── base.py        # Abstract Domain
│   │   │   ├── bau/           # Bau/Architektur Domain
│   │   │   ├── industrie/     # (Roadmap)
│   │   │   └── maschinenbau/  # (Roadmap)
│   │   ├── models/
│   │   └── core/
│   └── workers/       # Celery Tasks
├── supabase/
│   ├── migrations/
│   └── seed/
└── CLAUDE.md          # Diese Datei
```

---

## Datenbank-Schema

```sql
-- Organisationen
organizations (id uuid, name text, plan_tier text, created_at)

-- Benutzer
users (id uuid, org_id → organizations, role text, email text)

-- Projekte (1 Board = 1 Projekt)
projects (
  id uuid,
  org_id → organizations,
  name text,
  domain text,          -- 'bau' | 'industrie' | 'maschinenbau'
  location jsonb,       -- { canton, municipality, country }
  status text,          -- 'active' | 'archived'
  created_at
)

-- Hochgeladene Dokumente (Pläne, Zeichnungen)
documents (
  id uuid,
  project_id → projects,
  file_url text,        -- Supabase Storage URL
  doc_type text,        -- 'grundriss' | 'schnitt' | 'ansicht' | ...
  pages int,
  uploaded_at
)

-- Analyse-Läufe
analyses (
  id uuid,
  document_id → documents,
  result_json jsonb,    -- Rohe Claude-Antwort strukturiert
  status text,          -- 'pending' | 'running' | 'done' | 'error'
  cost_usd numeric,
  created_at
)

-- Einzelne Prüfpunkte pro Analyse
analysis_items (
  id uuid,
  analysis_id → analyses,
  standard_id → standards,
  status text,          -- 'ok' | 'fail' | 'warn'
  note text,
  suggestion text
)

-- Normen / Standards Datenbank
standards (
  id uuid,
  domain text,          -- 'bau' | 'industrie' | ...
  region text,          -- 'CH-ZH' | 'CH-BE' | ...
  category text,        -- 'grenzabstand' | 'gebaeudehöhe' | ...
  text text,
  source_url text,
  embedding vector(1536),
  valid_from date
)

-- Chat-Verlauf pro Projekt
chat_messages (
  id uuid,
  project_id → projects,
  role text,            -- 'user' | 'assistant'
  content text,
  created_at
)
```

---

## Domain Plugin System

Jede Domain ist ein Modul unter `backend/app/domains/` und implementiert das `BaseDomain` Interface:

```python
class BaseDomain:
    domain_id: str
    display_name: str
    
    def get_analysis_prompt(self, context: dict) -> str:
        """System-Prompt für Plan-Analyse"""
        ...
    
    def get_standards_search_prompt(self, location: dict) -> str:
        """Prompt für Normen-Recherche"""
        ...
    
    def parse_analysis_result(self, raw: str) -> list[AnalysisItem]:
        """Strukturiert Claude-Output zu Analysis Items"""
        ...
```

**Aktive Domain:** `bau` — Baupläne, SIA-Normen, kantonale Baugesetze CH/AT

---

## Die 4 Produktteile

### Teil 1 — Standards-Recherche
- User gibt Standort ein (Kanton + Gemeinde)
- Backend ruft Claude mit Web Search Tool auf
- Claude recherchiert: Zonenreglement, RBG/RBV, kantonale Baugesetze
- Ergebnis wird in `standards` Tabelle gespeichert + pgvector indexiert
- API: `POST /api/v1/projects/{id}/standards/research`

### Teil 2 — Dokument-Analyse (Kern-Feature)
- User lädt PDF hoch → Supabase Storage
- Backend: PDF → Seiten-Bilder (pdf2image)
- RAG: Relevante Normen aus pgvector holen (domain-gefiltert)
- Claude Sonnet 4.6 mit Vision: Bilder + Normen + Domain-Prompt
- Output: JSON mit `analysis_items` (ok/fail/warn + Vorschlag)
- API: `POST /api/v1/projects/{id}/analyses`

### Teil 3 — KI Chat
- Normaler Chat, aber mit Projektkontext im System-Prompt
- Kontext enthält: Normen-Set des Projekts + letzte Analyse-Ergebnisse
- Chat-History wird in `chat_messages` persistiert
- SSE Streaming zur Frontend
- API: `POST /api/v1/projects/{id}/chat`

### Teil 4 — Standards-Datenbank
- Admin-Interface: Normen hochladen (PDF/Text), chunken, embedden
- Public: Suche nach Norm, gefiltert nach Domain + Region
- API: `GET /api/v1/standards?domain=bau&region=CH-ZH`

---

## Anthropic Claude API Nutzung

```python
import anthropic

client = anthropic.Anthropic()

# Plan-Analyse (Vision)
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=4096,
    system=domain.get_analysis_prompt(context),  # mit Prompt Caching
    messages=[{
        "role": "user",
        "content": [
            {"type": "image", "source": {"type": "url", "url": image_url}},
            {"type": "text", "text": "Analysiere diesen Plan gegen die beigefügten Normen."}
        ]
    }]
)

# Normen-Recherche (Web Search)
response = client.messages.create(
    model="claude-sonnet-4-6",
    tools=[{"type": "web_search_20250305", "name": "web_search"}],
    messages=[...]
)
```

**Optimierungen:**
- Prompt Caching auf System-Prompts (−90% Input-Kosten bei Chat)
- Batch API für Massen-Analysen (−50% Gesamtkosten)
- pgvector RAG damit nicht jedes Mal alle Normen mitgeschickt werden

---

## Environment Variables

```bash
# Backend (.env)
ANTHROPIC_API_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
REDIS_URL=...

# Frontend (.env.local)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Entwicklungs-Reihenfolge (Empfehlung)

1. **Supabase Projekt anlegen** — Schema migrieren, Auth aktivieren, Storage Bucket erstellen
2. **Monorepo Scaffold** — Next.js + FastAPI aufsetzen, beide lokal lauffähig
3. **Auth Flow** — Login/Register mit Supabase Auth, JWT an Backend weitergeben
4. **Projekt-Dashboard** — CRUD für Projects, Dashboard-Ansicht
5. **Plan-Analyse (Teil 2)** — PDF Upload → Claude → Ergebnis anzeigen (Kern-Feature)
6. **Standards-Recherche (Teil 1)** — Standort → Claude Web Search → DB
7. **Chat (Teil 3)** — mit Projektkontext
8. **Standards-DB (Teil 4)** — Admin-Upload + öffentliche Suche
9. **Export** — PDF-Report + XLSX Mängelliste

---

## Konventionen

- Python: Type Hints überall, Pydantic für alle Schemas
- API Responses: immer `{ data: ..., error: null }` oder `{ data: null, error: "..." }`
- Fehlerbehandlung: HTTP Exceptions mit klaren Messages
- Alle Claude-Kosten pro Request in DB loggen (`cost_usd`)
- Row Level Security in Supabase: User sieht nur eigene Org-Projekte
- Domain-spezifischer Code immer in `domains/` — nie im Core
