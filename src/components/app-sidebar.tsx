import { Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  Users,
  Activity,
  Calendar,
  KanbanSquare,
  FolderKanban,
  UserCog,
  Settings,
  Sparkles,
  Bell,
  BarChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

import logoUrl from "@/assets/eray.jpg";

interface AppSidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export function AppSidebar({ mobileOpen, setMobileOpen }: AppSidebarProps) {
  const { pathname } = useLocation();
  const role = localStorage.getItem("role") || sessionStorage.getItem("role") || "commercial";

  const getNavForRole = (userRole: string) => {
    const isComm = userRole === "commercial";
    const isMgr = userRole === "manager";
    const isAdmin = userRole === "admin";
    
    const baseNav = [
      { to: "/", label: "Tableau de bord", icon: LayoutDashboard },
      { to: "/clients", label: isComm ? "Mes Clients" : "Clients", icon: Users },
      { to: "/pipeline", label: isComm ? "Mes Opportunités" : "Opportunités", icon: KanbanSquare },
      { to: "/activities", label: isComm ? "Mes Activités" : "Activités", icon: Activity },
      { to: "/calendar", label: "Calendrier", icon: Calendar },
      { to: "/projects", label: isComm ? "Mes Projets" : "Projets", icon: FolderKanban },
    ];

    if (isMgr) {
      baseNav.push({ to: "/users", label: "Équipe", icon: Users });
      // baseNav.push({ to: "/stats", label: "Statistiques", icon: BarChart }); // Optionnel si on a les stats
    }

    if (isAdmin) {
      baseNav.push({ to: "/users", label: "Utilisateurs", icon: UserCog });
      baseNav.push({ to: "/settings", label: "Paramètres", icon: Settings });
    }

    baseNav.push({ to: "/reminders", label: isComm ? "Mes Rappels" : "Rappels", icon: Bell });

    return baseNav;
  };

  const nav = getNavForRole(role);

  const navContent = (
    <>
      <div className="h-16 px-5 flex items-center gap-2.5 border-b border-sidebar-border">
        <div className="h-10 w-10 rounded-lg overflow-hidden bg-white flex items-center justify-center border border-border shadow-sm">
          <img src={logoUrl} alt="Eray CRM" className="h-9 w-9 object-contain" />
        </div>
        <div className="leading-tight">
          <div className="font-display font-bold text-[15px] text-foreground">Eray CRM</div>
          <div className="text-[11px] text-muted-foreground">Suite commerciale</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-1.5 mb-1.5">
          Espace de travail
        </div>
        <ul className="space-y-1">
          {nav.map((item) => {
            const active =
              item.to === "/"
                ? pathname === "/"
                : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    active
                      ? "bg-primary/10 text-primary font-semibold shadow-xs"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4.5 w-4.5 shrink-0 transition-colors",
                      active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                    )}
                    strokeWidth={active ? 2.2 : 2}
                  />
                  <span className="truncate">{item.label}</span>
                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className="rounded-xl p-3 bg-gradient-to-br from-primary/8 to-violet/8 border border-primary/10">
          <div className="text-xs font-semibold text-foreground">Plan Business</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">14 sièges utilisés sur 20</div>
          <div className="mt-2 h-1.5 rounded-full bg-white/60 overflow-hidden">
            <div className="h-full w-[70%] gradient-brand rounded-full" />
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-sidebar-border bg-sidebar z-30">
        {navContent}
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-[18rem] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>Affiche le menu de navigation mobile.</SheetDescription>
          </SheetHeader>
          <div className="h-full flex flex-col">{navContent}</div>
        </SheetContent>
      </Sheet>
    </>
  );
}
