-- Project-aware documents, complete render access, and manual production progress.

alter table public.projects
  add column if not exists progress_percent integer not null default 0
    check (progress_percent between 0 and 100);

alter table public.generated_documents
  add column if not exists included_sections text[] not null default '{}',
  add column if not exists render_ids uuid[] not null default '{}',
  add column if not exists notes text;

drop policy if exists "approved users own renders" on public.renders;
drop policy if exists "own renders" on public.renders;
create policy "project renders read"
  on public.renders for select to authenticated
  using (public.has_workspace_access() and public.can_access_project(project_id));
create policy "project renders add"
  on public.renders for insert to authenticated
  with check (public.has_workspace_access() and public.can_edit_project(project_id));
create policy "project renders change"
  on public.renders for update to authenticated
  using (public.has_workspace_access() and public.can_edit_project(project_id))
  with check (public.has_workspace_access() and public.can_edit_project(project_id));
create policy "project renders remove"
  on public.renders for delete to authenticated
  using (public.has_workspace_access() and public.can_edit_project(project_id));

drop policy if exists "approved users own references" on public.references;
drop policy if exists "own references" on public.references;
create policy "project references read"
  on public.references for select to authenticated
  using (public.has_workspace_access() and public.can_access_project(project_id));
create policy "project references add"
  on public.references for insert to authenticated
  with check (public.has_workspace_access() and public.can_edit_project(project_id));
create policy "project references change"
  on public.references for update to authenticated
  using (public.has_workspace_access() and public.can_edit_project(project_id))
  with check (public.has_workspace_access() and public.can_edit_project(project_id));
create policy "project references remove"
  on public.references for delete to authenticated
  using (public.has_workspace_access() and public.can_edit_project(project_id));

update public.projects p
set progress_percent = coalesce((
  select round(
    count(*) filter (where ph.status in ('approved', 'completed'))::numeric
    / nullif(count(*), 0) * 100
  )::integer
  from public.project_phases ph
  where ph.project_id = p.id
), 0)
where progress_percent = 0;
