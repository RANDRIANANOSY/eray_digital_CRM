import { Outlet, Navigate } from "react-router";
import { Suspense, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { PageLoader } from "@/components/page-loader";
import { isAuthenticated } from "@/lib/api/auth-storage";

export default function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen w-full bg-background transition-colors duration-300">
      <AppSidebar mobileOpen={mobileNavOpen} setMobileOpen={setMobileNavOpen} />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <AppTopbar onMobileMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 p-4 lg:p-8 max-w-[1600px] w-full mx-auto bg-blue-50/40 dark:bg-blue-950/20 min-h-[calc(100vh-4rem)]">
          <Suspense fallback={<PageLoader fullScreen={false} />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
