'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORIES } from '@/lib/validation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function ProjectForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [skills, setSkills] = useState('');
  const [visibility, setVisibility] = useState('unlisted');
  const [ideaId, setIdeaId] = useState('');
  const [error, setError] = useState('');
  const [pending, start] = useTransition();

  return (
    <form className="flex flex-col gap-4" onSubmit={async (e) => {
      e.preventDefault();
      start(async () => {
        const supabase = createClient();
        const { data, error: rpcErr } = await supabase.rpc('create_project', {
          p_name: name, p_description: description, p_category: category,
          p_idea_id: ideaId || null, p_skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
          p_visibility: visibility,
        });
        if (rpcErr) { setError(rpcErr.message); return; }
        router.push(`/projects/${data}`);
      });
    }}>
      <div className="flex flex-col gap-1"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
      <div className="flex flex-col gap-1"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1"><Label>Category</Label>
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select></div>
        <div className="flex flex-col gap-1"><Label>Visibility</Label>
          <Select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
            <option value="public">public</option><option value="unlisted">unlisted</option><option value="private">private</option>
          </Select></div>
      </div>
      <div className="flex flex-col gap-1"><Label>Required skills</Label><Input value={skills} onChange={(e) => setSkills(e.target.value)} /></div>
      <div className="flex flex-col gap-1"><Label>Link to an idea (optional UUID)</Label><Input value={ideaId} onChange={(e) => setIdeaId(e.target.value)} /></div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" disabled={pending}>{pending ? 'Creating…' : 'Create project'}</Button>
    </form>
  );
}