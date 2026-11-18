import { createClient } from '@/lib/supabase/server';

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const LIMIT = { requests: 30, tokens: 120_000 };

export class RateLimitError extends Error {}

export async function assertRateLimit(userId: string) {
  const supabase = createClient();
  const now = new Date();
  let row = (await supabase.from('ai_usage').select('*').eq('user_id', userId).single()).data;

  if (row && now.getTime() - new Date(row.window_start).getTime() > WINDOW_MS) {
    row = { ...row, requests: 0, tokens: 0, window_start: now.toISOString() };
    await supabase.from('ai_usage').update(row).eq('id', row.id);
  }
  if (!row) {
    const { data: created } = await supabase
      .from('ai_usage')
      .insert({ user_id: userId, requests: 0, tokens: 0, window_start: now.toISOString() })
      .select()
      .single();
    row = created;
  }
  if (row.requests >= LIMIT.requests) {
    throw new RateLimitError('Hourly AI request limit reached. Try again later.');
  }
}

export async function recordUsage(userId: string, reqTokens = 0, respTokens = 0) {
  const supabase = createClient();
  const { data: row } = await supabase
    .from('ai_usage')
    .select('requests,tokens')
    .eq('user_id', userId)
    .single();
  if (!row) return;
  await supabase
    .from('ai_usage')
    .update({
      requests: row.requests + 1,
      tokens: row.tokens + reqTokens + respTokens,
    })
    .eq('id', row.id);
}

export async function logInteraction(params: {
  userId: string;
  kind: string;
  contextType: string;
  contextId?: string;
  prompt: string;
  response?: string;
  model?: string;
  tokens?: number;
}) {
  const supabase = createClient();
  await supabase.from('ai_interactions').insert({
    user_id: params.userId,
    kind: params.kind,
    context_type: params.contextType,
    context_id: params.contextId ?? null,
    prompt: params.prompt,
    response: params.response ?? null,
    model: params.model ?? null,
    tokens: params.tokens ?? null,
  });
}