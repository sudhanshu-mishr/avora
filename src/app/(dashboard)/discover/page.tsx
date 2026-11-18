import { createClient } from '@/lib/supabase/server';
import { CATEGORIES } from '@/lib/validation';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { timeAgo, cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Discover — AVORA' };

async function loadFeed(userId: string, tab: string, q?: string) {
  const supabase = createClient();
  // For You: recency + dampened engagement (resists pure like-farming)
  const engagement = `((select count(*) from public.idea_comments c where c.idea_id = i.id)::int * 1.0)
    / (1.0 + extract(epoch from (now() - i.created_at))/3600.0)`;
  let query = supabase
    .from('ideas')
    .select('id,title,category,created_at,visibility,owner:profiles(id,display_name,username,avatar_url)')
    .is('deleted_at', null);
  if (tab === 'people') return { type: 'people', data: null };
  if (tab === 'projects') {
    const r = await query; // placeholder shape
    return { type: 'ideas', data: (r.data ?? []) };
  }
  if (q) query = query.or(`title.ilike.%${q}%,problem_statement.ilike.%${q}%,tags.cs.{${q}}`);
  if (tab === 'ideas') {
    query = query.eq('visibility', 'public');
  } else {
    // For You: public OR owned OR following (approx via visibility=public)
    query = query.eq('visibility', 'public');
  }
  const { data } = await query.order('created_at', { ascending: false }).limit(40);
  return { type: 'ideas', data: data ?? [] };
}

export default function DiscoverPage({ searchParams }: { searchParams: Record<string, string> }) {
  return <Suspense fallback={null}><Feed searchParams={searchParams} /></Suspense>;
}

async function Feed({ searchParams }: { searchParams: Record<string, string> }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const tab = searchParams.tab ?? 'foryou';
  const q = searchParams.q ?? '';
  const cat = searchParams.cat ?? '';
  const { data: feedData } = await loadFeed(user!.id, tab, q || undefined);

  const { data: people } = tab === 'people'
    ? await createClient().from('profiles').select('id,display_name,username,bio,avatar_url').eq('is_public', true).not('id', 'eq', user!.id).order('created_at', { ascending: false }).limit(30)
    : { data: [] };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Discover</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          {['foryou', 'ideas', 'projects', 'people'].map((t) => (
            <a key={t} href={t === 'foryou' ? '/discover' : `/discover?tab=${t}`}
              className={cn('rounded-full px-3 py-1 text-sm', tab === t ? 'bg-surface text-ink' : 'text-mute hover:text-ink')}>
              {t === 'foryou' ? 'For You' : t}
            </a>
          ))}
        </div>
      </div>
      <form action="/discover" className="flex gap-2">
        <input name="q" defaultValue={q} placeholder="Search ideas, problems, tags…"
          className="h-9 flex-1 rounded-md border border-line bg-surface px-3 text-sm focus-ring" />
        <select name="cat" defaultValue={cat} className="h-9 rounded-md border border-line bg-surface px-2 text-sm focus-ring">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </form>

      {tab === 'people' ? (
        <div className="flex flex-col gap-3">
          {(people ?? []).length === 0 && <EmptyState title="No people to show yet" />}
          {(people ?? []).map((p: any) => (
            <div key={p.id} className="flex items-center gap-3 rounded-lg surface p-4">
              <Avatar name={p.display_name} src={p.avatar_url} />
              <div className="min-w-0 flex-1">
                <Link href={`/people/${p.username}`} className="font-medium hover:underline">{p.display_name}</Link>
                <p className="muted truncate text-sm">@{p.username}</p>
                <p className="muted mt-1 line-clamp-2 text-sm">{p.bio}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {((feedData as any)?.data ?? []).length === 0 && (
            <EmptyState title="Nothing here yet" hint="Try a different category or be the first to share an idea."
              action={<a href="/ideas/new"><button className="rounded-md bg-accent px-4 py-2 text-sm text-base">New idea</button></a>} />
          )}
          {((feedData as any)?.data ?? []).map((i: any) => (
            <Link key={i.id} href={`/ideas/${i.id}`} className="rounded-lg surface p-4 transition-colors hover:bg-panel">
              <div className="flex items-center gap-2">
                <Badge>{i.category}</Badge>
                {i.visibility !== 'public' && <Badge>{i.visibility}</Badge>}
                <span className="muted ml-auto text-xs">{timeAgo(i.created_at)}</span>
              </div>
              <h3 className="mt-2 font-medium text-ink">{i.title}</h3>
              <p className="muted mt-1 text-sm">by {i.owner?.display_name} · @{i.owner?.username}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}