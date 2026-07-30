create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists job_title text,
  add column if not exists avatar_path text;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 140),
  email text,
  phone text,
  company text,
  address text,
  notes text,
  status text not null default 'active'
    check (status in ('lead', 'active', 'paused', 'completed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects
  add column if not exists client_id uuid references public.clients(id) on delete set null,
  add column if not exists status text not null default 'active'
    check (status in ('lead', 'planning', 'active', 'review', 'on_hold', 'completed', 'archived')),
  add column if not exists stage text not null default 'concept'
    check (stage in ('brief', 'concept', 'design', 'development', 'procurement', 'construction', 'delivery')),
  add column if not exists location text,
  add column if not exists project_type text,
  add column if not exists area_m2 numeric(10,2),
  add column if not exists target_budget numeric(14,2),
  add column if not exists start_date date,
  add column if not exists due_date date,
  add column if not exists cover_path text,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'architect'
    check (role in ('director', 'architect', 'designer', 'viewer', 'client')),
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create or replace function public.can_access_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = target_project_id
      and (
        p.owner_id = auth.uid()
        or public.is_workspace_admin()
        or exists (
          select 1 from public.project_members pm
          where pm.project_id = p.id and pm.user_id = auth.uid()
        )
      )
  );
$$;

grant execute on function public.can_access_project(uuid) to authenticated;

create table if not exists public.project_phases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'review', 'approved', 'completed')),
  sort_order integer not null default 0,
  starts_on date,
  due_on date,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  phase_id uuid references public.project_phases(id) on delete set null,
  assignee_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'todo'
    check (status in ('todo', 'in_progress', 'review', 'blocked', 'done')),
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),
  due_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.style_library (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  palette text[] not null default '{}',
  materials text[] not null default '{}',
  prompt_template text,
  negative_prompt text,
  cover_path text,
  is_signature boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, slug)
);

create table if not exists public.project_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  render_id uuid references public.renders(id) on delete set null,
  parent_version_id uuid references public.project_versions(id) on delete set null,
  version_number integer not null default 1,
  title text not null,
  description text,
  asset_path text,
  asset_type text not null default 'render'
    check (asset_type in ('render', 'plan', 'moodboard', 'document', 'video')),
  status text not null default 'draft'
    check (status in ('draft', 'internal_review', 'client_review', 'approved', 'rejected', 'superseded')),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique(project_id, version_number)
);

create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  version_id uuid references public.project_versions(id) on delete cascade,
  requested_by uuid not null references public.profiles(id),
  reviewer_id uuid references public.profiles(id),
  reviewer_name text,
  reviewer_email text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'changes_requested', 'rejected')),
  message text,
  response_message text,
  requested_at timestamptz not null default now(),
  responded_at timestamptz
);

create table if not exists public.project_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  version_id uuid references public.project_versions(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  author_name text,
  body text not null,
  visibility text not null default 'team'
    check (visibility in ('team', 'client')),
  position_x numeric(6,3),
  position_y numeric(6,3),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id),
  name text not null,
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  category text not null default 'other'
    check (category in ('brief', 'plan', 'reference', 'render', 'moodboard', 'contract', 'budget', 'invoice', 'video', 'delivery', 'other')),
  is_client_visible boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  number text not null,
  title text not null,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'approved', 'rejected', 'expired')),
  currency text not null default 'MXN',
  subtotal numeric(14,2) not null default 0,
  tax numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  valid_until date,
  notes text,
  created_by uuid not null references public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  unique(project_id, number)
);

create table if not exists public.budget_items (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references public.budgets(id) on delete cascade,
  concept text not null,
  description text,
  quantity numeric(12,2) not null default 1,
  unit text not null default 'servicio',
  unit_price numeric(14,2) not null default 0,
  total numeric(14,2) generated always as (quantity * unit_price) stored,
  sort_order integer not null default 0
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  budget_id uuid references public.budgets(id) on delete set null,
  concept text not null,
  amount numeric(14,2) not null,
  currency text not null default 'MXN',
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'overdue', 'cancelled')),
  due_on date,
  paid_at timestamptz,
  invoice_reference text,
  created_at timestamptz not null default now()
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  category text,
  contact_name text,
  email text,
  phone text,
  website text,
  notes text,
  rating integer check (rating between 1 and 5),
  created_at timestamptz not null default now()
);

create table if not exists public.project_videos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  storage_path text,
  format text not null default 'landscape'
    check (format in ('landscape', 'portrait', 'square')),
  status text not null default 'draft'
    check (status in ('draft', 'queued', 'processing', 'completed', 'failed')),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.generated_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  document_type text not null
    check (document_type in ('proposal', 'contract', 'brief', 'minutes', 'budget', 'spec_sheet', 'weekly_report', 'approval', 'delivery_manual')),
  title text not null,
  status text not null default 'draft'
    check (status in ('draft', 'ready', 'sent', 'signed', 'archived')),
  storage_path text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.share_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  version_id uuid references public.project_versions(id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  label text,
  allow_download boolean not null default false,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  entity_type text,
  entity_id uuid,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists clients_owner_idx on public.clients(owner_id);
create index if not exists projects_client_idx on public.projects(client_id);
create index if not exists project_members_user_idx on public.project_members(user_id);
create index if not exists project_phases_project_idx on public.project_phases(project_id, sort_order);
create index if not exists tasks_project_idx on public.tasks(project_id, status);
create index if not exists versions_project_idx on public.project_versions(project_id, version_number desc);
create index if not exists approvals_project_idx on public.approvals(project_id, status);
create index if not exists comments_project_idx on public.project_comments(project_id, created_at desc);
create index if not exists files_project_idx on public.project_files(project_id, category);
create index if not exists budgets_project_idx on public.budgets(project_id, created_at desc);
create index if not exists payments_project_idx on public.payments(project_id, status);
create index if not exists activity_project_idx on public.activity_events(project_id, created_at desc);

alter table public.clients enable row level security;
alter table public.project_members enable row level security;
alter table public.project_phases enable row level security;
alter table public.tasks enable row level security;
alter table public.style_library enable row level security;
alter table public.project_versions enable row level security;
alter table public.approvals enable row level security;
alter table public.project_comments enable row level security;
alter table public.project_files enable row level security;
alter table public.budgets enable row level security;
alter table public.budget_items enable row level security;
alter table public.payments enable row level security;
alter table public.suppliers enable row level security;
alter table public.project_videos enable row level security;
alter table public.generated_documents enable row level security;
alter table public.share_links enable row level security;
alter table public.activity_events enable row level security;

drop policy if exists "workspace clients" on public.clients;
create policy "workspace clients" on public.clients for all to authenticated
  using (public.has_workspace_access() and (owner_id = auth.uid() or public.is_workspace_admin()))
  with check (public.has_workspace_access() and (owner_id = auth.uid() or public.is_workspace_admin()));

drop policy if exists "workspace styles" on public.style_library;
create policy "workspace styles" on public.style_library for all to authenticated
  using (public.has_workspace_access())
  with check (public.has_workspace_access() and owner_id = auth.uid());

drop policy if exists "workspace suppliers" on public.suppliers;
create policy "workspace suppliers" on public.suppliers for all to authenticated
  using (public.has_workspace_access())
  with check (public.has_workspace_access() and owner_id = auth.uid());

drop policy if exists "project members access" on public.project_members;
create policy "project members access" on public.project_members for all to authenticated
  using (public.can_access_project(project_id))
  with check (public.can_access_project(project_id));

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'project_phases', 'tasks', 'project_versions', 'approvals',
    'project_comments', 'project_files', 'budgets', 'payments',
    'project_videos', 'generated_documents', 'share_links', 'activity_events'
  ]
  loop
    execute format('drop policy if exists "project workspace access" on public.%I', table_name);
    execute format(
      'create policy "project workspace access" on public.%I for all to authenticated
       using (public.can_access_project(project_id))
       with check (public.can_access_project(project_id))',
      table_name
    );
  end loop;
end
$$;

drop policy if exists "budget item access" on public.budget_items;
create policy "budget item access" on public.budget_items for all to authenticated
  using (
    exists (
      select 1 from public.budgets b
      where b.id = budget_id and public.can_access_project(b.project_id)
    )
  )
  with check (
    exists (
      select 1 from public.budgets b
      where b.id = budget_id and public.can_access_project(b.project_id)
    )
  );

drop policy if exists "approved users workspace projects" on public.projects;
drop policy if exists "approved users own projects" on public.projects;
create policy "approved users workspace projects"
  on public.projects for all to authenticated
  using (public.has_workspace_access() and public.can_access_project(id))
  with check (public.has_workspace_access() and owner_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit)
values ('project-assets', 'project-assets', false, 52428800)
on conflict (id) do update set file_size_limit = excluded.file_size_limit;

drop policy if exists "project asset read" on storage.objects;
create policy "project asset read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'project-assets'
    and public.has_workspace_access()
  );

drop policy if exists "project asset insert" on storage.objects;
create policy "project asset insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'project-assets'
    and public.has_workspace_access()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

insert into public.style_library (
  owner_id, name, slug, description, palette, materials, prompt_template, is_signature
)
select
  p.id,
  seed.name,
  seed.slug,
  seed.description,
  seed.palette,
  seed.materials,
  seed.prompt_template,
  true
from (
  select id from public.profiles
  where role = 'admin'
  order by created_at asc
  limit 1
) p
cross join (
  values
    (
      'Serenidad mineral',
      'serenidad-mineral',
      'Interiores cálidos y silenciosos con piedra natural, madera y luz indirecta.',
      array['#E8DED0','#BBA58E','#6D5A4B','#2F2A27'],
      array['travertino','encino natural','lino','latón envejecido'],
      'Muromío signature interior, warm mineral palette, natural oak, honed travertine, soft indirect lighting, timeless editorial architecture'
    ),
    (
      'Tierra contemporánea',
      'tierra-contemporanea',
      'Volúmenes limpios, tonos terracota y artesanía mexicana contemporánea.',
      array['#C77B62','#D6B39A','#8A5A44','#F2E9DD'],
      array['estuco mineral','barro','nogal','textiles artesanales'],
      'Contemporary Mexican interior by Muromío, mineral plaster, terracotta accents, refined craftsmanship, sculptural furniture, warm daylight'
    ),
    (
      'Hospitalidad nocturna',
      'hospitalidad-nocturna',
      'Ambientes envolventes para bares y hospitalidad con iluminación escénica.',
      array['#211D1A','#59483B','#B08A63','#D8C7B2'],
      array['madera oscura','piedra','metal negro','vidrio acanalado'],
      'Luxury hospitality interior by Muromío, dark wood rhythm, dramatic architectural lighting, stone surfaces, intimate cinematic atmosphere'
    )
) as seed(name, slug, description, palette, materials, prompt_template)
on conflict (owner_id, slug) do nothing;
