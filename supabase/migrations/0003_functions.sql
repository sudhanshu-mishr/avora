-- SECURITY DEFINER actions. Each validates auth.uid() and relevant role/visibility.
-- These are the only sanctioned writers for cross-user rows (notifications, invites, etc.).

create or replace function public.create_notification(
  p_target uuid, p_type public.notification_type, p_actor uuid, p_meta jsonb default '{}'
) returns void language plpgsql security definer set search_path = public as $$
begin
  if p_target is null or p_target = auth.uid() then return; end if;
  insert into public.notifications (user_id, type, actor_id, meta)
  values (p_target, p_type, p_actor, coalesce(p_meta, '{}'));
end; $$;

create or replace function public.toggle_follow(p_followee uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_exists boolean;
  v_following boolean;
begin
  if v_me is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if p_followee = v_me then raise exception 'cannot_follow_self'; end if;
  select exists(select 1 from public.profiles where id = p_followee) into v_exists;
  if not v_exists then raise exception 'user_not_found'; end if;
  select exists(select 1 from public.follows where follower_id = v_me and followee_id = p_followee) into v_following;
  if v_following then
    delete from public.follows where follower_id = v_me and followee_id = p_followee;
    perform public.create_notification(p_followee, 'unfollowed', v_me);
    return false;
  else
    insert into public.follows (follower_id, followee_id) values (v_me, p_followee);
    perform public.create_notification(p_followee, 'followed', v_me);
    return true;
  end if;
end; $$;

create or replace function public.toggle_bookmark(p_target_type text, p_target_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_exists boolean;
begin
  if v_me is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  select exists(select 1 from public.bookmarks where user_id = v_me and target_type = p_target_type and target_id = p_target_id) into v_exists;
  if v_exists then
    delete from public.bookmarks where user_id = v_me and target_type = p_target_type and target_id = p_target_id;
    return false;
  else
    insert into public.bookmarks (user_id, target_type, target_id) values (v_me, p_target_type, p_target_id);
    return true;
  end if;
end; $$;

create or replace function public.create_idea(
  p_title text, p_problem text, p_solution text, p_category public.category,
  p_tags text[], p_skills text[], p_collaborators text,
  p_visibility public.visibility, p_status public.idea_status
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_id uuid;
begin
  if v_me is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if coalesce(trim(p_title),'') = '' then raise exception 'title_required'; end if;
  if not public.is_valid_category(p_category::text) then raise exception 'bad_category'; end if;
  insert into public.ideas (
    owner_id, title, problem_statement, proposed_solution, category,
    tags, required_skills, collaborators_needed, visibility, status
  ) values (
    v_me, trim(p_title), coalesce(p_problem,''), coalesce(p_solution,''),
    coalesce(p_category,'Other'), coalesce(p_tags,'{}'), coalesce(p_skills,'{}'),
    coalesce(p_collaborators,''), coalesce(p_visibility,'public'), coalesce(p_status,'open')
  ) returning id into v_id;
  insert into public.idea_tags (idea_id, tag)
  select v_id, unnest(coalesce(p_tags,'{}'));
  return v_id;
end; $$;

create or replace function public.update_idea(
  p_id uuid, p_title text default null, p_problem text default null, p_solution text default null,
  p_category public.category default null, p_tags text[] default null, p_skills text[] default null,
  p_collaborators text default null, p_visibility public.visibility default null,
  p_status public.idea_status default null, p_cover_url text default null
) returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.can_edit_idea(p_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.ideas set
    title = coalesce(p_title, title),
    problem_statement = coalesce(p_problem, problem_statement),
    proposed_solution = coalesce(p_solution, proposed_solution),
    category = coalesce(p_category, category),
    tags = coalesce(p_tags, tags),
    required_skills = coalesce(p_skills, required_skills),
    collaborators_needed = coalesce(p_collaborators, collaborators_needed),
    visibility = coalesce(p_visibility, visibility),
    status = coalesce(p_status, status),
    cover_url = coalesce(p_cover_url, cover_url)
  where id = p_id;
  if p_tags is not null then
    delete from public.idea_tags where idea_id = p_id;
    insert into public.idea_tags (idea_id, tag) select p_id, unnest(p_tags);
  end if;
  insert into public.idea_versions (idea_id, author_id, summary, snapshot)
  values (p_id, auth.uid(), 'edited',
    jsonb_build_object('title', coalesce(p_title,''), 'status', coalesce(p_status,'')));
end; $$;

create or replace function public.delete_idea(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.can_edit_idea(p_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.ideas set deleted_at = now() where id = p_id;
end; $$;

create or replace function public.add_idea_comment(p_idea_id uuid, p_parent_id uuid, p_body text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_id uuid;
  v_owner uuid;
  v_parent_author uuid;
begin
  if v_me is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if coalesce(trim(p_body),'') = '' then raise exception 'comment_required'; end if;
  if not public.can_view_idea(p_idea_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select owner_id into v_owner from public.ideas where id = p_idea_id;
  if p_parent_id is not null then
    select author_id into v_parent_author from public.idea_comments where id = p_parent_id;
  end if;
  insert into public.idea_comments (idea_id, author_id, parent_id, body)
  values (p_idea_id, v_me, p_parent_id, trim(p_body)) returning id into v_id;
  if p_parent_id is null then
    perform public.create_notification(v_owner, 'comment', v_me,
      jsonb_build_object('idea_id', p_idea_id, 'comment_id', v_id));
  else
    perform public.create_notification(v_parent_author, 'reply', v_me,
      jsonb_build_object('idea_id', p_idea_id, 'comment_id', v_id));
    perform public.create_notification(v_owner, 'comment', v_me,
      jsonb_build_object('idea_id', p_idea_id, 'comment_id', v_id));
  end if;
  return v_id;
end; $$;

create or replace function public.create_project(
  p_name text, p_description text, p_category public.category, p_idea_id uuid,
  p_skills text[], p_visibility public.visibility
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_id uuid;
begin
  if v_me is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if coalesce(trim(p_name),'') = '' then raise exception 'name_required'; end if;
  insert into public.projects (
    owner_id, name, description, category, idea_id, required_skills, visibility
  ) values (
    v_me, trim(p_name), coalesce(p_description,''), coalesce(p_category,'Other'),
    p_idea_id, coalesce(p_skills,'{}'), coalesce(p_visibility,'unlisted')
  ) returning id into v_id;
  insert into public.project_members (project_id, user_id, role)
  values (v_id, v_me, 'owner');
  return v_id;
end; $$;

create or replace function public.project_invite(
  p_project_id uuid, p_user_id uuid, p_role public.member_role, p_note text
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_id uuid;
begin
  if v_me is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if not public.can_manage_project(p_project_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_user_id = v_me then raise exception 'invite_self'; end if;
  insert into public.collaboration_invitations
    (type, target_id, invited_by, invited_user, role, note)
  values ('project', p_project_id, v_me, p_user_id, coalesce(p_role,'contributor'), coalesce(p_note,''))
  returning id into v_id;
  perform public.create_notification(p_user_id, 'invitation', v_me,
    jsonb_build_object('type','project','target_id',p_project_id,'invited_by',v_me));
  return v_id;
end; $$;

create or replace function public.accept_invitation(p_invitation_id uuid, p_accept boolean default true)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_type public.invitation_type;
  v_target uuid;
  v_by uuid;
  v_role public.member_role;
begin
  if v_me is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if not exists (select 1 from public.collaboration_invitations where id = p_invitation_id and invited_user = v_me) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select type, target_id, invited_by, role into v_type, v_target, v_by, v_role
    from public.collaboration_invitations where id = p_invitation_id;

  if p_accept then
    update public.collaboration_invitations set status = 'accepted' where id = p_invitation_id;
    if v_type = 'project' then
      insert into public.project_members (project_id, user_id, role)
      values (v_target, v_me, coalesce(v_role,'contributor'))
      on conflict (project_id, user_id) do nothing;
      perform public.create_notification(v_by, 'invitation_accepted', v_me,
        jsonb_build_object('type','project','target_id',v_target));
    elsif v_type = 'idea' then
      insert into public.idea_contributors (idea_id, user_id, invited_by)
      values (v_target, v_me, v_by) on conflict (idea_id, user_id) do nothing;
    elsif v_type = 'community' then
      insert into public.community_members (community_id, user_id, role)
      values (v_target, v_me, 'member') on conflict (community_id, user_id) do nothing;
    end if;
  else
    update public.collaboration_invitations set status = 'declined' where id = p_invitation_id;
  end if;
end; $$;

create or replace function public.create_task(
  p_project_id uuid, p_title text, p_description text, p_assignee uuid,
  p_milestone uuid, p_priority public.task_priority, p_due timestamptz
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_id uuid;
begin
  if v_me is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if not public.is_project_member(p_project_id, array['owner','admin','contributor']::public.member_role[]) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if coalesce(trim(p_title),'') = '' then raise exception 'title_required'; end if;
  insert into public.project_tasks (
    project_id, title, description, assignee_id, milestone_id, priority, due_date
  ) values (
    p_project_id, trim(p_title), coalesce(p_description,''), p_assignee,
    p_milestone, coalesce(p_priority,'medium'), p_due
  ) returning id into v_id;
  if p_assignee is not null then
    perform public.create_notification(p_assignee, 'task_assigned', v_me,
      jsonb_build_object('project_id',p_project_id,'task_id',v_id));
  end if;
  return v_id;
end; $$;

create or replace function public.update_task(
  p_task_id uuid, p_title text default null, p_assignee uuid default null,
  p_milestone uuid default null, p_priority public.task_priority default null, p_due timestamptz default null
) returns void language plpgsql security definer set search_path = public as $$
declare
  v_project uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  select project_id into v_project from public.project_tasks where id = p_task_id;
  if not public.is_project_member(v_project, array['owner','admin','contributor']::public.member_role[]) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.project_tasks set
    title = coalesce(p_title, title),
    assignee_id = coalesce(p_assignee, assignee_id),
    milestone_id = coalesce(p_milestone, milestone_id),
    priority = coalesce(p_priority, priority),
    due_date = coalesce(p_due, due_date)
  where id = p_task_id;
end; $$;

create or replace function public.toggle_task(p_task_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_project uuid;
  v_status public.task_status;
begin
  if auth.uid() is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  select project_id, status into v_project, v_status from public.project_tasks where id = p_task_id;
  if not public.is_project_member(v_project, array['owner','admin','contributor']::public.member_role[]) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.project_tasks set
    status = case when v_status = 'done' then 'todo' else 'done' end,
    completed_at = case when v_status = 'done' then null else now() end
  where id = p_task_id;
end; $$;

create or replace function public.add_milestone(
  p_project_id uuid, p_name text, p_description text, p_target timestamptz
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_id uuid;
begin
  if v_me is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if not public.is_project_member(p_project_id, array['owner','admin','contributor']::public.member_role[]) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  insert into public.project_milestones (project_id, name, description, target_date)
  values (p_project_id, trim(p_name), coalesce(p_description,''), p_target)
  returning id into v_id;
  return v_id;
end; $$;

create or replace function public.create_community(
  p_name text, p_slug text, p_description text, p_category public.category,
  p_is_private boolean, p_rules text
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_id uuid;
begin
  if v_me is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if coalesce(trim(p_name),'') = '' then raise exception 'name_required'; end if;
  insert into public.communities (owner_id, slug, name, description, category, is_private, rules)
  values (v_me, lower(trim(p_slug)), trim(p_name), coalesce(p_description,''),
    coalesce(p_category,'Other'), coalesce(p_is_private,false), coalesce(p_rules,''))
  returning id into v_id;
  insert into public.community_members (community_id, user_id, role) values (v_id, v_me, 'owner');
  return v_id;
end; $$;

create or replace function public.join_community(p_community_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if not public.can_view_community(p_community_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  insert into public.community_members (community_id, user_id, role)
  values (p_community_id, auth.uid(), 'member')
  on conflict (community_id, user_id) do nothing;
end; $$;

create or replace function public.start_direct_conversation(p_member uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_id uuid;
begin
  if v_me is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if p_member = v_me then raise exception 'self_message'; end if;
  insert into public.conversations (type) values ('direct') returning id into v_id;
  insert into public.conversation_members (conversation_id, user_id) values (v_id, v_me), (v_id, p_member);
  perform public.create_notification(p_member, 'message', v_me,
    jsonb_build_object('conversation_id', v_id));
  return v_id;
end; $$;

create or replace function public.send_message(p_conversation_id uuid, p_body text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_id uuid;
  v_other uuid;
begin
  if v_me is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if not public.is_conversation_member(p_conversation_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if coalesce(trim(p_body),'') = '' then raise exception 'message_required'; end if;
  insert into public.messages (conversation_id, sender_id, body)
  values (p_conversation_id, v_me, trim(p_body)) returning id into v_id;
  update public.conversations set updated_at = now() where id = p_conversation_id;
  update public.conversation_members set last_read = now()
    where conversation_id = p_conversation_id and user_id = v_me;
  select user_id into v_other from public.conversation_members
    where conversation_id = p_conversation_id and user_id <> v_me limit 1;
  if v_other is not null then
    perform public.create_notification(v_other, 'message', v_me,
      jsonb_build_object('conversation_id', p_conversation_id));
  end if;
  return v_id;
end; $$;