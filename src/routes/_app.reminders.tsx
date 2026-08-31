import { usePageMeta } from "@/hooks/use-page-meta";
import { Bell, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ActivityIcon } from "@/components/crm-atoms";
import { useActivities, useUpdateActivity } from "@/hooks/api/useActivities";
import { useOpportunities, useUpdateOpportunity } from "@/hooks/api/useOpportunities";
import { ApiError } from "@/lib/api";
import { OPPORTUNITY_STAGES } from "@/lib/api/types";

const OPEN_STAGES = OPPORTUNITY_STAGES.filter(
  (s) => !["Vente gagnée", "Vente perdue", "Ambassadeur", "Contrat signé"].includes(s),
);

function errorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : "Une erreur est survenue. Veuillez réessayer.";
}

export default function RemindersPage() {
  usePageMeta("Rappels — Eray CRM", "Vos relances et tâches urgentes à effectuer.");

  const { data: activitiesData, isLoading: activitiesLoading } = useActivities({
    status: ["planifié", "à faire", "en retard"],
    sort: "scheduledAt",
    dir: "asc",
    perPage: 50,
  });
  const pendingActivities = activitiesData?.items ?? [];

  const { data: opportunitiesData, isLoading: opportunitiesLoading } = useOpportunities({
    stage: OPEN_STAGES,
    sort: "createdAt",
    dir: "desc",
    perPage: 50,
  });
  const pendingDeals = opportunitiesData?.items.filter((d) => d.nextAction) ?? [];

  const updateActivity = useUpdateActivity();
  const updateOpportunity = useUpdateOpportunity();

  const markActivityDone = async (activity: (typeof pendingActivities)[number]) => {
    try {
      await updateActivity.mutateAsync({
        id: activity.id,
        payload: {
          type: activity.type,
          title: activity.title,
          clientId: activity.clientId,
          scheduledAt: activity.scheduledAt,
          durationMinutes: activity.durationMinutes,
          status: "terminé",
          priority: activity.priority,
          summary: activity.summary,
          result: "Complété",
          reminderAt: activity.reminderAt,
        },
      });
      toast.success("Tâche terminée !");
    } catch (err) {
      toast.error("Impossible de terminer", { description: errorMessage(err) });
    }
  };

  const markDealActionDone = async (deal: (typeof pendingDeals)[number]) => {
    try {
      await updateOpportunity.mutateAsync({
        id: deal.id,
        payload: {
          clientId: deal.clientId,
          amount: deal.amount,
          probability: deal.probability,
          stage: deal.stage,
          nextAction: "Action terminée",
        },
      });
      toast.success("Action opportunité marquée comme terminée.");
    } catch (err) {
      toast.error("Mise à jour impossible", { description: errorMessage(err) });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6 text-primary" /> Centre de rappels
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gérez vos relances urgentes, tâches en retard et prochaines actions.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" /> Tâches & Appels
          </h2>
          {activitiesLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : pendingActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground italic card-elegant p-4">
              Aucune tâche en attente.
            </p>
          ) : (
            <div className="space-y-3">
              {pendingActivities.map((a) => (
                <div
                  key={a.id}
                  className="card-elegant p-4 flex gap-3 items-start group hover:border-primary/30 transition-all"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <ActivityIcon type={a.type} size="sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{a.title}</h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {a.clientName} •{" "}
                      {new Date(a.scheduledAt).toLocaleString("fr-FR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                    {a.reminderAt && (
                      <span className="inline-block mt-1 text-[10px] bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded">
                        Rappel :{" "}
                        {new Date(a.reminderAt).toLocaleString("fr-FR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => markActivityDone(a)}
                    disabled={updateActivity.isPending}
                    className="text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 shrink-0"
                  >
                    <CheckCircle2 className="h-5 w-5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-indigo-500" /> Actions Opportunités
          </h2>
          {opportunitiesLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : pendingDeals.length === 0 ? (
            <p className="text-sm text-muted-foreground italic card-elegant p-4">
              Aucune action en attente sur le pipeline.
            </p>
          ) : (
            <div className="space-y-3">
              {pendingDeals.map((d) => (
                <div
                  key={d.id}
                  className="card-elegant p-4 flex gap-3 items-start group hover:border-primary/30 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">
                      {d.clientName}{" "}
                      <span className="text-muted-foreground font-normal">({d.company})</span>
                    </h3>
                    <p className="text-xs text-primary font-medium truncate mt-1">
                      À faire : {d.nextAction}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{d.stage}</span>
                      {d.closeDate && (
                        <span className="text-[10px] bg-red-500/10 text-red-600 px-1.5 py-0.5 rounded">
                          Clôture : {new Date(d.closeDate).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => markDealActionDone(d)}
                    disabled={updateOpportunity.isPending}
                    className="text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 shrink-0"
                  >
                    <CheckCircle2 className="h-5 w-5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
