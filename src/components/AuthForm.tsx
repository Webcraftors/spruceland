import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { LovableMark } from '@lovable.dev/cloud-auth-js/react';
import { Eye, EyeOff, LogOut, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { useAccount } from '@/lib/account';

export function AuthForm({ audience }: { audience: 'client' | 'internal' }) {
  const { account, loading, error: accountError, refresh, signOut } = useAccount();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const destination = async () => {
    const next = await refresh();
    if (!next) return;
    if (audience === 'internal' && next.role) await navigate({ to: '/dashboard', replace: true });
    else if (audience === 'client') await navigate({ to: next.client ? '/client/app' : '/client', replace: true });
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setNotice('If an account exists, a password reset link has been sent. Check your email.');
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: name.trim() }, emailRedirectTo: `${window.location.origin}/auth` } });
        if (error) throw error;
        if (!data.session) setNotice('Check your email to confirm your account, then return to sign in.');
        else await destination();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        await destination();
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Please try again.'); }
    finally { setBusy(false); }
  };
  const oauth = async (provider: 'google' | 'lovable') => {
    setBusy(true); setError('');
    sessionStorage.setItem('spruceland.auth.audience', audience);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: `${window.location.origin}/auth` });
      if (result.error) throw result.error;
      if (!result.redirected) await destination();
    } catch (e) { setError(e instanceof Error ? e.message : 'Sign-in failed.'); }
    finally { setBusy(false); }
  };
  if (loading) return <p className="py-8 text-center text-muted-foreground">Loading your account…</p>;
  if (account) return <div className="space-y-5">
    <ShieldCheck className="h-8 w-8 text-primary" />
    <h1 className="text-2xl font-bold">Welcome, {account.profile.full_name || 'there'}</h1>
    <p className="text-sm text-muted-foreground break-all">{account.user.email}</p>
    {audience === 'internal' && !account.role ? <p className="text-sm">Your account is signed in. An approved Spruceland staff assignment is required to open the internal console.</p> : <Button className="w-full" onClick={destination}>Open {audience === 'internal' ? 'dashboard' : 'Client Portal'}</Button>}
    <Button variant="outline" className="w-full" onClick={() => void signOut().catch(e => setError(e.message))}><LogOut />Sign out</Button>
    <Link to="/" className="block text-center text-sm text-primary">Choose another portal</Link>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </div>;
  return <div className="space-y-5">
    <div><p className="text-xs font-semibold uppercase text-primary mb-2">{audience === 'internal' ? 'Spruceland staff' : 'Client Portal'}</p><h1 className="text-2xl font-bold">{mode === 'signup' ? 'Create your account' : mode === 'forgot' ? 'Reset your password' : 'Welcome back'}</h1></div>
    <form onSubmit={submit} className="space-y-4">
      {mode === 'signup' && <div className="space-y-2"><Label htmlFor="account-name">Full name</Label><Input id="account-name" autoComplete="name" value={name} onChange={e => setName(e.target.value)} required minLength={2} /></div>}
      <div className="space-y-2"><Label htmlFor="account-email">Email</Label><Input id="account-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
      {mode !== 'forgot' && <div className="space-y-2"><Label htmlFor="account-password">Password</Label><div className="relative"><Input id="account-password" type={visible ? 'text' : 'password'} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} className="pr-12" value={password} onChange={e => setPassword(e.target.value)} minLength={mode === 'signup' ? 8 : 1} required /><Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(!visible)}>{visible ? <EyeOff /> : <Eye />}</Button></div>{mode === 'signup' && <p className="text-xs text-muted-foreground">Use at least 8 characters.</p>}</div>}
      {mode === 'signin' && <Button type="button" variant="link" className="p-0 h-auto" onClick={() => { setMode('forgot'); setNotice(''); setError(''); }}>Forgot password?</Button>}
      {(error || accountError) && <p role="alert" className="text-sm text-destructive">{error || accountError}</p>}
      {notice && <p role="status" className="text-sm text-primary bg-primary/10 p-3 rounded-md">{notice}</p>}
      <Button type="submit" disabled={busy} className="w-full h-11">{busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : 'Sign in'}</Button>
    </form>
    {mode !== 'forgot' && <><div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div><div className="space-y-2">
      <Button variant="outline" className="w-full h-11" disabled={busy} onClick={() => oauth('google')}><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>Continue with Google</Button>
      <Button variant="outline" className="w-full h-11" disabled={busy} onClick={() => oauth('lovable')}><LovableMark />Continue with Lovable</Button>
    </div></>}
    <Button variant="link" className="w-full" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setNotice(''); setError(''); }}>{mode === 'signin' ? 'New here? Create an account' : 'Back to sign in'}</Button>
    <Link to="/" className="block text-center text-xs text-muted-foreground">Back to portal selection</Link>
  </div>;
}