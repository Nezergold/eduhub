import { useEffect, useState } from "react";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { isCloudEnabled, getCloudConfigIssue } from "../lib/config";
import { getSyncStatus, onSyncStatusChange, pullCloudStores, type SyncStatus } from "../lib/cloudSync";

const LABELS: Record<SyncStatus, string> = {
  idle: "Cloud ready",
  syncing: "Syncing…",
  synced: "Synced",
  error: "Sync issue",
  offline: "Local only",
  needs_setup: "DB setup needed",
};

export function CloudSyncIndicator({ onRefresh }: { onRefresh?: () => void }) {
  const [status, setStatus] = useState<SyncStatus>(getSyncStatus());

  useEffect(() => onSyncStatusChange(setStatus), []);

  if (!isCloudEnabled()) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 border border-border px-2 py-0.5 rounded-full" title="Add Supabase env vars for multi-device sync">
        <CloudOff className="w-3 h-3" /> Local only
      </span>
    );
  }

  if (getCloudConfigIssue()) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full" title={getCloudConfigIssue()!}>
        <CloudOff className="w-3 h-3" /> Config error
      </span>
    );
  }

  const spinning = status === "syncing";
  const warn = status === "error" || status === "needs_setup";

  return (
    <button
      type="button"
      title={status === "needs_setup" ? "Run supabase/setup-all.sql in Supabase SQL Editor" : "Tap to refresh from cloud"}
      onClick={() => {
        void pullCloudStores().then(() => onRefresh?.());
      }}
      className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full transition-colors ${
        warn
          ? "text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100"
          : "text-primary bg-primary/5 border border-primary/15 hover:bg-primary/10"
      }`}
    >
      {spinning ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Cloud className="w-3 h-3" />}
      {LABELS[status]}
    </button>
  );
}
