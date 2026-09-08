import { Link } from "react-router";
import {
  TrendingUp,
  Users,
  UserCheck,
  Trophy,
  AlertTriangle,
  DollarSign,
  PenLine,
  Target,
  AlertCircle,
  ArrowRight,
  Calendar,
  Clock,
  CheckCircle2,
  BarChart3,
} from "lucide-react";
import { useMemo } from "react";
import { useMe } from "@/hooks/api/useMe";
import { useDashboardStats } from "@/hooks/api/useDashboard";
import { useActivities } from "@/hooks/api/useActivities";
import { useOpportunities } from "@/hooks/api/useOpportunities";
import { OPPORTUNITY_STAGES } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityIcon, StatusBadge, PriorityDot } from "@/components/crm-atoms";
import { UserAvatar } from "@/components/user-avatar";
import { usePageMeta } from "@/hooks/use-page-meta";

const toneMap = {
  brand: "text-primary bg-primary/10",
  success: "text-emerald-600 bg-emerald-500/10",
  violet: "text-violet-600 bg-violet-500/10",
  destructive: "text-rose-600 bg-rose-500/10",
} as const;

const kpiIcons = {
  prospects: Users,
  clients: UserCheck,
  won: Trophy,
  lost: AlertTriangle,
  pipeline: DollarSign,
  signed: PenLine,
  conversion: Target,
} as const;

const OPEN_STAGES = OPPORTUNITY_STAGES.filter(
  (s) => !["Vente gagnée", "Vente perdue", "Ambassadeur", "Contrat signé"].includes(s),
);

function formatK(value: number): string {
  return `${Math.round(value / 1000)} K MGA`;
}

export default function Dashboard() {
  usePageMeta(
    "Tableau de bord — Eray CRM",
    "Pilotez vos ventes, activités et opportunités en un coup d'œil.",
  );

  const { data: me } = useMe();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: todayTasks } = useActivities({
    status: ["à faire"],
    sort: "scheduledAt",
    dir: "asc",
    perPage: 5,
  });
  const { data: appointments } = useActivities({
    type: ["meeting", "call", "visit"],
    status: ["planifié"],
    sort: "scheduledAt",
    dir: "asc",
    perPage: 3,
  });
  const { data: overdue } = useActivities({ status: ["en retard"], perPage: 3 });
  const { data: recent } = useActivities({ sort: "createdAt", dir: "desc", perPage: 5 });
  const { data: topOpportunities } = useOpportunities({
    stage: OPEN_STAGES,
    sort: "amount",
    dir: "desc",
    perPage: 4,
  });

  const totalSigned = useMemo(
    () => Object.values(stats?.revenueByMonth ?? {}).reduce((acc, v) => acc + v, 0),
    [stats],
  );
  const winRate =
    stats && stats.wonOpportunities + stats.lostOpportunities > 0
      ? Math.round(
          (stats.wonOpportunities / (stats.wonOpportunities + stats.lostOpportunities)) * 100,
        )
      : 0;

  const kpis = stats
    ? [
        {
          label: "Prospects",
          value: stats.prospects.toString(),
          tone: "brand" as const,
          iconKey: "prospects" as const,
        },
        {
          label: "Clients actifs",
          value: stats.activeClients.toString(),
          tone: "success" as const,
          iconKey: "clients" as const,
        },
        {
          label: "Opp. gagnées",
          value: stats.wonOpportunities.toString(),
          tone: "violet" as const,
          iconKey: "won" as const,
        },
        {
          label: "Opp. perdues",
          value: stats.lostOpportunities.toString(),
          tone: "destructive" as const,
          iconKey: "lost" as const,
        },
        {
          label: "CA potentiel",
          value: formatK(stats.totalOpportunityValue),
          tone: "brand" as const,
          iconKey: "pipeline" as const,
        },
        {
          label: "CA signé",
          value: formatK(totalSigned),
          tone: "success" as const,
          iconKey: "signed" as const,
        },
        {
          label: "Conversion",
          value: `${winRate}%`,
          tone: "violet" as const,
          iconKey: "conversion" as const,
        },
      ]
    : [];

  const pipelineDistribution = useMemo(() => {
    if (!stats) return [];
    const entries = Object.entries(stats.opportunitiesByStage).filter(([, count]) => count > 0);
    const total = entries.reduce((acc, [, count]) => acc + count, 0);
    if (total === 0) return [];
    return entries
      .map(([label, count]) => ({ label, value: Math.round((count / total) * 100) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [stats]);

  const colors = ["bg-primary", "bg-violet", "bg-sky-500", "bg-emerald-500", "bg-amber-500"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-sm text-muted-foreground">Aujourd'hui</div>
          <h1 className="text-2xl lg:text-3xl font-bold mt-1">Bonjour {me?.firstName ?? "…"} 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Voici la synthèse de votre activité commerciale.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Cette semaine
          </Button>
          <Button variant="outline" size="sm">
            Exporter
          </Button>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {statsLoading
          ? Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))
          : kpis.map((k, i) => {
              const KpiIcon = kpiIcons[k.iconKey];
              return (
                <div
                  key={k.label}
                  className="card-elegant p-4 hover-glow group cursor-default animate-fade-in-up"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`h-8 w-8 rounded-lg grid place-items-center ${toneMap[k.tone]} transition-transform duration-200 group-hover:scale-110`}
                    >
                      <KpiIcon className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="mt-3 text-[11px] text-muted-foreground uppercase tracking-wide font-medium">
                    {k.label}
                  </div>
                  <div className="text-xl font-bold font-display mt-0.5 tracking-tight">
                    {k.value}
                  </div>
                </div>
              );
            })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div
          className="card-elegant p-6 xl:col-span-2 animate-fade-in-up"
          style={{ animationDelay: "120ms" }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-bold text-lg flex items-center gap-2">
                <BarChart3 className="h-4.5 w-4.5 text-primary" />
                Chiffre d'affaires signé
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">12 derniers mois</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs">
              <span className="h-2.5 w-2.5 rounded-sm bg-primary" /> Signé
            </span>
          </div>
          {stats ? (
            <RevenueChart series={stats.revenueByMonth} />
          ) : (
            <Skeleton className="h-56 w-full" />
          )}
        </div>

        <div className="card-elegant p-6 animate-fade-in-up" style={{ animationDelay: "160ms" }}>
          <h3 className="font-display font-bold text-lg">Répartition pipeline</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Par étape commerciale</p>
          <div className="mt-6 space-y-3.5">
            {statsLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : pipelineDistribution.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune opportunité en cours.</p>
            ) : (
              pipelineDistribution.map((s, i) => (
                <div key={s.label} className="group">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-medium">{s.label}</span>
                    <span className="text-muted-foreground">{s.value}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full ${colors[i % colors.length]} rounded-full transition-all duration-700 ease-out group-hover:opacity-80`}
                      style={{ width: `${s.value}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card-elegant p-6 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <SectionHeader title="Tâches du jour" count={todayTasks?.meta.total} link="/activities" />
          <ul className="mt-4 space-y-2.5">
            {!todayTasks ? (
              <Skeleton className="h-24 w-full" />
            ) : todayTasks.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune tâche en attente.</p>
            ) : (
              todayTasks.items.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center gap-3 group rounded-lg p-1.5 -m-1.5 hover:bg-muted/50 transition-colors"
                >
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary/50 transition-colors shrink-0" />
                  <ActivityIcon type={a.type} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{a.title}</div>
                    <div className="text-[11px] text-muted-foreground">{a.clientName}</div>
                  </div>
                  <PriorityDot priority={a.priority} />
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="card-elegant p-6 animate-fade-in-up" style={{ animationDelay: "240ms" }}>
          <SectionHeader
            title="Rendez-vous à venir"
            count={appointments?.meta.total}
            link="/calendar"
          />
          <ul className="mt-4 space-y-3">
            {!appointments ? (
              <Skeleton className="h-24 w-full" />
            ) : appointments.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun rendez-vous à venir.</p>
            ) : (
              appointments.items.map((e) => {
                const scheduled = new Date(e.scheduledAt);
                return (
                  <li
                    key={e.id}
                    className="flex gap-3 p-2 rounded-lg hover:bg-muted/60 transition-colors group"
                  >
                    <div className="w-14 shrink-0 text-right">
                      <div className="text-sm font-semibold tabular-nums">
                        {scheduled.toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase">{e.type}</div>
                    </div>
                    <div className="w-0.5 rounded-full bg-primary/60 group-hover:bg-primary transition-colors" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{e.title}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{e.clientName}</div>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        <div className="card-elegant p-6 animate-fade-in-up" style={{ animationDelay: "280ms" }}>
          <SectionHeader
            title="Activités en retard"
            count={overdue?.meta.total}
            link="/activities"
            tone="destructive"
          />
          <ul className="mt-4 space-y-3">
            {!overdue ? (
              <Skeleton className="h-24 w-full" />
            ) : overdue.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Rien en retard, bravo !</p>
            ) : (
              overdue.items.map((a) => (
                <li
                  key={a.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-rose-50/60 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30"
                >
                  <AlertCircle className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{a.title}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{a.clientName}</div>
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                    <Link to="/activities">Reporter</Link>
                  </Button>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {/* Recent activity + opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div
          className="card-elegant p-6 lg:col-span-3 animate-fade-in-up"
          style={{ animationDelay: "320ms" }}
        >
          <SectionHeader title="Activités récentes" link="/activities" />
          <ul className="mt-4 divide-y divide-border">
            {!recent ? (
              <Skeleton className="h-32 w-full" />
            ) : recent.items.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Aucune activité.</p>
            ) : (
              recent.items.map((a) => (
                <li key={a.id} className="py-3 flex items-center gap-3 group rounded-lg">
                  <ActivityIcon type={a.type} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{a.title}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <UserAvatar
                        photo={a.ownerPhoto}
                        name={a.ownerName}
                        className="h-4 w-4"
                        fallbackClassName="bg-primary/10 text-primary text-[7px] font-semibold"
                      />
                      {a.clientName} • par {a.ownerName}
                    </div>
                  </div>
                  <StatusBadge status={a.status} />
                  <div className="text-xs text-muted-foreground w-24 text-right tabular-nums">
                    {new Date(a.scheduledAt).toLocaleDateString("fr-FR")}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        <div
          className="card-elegant p-6 lg:col-span-2 animate-fade-in-up"
          style={{ animationDelay: "360ms" }}
        >
          <SectionHeader title="Top opportunités" link="/pipeline" />
          <ul className="mt-4 space-y-3">
            {!topOpportunities ? (
              <Skeleton className="h-32 w-full" />
            ) : topOpportunities.items.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Aucune opportunité en cours.</p>
            ) : (
              topOpportunities.items.map((d) => (
                <li
                  key={d.id}
                  className="p-3 rounded-xl border border-border hover:border-primary/30 hover:shadow-elegant transition-all group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                        {d.clientName}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">{d.company}</div>
                    </div>
                    <span className="text-sm font-bold text-primary shrink-0">
                      {formatK(d.amount)}
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full gradient-brand rounded-full transition-all duration-700"
                        style={{ width: `${d.probability}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {d.probability}%
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{d.stage}</span>
                    <span>
                      {d.closeDate
                        ? `Clôture ${new Date(d.closeDate).toLocaleDateString("fr-FR")}`
                        : "—"}
                    </span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  count,
  link,
  tone,
}: {
  title: string;
  count?: number;
  link?: string;
  tone?: "destructive";
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h3 className="font-display font-bold text-base">{title}</h3>
        {count !== undefined && (
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tone === "destructive" ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400" : "bg-muted text-muted-foreground"}`}
          >
            {count}
          </span>
        )}
      </div>
      {link && (
        <Link
          to={link}
          className="text-xs font-medium text-primary hover:underline flex items-center gap-1 group"
        >
          Voir tout
          <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

function RevenueChart({ series }: { series: Record<string, number> }) {
  const entries = Object.entries(series);
  const max = Math.max(1, ...entries.map(([, v]) => v));
  const width = 100;
  const height = 60;

  const toPath = () =>
    entries
      .map(([, v], i) => {
        const x = (i / Math.max(1, entries.length - 1)) * width;
        const y = height - (v / max) * height;
        return `${i === 0 ? "M" : "L"}${x},${y}`;
      })
      .join(" ");
  const toSmoothPath = () => {
    if (entries.length < 2) {
      return toPath();
    }
    const points = entries.map(([, v], i) => {
      const x = (i / Math.max(1, entries.length - 1)) * width;
      const y = height - (v / max) * height;
      return [x, y];
    });
    let d = `M${points[0][0]},${points[0][1]}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const mx = (p0[0] + p1[0]) / 2;
      const my = (p0[1] + p1[1]) / 2;
      d += ` Q${p0[0]},${p0[1]} ${mx},${my}`;
    }
    const last = points[points.length - 1];
    d += ` T${last[0]},${last[1]}`;
    return d;
  };
  const toArea = () => `${toSmoothPath()} L${width},${height} L0,${height} Z`;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height + 12}`}
        className="w-full h-56"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="grad-ca" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.55 0.22 265)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="oklch(0.55 0.22 265)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((r) => (
          <line
            key={r}
            x1="0"
            x2={width}
            y1={height * r}
            y2={height * r}
            stroke="oklch(0.925 0.01 265)"
            strokeWidth="0.2"
            strokeDasharray="1 2"
          />
        ))}
        <path d={toArea()} fill="url(#grad-ca)" />
        <path
          d={toSmoothPath()}
          fill="none"
          stroke="oklch(0.55 0.22 265)"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="flex justify-between mt-2 px-1 text-[10px] text-muted-foreground font-medium tabular-nums">
        {entries.map(([m]) => (
          <span key={m}>{m.slice(5)}</span>
        ))}
      </div>
    </div>
  );
}
