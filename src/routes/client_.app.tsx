import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useClientSession, useTickets } from "@/repositories/portal-repo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/client_/app")({
  head: () => ({
    meta: [
      { title: "My store — Spruceland Client Portal" },
      { name: "description", content: "Your store's breakdown tickets and Spruceland service details." },
      { property: "og:title", content: "My store — Spruceland Client Portal" },
      { property: "og:description", content: "Track breakdown tickets for your store." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ClientHome,
});

function ClientHome() {
  const [s, setS] = useClientSession();
  const tickets = useTickets();
  const navigate = useNavigate();
  if (s === undefined) return null;
  if (!s) return <div className="p-6 text-center"><Link to="/client" className="text-primary">Sign in</Link></div>;
  const mine = tickets.filter(t => t.clientId === s.clientId && t.site.name === s.site.name);
  return (
    <div className="min-h-dvh max-w-md mx-auto p-5 space-y-4">
      <img src="/spruceland-logo.png" alt="Spruceland" className="h-8 w-auto" />
      <div><h1 className="text-xl font-extrabold">Hi, {s.employeeName}</h1>
        <p className="text-sm text-muted-foreground">{s.clientName} · {s.site.name}, {s.site.province}</p></div>
      <ul className="space-y-2">{mine.map(t => (
        <li key={t.id} className="rounded-xl border border-border bg-card p-3">
          <div className="flex justify-between text-sm font-semibold"><span>{t.id} · {t.fault}</span><span className="text-primary">{t.status}</span></div>
          <div className="text-xs text-muted-foreground">{t.asset.make} {t.asset.model} · {t.department}</div>
        </li>))}</ul>
      <Button variant="outline" className="w-full" onClick={() => { setS(null); navigate({ to: "/" }); }}>Sign out</Button>
    </div>
  );
}
