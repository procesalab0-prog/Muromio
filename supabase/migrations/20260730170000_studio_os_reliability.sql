-- Studio OS reliability and access hardening.

grant select, insert, update, delete on table
  public.clients,
  public.project_members,
  public.project_phases,
  public.tasks,
  public.style_library,
  public.project_versions,
  public.approvals,
  public.project_comments,
  public.project_files,
  public.budgets,
  public.budget_items,
  public.payments,
  public.suppliers,
  public.project_videos,
  public.generated_documents,
  public.share_links,
  public.activity_events
to authenticated;

drop policy if exists "approved users workspace projects" on public.projects;

create policy "workspace projects select"
  on public.projects for select to authenticated
  using (public.has_workspace_access() and public.can_access_project(id));

create policy "workspace projects insert"
  on public.projects for insert to authenticated
  with check (public.has_workspace_access() and owner_id = auth.uid());

create policy "workspace projects update"
  on public.projects for update to authenticated
  using (public.has_workspace_access() and public.can_access_project(id))
  with check (public.has_workspace_access() and public.can_access_project(id));

create policy "workspace projects delete"
  on public.projects for delete to authenticated
  using (
    public.has_workspace_access()
    and (owner_id = auth.uid() or public.is_workspace_admin())
  );

create or replace function public.create_workspace_project(
  p_name text,
  p_client_id uuid default null,
  p_description text default null,
  p_project_type text default null,
  p_location text default null,
  p_area_m2 numeric default null,
  p_target_budget numeric default null,
  p_due_date date default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  new_project_id uuid := gen_random_uuid();
begin
  if not public.has_workspace_access() then
    raise exception 'workspace_access_required';
  end if;

  if nullif(trim(p_name), '') is null then
    raise exception 'project_name_required';
  end if;

  insert into public.projects (
    id, owner_id, client_id, name, description, project_type, location,
    area_m2, target_budget, due_date, status, stage
  )
  values (
    new_project_id, auth.uid(), p_client_id, trim(p_name), p_description,
    p_project_type, p_location, p_area_m2, p_target_budget, p_due_date,
    'planning', 'brief'
  );

  insert into public.project_phases (project_id, name, status, sort_order)
  select
    new_project_id,
    phase.name,
    case when phase.sort_order = 0 then 'active' else 'pending' end,
    phase.sort_order
  from (
    values
      ('Brief', 0), ('Concepto', 1), ('Diseño', 2),
      ('Desarrollo', 3), ('Compras', 4), ('Obra', 5), ('Entrega', 6)
  ) as phase(name, sort_order);

  insert into public.activity_events (
    project_id, actor_id, event_type, entity_type, entity_id, summary
  )
  values (
    new_project_id, auth.uid(), 'project.created', 'project',
    new_project_id, 'Se creó el proyecto ' || trim(p_name) || '.'
  );

  return new_project_id;
end;
$$;

grant execute on function public.create_workspace_project(
  text, uuid, text, text, text, numeric, numeric, date
) to authenticated;

drop policy if exists "project workspace access" on public.activity_events;

create policy "project activity access"
  on public.activity_events for all to authenticated
  using (
    public.has_workspace_access()
    and project_id is not null
    and public.can_access_project(project_id)
  )
  with check (
    public.has_workspace_access()
    and project_id is not null
    and public.can_access_project(project_id)
    and actor_id = auth.uid()
  );

create policy "workspace activity access"
  on public.activity_events for all to authenticated
  using (
    public.has_workspace_access()
    and project_id is null
    and (actor_id = auth.uid() or public.is_workspace_admin())
  )
  with check (
    public.has_workspace_access()
    and project_id is null
    and actor_id = auth.uid()
  );

drop policy if exists "project asset read" on storage.objects;
create policy "project asset read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'project-assets'
    and public.has_workspace_access()
    and array_length(storage.foldername(name), 1) >= 2
    and public.can_access_project(((storage.foldername(name))[2])::uuid)
  );

drop policy if exists "project asset insert" on storage.objects;
create policy "project asset insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'project-assets'
    and public.has_workspace_access()
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.can_access_project(((storage.foldername(name))[2])::uuid)
  );

drop policy if exists "shared render asset read" on storage.objects;
create policy "shared render asset read"
  on storage.objects for select to anon
  using (
    bucket_id = 'render-assets'
    and exists (
      select 1
      from public.project_versions pv
      join public.share_links sl on sl.project_id = pv.project_id
      where pv.asset_path = name
        and sl.revoked_at is null
        and (sl.expires_at is null or sl.expires_at > now())
        and (sl.version_id is null or sl.version_id = pv.id)
    )
  );

create or replace function public.recalculate_budget(target_budget_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  calculated_subtotal numeric(14,2);
begin
  if not exists (
    select 1 from public.budgets b
    where b.id = target_budget_id and public.can_access_project(b.project_id)
  ) then
    raise exception 'budget_access_denied';
  end if;

  select coalesce(sum(total), 0)
  into calculated_subtotal
  from public.budget_items
  where budget_id = target_budget_id;

  update public.budgets
  set
    subtotal = calculated_subtotal,
    tax = round(calculated_subtotal * 0.16, 2),
    total = calculated_subtotal + round(calculated_subtotal * 0.16, 2)
  where id = target_budget_id;
end;
$$;

grant execute on function public.recalculate_budget(uuid) to authenticated;

create or replace function public.get_shared_presentation(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'share', jsonb_build_object(
      'label', sl.label,
      'allow_download', sl.allow_download,
      'expires_at', sl.expires_at
    ),
    'project', jsonb_build_object(
      'id', p.id,
      'name', p.name,
      'description', p.description,
      'location', p.location,
      'project_type', p.project_type,
      'stage', p.stage,
      'client_name', c.name
    ),
    'versions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', pv.id,
        'version_number', pv.version_number,
        'title', pv.title,
        'description', pv.description,
        'asset_type', pv.asset_type,
        'asset_path', pv.asset_path,
        'status', pv.status,
        'created_at', pv.created_at
      ) order by pv.version_number desc)
      from public.project_versions pv
      where pv.project_id = p.id
        and pv.asset_path is not null
        and (
          sl.version_id = pv.id
          or (
            sl.version_id is null
            and pv.status in ('client_review', 'approved', 'internal_review')
          )
        )
    ), '[]'::jsonb)
  )
  from public.share_links sl
  join public.projects p on p.id = sl.project_id
  left join public.clients c on c.id = p.client_id
  where sl.token = p_token
    and sl.revoked_at is null
    and (sl.expires_at is null or sl.expires_at > now())
  limit 1;
$$;

grant execute on function public.get_shared_presentation(text) to anon, authenticated;

create or replace function public.register_render_version(
  p_render_id uuid,
  p_title text default 'Propuesta visual'
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  target_render public.renders%rowtype;
  new_version_id uuid := gen_random_uuid();
  next_version integer;
begin
  select * into target_render
  from public.renders
  where id = p_render_id and status = 'completed';

  if target_render.id is null or not public.can_access_project(target_render.project_id) then
    raise exception 'render_access_denied';
  end if;

  perform pg_advisory_xact_lock(hashtext(target_render.project_id::text));
  select coalesce(max(version_number), 0) + 1
  into next_version
  from public.project_versions
  where project_id = target_render.project_id;

  insert into public.project_versions (
    id, project_id, render_id, version_number, title, description,
    asset_path, asset_type, status, created_by
  )
  values (
    new_version_id, target_render.project_id, target_render.id, next_version,
    nullif(trim(p_title), ''), 'Render generado en Muromío Render Lab.',
    target_render.output_path, 'render', 'internal_review', auth.uid()
  );

  return new_version_id;
end;
$$;

grant execute on function public.register_render_version(uuid, text) to authenticated;

drop policy if exists "workspace clients" on public.clients;
create policy "workspace clients select"
  on public.clients for select to authenticated
  using (
    public.has_workspace_access()
    and (
      owner_id = auth.uid()
      or public.is_workspace_admin()
      or exists (
        select 1 from public.projects p
        where p.client_id = id and public.can_access_project(p.id)
      )
    )
  );
create policy "workspace clients insert"
  on public.clients for insert to authenticated
  with check (public.has_workspace_access() and owner_id = auth.uid());
create policy "workspace clients update"
  on public.clients for update to authenticated
  using (public.has_workspace_access() and (owner_id = auth.uid() or public.is_workspace_admin()))
  with check (public.has_workspace_access() and (owner_id = auth.uid() or public.is_workspace_admin()));
create policy "workspace clients delete"
  on public.clients for delete to authenticated
  using (public.has_workspace_access() and (owner_id = auth.uid() or public.is_workspace_admin()));

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
begin
  if not public.can_access_project(p_project_id) then
    raise exception 'project_access_denied';
  end if;
  if p_role not in ('director', 'architect', 'designer', 'viewer', 'client') then
    raise exception 'invalid_project_role';
  end if;

  select id into member_id
  from public.profiles
  where lower(email) = lower(trim(p_email))
    and access_status = 'approved'
  limit 1;

  if member_id is null then
    raise exception 'approved_user_not_found';
  end if;

  insert into public.project_members(project_id, user_id, role)
  values(p_project_id, member_id, p_role)
  on conflict(project_id, user_id) do update set role = excluded.role;

  return member_id;
end;
$$;

grant execute on function public.add_project_member_by_email(uuid, text, text) to authenticated;
