import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CATEGORIES } from '@/lib/validation';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { timeAgo, cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Ideas — AVORA' };

export default async function IdeasPage({ searchParams }: { searchParams: { q?: string; cat?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  let query = supabase.from('ideas')
    .select('id,title,category,created_at,visibility,owner:profiles(display_name,username)')
    .is('deleted_at', null);
  // Own private ideas + all public/unlisted visible to me
  query = query.or(`owner_id.eq.${user.id},visibility.eq.public,visibility.eq.unlisted`);
  if (searchParams.q) query = query.or(`title.ilike.%${searchParams.q}%,problem_statement.ilike.%${searchParams.q}%,tags.cs.{${searchParams.q}}`);
  if (searchParams.cat) query = query.eq('category', searchParams.cat);
  const { data: ideas } = await query.order('created_at', { ascending: false }).limit(50);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Ideas</h1>
        <Button size="sm"><Link href="/ideas/new">New idea</Link></Button>
      </div>
      <form action="/ideas" className="flex gap-2">
        <input name="q" defaultValue={searchParams.q ?? ''} placeholder="Search…"
          className="h-9 flex-1 rounded-md border border-line bg-surface px-3 text-sm focus-ring" />
        <select name="cat" defaultValue={searchParams.cat ?? ''} className="h-9 rounded-md border border-line bg-surface px-2 text-sm">
          <option value="">All</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </form>
      <div className="flex flex-col gap-3">
        {(ideas ?? []).length === 0 && <EmptyState title="No ideas yet" hint="Be the first to share one."
          action={<Button size="sm"><Link href="/ideas/new">Create idea</Link></Button>} />}
        {(ideas ?? []).map((i: any) => (
          <Link key={i.id} href={`/ideas/${i.id}`} className="rounded-lg surface p-4 transition-colors hover:bg-panel">
            <div className="flex items-center gap-2">
              <Badge>{i.category}</Badge>
              <Badge className={cn(i.visibility !== 'public' && 'text-accent')}>{i.visibility}</Badge>
              <span className="muted ml-auto text-xs">{timeAgo(i.created_at)}</span>
            </div>
            <h3 className="mt-2 font-medium text-ink">{i.title}</h3>
            <p className="muted mt-1 text-sm">by {i.owner?.display_name}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}