import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useClients } from "@/hooks/api/useClients";
import { useCreateInvoice, useUpdateInvoice } from "@/hooks/api/useInvoices";
import { ApiError } from "@/lib/api";
import type { InvoiceDto, InvoiceItemPayload, InvoicePayload } from "@/lib/api/types";

const today = () => new Date().toISOString().slice(0, 10);

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface InvoiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice?: InvoiceDto | null;
}

export function InvoiceFormDialog({ open, onOpenChange, invoice }: InvoiceFormDialogProps) {
  const { data: clientsData, isLoading: clientsLoading } = useClients({
    status: ["actif", "prospect", "vip"],
    perPage: 100,
  });
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();

  const [clientId, setClientId] = useState<number | "">("");
  const [issuedAt, setIssuedAt] = useState(today);
  const [dueAt, setDueAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ description: "", quantity: 1, unitPrice: 0 }]);

  useEffect(() => {
    if (!open) return;
    if (invoice) {
      setClientId(invoice.clientId);
      setIssuedAt(invoice.issuedAt);
      setDueAt(invoice.dueAt);
      setTaxRate(invoice.taxRate);
      setNotes(invoice.notes ?? "");
      setItems(
        invoice.items.map((i) => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      );
    } else {
      setClientId("");
      setIssuedAt(today());
      const d = new Date();
      d.setDate(d.getDate() + 30);
      setDueAt(d.toISOString().slice(0, 10));
      setTaxRate(0);
      setNotes("");
      setItems([{ description: "", quantity: 1, unitPrice: 0 }]);
    }
  }, [open, invoice]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, it) => sum + (it.quantity || 0) * (it.unitPrice || 0), 0);
    const tax = (subtotal * (taxRate || 0)) / 100;
    return { subtotal, tax, total: subtotal + tax };
  }, [items, taxRate]);

  const setItem = (index: number, patch: Partial<LineItem>) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };

  const payload = (): InvoicePayload => ({
    clientId: Number(clientId),
    issuedAt,
    dueAt,
    status: invoice?.status ?? "brouillon",
    taxRate: taxRate || 0,
    notes: notes || null,
    items: items
      .filter((it) => it.description.trim() !== "")
      .map((it): InvoiceItemPayload => ({
        description: it.description.trim(),
        quantity: it.quantity || 1,
        unitPrice: it.unitPrice || 0,
      })),
  });

  const handleSave = async () => {
    if (!clientId) {
      toast.error("Sélectionnez un client.");
      return;
    }
    const cleanItems = items.filter((it) => it.description.trim() !== "");
    if (cleanItems.length === 0) {
      toast.error("Ajoutez au moins une ligne avec une description.");
      return;
    }
    try {
      if (invoice) {
        await updateInvoice.mutateAsync({ id: invoice.id, payload: payload() });
        toast.success("Facture mise à jour");
      } else {
        await createInvoice.mutateAsync(payload());
        toast.success("Facture créée");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(invoice ? "Mise à jour impossible" : "Création impossible", {
        description: err instanceof ApiError ? err.message : "Une erreur est survenue.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {invoice ? `Modifier ${invoice.invoiceNumber}` : "Nouvelle facture"}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/80">Client</Label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value ? Number(e.target.value) : "")}
                className="w-full h-10 rounded-lg border border-input px-3 text-sm focus:border-ring focus:ring-2 focus:ring-ring/20 outline-none bg-background transition-shadow disabled:opacity-60"
                disabled={clientsLoading}
              >
                <option value="">
                  {clientsLoading ? "Chargement…" : "Sélectionner un client"}
                </option>
                {clientsData?.items.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.company ? ` — ${c.company}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/80">Date d'émission</Label>
              <Input type="date" value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/80">Échéance</Label>
              <Input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/80">Taxe (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground/80">Lignes de facture</Label>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() =>
                  setItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0 }])
                }
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter une ligne
              </Button>
            </div>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 rounded-lg border border-border/70 p-2 bg-muted/40"
                >
                  <Input
                    placeholder="Description (ex. Prestation conseil)"
                    value={item.description}
                    onChange={(e) => setItem(index, { description: e.target.value })}
                    className="flex-1 min-w-0"
                  />
                  <Input
                    type="number"
                    min={1}
                    className="w-20"
                    aria-label="Quantité"
                    value={item.quantity}
                    onChange={(e) => setItem(index, { quantity: Number(e.target.value) })}
                  />
                  <Input
                    type="number"
                    min={0}
                    step={100}
                    className="w-32"
                    aria-label="Prix unitaire"
                    value={item.unitPrice}
                    onChange={(e) => setItem(index, { unitPrice: Number(e.target.value) })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="ml-auto w-full max-w-[280px] rounded-lg border border-border p-3 space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Sous-total HT</span>
              <span className="font-semibold text-foreground">
                {totals.subtotal.toLocaleString("fr-FR")} MGA
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Taxe ({taxRate}%)</span>
              <span>{totals.tax.toLocaleString("fr-FR")} MGA</span>
            </div>
            <div className="flex justify-between font-bold text-primary pt-1 border-t border-border">
              <span>Total TTC</span>
              <span>{totals.total.toLocaleString("fr-FR")} MGA</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground/80">
              Notes / mentions légales
            </Label>
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Modalités de paiement, numéro NIF, garantie…"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={createInvoice.isPending || updateInvoice.isPending}
            className="gradient-brand text-white border-0"
          >
            {createInvoice.isPending || updateInvoice.isPending
              ? "Enregistrement…"
              : invoice
                ? "Enregistrer"
                : "Créer la facture"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
