import { usePageMeta } from "@/hooks/use-page-meta";
import { useCRM } from "@/lib/store";
import { Bell, CheckCircle2, Clock, Phone, Mail, Calendar as CalendarIcon, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function RemindersPage() {
  usePageMeta("Rappels — Eray CRM", "Vos relances et tâches urgentes à effectuer.");
  
  const { activities, setActivities, deals, setDeals } = useCRM();

  const pendingActivities = activities.filter(a => a.status === "planifié" || a.status === "à faire" || a.status === "en retard");
  const pendingDeals = deals.filter(d => d.nextAction && d.stage !== "Vente gagnée" && d.stage !== "Vente perdue" && d.stage !== "Contrat signé");

  const markActivityDone = (id: string) => {
    setActivities(activities.map(a => a.id === id ? { ...a, status: "terminé" } : a));
    toast.success("Tâche terminée !");
  };

  const markDealActionDone = (id: string) => {
    setDeals(deals.map(d => d.id === id ? { ...d, nextAction: "Action terminée", nextActionDate: "" } : d));
    toast.success("Action opportunité marquée comme terminée.");
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
          <div className="space-y-3">
            {pendingActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground italic card-elegant p-4">Aucune tâche en attente.</p>
            ) : (
              pendingActivities.map(a => (
                <div key={a.id} className="card-elegant p-4 flex gap-3 items-start group hover:border-primary/30 transition-all">
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    {a.type === "call" ? <Phone className="h-4 w-4" /> : a.type === "meeting" ? <CalendarIcon className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{a.title}</h3>
                    <p className="text-xs text-muted-foreground truncate">{a.client} • {a.date} {a.time}</p>
                    {a.reminder && <span className="inline-block mt-1 text-[10px] bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded">Rappel: {a.reminder}</span>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => markActivityDone(a.id)} className="text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 shrink-0">
                    <CheckCircle2 className="h-5 w-5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-indigo-500" /> Actions Opportunités
          </h2>
          <div className="space-y-3">
            {pendingDeals.length === 0 ? (
              <p className="text-sm text-muted-foreground italic card-elegant p-4">Aucune action en attente sur le pipeline.</p>
            ) : (
              pendingDeals.map(d => (
                <div key={d.id} className="card-elegant p-4 flex gap-3 items-start group hover:border-primary/30 transition-all">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{d.client} <span className="text-muted-foreground font-normal">({d.company})</span></h3>
                    <p className="text-xs text-primary font-medium truncate mt-1">À faire : {d.nextAction}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{d.stage}</span>
                      {d.nextActionDate && <span className="text-[10px] bg-red-500/10 text-red-600 px-1.5 py-0.5 rounded">Prévu le : {d.nextActionDate}</span>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => markDealActionDone(d.id)} className="text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 shrink-0">
                    <CheckCircle2 className="h-5 w-5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
