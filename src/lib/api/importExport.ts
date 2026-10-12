import { http } from "./http";
import type { ImportResult } from "./types";

export const importExportApi = {
  importClients: (file: File): Promise<ImportResult> => {
    const formData = new FormData();
    formData.append("file", file);

    return http.postForm<ImportResult>("/api/clients/import", formData);
  },

  exportClients: (): Promise<Blob> => http.getBlob("/api/clients/export"),

  exportOpportunities: (): Promise<Blob> => http.getBlob("/api/opportunities/export"),
};
