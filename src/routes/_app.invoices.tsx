import { Link } from "react-router";
import { usePageMeta } from "@/hooks/use-page-meta";
import { useState } from "react";
import {
  FileText,
  Search,
  Plus,
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  X,
  Check,
  Send,
  Ban,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useInvoices, useInvoiceStatus, useDeleteInvoice } from "@/hooks/api/useInvoices";
import { useUsers } from "@/hooks/api/useUsers";
import { InvoiceFormDialog } from "@/components/invoice-form-dialog";
import { InvoiceStatusBadge, formatMoney } from "@/components/invoice-status-badge";
import { ConfirmDialog, type ConfirmDialogState } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "sonner";
import { ApiError, downloadInvoicePdf } from "@/lib/api";
import type { InvoiceDto, InvoiceListFilters, InvoiceStatus } from "@/lib/api/types";

const PER_PAGE = 10;

const statusFilterOptions: { value: InvoiceStatus; label: string }[] = [
  { value: "brouillon", label: "Brouillons" },
  { value: "envoyee", label: "Envoyées" },
  { value: "payee", label: "Payées" },
  { value: "en_retard", label: "En retard" },
  { value: "annulee", label: "Annulées" },
];

export default function InvoicesPage() {
  usePageMeta("Factures — Eray CRM", "Gérez vos factures et exports PDF.");
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<InvoiceStatus[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<InvoiceDto | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmDialogState | null>(null);

  const filters: InvoiceListFilters = {
    q: query || undefined,
    status: selectedStatuses.length ? selectedStatuses : undefined,
    owner: selectedOwner,
    page,
    perPage: PER_PAGE,
    sort: "issuedAt",
    dir: "desc",
  };

  const { data: usersData } = useUsers();
  const { data, isLoading, isError, error } = useInvoices(filters);
  const changeStatus = useInvoiceStatus();
  const deleteInvoice = useDeleteInvoice();

  const hasActiveFilters =
    selectedStatuses.length > 0 || selectedOwner !== undefined || query !== "";

  const resetFilters = () => {
    setSelectedStatuses([]);
    setSelectedOwner(undefined);
    setQuery("");
    setPage(1);
  };

  const handleStatus = async (invoice: InvoiceDto, status: InvoiceStatus) => {
    try {
      await changeStatus.mutateAsync({ id: invoice.id, status });
      toast.success("Statut mis à jour");
    } catch (err) {
      toast.error("Mise à jour impossible", {
        description: err instanceof ApiError ? err.message : "Une erreur est survenue.",
      });
    }
  };

  const handleDelete = (invoice: InvoiceDto) => {
    setConfirm({
      title: "Supprimer la facture",
      description: `Voulez-vous vraiment supprimer la facture ${invoice.invoiceNumber} ? Seules les factures brouillons peuvent être supprimées.`,
      confirmLabel: "Supprimer",
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteInvoice.mutateAsync(invoice.id);
          toast.success("Facture supprimée");
        } catch (err) {
          toast.error("Suppression impossible", {
            description: err instanceof ApiError ? err.message : "Une erreur est survenue.",
          });
        }
      },
    });
  };

  const handlePdf = async (invoice: InvoiceDto) => {
    try {
      await downloadInvoicePdf(invoice.id);
    } catch (err) {
      toast.error("Téléchargement impossible", {
        description: err instanceof Error ? err.message : "Une erreur est survenue.",
      });
    }
  };

  const summary = data?.summary;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Factures</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data ? `${data.meta.total} factures` : "Chargement…"}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gradient-brand text-white border-0">
          <Plus className="h-4 w-4 mr-1.5" /> Nouvelle facture
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in-up">
        <StatCard
          title="Total facturé (7 jours)"
          value={summary ? `${summary.total.toLocaleString("fr-FR")} MGA` : "…"}
          icon={<FileText className="h-5 w-5" />}
          gradient="from-teal-500 via-emerald-600 to-green-600"
        />
        <StatCard
          title="En attente de paiement"
          value={
            summary ? `${(summary.statuses.envoyee ?? 0) + (summary.statuses.en_retard ?? 0)}` : "…"
          }
          icon={<Clock className="h-5 w-5" />}
          gradient="from-amber-500 via-orange-500 to-red-500"
        />
        <StatCard
          title="Payées"
          value={summary ? `${summary.statuses.payee ?? 0}` : "…"}
          icon={<Check className="h-5 w-5" />}
          gradient="from-emerald-500 via-teal-600 to-green-600"
        />
        <StatCard
          title="Brouillons"
          value={summary ? `${summary.statuses.brouillon ?? 0}` : "…"}
          icon={<Ban className="h-5 w-5" />}
          gradient="from-sky-400 via-blue-500 to-indigo-600"
        />
      </div>

      <div className="card-elegant p-3 flex flex-wrap items-center gap-2 animate-fade-in-up">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher un n° de facture, un client…"
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted/60 border border-transparent hover:bg-muted hover:border-border focus:bg-card focus:border-ring focus:ring-2 focus:ring-ring/15 outline-none text-sm transition-all duration-200"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`h-9 px-3 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                selectedStatuses.length > 0
                  ? "bg-primary/10 border-primary/25 text-primary hover:bg-primary/15"
                  : "bg-muted/60 border-transparent text-foreground/80 hover:bg-muted hover:border-border"
              }`}
            >
              Statut
              {selectedStatuses.length > 0 && (
                <span className="h-4.5 min-w-4.5 px-1 rounded-full bg-primary text-white text-[9px] font-bold grid place-items-center">
                  {selectedStatuses.length}
                </span>
              )}
              <span className="text-muted-foreground">↓</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {statusFilterOptions.map((opt) => {
              const checked = selectedStatuses.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    setSelectedStatuses((prev) =>
                      checked ? prev.filter((s) => s !== opt.value) : [...prev, opt.value],
                    );
                    setPage(1);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-md text-xs hover:bg-muted flex items-center gap-2"
                >
                  <input type="checkbox" checked={checked} readOnly className="accent-primary" />
                  {opt.label}
                </button>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
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
      </div>

      {isError ? (
        <div className="card-elegant p-10 text-center text-sm text-destructive">
          {error instanceof ApiError ? error.message : "Impossible de charger les factures."}
        </div>
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="card-elegant p-16 text-center">
          <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {hasActiveFilters
              ? "Aucune facture ne correspond à ces filtres."
              : "Aucune facture pour le moment."}
          </p>
        </div>
      ) : (
        <div className="card-elegant overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
              <tr>
                <th className="text-left font-semibold px-4 py-3">N° facture</th>
                <th className="text-left font-semibold px-4 py-3">Client</th>
                <th className="text-left font-semibold px-4 py-3">Statut</th>
                <th className="text-left font-semibold px-4 py-3">Émission</th>
                <th className="text-left font-semibold px-4 py-3">Échéance</th>
                <th className="text-left font-semibold px-4 py-3">Responsable</th>
                <th className="text-right font-semibold px-4 py-3">Total TTC</th>
                <th className="text-right font-semibold px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((inv) => (
                <tr
                  key={inv.id}
                  className="hover:bg-muted/30 transition-colors group border-b border-border/60 last:border-0"
                >
                  <td className="px-4 py-3">
                    <Link to={`/invoices/${inv.id}`} className="font-semibold hover:text-primary">
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/clients/${inv.clientId}`}
                      className="hover:text-primary transition-colors"
                    >
                      <div className="font-medium truncate max-w-[180px]">{inv.clientName}</div>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button>
                          <InvoiceStatusBadge status={inv.status} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {(["brouillon", "envoyee", "payee", "annulee"] as InvoiceStatus[]).map(
                          (s) =>
                            s !== inv.status ? (
                              <DropdownMenuItem
                                key={s}
                                onClick={() => handleStatus(inv, s)}
                                className="text-xs"
                              >
                                <span className="capitalize">
                                  Marquer comme{" "}
                                  {s === "envoyee"
                                    ? "envoyée"
                                    : s === "payee"
                                      ? "payée"
                                      : s === "annulee"
                                        ? "annulée"
                                        : "brouillon"}
                                </span>
                              </DropdownMenuItem>
                            ) : null,
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {formatDate(inv.issuedAt)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {formatDate(inv.dueAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-muted-foreground truncate max-w-[140px]">
                      <UserAvatar
                        photo={inv.ownerPhoto}
                        name={inv.ownerName}
                        className="h-5 w-5 shrink-0"
                        fallbackClassName="bg-primary/10 text-primary text-[8px] font-semibold"
                      />
                      <span className="truncate">{inv.ownerName}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">
                    {formatMoney(inv.total)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-0.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-[10px] font-semibold"
                        onClick={() => handlePdf(inv)}
                      >
                        <Download className="h-3 w-3" /> PDF
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="hover:bg-muted p-1 rounded transition-colors">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/invoices/${inv.id}`)}>
                            <Eye className="mr-2 h-4 w-4" /> Détails
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditTarget(inv);
                              setEditOpen(true);
                            }}
                            disabled={inv.status === "payee" || inv.status === "annulee"}
                          >
                            <Edit className="mr-2 h-4 w-4" /> Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handlePdf(inv)}>
                            <Download className="mr-2 h-4 w-4" /> Télécharger PDF
                          </DropdownMenuItem>
                          {inv.status !== "envoyee" && inv.status !== "payee" && (
                            <DropdownMenuItem onClick={() => handleStatus(inv, "envoyee")}>
                              <Send className="mr-2 h-4 w-4" /> Marquer envoyée
                            </DropdownMenuItem>
                          )}
                          {inv.status !== "payee" && (
                            <DropdownMenuItem onClick={() => handleStatus(inv, "payee")}>
                              <Check className="mr-2 h-4 w-4" /> Marquer payée
                            </DropdownMenuItem>
                          )}
                          {inv.status === "brouillon" && (
                            <DropdownMenuItem
                              className="text-destructive focus:bg-destructive/10"
                              onClick={() => handleDelete(inv)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

      <InvoiceFormDialog open={createOpen} onOpenChange={setCreateOpen} invoice={null} />
      <InvoiceFormDialog open={editOpen} onOpenChange={setEditOpen} invoice={editTarget} />
      <ConfirmDialog
        open={confirm !== null}
        state={confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
      />
    </div>
  );
}

function formatDate(value: string): string {
  const [y, m, d] = value.split("-");
  return `${d}/${m}/${y}`;
}
