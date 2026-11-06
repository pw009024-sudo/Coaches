-- Handball-Trainingsplaner: Datenbank-Schema für Supabase
-- Einmal komplett im Supabase "SQL Editor" ausführen.

-- Übungen (eine PDF-Seite = eine Übung)
create table if not exists public.exercises (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text not null default '',
  image_path   text not null,
  age_groups   text[] not null default '{}',
  goals        text[] not null default '{}',
  methods      text[] not null default '{}',
  duration_min integer,
  source_name  text,
  page_number  integer,
  created_by   uuid references auth.users(id) default auth.uid(),
  created_at   timestamptz not null default now()
);

-- Gespeicherte Trainingseinheiten
create table if not exists public.trainings (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  age_group     text,
  training_date date,
  notes         text not null default '',
  blocks        jsonb not null default '[]',
  created_by    uuid references auth.users(id) default auth.uid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.exercises enable row level security;
alter table public.trainings enable row level security;

-- Alle angemeldeten Trainer sehen und bearbeiten alles gemeinsam,
-- löschen darf aber nur, wer den Eintrag angelegt hat.
create policy "Team liest Übungen"      on public.exercises for select to authenticated using (true);
create policy "Team legt Übungen an"    on public.exercises for insert to authenticated with check (created_by = auth.uid());
create policy "Team bearbeitet Übungen" on public.exercises for update to authenticated using (true) with check (true);
create policy "Eigene Übungen löschen"  on public.exercises for delete to authenticated using (created_by = auth.uid());

create policy "Team liest Trainings"      on public.trainings for select to authenticated using (true);
create policy "Team legt Trainings an"    on public.trainings for insert to authenticated with check (created_by = auth.uid());
create policy "Team bearbeitet Trainings" on public.trainings for update to authenticated using (true) with check (true);
create policy "Eigene Trainings löschen"  on public.trainings for delete to authenticated using (created_by = auth.uid());

-- Speicher für die Übungsbilder (privat: nur angemeldete Trainer sehen sie)
insert into storage.buckets (id, name, public)
values ('uebungen', 'uebungen', false)
on conflict (id) do nothing;

create policy "Team liest Bilder"     on storage.objects for select to authenticated using (bucket_id = 'uebungen');
create policy "Team lädt Bilder hoch" on storage.objects for insert to authenticated with check (bucket_id = 'uebungen');
create policy "Eigene Bilder löschen" on storage.objects for delete to authenticated using (bucket_id = 'uebungen' and owner_id = auth.uid()::text);
