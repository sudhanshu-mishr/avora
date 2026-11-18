'use client';
import { useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { addComment } from '@/features/social/actions';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { timeAgo } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';

export default function IdeaComments({ ideaId }: { ideaId: string }) {
  const [text, setText] = useState('');
  const [pending, start] = useTransition();
  const [comments, setComments] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  async function load(parentId?: string) {
    const supabase = createClient();
    const q = supabase.from('idea_comments')
      .select('id,body,created_at,parent_id,author:profiles(id,display_name,username,avatar_url)')
      .eq('idea_id', ideaId).order('created_at', { ascending: true }).limit(100);
    const { data } = await (parentId ? q.eq('parent_id', parentId) : q);
    return data ?? [];
  }

  function loadAll() { start(async () => { setComments(await load()); setLoaded(true); }); }
  return (
    <div className="rounded-lg surface p-5" onLoad={loadAll}>
      <h2 className="font-medium text-ink">Comments</h2>
      {!loaded ? (
        <LazyLoad onShow={loadAll}><EmptyState title="Loading comments…" /></LazyLoad>
      ) : comments.length === 0 ? (
        <EmptyState title="No comments yet" hint="Be the first to give feedback." />
      ) : (
        <ul className="mt-4 flex flex-col gap-4">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3">
              <Avatar name={c.author?.display_name} src={c.author?.avatar_url} size={32} />
              <div className="flex-1">
                <p className="text-sm font-medium">{c.author?.display_name} <span className="muted font-normal">· {timeAgo(c.created_at)}</span></p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{c.body}</p>
                <button className="muted mt-1 text-xs hover:underline"
                  onClick={async () => start(async () => {
                    const subs = await load(c.id);
                    setComments((prev) => [...prev, ...(subs.map((s) => ({ ...s, sub: true })) as any[])]);
                  })}>Reply</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <form className="mt-4 flex gap-2" onSubmit={(e) => {
        e.preventDefault(); if (!text.trim()) return;
        start(async () => {
          await addComment(ideaId, text);
          setText(''); setComments([]); loadAll();
        });
      }}>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a comment…" className="flex-1" />
        <Button type="submit" disabled={pending}>Send</Button>
      </form>
    </div>
  );
}

function LazyLoad({ onShow, children }: { onShow: () => void; children: React.ReactNode }) {
  return <div ref={(el) => el && onShow()}>{children}</div>;
}