import { AlertCircle } from "lucide-react";
import { COURSE_REGISTRATION_FEE, formatCourseFee } from "../lib/types";

export function CourseFeeNotice() {
  return (
    <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-700" />
      <div>
        <p className="font-semibold text-foreground">Course fee payment required</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          You must pay {formatCourseFee(COURSE_REGISTRATION_FEE)} for every registered course at the bursary.
          After paying physically, your course lecturer will confirm payment on their portal. Until then, your payment status will show as unpaid.
        </p>
      </div>
    </div>
  );
}
