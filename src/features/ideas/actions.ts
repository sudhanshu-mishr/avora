'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

async function rpc(name: string, args: Record<string, unknown>) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc(name, args);
  if (error) {
    revalidatePath('/ideas');
    return { error: error.message };
  }
  revalidatePath('/ideas'); revalidatePath(`/ideas/${data}`);
  return { ok: true, id: data } as const;
}
export const createIdea = (args: {
  title: string; problem: string; solution: string; category: string;
  tags: string[]; skills: string[]; collaborators: string; visibility: string;
}) => rpc('create_idea', {
  p_title: args.title, p_problem: args.problem, p_solution: args.solution,
  p_category: args.category, p_tags: args.tags, p_skills: args.skills,
  p_collaborators: args.collaborators, p_visibility: args.visibility,
});
export const updateIdea = (id: string, args: Record<string, unknown>) =>
  rpc('update_idea', { p_id: id, ...args });
export const deleteIdea = (id: string) => rpc('delete_idea', { p_id: id });