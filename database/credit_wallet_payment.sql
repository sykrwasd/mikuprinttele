-- Atomically record a ToyyibPay payment and credit the wallet.
-- Run once in the Supabase SQL editor.
--
-- One transaction: the payment row and the wallet credit either both happen or
-- neither does. Before this, the payment row was inserted first and the wallet
-- updated afterwards, so a failure in between left the payment recorded but the
-- wallet uncredited (and ToyyibPay retries were then dropped as duplicates).
--
-- Duplicate callbacks (same order_id) are a no-op and return duplicate:true.
-- The wallet is credited with an in-database increment, not a value the caller
-- read earlier, so concurrent callbacks can't overwrite each other.

-- ON CONFLICT (order_id) needs a unique index. Harmless if you already have one;
-- fails only if payments already contains duplicate order_ids.
create unique index if not exists payments_order_id_key
  on public.payments (order_id);

create or replace function public.credit_wallet_payment(
  p_telegram_id  bigint,
  p_amount_cents int,
  p_payment      jsonb   -- order_id, billcode, refno, status, status_id, amount,
                         -- transaction_id, fpx_transaction_id, hash, transaction_time
) returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_user        public.users;
  v_new_balance int;
begin
  if p_amount_cents is null or p_amount_cents <= 0 then
    raise exception 'invalid amount: %', p_amount_cents;
  end if;
  if coalesce(p_payment->>'order_id', '') = '' then
    raise exception 'missing order_id';
  end if;

  select * into v_user from public.users where telegram_id = p_telegram_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'user_not_found');
  end if;

  -- jsonb_populate_record casts each field to the column's own type, so this
  -- works whatever types payments.transaction_time / amount etc. use.
  insert into public.payments
    (user_id, order_id, billcode, refno, status, status_id, amount,
     transaction_id, fpx_transaction_id, hash, transaction_time)
  select
    v_user.id, r.order_id, r.billcode, r.refno, r.status, r.status_id, r.amount,
    r.transaction_id, r.fpx_transaction_id, r.hash, r.transaction_time
  from jsonb_populate_record(null::public.payments, p_payment) r
  on conflict (order_id) do nothing;

  if not found then
    return jsonb_build_object('ok', true, 'duplicate', true);
  end if;

  update public.wallets
     set balance_cents = coalesce(balance_cents, 0) + p_amount_cents
   where user_id = v_user.id
  returning balance_cents into v_new_balance;

  if not found then
    -- Rolls back the payment insert too, so a retry can succeed later.
    raise exception 'wallet not found for user %', v_user.id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'duplicate', false,
    'balance_cents', v_new_balance
  );
end;
$$;

revoke all on function public.credit_wallet_payment(bigint, int, jsonb)
  from public, anon, authenticated;
grant execute on function public.credit_wallet_payment(bigint, int, jsonb)
  to service_role;
