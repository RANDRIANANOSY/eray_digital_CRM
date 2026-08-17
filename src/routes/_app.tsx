import { Outlet, Navigate } from "react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { RoleGuard } from "@/components/role-guard";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { Toaster } from "@/components/ui/sonner";

export default function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
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

export function UsersGuard() {
  return (
    <RoleGuard roles={["admin", "manager"]}>
      <Outlet />
    </RoleGuard>
  );
}

export function SettingsGuard() {
  return (
    <RoleGuard roles={["admin"]}>
      <Outlet />
    </RoleGuard>
  );
}
