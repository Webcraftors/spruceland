import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, ShieldCheck, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Spruceland — Choose your portal" },
      { name: "description", content: "Sign in to the Spruceland Client Portal to raise breakdowns, or to the Spruceland Admin console." },
      { property: "og:title", content: "Spruceland — Choose your portal" },
      { property: "og:description", content: "Client breakdown tickets, service schedules and digital job cards from Spruceland Technologies." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Chooser,
});

function Chooser() {
  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <div className="h-1.5 bg-primary" />
      <main className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md text-center">
          <img src="/spruceland-logo.png" alt="Spruceland Technologies" className="h-14 w-auto mx-auto" />
          <h1 className="mt-8 text-2xl font-extrabold tracking-tight">Welcome</h1>
          <p className="mt-1 text-sm text-muted-foreground">How would you like to sign in?</p>
          <div className="mt-8 grid gap-3">
            <PortalCard to="/client" icon={Building2} title="Client Portal" text="Report breakdowns, track repairs and view service dates for your store." primary />
            <PortalCard to="/login" icon={ShieldCheck} title="Spruceland Admin" text="Staff console for jobs, technicians, clients and operations." />
          </div>
          <p className="mt-10 text-[11px] text-muted-foreground">Spruceland Technologies Group Ltd · A Client Driven Partner</p>
        </div>
      </main>
    </div>
  );
}

function PortalCard({ to, icon: Icon, title, text, primary }: { to: "/client" | "/login"; icon: any; title: string; text: string; primary?: boolean }) {
  return (
    <Link to={to} className={`group flex items-center gap-4 rounded-2xl border p-4 text-left transition shadow-sm hover:shadow-md active:scale-[0.99] ${primary ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/50"}`}>
      <div className={`grid place-items-center h-12 w-12 shrink-0 rounded-xl ${primary ? "bg-primary-foreground/15" : "bg-primary/10 text-primary"}`}><Icon className="h-6 w-6" /></div>
      <div className="flex-1 min-w-0">
        <div className="font-bold">{title}</div>
        <div className={`text-xs mt-0.5 ${primary ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{text}</div>
      </div>
      <ArrowRight className="h-5 w-5 opacity-70 group-hover:translate-x-0.5 transition" />
    </Link>
  );
}
