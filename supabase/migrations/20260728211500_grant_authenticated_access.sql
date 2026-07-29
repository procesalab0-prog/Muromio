grant usage on schema public to authenticated;

grant select, insert, update, delete
  on table public.profiles
  to authenticated;

grant select, insert, update, delete
  on table public.projects
  to authenticated;

grant select, insert, update, delete
  on table public.references
  to authenticated;

grant select, insert, update, delete
  on table public.renders
  to authenticated;
