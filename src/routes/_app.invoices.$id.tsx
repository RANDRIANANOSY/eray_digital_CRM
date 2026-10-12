import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, Download, Edit, Pencil, Check, Send, Ban, Printer } from "lucide-react";
import { useState } from "react";
import { useInvoice, useInvoiceStatus } from "@/hooks/api/useInvoices";
import { InvoiceFormDialog } from "@/components/invoice-form-dialog";
import { InvoiceStatusBadge, formatMoney } from "@/components/invoice-status-badge";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageMeta } from "@/hooks/use-page-meta";
import { toast } from "sonner";
import { ApiError, downloadInvoicePdf } from "@/lib/api";
import type { InvoiceStatus } from "@/lib/api/types";

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const invoiceId = Number(id);
  const navigate = useNavigate();
  const { data: invoice, isLoading, isError } = useInvoice(invoiceId);
  const changeStatus = useInvoiceStatus();
  const [editOpen, setEditOpen] = useState(false);

  usePageMeta(
    invoice ? `${invoice.invoiceNumber} — Eray CRM` : "Facture — Eray CRM",
    invoice
      ? `Détail de la facture ${invoice.invoiceNumber} pour ${invoice.clientName}.`
      : "Détail facture",
  );

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-44 w-full rounded-xl" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !invoice) {
    return (
      <div className="space-y-4">
        <Link
          to="/invoices"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" /> Factures
        </Link>
        <div className="card-elegant p-16 text-center">
          <p className="text-sm text-muted-foreground">Facture introuvable.</p>
        </div>
      </div>
    );
  }

  const handleStatus = async (status: InvoiceStatus) => {
    try {
      await changeStatus.mutateAsync({ id: invoice.id, status });
      toast.success("Statut mis à jour");
    } catch (err) {
      toast.error("Mise à jour impossible", {
        description: err instanceof ApiError ? err.message : "Une erreur est survenue.",
      });
    }
  };

  const handlePdf = async () => {
    try {
      await downloadInvoicePdf(invoice.id);
    } catch (err) {
      toast.error("Téléchargement impossible", {
        description: err instanceof Error ? err.message : "Une erreur est survenue.",
      });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link
          to="/invoices"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" /> Factures
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePdf}>
            <Download className="h-3.5 w-3.5 mr-1.5" /> Télécharger PDF
          </Button>
          <a
            href={`/api/invoices/${invoice.id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 px-3 items-center rounded-md text-xs font-medium border border-input bg-background hover:bg-accent transition-colors"
          >
            <Printer className="h-3.5 w-3.5 mr-1.5" /> Ouvrir PDF
          </a>
          {(invoice.status === "brouillon" || invoice.status === "envoyee") && (
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Edit className="h-3.5 w-3.5 mr-1.5" /> Modifier
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Retour
          </Button>
        </div>
      </div>

      {/* Header card */}
      <div className="card-elegant p-6 animate-fade-in-up">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl lg:text-3xl font-bold">{invoice.invoiceNumber}</h1>
              <InvoiceStatusBadge status={invoice.status} className="text-xs" />
            </div>
            <p className="text-sm text-muted-foreground mt-1.5">
              Émise le {formatDate(invoice.issuedAt)} · Échéance le {formatDate(invoice.dueAt)}
            </p>
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <UserAvatar
                photo={invoice.ownerPhoto}
                name={invoice.ownerName}
                className="h-6 w-6"
                fallbackClassName="bg-primary/10 text-primary text-[10px] font-semibold"
              />
              Responsable : {invoice.ownerName}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Total TTC
            </div>
            <div className="text-2xl font-bold text-primary">{formatMoney(invoice.total)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              (dont {invoice.taxAmount.toLocaleString("fr-FR")} MGA de taxe à {invoice.taxRate}%)
            </div>
            <div className="mt-3 flex items-center gap-2 justify-end">
              {invoice.status !== "envoyee" && invoice.status !== "payee" && (
                <Button size="sm" variant="secondary" onClick={() => handleStatus("envoyee")}>
                  <Send className="h-3.5 w-3.5 mr-1.5" /> Marquer envoyée
                </Button>
              )}
              {invoice.status !== "payee" && invoice.status !== "annulee" && (
                <Button
                  size="sm"
                  className="gradient-brand text-white border-0"
                  onClick={() => handleStatus("payee")}
                >
                  <Check className="h-3.5 w-3.5 mr-1.5" /> Marquer payée
                </Button>
              )}
              {invoice.status === "envoyee" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleStatus("annulee")}
                >
                  <Ban className="h-3.5 w-3.5 mr-1.5" /> Annuler
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Items */}
        <div className="card-elegant overflow-hidden lg:col-span-2 animate-fade-in-up">
          <div className="px-5 py-4 border-b border-border font-display font-bold">
            Détail des lignes
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <tr>
                  <th className="text-left font-semibold px-5 py-2.5">Désignation</th>
                  <th className="text-right font-semibold px-5 py-2.5 w-20">Quantité</th>
                  <th className="text-right font-semibold px-5 py-2.5 w-32">PU HT</th>
                  <th className="text-right font-semibold px-5 py-2.5 w-32">Montant HT</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, i) => (
                  <tr key={i} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                    <td className="px-5 py-3">{item.description}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{item.quantity}</td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {formatMoney(item.unitPrice)}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums font-semibold">
                      {formatMoney(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-4 border-t border-border flex justify-end">
            <div className="w-full max-w-[300px] space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Sous-total HT</span>
                <span className="font-semibold text-foreground">
                  {formatMoney(invoice.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Taxe ({invoice.taxRate}%)</span>
                <span>{formatMoney(invoice.taxAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-primary text-base pt-1.5 border-t border-border">
                <span>Total TTC</span>
                <span>{formatMoney(invoice.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card-elegant p-5 animate-fade-in-up">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2.5">
              Facturé à
            </div>
            <Link to={`/clients/${invoice.clientId}`} className="group block">
              <div className="font-semibold group-hover:text-primary transition-colors">
                {invoice.clientName}
              </div>
            </Link>
            {invoice.company && (
              <div className="text-sm text-muted-foreground mt-0.5">{invoice.company}</div>
            )}
            <div className="h-px bg-border my-3" />
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2.5">
              Opportunité liée
            </div>
            {invoice.opportunityId ? (
              <Link
                to={`/pipeline`}
                className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1.5"
              >
                <Pencil className="h-3.5 w-3.5" /> {invoice.opportunityName}
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">
                Facture autonome (sans opportunité liée)
              </p>
            )}
            <div className="h-px bg-border my-3" />
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
              Validité
            </div>
            <p className="text-sm">
              {formatDate(invoice.issuedAt)} → {formatDate(invoice.dueAt)}
            </p>
          </div>

          {invoice.notes && (
            <div className="card-elegant p-5 animate-fade-in-up">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Notes
              </div>
              <p className="text-sm whitespace-pre-wrap text-foreground/80">{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>

      <InvoiceFormDialog open={editOpen} onOpenChange={setEditOpen} invoice={invoice} />
    </div>
  );
}

function formatDate(value: string): string {
  const [y, m, d] = value.split("-");
  return `${d}/${m}/${y}`;
}
