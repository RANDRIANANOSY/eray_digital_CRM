import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, useRouteError } from "react-router";
import { Toaster } from "@/components/ui/sonner";
import { ApiError } from "@/lib/api";
import { clearSession, isAuthenticated } from "@/lib/api/auth-storage";

// A 401 while we DO hold a session (auth cookie) means the token
// expired/was revoked server-side — force a clean re-login. A 401 with no
// session (e.g. a failed login attempt itself) is left for the calling
// screen to handle inline.
function handleExpiredSession(error: unknown) {
  if (
    error instanceof ApiError &&
    error.status === 401 &&
    isAuthenticated() &&
    window.location.pathname !== "/login"
  ) {
    clearSession();
    window.location.assign("/login?expired=1");
  }
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleExpiredSession }),
  mutationCache: new MutationCache({ onError: handleExpiredSession }),
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster />
    </QueryClientProvider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  console.error(error);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Une erreur est survenue
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Quelque chose s'est mal passé."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Réessayer
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Retour au tableau de bord
          </a>
        </div>
      </div>
    </div>
  );
}
