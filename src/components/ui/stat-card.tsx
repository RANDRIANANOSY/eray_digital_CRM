import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type StatCardProps = {
  title: string;
  value: string;
  icon: ReactNode;
  gradient: string;
  subtitle?: string;
  subvalue?: string;
  className?: string;
};

export function StatCard({
  title,
  value,
  icon,
  gradient,
  subtitle,
  subvalue,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "card-elegant group relative overflow-hidden p-4 hover-glow animate-fade-in-up transition-all duration-300",
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-10 blur-2xl transition-opacity duration-300 group-hover:opacity-25 bg-gradient-brand" />

      <div className="flex items-center justify-between">
        <span
          className={cn(
            "h-10 w-10 rounded-xl bg-gradient-to-br grid place-items-center text-white shadow-float transition-transform duration-200 group-hover:scale-110",
            gradient,
          )}
        >
          {icon}
        </span>
      </div>
      <div className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground truncate">
        {title}
      </div>
      <div className="mt-0.5 text-2xl font-bold font-display tracking-tight tabular-nums">
        {value}
      </div>
      {subtitle && (
        <div className="mt-2 flex items-center justify-between gap-1 text-[10px]">
          <span className="text-muted-foreground truncate">{subtitle}</span>
          <span className="text-primary font-semibold shrink-0">{subvalue}</span>
        </div>
      )}
    </div>
  );
}