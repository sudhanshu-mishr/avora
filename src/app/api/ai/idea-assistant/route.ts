import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getProvider } from '@/lib/ai';
import { assertRateLimit, recordUsage, logInteraction } from '@/services/ai/rate-limit';
import {
  ideaAssistantSchema,
  isValidIdeaAssistantResult,
  FALLBACK,
  type IdeaAssistantResult,
} from '@/lib/ai/schemas';

const SYSTEM = `You are AVORA's idea assistant. Analyze an idea the user can see.
Rules:
- Clearly separate ESTABLISHED FACTS, SUGGESTIONS, and UNVERIFIED CLAIMS.
- Never claim an idea is original, novel, or patentable.
- Be concrete and practical. Keep every array under 8 items.`;

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { ideaId } = body ?? {};
  if (!ideaId) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  // Read through the anon client so RLS visibility is enforced (unauthorized => no row).
  const { data: idea, error } = await supabase
    .from('ideas')
    .select('id,title,problem_statement,proposed_solution,category,tags,required_skills')
    .eq('id', ideaId)
    .single();
  if (error || !idea) {
    return NextResponse.json({ error: 'forbidden_or_not_found' }, { status: 403 });
  }

  try { await assertRateLimit(user.id); }
  catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 429 }); }

  const provider = getProvider();
  if (!provider) {
    return NextResponse.json({ ok: true, configured: false, result: FALLBACK });
  }

  const prompt = [
    `Title: ${idea.title}`,
    `Category: ${idea.category}`,
    `Problem: ${idea.problem_statement}`,
    `Proposed solution: ${idea.proposed_solution}`,
    `Tags: ${(idea.tags ?? []).join(', ')}`,
    `Required skills: ${(idea.required_skills ?? []).join(', ')}`,
  ].join('\n');

  try {
    const res = await provider.complete({
      prompt,
      system: SYSTEM,
      jsonSchema: ideaAssistantSchema,
      temperature: 0.4,
    });
    const result = isValidIdeaAssistantResult(res.structured)
      ? (res.structured as IdeaAssistantResult)
      : FALLBACK;
    await recordUsage(
      user.id,
      res.usage?.promptTokens ?? 0,
      res.usage?.completionTokens ?? 0,
    );
    await logInteraction({
      userId: user.id, kind: 'idea_assistant', contextType: 'idea', contextId: String(idea.id),
      prompt, response: res.text, model: res.model,
      tokens: (res.usage?.totalTokens ?? 0) || undefined,
    });
    return NextResponse.json({ ok: true, configured: true, result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'ai_error';
    return NextResponse.json(
      { ok: true, configured: true, degraded: true, result: FALLBACK, error: msg },
      { status: 502 },
    );
  }
}