-- Enable pgvector extension
create extension if not exists vector;

-- ── Organizations ────────────────────────────────────────────────────────────
create table organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  plan_tier  text not null default 'free',  -- 'free' | 'pro' | 'enterprise'
  created_at timestamptz not null default now()
);

-- ── Users ─────────────────────────────────────────────────────────────────────
create table users (
  id         uuid primary key references auth.users(id) on delete cascade,
  org_id     uuid not null references organizations(id) on delete cascade,
  role       text not null default 'member',  -- 'owner' | 'admin' | 'member'
  email      text not null,
  created_at timestamptz not null default now()
);

-- ── Projects ──────────────────────────────────────────────────────────────────
create table projects (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organizations(id) on delete cascade,
  name       text not null,
  domain     text not null default 'bau',  -- 'bau' | 'industrie' | 'maschinenbau'
  location   jsonb not null default '{}',  -- { canton, municipality, country }
  status     text not null default 'active',  -- 'active' | 'archived'
  created_at timestamptz not null default now()
);

-- ── Documents ─────────────────────────────────────────────────────────────────
create table documents (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  file_url    text not null,
  doc_type    text not null default 'grundriss',
  -- 'grundriss' | 'schnitt' | 'ansicht' | 'lageplan' | 'detail'
  pages       int,
  uploaded_at timestamptz not null default now()
);

-- ── Standards (vor analysis_items, da FK-Referenz) ───────────────────────────
create table standards (
  id          uuid primary key default gen_random_uuid(),
  domain      text not null,   -- 'bau' | 'industrie' | ...
  region      text not null,   -- 'CH-ZH' | 'CH-BE' | 'AT' | ...
  category    text not null,   -- 'grenzabstand' | 'gebaeudehöhe' | ...
  text        text not null,
  source_url  text,
  embedding   vector(1536),
  valid_from  date,
  created_at  timestamptz not null default now()
);

-- ── Analyses ──────────────────────────────────────────────────────────────────
create table analyses (
  id           uuid primary key default gen_random_uuid(),
  document_id  uuid not null references documents(id) on delete cascade,
  result_json  jsonb,
  status       text not null default 'pending',
  -- 'pending' | 'running' | 'done' | 'error'
  cost_usd     numeric(10, 6),
  created_at   timestamptz not null default now()
);

-- ── Analysis Items ────────────────────────────────────────────────────────────
create table analysis_items (
  id           uuid primary key default gen_random_uuid(),
  analysis_id  uuid not null references analyses(id) on delete cascade,
  standard_id  uuid references standards(id) on delete set null,
  status       text not null,  -- 'ok' | 'fail' | 'warn'
  note         text not null,
  suggestion   text
);

-- ── Chat Messages ─────────────────────────────────────────────────────────────
create table chat_messages (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  role        text not null,  -- 'user' | 'assistant'
  content     text not null,
  created_at  timestamptz not null default now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
create index on projects(org_id);
create index on documents(project_id);
create index on analyses(document_id);
create index on analysis_items(analysis_id);
create index on standards(domain, region);
create index on chat_messages(project_id, created_at);

-- pgvector HNSW Index für schnelle Embedding-Suche
create index on standards using hnsw (embedding vector_cosine_ops);

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table organizations enable row level security;
alter table users enable row level security;
alter table projects enable row level security;
alter table documents enable row level security;
alter table analyses enable row level security;
alter table analysis_items enable row level security;
alter table standards enable row level security;
alter table chat_messages enable row level security;

-- User sieht nur Daten der eigenen Organisation
create policy "users_own_org" on users
  for all using (id = auth.uid());

create policy "projects_own_org" on projects
  for all using (
    org_id in (select org_id from users where id = auth.uid())
  );

create policy "documents_via_project" on documents
  for all using (
    project_id in (
      select id from projects where org_id in (
        select org_id from users where id = auth.uid()
      )
    )
  );

create policy "analyses_via_document" on analyses
  for all using (
    document_id in (
      select id from documents where project_id in (
        select id from projects where org_id in (
          select org_id from users where id = auth.uid()
        )
      )
    )
  );

create policy "analysis_items_via_analysis" on analysis_items
  for all using (
    analysis_id in (
      select id from analyses where document_id in (
        select id from documents where project_id in (
          select id from projects where org_id in (
            select org_id from users where id = auth.uid()
          )
        )
      )
    )
  );

-- Standards sind öffentlich lesbar
create policy "standards_public_read" on standards
  for select using (true);

create policy "chat_messages_via_project" on chat_messages
  for all using (
    project_id in (
      select id from projects where org_id in (
        select org_id from users where id = auth.uid()
      )
    )
  );
