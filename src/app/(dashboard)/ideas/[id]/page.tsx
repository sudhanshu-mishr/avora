import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { timeAgo } from '@/lib/utils';
import Link from 'next/link';
import IdeaComments from '@/features/ideas/IdeaComments';
import IdeaActions from '@/features/ideas/IdeaActions';
import IdeaAssistantPanel from '@/features/ai/IdeaAssistantPanel';
import IdeaEditForm from '@/features/ideas/IdeaEditForm';

export const dynamic = 'force-dynamic';
export default async function IdeaPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // RLS-enforced read: unauthorized visibility => no row => notFound
  const { data: idea } = await supabase
    .from('ideas')
    .select('*, owner:profiles(id,display_name,username,avatar_url), tags:idea_tags(tag)')
    .eq('id', params.id).single();
  if (!idea) notFound();

  const { data: contributorCount } = await supabase.from('idea_contributors').select('id').eq('idea_id', idea.id);
  const isOwner = idea.owner_id === user.id;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{idea.category}</Badge>
            <Badge>{idea.visibility}</Badge>
            <Badge>{idea.status}</Badge>
            <span className="muted text-xs">{timeAgo(idea.created_at)}</span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">{idea.title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Avatar name={idea.owner?.display_name} src={idea.owner?.avatar_url} />
        <div className="flex-1">
          <Link href={`/people/${idea.owner?.username}`} className="font-medium hover:underline">{idea.owner?.display_name}</Link>
          <p className="muted text-sm">@{idea.owner?.username}</p>
        </div>
        <IdeaActions ideaId={idea.id} ownerId={idea.owner_id} isOwner={isOwner} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section className="rounded-lg surface p-5">
            <h2 className="text-sm font-medium text-mute">Problem</h2>
            <p className="mt-2 whitespace-pre-wrap text-ink">{idea.problem_statement || '—'}</p>
          </section>
          <section className="rounded-lg surface p-5">
            <h2 className="text-sm font-medium text-mute">Proposed solution</h2>
            <p className="mt-2 whitespace-pre-wrap text-ink">{idea.proposed_solution || '—'}</p>
          </section>
          {(idea.required_skills?.length > 0 || idea.tags?.length > 0) && (
            <section className="rounded-lg surface p-5">
              <h2 className="text-sm font-medium text-mute">Skills & tags</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {idea.required_skills?.map((s: string) => <Badge key={s} className="text-accent">{s}</Badge>)}
                {idea.tags?.map((t: string) => <Badge key={t}>{t}</Badge>)}
              </div>
            </section>
          )}
          <IdeaComments ideaId={idea.id} />
        </div>

        <div className="flex flex-col gap-6">
          <IdeaAssistantPanel ideaId={idea.id} title={idea.title} category={idea.category}
            problem={idea.problem_statement} solution={idea.proposed_solution}
            tags={idea.tags} skills={idea.required_skills} />
          {isOwner && (
            <div className="rounded-lg surface p-5">
              <h2 className="mb-3 font-medium text-ink">Manage</h2>
              <IdeaEditForm idea={idea} />
            </div>
          )}
          <div className="rounded-lg surface p-5">
            <h2 className="font-medium text-ink">Collaborators</h2>
            <p className="muted mt-1 text-sm">{contributorCount?.length ?? 0} contributors</p>
            <Link href="/connect"><Button variant="outline" size="sm" className="mt-3 w-full">Find collaborators</Button></Link>
          </div>
        </div>
      </div>
    </div>
  );
}