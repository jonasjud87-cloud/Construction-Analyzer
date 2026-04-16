-- Demo-Organisation für lokale Entwicklung
-- Nur für lokale Supabase-Instanz verwenden!

insert into organizations (id, name, plan_tier)
values ('00000000-0000-0000-0000-000000000001', 'Demo Organisation', 'pro')
on conflict (id) do nothing;
