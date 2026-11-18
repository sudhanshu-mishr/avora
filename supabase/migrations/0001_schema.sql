create extension if not exists "pgcrypto";
create extension if not exists vector;

-- ---------- enums ----------
do $$ begin
  create type public.visibility as enum ('public','unlisted','private');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.idea_status as enum ('draft','open','in_development','prototype','shipped','archived','closed');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.project_status as enum ('planning','recruiting','in_progress','prototype','testing','completed','launched','paused','archived');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.task_status as enum ('todo','in_progress','blocked','done');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.task_priority as enum ('low','medium','high','urgent');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.member_role as enum ('owner','admin','contributor','viewer');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.community_role as enum ('owner','moderator','member');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.conversation_type as enum ('direct','project');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.notification_type as enum ('follow','unfollow','comment','reply','invitation',
    'invitation_accepted','project_update','task_assigned','mention','message','community','system');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.invitation_type as enum ('project','idea','community');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.invitation_status as enum ('pending','accepted','declined','revoked','expired');
exception when duplicate_object then null; end $$;

-- ---------- updated_at helper ----------
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end; $$;

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null default '',
  bio text default '' not null,
  location text default '',
  avatar_url text,
  cover_url text,
  website text,
  is_public boolean not null default true,
  collaboration_available boolean not null default true,
  intentions public.intentions[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
do $$ begin
  create type public.intentions as enum ('discover_ideas','share_ideas','find_collaborators',
    'build_projects','learn','find_mentors','launch_products','discover_opportunities');
exception when duplicate_object then null; end $$;
-- (intentions array relies on the enum above; re-apply if created later)
alter table public.profiles drop column if exists intentions;
alter table public.profiles add column intentions public.intentions[] not null default '{}';

create index if not exists idx_profiles_username on public.profiles (username);

-- auto-create profile on signup
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare
  base text;
begin
  base := coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email,'user'),'@',1));
  insert into public.profiles (id, username, display_name)
  values (new.id, 'u_' || substr(md5(new.id::text), 1, 10), coalesce(base, 'AVORA user'))
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- unique-ish username guard (if two clash, suffix)
create or replace function public.ensure_unique_username() returns trigger language plpgsql as $$
begin
  if exists (select 1 from public.profiles where username = new.username and id <> new.id) then
    new.username := new.username || '_' || substr(md5(new.id::text), 1, 6);
  end if;
  return new;
end; $$;
drop trigger if exists trg_unique_username on public.profiles;
create trigger trg_unique_username before insert or update of username on public.profiles
for each row execute function public.ensure_unique_username();

create trigger touch_profiles before update on public.profiles for each row execute function public.touch_updated_at();

-- ---------- skills ----------
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text default ''
);
create table if not exists public.user_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  level int not null default 3 check (level between 1 and 5),
  self_reported boolean not null default true,
  evidence_refs jsonb not null default '[]',
  endorsements int not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, skill_id)
);
create table if not exists public.skill_evidence (
  id uuid primary key default gen_random_uuid(),
  user_skill_id uuid not null references public.user_skills(id) on delete cascade,
  kind text not null default 'link',       -- link | project | certificate | challenge | peer
  url text,
  project_id uuid,
  note text,
  created_at timestamptz not null default now()
);
create index idx_user_skills_user on public.user_skills (user_id);

-- ---------- ideas ----------
create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  problem_statement text not null default '',
  proposed_solution text not null default '',
  category public.category not null default 'Other',
  tags text[] not null default '{}',
  required_skills text[] not null default '{}',
  collaborators_needed text not null default '',
  visibility public.visibility not null default 'public',
  status public.idea_status not null default 'open',
  cover_url text,
  images jsonb not null default '[]',
  content_embedding vector(768),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
do $$ begin
  create type public.category as enum ('AI','Software','Hardware','Robotics','Science','Healthcare',
    'Education','Environment','Energy','Business','Social Innovation','Design','Engineering',
    'Agriculture','Other');
exception when duplicate_object then null; end $$;
-- category enum must exist before column; if created after, rebuild column
alter table public.ideas drop column if exists category;
alter table public.ideas add column category public.category not null default 'Other';

create table if not exists public.idea_tags (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  tag text not null,
  unique (idea_id, tag)
);
create table if not exists public.idea_contributors (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'contributor',
  invited_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (idea_id, user_id)
);
create table if not exists public.idea_comments (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.idea_comments(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.idea_versions (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  summary text not null default '',
  snapshot jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create table if not exists public.idea_links (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  project_id uuid,
  kind text not null default 'project',   -- project | demo | research
  label text,
  created_at timestamptz not null default now()
);
create index idx_ideas_owner on public.ideas (owner_id);
create index idx_ideas_created on public.ideas (created_at desc) where deleted_at is null;
create index idx_ideas_category on public.ideas (category) where deleted_at is null;
create index idx_ideas_embedding on public.ideas using ivfflat (content_embedding vector_cosine_ops);
create trigger touch_ideas before update on public.ideas for each row execute function public.touch_updated_at();

-- ---------- projects ----------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  idea_id uuid references public.ideas(id) on delete set null,
  name text not null,
  description text not null default '',
  category public.category not null default 'Other',
  cover_url text,
  required_skills text[] not null default '{}',
  visibility public.visibility not null default 'unlisted',
  status public.project_status not null default 'planning',
  progress int not null default 0 check (progress between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.member_role not null default 'contributor',
  contribution_score int not null default 0,
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);
create table if not exists public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text not null default '',
  assignee_id uuid references public.profiles(id) on delete set null,
  milestone_id uuid,
  status public.task_status not null default 'todo',
  priority public.task_priority not null default 'medium',
  due_date timestamptz,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);
create table if not exists public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  description text not null default '',
  target_date timestamptz,
  completed boolean not null default false,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.project_tasks add constraint fk_task_milestone
  foreign key (milestone_id) references public.project_milestones(id) on delete set null;
create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  uploaded_by uuid references public.profiles(id) on delete set null,
  storage_path text not null,
  file_name text not null,
  file_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);
create table if not exists public.project_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null,
  kind text not null default 'update',   -- update | announcement
  created_at timestamptz not null default now()
);
create index idx_projects_owner on public.projects (owner_id);
create index idx_pm_project on public.project_members (project_id);
create index idx_pm_user on public.project_members (user_id);
create index idx_tasks_project on public.project_tasks (project_id, sort);
create trigger touch_projects before update on public.projects for each row execute function public.touch_updated_at();
create trigger touch_tasks before update on public.project_tasks for each row execute function public.touch_updated_at();

-- ---------- posts (communities feed) ----------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  community_id uuid,
  body text not null,
  media jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'appreciate',
  created_at timestamptz not null default now(),
  unique (post_id, user_id, kind)
);

-- ---------- follows / bookmarks ----------
create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followee_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_id, followee_id),
  check (follower_id <> followee_id)
);
create index idx_follows_followee on public.follows (followee_id);
create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null,   -- idea | project | post | launch | community
  target_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);
create index idx_bookmarks_user on public.bookmarks (user_id);

-- ---------- communities ----------
create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  slug text unique not null,
  name text not null,
  description text not null default '',
  category public.category not null default 'Other',
  cover_url text,
  is_private boolean not null default false,
  requires_approval boolean not null default false,
  rules text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create table if not exists public.community_members (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.community_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (community_id, user_id)
);
create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default '',
  body text not null,
  created_at timestamptz not null default now()
);
create index idx_communities_slug on public.communities (slug);
create index idx_cm_community on public.community_members (community_id);

-- ---------- messaging ----------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  type public.conversation_type not null default 'direct',
  project_id uuid references public.projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.conversation_members (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_read timestamptz,
  unique (conversation_id, user_id)
);
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  attachments jsonb not null default '[]',
  created_at timestamptz not null default now()
);
create index idx_messages_conv on public.messages (conversation_id, created_at);
create trigger touch_convs before update on public.conversations for each row execute function public.touch_updated_at();

-- ---------- notifications ----------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.notification_type not null,
  actor_id uuid references public.profiles(id) on delete set null,
  meta jsonb not null default '{}',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_notifications_user on public.notifications (user_id, created_at desc);

-- ---------- collaboration invitations ----------
create table if not exists public.collaboration_invitations (
  id uuid primary key default gen_random_uuid(),
  type public.invitation_type not null,
  target_id uuid not null,
  invited_by uuid not null references public.profiles(id) on delete cascade,
  invited_user uuid not null references public.profiles(id) on delete cascade,
  role public.member_role not null default 'contributor',
  note text not null default '',
  status public.invitation_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_invites_user on public.collaboration_invitations (invited_user, status);

-- ---------- learning ----------
create table if not exists public.learning_paths (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  goal text not null,
  summary text not null default '',
  skills text[] not null default '{}',
  stages jsonb not null default '[]',
  progress int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.learning_steps (
  id uuid primary key default gen_random_uuid(),
  path_id uuid not null references public.learning_paths(id) on delete cascade,
  title text not null,
  description text not null default '',
  kind text not null default 'exercise',   -- exercise | resource | milestone | assessment
  completed boolean not null default false,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create trigger touch_paths before update on public.learning_paths for each row execute function public.touch_updated_at();

-- ---------- achievements ----------
create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null default '',
  icon text
);
create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique (user_id, achievement_id)
);

-- ---------- launches ----------
create table if not exists public.launches (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  product_name text not null,
  description text not null default '',
  screenshots jsonb not null default '[]',
  demo_video_url text,
  website text,
  team jsonb not null default '[]',
  technologies text[] not null default '{}',
  development_story text not null default '',
  status text not null default 'live',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger touch_launches before update on public.launches for each row execute function public.touch_updated_at();

-- ---------- reputation (extensible, NOT follower-based) ----------
create table if not exists public.user_reputation (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references public.profiles(id) on delete cascade,
  completed_projects int not null default 0,
  meaningful_contributions int not null default 0,
  verified_achievements int not null default 0,
  peer_feedback_score int not null default 0,
  consistency int not null default 0,
  community_contribution int not null default 0,
  updated_at timestamptz not null default now()
);

-- ---------- AI usage / audit ----------
create table if not exists public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  requests int not null default 0,
  tokens int not null default 0,
  window_start timestamptz not null default now(),
  unique (user_id)
);
create table if not exists public.ai_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  context_type text,
  context_id uuid,
  prompt text,
  response text,
  model text,
  tokens int,
  created_at timestamptz not null default now()
);

-- ---------- moderation ----------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null,
  target_id uuid not null,
  reason text not null,
  details text,
  status text not null default 'open',   -- open | reviewed | actioned | dismissed
  created_at timestamptz not null default now()
);
create table if not exists public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  moderator_id uuid not null references public.profiles(id) on delete cascade,
  report_id uuid references public.reports(id) on delete set null,
  action text not null,
  note text,
  created_at timestamptz not null default now()
);

-- ---------- predicate helpers (used by RLS) ----------
create or replace function public.is_project_member(p_project uuid, p_roles public.member_role[] default null)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.project_members pm
    where pm.project_id = p_project and pm.user_id = auth.uid()
      and (p_roles is null or pm.role = any(p_roles))
  );
$$;

create or replace function public.can_manage_project(p_project uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_project_member(p_project, array['owner','admin']::public.member_role[]);
$$;

create or replace function public.can_view_idea(p_idea uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.ideas i
    where i.id = p_idea and i.deleted_at is null
      and (
        i.visibility = 'public'
        or (i.visibility = 'unlisted' and auth.uid() is not null)
        or i.owner_id = auth.uid()
        or exists (select 1 from public.idea_contributors ic where ic.idea_id = p_idea and ic.user_id = auth.uid())
      )
  );
$$;

create or replace function public.can_edit_idea(p_idea uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.ideas i
    where i.id = p_idea and (i.owner_id = auth.uid())
  );
$$;

create or replace function public.can_view_project(p_project uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.projects p
    where p.id = p_project and p.deleted_at is null
      and (
        p.visibility = 'public'
        or (p.visibility = 'unlisted' and public.is_project_member(p_project))
        or public.is_project_member(p_project)
      )
  );
$$;

create or replace function public.is_community_member(p_community uuid, p_roles public.community_role[] default null)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.community_members cm
    where cm.community_id = p_community and cm.user_id = auth.uid()
      and (p_roles is null or cm.role = any(p_roles))
  );
$$;

create or replace function public.can_view_community(p_community uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.communities c
    where c.id = p_community and c.deleted_at is null
      and (c.is_private = false or public.is_community_member(p_community))
  );
$$;

create or replace function public.is_conversation_member(p_conv uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = p_conv and cm.user_id = auth.uid()
  );
$$;