-- RPC function to atomically increment attempts_used
create or replace function public.increment_attempts_used(p_entitlement_id uuid)
returns void as $$
begin
  update public.entitlements
  set attempts_used = attempts_used + 1
  where id = p_entitlement_id;
end;
$$ language plpgsql security definer;
