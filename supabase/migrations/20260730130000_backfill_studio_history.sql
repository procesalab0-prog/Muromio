insert into public.project_phases (project_id, name, status, sort_order)
select
  p.id,
  phase.name,
  case when phase.sort_order = 0 then 'active' else 'pending' end,
  phase.sort_order
from public.projects p
cross join (
  values
    ('Brief', 0),
    ('Concepto', 1),
    ('Diseño', 2),
    ('Desarrollo', 3),
    ('Compras', 4),
    ('Obra', 5),
    ('Entrega', 6)
) as phase(name, sort_order)
where not exists (
  select 1 from public.project_phases existing
  where existing.project_id = p.id
);

insert into public.project_versions (
  project_id,
  render_id,
  version_number,
  title,
  description,
  asset_path,
  asset_type,
  status,
  created_by,
  created_at
)
select
  ranked.project_id,
  ranked.id,
  ranked.version_number,
  'Propuesta visual ' || ranked.version_number,
  'Versión recuperada del historial original de Render Lab.',
  ranked.output_path,
  'render',
  case
    when ranked.version_number = ranked.latest_version then 'internal_review'
    else 'superseded'
  end,
  ranked.owner_id,
  ranked.created_at
from (
  select
    r.id,
    r.project_id,
    r.output_path,
    r.created_at,
    p.owner_id,
    row_number() over (partition by r.project_id order by r.created_at asc)::integer as version_number,
    count(*) over (partition by r.project_id)::integer as latest_version
  from public.renders r
  join public.projects p on p.id = r.project_id
  where r.status = 'completed' and r.output_path is not null
) ranked
where not exists (
  select 1 from public.project_versions pv
  where pv.render_id = ranked.id
);

insert into public.activity_events (
  project_id,
  actor_id,
  event_type,
  entity_type,
  entity_id,
  summary,
  created_at
)
select
  p.id,
  p.owner_id,
  'project.migrated',
  'project',
  p.id,
  'El historial existente se integró a Muromío Studio OS.',
  now()
from public.projects p
where not exists (
  select 1 from public.activity_events ae
  where ae.project_id = p.id and ae.event_type = 'project.migrated'
);
