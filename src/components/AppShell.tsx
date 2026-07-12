import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Briefcase, Users2, Package, ShoppingCart,
  DollarSign, HardHat, BookOpen, Bell, Settings, Shield, LogOut, Menu, Search, MapPin, Sun, Moon, MoreHorizontal,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useSession, ROLE_LABELS, can, type Module, type Location } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { useStore } from "@/lib/store";
import logoAsset from "@/assets/spruceland-logo.png.asset.json";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NotifQuickOpen } from "@/lib/live-notifications";
import { formatDistanceToNow, parseISO } from "date-fns";
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

// Bottom-nav shortlist (mobile): keep to 4 + More
const BOTTOM_ORDER = ["/dashboard", "/jobs", "/clients", "/inventory"];

export function AppShell({ children }: { children: ReactNode }) {
  const { session, setSession } = useSession();
  const { theme, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: s => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { notifications, markAllRead, markRead } = useStore();

  if (!session) {
    if (typeof window !== "undefined" && pathname !== "/login") navigate({ to: "/login" });
    return null;
  }

  const unread = notifications.filter(n => !n.read).length;
  const items = NAV.filter(n => can(session.role, n.module));
  const bottom = BOTTOM_ORDER.map(to => items.find(i => i.to === to)).filter(Boolean) as typeof items;
  const moreItems = items.filter(i => !BOTTOM_ORDER.includes(i.to));

  const SidebarInner = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-4 border-b border-sidebar-border">
        <img src={logoAsset.url} alt="Spruceland" className="h-8 w-auto" />
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || (to !== "/dashboard" && pathname.startsWith(to));
          return (
            <Link key={to} to={to} onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors",
                active ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}>
              <Icon className="h-4 w-4 shrink-0" /><span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3 text-[11px] text-sidebar-foreground/60">
        <div className="font-semibold text-sidebar-foreground">A Client Driven Partner</div>
        <div className="mt-0.5">Spruceland Technologies Group Ltd</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex">
      <aside className="hidden lg:flex w-56 tv:w-72 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        {SidebarInner}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-14 tv:h-16 bg-background/90 backdrop-blur border-b border-border flex items-center gap-2 px-3 lg:px-4 no-print">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 bg-sidebar text-sidebar-foreground border-sidebar-border">
              <SheetTitle className="sr-only">Navigation</SheetTitle>{SidebarInner}
            </SheetContent>
          </Sheet>

          <img src={logoAsset.url} alt="Spruceland" className="h-7 w-auto lg:hidden" />

          <Button variant="outline" size="sm" className="hidden md:inline-flex flex-1 max-w-sm justify-start text-muted-foreground text-xs h-8 gap-2" onClick={() => setSearchOpen(true)}>
            <Search className="h-3.5 w-3.5" />Search jobs, clients, inventory…
            <kbd className="ml-auto text-[10px] bg-muted px-1 rounded">/</kbd>
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 ml-auto" onClick={() => setSearchOpen(true)}>
            <Search className="h-4 w-4" />
          </Button>

          <Select value={session.location} onValueChange={(v) => setSession({ ...session, location: v as Location })}>
            <SelectTrigger className="hidden md:flex h-8 w-32 text-xs"><MapPin className="h-3 w-3 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Lusaka">Lusaka</SelectItem>
              <SelectItem value="Ndola">Ndola</SelectItem>
              <SelectItem value="Both">Both offices</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground grid place-items-center px-1">{unread}</span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between px-2 py-1">
                <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
                {unread > 0 && <Button variant="ghost" size="sm" className="h-6 text-[11px]" onClick={markAllRead}>Mark all read</Button>}
              </div>
              <DropdownMenuSeparator />
              <div className="max-h-80 overflow-y-auto">
                {notifications.slice(0, 8).map(n => (
                  <div key={n.id} className={cn("px-2.5 py-2 border-b border-border/50 last:border-0", !n.read && "bg-primary/5")} onClick={() => markRead(n.id)}>
                    <div className="text-[13px] font-medium leading-tight">{n.title}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.detail}</div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(parseISO(n.time), { addSuffix: true })}</span>
                      <NotifQuickOpen jobId={n.jobId} clientId={n.clientId} />
                    </div>
                  </div>
                ))}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link to="/notifications" className="text-xs">View all</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 h-9 px-1.5">
                <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground grid place-items-center text-[11px] font-bold">
                  {session.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="hidden md:flex flex-col items-start leading-tight">
                  <span className="text-xs font-semibold">{session.name}</span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    {ROLE_LABELS[session.role]}
                    {session.subcontractor && <Badge variant="outline" className="ml-1 h-3.5 px-1 text-[9px]">Sub</Badge>}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>
                <div className="font-semibold text-sm">{session.name}</div>
                <div className="text-[11px] text-muted-foreground">{ROLE_LABELS[session.role]} · {session.location}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link to="/settings"><Settings className="mr-2 h-3.5 w-3.5" />Settings</Link></DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSession(null); navigate({ to: "/login" }); }}>
                <LogOut className="mr-2 h-3.5 w-3.5" />Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="app-main flex-1 min-w-0 p-3 lg:p-5 tv:p-8">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur border-t border-border h-14 flex items-stretch no-print">
          {bottom.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || (to !== "/dashboard" && pathname.startsWith(to));
            return (
              <Link key={to} to={to} className={cn("flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px]", active ? "text-primary" : "text-muted-foreground")}>
                <Icon className="h-4 w-4" /><span>{label}</span>
              </Link>
            );
          })}
          {moreItems.length > 0 && (
            <Sheet>
              <SheetTrigger asChild>
                <button className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] text-muted-foreground">
                  <MoreHorizontal className="h-4 w-4" /><span>More</span>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="p-0">
                <SheetTitle className="sr-only">More</SheetTitle>
                <div className="grid grid-cols-3 gap-2 p-4">
                  {moreItems.map(({ to, label, icon: Icon }) => (
                    <Link key={to} to={to} className="flex flex-col items-center gap-1 rounded-lg border border-border p-3 text-xs">
                      <Icon className="h-5 w-5 text-primary" />{label}
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          )}
        </nav>
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
