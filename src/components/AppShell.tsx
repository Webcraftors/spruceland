import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Briefcase, Users2, Package, ShoppingCart,
  DollarSign, HardHat, BookOpen, Bell, Settings, Shield, LogOut, Menu, Search, MapPin,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useSession, ROLE_LABELS, can, type Module } from "@/lib/session";
import logoAsset from "@/assets/spruceland-logo.png.asset.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { NOTIFICATIONS } from "@/data/notifications";
import { cn } from "@/lib/utils";

const NAV: { to: string; label: string; icon: any; module: Module }[] = [
  { to: "/dashboard",     label: "Dashboard",     icon: LayoutDashboard, module: "dashboard" },
  { to: "/jobs",          label: "Jobs",          icon: Briefcase,       module: "jobs" },
  { to: "/clients",       label: "Clients",       icon: Users2,          module: "clients" },
  { to: "/inventory",     label: "Inventory",     icon: Package,         module: "inventory" },
  { to: "/orders",        label: "Orders",        icon: ShoppingCart,    module: "orders" },
  { to: "/financials",    label: "Financials",    icon: DollarSign,      module: "financials" },
  { to: "/team",          label: "Team",          icon: HardHat,         module: "team" },
  { to: "/knowledge",     label: "Knowledge",     icon: BookOpen,        module: "knowledge" },
  { to: "/permissions",   label: "Permissions",   icon: Shield,          module: "permissions" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { session, setSession } = useSession();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: s => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!session) {
    if (typeof window !== "undefined" && pathname !== "/login") {
      navigate({ to: "/login" });
    }
    return null;
  }

  const unread = NOTIFICATIONS.filter(n => !n.read).length;
  const items = NAV.filter(n => can(session.role, n.module));

  const SidebarInner = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <img src={logoAsset.url} alt="Spruceland" className="h-10 w-auto" />
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || (to !== "/dashboard" && pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-4 text-xs text-sidebar-foreground/60">
        <div className="font-semibold text-sidebar-foreground">A Client Driven Partner</div>
        <div className="mt-1">Spruceland Technologies Group Ltd</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex">
      <aside className="hidden lg:flex w-64 tv:w-80 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        {SidebarInner}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 tv:h-20 bg-background/85 backdrop-blur border-b border-border flex items-center gap-3 px-4 lg:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 bg-sidebar text-sidebar-foreground border-sidebar-border">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              {SidebarInner}
            </SheetContent>
          </Sheet>

          <div className="hidden md:flex items-center flex-1 max-w-md relative">
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input placeholder="Search jobs, clients, inventory…" className="pl-9 bg-card border-border" />
          </div>

          <div className="flex-1 md:hidden" />

          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{session.location}</span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground grid place-items-center px-1">{unread}</span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {NOTIFICATIONS.slice(0, 5).map(n => (
                <DropdownMenuItem key={n.id} className="flex-col items-start py-2">
                  <div className="text-sm font-medium">{n.title}</div>
                  <div className="text-xs text-muted-foreground">{n.detail}</div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link to="/notifications">View all</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-bold">
                  {session.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="hidden md:flex flex-col items-start leading-tight">
                  <span className="text-sm font-semibold">{session.name}</span>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    {ROLE_LABELS[session.role]}
                    {session.subcontractor && <Badge variant="outline" className="ml-1 h-4 px-1 text-[10px]">Sub</Badge>}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="font-semibold">{session.name}</div>
                <div className="text-xs text-muted-foreground">{ROLE_LABELS[session.role]} · {session.location}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link to="/settings"><Settings className="mr-2 h-4 w-4" />Settings</Link></DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSession(null); navigate({ to: "/login" }); }}>
                <LogOut className="mr-2 h-4 w-4" />Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 min-w-0 p-4 lg:p-6 tv:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
