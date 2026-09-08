import { Link } from "react-router";
import { usePageMeta } from "@/hooks/use-page-meta";
import { useMemo, useState } from "react";
import {
  LayoutGrid,
  List as ListIcon,
  Search,
  Download,
  MoreHorizontal,
  Phone,
  Mail,
  MapPin,
  Eye,
  Edit,
  Trash2,
  X,
} from "lucide-react";
import { useClients, useDeleteClient, useUpdateClient } from "@/hooks/api/useClients";
import { useUsers } from "@/hooks/api/useUsers";
import { NewClientDialog } from "@/components/quick-create-dialogs";
import { ConfirmDialog, type ConfirmDialogState } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserAvatar } from "@/components/user-avatar";
import { PriorityDot } from "@/components/crm-atoms";
import { Skeleton } from "@/components/ui/skeleton";
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
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { ClientDto, ClientStatus, Priority } from "@/lib/api/types";

const statusMap: Record<string, string> = {
  prospect: "bg-blue-500/10 text-blue-700 border-blue-200",
  actif: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  inactif: "bg-slate-400/10 text-slate-600 border-slate-200",
  vip: "bg-violet-500/10 text-violet-700 border-violet-200",
};

const priorityLabel: Record<string, string> = {
  high: "Haute",
  medium: "Moyenne",
  low: "Basse",
};

const PER_PAGE = 10;

export default function ClientsPage() {
  usePageMeta("Clients — Eray CRM", "Gérez vos clients et prospects avec filtres avancés.");
  const [view, setView] = useState<"table" | "cards">("table");
  const [query, setQuery] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<ClientStatus[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<Priority[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);

  const { data: usersData } = useUsers();
  const { data, isLoading, isError, error } = useClients({
    q: query || undefined,
    status: selectedStatuses.length ? selectedStatuses : undefined,
    priority: selectedPriorities.length ? selectedPriorities : undefined,
    owner: selectedOwner,
    page,
    perPage: PER_PAGE,
  });

  const deleteClient = useDeleteClient();

  const [selectedClient, setSelectedClient] = useState<ClientDto | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmDialogState | null>(null);

  const hasActiveFilters =
    selectedStatuses.length > 0 ||
    selectedPriorities.length > 0 ||
    selectedOwner !== undefined ||
    query !== "";

  const resetFilters = () => {
    setSelectedStatuses([]);
    setSelectedPriorities([]);
    setSelectedOwner(undefined);
    setQuery("");
    setPage(1);
  };

  const handleDelete = async (c: ClientDto) => {
    setConfirm({
      title: "Supprimer le client",
      description: `Voulez-vous vraiment supprimer ${c.name} ? Cette action est irréversible.`,
      confirmLabel: "Supprimer",
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteClient.mutateAsync(c.id);
          toast.success("Client supprimé");
        } catch (err) {
          toast.error("Suppression impossible", {
            description: err instanceof ApiError ? err.message : "Une erreur est survenue.",
          });
        }
      },
    });
  };

  const handleExportCSV = () => {
    if (!data) return;
    const headers = [
      "Nom",
      "Entreprise",
      "Rôle",
      "Email",
      "Téléphone",
      "Ville",
      "Secteur",
      "Statut",
      "Priorité",
      "Responsable",
      "Valeur",
    ];
    const rows = data.items.map((c) => [
      c.name,
      c.company ?? "",
      c.role ?? "",
      c.email,
      c.phone,
      c.city ?? "",
      c.sector ?? "",
      c.status,
      c.priority,
      c.ownerName,
      c.value.toString(),
    ]);
    const csvContent = [headers, ...rows].map((r) => r.map((f) => `"${f}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clients_eray_crm_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Clients</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data ? `${data.meta.total} contacts` : "Chargement…"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!data}>
            <Download className="h-4 w-4 mr-1.5" /> Exporter
          </Button>
          <NewClientDialog />
        </div>
      </div>

      {/* Filtres */}
      <div className="card-elegant p-3 flex flex-wrap items-center gap-2 animate-fade-in-up">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors focus-within:text-primary" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher un client, une entreprise…"
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted/60 border border-transparent hover:bg-muted hover:border-border focus:bg-card focus:border-ring focus:ring-2 focus:ring-ring/15 outline-none text-sm transition-all duration-200"
          />
        </div>
        <FilterDropdown
          label="Statut"
          options={["prospect", "actif", "vip", "inactif"]}
          selected={selectedStatuses}
          onToggle={(val) => {
            setSelectedStatuses((prev) =>
              prev.includes(val as ClientStatus)
                ? prev.filter((x) => x !== val)
                : [...prev, val as ClientStatus],
            );
            setPage(1);
          }}
        />
        <FilterDropdown
          label="Priorité"
          options={["low", "medium", "high"]}
          selected={selectedPriorities}
          onToggle={(val) => {
            setSelectedPriorities((prev) =>
              prev.includes(val as Priority)
                ? prev.filter((x) => x !== val)
                : [...prev, val as Priority],
            );
            setPage(1);
          }}
        />
        <select
          value={selectedOwner ?? ""}
          onChange={(e) => {
            setSelectedOwner(e.target.value ? Number(e.target.value) : undefined);
            setPage(1);
          }}
          className="h-9 px-3 rounded-lg text-xs font-medium border bg-muted/60 border-transparent text-foreground/80 hover:bg-muted"
        >
          <option value="">Tous les responsables</option>
          {usersData?.map((u) => (
            <option key={u.id} value={u.id}>
              {u.fullName}
            </option>
          ))}
        </select>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground font-semibold inline-flex items-center gap-1.5"
          >
            <X className="h-4 w-4" /> Réinitialiser
          </Button>
        )}
        <div className="ml-auto flex items-center gap-1 p-0.5 rounded-lg bg-muted">
          <button
            onClick={() => setView("table")}
            className={`h-8 w-8 grid place-items-center rounded-md transition-all ${view === "table" ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
            aria-label="Vue tableau"
          >
            <ListIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("cards")}
            className={`h-8 w-8 grid place-items-center rounded-md transition-all ${view === "cards" ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
            aria-label="Vue cartes"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isError ? (
        <div className="card-elegant p-10 text-center text-sm text-destructive">
          {error instanceof ApiError ? error.message : "Impossible de charger les clients."}
        </div>
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="card-elegant p-16 text-center">
          <p className="text-sm text-muted-foreground">
            {hasActiveFilters
              ? "Aucun client ne correspond à ces filtres."
              : "Aucun client pour le moment."}
          </p>
        </div>
      ) : view === "table" ? (
        <div className="card-elegant overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
              <tr>
                <th className="text-left font-semibold px-4 py-3">Client</th>
                <th className="text-left font-semibold px-4 py-3">Entreprise</th>
                <th className="text-left font-semibold px-4 py-3">Statut</th>
                <th className="text-left font-semibold px-4 py-3">Priorité</th>
                <th className="text-left font-semibold px-4 py-3">Responsable</th>
                <th className="text-right font-semibold px-4 py-3">Valeur</th>
                <th className="text-right font-semibold px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-muted/30 transition-colors group border-b border-border/60 last:border-0"
                >
                  <td className="px-4 py-3">
                    <Link to={`/clients/${c.id}`} className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-slate-500 to-slate-700 text-white text-[10px] font-semibold">
                          {c.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left min-w-0 leading-tight">
                        <div className="font-semibold hover:text-primary transition-colors truncate text-sm">
                          {c.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">{c.role}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground truncate max-w-[160px]">
                    {c.company}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize whitespace-nowrap ${statusMap[c.status] || "bg-muted text-foreground"}`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <PriorityDot priority={c.priority} />
                      <span className="text-xs capitalize">
                        {priorityLabel[c.priority] ?? c.priority}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground truncate max-w-[140px]">
                    <span className="flex items-center gap-1.5">
                      <UserAvatar
                        photo={c.ownerPhoto}
                        name={c.ownerName}
                        className="h-5 w-5 shrink-0"
                        fallbackClassName="bg-primary/10 text-primary text-[8px] font-semibold"
                      />
                      <span className="truncate">{c.ownerName}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">
                    {c.value.toLocaleString("fr")} MGA
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-0.5">
                      <Link
                        to={`/clients/${c.id}`}
                        className="h-7 px-2 rounded-md text-[10px] font-semibold bg-primary/10 text-primary hover:bg-primary/15 inline-flex items-center gap-1 whitespace-nowrap"
                      >
                        <Eye className="h-3 w-3" /> Ouvrir
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="hover:bg-muted p-1 rounded transition-colors">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedClient(c);
                              setEditOpen(true);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" /> Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:bg-destructive/10"
                            onClick={() => handleDelete(c)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {data.items.map((c) => (
            <Link
              key={c.id}
              to={`/clients/${c.id}`}
              className="card-elegant p-5 hover:shadow-float hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-200 text-left group block"
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-11 w-11 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                  <AvatarFallback className="bg-gradient-to-br from-slate-500 to-slate-700 text-white font-semibold">
                    {c.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold group-hover:text-primary transition-colors truncate">
                    {c.name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {c.role} • {c.company}
                  </div>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize shrink-0 ${statusMap[c.status] || "bg-muted text-foreground"}`}
                >
                  {c.status}
                </span>
              </div>
              <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2 min-w-0">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{c.email}</span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{c.phone}</span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">
                    {c.city} • {c.sector}
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between gap-2">
                <div className="flex gap-1 min-w-0 overflow-hidden flex-wrap">
                  {c.tags?.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground whitespace-nowrap"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <span className="text-sm font-bold text-primary shrink-0 whitespace-nowrap">
                  {c.value.toLocaleString("fr")} MGA
                </span>
              </div>
            </Link>
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

      {selectedClient && (
        <EditClientDialog
          client={selectedClient}
          open={editOpen}
          onOpenChange={(o) => {
            setEditOpen(o);
            if (!o) setSelectedClient(null);
          }}
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

function EditClientDialog({
  client,
  open,
  onOpenChange,
}: {
  client: ClientDto;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [form, setForm] = useState(client);
  const updateClient = useUpdateClient();

  const handleSave = async () => {
    try {
      await updateClient.mutateAsync({
        id: client.id,
        payload: {
          name: form.name,
          company: form.company,
          position: form.role,
          email: form.email,
          phone: form.phone,
          city: form.city,
          sector: form.sector,
          status: form.status,
          priority: form.priority,
          tags: form.tags,
          value: form.value,
        },
      });
      toast.success("Client mis à jour");
      onOpenChange(false);
    } catch (err) {
      toast.error("Mise à jour impossible", {
        description: err instanceof ApiError ? err.message : "Une erreur est survenue.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>Modifier le client</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/80">Nom complet</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/80">Entreprise</Label>
              <Input
                value={form.company ?? ""}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/80">Fonction</Label>
              <Input
                value={form.role ?? ""}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/80">Email</Label>
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/80">Téléphone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/80">Statut</Label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as ClientStatus })}
                className="w-full h-10 rounded-lg border border-input px-3 text-sm focus:border-ring focus:ring-2 focus:ring-ring/20 outline-none bg-background transition-shadow"
              >
                <option value="prospect">Prospect</option>
                <option value="actif">Actif</option>
                <option value="vip">VIP</option>
                <option value="inactif">Inactif</option>
              </select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateClient.isPending}
            className="gradient-brand text-white border-0"
          >
            {updateClient.isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FilterDropdown({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (val: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`h-9 px-3 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
            selected.length > 0
              ? "bg-primary/10 border-primary/25 text-primary hover:bg-primary/15"
              : "bg-muted/60 border-transparent text-foreground/80 hover:bg-muted hover:border-border"
          }`}
        >
          {label}
          {selected.length > 0 && (
            <span className="h-4.5 min-w-4.5 px-1 rounded-full bg-primary text-white text-[9px] font-bold grid place-items-center">
              {selected.length}
            </span>
          )}
          <span className="text-muted-foreground">↓</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48 max-h-60 overflow-y-auto">
        <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground px-2 py-1">
          Filtrer par {label.toLowerCase()}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((opt) => {
          const checked = selected.includes(opt);
          return (
            <DropdownMenuCheckboxItem
              key={opt}
              checked={checked}
              onCheckedChange={() => onToggle(opt)}
              className="text-xs capitalize"
            >
              {opt}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
