'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORIES, INTENTS } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const INTENT_LABELS: Record<string, string> = {
  discover_ideas: 'Discover ideas', share_ideas: 'Share ideas',
  find_collaborators: 'Find collaborators', build_projects: 'Build projects',
  learn: 'Learn', find_mentors: 'Find mentors',
  launch_products: 'Launch products', discover_opportunities: 'Discover opportunities',
};

export default function OnboardingClient({ profile }: { profile: any }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [location, setLocation] = useState(profile?.location ?? '');
  const [interests, setInterests] = useState<string[]>([]);
  const [skills, setSkills] = useState('');
  const [intentions, setIntentions] = useState<string[]>([]);

  function toggle(list: string[], v: string) {
    return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
  }

  async function finish() {
    const supabase = await import('@/lib/supabase/client').then((m) => m.createClient());
    await supabase.from('profiles').update({
      bio, location,
      intentions: intentions,
    }).eq('id', profile.id);
    await supabase.from('user_skills').delete().eq('user_id', profile.id);
    const skillNames = skills.split(',').map((s) => s.trim()).filter(Boolean);
    for (const name of skillNames) {
      await supabase.rpc('upsert_skill', { p_name: name });
      const { data: sk } = await supabase.from('skills').select('id').ilike('name', name).limit(1).single();
      if (sk) await supabase.from('user_skills').insert({ user_id: profile.id, skill_id: sk.id });
    }
    router.push('/home');
  }

  const steps = 4;
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 px-6 py-12">
      <div>
        <p className="muted text-sm">Step {step + 1} of {steps}</p>
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-surface">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${((step + 1) / steps) * 100}%` }} />
        </div>
      </div>

      {step === 0 && (
        <section className="flex flex-col gap-5">
          <h1 className="text-2xl font-semibold">Tell us a little about you</h1>
          <div className="flex flex-col gap-2">
            <label className="text-sm">Bio</label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="What you're working on, what you care about." />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm">Location (optional)</label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" />
          </div>
        </section>
      )}
      {step === 1 && (
        <section className="flex flex-col gap-5">
          <h1 className="text-2xl font-semibold">What are you interested in?</h1>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button key={c} type="button"
                className={cn('rounded-full border px-3 py-1.5 text-sm',
                  interests.includes(c) ? 'border-accent bg-accent/15 text-ink' : 'border-line text-mute')}
                onClick={() => setInterests((s) => toggle(s, c))}>{c}</button>
            ))}
          </div>
        </section>
      )}
      {step === 2 && (
        <section className="flex flex-col gap-5">
          <h1 className="text-2xl font-semibold">Your skills</h1>
          <p className="muted text-sm">Comma-separated. Marking a skill as self-reported — evidence can be added later.</p>
          <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Machine Learning, Embedded Systems, Product Design" />
        </section>
      )}
      {step === 3 && (
        <section className="flex flex-col gap-5">
          <h1 className="text-2xl font-semibold">What do you want to do here?</h1>
          <div className="grid gap-2 sm:grid-cols-2">
            {INTENTS.map((i) => (
              <button key={i} type="button"
                className={cn('rounded-lg border px-3 py-2 text-left text-sm',
                  intentions.includes(i) ? 'border-accent bg-accent/15' : 'border-line text-mute')}
                onClick={() => setIntentions((s) => toggle(s, i))}>{INTENT_LABELS[i]}</button>
            ))}
          </div>
        </section>
      )}

      <div className="flex items-center justify-between">
        <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>Back</Button>
        {step < steps - 1
          ? <Button onClick={() => setStep((s) => s + 1)}>Continue</Button>
          : <Button onClick={finish}>Enter AVORA</Button>}
      </div>
      <button className="muted text-sm hover:underline" onClick={() => router.push('/home')}>Skip for now</button>
    </main>
  );
}