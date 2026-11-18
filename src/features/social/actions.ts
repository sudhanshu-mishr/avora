'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

async function rpc(name: string, args: Record<string, unknown>) {
  const supabase = createClient();
  const { error } = await supabase.rpc(name, args);
  revalidatePath('/discover'); revalidatePath('/home');
  if (error) return { error: error.message };
  return { ok: true } as const;
}

export const toggleFollow = (followeeId: string) => rpc('toggle_follow', { p_followee: followeeId });
export const toggleBookmark = (type: string, targetId: string) =>
  rpc('toggle_bookmark', { p_target_type: type, p_target_id: targetId });
export const addComment = (ideaId: string, body: string, parentId?: string) =>
  rpc('add_idea_comment', { p_idea_id: ideaId, p_body: body, p_parent_id: parentId ?? null });