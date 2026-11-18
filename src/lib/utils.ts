export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export function timeAgo(date: string | Date): string {
  const d = new Date(date);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const day = Math.floor(h / 24);
  if (day < 30) return `${day}d ago`;
  return d.toLocaleDateString();
}

export function initials(name?: string) {
  return (name ?? '?')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function truncate(s: string, n = 160) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

export function isTransient(status: number) {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}