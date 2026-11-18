'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { validEmail } from '@/lib/validation';

export interface AuthError { error: string; status?: number }

export async function signUp(email: string, password: string, displayName?: string) {
  if (!validEmail(email)) return { error: 'Invalid email address.' } as AuthError;
  if (password.length < 8) return { error: 'Password must be at least 8 characters.' } as AuthError;
  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email, password, options: { data: { display_name: displayName } },
  });
  if (error) return { error: error.message } as AuthError;
  return { ok: true } as const;
}

export async function signIn(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message } as AuthError;
  if (data?.session) redirect('/home');
  return { error: 'Sign in failed. If you just created an account, confirm your email first.' } as AuthError;
}

export async function signInWithGoogle() {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/home` },
  });
  if (error) return { error: error.message } as AuthError;
  return { ok: true } as const;
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/');
}

export async function forgotPassword(email: string) {
  if (!validEmail(email)) return { error: 'Invalid email address.' } as AuthError;
  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
  });
  if (error) return { error: error.message } as AuthError;
  return { ok: true } as const;
}

export async function deleteAccount() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not signed in.' } as AuthError;
  // auth.users delete cascades to profiles (FK on delete cascade) and all owned rows.
  const { error } = await supabase.auth.admin.deleteUser(user.id);
  if (error) return { error: 'Deletion requires the service role. Please contact support or delete via the Supabase dashboard.' } as AuthError;
  return { ok: true } as const;
}