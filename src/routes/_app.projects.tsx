import { usePageMeta } from "@/hooks/use-page-meta";
import { useMemo, useState } from "react";
import {
  Plus,
  Filter,
  Calendar as CalendarIcon,
  Check,
  Users,
  Search,
  X,
  Trash2,
} from "lucide-react";
import type {
  ProjectDto,
  ProjectStatus,
  ProjectTaskDto,
  ProjectTaskStatus,
  Priority,
} from "@/lib/api/types";
import { useDeleteProject, useProjects } from "@/hooks/api/useProjects";
import {
  useCreateProjectTask,
  useDeleteProjectTask,
  useProjectTasks,
  useUpdateProjectTask,
} from "@/hooks/api/useProjectTasks";
import { useUsers } from "@/hooks/api/useUsers";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NewProjectDialog } from "@/components/quick-create-dialogs";
import { ConfirmDialog, type ConfirmDialogState } from "@/components/confirm-dialog";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";

const statusMap: Record<ProjectStatus, string> = {
  "En cours": "bg-blue-500/10 text-blue-700 border-blue-200",
  "En attente": "bg-amber-500/10 text-amber-700 border-amber-200",
  Suspendu: "bg-rose-500/10 text-rose-700 border-rose-200",
  Terminé: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
};
const ALL_PROJECT_STATUSES: ProjectStatus[] = ["En cours", "En attente", "Suspendu", "Terminé"];

const taskStatuses: ProjectTaskStatus[] = ["À faire", "En cours", "Terminé", "En retard"];
const taskStatusColors: Record<ProjectTaskStatus, string> = {
  "À faire": "bg-slate-400",
  "En cours": "bg-blue-500",
  Terminé: "bg-emerald-500",
  "En retard": "bg-rose-500",
};

function errorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : "Une erreur est survenue. Veuillez réessayer.";
}

export default function ProjectsPage() {
  usePageMeta("Projets — Eray CRM", "Suivi des projets clients.");
  const [query, setQuery] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState<ProjectStatus[]>([]);
  const [memberFilter, setMemberFilter] = useState<number[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectDto | null>(null);

  const { data: usersData } = useUsers();
  const { data, isLoading, isError, error } = useProjects({
    status: projectStatusFilter.length ? projectStatusFilter : undefined,
    perPage: 100,
  });
  const deleteProject = useDeleteProject();
  const [confirm, setConfirm] = useState<ConfirmDialogState | null>(null);

  const filtered = useMemo(() => {
    const items = data?.items ?? [];
    return items.filter((p) => {
      const matchesQuery =
        !query ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.clientName.toLowerCase().includes(query.toLowerCase());
      const matchesMember =
        memberFilter.length === 0 || p.teamMembers.some((m) => memberFilter.includes(m.id));
      return matchesQuery && matchesMember;
    });
  }, [data, query, memberFilter]);

  const toggleMember = (id: number) =>
    setMemberFilter((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleDeleteProject = async (p: ProjectDto) => {
    setConfirm({
      title: "Supprimer le projet",
      description: `Voulez-vous vraiment supprimer le projet "${p.name}" ? Cette action est irréversible.`,
      confirmLabel: "Supprimer",
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteProject.mutateAsync(p.id);
          setSelectedProject(null);
          toast.success("Projet supprimé");
        } catch (err) {
          toast.error("Suppression impossible", { description: errorMessage(err) });
        }
      },
    });
  };

  const hasFilters = query !== "" || projectStatusFilter.length > 0 || memberFilter.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Projets clients</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data ? `${filtered.length} projets` : "Chargement…"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un projet, client…"
              className="h-9 pl-9 pr-3 rounded-lg bg-muted/60 border border-transparent focus:bg-card focus:border-ring outline-none text-sm w-48"
            />
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Filter className="h-4 w-4 mr-1" /> Statut
                {projectStatusFilter.length > 0 && (
                  <span className="ml-1.5 text-[10px] font-bold px-1.5 rounded-full bg-primary/10 text-primary">
                    {projectStatusFilter.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-56 p-2 bg-card border border-border rounded-lg shadow-xl z-50"
            >
              <div className="text-[11px] font-semibold uppercase text-muted-foreground px-2 py-1.5">
                Statut Projets
              </div>
              {ALL_PROJECT_STATUSES.map((s) => {
                const active = projectStatusFilter.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() =>
                      setProjectStatusFilter((prev) =>
                        prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
                      )
                    }
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-muted"
                  >
                    <span
                      className={`h-4 w-4 rounded border grid place-items-center ${active ? "bg-primary border-primary text-white" : "border-input"}`}
                    >
                      {active && <Check className="h-3 w-3" />}
                    </span>
                    <span className="flex-1 text-left">{s}</span>
                  </button>
                );
              })}
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Users className="h-4 w-4 mr-1" /> Équipe
                {memberFilter.length > 0 && (
                  <span className="ml-1.5 text-[10px] font-bold px-1.5 rounded-full bg-primary/10 text-primary">
                    {memberFilter.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-60 p-2 bg-card border border-border rounded-lg shadow-xl z-50"
            >
              <div className="text-[11px] font-semibold uppercase text-muted-foreground px-2 py-1.5">
                Membres de l'équipe
              </div>
              {usersData?.map((m) => {
                const active = memberFilter.includes(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() => toggleMember(m.id)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-muted"
                  >
                    <span
                      className={`h-4 w-4 rounded border grid place-items-center ${active ? "bg-primary border-primary text-white" : "border-input"}`}
                    >
                      {active && <Check className="h-3 w-3" />}
                    </span>
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-violet text-white text-[9px] font-semibold">
                        {m.fullName
                          .split(" ")
                          .map((s) => s[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-left text-xs">{m.fullName}</span>
                  </button>
                );
              })}
            </PopoverContent>
          </Popover>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery("");
                setProjectStatusFilter([]);
                setMemberFilter([]);
              }}
              className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground font-semibold inline-flex items-center gap-1.5"
            >
              <X className="h-4 w-4" /> Réinitialiser
            </Button>
          )}

          <NewProjectDialog />
        </div>
      </div>

      {isError ? (
        <div className="card-elegant p-10 text-center text-sm text-destructive">
          {errorMessage(error)}
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="card-elegant p-5 hover:shadow-float transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-base leading-tight">{p.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{p.clientName}</p>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${statusMap[p.status]}`}
                  >
                    {p.status}
                  </span>
                </div>

                <div className="mt-5">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-medium">Progression</span>
                    <span className="font-bold text-primary">{p.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full gradient-brand rounded-full transition-all"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-muted-foreground flex items-center gap-1.5">
                      <CalendarIcon className="h-3 w-3" /> Début
                    </div>
                    <div className="font-medium mt-0.5">
                      {new Date(p.startDate).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground flex items-center gap-1.5">
                      <CalendarIcon className="h-3 w-3" /> Fin
                    </div>
                    <div className="font-medium mt-0.5">
                      {p.endDate ? new Date(p.endDate).toLocaleDateString("fr-FR") : "—"}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-[10px] font-semibold uppercase text-muted-foreground mb-2">
                    Tâches ({p.taskCount})
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                <div className="flex items-center -space-x-1.5">
                  {p.teamMembers.map((m) => (
                    <Avatar key={m.id} className="h-7 w-7 ring-2 ring-card" title={m.name}>
                      <AvatarFallback className="bg-gradient-to-br from-primary to-violet text-white text-[10px] font-semibold">
                        {m.name
                          .split(" ")
                          .map((s) => s[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-semibold"
                  onClick={() => setSelectedProject(p)}
                >
                  Ouvrir
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
          <p className="text-sm text-muted-foreground">Aucun projet ne correspond aux filtres.</p>
        </div>
      )}

      {selectedProject && (
        <ProjectDetailPanel
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onDelete={() => handleDeleteProject(selectedProject)}
        />
      )}

      <ConfirmDialog
        open={confirm !== null}
        state={confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
      />
    </div>
  );
}

function ProjectDetailPanel({
  project,
  onClose,
  onDelete,
}: {
  project: ProjectDto;
  onClose: () => void;
  onDelete: () => void;
}) {
  const { data: tasks, isLoading } = useProjectTasks(project.id);
  const { data: usersData } = useUsers();
  const createTask = useCreateProjectTask(project.id);
  const updateTask = useUpdateProjectTask(project.id);
  const deleteTask = useDeleteProjectTask(project.id);

  const [newTaskLabel, setNewTaskLabel] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskDue, setNewTaskDue] = useState("");
  const [confirmTask, setConfirmTask] = useState<ConfirmDialogState | null>(null);

  const handleAddTask = async () => {
    if (!newTaskLabel.trim()) return;
    try {
      await createTask.mutateAsync({
        label: newTaskLabel.trim(),
        status: "À faire",
        assigneeId: newTaskAssignee ? Number(newTaskAssignee) : null,
        dueDate: newTaskDue || null,
        priority: "medium" as Priority,
      });
      setNewTaskLabel("");
      setNewTaskAssignee("");
      setNewTaskDue("");
      toast.success("Tâche créée");
    } catch (err) {
      toast.error("Impossible d'ajouter la tâche", { description: errorMessage(err) });
    }
  };

  const handleStatusChange = async (taskId: number, status: ProjectTaskStatus) => {
    const task = tasks?.find((t) => t.id === taskId);
    if (!task) return;
    try {
      await updateTask.mutateAsync({
        id: taskId,
        payload: {
          label: task.label,
          status,
          assigneeId: task.assigneeId,
          dueDate: task.dueDate,
          priority: task.priority,
          description: task.description,
        },
      });
    } catch (err) {
      toast.error("Mise à jour impossible", { description: errorMessage(err) });
    }
  };

  const handleDeleteTask = async (task: ProjectTaskDto) => {
    setConfirmTask({
      title: "Supprimer la tâche",
      description: `Voulez-vous vraiment supprimer la tâche "${task.label}" ? Cette action est irréversible.`,
      confirmLabel: "Supprimer",
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteTask.mutateAsync(task.id);
        } catch (err) {
          toast.error("Suppression impossible", { description: errorMessage(err) });
        }
      },
    });
  };

  return (
    <Popover open onOpenChange={(o) => !o && onClose()}>
      <PopoverContent
        className="w-full max-w-xl p-6 bg-card border border-border shadow-2xl rounded-2xl z-50"
        align="center"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
          <div>
            <h3 className="text-lg font-bold font-display">{project.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Client : {project.clientName} • Responsable : {project.ownerName}
            </p>
          </div>
          <span
            className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${statusMap[project.status]}`}
          >
            {project.status}
          </span>
        </div>

        <div className="py-4 space-y-4">
          <div>
            <div className="flex justify-between text-xs font-medium mb-1">
              <span>Progression globale</span>
              <span className="font-bold text-primary">{project.progress}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full gradient-brand rounded-full transition-all"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">
              Tâches ({tasks?.length ?? 0})
            </h4>
            {isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                {(tasks ?? []).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition"
                  >
                    <input
                      type="checkbox"
                      checked={t.status === "Terminé"}
                      onChange={() =>
                        handleStatusChange(t.id, t.status === "Terminé" ? "À faire" : "Terminé")
                      }
                      className="h-4 w-4 rounded accent-primary cursor-pointer shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span
                        className={`text-sm block ${t.status === "Terminé" ? "line-through text-muted-foreground" : "font-medium"}`}
                      >
                        {t.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground mt-0.5 block">
                        Assigné à:{" "}
                        <span className="font-semibold text-foreground">
                          {t.assigneeName ?? "—"}
                        </span>
                        {t.dueDate && (
                          <>
                            {" "}
                            • Échéance:{" "}
                            <span className="font-semibold text-foreground">
                              {new Date(t.dueDate).toLocaleDateString("fr-FR")}
                            </span>
                          </>
                        )}
                      </span>
                    </div>
                    <select
                      value={t.status}
                      onChange={(e) =>
                        handleStatusChange(t.id, e.target.value as ProjectTaskStatus)
                      }
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full text-white border-0 outline-none cursor-pointer ${taskStatusColors[t.status]}`}
                    >
                      {taskStatuses.map((s) => (
                        <option key={s} value={s} className="bg-card text-foreground">
                          {s}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleDeleteTask(t)}
                      className="p-1 text-muted-foreground hover:text-destructive rounded transition shrink-0"
                      title="Supprimer la tâche"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {(tasks ?? []).length === 0 && (
                  <p className="text-xs text-muted-foreground py-3 text-center">
                    Aucune tâche pour ce projet.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2 pt-3 border-t border-border mt-3">
            <div className="text-[10px] font-semibold uppercase text-muted-foreground">
              Nouvelle tâche
            </div>
            <input
              value={newTaskLabel}
              onChange={(e) => setNewTaskLabel(e.target.value)}
              placeholder="Nom de la tâche..."
              className="w-full h-9 rounded-lg border border-input px-3 text-xs outline-none bg-card focus:border-ring"
              onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
            />
            <div className="flex gap-2">
              <select
                value={newTaskAssignee}
                onChange={(e) => setNewTaskAssignee(e.target.value)}
                className="flex-1 h-9 rounded-lg border border-input px-2 text-xs outline-none bg-card focus:border-ring"
              >
                <option value="">Assigner à...</option>
                {usersData?.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={newTaskDue}
                onChange={(e) => setNewTaskDue(e.target.value)}
                className="flex-1 h-9 rounded-lg border border-input px-2 text-xs outline-none bg-card focus:border-ring"
              />
              <Button
                size="sm"
                onClick={handleAddTask}
                disabled={createTask.isPending}
                className="h-9 gradient-brand text-white border-0 text-xs px-3"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-border">
          <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={onDelete}>
            Supprimer le projet
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </PopoverContent>

      <ConfirmDialog
        open={confirmTask !== null}
        state={confirmTask}
        onOpenChange={(o) => !o && setConfirmTask(null)}
      />
    </Popover>
  );
}
