import { usePageMeta } from "@/hooks/use-page-meta";
import { useEffect, useRef, useState } from "react";
import {
  User,
  Users,
  Bell,
  Palette,
  Settings as SettingsIcon,
  Shield,
  CreditCard,
  Lock,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useMe, useUpdateMe, useUploadAvatar, useRemoveAvatar } from "@/hooks/api/useMe";
import { Skeleton } from "@/components/ui/skeleton";
import { authApi, ApiError } from "@/lib/api";
import { toast } from "sonner";

const sections = [
  { id: "profile", label: "Profil", icon: User },
  { id: "teams", label: "Équipes", icon: Users },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "display", label: "Affichage", icon: Palette },
  { id: "general", label: "Général", icon: SettingsIcon },
  { id: "security", label: "Sécurité", icon: Shield },
  { id: "billing", label: "Facturation", icon: CreditCard },
] as const;

export default function SettingsPage() {
  usePageMeta("Paramètres — Eray CRM", "Configurez votre profil, votre équipe et vos préférences.");
  const [active, setActive] = useState<(typeof sections)[number]["id"]>("profile");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Paramètres</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Personnalisez Eray CRM pour votre équipe
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        <nav className="card-elegant p-2 h-fit">
          {sections.map((s) => {
            const Icon = s.icon;
            const isActive = active === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive ? "bg-primary/10 text-primary" : "text-foreground/70 hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4" /> {s.label}
              </button>
            );
          })}
        </nav>

        <div className="space-y-4">
          {active === "profile" && <ProfileSection />}
          {active === "teams" && <TeamsSection />}
          {active === "notifications" && <NotificationsSection />}
          {active === "display" && <DisplaySection />}
          {active === "general" && <GeneralSection />}
          {active === "security" && <SecuritySection />}
          {active === "billing" && <BillingSection />}
        </div>
      </div>
    </div>
  );
}

function Card({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card-elegant p-6">
      <div className="mb-5">
        <h3 className="font-display font-bold text-lg">{title}</h3>
        {desc && <p className="text-xs text-muted-foreground mt-1">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

function NotConnectedBanner() {
  return (
    <div className="mb-5 p-3 rounded-lg border border-dashed border-amber-300 bg-amber-500/5 text-xs text-amber-800 flex items-start gap-2">
      <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
      <span>
        Cet onglet n'est pas encore connecté à une API backend — les champs ci-dessous sont
        désactivés à titre d'aperçu.
      </span>
    </div>
  );
}

function ProfileSection() {
  const { data: me, isLoading, isError } = useMe();
  const updateMe = useUpdateMe();
  const uploadAvatar = useUploadAvatar();
  const removeAvatar = useRemoveAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [team, setTeam] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (me && !hydrated) {
      setFirstName(me.firstName);
      setLastName(me.lastName);
      setPhone(me.phone ?? "");
      setTeam(me.team ?? "");
      setHydrated(true);
    }
  }, [me, hydrated]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleSave = async () => {
    try {
      await updateMe.mutateAsync({ firstName, lastName, phone: phone || null, team: team || null });
      toast.success("Profil mis à jour");
    } catch (err) {
      toast.error("Mise à jour impossible", {
        description: err instanceof ApiError ? err.message : "Une erreur est survenue.",
      });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Fichier invalide", { description: "Veuillez choisir une image." });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image trop volumineuse", {
        description: "L'image ne doit pas dépasser 2 Mo.",
      });
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    try {
      await uploadAvatar.mutateAsync(file);
      toast.success("Photo mise à jour");
    } catch (err) {
      setPreviewUrl(null);
      toast.error("Upload impossible", {
        description: err instanceof ApiError ? err.message : "Une erreur est survenue.",
      });
    }
  };

  const handleRemovePhoto = async () => {
    try {
      await removeAvatar.mutateAsync();
      setPreviewUrl(null);
      toast.success("Photo supprimée");
    } catch (err) {
      toast.error("Suppression impossible", {
        description: err instanceof ApiError ? err.message : "Une erreur est survenue.",
      });
    }
  };

  if (isLoading)
    return (
      <Card title="Profil utilisateur">
        <Skeleton className="h-48 w-full" />
      </Card>
    );
  if (isError || !me)
    return (
      <Card title="Profil utilisateur">
        <p className="text-sm text-destructive">Impossible de charger votre profil.</p>
      </Card>
    );

  return (
    <Card
      title="Profil utilisateur"
      desc="Ces informations sont visibles par les membres de votre équipe."
    >
      <div className="flex items-center gap-4">
        <UserAvatar
          photo={previewUrl ?? me.photo}
          name={me.fullName}
          className="h-20 w-20"
          imageClassName={previewUrl ? "object-cover" : undefined}
          fallbackClassName="bg-gradient-to-br from-primary to-violet text-white text-xl font-bold"
        />
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              disabled={uploadAvatar.isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadAvatar.isPending ? "Envoi…" : "Changer la photo"}
            </Button>
            {me.photo || previewUrl ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                disabled={removeAvatar.isPending}
                onClick={handleRemovePhoto}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Supprimer
              </Button>
            ) : null}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            JPG, PNG, GIF ou WEBP — 2 Mo maximum.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            data-cy="profile-photo-input"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Prénom
          </label>
          <Input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Nom
          </label>
          <Input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Email professionnel
          </label>
          <Input value={me.email} disabled className="mt-1.5 bg-muted/50" />
        </div>
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Téléphone
          </label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Équipe
          </label>
          <Input value={team} onChange={(e) => setTeam(e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Rôle
          </label>
          <Input value={me.role} disabled className="mt-1.5 bg-muted/50 capitalize" />
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <Button variant="outline" onClick={() => setHydrated(false)}>
          Annuler
        </Button>
        <Button
          onClick={handleSave}
          disabled={updateMe.isPending}
          className="gradient-brand text-white border-0"
        >
          {updateMe.isPending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </Card>
  );
}

function TeamsSection() {
  return (
    <Card title="Équipes" desc="Organisez vos commerciaux par équipe.">
      <NotConnectedBanner />
      <p className="text-sm text-muted-foreground">
        L'équipe de chaque membre se gère depuis la page{" "}
        <span className="font-semibold text-foreground">Utilisateurs</span> (champ libre associé à
        chaque compte). Un module de gestion d'équipes dédié n'existe pas encore côté backend.
      </p>
    </Card>
  );
}

function NotificationsSection() {
  const items = [
    {
      label: "Nouvelle activité assignée",
      desc: "Recevoir un email dès qu'une activité vous est assignée.",
    },
    { label: "Rappel de tâches", desc: "Notification avant chaque tâche planifiée." },
    { label: "Opportunité gagnée / perdue", desc: "Suivre les évolutions du pipeline commercial." },
    { label: "Résumé quotidien", desc: "Email récapitulatif chaque matin." },
  ];
  return (
    <Card title="Notifications" desc="Choisissez quand et comment être alerté.">
      <NotConnectedBanner />
      <ul className="divide-y divide-border">
        {items.map((n) => (
          <li key={n.label} className="py-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="font-medium text-sm">{n.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{n.desc}</div>
            </div>
            <Switch disabled />
          </li>
        ))}
      </ul>
    </Card>
  );
}

function DisplaySection() {
  const [theme, setTheme] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("theme") || "Clair" : "Clair",
  );

  useEffect(() => {
    const handleThemeChange = () => {
      const current = localStorage.getItem("theme") || "Clair";
      setTheme((prev) => (prev !== current ? current : prev));
    };
    window.addEventListener("theme-change", handleThemeChange);
    return () => window.removeEventListener("theme-change", handleThemeChange);
  }, []);

  useEffect(() => {
    if (theme === "Sombre") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "Sombre");
    } else if (theme === "Clair") {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "Clair");
    } else {
      localStorage.setItem("theme", "Système");
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
    window.dispatchEvent(new Event("theme-change"));
  }, [theme]);

  return (
    <Card
      title="Préférences d'affichage"
      desc="Le thème est enregistré localement dans votre navigateur."
    >
      <div>
        <div className="text-sm font-semibold mb-2">Thème</div>
        <div className="grid grid-cols-3 gap-3">
          {["Clair", "Sombre", "Système"].map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`p-3 rounded-xl border ${theme === t ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground/70"} text-sm font-medium transition`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}

function GeneralSection() {
  return (
    <Card title="Paramètres généraux">
      <NotConnectedBanner />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Nom de l'entreprise" value="Eray SAS" disabled />
        <FormField label="Devise par défaut" value="MGA" disabled />
      </div>
    </Card>
  );
}

function SecuritySection() {
  const { data: me } = useMe();
  const [sending, setSending] = useState(false);

  const handleSendReset = async () => {
    if (!me) return;
    setSending(true);
    try {
      await authApi.requestPasswordReset(me.email);
      toast.success("E-mail envoyé", {
        description: `Un lien de réinitialisation a été envoyé à ${me.email}.`,
      });
    } catch (err) {
      toast.error("Envoi impossible", {
        description: err instanceof ApiError ? err.message : "Une erreur est survenue.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card title="Sécurité" desc="Gérez le mot de passe et la sécurité de votre compte.">
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold mb-1">Mot de passe</h4>
          <p className="text-xs text-muted-foreground mb-3">
            Aucun endpoint de changement de mot de passe en session n'existe côté backend — utilisez
            le lien de réinitialisation par e-mail.
          </p>
          <Button onClick={handleSendReset} disabled={sending || !me}>
            {sending ? "Envoi…" : "Recevoir un lien de réinitialisation"}
          </Button>
        </div>

        <div className="pt-4 border-t border-border">
          <NotConnectedBanner />
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold">Authentification à deux facteurs (2FA)</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Sécurisez votre compte avec une étape de validation supplémentaire.
              </p>
            </div>
            <Switch disabled />
          </div>
        </div>
      </div>
    </Card>
  );
}

function BillingSection() {
  return (
    <Card title="Facturation" desc="Gérez votre abonnement et vos informations de paiement.">
      <NotConnectedBanner />
      <p className="text-sm text-muted-foreground">
        Aucun module de facturation n'existe côté backend pour le moment.
      </p>
    </Card>
  );
}

function FormField({
  label,
  value,
  disabled,
}: {
  label: string;
  value?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <input
        type="text"
        defaultValue={value}
        disabled={disabled}
        className="mt-1.5 w-full h-10 rounded-lg border border-input px-3 text-sm focus:border-ring outline-none bg-background disabled:bg-muted/50 disabled:cursor-not-allowed"
      />
    </div>
  );
}
