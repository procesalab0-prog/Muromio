alter table public.profiles
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists role text not null default 'user'
    check (role in ('user', 'admin')),
  add column if not exists access_status text not null default 'pending'
    check (access_status in ('pending', 'approved', 'rejected')),
  add column if not exists requested_at timestamptz not null default now(),
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references public.profiles(id);

update public.profiles p
set
  email = coalesce(p.email, u.email),
  phone = coalesce(p.phone, u.phone, u.raw_user_meta_data ->> 'phone'),
  full_name = coalesce(p.full_name, u.raw_user_meta_data ->> 'full_name'),
  access_status = 'approved'
from auth.users u
where u.id = p.id;

update public.profiles
set role = 'admin', access_status = 'approved'
where id = (
  select id from public.profiles
  order by created_at asc
  limit 1
);

create or replace function public.is_workspace_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and access_status = 'approved'
  );
$$;

create or replace function public.has_workspace_access()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and access_status = 'approved'
  );
$$;

grant execute on function public.is_workspace_admin() to authenticated;
grant execute on function public.has_workspace_access() to authenticated;

drop policy if exists "own profile" on public.profiles;
drop policy if exists "admins manage profiles" on public.profiles;
drop policy if exists "users read own profile" on public.profiles;
drop policy if exists "users create own pending profile" on public.profiles;

create policy "users read own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_workspace_admin());

create policy "users create own pending profile"
  on public.profiles for insert
  to authenticated
  with check (
    id = auth.uid()
    and role = 'user'
    and access_status = 'pending'
  );

create policy "admins manage profiles"
  on public.profiles for update
  to authenticated
  using (public.is_workspace_admin())
  with check (public.is_workspace_admin());

drop policy if exists "own projects" on public.projects;
create policy "approved users own projects"
  on public.projects for all
  to authenticated
  using (owner_id = auth.uid() and public.has_workspace_access())
  with check (owner_id = auth.uid() and public.has_workspace_access());

drop policy if exists "own references" on public.references;
create policy "approved users own references"
  on public.references for all
  to authenticated
  using (
    public.has_workspace_access()
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
  )
  with check (
    public.has_workspace_access()
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
  );

drop policy if exists "own renders" on public.renders;
create policy "approved users own renders"
  on public.renders for all
  to authenticated
  using (
    public.has_workspace_access()
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
  )
  with check (
    public.has_workspace_access()
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    phone,
    full_name,
    role,
    access_status
  )
  values (
    new.id,
    new.email,
    coalesce(new.phone, new.raw_user_meta_data ->> 'phone'),
    new.raw_user_meta_data ->> 'full_name',
    'user',
    'pending'
  )
  on conflict (id) do update set
    email = excluded.email,
    phone = coalesce(public.profiles.phone, excluded.phone),
    full_name = coalesce(public.profiles.full_name, excluded.full_name);
  return new;
end;
$$;
