import { AlertCircle } from "lucide-react";
import { getCloudConfigIssue } from "../lib/config";

export function CloudConfigBanner() {
  const issue = getCloudConfigIssue();
  if (!issue) return null;

  return (
    <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold">Supabase configuration issue</p>
        <p className="text-xs mt-1 leading-relaxed">{issue}</p>
        <p className="text-xs mt-2 text-amber-900/80">
          Then run <code className="font-mono bg-amber-100/80 px-1 rounded">npm run setup:supabase</code> to verify.
        </p>
      </div>
    </div>
  );
}
