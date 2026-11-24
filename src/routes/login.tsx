import { createFileRoute } from '@tanstack/react-router';
import { AuthForm } from '@/components/AuthForm';
import { pageMeta } from '@/lib/meta';
export const Route = createFileRoute('/login')({
  head: () => pageMeta('Staff sign-in — Spruceland Ops', 'Sign in to your approved Spruceland staff account.'),
  component: LoginPage,
});
function LoginPage() {
  return <div className="min-h-dvh bg-background flex flex-col">
    <header className="bg-sidebar text-sidebar-foreground px-5 py-5 border-b border-sidebar-border"><div className="max-w-5xl mx-auto flex items-center gap-4"><img src="/spruceland-logo.png" alt="Spruceland Technologies" className="h-10 w-auto rounded-md bg-card p-1" /><span className="text-xs font-semibold">Operations Console</span></div></header>
    <main className="flex-1 flex items-center justify-center px-5 py-10"><div className="w-full max-w-sm"><AuthForm audience="internal" /></div></main>
  </div>;
}
