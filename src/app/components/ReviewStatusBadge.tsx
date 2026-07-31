import type { ReviewStatus } from "../lib/types";

const STYLES: Record<ReviewStatus, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  pending: "bg-amber-50 text-amber-800 border-amber-200",
  dean_review: "bg-blue-50 text-blue-800 border-blue-200",
  approved: "bg-green-50 text-green-800 border-green-200",
  rejected: "bg-red-50 text-red-800 border-red-200",
};

const LABELS: Record<ReviewStatus, string> = {
  draft: "Draft",
  pending: "Pending Dean Review",
  dean_review: "Forwarded to Registrar",
  approved: "Approved",
  rejected: "Rejected",
};

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded border font-semibold capitalize ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  );
}
