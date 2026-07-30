import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import type { ExportFormat } from "../lib/types";
import { exportData, type ExportOptions } from "../lib/export";

interface ExportButtonProps {
  options: ExportOptions;
  compact?: boolean;
}

const FORMATS: { key: ExportFormat; label: string; icon: typeof FileText }[] = [
  { key: "pdf", label: "PDF", icon: FileText },
  { key: "docx", label: "DOCX", icon: FileText },
  { key: "csv", label: "Excel/CSV", icon: FileSpreadsheet },
];

export function ExportButton({ options, compact = false }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<ExportFormat | null>(null);
  const [error, setError] = useState("");

  async function handleExport(format: ExportFormat) {
    if (!options.rows.length) {
      setError("No data to export.");
      setTimeout(() => setError(""), 2500);
      return;
    }
    setLoading(format);
    setError("");
    try {
      await exportData(format, options);
      setOpen(false);
    } catch {
      setError("Export failed. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`inline-flex items-center gap-1.5 text-xs font-semibold border border-border rounded-lg hover:bg-muted/50 transition-colors ${
          compact ? "px-2.5 py-1.5" : "px-3 py-2"
        }`}
      >
        <Download className="w-3.5 h-3.5" />
        Export
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[140px]">
            {FORMATS.map(f => (
              <button
                key={f.key}
                type="button"
                disabled={!!loading}
                onClick={() => handleExport(f.key)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-muted/50 disabled:opacity-50"
              >
                {loading === f.key ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <f.icon className="w-3.5 h-3.5 text-muted-foreground" />
                )}
                {f.label}
              </button>
            ))}
          </div>
        </>
      )}
      {error && <p className="absolute right-0 top-full mt-1 text-[10px] text-destructive whitespace-nowrap">{error}</p>}
    </div>
  );
}
