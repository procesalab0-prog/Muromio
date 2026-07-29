alter table public.profiles
  add column if not exists credit_balance integer not null default 50 check (credit_balance >= 0),
  add column if not exists unlimited_credits boolean not null default false,
  add column if not exists credits_spent integer not null default 0 check (credits_spent >= 0),
  add column if not exists estimated_usd numeric(10,2) not null default 0 check (estimated_usd >= 0);

update public.profiles
set unlimited_credits = true
where role = 'admin';

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null,
  estimated_usd numeric(10,2) not null,
  operation text not null,
  created_at timestamptz not null default now()
);

alter table public.credit_transactions enable row level security;

drop policy if exists "users read own credit transactions" on public.credit_transactions;
create policy "users read own credit transactions"
  on public.credit_transactions for select
  to authenticated
  using (user_id = auth.uid() or public.is_workspace_admin());

create or replace function public.spend_render_credits(p_amount integer, p_operation text)
returns table(credit_balance integer, unlimited_credits boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.profiles%rowtype;
begin
  if p_amount <= 0 then raise exception 'invalid credit amount'; end if;

  select * into target from public.profiles
  where id = auth.uid() and access_status = 'approved'
  for update;

  if not found then raise exception 'profile not approved'; end if;
  if not target.unlimited_credits and target.credit_balance < p_amount then
    raise exception 'insufficient credits';
  end if;

  update public.profiles
  set
    credit_balance = case when target.unlimited_credits then credit_balance else credit_balance - p_amount end,
    credits_spent = credits_spent + p_amount,
    estimated_usd = estimated_usd + (p_amount * 0.01)
  where id = auth.uid()
  returning profiles.credit_balance, profiles.unlimited_credits
  into credit_balance, unlimited_credits;

  insert into public.credit_transactions(user_id, amount, estimated_usd, operation)
  values (auth.uid(), -p_amount, p_amount * 0.01, left(p_operation, 120));

  return next;
end;
$$;

create or replace function public.refund_render_credits(p_amount integer, p_operation text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.profiles%rowtype;
begin
  if p_amount <= 0 then return; end if;
  select * into target from public.profiles where id = auth.uid() for update;
  if not found then return; end if;

  update public.profiles
  set
    credit_balance = case when target.unlimited_credits then credit_balance else credit_balance + p_amount end,
    credits_spent = greatest(0, credits_spent - p_amount),
    estimated_usd = greatest(0, estimated_usd - (p_amount * 0.01))
  where id = auth.uid();

  insert into public.credit_transactions(user_id, amount, estimated_usd, operation)
  values (auth.uid(), p_amount, -(p_amount * 0.01), left('Reembolso: ' || p_operation, 120));
end;
$$;

grant execute on function public.spend_render_credits(integer, text) to authenticated;
grant execute on function public.refund_render_credits(integer, text) to authenticated;
