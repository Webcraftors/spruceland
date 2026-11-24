import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { AuthForm } from '@/components/AuthForm';
import { pageMeta } from '@/lib/meta';
import { useAccount } from '@/lib/account';

export const Route = createFileRoute('/auth')({
  head: () => pageMeta('Your account — Spruceland', 'Sign in, confirm your account and choose your Spruceland portal.'),
  component: AccountPage,
});
function AccountPage() {
  const { account, loading } = useAccount();
  const [audience, setAudience] = useState<'client' | 'internal'>('client');
  useEffect(() => { if (sessionStorage.getItem('spruceland.auth.audience') === 'internal') setAudience('internal'); }, []);
  return <main className="min-h-dvh flex items-center justify-center px-5 py-10 bg-background"><div className="w-full max-w-sm">
    <img src="/spruceland-logo.png" alt="Spruceland" className="h-12 w-auto mx-auto mb-8" />
    {!loading && account ? <div className="space-y-5"><h1 className="text-2xl font-bold">You're signed in</h1><p className="text-sm text-muted-foreground break-all">{account.user.email}</p><Link to="/client" className="block font-semibold text-primary">Open Client Portal</Link>{account.role && <Link to="/dashboard" className="block font-semibold text-primary">Open staff dashboard</Link>}<AuthForm audience={audience} /></div> : <AuthForm audience={audience} />}
  </div></main>;
}