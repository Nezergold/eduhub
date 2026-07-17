import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { useAppData } from "../../context/AppContext";
import { ExportButton } from "../ExportButton";
import { ReviewStatusBadge } from "../ReviewStatusBadge";
import { scoreExportRows, SCORE_EXPORT_COLUMNS, courseSubmissionExportRows } from "../../lib/exportPresets";
import { gradeBg } from "../../lib/utils";

export function AdminResultReviews() {
  const {
    pendingResultReviews, courseApprovalSubmissions, scores,
    reviewResult, reviewAllPendingResults, reviewCourseSubmission, registrations,
  } = useAppData();
  const [tab, setTab] = useState<"results" | "courses">("results");
  const [rejectNote, setRejectNote] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");

  const courseCodes = [...new Set(pendingResultReviews.map(s => s.courseCode))];
  const filteredResults = selectedCourse
    ? pendingResultReviews.filter(s => s.courseCode === selectedCourse)
    : pendingResultReviews;

  const adminPendingRegs = registrations.filter(r => r.submittedToAdmin && r.status === "pending");
  const pendingSubmissions = courseApprovalSubmissions.filter(s => s.status === "pending");

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {(["results", "courses"] as const).map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all capitalize ${
              tab === t ? "bg-accent text-white border-accent" : "border-border text-muted-foreground"
            }`}>
            {t === "results" ? `Result Reviews (${pendingResultReviews.length})` : `Course Batches (${pendingSubmissions.length})`}
          </button>
        ))}
      </div>

      {tab === "results" && (
        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-lg font-bold font-[Outfit]">Submitted Results for Review</h2>
            <ExportButton
              options={{
                title: "Pending Result Reviews",
                filename: "pending_results",
                columns: SCORE_EXPORT_COLUMNS,
                rows: scoreExportRows(filteredResults),
              }}
            />
          </div>

          {courseCodes.length > 1 && (
            <div className="flex gap-2 flex-wrap mb-4">
              <button type="button" onClick={() => setSelectedCourse("")}
                className={`text-xs px-2.5 py-1 rounded border ${!selectedCourse ? "bg-accent text-white border-accent" : "border-border"}`}>
                All
              </button>
              {courseCodes.map(code => (
                <button key={code} type="button" onClick={() => setSelectedCourse(code)}
                  className={`text-xs font-mono px-2.5 py-1 rounded border ${selectedCourse === code ? "bg-accent text-white border-accent" : "border-border"}`}>
                  {code}
                </button>
              ))}
            </div>
          )}

          {filteredResults.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No results awaiting review.</p>
          )}

          <div className="space-y-2">
            {filteredResults.map(s => (
              <div key={`${s.studentId}-${s.courseCode}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 px-4 rounded-lg border border-amber-200 bg-amber-50/50">
                <div>
                  <p className="text-sm font-semibold">{s.studentName} <span className="font-mono text-xs text-muted-foreground">({s.matricNo})</span></p>
                  <p className="text-xs text-muted-foreground">{s.courseCode} — CA {s.ca} + Exam {s.exam} = {s.total}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded mt-1 inline-block ${gradeBg(s.grade)}`}>{s.grade}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ReviewStatusBadge status="pending" />
                  <button type="button" onClick={() => reviewResult(s.studentId, s.courseCode, "approved")}
                    className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button type="button" onClick={() => reviewResult(s.studentId, s.courseCode, "rejected", rejectNote || "Revise and resubmit.")}
                    className="flex items-center gap-1 text-xs text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg font-semibold">
                    <XCircle className="w-3.5 h-3.5" /> Return
                  </button>
                </div>
              </div>
            ))}
          </div>

          {selectedCourse && filteredResults.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border flex gap-2 justify-end">
              <button type="button" onClick={() => reviewAllPendingResults(selectedCourse, "approved")}
                className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-semibold">
                Approve All for {selectedCourse}
              </button>
            </div>
          )}

          <input value={rejectNote} onChange={e => setRejectNote(e.target.value)} placeholder="Return note (optional)"
            className="mt-3 w-full text-sm bg-input-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-accent" />

          <div className="mt-6">
            <h3 className="text-sm font-bold mb-2">All Results Overview</h3>
            <ExportButton
              compact
              options={{
                title: "All Result Records",
                filename: "all_results",
                columns: SCORE_EXPORT_COLUMNS,
                rows: scoreExportRows(scores),
              }}
            />
          </div>
        </div>
      )}

      {tab === "courses" && (
        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-lg font-bold font-[Outfit]">Lecturer Course Approval Batches</h2>
            <ExportButton
              options={{
                title: "Course Approval Submissions",
                filename: "course_approval_batches",
                columns: [
                  { key: "courseCode", header: "Course" },
                  { key: "lecturerName", header: "Lecturer" },
                  { key: "studentCount", header: "Students" },
                  { key: "status", header: "Status" },
                  { key: "submittedAt", header: "Submitted" },
                ],
                rows: courseSubmissionExportRows(pendingSubmissions),
              }}
            />
          </div>

          {pendingSubmissions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No course approval batches pending.</p>
          )}

          <div className="space-y-3">
            {pendingSubmissions.map(sub => {
              const regs = registrations.filter(r => sub.registrationIds.includes(r.id));
              return (
                <div key={sub.id} className="border border-border rounded-lg p-4 bg-muted/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div>
                      <p className="font-mono text-sm font-bold">{sub.courseCode}</p>
                      <p className="text-xs text-muted-foreground">{sub.courseTitle} — {sub.lecturerName}</p>
                      <p className="text-[11px] text-muted-foreground">{sub.studentCount} student(s) — {new Date(sub.submittedAt).toLocaleString()}</p>
                    </div>
                    <ReviewStatusBadge status={sub.status} />
                  </div>
                  <ul className="text-xs text-muted-foreground mb-3 space-y-1">
                    {regs.map(r => (
                      <li key={r.id}>{r.studentName} ({r.matricNo})</li>
                    ))}
                  </ul>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => reviewCourseSubmission(sub.id, "approved")}
                      className="text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg font-semibold">
                      Approve Batch
                    </button>
                    <button type="button" onClick={() => reviewCourseSubmission(sub.id, "rejected", rejectNote || "Returned for revision.")}
                      className="text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg font-semibold">
                      Return to Lecturer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {adminPendingRegs.length > 0 && (
            <div className="mt-6 pt-4 border-t border-border">
              <h3 className="text-sm font-bold mb-2">Individual Submissions ({adminPendingRegs.length})</h3>
              <p className="text-xs text-muted-foreground">Use the Approvals page for individual registrar actions on submitted registrations.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
