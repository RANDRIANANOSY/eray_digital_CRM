import { buildQuery, http } from "./http";
import type { InvoiceDto, InvoiceListFilters, InvoiceListResult, InvoicePayload } from "./types";

export const invoicesApi = {
  list: (filters: InvoiceListFilters = {}) =>
    http.get<InvoiceListResult>(`/api/invoices${buildQuery(filters)}`),
  get: (id: number) => http.get<InvoiceDto>(`/api/invoices/${id}`),
  create: (payload: InvoicePayload) => http.post<InvoiceDto>("/api/invoices", payload),
  fromOpportunity: (opportunityId: number) =>
    http.post<InvoiceDto>(`/api/invoices/from-opportunity/${opportunityId}`),
  update: (id: number, payload: InvoicePayload) =>
    http.put<InvoiceDto>(`/api/invoices/${id}`, payload),
  changeStatus: (id: number, status: string) =>
    http.patch<InvoiceDto>(`/api/invoices/${id}/status`, { status }),
  remove: (id: number) => http.delete<null>(`/api/invoices/${id}`),
  pdfUrl: (id: number) => `/api/invoices/${id}/pdf`,
};

export async function downloadInvoicePdf(id: number): Promise<void> {
  const response = await fetch(invoicesApi.pdfUrl(id), { credentials: "include" });
  if (!response.ok) {
    throw new Error("Impossible de télécharger la facture.");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `facture-${id}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
