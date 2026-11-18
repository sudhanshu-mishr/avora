import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AuthForm from '@/features/auth/AuthForm';

export const metadata = { title: 'Create account — AVORA' };

export default async function SignupPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/home');
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create your AVORA</h1>
        <p className="muted mt-1">A home for your ideas, collaborators, and projects.</p>
      </div>
      <AuthForm mode="signup" />
    </main>
  );
}