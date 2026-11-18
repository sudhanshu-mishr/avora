export const CATEGORIES = [
  'AI','Software','Hardware','Robotics','Science','Healthcare','Education','Environment',
  'Energy','Business','Social Innovation','Design','Engineering','Agriculture','Other',
] as const;
export type Category = (typeof CATEGORIES)[number];

export const IDEA_VISIBILITY = ['public', 'unlisted', 'private'] as const;
export type IdeaVisibility = (typeof IDEA_VISIBILITY)[number];

export const PROJECT_STATUSES = [
  'planning','recruiting','in_progress','prototype','testing','completed','launched','paused','archived',
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const TASK_PRIORITIES = ['low','medium','high','urgent'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const ROLES = ['owner','admin','contributor','viewer'] as const;
export type Role = (typeof ROLES)[number];

export const INTENTS = [
  'discover_ideas','share_ideas','find_collaborators','build_projects',
  'learn','find_mentors','launch_products','discover_opportunities',
] as const;
export type Intent = (typeof INTENTS)[number];

export function isValidCategory(v: string): v is Category {
  return (CATEGORIES as readonly string[]).includes(v);
}
export function isValidVisibility(v: string): v is IdeaVisibility {
  return (IDEA_VISIBILITY as readonly string[]).includes(v);
}
export function isValidStatus(v: string): v is ProjectStatus {
  return (PROJECT_STATUSES as readonly string[]).includes(v);
}
export function isValidPriority(v: string): v is TaskPriority {
  return (TASK_PRIORITIES as readonly string[]).includes(v);
}

export function clampLength(s: string, max: number) {
  return s.slice(0, max);
}
export function sanitizeText(s: string, max = 2000) {
  return s.replace(/<[^>]*>/g, '').trim().slice(0, max);
}
export function validEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}
export function parseTags(s: string) {
  return s
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 12);
}