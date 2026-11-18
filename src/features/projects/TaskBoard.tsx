'use client';
import { useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toggleTask } from './task-actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { timeAgo } from '@/lib/utils';

export default function TaskBoard({ projectId, tasks, milestones, isManager }: {
  projectId: string; tasks: any[]; milestones: any[]; isManager: boolean;
}) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [milestoneId, setMilestoneId] = useState('');
  const [pending, start] = useTransition();
  const [mileName, setMileName] = useState('');

  return (
    <div className="rounded-lg surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-ink">Tasks & milestones</h2>
        {isManager && (
          <form className="flex gap-2" onSubmit={async (e) => {
            e.preventDefault(); if (!mileName.trim()) return;
            start(async () => {
              await createClient().rpc('add_milestone', { p_project_id: projectId, p_name: mileName, p_description: '', p_target: null });
              setMileName('');
            });
          }}>
            <Input value={mileName} onChange={(e) => setMileName(e.target.value)} placeholder="New milestone" className="h-8 w-40" />
            <Button size="sm" type="submit">Add</Button>
          </form>
        )}
      </div>

      {milestones.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {milestones.map((m) => (
            <Badge key={m.id} className={m.completed ? 'text-emerald-300' : ''}>
              {m.name} {m.completed ? '✓' : ''}
            </Badge>
          ))}
        </div>
      )}

      <form className="mt-4 flex flex-col gap-2" onSubmit={async (e) => {
        e.preventDefault(); if (!title.trim()) return;
        start(async () => {
          const supabase = createClient();
          await supabase.rpc('create_task', {
            p_project_id: projectId, p_title: title, p_description: '',
            p_assignee: null, p_milestone: milestoneId || null,
            p_priority: priority, p_due: null,
          });
          setTitle('');
        });
      }}>
        <div className="flex gap-2">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New task…" className="flex-1" />
          <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
            {['low','medium','high','urgent'].map((p) => <option key={p}>{p}</option>)}
          </Select>
          <Select value={milestoneId} onChange={(e) => setMilestoneId(e.target.value)}>
            <option value="">No milestone</option>
            {milestones.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </Select>
        </div>
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={pending}>{pending ? 'Adding…' : 'Add task'}</Button>
        </div>
      </form>

      <ul className="mt-4 flex flex-col gap-2">
        {tasks.length === 0 && <p className="muted text-sm">No tasks yet. Add the first one above.</p>}
        {tasks.map((t) => (
          <li key={t.id} className="flex items-center gap-3 rounded-md border border-line bg-panel px-3 py-2">
            <input type="checkbox" checked={t.status === 'done'} className="h-4 w-4 accent-accent"
              onChange={() => start(() => toggleTask(t.id))} />
            <span className={t.status === 'done' ? 'muted line-through' : 'text-ink'}>{t.title}</span>
            <Badge>{t.priority}</Badge>
            {t.assignee && <span className="muted ml-auto text-xs">→ {t.assignee.display_name}</span>}
            {t.due_date && <span className="muted ml-auto text-xs">due {timeAgo(t.due_date)}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}