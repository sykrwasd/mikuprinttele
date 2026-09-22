-- Atomically charge the wallet and create the print job.
-- Run once in the Supabase SQL editor.
--
-- Everything happens in one transaction: either the wallet is charged AND the
-- job row exists, or neither. The wallet row is locked (FOR UPDATE), so two
-- concurrent confirms for the same user are serialised and can't overdraw.
--
-- Expected business failures are returned as {ok:false, reason:...}.
-- Anything unexpected raises, which the caller sees as an RPC error.

create or replace function public.confirm_print_job(
  p_telegram_id bigint,
  p_file_name   text,
  p_file_path   text,
  p_page_num    int,
  p_preference  text,
  p_total_cents int
) returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_user        public.users;
  v_wallet      public.wallets;
  v_job         public.print;
  v_new_balance int;
begin
  if p_total_cents is null or p_total_cents <= 0 then
    raise exception 'invalid total: %', p_total_cents;
  end if;
  if p_page_num is null or p_page_num <= 0 then
    raise exception 'invalid page count: %', p_page_num;
  end if;
  if p_preference not in ('bw', 'colour') then
    raise exception 'invalid preference: %', p_preference;
  end if;
  if p_file_path is null or p_file_path = '' then
    raise exception 'missing file path';
  end if;

  select * into v_user from public.users where telegram_id = p_telegram_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'user_not_found');
  end if;

  -- Lock the wallet row until the transaction ends.
  select * into v_wallet from public.wallets where user_id = v_user.id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'wallet_not_found');
  end if;

  if v_wallet.balance_cents < p_total_cents then
    return jsonb_build_object(
      'ok', false,
      'reason', 'insufficient_balance',
      'balance_cents', v_wallet.balance_cents
    );
  end if;

  update public.wallets
     set balance_cents = balance_cents - p_total_cents
   where id = v_wallet.id
  returning balance_cents into v_new_balance;

  insert into public.print
    (user_id, file_name, file_path, page_num, preference, total_price, print_status)
  values
    (v_user.id, p_file_name, p_file_path, p_page_num, p_preference,
     p_total_cents / 100.0, 'pending')
  returning * into v_job;

  return jsonb_build_object(
    'ok', true,
    'job_id', v_job.id,
    'balance_cents', v_new_balance
  );
end;
$$;

-- Only the bot/print server (service role) may call this.
revoke all on function public.confirm_print_job(bigint, text, text, int, text, int)
  from public, anon, authenticated;
grant execute on function public.confirm_print_job(bigint, text, text, int, text, int)
  to service_role;
