import { useState } from "react";
import { CheckCircle, Send, XCircle } from "lucide-react";
import { useAppData } from "../../context/AppContext";
import { CourseSwitcher } from "../CourseSwitcher";
import { ExportButton } from "../ExportButton";
import { ReviewStatusBadge } from "../ReviewStatusBadge";
import { registrationExportRows, REGISTRATION_EXPORT_COLUMNS } from "../../lib/exportPresets";

export function LecturerCourseApprovals() {
  const {
    getMyCourses, registrations, refresh,
    lecturerApproveRegistration, lecturerRejectRegistration, submitCourseApprovals,
  } = useAppData();
  const myCourses = getMyCourses();
  const [selectedCourse, setSelectedCourse] = useState(myCourses[0]?.id || "");
  const [note, setNote] = useState("");
  const [feedback, setFeedback] = useState("");

  const courseRegs = registrations.filter(
    r => r.courseId === selectedCourse && r.status === "pending" && r.lecturerStatus !== "rejected"
  );
  const course = myCourses.find(c => c.id === selectedCourse);
  const readyToSubmit = courseRegs.filter(r => r.lecturerStatus === "approved" && !r.submittedToAdmin);

  function act(id: string, action: "approve" | "reject") {
    if (action === "approve") lecturerApproveRegistration(id, note || undefined);
    else lecturerRejectRegistration(id, note || undefined);
    setNote("");
    refresh();
  }

  function handleSubmitBatch() {
    if (!selectedCourse) return;
    submitCourseApprovals(selectedCourse);
    setFeedback(`Submitted ${readyToSubmit.length} approved registration(s) to admin.`);
    setTimeout(() => setFeedback(""), 3000);
  }

  if (!myCourses.length) {
    return <p className="text-sm text-muted-foreground text-center py-12">No courses assigned yet.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-lg border border-border p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-lg font-bold font-[Outfit] text-foreground">Course Registration Review</h2>
          <ExportButton
            options={{
              title: `Registration Review — ${course?.code || ""}`,
              filename: `registrations_${course?.code || "course"}`,
              columns: REGISTRATION_EXPORT_COLUMNS,
              rows: registrationExportRows(courseRegs),
            }}
          />
        </div>
        <CourseSwitcher courses={myCourses} selectedId={selectedCourse} onSelect={setSelectedCourse} className="mb-4" />
        <p className="text-xs text-muted-foreground mb-4">
          Review students who registered for your course. Approve individually, then submit the approved list to the registrar.
        </p>

        {courseRegs.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No pending registrations for this course.</p>
        )}

        <div className="space-y-2">
          {courseRegs.map(r => (
            <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 px-4 rounded-lg border border-border bg-muted/20">
              <div>
                <p className="text-sm font-semibold text-foreground">{r.studentName}</p>
                <p className="text-xs text-muted-foreground font-mono">{r.matricNo} — {r.courseCode}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{r.subjects.join(" · ")}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <ReviewStatusBadge status={r.lecturerStatus || "pending"} />
                {r.submittedToAdmin && <span className="text-[10px] text-primary font-semibold">Sent to admin</span>}
                {!r.submittedToAdmin && (r.lecturerStatus === "pending" || !r.lecturerStatus) && (
                  <>
                    <button type="button" onClick={() => act(r.id, "approve")}
                      className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg font-semibold hover:bg-green-100">
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button type="button" onClick={() => act(r.id, "reject")}
                      className="flex items-center gap-1 text-xs text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg font-semibold hover:bg-red-100">
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Optional note for next action"
            className="flex-1 text-sm bg-input-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-accent" />
          <button type="button" onClick={handleSubmitBatch} disabled={readyToSubmit.length === 0}
            className="inline-flex items-center gap-2 bg-accent text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-accent/90 disabled:opacity-50">
            <Send className="w-4 h-4" /> Submit {readyToSubmit.length} to Admin
          </button>
        </div>
        {feedback && <p className="text-xs text-primary mt-2">{feedback}</p>}
      </div>
    </div>
  );
}
