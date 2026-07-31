import { useState } from "react";
import { CheckCircle } from "lucide-react";
import { useAppData } from "../../context/AppContext";
import { CourseSwitcher } from "../CourseSwitcher";
import { ExportButton } from "../ExportButton";
import { PageHeader, PortalCard, DataTableShell } from "./PortalUI";
import { registrationExportRows, REGISTRATION_EXPORT_COLUMNS } from "../../lib/exportPresets";
import { formatCourseFee } from "../../lib/types";
import { paymentBadge as paymentBadgeClass } from "../../lib/utils";

export function LecturerFeePayments() {
  const { getMyCourses, registrations, approveCoursePayment } = useAppData();
  const myCourses = getMyCourses();
  const [selectedCourse, setSelectedCourse] = useState(myCourses[0]?.id || "");
  const [feedback, setFeedback] = useState("");

  const courseRegs = registrations.filter(
    r => r.courseId === selectedCourse && r.status !== "rejected"
  );
  const course = myCourses.find(c => c.id === selectedCourse);
  const unpaid = courseRegs.filter(r => r.paymentStatus !== "paid");

  function handleApprove(regId: string) {
    const ok = approveCoursePayment(regId);
    setFeedback(ok ? "Payment confirmed. Status updated across all portals." : "Could not confirm payment.");
    setTimeout(() => setFeedback(""), 3000);
  }

  if (!myCourses.length) {
    return <p className="text-sm text-muted-foreground text-center py-12">No courses assigned yet.</p>;
  }

  return (
    <PortalCard>
      <PageHeader
        title="Course Fee Verification"
        description="Confirm payment after a student has paid course fees physically at the bursary. Updates sync across all devices."
        action={
          <ExportButton
            compact
            options={{
              title: `Fee Records — ${course?.code || ""}`,
              filename: `fee_payments_${course?.code || "course"}`,
              columns: REGISTRATION_EXPORT_COLUMNS,
              rows: registrationExportRows(courseRegs),
            }}
          />
        }
      />

      <CourseSwitcher courses={myCourses} selectedId={selectedCourse} onSelect={setSelectedCourse} className="mb-4" />

      {course && (
        <p className="text-xs text-muted-foreground mb-4 bg-muted/30 border border-border rounded-lg px-3 py-2">
          {unpaid.length} of {courseRegs.length} student(s) awaiting fee confirmation for <strong className="font-mono">{course.code}</strong>.
        </p>
      )}

      {feedback && <p className="text-xs text-primary font-medium mb-3">{feedback}</p>}

      {courseRegs.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">No students registered for this course yet.</p>
      )}

      <div className="overflow-x-auto md:hidden space-y-3 mb-4">
        {courseRegs.map(reg => (
          <div key={reg.id} className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
            <p className="text-sm font-semibold text-foreground">{reg.studentName}</p>
            <p className="text-xs font-mono text-muted-foreground">{reg.matricNo}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span>{formatCourseFee(reg.courseFee)}</span>
              <span className={paymentBadgeClass(reg.paymentStatus)}>{reg.paymentStatus}</span>
            </div>
            {reg.paymentStatus !== "paid" && (
              <button
                type="button"
                onClick={() => handleApprove(reg.id)}
                className="w-full sm:w-auto text-xs font-semibold bg-accent text-white px-3 py-2 rounded-lg hover:bg-accent/90 transition-colors flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Confirm payment
              </button>
            )}
          </div>
        ))}
      </div>

      <DataTableShell minWidth={640} className="hidden md:block">
        <table className="w-full">
          {courseRegs.length > 0 && (
            <thead>
              <tr className="bg-muted/50 text-left">
                <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Student</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Matric</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Fee</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Payment</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase w-36">Action</th>
              </tr>
            </thead>
          )}
          <tbody>
            {courseRegs.map(r => (
              <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                <td className="px-4 py-3 text-sm font-medium">{r.studentName}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.matricNo}</td>
                <td className="px-4 py-3 text-xs font-semibold">{formatCourseFee(r.courseFee)}</td>
                <td className="px-4 py-3">
                  <span className={`text-[11px] px-2 py-0.5 rounded border font-semibold capitalize ${paymentBadgeClass(r.paymentStatus)}`}>
                    {r.paymentStatus}
                  </span>
                  {r.paymentApprovedAt && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(r.paymentApprovedAt).toLocaleDateString()}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  {r.paymentStatus === "unpaid" ? (
                    <button
                      type="button"
                      onClick={() => handleApprove(r.id)}
                      className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg font-semibold hover:bg-green-100"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Confirm Paid
                    </button>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">Verified</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTableShell>
    </PortalCard>
  );
}
