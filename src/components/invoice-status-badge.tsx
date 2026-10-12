import type { InvoiceStatus } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const statusStyles: Record<InvoiceStatus, string> = {
  brouillon: "bg-slate-400/10 text-slate-600 border-slate-200",
  envoyee: "bg-blue-500/10 text-blue-700 border-blue-200",
  payee: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  en_retard: "bg-red-500/10 text-red-700 border-red-200",
  annulee: "bg-slate-400/10 text-slate-500 border-slate-200 line-through",
};

export const invoiceStatusLabel: Record<InvoiceStatus, string> = {
  brouillon: "Brouillon",
  envoyee: "Envoyée",
  payee: "Payée",
  en_retard: "En retard",
  annulee: "Annulée",
};

export function InvoiceStatusBadge({
  status,
  className,
}: {
  status: InvoiceStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap",
        statusStyles[status] ?? "bg-muted text-foreground",
        className,
      )}
    >
      {invoiceStatusLabel[status] ?? status}
    </span>
  );
}

export function formatMoney(value: number): string {
  return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} MGA`;
}
