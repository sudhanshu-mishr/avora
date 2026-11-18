create or replace function public.upsert_skill(p_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if p_name is null or trim(p_name) = '' then return null; end if;
  select id into v_id from public.skills where lower(name) = lower(trim(p_name));
  if v_id is null then
    insert into public.skills (name) values (trim(p_name)) returning id into v_id;
  end if;
  return v_id;
end; $$;