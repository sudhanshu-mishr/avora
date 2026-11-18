'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORIES, IDEA_VISIBILITY } from '@/lib/validation';
import { createIdea } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function IdeaForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [tags, setTags] = useState('');
  const [skills, setSkills] = useState('');
  const [collaborators, setCollaborators] = useState('');
  const [visibility, setVisibility] = useState<string>('public');
  const [error, setError] = useState('');
  const [pending, start] = useTransition();

  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => {
      e.preventDefault();
      start(async () => {
        const r = await createIdea({
          title, problem, solution, category,
          tags: tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean),
          skills: skills.split(',').map((t) => t.trim()).filter(Boolean),
          collaborators, visibility,
        });
        if ('error' in r) { setError(r.error); return; }
        router.push(`/ideas/${r.id}`);
      });
    }}>
      <div className="flex flex-col gap-1">
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="One-line idea" />
      </div>
      <div className="flex flex-col gap-1">
        <Label>Problem</Label>
        <Textarea value={problem} onChange={(e) => setProblem(e.target.value)} placeholder="What problem, for whom, and why does it matter?" />
      </div>
      <div className="flex flex-col gap-1">
        <Label>Proposed solution</Label>
        <Textarea value={solution} onChange={(e) => setSolution(e.target.value)} placeholder="Your approach." />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label>Category</Label>
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label>Visibility</Label>
          <Select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
            {IDEA_VISIBILITY.map((v) => <option key={v}>{v}</option>)}
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <Label>Tags (comma-separated)</Label>
        <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="robotics, autonomy, hardware" />
      </div>
      <div className="flex flex-col gap-1">
        <Label>Required skills</Label>
        <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Embedded, ML, Product Design" />
      </div>
      <div className="flex flex-col gap-1">
        <Label>Collaborators needed</Label>
        <Input value={collaborators} onChange={(e) => setCollaborators(e.target.value)} placeholder="e.g., 1 hardware engineer, 1 designer" />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" disabled={pending}>{pending ? 'Creating…' : 'Create idea'}</Button>
    </form>
  );
}