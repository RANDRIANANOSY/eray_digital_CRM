import { Outlet, Navigate, useLocation } from "react-router";
import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { Toaster } from "@/components/ui/sonner";

const SESSION_MAX_AGE = 12 * 60 * 60 * 1000; // 12 hours

export default function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();
  
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  const loginTime = localStorage.getItem("login_time") || sessionStorage.getItem("login_time");
  const role = localStorage.getItem("role") || sessionStorage.getItem("role") || "commercial";

  const isExpired = loginTime && (Date.now() - parseInt(loginTime, 10) > SESSION_MAX_AGE);

  useEffect(() => {
    if (isExpired) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("name");
      localStorage.removeItem("login_time");
      sessionStorage.clear();
    }
  }, [isExpired]);

  if (!token || isExpired) {
    return <Navigate to="/login" state={{ expired: isExpired }} replace />;
  }

  // RBAC protection for routes
  if (role === "commercial" && (location.pathname.startsWith("/users") || location.pathname.startsWith("/settings"))) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
        <h1 className="text-3xl font-bold font-display">403 - Accès Refusé</h1>
        <p className="text-muted-foreground">Vous n'avez pas les droits nécessaires pour accéder à cette page.</p>
        <button onClick={() => window.history.back()} className="mt-4 rounded-md bg-primary px-4 py-2 text-white">Retour</button>
      </div>
    );
  }

  if (role === "manager" && location.pathname.startsWith("/settings")) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
        <h1 className="text-3xl font-bold font-display">403 - Accès Refusé</h1>
        <p className="text-muted-foreground">Seul un administrateur peut accéder aux paramètres.</p>
        <button onClick={() => window.history.back()} className="mt-4 rounded-md bg-primary px-4 py-2 text-white">Retour</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background">
      <AppSidebar mobileOpen={mobileNavOpen} setMobileOpen={setMobileNavOpen} />
      <div className="lg:pl-64">
        <AppTopbar onMobileMenuClick={() => setMobileNavOpen(true)} />
        <main className="p-4 lg:p-8 max-w-[1600px] mx-auto">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  );
}
