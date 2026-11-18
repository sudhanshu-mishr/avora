-- Row Level Security. Enabled on every user-owned / sensitive table.
alter table public.profiles enable row level security;
alter table public.skills enable row level security;
alter table public.user_skills enable row level security;
alter table public.skill_evidence enable row level security;
alter table public.ideas enable row level security;
alter table public.idea_tags enable row level security;
alter table public.idea_contributors enable row level security;
alter table public.idea_comments enable row level security;
alter table public.idea_versions enable row level security;
alter table public.idea_links enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_tasks enable row level security;
alter table public.project_milestones enable row level security;
alter table public.project_files enable row level security;
alter table public.project_updates enable row level security;
alter table public.posts enable row level security;
alter table public.post_comments enable row level security;
alter table public.post_reactions enable row level security;
alter table public.follows enable row level security;
alter table public.bookmarks enable row level security;
alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.community_posts enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.collaboration_invitations enable row level security;
alter table public.learning_paths enable row level security;
alter table public.learning_steps enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.launches enable row level security;
alter table public.user_reputation enable row level security;
alter table public.ai_usage enable row level security;
alter table public.ai_interactions enable row level security;
alter table public.reports enable row level security;
alter table public.moderation_actions enable row level security;

-- ============ profiles ============
create policy "profiles self" on public.profiles for select
  using (is_public = true or id = auth.uid() or public.is_project_member((select null::uuid), null) = false and false);
drop policy "profiles self" on public.profiles;
create policy "profiles select" on public.profiles for select
  using (is_public = true or id = auth.uid());
create policy "profiles insert self" on public.profiles for insert with check (id = auth.uid());
create policy "profiles update self" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles delete self" on public.profiles for delete using (id = auth.uid());

-- ============ skills (reference) ============
create policy "skills public read" on public.skills for select using (true);
create policy "skills insert auth" on public.skills for insert with check (auth.uid() is not null);
create policy "skills update auth" on public.skills for update using (auth.uid() is not null);
create policy "skills delete auth" on public.skills for delete using (auth.uid() is not null);

-- ============ user_skills ============
create policy "uskills select" on public.user_skills for select
  using (user_id = auth.uid());
create policy "uskills insert self" on public.user_skills for insert with check (user_id = auth.uid());
create policy "uskills update self" on public.user_skills for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "uskills delete self" on public.user_skills for delete using (user_id = auth.uid());

-- ============ skill_evidence ============
create policy "sev select" on public.skill_evidence for select
  using (exists (select 1 from public.user_skills u where u.id = user_skill_id and u.user_id = auth.uid()));
create policy "sev insert" on public.skill_evidence for insert
  with check (exists (select 1 from public.user_skills u where u.id = user_skill_id and u.user_id = auth.uid()));
create policy "sev update" on public.skill_evidence for update
  using (exists (select 1 from public.user_skills u where u.id = user_skill_id and u.user_id = auth.uid()));
create policy "sev delete" on public.skill_evidence for delete
  using (exists (select 1 from public.user_skills u where u.id = user_skill_id and u.user_id = auth.uid()));

-- ============ ideas ============
create policy "ideas select" on public.ideas for select using (public.can_view_idea(id));
create policy "ideas insert" on public.ideas for insert with check (owner_id = auth.uid());
create policy "ideas update" on public.ideas for update
  using (public.can_edit_idea(id)) with check (owner_id = auth.uid());
create policy "ideas delete" on public.ideas for delete using (owner_id = auth.uid());

create policy "idea_tags select" on public.idea_tags for select
  using (public.can_view_idea(idea_id));
create policy "idea_tags write" on public.idea_tags for all
  using (public.can_edit_idea(idea_id)) with check (public.can_edit_idea(idea_id));

create policy "idea_contributors select" on public.idea_contributors for select
  using (public.can_view_idea(idea_id));
create policy "idea_contributors write" on public.idea_contributors for all
  using (public.can_edit_idea(idea_id)) with check (true);

create policy "idea_comments select" on public.idea_comments for select
  using (public.can_view_idea(idea_id));
create policy "idea_comments insert" on public.idea_comments for insert
  with check (author_id = auth.uid() and public.can_view_idea(idea_id));
create policy "idea_comments update" on public.idea_comments for update
  using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "idea_comments delete" on public.idea_comments for delete
  using (author_id = auth.uid());

create policy "idea_versions select" on public.idea_versions for select
  using (public.can_view_idea(idea_id));
create policy "idea_versions write" on public.idea_versions for all
  using (public.can_view_idea(idea_id)) with check (public.can_view_idea(idea_id));

create policy "idea_links select" on public.idea_links for select
  using (public.can_view_idea(idea_id));
create policy "idea_links write" on public.idea_links for all
  using (public.can_edit_idea(idea_id)) with check (public.can_edit_idea(idea_id));

-- ============ projects ============
create policy "projects select" on public.projects for select using (public.can_view_project(id));
create policy "projects insert" on public.projects for insert with check (owner_id = auth.uid());
create policy "projects update" on public.projects for update
  using (public.can_manage_project(id)) with check (owner_id = auth.uid());
create policy "projects delete" on public.projects for delete using (owner_id = auth.uid());

create policy "pmembers select" on public.project_members for select
  using (public.is_project_member(project_id));
create policy "pmembers insert" on public.project_members for insert
  with check (public.can_manage_project(project_id));
create policy "pmembers update" on public.project_members for update
  using (public.can_manage_project(project_id)) with check (public.is_project_member(project_id));
create policy "pmembers delete" on public.project_members for delete
  using (public.can_manage_project(project_id));

create policy "tasks select" on public.project_tasks for select
  using (public.is_project_member(project_id));
create policy "tasks insert" on public.project_tasks for insert
  with check (public.is_project_member(project_id, array['owner','admin','contributor']::public.member_role[]));
create policy "tasks update" on public.project_tasks for update
  using (public.is_project_member(project_id, array['owner','admin','contributor']::public.member_role[]))
  with check (public.is_project_member(project_id, array['owner','admin','contributor']::public.member_role[]));
create policy "tasks delete" on public.project_tasks for delete
  using (public.is_project_member(project_id, array['owner','admin']::public.member_role[]));

create policy "milestones select" on public.project_milestones for select
  using (public.is_project_member(project_id));
create policy "milestones write" on public.project_milestones for all
  using (public.is_project_member(project_id, array['owner','admin','contributor']::public.member_role[]))
  with check (public.is_project_member(project_id, array['owner','admin','contributor']::public.member_role[]));

create policy "pfiles select" on public.project_files for select
  using (public.is_project_member(project_id));
create policy "pfiles insert" on public.project_files for insert
  with check (public.is_project_member(project_id, array['owner','admin','contributor']::public.member_role[]));
create policy "pfiles delete" on public.project_files for delete
  using (public.is_project_member(project_id, array['owner','admin','contributor']::public.member_role[]));

create policy "pupdates select" on public.project_updates for select
  using (public.is_project_member(project_id));
create policy "pupdates insert" on public.project_updates for insert
  with check (author_id = auth.uid() and public.is_project_member(project_id));

-- ============ posts ============
create policy "posts select" on public.posts for select using (true);
create policy "posts insert" on public.posts for insert with check (author_id = auth.uid());
create policy "posts update" on public.posts for update
  using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "posts delete" on public.posts for delete using (author_id = auth.uid());
create policy "post_comments select" on public.post_comments for select using (true);
create policy "post_comments insert" on public.post_comments for insert with check (author_id = auth.uid());
create policy "post_reactions select" on public.post_reactions for select using (true);
create policy "post_reactions insert" on public.post_reactions for insert with check (user_id = auth.uid());
create policy "post_reactions delete" on public.post_reactions for delete using (user_id = auth.uid());

-- ============ follows / bookmarks ============
create policy "follows select" on public.follows for select
  using (follower_id = auth.uid() or followee_id = auth.uid());
create policy "follows insert" on public.follows for insert with check (follower_id = auth.uid());
create policy "follows delete" on public.follows for delete using (follower_id = auth.uid());
create policy "bookmarks select" on public.bookmarks for select using (user_id = auth.uid());
create policy "bookmarks insert" on public.bookmarks for insert with check (user_id = auth.uid());
create policy "bookmarks delete" on public.bookmarks for delete using (user_id = auth.uid());

-- ============ communities ============
create policy "communities select" on public.communities for select using (public.can_view_community(id));
create policy "communities insert" on public.communities for insert with check (owner_id = auth.uid());
create policy "communities update" on public.communities for update
  using (public.is_community_member(id, array['owner','moderator']::public.community_role[]))
  with check (owner_id = auth.uid());
create policy "communities delete" on public.communities for delete using (owner_id = auth.uid());
create policy "cmembers select" on public.community_members for select
  using (public.is_community_member(community_id));
create policy "cmembers insert" on public.community_members for insert
  with check (user_id = auth.uid() and public.can_view_community(community_id));
create policy "cmembers delete" on public.community_members for delete
  using (user_id = auth.uid());
create policy "cmembers promote" on public.community_members for update
  using (public.is_community_member(community_id, array['owner','moderator']::public.community_role[]))
  with check (public.is_community_member(community_id));
create policy "cposts select" on public.community_posts for select
  using (public.is_community_member(community_id));
create policy "cposts insert" on public.community_posts for insert
  with check (author_id = auth.uid() and public.is_community_member(community_id));
create policy "cposts delete" on public.community_posts for delete
  using (author_id = auth.uid() or public.is_community_member(community_id, array['owner','moderator']::public.community_role[]));

-- ============ messaging ============
create policy "convs select" on public.conversations for select using (public.is_conversation_member(id));
create policy "convs insert" on public.conversations for insert with check (auth.uid() is not null);
create policy "conv_members select" on public.conversation_members for select
  using (public.is_conversation_member(conversation_id));
create policy "conv_members insert" on public.conversation_members for insert
  with check (user_id = auth.uid());
create policy "conv_members update" on public.conversation_members for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "messages select" on public.messages for select using (public.is_conversation_member(conversation_id));
create policy "messages insert" on public.messages for insert
  with check (sender_id = auth.uid() and public.is_conversation_member(conversation_id));

-- ============ notifications ============
create policy "notifs select" on public.notifications for select using (user_id = auth.uid());
create policy "notifs update" on public.notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifs delete" on public.notifications for delete using (user_id = auth.uid());

-- ============ invitations ============
create policy "invites select" on public.collaboration_invitations for select
  using (invited_user = auth.uid() or invited_by = auth.uid());
create policy "invites insert" on public.collaboration_invitations for insert
  with check (invited_by = auth.uid());
create policy "invites update" on public.collaboration_invitations for update
  using (invited_by = auth.uid() or invited_user = auth.uid())
  with check (invited_by = auth.uid() or invited_user = auth.uid());
create policy "invites delete" on public.collaboration_invitations for delete
  using (invited_by = auth.uid() or invited_user = auth.uid());

-- ============ learning ============
create policy "paths select" on public.learning_paths for select using (user_id = auth.uid());
create policy "paths insert" on public.learning_paths for insert with check (user_id = auth.uid());
create policy "paths update" on public.learning_paths for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "paths delete" on public.learning_paths for delete using (user_id = auth.uid());
create policy "steps select" on public.learning_steps for select
  using (exists (select 1 from public.learning_paths p where p.id = path_id and p.user_id = auth.uid()));
create policy "steps write" on public.learning_steps for all
  using (exists (select 1 from public.learning_paths p where p.id = path_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.learning_paths p where p.id = path_id and p.user_id = auth.uid()));

-- ============ achievements ============
create policy "achievements select" on public.achievements for select using (true);
create policy "achievements insert" on public.achievements for insert with check (auth.uid() is not null);
create policy "user_ach select" on public.user_achievements for select using (user_id = auth.uid());
create policy "user_ach insert" on public.user_achievements for insert with check (user_id = auth.uid());

-- ============ launches ============
create policy "launches select" on public.launches for select using (true);
create policy "launches insert" on public.launches for insert with check (owner_id = auth.uid());
create policy "launches update" on public.launches for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "launches delete" on public.launches for delete using (owner_id = auth.uid());

-- ============ reputation ============
create policy "reputation select" on public.user_reputation for select
  using (user_id = auth.uid());
create policy "reputation upsert" on public.user_reputation for insert with check (user_id = auth.uid());
create policy "reputation update" on public.user_reputation for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============ AI ============
create policy "ai_usage self" on public.ai_usage for select using (user_id = auth.uid());
create policy "ai_usage insert" on public.ai_usage for insert with check (user_id = auth.uid());
create policy "ai_usage update" on public.ai_usage for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "ai_interactions self" on public.ai_interactions for select using (user_id = auth.uid());
create policy "ai_interactions insert" on public.ai_interactions for insert with check (user_id = auth.uid());

-- ============ moderation ============
create policy "reports select" on public.reports for select using (reporter_id = auth.uid());
create policy "reports insert" on public.reports for insert with check (reporter_id = auth.uid());
create policy "mod_actions select" on public.moderation_actions for select using (moderator_id = auth.uid());
create policy "mod_actions insert" on public.moderation_actions for insert with check (moderator_id = auth.uid());