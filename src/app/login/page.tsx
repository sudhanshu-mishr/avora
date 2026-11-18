import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AuthForm from '@/features/auth/AuthForm';

export const metadata = { title: 'Sign in — AVORA' };

export default async function LoginPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/home');
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="muted mt-1">Sign in to AVORA. <span className="muted">Ideas become reality.</span></p>
      </div>
      <AuthForm mode="login" />
    </main>
  );
}