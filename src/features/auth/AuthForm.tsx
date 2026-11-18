'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signUp, signInWithGoogle } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'next/link';

export default function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setInfo('');
    start(async () => {
      const res = mode === 'login' ? await signIn(email, password) : await signUp(email, password, name);
      if ('error' in res) { setError(res.error); return; }
      if (mode === 'signup') { setInfo('Check your inbox to confirm your email, then sign in.'); return; }
      router.push('/home');
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {mode === 'signup' && (
        <div className="flex flex-col gap-1">
          <Label htmlFor="name">Display name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {info && <p className="text-sm text-accent">{info}</p>}
      <Button type="submit" disabled={pending}>{pending ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</Button>
      <Button variant="outline" type="button" disabled={pending}
        onClick={() => signInWithGoogle().then((r) => r && 'error' in r && setError(r.error))}>
        Continue with Google
      </Button>
      <div className="muted flex items-center justify-between text-sm">
        {mode === 'login' ? (
          <>
            <Link className="hover:underline" href="/forgot-password">Forgot password?</Link>
            <Link className="hover:underline" href="/signup">Create account</Link>
          </>
        ) : (
          <Link className="hover:underline" href="/login">Already have an account?</Link>
        )}
      </div>
    </form>
  );
}