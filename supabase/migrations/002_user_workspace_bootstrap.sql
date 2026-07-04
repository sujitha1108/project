create or replace function public.ensure_user_workspace(user_full_name text default null, user_avatar_url text default null)
returns table (
  organization_id uuid,
  organization_name text,
  organization_slug text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  existing_org public.organizations;
  base_slug text;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  insert into public.profiles (id, full_name, avatar_url)
  values (current_user_id, user_full_name, user_avatar_url)
  on conflict (id) do update
    set full_name = coalesce(public.profiles.full_name, excluded.full_name),
        avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
        updated_at = now();

  insert into public.user_preferences (user_id)
  values (current_user_id)
  on conflict (user_id) do nothing;

  select o.* into existing_org
  from public.organizations o
  join public.organization_members om on om.organization_id = o.id
  where om.user_id = current_user_id
    and o.deleted_at is null
  order by o.created_at
  limit 1;

  if existing_org.id is null then
    base_slug := 'workspace-' || replace(current_user_id::text, '-', '');

    insert into public.organizations (owner_id, name, slug)
    values (current_user_id, 'Default Workspace', base_slug)
    returning * into existing_org;

    insert into public.organization_members (organization_id, user_id, role)
    values (existing_org.id, current_user_id, 'owner')
    on conflict do nothing;
  end if;

  return query select existing_org.id, existing_org.name, existing_org.slug;
end;
$$;

grant execute on function public.ensure_user_workspace(text, text) to authenticated;
