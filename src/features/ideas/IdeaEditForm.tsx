'use client';
import { useState, useTransition } from 'react';
import { updateIdea } from './actions';
import { CATEGORIES, IDEA_VISIBILITY } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function IdeaEditForm({ idea }: { idea: any }) {
  const [status, setStatus] = useState(idea.status);
  const [visibility, setVisibility] = useState(idea.visibility);
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  return (
    <form className="flex flex-col gap-3" onSubmit={(e) => {
      e.preventDefault();
      start(async () => {
        const r = await updateIdea(idea.id, { p_status: status, p_visibility: visibility });
        if ('error' in r) setError(r.error);
      });
    }}>
      <div className="flex flex-col gap-1">
        <Label>Status</Label>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          {['draft','open','in_development','prototype','shipped','archived','closed'].map((s) => <option key={s}>{s}</option>)}
        </Select>
      </div>
      <div className="flex flex-col gap-1">
        <Label>Visibility</Label>
        <Select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
          {IDEA_VISIBILITY.map((v) => <option key={v}>{v}</option>)}
        </Select>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save changes'}</Button>
    </form>
  );
}