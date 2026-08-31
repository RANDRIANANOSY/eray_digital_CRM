import { usePageMeta } from "@/hooks/use-page-meta";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Check,
  CalendarDays,
  User2,
  Clock3,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityIcon } from "@/components/crm-atoms";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NewEventDialog } from "@/components/quick-create-dialogs";
import { useActivities } from "@/hooks/api/useActivities";
import { ApiError } from "@/lib/api";
import type { ActivityDto } from "@/lib/api/types";

type View = "Jour" | "Semaine" | "Mois" | "Liste";
type EventType = "call" | "meeting" | "follow-up" | "task";
type Event = {
  id: number;
  day: number;
  start: number;
  duration: number;
  title: string;
  client: string;
  type: EventType;
  date: Date;
};

const eventColors: Record<EventType, string> = {
  call: "bg-blue-500/15 border-l-blue-500 text-blue-900",
  meeting: "bg-violet-500/15 border-l-violet-500 text-violet-900",
  "follow-up": "bg-rose-500/15 border-l-rose-500 text-rose-900",
  task: "bg-emerald-500/15 border-l-emerald-500 text-emerald-900",
};

const ALL_TYPES: EventType[] = ["call", "meeting", "follow-up", "task"];
const typeLabels: Record<EventType, string> = {
  call: "Appels",
  meeting: "Rendez-vous",
  "follow-up": "Relances",
  task: "Tâches",
};
const typeSwatch: Record<EventType, string> = {
  call: "bg-blue-500",
  meeting: "bg-violet-500",
  "follow-up": "bg-rose-500",
  task: "bg-emerald-500",
};
const typeBadge: Record<EventType, string> = {
  call: "bg-blue-500/15 text-blue-800",
  meeting: "bg-violet-500/15 text-violet-800",
  "follow-up": "bg-rose-500/15 text-rose-800",
  task: "bg-emerald-500/15 text-emerald-800",
};

const DAYS_SHORT = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];

function mapActivityType(type: ActivityDto["type"]): EventType {
  if (type === "call") return "call";
  if (type === "meeting" || type === "visit") return "meeting";
  if (type === "follow-up" || type === "quote" || type === "contract") return "follow-up";
  return "task";
}

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff, 12, 0, 0, 0);
}

function fmtTime(h: number) {
  const H = Math.floor(h);
  const M = Math.round((h - H) * 60);
  return `${H.toString().padStart(2, "0")}:${M.toString().padStart(2, "0")}`;
}

function EventDetails({ e }: { e: Event }) {
  return (
    <>
      <div className="text-sm font-bold font-display text-foreground text-left leading-normal mb-1">
        {e.title}
      </div>
      <span
        className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mb-3 capitalize ${typeBadge[e.type]}`}
      >
        {typeLabels[e.type]}
      </span>
      <div className="space-y-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <User2 className="h-3.5 w-3.5 shrink-0" />
          <span className="text-foreground font-medium">{e.client}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock3 className="h-3.5 w-3.5 shrink-0" />
          <span>
            {fmtTime(e.start)} – {fmtTime(e.start + e.duration)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
          <span className="capitalize">
            {e.date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </span>
        </div>
      </div>
      <div className="mt-3 pt-2 border-t border-border flex justify-end">
        <Button size="sm" variant="outline" className="h-7 text-xs">
          Voir la fiche
        </Button>
      </div>
    </>
  );
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

const INITIAL_DATE = startOfToday();

function toInputDate(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function CalendarPage() {
  usePageMeta(
    "Calendrier — Eray CRM",
    "Vues Jour, Semaine, Mois et Liste pour vos rendez-vous et relances.",
  );
  const [view, setView] = useState<View>("Semaine");
  const [typeFilter, setTypeFilter] = useState<EventType[]>([...ALL_TYPES]);
  const [refDate, setRefDate] = useState<Date>(INITIAL_DATE);
  const [isCustomDate, setIsCustomDate] = useState(false);

  // Load the activities for the month containing the viewed date, with a one
  // week buffer on each side to cover week navigation across month boundaries.
  const dateRange = useMemo(() => {
    const from = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
    from.setDate(from.getDate() - 7);
    const to = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0);
    to.setDate(to.getDate() + 7);
    to.setHours(23, 59, 59, 999);
    return { dateFrom: from.toISOString(), dateTo: to.toISOString() };
  }, [refDate]);

  const { data, isLoading, isError, error } = useActivities({
    sort: "scheduledAt",
    dir: "asc",
    ...dateRange,
    perPage: 200,
  });
  const activities = useMemo(() => data?.items ?? [], [data]);

  const monday = useMemo(() => getMonday(refDate), [refDate]);
  const daysOfWeek = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const day = new Date(monday);
        day.setDate(monday.getDate() + i);
        return day;
      }),
    [monday],
  );

  const days = useMemo(
    () => daysOfWeek.map((d, i) => `${DAYS_SHORT[i]} ${d.getDate().toString().padStart(2, "0")}`),
    [daysOfWeek],
  );
  const hours = Array.from({ length: 11 }, (_, i) => i + 8); // 8-18h

  // Column of the day selected in "Jour" view: 0 = Monday … 6 = Sunday.
  const activeDayIdx = (refDate.getDay() + 6) % 7;

  const visibleEvents = useMemo(() => {
    const startMs = monday.getTime() - 12 * 3600 * 1000;
    const endMs = monday.getTime() + 7 * 86400000 - 12 * 3600 * 1000;

    return activities
      .filter((a) => typeFilter.includes(mapActivityType(a.type)))
      .map((a) => {
        const date = new Date(a.scheduledAt);
        return {
          id: a.id,
          title: a.title,
          client: a.clientName,
          type: mapActivityType(a.type),
          start: date.getHours() + date.getMinutes() / 60,
          duration: (a.durationMinutes ?? 60) / 60,
          date,
        };
      })
      .filter((e) => e.date.getTime() >= startMs && e.date.getTime() < endMs)
      .map((e) => ({ ...e, day: Math.round((e.date.getTime() - startMs) / 86400000) }));
  }, [activities, monday, typeFilter]);

  const getFrenchMonth = (date: Date) => date.toLocaleDateString("fr-FR", { month: "long" });

  const weekLabel = useMemo(() => {
    const startDay = daysOfWeek[0];
    const endDay = daysOfWeek[6];
    if (startDay.getMonth() === endDay.getMonth()) {
      return `${startDay.getDate()} – ${endDay.getDate()} ${getFrenchMonth(startDay)} ${startDay.getFullYear()}`;
    }
    return `${startDay.getDate()} ${getFrenchMonth(startDay)} – ${endDay.getDate()} ${getFrenchMonth(endDay)} ${endDay.getFullYear()}`;
  }, [daysOfWeek]);

  const getWeekNumber = (d: Date) => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  };

  const subtitle = useMemo(() => {
    const startDay = daysOfWeek[0];
    const monthName = getFrenchMonth(startDay);
    return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${startDay.getFullYear()} — Semaine ${getWeekNumber(startDay)}`;
  }, [daysOfWeek]);

  const toggleType = (t: EventType) =>
    setTypeFilter((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Calendrier</h1>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Filter className="h-4 w-4 mr-1" /> Activités
                <span className="ml-1.5 text-[10px] font-bold px-1.5 rounded-full bg-primary/10 text-primary">
                  {typeFilter.length}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-2">
              <div className="text-[11px] font-semibold uppercase text-muted-foreground px-2 py-1.5">
                Filtrer par type
              </div>
              {ALL_TYPES.map((t) => {
                const active = typeFilter.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => toggleType(t)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-muted transition-colors"
                  >
                    <span
                      className={`h-4 w-4 rounded border grid place-items-center ${active ? "bg-primary border-primary text-white" : "border-input"}`}
                    >
                      {active && <Check className="h-3 w-3" />}
                    </span>
                    <span className={`h-2.5 w-2.5 rounded-sm ${typeSwatch[t]}`} />
                    <span className="flex-1 text-left">{typeLabels[t]}</span>
                  </button>
                );
              })}
              <div className="border-t border-border mt-1 pt-1 flex gap-1">
                <button
                  onClick={() => setTypeFilter([...ALL_TYPES])}
                  className="flex-1 text-xs font-semibold text-primary hover:bg-primary/10 rounded py-1"
                >
                  Tout
                </button>
                <button
                  onClick={() => setTypeFilter([])}
                  className="flex-1 text-xs font-semibold text-muted-foreground hover:bg-muted rounded py-1"
                >
                  Aucun
                </button>
              </div>
            </PopoverContent>
          </Popover>
          <NewEventDialog />
        </div>
      </div>

      <div className="card-elegant p-4">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() =>
                setRefDate((d) => {
                  const n = new Date(d);
                  n.setDate(n.getDate() - 7);
                  return n;
                })
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => {
                setRefDate(INITIAL_DATE);
                setIsCustomDate(false);
              }}
            >
              Aujourd'hui
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() =>
                setRefDate((d) => {
                  const n = new Date(d);
                  n.setDate(n.getDate() + 7);
                  return n;
                })
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <input
              type="date"
              className="h-9 px-2 rounded-md border border-input text-xs bg-card outline-none focus:border-ring"
              value={toInputDate(refDate)}
              onChange={(e) => {
                if (e.target.value) {
                  const [y, m, d] = e.target.value.split("-").map(Number);
                  setRefDate(new Date(y, m - 1, d));
                  setIsCustomDate(true);
                }
              }}
            />
            {isCustomDate && (
              <Button
                variant="ghost"
                size="sm"
                title="Effacer la date"
                className="h-9 w-9 p-0"
                onClick={() => {
                  setRefDate(INITIAL_DATE);
                  setIsCustomDate(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <span className="ml-3 font-display font-semibold">{weekLabel}</span>
          </div>

          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted">
            {(["Jour", "Semaine", "Mois", "Liste"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`h-8 px-3 rounded-md text-xs font-semibold transition-all ${view === v ? "bg-card shadow-sm" : "text-muted-foreground"}`}
              >
                {v}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs">
            <LegendDot color="bg-blue-500" label="Appels" />
            <LegendDot color="bg-violet-500" label="Rendez-vous" />
            <LegendDot color="bg-rose-500" label="Relances" />
            <LegendDot color="bg-emerald-500" label="Tâches" />
          </div>
        </div>

        {isError ? (
          <div className="p-10 text-center text-sm text-destructive">
            {error instanceof ApiError ? error.message : "Impossible de charger le calendrier."}
          </div>
        ) : isLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : view === "Liste" ? (
          <ListView events={visibleEvents} days={days} />
        ) : view === "Jour" ? (
          <DayView
            dayLabel={days[activeDayIdx]}
            events={visibleEvents}
            dayIdx={activeDayIdx}
            hours={hours}
          />
        ) : view !== "Mois" ? (
          <div className="overflow-x-auto scrollbar-thin">
            <div className="min-w-[900px]">
              <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border">
                <div />
                {days.map((d, i) => (
                  <div
                    key={d}
                    className={`px-2 py-3 text-center ${i === 0 ? "bg-primary/5 rounded-t-lg" : ""}`}
                  >
                    <div className="text-[11px] text-muted-foreground uppercase">
                      {d.split(" ")[0]}
                    </div>
                    <div className={`text-lg font-bold ${i === 0 ? "text-primary" : ""}`}>
                      {d.split(" ")[1]}
                    </div>
                  </div>
                ))}
              </div>
              <div className="relative grid grid-cols-[60px_repeat(7,1fr)]">
                <div>
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="h-16 pr-2 text-right text-[10px] text-muted-foreground pt-1"
                    >
                      {h}:00
                    </div>
                  ))}
                </div>
                {days.map((_d, dayIdx) => (
                  <div
                    key={dayIdx}
                    className={`relative border-l border-border ${dayIdx === 0 ? "bg-primary/[0.02]" : ""}`}
                  >
                    {hours.map((h) => (
                      <div key={h} className="h-16 border-b border-border/60" />
                    ))}
                    {visibleEvents
                      .filter((e) => e.day === dayIdx)
                      .map((e) => {
                        const top = (e.start - 8) * 64;
                        const height = Math.max(24, e.duration * 64 - 4);
                        return (
                          <Popover key={e.id}>
                            <PopoverTrigger asChild>
                              <div
                                className={`absolute left-1 right-1 rounded-lg border-l-2 p-2 text-[11px] shadow-elegant cursor-pointer hover:shadow-float transition ${eventColors[e.type]}`}
                                style={{ top: `${top}px`, height: `${height}px` }}
                              >
                                <div className="font-semibold leading-tight truncate">
                                  {e.title}
                                </div>
                                <div className="opacity-80 truncate mt-0.5">{e.client}</div>
                              </div>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-80 p-4 bg-card text-foreground shadow-xl border border-border rounded-lg"
                              side="top"
                              align="center"
                            >
                              <EventDetails e={e} />
                            </PopoverContent>
                          </Popover>
                        );
                      })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <MonthView activities={activities} refDate={refDate} typeFilter={typeFilter} />
        )}
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <span className={`h-2.5 w-2.5 rounded-sm ${color}`} /> {label}
    </span>
  );
}

function MonthView({
  activities,
  refDate,
  typeFilter,
}: {
  activities: ActivityDto[];
  refDate: Date;
  typeFilter: EventType[];
}) {
  const year = refDate.getFullYear();
  const month = refDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // Monday-first offset
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const byDay = useMemo(() => {
    const map = new Map<number, ActivityDto[]>();
    activities
      .filter((a) => typeFilter.includes(mapActivityType(a.type)))
      .forEach((a) => {
        const d = new Date(a.scheduledAt);
        if (d.getFullYear() === year && d.getMonth() === month) {
          const list = map.get(d.getDate()) ?? [];
          list.push(a);
          map.set(d.getDate(), list);
        }
      });
    return map;
  }, [activities, typeFilter, year, month]);

  const cells = Array.from(
    { length: Math.ceil((startOffset + daysInMonth) / 7) * 7 },
    (_, i) => i - startOffset + 1,
  );

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-border">
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
          <div
            key={d}
            className="px-2 py-2 text-[11px] font-semibold text-muted-foreground uppercase text-center"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 auto-rows-[100px]">
        {cells.map((dayNum, i) => {
          const outside = dayNum < 1 || dayNum > daysInMonth;
          const isToday =
            !outside &&
            dayNum === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();
          const dayActs = outside ? [] : (byDay.get(dayNum) ?? []);

          return (
            <div
              key={i}
              className={`border-r border-b border-border p-2 hover:bg-muted/20 ${outside ? "bg-muted/10" : ""}`}
            >
              <div
                className={`text-xs font-semibold ${isToday ? "h-6 w-6 rounded-full bg-primary text-white grid place-items-center" : outside ? "text-muted-foreground/50" : ""}`}
              >
                {outside ? "" : dayNum}
              </div>
              {dayActs.length > 0 && (
                <div className="mt-1 space-y-1 overflow-y-auto max-h-[60px] scrollbar-thin">
                  {dayActs.map((act) => {
                    const t = mapActivityType(act.type);
                    return (
                      <div
                        key={act.id}
                        className={`text-[9px] px-1.5 py-0.5 rounded ${typeBadge[t]} truncate`}
                        title={act.title}
                      >
                        {new Date(act.scheduledAt).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        {act.title}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ListView({ events, days }: { events: Event[]; days: string[] }) {
  if (events.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
        <p className="text-sm text-muted-foreground">Aucun événement pour ces filtres.</p>
      </div>
    );
  }
  const grouped = days.map((d, idx) => ({
    day: d,
    idx,
    items: events.filter((e) => e.day === idx).sort((a, b) => a.start - b.start),
  }));

  return (
    <div className="space-y-5">
      {grouped.map(
        (g) =>
          g.items.length > 0 && (
            <div key={g.idx}>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`h-7 px-2 rounded-md grid place-items-center text-[11px] font-bold ${g.idx === 0 ? "bg-primary text-white" : "bg-primary/10 text-primary"}`}
                >
                  {g.day}
                </div>
                <div className="h-px flex-1 bg-border" />
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                  {g.items.length} évén.
                </span>
              </div>
              <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
                {g.items.map((e) => (
                  <Popover key={e.id}>
                    <PopoverTrigger asChild>
                      <div className="flex items-center gap-4 p-3 hover:bg-muted/30 transition-colors cursor-pointer">
                        <div className="text-xs font-mono font-semibold text-muted-foreground w-24 shrink-0">
                          {fmtTime(e.start)} – {fmtTime(e.start + e.duration)}
                        </div>
                        <ActivityIcon type={e.type} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">{e.title}</div>
                          <div className="text-xs text-muted-foreground truncate">{e.client}</div>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                          {typeLabels[e.type]}
                        </span>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-80 p-4 bg-card text-foreground shadow-xl border border-border rounded-lg"
                      side="top"
                      align="center"
                    >
                      <EventDetails e={e} />
                    </PopoverContent>
                  </Popover>
                ))}
              </div>
            </div>
          ),
      )}
    </div>
  );
}

function DayView({
  dayLabel,
  events,
  dayIdx,
  hours,
}: {
  dayLabel: string;
  events: Event[];
  dayIdx: number;
  hours: number[];
}) {
  const dayEvents = events.filter((e) => e.day === dayIdx);
  return (
    <div>
      <div className="flex items-center gap-2 px-2 py-3 border-b border-border bg-primary/5 rounded-t-lg">
        <div className="text-[11px] text-muted-foreground uppercase">{dayLabel.split(" ")[0]}</div>
        <div className="text-lg font-bold text-primary">{dayLabel.split(" ")[1]}</div>
      </div>
      <div className="relative grid grid-cols-[60px_1fr]">
        <div>
          {hours.map((h) => (
            <div key={h} className="h-16 pr-2 text-right text-[10px] text-muted-foreground pt-1">
              {h}:00
            </div>
          ))}
        </div>
        <div className="relative border-l border-border bg-primary/[0.02]">
          {hours.map((h) => (
            <div key={h} className="h-16 border-b border-border/60" />
          ))}
          {dayEvents.map((e) => {
            const top = (e.start - 8) * 64;
            const height = Math.max(24, e.duration * 64 - 4);
            return (
              <Popover key={e.id}>
                <PopoverTrigger asChild>
                  <div
                    className={`absolute left-1 right-1 rounded-lg border-l-2 p-2 text-[11px] shadow-elegant cursor-pointer hover:shadow-float transition ${eventColors[e.type]}`}
                    style={{ top: `${top}px`, height: `${height}px` }}
                  >
                    <div className="font-semibold leading-tight truncate">{e.title}</div>
                    <div className="opacity-80 truncate mt-0.5">{e.client}</div>
                  </div>
                </PopoverTrigger>
                <PopoverContent
                  className="w-80 p-4 bg-card text-foreground shadow-xl border border-border rounded-lg"
                  side="top"
                  align="center"
                >
                  <EventDetails e={e} />
                </PopoverContent>
              </Popover>
            );
          })}
        </div>
      </div>
    </div>
  );
}
