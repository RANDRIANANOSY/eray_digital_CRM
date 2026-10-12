import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageLoaderProps {
  fullScreen?: boolean;
  className?: string;
}

export function PageLoader({ fullScreen = true, className }: PageLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Chargement en cours"
      className={cn(
        "flex items-center justify-center",
        fullScreen ? "min-h-screen w-full" : "min-h-[60vh] w-full",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-xs font-medium text-muted-foreground">Chargement…</span>
      </div>
    </div>
  );
}
