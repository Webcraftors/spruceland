import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { sopBySlug, SOPS } from "@/data/sops";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_app/knowledge/$slug")({
  head: ({ params }) => {
    const s = SOPS.find(x => x.slug === params.slug);
    return { meta: [{ title: `${s?.title ?? "SOP"} — Spruceland Ops` }, { name: "description", content: s?.summary ?? "" }] };
  },
  loader: ({ params }) => {
    const sop = sopBySlug(params.slug);
    if (!sop) throw notFound();
    return { sop };
  },
  component: SopPage,
  notFoundComponent: () => <div className="p-8">SOP not found. <Link to="/knowledge" className="text-primary">Back</Link></div>,
});

function SopPage() {
  const { sop } = Route.useLoaderData() as { sop: (typeof SOPS)[number] };
  const [done, setDone] = useState<Record<number, boolean>>({});
  const completed = Object.values(done).filter(Boolean).length;

  return (
    <div className="max-w-3xl space-y-6">
      <Link to="/knowledge" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to knowledge</Link>
      <header>
        <Badge variant="outline">{sop.category}</Badge>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{sop.title}</h1>
        <p className="mt-2 text-muted-foreground">{sop.summary}</p>
        <p className="mt-3 text-xs text-primary">{completed} of {sop.steps.length} steps complete</p>
      </header>
      <Card className="bg-card border-border">
        <CardHeader><CardTitle>Procedure</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {sop.steps.map((step, i) => (
            <div key={i} className="flex gap-4 rounded-md border border-border p-4">
              <Checkbox id={`s${i}`} checked={!!done[i]} onCheckedChange={(v) => setDone(prev => ({ ...prev, [i]: !!v }))} />
              <div className="flex-1">
                <label htmlFor={`s${i}`} className={`font-semibold cursor-pointer ${done[i] ? "line-through text-muted-foreground" : ""}`}>
                  <span className="text-primary mr-2">Step {i + 1}.</span>{step.title}
                </label>
                <p className="text-sm text-muted-foreground mt-1">{step.body}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
