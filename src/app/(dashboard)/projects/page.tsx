import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { timeAgo } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Projects — AVORA' };

export default async function ProjectsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Projects I'm a member of (RLS-enforced)
  const { data: members } = await supabase.from('project_members').select('project_id,role').eq('user_id', user.id);
  const ids = (members ?? []).map((m: any) => m.project_id);
  const { data: projects } = ids.length
    ? await supabase.from('projects').select('id,name,category,status,progress,created_at,owner:profiles(display_name)').in('id', ids).is('deleted_at', null).order('updated_at', { ascending: false }).limit(50)
    : { data: [] };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <Button size="sm"><Link href="/projects/new">New project</Link></Button>
      </div>
      {(projects ?? []).length === 0 ? (
        <EmptyState title="No projects yet" hint="Start from an idea or create one independently."
          action={<Button size="sm"><Link href="/projects/new">Create project</Link></Button>} />
      ) : (
        <div className="flex flex-col gap-3">
          {projects.map((p: any) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="rounded-lg surface p-4 transition-colors hover:bg-panel">
              <div className="flex items-center gap-2">
                <Badge>{p.category}</Badge>
                <Badge className="text-accent">{p.status.replace('_', ' ')}</Badge>
                <span className="muted ml-auto text-xs">{timeAgo(p.created_at)}</span>
              </div>
              <h3 className="mt-2 font-medium text-ink">{p.name}</h3>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-panel">
                <div className="h-full rounded-full bg-accent" style={{ width: `${p.progress}%` }} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}