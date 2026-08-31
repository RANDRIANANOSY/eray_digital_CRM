import { usePageMeta } from "@/hooks/use-page-meta";
import { useState } from "react";
import {
  Filter,
  MoreHorizontal,
  Calendar as CalendarIcon,
  Eye,
  Edit,
  Trash2,
  X,
  CheckCircle2,
  Briefcase,
  Bell,
  User,
} from "lucide-react";
import {
  useActivities,
  useCreateActivity,
  useDeleteActivity,
  useUpdateActivity,
} from "@/hooks/api/useActivities";
import { useUsers } from "@/hooks/api/useUsers";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityIcon, StatusBadge, PriorityDot } from "@/components/crm-atoms";
import { NewActivityDialog } from "@/components/new-activity-dialog";
import { ConfirmDialog, type ConfirmDialogState } from "@/components/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { computeReminderAt } from "@/lib/reminder";
import type { ActivityDto, ActivityStatus, ActivityType, Priority } from "@/lib/api/types";

const types: { label: string; value: ActivityType | "Toutes" }[] = [
  { label: "Toutes", value: "Toutes" },
  { label: "Appel", value: "call" },
  { label: "Rendez-vous", value: "meeting" },
  { label: "Email", value: "email" },
  { label: "Devis", value: "quote" },
  { label: "Contrat", value: "contract" },
  { label: "Visite", value: "visit" },
  { label: "Note", value: "note" },
  { label: "Relance", value: "follow-up" },
  { label: "Tâche", value: "task" },
  { label: "WhatsApp", value: "whatsapp" },
];

const typeLabel: Record<string, string> = Object.fromEntries(types.map((t) => [t.value, t.label]));

const REMINDER_PRESETS = [
  { value: "Aucun", label: "Aucun" },
  { value: "0 min", label: "Au moment de l'événement" },
  { value: "5 min avant", label: "5 minutes avant" },
  { value: "10 min avant", label: "10 minutes avant" },
  { value: "15 min avant", label: "15 minutes avant" },
  { value: "30 min avant", label: "30 minutes avant" },
  { value: "1 h avant", label: "1 heure avant" },
  { value: "2 h avant", label: "2 heures avant" },
  { value: "1 jour avant", label: "1 jour avant" },
  { value: "2 jours avant", label: "2 jours avant" },
  { value: "1 semaine avant", label: "1 semaine avant" },
  { value: "custom", label: "Personnalisé…" },
];

const PER_PAGE = 15;

function errorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : "Une erreur est survenue. Veuillez réessayer.";
}

export default function ActivitiesPage() {
  usePageMeta("Activités — Eray CRM", "Suivez toutes les activités commerciales.");

  const [active, setActive] = useState<ActivityType | "Toutes">("Toutes");
  const [selectedStatus, setSelectedStatus] = useState<ActivityStatus | "">("");
  const [selectedPriority, setSelectedPriority] = useState<Priority | "">("");
  const [selectedOwner, setSelectedOwner] = useState<number | undefined>(undefined);
  const [sort, setSort] = useState<"scheduledAt" | "createdAt">("scheduledAt");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const [selectedAct, setSelectedAct] = useState<ActivityDto | null>(null);
  const [dialogType, setDialogType] = useState<"details" | "edit" | null>(null);
  const [workflowParent, setWorkflowParent] = useState<ActivityDto | null>(null);
  const [confirm, setConfirm] = useState<ConfirmDialogState | null>(null);

  const { data: usersData } = useUsers();
  const { data, isLoading, isError, error } = useActivities({
    type: active === "Toutes" ? undefined : [active],
    status: selectedStatus ? [selectedStatus] : undefined,
    owner: selectedOwner,
    sort,
    dir,
    page,
    perPage: PER_PAGE,
  });
  const filteredItems = selectedPriority
    ? (data?.items.filter((a) => a.priority === selectedPriority) ?? [])
    : (data?.items ?? []);

  const deleteActivity = useDeleteActivity();
  const updateActivity = useUpdateActivity();

  const hasActiveFilters =
    active !== "Toutes" ||
    selectedStatus !== "" ||
    selectedPriority !== "" ||
    selectedOwner !== undefined;

  const resetFilters = () => {
    setActive("Toutes");
    setSelectedStatus("");
    setSelectedPriority("");
    setSelectedOwner(undefined);
    setPage(1);
  };

  const handleDelete = async (a: ActivityDto) => {
    setConfirm({
      title: "Supprimer l'activité",
      description: `Voulez-vous vraiment supprimer "${a.title}" ? Cette action est irréversible.`,
      confirmLabel: "Supprimer",
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteActivity.mutateAsync(a.id);
          toast.success("Activité supprimée");
        } catch (err) {
          toast.error("Suppression impossible", { description: errorMessage(err) });
        }
      },
    });
  };

  const handleToggleStatus = async (a: ActivityDto, newStatus: ActivityStatus) => {
    try {
      await updateActivity.mutateAsync({
        id: a.id,
        payload: {
          type: a.type,
          title: a.title,
          clientId: a.clientId,
          scheduledAt: a.scheduledAt,
          durationMinutes: a.durationMinutes,
          status: newStatus,
          priority: a.priority,
          summary: a.summary,
          result: newStatus === "terminé" ? "Complété" : null,
          reminderAt: a.reminderAt,
        },
      });
      toast.success(`Statut mis à jour : ${newStatus}`);
      if (newStatus === "terminé") setTimeout(() => setWorkflowParent(a), 100);
    } catch (err) {
      toast.error("Mise à jour impossible", { description: errorMessage(err) });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Activités</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data ? `${data.meta.total} activités` : "Chargement…"}
          </p>
        </div>
        <NewActivityDialog />
      </div>

      {/* Type filters */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-1">
        {types.map((t) => (
          <button
            key={t.value}
            onClick={() => {
              setActive(t.value);
              setPage(1);
            }}
            className={`h-9 px-3.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              active === t.value
                ? "gradient-brand text-white shadow-elegant"
                : "bg-muted/60 text-foreground/70 hover:bg-muted"
            }`}
          >
            {t.label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2 shrink-0">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "scheduledAt" | "createdAt")}
            className="h-9 px-2 rounded-lg text-xs font-medium border bg-muted/60 border-transparent"
          >
            <option value="scheduledAt">Trier par date</option>
            <option value="createdAt">Trier par création</option>
          </select>
          <button
            onClick={() => setDir((d) => (d === "asc" ? "desc" : "asc"))}
            className="h-9 px-3 rounded-lg text-xs font-medium border bg-muted/60 border-transparent hover:bg-muted"
          >
            {dir === "asc" ? "↑ Croissant" : "↓ Décroissant"}
          </button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Filter className="h-4 w-4 mr-1" /> Filtres
                {(selectedStatus || selectedPriority || selectedOwner) && (
                  <span className="ml-1.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-64 p-3 space-y-3 bg-card border border-border rounded-lg shadow-xl z-50"
            >
              <div className="text-[11px] font-semibold uppercase text-muted-foreground">
                Filtres avancés
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80">Statut</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value as ActivityStatus | "");
                    setPage(1);
                  }}
                  className="w-full h-8 rounded-md border border-input px-2 text-xs outline-none bg-background text-foreground/80 focus:border-ring"
                >
                  <option value="">Tous les statuts</option>
                  <option value="planifié">Planifié</option>
                  <option value="terminé">Terminé</option>
                  <option value="en retard">En retard</option>
                  <option value="à faire">À faire</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80">Priorité</label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value as Priority | "")}
                  className="w-full h-8 rounded-md border border-input px-2 text-xs outline-none bg-background text-foreground/80 focus:border-ring"
                >
                  <option value="">Toutes les priorités</option>
                  <option value="low">Basse</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                </select>
                <p className="text-[10px] text-muted-foreground">
                  Filtré côté client sur la page affichée.
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80">Responsable</label>
                <select
                  value={selectedOwner ?? ""}
                  onChange={(e) => {
                    setSelectedOwner(e.target.value ? Number(e.target.value) : undefined);
                    setPage(1);
                  }}
                  className="w-full h-8 rounded-md border border-input px-2 text-xs outline-none bg-background text-foreground/80 focus:border-ring"
                >
                  <option value="">Tous les responsables</option>
                  {usersData?.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName}
                    </option>
                  ))}
                </select>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="w-full mt-2 text-center text-xs font-semibold text-muted-foreground hover:text-foreground py-1.5 bg-muted rounded"
                >
                  Réinitialiser
                </button>
              )}
            </PopoverContent>
          </Popover>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground font-semibold inline-flex items-center gap-1"
            >
              <X className="h-4 w-4" /> Effacer
            </Button>
          )}
        </div>
      </div>

      {/* List */}
      {isError ? (
        <div className="card-elegant p-10 text-center text-sm text-destructive">
          {errorMessage(error)}
        </div>
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-xl bg-card">
          <p className="text-sm text-muted-foreground">
            Aucune activité disponible avec les filtres sélectionnés.
          </p>
        </div>
      ) : (
        <div className="card-elegant divide-y divide-border">
          {filteredItems.map((a) => (
            <div
              key={a.id}
              className="px-4 py-3 flex items-start gap-4 hover:bg-muted/30 transition-colors group"
            >
              <div className="shrink-0 mt-0.5">
                <ActivityIcon type={a.type} />
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-center gap-1 overflow-hidden">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-semibold text-sm truncate" title={a.title}>
                    {a.title}
                  </h4>
                  <StatusBadge status={a.status} />
                  <PriorityDot priority={a.priority} />
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground overflow-hidden whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 text-foreground/80 font-medium shrink-0">
                    <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
                    {new Date(a.scheduledAt).toLocaleString("fr-FR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                  <span className="shrink-0">•</span>
                  <span className="font-semibold text-foreground/80 inline-flex items-center gap-1 truncate min-w-0">
                    <Briefcase className="h-3 w-3 shrink-0" />
                    <span className="truncate">{a.clientName}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Assigné à :</span>
                  <span className="font-semibold text-foreground/80 inline-flex items-center gap-1">
                    <User className="h-3 w-3" /> {a.ownerName}
                  </span>
                </div>
                {(a.result || a.summary) &&
                  (a.result ? (
                    <p className="text-[11px] text-emerald-800 bg-emerald-50 inline-flex items-center px-2 py-0.5 rounded border border-emerald-200 truncate max-w-full w-fit">
                      ✓ {a.result}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground border-l-2 border-primary/30 bg-muted/40 pl-3 py-1 pr-2 rounded-r-md truncate">
                      {a.summary}
                    </p>
                  ))}
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-violet text-white text-[10px] font-semibold">
                    {a.ownerName
                      .split(" ")
                      .map((s) => s[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {a.status !== "terminé" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] font-semibold border-emerald-500/30 text-emerald-700 bg-emerald-50/40 hover:bg-emerald-500 hover:text-white px-2"
                      onClick={() => handleToggleStatus(a, "terminé")}
                    >
                      Terminer
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] font-semibold px-2"
                      onClick={() => handleToggleStatus(a, "à faire")}
                    >
                      Rouvrir
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedAct(a);
                          setDialogType("details");
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" /> Voir les détails
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedAct(a);
                          setDialogType("edit");
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" /> Modifier
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:bg-destructive/10"
                        onClick={() => handleDelete(a)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {data && data.meta.totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setPage((p) => Math.max(1, p - 1));
                }}
                className={page <= 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {Array.from({ length: data.meta.totalPages }, (_, i) => i + 1).map((p) => (
              <PaginationItem key={p}>
                <PaginationLink
                  href="#"
                  isActive={p === page}
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(p);
                  }}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setPage((p) => Math.min(data.meta.totalPages, p + 1));
                }}
                className={page >= data.meta.totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {selectedAct && dialogType === "details" && (
        <Dialog open onOpenChange={(open) => !open && setDialogType(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Détails de l'activité</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedAct.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedAct.clientName} • par {selectedAct.ownerName}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 rounded-xl">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Type</div>
                  <div className="font-medium mt-1 flex items-center gap-2">
                    <ActivityIcon type={selectedAct.type} size="sm" />
                    {typeLabel[selectedAct.type] ?? selectedAct.type}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">
                    Date & Heure
                  </div>
                  <div className="font-medium mt-1">
                    {new Date(selectedAct.scheduledAt).toLocaleString("fr-FR")}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">
                    Statut
                  </div>
                  <div className="font-medium mt-1">
                    <StatusBadge status={selectedAct.status} />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">
                    Priorité
                  </div>
                  <div className="font-medium mt-1 capitalize">
                    <PriorityDot priority={selectedAct.priority} /> {selectedAct.priority}
                  </div>
                </div>
                {selectedAct.reminderAt && (
                  <div className="col-span-2 border-t border-border/40 pt-2.5 mt-1">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                      <Bell className="h-3.5 w-3.5 text-primary" /> Rappel planifié
                    </div>
                    <div className="font-medium mt-1 text-sm text-foreground">
                      {new Date(selectedAct.reminderAt).toLocaleString("fr-FR")}
                    </div>
                  </div>
                )}
              </div>
              {selectedAct.summary && (
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                    Notes
                  </div>
                  <p className="text-sm bg-muted/30 p-3 rounded-lg border border-border">
                    {selectedAct.summary}
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {selectedAct && dialogType === "edit" && (
        <EditActivityDialog
          activity={selectedAct}
          onClose={() => {
            setDialogType(null);
            setSelectedAct(null);
          }}
        />
      )}

      {workflowParent && (
        <WorkflowDialog parent={workflowParent} onClose={() => setWorkflowParent(null)} />
      )}

      <ConfirmDialog
        open={confirm !== null}
        state={confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
      />
    </div>
  );
}

function EditActivityDialog({ activity, onClose }: { activity: ActivityDto; onClose: () => void }) {
  const updateActivity = useUpdateActivity();
  const [title, setTitle] = useState(activity.title);
  const [status, setStatus] = useState<ActivityStatus>(activity.status);
  const [priority, setPriority] = useState<Priority>(activity.priority);
  const [date, setDate] = useState(activity.scheduledAt.slice(0, 10));
  const [time, setTime] = useState(activity.scheduledAt.slice(11, 16));
  const [summary, setSummary] = useState(activity.summary ?? "");
  const [reminderPreset, setReminderPreset] = useState("Aucun");
  const [customVal, setCustomVal] = useState("15");
  const [customUnit, setCustomUnit] = useState("minutes");

  const handleSave = async () => {
    const scheduledAt = new Date(`${date}T${time}`);
    try {
      await updateActivity.mutateAsync({
        id: activity.id,
        payload: {
          type: activity.type,
          title,
          clientId: activity.clientId,
          scheduledAt: scheduledAt.toISOString(),
          durationMinutes: activity.durationMinutes,
          status,
          priority,
          summary: summary || null,
          result: activity.result,
          reminderAt: computeReminderAt(scheduledAt, reminderPreset, customVal, customUnit),
        },
      });
      toast.success("Activité modifiée");
      onClose();
    } catch (err) {
      toast.error("Modification impossible", { description: errorMessage(err) });
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier l'activité</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <Label>Titre</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-2" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Heure</Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Statut</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ActivityStatus)}
                className="mt-2 w-full h-10 rounded-lg border border-input px-3 text-sm outline-none bg-card"
              >
                <option value="planifié">Planifié</option>
                <option value="terminé">Terminé</option>
                <option value="en retard">En retard</option>
                <option value="à faire">À faire</option>
              </select>
            </div>
            <div>
              <Label>Priorité</Label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="mt-2 w-full h-10 rounded-lg border border-input px-3 text-sm outline-none bg-card"
              >
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
              </select>
            </div>
          </div>
          <div>
            <Label className="flex items-center gap-1">
              <Bell className="h-3.5 w-3.5 text-primary" /> Rappel
            </Label>
            <select
              value={reminderPreset}
              onChange={(e) => setReminderPreset(e.target.value)}
              className="mt-2 w-full h-10 rounded-lg border border-input px-3 text-sm outline-none bg-card"
            >
              {REMINDER_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            {reminderPreset === "custom" && (
              <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-border flex gap-2 items-center">
                <input
                  type="number"
                  min="1"
                  value={customVal}
                  onChange={(e) => setCustomVal(e.target.value)}
                  className="w-20 h-9 rounded-md border border-input px-2 text-sm outline-none bg-card"
                />
                <select
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  className="flex-1 h-9 rounded-md border border-input px-2 text-sm outline-none bg-card"
                >
                  <option value="minutes">Minutes</option>
                  <option value="heures">Heures</option>
                  <option value="jours">Jours</option>
                  <option value="semaines">Semaines</option>
                </select>
              </div>
            )}
          </div>
          <div>
            <Label>Notes</Label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="mt-2 w-full min-h-[80px] rounded-lg border border-input p-3 text-sm outline-none bg-card"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateActivity.isPending}
            className="gradient-brand text-white border-0"
          >
            {updateActivity.isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const WORKFLOW_ACTIONS = [
  {
    id: "relance",
    label: "Créer une Relance",
    desc: "Planifier un appel de suivi",
    emoji: "📞",
    type: "follow-up" as ActivityType,
  },
  {
    id: "rdv",
    label: "Planifier un RDV",
    desc: "Ajouter au calendrier",
    emoji: "📅",
    type: "meeting" as ActivityType,
  },
  {
    id: "devis",
    label: "Envoyer un Devis",
    desc: "Relancer avec une proposition",
    emoji: "📄",
    type: "quote" as ActivityType,
  },
  {
    id: "note",
    label: "Ajouter une Note",
    desc: "Compte-rendu ou mémo",
    emoji: "📝",
    type: "note" as ActivityType,
  },
];

function WorkflowDialog({ parent, onClose }: { parent: ActivityDto; onClose: () => void }) {
  const createActivity = useCreateActivity();
  const [actionType, setActionType] = useState<(typeof WORKFLOW_ACTIONS)[number] | null>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");

  const selectAction = (action: (typeof WORKFLOW_ACTIONS)[number]) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setActionType(action);
    setTitle(
      `${action.label.replace("Créer une ", "").replace("Planifier un ", "").replace("Envoyer un ", "").replace("Ajouter une ", "")} — ${parent.clientName}`,
    );
    setNotes(`Suite à : "${parent.title}"`);
    setDate(tomorrow.toISOString().slice(0, 10));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionType) return;
    try {
      await createActivity.mutateAsync({
        type: actionType.type,
        title,
        clientId: parent.clientId,
        scheduledAt: new Date(`${date}T${time}`).toISOString(),
        status: "à faire",
        priority: "medium",
        summary: notes || null,
      });
      toast.success("Activité créée", { description: `"${title}" a été ajoutée.` });
      onClose();
    } catch (err) {
      toast.error("Création impossible", { description: errorMessage(err) });
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400/20 to-primary/15 border border-amber-400/30 flex items-center justify-center text-lg shrink-0">
              🎉
            </span>
            Activité terminée !
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground truncate">{parent.title}</div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                <Briefcase className="h-3 w-3" /> {parent.clientName}
              </div>
            </div>
          </div>

          {!actionType ? (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Que souhaitez-vous planifier ensuite ?
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {WORKFLOW_ACTIONS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => selectAction(a)}
                    className="p-4 border border-border rounded-xl text-left bg-card hover:border-primary/30 hover:shadow-md transition-all flex flex-col gap-2"
                  >
                    <span className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-base">
                      {a.emoji}
                    </span>
                    <span className="text-sm font-semibold text-foreground">{a.label}</span>
                    <span className="text-[11px] text-muted-foreground">{a.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                  {actionType.label}
                </span>
                <button
                  type="button"
                  onClick={() => setActionType(null)}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  ← Retour
                </button>
              </div>
              <div>
                <Label className="text-xs font-semibold text-foreground/80">Titre</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="mt-1.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-foreground/80">Date</Label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="mt-1.5 w-full h-10 rounded-lg border border-input px-3 text-sm bg-card outline-none"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-foreground/80">Heure</Label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    className="mt-1.5 w-full h-10 rounded-lg border border-input px-3 text-sm bg-card outline-none"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold text-foreground/80">Notes</Label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1.5 w-full min-h-[80px] rounded-lg border border-input p-3 text-sm outline-none bg-card"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={createActivity.isPending}
                  className="gradient-brand text-white border-0"
                >
                  {createActivity.isPending ? "Création…" : "Créer l'activité"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
