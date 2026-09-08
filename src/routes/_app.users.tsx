import { usePageMeta } from "@/hooks/use-page-meta";
import { useState, useMemo } from "react";
import {
  Plus,
  Shield,
  Users as UsersIcon,
  Eye,
  Edit,
  KeyRound,
  Power,
  Search,
  X,
} from "lucide-react";
import { useInviteUser, useSetUserStatus, useUpdateUser, useUsers } from "@/hooks/api/useUsers";
import { useMe } from "@/hooks/api/useMe";
import { useRequireRole } from "@/hooks/use-require-role";
import { ConfirmDialog, type ConfirmDialogState } from "@/components/confirm-dialog";
import { authApi, ApiError } from "@/lib/api";
import type { UserDto, UserRole } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const roleLabel: Record<UserRole, string> = {
  admin: "Administrateur",
  manager: "Manager",
  commercial: "Commercial",
};
const roleColor: Record<UserRole, string> = {
  admin: "bg-violet-500/10 text-violet-700 border-violet-200",
  manager: "bg-primary/10 text-primary border-primary/20",
  commercial: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
};
const statusLabel: Record<string, string> = {
  active: "Actif",
  invited: "Invité",
  disabled: "Désactivé",
};
const statusBadgeClass: Record<string, string> = {
  active:
    "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400 px-3 py-1 rounded-full text-xs font-semibold inline-block",
  invited:
    "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 px-3 py-1 rounded-full text-xs font-semibold inline-block",
  disabled:
    "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 px-3 py-1 rounded-full text-xs font-semibold inline-block",
};

function errorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : "Une erreur est survenue. Veuillez réessayer.";
}

export default function UsersPage() {
  usePageMeta(
    "Utilisateurs — Eray CRM",
    "Gérez les membres, rôles et permissions de votre équipe.",
  );
  const allowed = useRequireRole(["admin", "manager"]);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);
  const [dialogType, setDialogType] = useState<"details" | "edit" | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const [inviteFirstName, setInviteFirstName] = useState("");
  const [inviteLastName, setInviteLastName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("commercial");

  const [query, setQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole | "">("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;
  const [confirm, setConfirm] = useState<ConfirmDialogState | null>(null);

  const { data: users, isLoading, isError, error } = useUsers();
  const { data: me } = useMe();
  const inviteUser = useInviteUser();
  const updateUser = useUpdateUser();
  const setUserStatus = useSetUserStatus();

  const teamOptions = useMemo(
    () => Array.from(new Set((users ?? []).map((u) => u.team).filter((t): t is string => !!t))),
    [users],
  );

  const filteredUsers = useMemo(() => {
    return (users ?? []).filter((u) => {
      const matchesSearch =
        u.fullName.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase());
      const matchesRole = !selectedRole || u.role === selectedRole;
      const matchesStatus = !selectedStatus || u.status === selectedStatus;
      const matchesTeam = !selectedTeam || u.team === selectedTeam;
      return matchesSearch && matchesRole && matchesStatus && matchesTeam;
    });
  }, [users, query, selectedRole, selectedStatus, selectedTeam]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE) || 1;
  const activePage = Math.min(currentPage, totalPages);
  const paginatedUsers = filteredUsers.slice(
    (activePage - 1) * ITEMS_PER_PAGE,
    activePage * ITEMS_PER_PAGE,
  );

  if (!allowed) return null;

  const handleInvite = async () => {
    if (!inviteEmail || !inviteFirstName || !inviteLastName) return;
    try {
      await inviteUser.mutateAsync({
        firstName: inviteFirstName,
        lastName: inviteLastName,
        email: inviteEmail,
        role: inviteRole,
      });
      toast.success("Invitation envoyée", {
        description: `${inviteFirstName} ${inviteLastName} recevra un e-mail pour définir son mot de passe.`,
      });
      setInviteFirstName("");
      setInviteLastName("");
      setInviteEmail("");
      setInviteRole("commercial");
      setIsInviteOpen(false);
    } catch (err) {
      toast.error("Invitation impossible", { description: errorMessage(err) });
    }
  };

  const handleEditSave = async (role: UserRole, team: string) => {
    if (!selectedUser) return;
    try {
      await updateUser.mutateAsync({ id: selectedUser.id, payload: { role, team: team || null } });
      toast.success("Membre mis à jour");
      setDialogType(null);
      setSelectedUser(null);
    } catch (err) {
      toast.error("Mise à jour impossible", { description: errorMessage(err) });
    }
  };

  const performToggle = async (u: UserDto, newStatus: "active" | "disabled") => {
    setTogglingId(u.id);
    try {
      await setUserStatus.mutateAsync({ id: u.id, status: newStatus });
      toast.success("Statut mis à jour", {
        description: `${u.fullName} est maintenant ${newStatus === "disabled" ? "désactivé" : "actif"}.`,
      });
    } catch (err) {
      toast.error("Mise à jour impossible", { description: errorMessage(err) });
    } finally {
      setTogglingId(null);
    }
  };

  const handleToggleStatus = async (u: UserDto) => {
    if (me && u.id === me.id && u.status === "active") {
      toast.error("Impossible de désactiver votre propre compte");
      return;
    }
    const newStatus = u.status === "active" ? "disabled" : "active";
    if (newStatus === "disabled") {
      setConfirm({
        title: "Désactiver le compte",
        description: `Voulez-vous désactiver le compte de ${u.fullName} ? Il ne pourra plus se connecter.`,
        confirmLabel: "Désactiver",
        destructive: true,
        onConfirm: () => performToggle(u, "disabled"),
      });
      return;
    }
    await performToggle(u, "active");
  };

  const handleResetPassword = async (u: UserDto) => {
    try {
      await authApi.requestPasswordReset(u.email);
      toast.success(`Réinitialisation envoyée à ${u.fullName}`, {
        description: "Un e-mail de réinitialisation a été envoyé.",
      });
    } catch (err) {
      toast.error("Envoi impossible", { description: errorMessage(err) });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Utilisateurs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {users ? `${users.length} membres` : "Chargement…"}
          </p>
        </div>

        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-brand text-white border-0 h-9">
              <Plus className="h-4 w-4 mr-1" /> Inviter un membre
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Inviter un nouveau membre</DialogTitle>
              <DialogDescription>
                Un e-mail lui sera envoyé pour définir son mot de passe.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    value={inviteFirstName}
                    onChange={(e) => setInviteFirstName(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    value={inviteLastName}
                    onChange={(e) => setInviteLastName(e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Adresse email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="prenom.nom@entreprise.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="role">Rôle</Label>
                <select
                  id="role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="mt-2 w-full h-10 rounded-lg border border-input px-3 text-sm focus:border-ring outline-none bg-background"
                >
                  <option value="commercial">Commercial</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleInvite}
                disabled={inviteUser.isPending}
                className="gradient-brand text-white border-0"
              >
                {inviteUser.isPending ? "Envoi…" : "Envoyer l'invitation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {users && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatCard
            icon={UsersIcon}
            label="Membres actifs"
            value={users.filter((u) => u.status === "active").length.toString()}
            tone="brand"
          />
          <StatCard
            icon={Shield}
            label="Administrateurs"
            value={users.filter((u) => u.role === "admin").length.toString()}
            tone="violet"
          />
          <StatCard
            icon={UsersIcon}
            label="Invitations en attente"
            value={users.filter((u) => u.status === "invited").length.toString()}
            tone="warning"
          />
        </div>
      )}

      {/* Filters */}
      <div className="card-elegant p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Rechercher un membre, un email…"
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted/60 border border-transparent focus:bg-card focus:border-ring outline-none text-sm"
          />
        </div>

        <select
          value={selectedRole}
          onChange={(e) => {
            setSelectedRole(e.target.value as UserRole | "");
            setCurrentPage(1);
          }}
          className="h-9 rounded-lg border border-input px-3 text-xs outline-none bg-background text-foreground/80 focus:border-ring"
        >
          <option value="">Tous les rôles</option>
          <option value="admin">Administrateurs</option>
          <option value="manager">Managers</option>
          <option value="commercial">Commerciaux</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value);
            setCurrentPage(1);
          }}
          className="h-9 rounded-lg border border-input px-3 text-xs outline-none bg-background text-foreground/80 focus:border-ring"
        >
          <option value="">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="invited">Invité</option>
          <option value="disabled">Désactivé</option>
        </select>

        <select
          value={selectedTeam}
          onChange={(e) => {
            setSelectedTeam(e.target.value);
            setCurrentPage(1);
          }}
          className="h-9 rounded-lg border border-input px-3 text-xs outline-none bg-background text-foreground/80 focus:border-ring"
        >
          <option value="">Toutes les équipes</option>
          {teamOptions.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        {(query !== "" || selectedRole !== "" || selectedStatus !== "" || selectedTeam !== "") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery("");
              setSelectedRole("");
              setSelectedStatus("");
              setSelectedTeam("");
            }}
            className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground font-semibold inline-flex items-center gap-1.5"
          >
            <X className="h-4 w-4" /> Réinitialiser
          </Button>
        )}
      </div>

      {isError ? (
        <div className="card-elegant p-10 text-center text-sm text-destructive">
          {errorMessage(error)}
        </div>
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="card-elegant overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-semibold px-5 py-3">Utilisateur</th>
                <th className="text-left font-semibold px-2 py-3">Rôle</th>
                <th className="text-left font-semibold px-2 py-3">Équipe</th>
                <th className="text-left font-semibold px-2 py-3">Statut</th>
                <th className="text-right font-semibold px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedUsers.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        photo={u.photo}
                        name={u.fullName}
                        className="h-9 w-9"
                        fallbackClassName="bg-primary/10 text-primary text-[11px] font-semibold"
                      />
                      <div>
                        <div className="font-semibold text-foreground">{u.fullName}</div>
                        <div className="text-[11px] text-muted-foreground">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3.5">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${roleColor[u.role]}`}
                    >
                      {roleLabel[u.role]}
                    </span>
                  </td>
                  <td className="px-2 py-3.5 text-muted-foreground">{u.team || "—"}</td>
                  <td className="px-2 py-3.5">
                    <span className={statusBadgeClass[u.status]}>{statusLabel[u.status]}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setDialogType("details");
                        }}
                        className="p-1.5 hover:bg-muted rounded text-foreground/70 hover:text-foreground transition-colors disabled:opacity-40 disabled:pointer-events-none"
                        title="Voir les détails"
                        data-cy="user-details-btn"
                        disabled={togglingId !== null}
                      >
                        <Eye className="h-4.5 w-4.5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setDialogType("edit");
                        }}
                        className="p-1.5 hover:bg-muted rounded text-foreground/70 hover:text-foreground transition-colors disabled:opacity-40 disabled:pointer-events-none"
                        title="Modifier"
                        data-cy="user-edit-btn"
                        disabled={togglingId !== null}
                      >
                        <Edit className="h-4.5 w-4.5" />
                      </button>
                      <button
                        onClick={() => handleResetPassword(u)}
                        className="p-1.5 hover:bg-muted rounded text-foreground/70 hover:text-foreground transition-colors disabled:opacity-40 disabled:pointer-events-none"
                        title="Réinitialiser le mot de passe"
                        disabled={togglingId !== null}
                        data-cy="user-reset-password-btn"
                      >
                        <KeyRound className="h-4.5 w-4.5" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className="p-1.5 hover:bg-muted rounded text-foreground/70 hover:text-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none"
                        title={
                          me && u.id === me.id && u.status === "active"
                            ? "Vous ne pouvez pas désactiver votre propre compte"
                            : u.status === "active"
                              ? "Désactiver"
                              : "Activer"
                        }
                        disabled={
                          togglingId !== null ||
                          (me != null && u.id === me.id && u.status === "active")
                        }
                        data-cy="user-toggle-status-btn"
                      >
                        {togglingId === u.id ? (
                          <svg
                            className="animate-spin h-4 w-4 text-muted-foreground"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                        ) : (
                          <Power className="h-4.5 w-4.5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between mt-4 px-2">
        <div className="text-xs text-muted-foreground font-medium">
          Affichage {filteredUsers.length > 0 ? (activePage - 1) * ITEMS_PER_PAGE + 1 : 0}–
          {Math.min(activePage * ITEMS_PER_PAGE, filteredUsers.length)} sur {filteredUsers.length}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs bg-card"
            disabled={activePage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            Précédent
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs bg-card"
            disabled={activePage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Suivant
          </Button>
        </div>
      </div>

      {selectedUser && dialogType === "details" && (
        <Dialog open onOpenChange={(open) => !open && setDialogType(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Détails du membre</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="flex items-center gap-4">
                <UserAvatar
                  photo={selectedUser.photo}
                  name={selectedUser.fullName}
                  className="h-16 w-16"
                  fallbackClassName="bg-gradient-to-br from-primary to-violet text-white text-lg font-bold"
                />
                <div>
                  <h3 className="font-semibold text-lg">{selectedUser.fullName}</h3>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4 bg-muted/50 p-4 rounded-xl">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Rôle</div>
                  <div className="font-medium mt-1">{roleLabel[selectedUser.role]}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">
                    Équipe
                  </div>
                  <div className="font-medium mt-1">{selectedUser.team || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">
                    Statut
                  </div>
                  <div className="font-medium mt-1">{statusLabel[selectedUser.status]}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">
                    Téléphone
                  </div>
                  <div className="font-medium mt-1">{selectedUser.phone || "—"}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">
                    E-mail vérifié
                  </div>
                  <div className="font-medium mt-1">{selectedUser.isVerified ? "Oui" : "Non"}</div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {selectedUser && dialogType === "edit" && (
        <EditUserDialog
          user={selectedUser}
          pending={updateUser.isPending}
          onCancel={() => {
            setDialogType(null);
            setSelectedUser(null);
          }}
          onSave={handleEditSave}
          teamOptions={teamOptions}
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

function EditUserDialog({
  user,
  pending,
  onCancel,
  onSave,
  teamOptions,
}: {
  user: UserDto;
  pending: boolean;
  onCancel: () => void;
  onSave: (role: UserRole, team: string) => void;
  teamOptions: string[];
}) {
  const [role, setRole] = useState<UserRole>(user.role);
  const [team, setTeam] = useState(user.team ?? "");

  return (
    <Dialog open onOpenChange={(o) => !o && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier {user.fullName}</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <Label>Rôle</Label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="mt-2 w-full h-10 rounded-lg border border-input px-3 text-sm focus:border-ring outline-none bg-background"
            >
              <option value="commercial">Commercial</option>
              <option value="manager">Manager</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>
          <div>
            <Label>Équipe</Label>
            <Input
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              list="team-options"
              placeholder="Ex : Ventes B2B"
              className="mt-2"
            />
            <datalist id="team-options">
              {teamOptions.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button
            onClick={() => onSave(role, team)}
            disabled={pending}
            className="gradient-brand text-white border-0"
          >
            {pending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: string;
}) {
  const tones: Record<string, string> = {
    brand: "bg-primary/10 text-primary",
    violet: "bg-violet-500/10 text-violet-600",
    warning: "bg-amber-500/10 text-amber-600",
  };
  return (
    <div className="card-elegant p-5 flex items-center gap-4">
      <div className={`h-11 w-11 rounded-xl grid place-items-center ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-2xl font-bold font-display">{value}</div>
      </div>
    </div>
  );
}
