'use client';
import { useState, useTransition } from 'react';
import { PROJECT_STATUSES } from '@/lib/validation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';

export default function ProjectActions({ projectId, isManager, status, progress }: {
  projectId: string; isManager: boolean; status: string; progress: number;
}) {
  const [pending, start] = useTransition();
  if (!isManager) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        className="h-8 w-40"
        value={status}
        onChange={async (e) => {
          start(async () => {
            await createClient().from('projects').update({ status: e.target.value }).eq('id', projectId);
          });
        }}>
        {PROJECT_STATUSES.map((s) => <option key={s}>{s}</option>)}
      </Select>
      <label className="flex items-center gap-2 text-sm text-mute">
        Progress {progress}%
        <input type="range" min={0} max={100} value={progress}
          onChange={async (e) => {
            start(async () => {
              await createClient().from('projects').update({ progress: Number(e.target.value) }).eq('id', projectId);
            });
          }} />
      </label>
      <AddUpdate projectId={projectId} />
    </div>
  );
}

function AddUpdate({ projectId }: { projectId: string }) {
  const [body, setBody] = useState('');
  const [pending, start] = useTransition();
  return (
    <form className="flex gap-2" onSubmit={async (e) => {
      e.preventDefault(); if (!body.trim()) return;
      start(async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('project_updates').insert({ project_id: projectId, author_id: user?.id, body });
        setBody('');
      });
    }}>
      <input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Post an update…"
        className="h-8 rounded-md border border-line bg-surface px-3 text-sm" />
      <Button size="sm" type="submit" disabled={pending}>Post</Button>
    </form>
  );
}