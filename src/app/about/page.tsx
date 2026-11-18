export const metadata = { title: 'About — AVORA' };
export default function About() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-20">
      <h1 className="text-3xl font-semibold tracking-tight">About AVORA</h1>
      <p className="muted mt-4 text-lg">
        Ideas deserve more than likes. They deserve to be built. AVORA connects people, ideas,
        knowledge, and skills so individuals worldwide can collaborate, learn, invent, and build
        real-world projects.
      </p>
      <div className="mt-8 space-y-4 text-base">
        <p>AVORA is not a clone. It is a workspace for ambition: social discovery, idea lifecycle,
          professional identity, AI collaborator matching, project management, practical learning,
          communities, and product launches — all in one place.</p>
        <p><strong className="text-ink">Our principles:</strong> every visible control does real
          work, privacy is enforced at the database layer, and AI is a tool that never sees data
          you aren&apos;t allowed to see.</p>
      </div>
    </main>
  );
}