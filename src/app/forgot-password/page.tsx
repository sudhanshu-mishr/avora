import { ForgotPasswordForm } from '@/features/auth/ForgotPasswordForm';
export const metadata = { title: 'Reset password — AVORA' };
export default function Forgot() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
        <p className="muted mt-1">We&apos;ll email you a reset link.</p>
      </div>
      <ForgotPasswordForm />
    </main>
  );
}