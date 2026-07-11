import { createFileRoute } from "@tanstack/react-router";
import { PERMISSIONS, ROLE_LABELS, type Module, type Role } from "@/lib/session";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield } from "lucide-react";

const ALL_MODULES: Module[] = ["dashboard","jobs","clients","inventory","orders","financials","team","knowledge","notifications","settings","permissions"];

export const Route = createFileRoute("/_app/permissions")({
  head: () => ({ meta: [{ title: "Permissions — Spruceland Ops" }] }),
  component: () => (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2"><Shield className="h-7 w-7 text-primary" />Permissions</h1>
        <p className="text-sm text-muted-foreground">Owner and Administrator can configure which modules each role can access. (Demo — resets on refresh.)</p>
      </header>
      <Card className="bg-card border-border">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-accent/50 text-left">
              <tr>
                <th className="p-3">Role</th>
                {ALL_MODULES.map(m => <th key={m} className="p-3 capitalize text-center">{m}</th>)}
              </tr>
            </thead>
            <tbody>
              {(Object.keys(ROLE_LABELS) as Role[]).map(r => (
                <tr key={r} className="border-t border-border">
                  <td className="p-3 font-medium whitespace-nowrap">{ROLE_LABELS[r]}</td>
                  {ALL_MODULES.map(m => (
                    <td key={m} className="p-3 text-center">
                      <Checkbox defaultChecked={PERMISSIONS[r].includes(m)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  ),
});
