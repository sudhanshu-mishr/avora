import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Users, FolderKanban, Lightbulb } from 'lucide-react';

const pillars = [
  { icon: Lightbulb, title: 'Ideas with depth', body: 'Share the problem, the proposed solution, required skills, and collaborators — not just a headline.' },
  { icon: Users, title: 'Find your team', body: 'AVORA AI reads your work, extracts the capabilities you need, and surfaces people who actually fit — with reasons.' },
  { icon: FolderKanban, title: 'Turn it into a project', body: 'Tasks, milestones, roles, and shared context. From first spark to shipped.' },
];

export default function Landing() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      <header className="flex items-center justify-between">
        <span className="text-lg font-semibold tracking-tight">AVORA</span>
        <nav className="flex items-center gap-3">
          <Button variant="ghost" size="sm"><Link href="/login">Sign in</Link></Button>
          <Button size="sm"><Link href="/signup">Get started</Link></Button>
        </nav>
      </header>

      <section className="mt-24 flex flex-col items-center text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs text-mute">
          <Sparkles size={14} className="text-accent" /> Ideas become reality.
        </span>
        <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-tight">
          A network for people who <span className="text-accent">build</span>, not just post.
        </h1>
        <p className="muted mt-5 max-w-xl text-lg">
          Discover ideas, showcase real skills, find collaborators through AI, form teams, and turn
          ambition into shipped projects.
        </p>
        <div className="mt-8 flex items-center gap-3">
          <Button size="lg"><Link href="/signup">Start building <ArrowRight size={16} /></Link></Button>
          <Button variant="outline" size="lg"><Link href="/explore">Explore AVORA</Link></Button>
        </div>
      </section>

      <section className="mt-24 grid gap-4 sm:grid-cols-3">
        {pillars.map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-lg surface p-6">
            <Icon size={22} className="text-accent" />
            <h3 className="mt-4 font-medium">{title}</h3>
            <p className="muted mt-2 text-sm">{body}</p>
          </div>
        ))}
      </section>

      <footer className="muted mt-24 border-t border-line pt-8 text-center text-sm">
        AVORA — Ideas become reality. <Link className="hover:underline" href="/about">About</Link>
      </footer>
    </main>
  );
}