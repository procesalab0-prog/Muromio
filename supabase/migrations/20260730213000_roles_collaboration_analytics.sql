-- Muromío OS roles and safe project collaboration.

do $$
declare
  constraint_name text;
begin
  select conname into constraint_name
  from pg_constraint
  where conrelid = 'public.profiles'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%role%';

  if constraint_name is not null then
    execute format('alter table public.profiles drop constraint %I', constraint_name);
  end if;
end $$;

update public.profiles set role = 'staff' where role = 'user';
alter table public.profiles alter column role set default 'staff';
alter table public.profiles
  add constraint profiles_role_check check (role in ('admin', 'staff', 'client'));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, phone, full_name, role, access_status)
  values (
    new.id,
    new.email,
    coalesce(new.phone, new.raw_user_meta_data ->> 'phone'),
    new.raw_user_meta_data ->> 'full_name',
    'staff',
    'pending'
  )
  on conflict (id) do update set
    email = excluded.email,
    phone = coalesce(public.profiles.phone, excluded.phone),
    full_name = coalesce(public.profiles.full_name, excluded.full_name);
  return new;
end;
$$;

create or replace function public.can_edit_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects p
    join public.profiles current_profile on current_profile.id = auth.uid()
    where p.id = target_project_id
      and current_profile.access_status = 'approved'
      and (
        current_profile.role = 'admin'
        or p.owner_id = auth.uid()
        or (
          current_profile.role = 'staff'
          and exists (
            select 1 from public.project_members pm
            where pm.project_id = p.id
              and pm.user_id = auth.uid()
              and pm.role in ('director', 'architect', 'designer')
          )
        )
      )
  );
$$;

grant execute on function public.can_edit_project(uuid) to authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'project_phases', 'tasks', 'project_versions', 'approvals',
    'project_files', 'budgets', 'payments', 'project_videos',
    'generated_documents', 'share_links', 'activity_events'
  ]
  loop
    execute format('drop policy if exists "project workspace access" on public.%I', table_name);
    execute format('drop policy if exists "project activity access" on public.%I', table_name);
    execute format(
      'create policy "project data read" on public.%I for select to authenticated
       using (public.has_workspace_access() and public.can_access_project(project_id))',
      table_name
    );
    execute format(
      'create policy "project data add" on public.%I for insert to authenticated
       with check (public.has_workspace_access() and public.can_edit_project(project_id))',
      table_name
    );
    execute format(
      'create policy "project data change" on public.%I for update to authenticated
       using (public.has_workspace_access() and public.can_edit_project(project_id))
       with check (public.has_workspace_access() and public.can_edit_project(project_id))',
      table_name
    );
    execute format(
      'create policy "project data remove" on public.%I for delete to authenticated
       using (public.has_workspace_access() and public.can_edit_project(project_id))',
      table_name
    );
  end loop;
end $$;

drop policy if exists "project workspace access" on public.project_comments;
create policy "project comments read"
  on public.project_comments for select to authenticated
  using (
    public.can_access_project(project_id)
    and (visibility = 'client' or public.can_edit_project(project_id))
  );
create policy "project comments add"
  on public.project_comments for insert to authenticated
  with check (
    public.can_access_project(project_id)
    and author_id = auth.uid()
    and (visibility = 'client' or public.can_edit_project(project_id))
  );
create policy "project comments change"
  on public.project_comments for update to authenticated
  using (author_id = auth.uid() or public.can_edit_project(project_id))
  with check (author_id = auth.uid() or public.can_edit_project(project_id));

drop policy if exists "budget item access" on public.budget_items;
create policy "budget items read"
  on public.budget_items for select to authenticated
  using (exists (
    select 1 from public.budgets b
    where b.id = budget_id and public.can_access_project(b.project_id)
  ));
create policy "budget items manage"
  on public.budget_items for all to authenticated
  using (exists (
    select 1 from public.budgets b
    where b.id = budget_id and public.can_edit_project(b.project_id)
  ))
  with check (exists (
    select 1 from public.budgets b
    where b.id = budget_id and public.can_edit_project(b.project_id)
  ));

drop policy if exists "workspace projects update" on public.projects;
create policy "workspace projects update"
  on public.projects for update to authenticated
  using (public.has_workspace_access() and public.can_edit_project(id))
  with check (public.has_workspace_access() and public.can_edit_project(id));

drop policy if exists "project members access" on public.project_members;
create policy "project members read"
  on public.project_members for select to authenticated
  using (public.can_access_project(project_id));
create policy "project members add"
  on public.project_members for insert to authenticated
  with check (public.can_edit_project(project_id));
create policy "project members change"
  on public.project_members for update to authenticated
  using (public.can_edit_project(project_id))
  with check (public.can_edit_project(project_id));
create policy "project members remove"
  on public.project_members for delete to authenticated
  using (public.can_edit_project(project_id));

create or replace function public.add_project_member_by_email(
  p_project_id uuid,
  p_email text,
  p_role text default 'architect'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  member_id uuid;
  member_workspace_role text;
begin
  if not public.can_edit_project(p_project_id) then
    raise exception 'project_edit_denied';
  end if;
  if p_role not in ('director', 'architect', 'designer', 'viewer', 'client') then
    raise exception 'invalid_project_role';
  end if;

  select id, role into member_id, member_workspace_role
  from public.profiles
  where lower(email) = lower(trim(p_email))
    and access_status = 'approved'
  limit 1;

  if member_id is null then
    raise exception 'approved_user_not_found';
  end if;
  if member_workspace_role = 'client' and p_role <> 'client' then
    raise exception 'client_role_mismatch';
  end if;

  insert into public.project_members(project_id, user_id, role)
  values(p_project_id, member_id, p_role)
  on conflict(project_id, user_id) do update set role = excluded.role;

  return member_id;
end;
$$;

grant execute on function public.add_project_member_by_email(uuid, text, text) to authenticated;

create or replace function public.set_profile_workspace_role(
  p_profile_id uuid,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_workspace_admin() then
    raise exception 'admin_required';
  end if;
  if p_role not in ('admin', 'staff', 'client') then
    raise exception 'invalid_workspace_role';
  end if;
  if p_profile_id = auth.uid() and p_role <> 'admin' then
    raise exception 'cannot_demote_self';
  end if;

  update public.profiles
  set role = p_role
  where id = p_profile_id;
end;
$$;

grant execute on function public.set_profile_workspace_role(uuid, text) to authenticated;
