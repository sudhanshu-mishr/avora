import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { timeAgo } from '@/lib/utils';
import ProjectActions from '@/features/projects/ProjectActions';
import TaskBoard from '@/features/projects/TaskBoard';
import MembersPanel from '@/features/projects/MembersPanel';

export const dynamic = 'force-dynamic';
export default async function ProjectPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: project } = await supabase.from('projects')
    .select('*, owner:profiles(display_name,username)').eq('id', params.id).single();
  if (!project) notFound();

  const { data: member } = await supabase.from('project_members')
    .select('role').eq('project_id', params.id).eq('user_id', user.id).single();
  const { data: members } = await supabase.from('project_members')
    .select('role, user:profiles(id,display_name,username,avatar_url)').eq('project_id', params.id);
  const { data: milestones } = await supabase.from('project_milestones')
    .select('*').eq('project_id', params.id).order('sort');
  const { data: tasks } = await supabase.from('project_tasks')
    .select('id,title,description,status,priority,due_date,assignee:profiles(display_name,avatar_url),milestone_id')
    .eq('project_id', params.id).order('sort');
  const { data: updates } = await supabase.from('project_updates')
    .select('id,body,kind,created_at,author:profiles(display_name)').eq('project_id', params.id).order('created_at', { ascending: false }).limit(20);

  const isManager = member?.role === 'owner' || member?.role === 'admin';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{project.category}</Badge>
          <Badge className="text-accent">{project.status.replace('_', ' ')}</Badge>
          <span className="muted text-xs">by {project.owner?.display_name}</span>
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{project.name}</h1>
        <p className="muted mt-2 whitespace-pre-wrap">{project.description}</p>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-panel">
            <div className="h-full rounded-full bg-accent" style={{ width: `${project.progress}%` }} />
          </div>
          <span className="muted text-sm">{project.progress}%</span>
        </div>
      </div>

      <ProjectActions projectId={params.id} isManager={isManager} status={project.status} progress={project.progress} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TaskBoard projectId={params.id} tasks={tasks} milestones={milestones} isManager={isManager} />
        </div>
        <div className="flex flex-col gap-6">
          <MembersPanel projectId={params.id} members={members} isManager={isManager} />
          <div className="rounded-lg surface p-5">
            <h2 className="font-medium text-ink">Activity</h2>
            {(updates?.length ?? 0) === 0 ? <p className="muted mt-2 text-sm">No updates yet.</p> : (
              <ul className="mt-3 flex flex-col gap-3">
                {updates.map((u: any) => (
                  <li key={u.id} className="text-sm">
                    <span className="font-medium">{u.author?.display_name}</span>
                    <span className="muted"> · {timeAgo(u.created_at)}</span>
                    <p className="mt-0.5 text-ink">{u.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}