import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { pageMeta } from '@/lib/meta';

export const Route = createFileRoute('/reset-password')({
  head: () => pageMeta('Reset password — Spruceland', 'Set a new password using your Spruceland account recovery link.'),
  component: ResetPassword,
});
function ResetPassword() {
  const [valid, setValid] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    // Save the recovery marker before Auth consumes the URL fragment.
    const params = new URLSearchParams(window.location.hash.slice(1));
    const recovery = params.get('type') === 'recovery';
    void supabase.auth.getUser().then(({ data, error }) => setValid(recovery && !!data.user && !error));
  }, []);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) setError(error.message); else setDone(true);
  };
  return <main className="min-h-dvh bg-background flex items-center justify-center px-5 py-10"><div className="w-full max-w-sm space-y-5">
    <img src="/spruceland-logo.png" alt="Spruceland" className="h-12 w-auto mx-auto" />
    <h1 className="text-2xl font-bold">Set a new password</h1>
    {valid === null ? <p>Checking your reset link…</p> : !valid ? <><p role="alert" className="text-sm text-destructive">This reset link is invalid or expired. Request another from the sign-in page.</p><Link to="/auth" className="text-primary">Back to sign in</Link></> : done ? <><p role="status" className="text-primary">Your password has been updated.</p><Link to="/auth" className="font-semibold text-primary">Continue to your account</Link></> : <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2"><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} /></div>
      <div className="space-y-2"><Label htmlFor="confirm-password">Confirm new password</Label><Input id="confirm-password" type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={e => setConfirm(e.target.value)} /></div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button className="w-full" disabled={busy}>{busy ? 'Saving…' : 'Update password'}</Button>
    </form>}
  </div></main>;
}