update public.profiles
set estimated_usd = credits_spent * 0.02;

update public.credit_transactions
set estimated_usd = case
  when amount < 0 then abs(amount) * 0.02
  else -(amount * 0.02)
end;

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
    credit_balance = case when target.unlimited_credits then profiles.credit_balance else profiles.credit_balance - p_amount end,
    credits_spent = profiles.credits_spent + p_amount,
    estimated_usd = profiles.estimated_usd + (p_amount * 0.02)
  where id = auth.uid()
  returning profiles.credit_balance, profiles.unlimited_credits
  into credit_balance, unlimited_credits;

  insert into public.credit_transactions(user_id, amount, estimated_usd, operation)
  values (auth.uid(), -p_amount, p_amount * 0.02, left(p_operation, 120));

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
    credit_balance = case when target.unlimited_credits then profiles.credit_balance else profiles.credit_balance + p_amount end,
    credits_spent = greatest(0, profiles.credits_spent - p_amount),
    estimated_usd = greatest(0, profiles.estimated_usd - (p_amount * 0.02))
  where id = auth.uid();

  insert into public.credit_transactions(user_id, amount, estimated_usd, operation)
  values (auth.uid(), p_amount, -(p_amount * 0.02), left('Reembolso: ' || p_operation, 120));
end;
$$;
