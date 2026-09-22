-- Mark a print job as failed and refund its cost, atomically.
-- Run once in the Supabase SQL editor.
--
-- Only a job that is currently 'printing' can be failed, so calling this twice
-- (retry, crash recovery) never refunds the same job twice.
-- p_job_id is text so this works whatever type print.id is.

create or replace function public.fail_print_job(p_job_id text)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_job         public.print;
  v_cents       int;
  v_new_balance int;
begin
  update public.print
     set print_status = 'failed'
   where id::text = p_job_id
     and print_status = 'printing'
  returning * into v_job;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_printing');
  end if;

  v_cents := round(v_job.total_price * 100)::int;

  update public.wallets
     set balance_cents = coalesce(balance_cents, 0) + v_cents
   where user_id = v_job.user_id
  returning balance_cents into v_new_balance;

  if not found then
    -- Rolls back the status change too, so the job stays 'printing' and this
    -- can be retried once the wallet problem is fixed.
    raise exception 'wallet not found for user %', v_job.user_id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'refunded_cents', v_cents,
    'balance_cents', v_new_balance
  );
end;
$$;

revoke all on function public.fail_print_job(text) from public, anon, authenticated;
grant execute on function public.fail_print_job(text) to service_role;
