import { createFileRoute, Link } from "@tanstack/react-router";
import { SOPS } from "@/data/sops";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";

export const Route = createFileRoute("/_app/knowledge")({
  head: () => ({ meta: [{ title: "Knowledge base — Spruceland Ops" }, { name: "description", content: "SOPs, calibration procedures and diagnostics for technicians." }] }),
  component: () => (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">Knowledge base</h1>
        <p className="text-sm text-muted-foreground">Calibration SOPs, diagnostic flows and safety procedures.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {SOPS.map(s => (
          <Link key={s.slug} to="/knowledge/$slug" params={{ slug: s.slug }}>
            <Card className="bg-card border-border h-full hover:border-primary/60 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-9 w-9 rounded-md bg-primary/15 text-primary grid place-items-center"><BookOpen className="h-4 w-4" /></div>
                  <Badge variant="outline">{s.category}</Badge>
                </div>
                <CardTitle className="text-lg leading-tight">{s.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{s.summary}</p>
                <div className="text-xs text-primary mt-3">{s.steps.length} steps →</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  ),
});
