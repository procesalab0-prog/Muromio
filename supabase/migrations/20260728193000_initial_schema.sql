create extension if not exists pgcrypto;

do $$
begin
  create type public.render_status as enum (
    'draft',
    'queued',
    'processing',
    'completed',
    'failed'
  );
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.references (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  storage_path text not null,
  kind text not null check (kind in ('plan', 'sketch', 'moodboard', 'reference')),
  created_at timestamptz not null default now()
);

create table if not exists public.renders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  status public.render_status not null default 'draft',
  prompt text not null,
  provider text,
  provider_job_id text,
  output_path text,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists projects_owner_id_idx on public.projects(owner_id);
create index if not exists references_project_id_idx on public.references(project_id);
create index if not exists renders_project_id_idx on public.renders(project_id);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.references enable row level security;
alter table public.renders enable row level security;

do $$
begin
  create policy "own profile" on public.profiles
    for all using (id = auth.uid()) with check (id = auth.uid());
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create policy "own projects" on public.projects
    for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create policy "own references" on public.references
    for all
    using (
      exists (
        select 1 from public.projects p
        where p.id = project_id and p.owner_id = auth.uid()
      )
    )
    with check (
      exists (
        select 1 from public.projects p
        where p.id = project_id and p.owner_id = auth.uid()
      )
    );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create policy "own renders" on public.renders
    for all
    using (
      exists (
        select 1 from public.projects p
        where p.id = project_id and p.owner_id = auth.uid()
      )
    )
    with check (
      exists (
        select 1 from public.projects p
        where p.id = project_id and p.owner_id = auth.uid()
      )
    );
exception
  when duplicate_object then null;
end
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
