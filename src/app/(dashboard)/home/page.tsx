import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { EmptyState } from '@/components/ui/empty-state';
import { timeAgo } from '@/lib/utils';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Home — AVORA' };

export default async function HomePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Personalized: ideas I own, follow, or bookmarked + public recency
  const { data: mine } = await supabase.from('ideas').select('id,title,category,created_at')
    .in('owner_id', [user.id]).is('deleted_at', null).order('created_at', { ascending: false }).limit(10);
  const { data: follows } = await supabase.from('follows').select('followee_id').eq('follower_id', user.id);
  const followeeIds = (follows ?? []).map((f: any) => f.followee_id);
  const { data: followed } = followeeIds.length
    ? await supabase.from('ideas').select('id,title,category,created_at,owner_id')
      .in('owner_id', followeeIds).eq('visibility', 'public').is('deleted_at', null)
      .order('created_at', { ascending: false }).limit(20)
    : { data: [] };

  const items = [...(followed ?? []), ...(mine ?? [])];
  const onboardingNeeded = !mine && !(follows?.length);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Home</h1>
      {onboardingNeeded && (
        <div className="rounded-lg border border-accent/30 bg-accent/10 p-4 text-sm">
          <p className="text-ink">Finish onboarding to personalize your feed.</p>
          <Link href="/onboarding" className="mt-2 inline-block text-accent hover:underline">Start onboarding →</Link>
        </div>
      )}
      {items.length === 0 ? (
        <EmptyState title="Your feed is quiet" hint="Discover an idea, follow a creator, or start your own."
          action={<Link href="/discover" className="rounded-md bg-accent px-4 py-2 text-sm text-base">Open Discover</Link>} />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((i: any) => (
            <Link key={i.id} href={`/ideas/${i.id}`} className="rounded-lg surface p-4 transition-colors hover:bg-panel">
              <BadgeRow cat={i.category} ts={i.created_at} />
              <h3 className="mt-2 font-medium text-ink">{i.title}</h3>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function BadgeRow({ cat, ts }: { cat: string; ts: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="rounded-full border border-line bg-surface px-2 py-0.5 text-xs text-mute">{cat}</span>
      <span className="muted ml-auto text-xs">{timeAgo(ts)}</span>
    </div>
  );
}