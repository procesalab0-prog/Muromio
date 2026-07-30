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
        'status', pv.status,
        'created_at', pv.created_at
      ) order by pv.version_number desc)
      from public.project_versions pv
      where pv.project_id = p.id
        and pv.status in ('client_review', 'approved')
        and (sl.version_id is null or pv.id = sl.version_id)
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

create or replace function public.respond_to_shared_presentation(
  p_token text,
  p_name text,
  p_email text,
  p_status text,
  p_message text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.share_links%rowtype;
  requester uuid;
begin
  if p_status not in ('approved', 'changes_requested') then
    raise exception 'invalid response';
  end if;

  select * into target
  from public.share_links
  where token = p_token
    and revoked_at is null
    and (expires_at is null or expires_at > now());

  if not found then return false; end if;

  select owner_id into requester from public.projects where id = target.project_id;

  insert into public.approvals (
    project_id, version_id, requested_by, reviewer_name, reviewer_email,
    status, response_message, responded_at
  )
  values (
    target.project_id, target.version_id, requester, left(p_name, 140),
    left(p_email, 180), p_status, left(p_message, 1200), now()
  );

  insert into public.activity_events (
    project_id, event_type, entity_type, summary, metadata
  )
  values (
    target.project_id,
    'client.response',
    'approval',
    case when p_status = 'approved'
      then 'El cliente aprobó la presentación compartida.'
      else 'El cliente solicitó cambios en la presentación.'
    end,
    jsonb_build_object('reviewer', left(p_name, 140))
  );

  return true;
end;
$$;

grant execute on function public.get_shared_presentation(text) to anon, authenticated;
grant execute on function public.respond_to_shared_presentation(text, text, text, text, text) to anon, authenticated;
