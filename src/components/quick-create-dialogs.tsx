import { Plus, Bell, Mail, MessageSquare, Laptop } from "lucide-react";

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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { ReactNode, FormEvent } from "react";
import { useState } from "react";
import { ClientSelect, OwnerSelect } from "@/components/entity-selects";
import { useCreateClient } from "@/hooks/api/useClients";
import { useCreateProject } from "@/hooks/api/useProjects";
import { useCreateOpportunity } from "@/hooks/api/useOpportunities";
import { useCreateActivity } from "@/hooks/api/useActivities";
import { OPPORTUNITY_STAGES } from "@/lib/api/types";
import type { ActivityType, ClientStatus, Priority, ProjectStatus } from "@/lib/api/types";
import { computeReminderAt } from "@/lib/reminder";
import { ApiError } from "@/lib/api";

type BaseProps = {
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
  onAdd?: (data: unknown) => void;
};

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-xs font-semibold uppercase text-muted-foreground">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

const inputCls =
  "w-full h-10 rounded-lg border border-input px-3 text-sm focus:border-ring outline-none bg-card";
const selectCls = inputCls;
const textareaCls =
  "w-full min-h-[80px] rounded-lg border border-input p-3 text-sm focus:border-ring outline-none bg-card";

function errorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : "Une erreur est survenue. Veuillez réessayer.";
}

/* -------------------- NEW CLIENT -------------------- */
export function NewClientDialog(props: BaseProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const createClient = useCreateClient();
  const open = props.open ?? internalOpen;
  const setOpen = (o: boolean) => {
    setInternalOpen(o);
    props.onOpenChange?.(o);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const firstName = fd.get("firstName")?.toString().trim() || "";
    const lastName = fd.get("lastName")?.toString().trim() || "";
    const fullName = `${firstName} ${lastName}`.trim();

    try {
      const client = await createClient.mutateAsync({
        name: fullName,
        company: fd.get("company")?.toString() || null,
        position: fd.get("role")?.toString() || null,
        email: fd.get("email")?.toString() || "",
        phone: fd.get("phone")?.toString() || "",
        city: fd.get("address")?.toString() || null,
        sector: fd.get("sector")?.toString() || null,
        status: (fd.get("status")?.toString() as ClientStatus) || "prospect",
        priority: (fd.get("priority")?.toString() as Priority) || "medium",
        tags: [],
        value: Number(fd.get("value")) || 0,
      });

      props.onAdd?.(client);
      setOpen(false);
      toast.success("Client créé avec succès", {
        description: `${fullName} a été ajouté à la base de données.`,
      });
    } catch (err) {
      toast.error("Impossible de créer le client", { description: errorMessage(err) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {props.trigger ?? (
          <Button size="sm" className="gradient-brand text-white border-0 h-9">
            <Plus className="h-4 w-4 mr-1" /> Nouveau client
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Créer un client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prénom">
              <input name="firstName" className={inputCls} required placeholder="Jean" />
            </Field>
            <Field label="Nom">
              <input name="lastName" className={inputCls} required placeholder="Dupont" />
            </Field>
            <Field label="Entreprise">
              <input name="company" className={inputCls} placeholder="Ex: TechCorp" />
            </Field>
            <Field label="Fonction">
              <input name="role" className={inputCls} placeholder="Ex : Directeur Informatique" />
            </Field>
            <Field label="Email">
              <input
                name="email"
                type="email"
                className={inputCls}
                placeholder="jean.dupont@techcorp.com"
                required
              />
            </Field>
            <Field label="Téléphone">
              <input name="phone" className={inputCls} placeholder="+33 6 12 34 56 78" required />
            </Field>
            <Field label="Statut">
              <select name="status" className={selectCls} defaultValue="prospect">
                <option value="prospect">Prospect</option>
                <option value="actif">Actif</option>
                <option value="vip">VIP</option>
                <option value="inactif">Inactif</option>
              </select>
            </Field>
            <Field label="Priorité">
              <select name="priority" className={selectCls} defaultValue="medium">
                <option value="high">Haute</option>
                <option value="medium">Moyenne</option>
                <option value="low">Basse</option>
              </select>
            </Field>
            <Field label="Valeur estimée (MGA)">
              <input
                name="value"
                type="number"
                className={inputCls}
                placeholder="0"
                defaultValue="25000"
              />
            </Field>
            <Field label="Secteur">
              <input name="sector" className={inputCls} placeholder="Ex : B2B Services" />
            </Field>
            <Field label="Adresse / Ville" className="col-span-2">
              <input name="address" className={inputCls} placeholder="Paris, France" />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button
              type="submit"
              className="gradient-brand text-white border-0"
              disabled={createClient.isPending}
            >
              {createClient.isPending ? "Création…" : "Créer le client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------- NEW PROJECT -------------------- */
export function NewProjectDialog(props: BaseProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const createProject = useCreateProject();
  const open = props.open ?? internalOpen;
  const setOpen = (o: boolean) => {
    setInternalOpen(o);
    props.onOpenChange?.(o);
  };
  const today = new Date().toISOString().slice(0, 10);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const projectName = fd.get("name")?.toString().trim() || "";
    const clientId = Number(fd.get("clientId"));
    const ownerIdRaw = fd.get("ownerId")?.toString();

    try {
      const project = await createProject.mutateAsync({
        name: projectName,
        clientId,
        ownerId: ownerIdRaw ? Number(ownerIdRaw) : null,
        startDate: fd.get("start")?.toString() || today,
        endDate: fd.get("end")?.toString() || null,
        progress: 0,
        status: (fd.get("status")?.toString() as ProjectStatus) || "En cours",
      });

      props.onAdd?.(project);
      setOpen(false);
      toast.success("Projet créé", {
        description: `Le projet "${projectName}" est désormais actif.`,
      });
    } catch (err) {
      toast.error("Impossible de créer le projet", { description: errorMessage(err) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {props.trigger ?? (
          <Button size="sm" className="gradient-brand text-white border-0 h-9">
            <Plus className="h-4 w-4 mr-1" /> Nouveau projet
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Créer un projet</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <Field label="Nom du projet">
            <input
              name="name"
              className={inputCls}
              required
              placeholder="Ex : Refonte du portail web"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Client">
              <ClientSelect name="clientId" />
            </Field>
            <Field label="Chef de projet">
              <OwnerSelect name="ownerId" />
            </Field>
            <Field label="Date de début">
              <input name="start" type="date" className={inputCls} defaultValue={today} />
            </Field>
            <Field label="Date de fin estimée">
              <input name="end" type="date" className={inputCls} />
            </Field>
            <Field label="Statut" className="col-span-2">
              <select name="status" className={selectCls} defaultValue="En cours">
                <option value="En cours">En cours</option>
                <option value="En attente">En attente</option>
                <option value="Suspendu">Suspendu</option>
                <option value="Terminé">Terminé</option>
              </select>
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button
              type="submit"
              className="gradient-brand text-white border-0"
              disabled={createProject.isPending}
            >
              {createProject.isPending ? "Création…" : "Créer le projet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------- NEW OPPORTUNITY -------------------- */
export function NewOpportunityDialog(props: BaseProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const createOpportunity = useCreateOpportunity();
  const open = props.open ?? internalOpen;
  const setOpen = (o: boolean) => {
    setInternalOpen(o);
    props.onOpenChange?.(o);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const clientId = Number(fd.get("clientId"));
    const amountVal = Number(fd.get("amount")) || 0;
    const ownerIdRaw = fd.get("ownerId")?.toString();

    try {
      const opportunity = await createOpportunity.mutateAsync({
        clientId,
        amount: amountVal,
        probability: Number(fd.get("probability")) || 0,
        stage:
          (fd.get("stage")?.toString() as (typeof OPPORTUNITY_STAGES)[number]) || "Nouveau lead",
        ownerId: ownerIdRaw ? Number(ownerIdRaw) : null,
        closeDate: fd.get("closeDate")?.toString() || null,
      });

      props.onAdd?.(opportunity);
      setOpen(false);
      toast.success("Opportunité créée", {
        description: `L'opportunité de ${amountVal.toLocaleString("fr")} MGA a été ajoutée au pipeline.`,
      });
    } catch (err) {
      toast.error("Impossible de créer l'opportunité", { description: errorMessage(err) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {props.trigger ?? (
          <Button size="sm" className="gradient-brand text-white border-0 h-9">
            <Plus className="h-4 w-4 mr-1" /> Opportunité
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Créer une opportunité</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Client" className="col-span-2">
              <ClientSelect name="clientId" />
            </Field>
            <Field label="Montant potentiel (MGA)">
              <input
                name="amount"
                type="number"
                className={inputCls}
                placeholder="50000"
                required
                defaultValue="45000"
              />
            </Field>
            <Field label="Probabilité (%)">
              <input
                name="probability"
                type="number"
                min={0}
                max={100}
                className={inputCls}
                defaultValue={50}
              />
            </Field>
            <Field label="Responsable">
              <OwnerSelect name="ownerId" />
            </Field>
            <Field label="Étape du pipeline">
              <select name="stage" className={selectCls} defaultValue="Nouveau lead">
                {OPPORTUNITY_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date de clôture prévue" className="col-span-2">
              <input name="closeDate" type="date" className={inputCls} />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button
              type="submit"
              className="gradient-brand text-white border-0"
              disabled={createOpportunity.isPending}
            >
              {createOpportunity.isPending ? "Création…" : "Créer l'opportunité"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------- NEW EVENT -------------------- */
const DURATION_TO_MINUTES: Record<string, number> = {
  "30 min": 30,
  "1 heure": 60,
  "1 h 30": 90,
  "2 heures": 120,
};

export function NewEventDialog(props: BaseProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = props.open ?? internalOpen;
  const setOpen = (o: boolean) => {
    setInternalOpen(o);
    props.onOpenChange?.(o);
  };

  const [type, setType] = useState("Rendez-vous");
  const createActivity = useCreateActivity();
  const today = new Date().toISOString().slice(0, 10);

  const [reminderPreset, setReminderPreset] = useState("Aucun");
  const [customVal, setCustomVal] = useState("15");
  const [customUnit, setCustomUnit] = useState("minutes");
  const [customChannels, setCustomChannels] = useState<string[]>(["notification"]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const typeMapping: Record<string, ActivityType> = {
      Appel: "call",
      "Rendez-vous": "meeting",
      Relance: "follow-up",
      Tâche: "task",
    };

    const titleText = fd.get("title")?.toString().trim() || "";
    const eventTime = fd.get("time")?.toString() || "10:00";
    const eventDate = fd.get("date")?.toString() || today;
    const scheduledAt = new Date(`${eventDate}T${eventTime}`);
    const clientId = Number(fd.get("clientId"));
    const durationLabel = fd.get("duration")?.toString() || "1 heure";

    try {
      const activity = await createActivity.mutateAsync({
        type: typeMapping[type] || "meeting",
        title: titleText,
        clientId,
        scheduledAt: scheduledAt.toISOString(),
        durationMinutes: DURATION_TO_MINUTES[durationLabel] ?? 60,
        status: "planifié",
        priority: "medium",
        summary: fd.get("notes")?.toString() || null,
        reminderAt: computeReminderAt(scheduledAt, reminderPreset, customVal, customUnit),
      });

      props.onAdd?.(activity);
      setOpen(false);
      toast.success("Événement ajouté au calendrier", {
        description: `L'événement "${titleText}" a été planifié.`,
      });
    } catch (err) {
      toast.error("Impossible de créer l'événement", { description: errorMessage(err) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {props.trigger ?? (
          <Button size="sm" className="gradient-brand text-white border-0 h-9">
            <Plus className="h-4 w-4 mr-1" /> Événement
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Créer un événement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <Field label="Type d'action">
            <div className="grid grid-cols-4 gap-1.5">
              {["Appel", "Rendez-vous", "Relance", "Tâche"].map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setType(t)}
                  className={`h-9 rounded-lg border text-xs font-medium transition ${
                    type === t
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary hover:bg-primary/5"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Titre de la réunion / action">
            <input
              name="title"
              className={inputCls}
              required
              placeholder="Ex : Démo commerciale & Présentation"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Client / Prospect" className="col-span-2">
              <div className="grid grid-cols-2 gap-2">
                <ClientSelect name="clientId" />
                <input
                  name="client"
                  className={inputCls}
                  placeholder="Nom du client"
                  defaultValue="Mock Client One"
                />
              </div>
            </Field>
            <Field label="Durée">
              <select name="duration" className={selectCls} defaultValue="1 heure">
                <option value="30 min">30 min</option>
                <option value="1 heure">1 heure</option>
                <option value="1 h 30">1 h 30</option>
                <option value="2 heures">2 heures</option>
              </select>
            </Field>
            <Field label="Date">
              <input name="date" type="date" className={inputCls} defaultValue={today} required />
            </Field>
            <Field label="Heure">
              <input name="time" type="time" className={inputCls} defaultValue="10:00" required />
            </Field>
          </div>
          <div className="border-t border-border/60 my-2 pt-3">
            <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5 mb-1.5">
              <Bell className="h-3.5 w-3.5 text-primary" /> Rappel
            </label>
            <select
              value={reminderPreset}
              onChange={(e) => setReminderPreset(e.target.value)}
              className={selectCls}
            >
              {REMINDER_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>

            {reminderPreset === "custom" && (
              <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-border space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <label className="text-[10px] font-semibold uppercase text-muted-foreground">
                      Valeur
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={customVal}
                      onChange={(e) => setCustomVal(e.target.value)}
                      className="mt-1 w-full h-9 rounded-md border border-input px-2 text-sm outline-none focus:border-ring bg-card"
                    />
                  </div>
                  <div className="flex-[2]">
                    <label className="text-[10px] font-semibold uppercase text-muted-foreground">
                      Unité
                    </label>
                    <select
                      value={customUnit}
                      onChange={(e) => setCustomUnit(e.target.value)}
                      className="mt-1 w-full h-9 rounded-md border border-input px-2 text-sm outline-none focus:border-ring bg-card"
                    >
                      <option value="minutes">Minutes</option>
                      <option value="heures">Heures</option>
                      <option value="jours">Jours</option>
                      <option value="semaines">Semaines</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold uppercase text-muted-foreground block mb-1">
                    Canaux de rappel
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "notification", label: "In-App", icon: Laptop },
                      { id: "email", label: "Email", icon: Mail },
                      { id: "sms", label: "SMS", icon: MessageSquare },
                    ].map((channel) => {
                      const Icon = channel.icon;
                      const active = customChannels.includes(channel.id);
                      return (
                        <button
                          type="button"
                          key={channel.id}
                          onClick={() => {
                            if (active) {
                              setCustomChannels(customChannels.filter((c) => c !== channel.id));
                            } else {
                              setCustomChannels([...customChannels, channel.id]);
                            }
                          }}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition ${
                            active
                              ? "border-primary bg-primary/10 text-primary border-primary/30"
                              : "border-border hover:bg-muted text-muted-foreground"
                          }`}
                        >
                          <Icon className="h-3 w-3" />
                          {channel.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
          <Field label="Notes / Ordre du jour">
            <textarea
              name="notes"
              className={textareaCls}
              placeholder="Objectifs de l'échange..."
            />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button
              type="submit"
              className="gradient-brand text-white border-0"
              disabled={createActivity.isPending}
            >
              {createActivity.isPending ? "Création…" : "Créer l'événement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
