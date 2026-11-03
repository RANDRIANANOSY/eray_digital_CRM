import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, useRouteError, isRouteErrorResponse, Link } from "react-router";
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
  const is404 = isRouteErrorResponse(error) && error.status === 404;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center p-8 bg-card rounded-2xl border border-border shadow-lg">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 mb-4 text-2xl font-bold font-mono">
          {is404 ? "404" : "!"}
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground font-display">
          {is404 ? "Page introuvable" : "Une erreur est survenue"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          {is404
            ? "L'adresse demandée n'existe pas ou la session a été redirigée."
            : error instanceof Error
              ? error.message
              : "Quelque chose s'est mal passé."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Actualiser
          </button>
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 shadow-sm"
          >
            Aller à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}

