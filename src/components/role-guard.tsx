import { ReactNode } from "react";
import { useAuth, RoleKey } from "@/lib/auth";
import { ShieldAlert } from "lucide-react";

interface RoleGuardProps {
  roles: RoleKey[];
  children: ReactNode;
  fallback?: ReactNode;
}

function DefaultDenied() {
  return (
    <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4">
      <ShieldAlert className="h-16 w-16 text-muted-foreground/40" strokeWidth={1.2} />
      <h1 className="text-3xl font-bold font-display">403 - Accès Refusé</h1>
      <p className="text-muted-foreground text-center max-w-md">
        Vous n'avez pas les droits nécessaires pour accéder à cette page.
      </p>
      <button
        onClick={() => window.history.back()}
        className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
      >
        Retour
      </button>
    </div>
  );
}

export function RoleGuard({ roles, children, fallback }: RoleGuardProps) {
  const { isRole } = useAuth();

  if (!isRole(...roles)) {
    return fallback ?? <DefaultDenied />;
  }

  return <>{children}</>;
}
