import { useState } from "react";
import {
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { importExportApi } from "@/lib/api";
import { ApiError } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [exporting, setExporting] = useState<"clients" | "opportunities" | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportClients = async () => {
    setExporting("clients");
    setMessage(null);
    try {
      const blob = await importExportApi.exportClients();
      const filename = `clients_eray_crm_${new Date().toISOString().slice(0, 10)}.csv`;
      triggerDownload(blob, filename);
      setMessage({ type: "success", text: "Export clients réussi." });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof ApiError ? err.message : "Erreur lors de l'export des clients.",
      });
    } finally {
      setExporting(null);
    }
  };

  const handleExportOpportunities = async () => {
    setExporting("opportunities");
    setMessage(null);
    try {
      const blob = await importExportApi.exportOpportunities();
      const filename = `opportunites_eray_crm_${new Date().toISOString().slice(0, 10)}.csv`;
      triggerDownload(blob, filename);
      setMessage({ type: "success", text: "Export opportunités réussi." });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof ApiError ? err.message : "Erreur lors de l'export des opportunités.",
      });
    } finally {
      setExporting(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage(null);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setMessage(null);
    try {
      const res = await importExportApi.importClients(file);
      let text = res.message;
      if (res.skipped_count > 0 && res.errors.length > 0) {
        text += `\n${res.errors.slice(0, 5).join("\n")}`;
        if (res.errors.length > 5) {
          text += `\n… et ${res.errors.length - 5} autre(s) erreur(s).`;
        }
      }
      setMessage({ type: "success", text });
      setFile(null);
      if (onImportSuccess) onImportSuccess();
    } catch (err) {
      const messageText =
        err instanceof ApiError ? err.message : "Erreur lors de l'importation du fichier CSV.";
      const fieldErrors = err instanceof ApiError ? err.fieldErrors() : {};
      const detail =
        fieldErrors && typeof fieldErrors === "object"
          ? Object.values(fieldErrors).flat().join("\n")
          : "";
      setMessage({
        type: "error",
        text: detail ? `${messageText}\n${detail}` : messageText,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl bg-white rounded-xl shadow-2xl p-6 border border-slate-100">
        <DialogHeader className="mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900">
                Import & Export de Données (CSV / Excel)
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                Exportez vos données CRM ou importez une liste de nouveaux prospects.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Section Exporter */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center space-x-2">
              <Download className="w-4 h-4 text-blue-600" />
              <span>Exporter les Données</span>
            </h4>
            <p className="text-xs text-slate-500 mb-3">
              Téléchargez vos fiches clients ou vos opportunités commerciales sous forme de tableur
              CSV compatible Excel.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={handleExportClients}
                disabled={exporting === "clients"}
                className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1.5"
              >
                {exporting === "clients" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-blue-500" />
                )}
                <span>Exporter Clients (.csv)</span>
              </Button>
              <Button
                type="button"
                onClick={handleExportOpportunities}
                disabled={exporting === "opportunities"}
                className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1.5"
              >
                {exporting === "opportunities" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-emerald-500" />
                )}
                <span>Exporter Opportunités (.csv)</span>
              </Button>
            </div>
          </div>

          {/* Section Importer */}
          <form
            onSubmit={handleImportSubmit}
            className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3"
          >
            <h4 className="text-sm font-bold text-slate-800 mb-1 flex items-center space-x-2">
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>Importer des Clients (Fichier CSV)</span>
            </h4>
            <p className="text-xs text-slate-500">
              Format attendu :{" "}
              <code className="bg-slate-200 px-1 rounded">
                Nom;Entreprise;Email;Téléphone;Ville;Secteur;Statut;Priorité;Tags;Valeur
              </code>
            </p>

            <div className="flex items-center space-x-3 pt-2">
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
              <Button
                type="submit"
                disabled={!file || uploading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-2 rounded-lg font-medium shadow flex items-center space-x-1.5 ml-auto"
              >
                {uploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>Lancer l'Import</span>
              </Button>
            </div>
          </form>

          {message && (
            <div
              className={`p-3 rounded-lg flex items-start space-x-2 text-xs font-medium whitespace-pre-line ${
                message.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
