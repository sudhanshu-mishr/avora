'use client';
import { useState, useTransition } from 'react';
import { forgotPassword } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [pending, start] = useTransition();
  return (
    <form onSubmit={(e) => {
      e.preventDefault(); setMsg('');
      start(async () => {
        const r = await forgotPassword(email);
        setMsg('error' in r ? r.error : 'If that address exists, a reset link is on its way.');
      });
    }} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <Button type="submit" disabled={pending}>{pending ? 'Sending…' : 'Send reset link'}</Button>
      {msg && <p className="text-sm text-accent">{msg}</p>}
    </form>
  );
}