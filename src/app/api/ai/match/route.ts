import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getProvider } from '@/lib/ai';
import { assertRateLimit, recordUsage, logInteraction } from '@/services/ai/rate-limit';

const extractSchema = {
  type: 'object',
  properties: {
    capabilities: { type: 'array', items: { type: 'string' } },
    collaboration_type: { type: 'string' },
    summary: { type: 'string' },
  },
  required: ['capabilities', 'summary'],
};

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => null);
  const { description, limit = 8 } = body ?? {};
  if (!description || typeof description !== 'string') {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  try { await assertRateLimit(user.id); }
  catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 429 }); }

  const provider = getProvider();
  let capabilities: string[] = [description.toLowerCase().slice(0, 40)];
  if (provider) {
    try {
      const res = await provider.complete({
        prompt: `Extract the required capabilities/skills for this work. Return up to 10 short skill phrases.\n${description}`,
        jsonSchema: extractSchema,
      });
      capabilities = (res.structured as { capabilities?: string[] })?.capabilities ?? capabilities;
    } catch { /* fall back to keyword list */ }
  }

  // Rank public profiles by skill overlap + availability + recency. No auto-messaging, no private data.
  const { data: people, error } = await supabase
    .from('profiles')
    .select('id,display_name,username,bio,avatar_url,skills:skills(name)', { count: 'exact' })
    .not('id', 'eq', user.id)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ error: 'search_failed' }, { status: 500 });

  const wanted = capabilities.map((c) => c.toLowerCase());
  const scored = (people ?? [])
    .map((p: any) => {
      const skills: string[] = (p.skills ?? []).map((s: any) => (s.name as string).toLowerCase());
      const hits = wanted.filter((w) => skills.some((s) => s.includes(w) || w.includes(s)));
      const score = hits.length * 2 + (p.bio ? (description && /open|collab|looking|available/i.test(p.bio) ? 2 : 0) : 0);
      return {
        id: p.id, username: p.username, display_name: p.display_name, bio: p.bio,
        avatar_url: p.avatar_url, matched_skills: hits, score,
        reason: hits.length
          ? `Matched on: ${hits.join(', ')}.`
          : 'Broad profile alignment — review the profile to confirm fit.',
      };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(limit, 12));

  await logInteraction({ userId: user.id, kind: 'match', contextType: 'connect', prompt: description });
  if (provider) await recordUsage(user.id, 1, 1);

  return NextResponse.json({
    ok: true,
    configured: !!provider,
    capabilities,
    matches: scored,
    note: 'AVORA never messages users automatically. Review each match and send an invitation yourself.',
  });
}