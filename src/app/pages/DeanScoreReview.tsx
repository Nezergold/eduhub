import { useMemo, useState } from "react";
import { ClipboardCheck, CheckCircle, AlertCircle, X, Search, Check, RotateCcw } from "lucide-react";
import { useAppData } from "../context/AppContext";
import { calcGrade, gradeBg } from "../lib/utils";
import type { Score } from "../lib/types";

export function DeanScoreReview() {
  const { user, scores, courses, registrations, allUsers, getFacultyCourses, deanReviewResult, deanReviewAllPendingResults, refresh } = useAppData();
  const faculty = user.faculty || "";

  const facultyCourses = useMemo(() => getFacultyCourses(faculty), [getFacultyCourses, faculty]);
  const facultyCourseCodes = useMemo(() => new Set(facultyCourses.map(c => c.code)), [facultyCourses]);

  const pendingScores = useMemo(() =>
    scores.filter(s => s.reviewStatus === "pending" && facultyCourseCodes.has(s.courseCode)),
    [scores, facultyCourseCodes]
  );

  const [selectedCourse, setSelectedCourse] = useState("");
  const [search, setSearch] = useState("");
  const [rejectNote, setRejectNote] = useState("");
  const [rejectTarget, setRejectTarget] = useState<Score | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const courseGroups = useMemo(() => {
    const groups = new Map<string, Score[]>();
    pendingScores.forEach(s => {
      const list = groups.get(s.courseCode) || [];
      list.push(s);
      groups.set(s.courseCode, list);
    });
    return groups;
  }, [pendingScores]);

  const filteredGroup = useMemo(() => {
    const list = selectedCourse ? (courseGroups.get(selectedCourse) || []) : pendingScores;
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(s =>
      s.studentName.toLowerCase().includes(q) ||
      s.matricNo.toLowerCase().includes(q) ||
      s.courseCode.toLowerCase().includes(q)
    );
  }, [courseGroups, pendingScores, selectedCourse, search]);

  function handleApprove(score: Score) {
    deanReviewResult(score.studentId, score.courseCode, "approved");
    setMsg({ type: "ok", text: `${score.studentName}'s result for ${score.courseCode} forwarded to registrar.` });
    setTimeout(() => setMsg(null), 3000);
  }

  function handleReject() {
    if (!rejectTarget) return;
    deanReviewResult(rejectTarget.studentId, rejectTarget.courseCode, "rejected", rejectNote || undefined);
    setMsg({ type: "ok", text: `${rejectTarget.studentName}'s result for ${rejectTarget.courseCode} returned to lecturer.` });
    setRejectTarget(null);
    setRejectNote("");
    setTimeout(() => setMsg(null), 3000);
  }

  function handleApproveAll() {
    if (!selectedCourse) return;
    const count = deanReviewAllPendingResults(selectedCourse, "approved");
    setMsg({ type: "ok", text: `${count} result(s) for ${selectedCourse} forwarded to registrar.` });
    setTimeout(() => setMsg(null), 3000);
  }

  function handleRejectAll() {
    if (!selectedCourse) return;
    const count = deanReviewAllPendingResults(selectedCourse, "rejected", "Bulk returned by dean for revision.");
    setMsg({ type: "ok", text: `${count} result(s) for ${selectedCourse} returned to lecturer.` });
    setTimeout(() => setMsg(null), 3000);
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-900 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-[Outfit]">Score Review</h2>
            <p className="text-emerald-100 text-sm">Review and forward lecturer-submitted scores to the registrar</p>
          </div>
        </div>
      </div>

      {msg && (
        <div className={`flex items-center gap-2 text-sm rounded-lg px-4 py-3 ${msg.type === "ok" ? "text-emerald-700 bg-emerald-50 border border-emerald-200" : "text-red-600 bg-red-50 border border-red-200"}`}>
          {msg.type === "ok" ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          {msg.text}
        </div>
      )}

      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-input-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              placeholder="Search by student name, matric no, or course..."
            />
          </div>
          <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
            className="bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
            <option value="">All Courses</option>
            {Array.from(courseGroups.keys()).map(code => (
              <option key={code} value={code}>{code} ({courseGroups.get(code)?.length} pending)</option>
            ))}
          </select>
        </div>
      </div>

      {filteredGroup.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <ClipboardCheck className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No pending scores to review from your faculty.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {/* Mobile card view */}
          <div className="md:hidden space-y-3 p-4">
            {filteredGroup.map(s => {
              const { grade } = calcGrade(s.total);
              return (
                <div key={`${s.studentId}-${s.courseCode}`} className="border border-border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold">{s.studentName}</p>
                      <p className="text-xs font-mono text-muted-foreground">{s.matricNo} · {s.courseCode}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${gradeBg(grade)}`}>{grade}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <div><span className="font-semibold block">CA</span>{s.ca}</div>
                    <div><span className="font-semibold block">Exam</span>{s.exam}</div>
                    <div><span className="font-semibold block">Total</span><span className="font-bold text-foreground">{s.total}</span></div>
                  </div>
                  <p className="text-xs text-muted-foreground">Lecturer: {s.submittedBy || "—"}</p>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => handleApprove(s)} className="flex-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 py-2 rounded-lg font-semibold flex items-center justify-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Forward
                    </button>
                    <button onClick={() => setRejectTarget(s)} className="flex-1 text-xs bg-red-50 text-red-600 border border-red-200 py-2 rounded-lg font-semibold flex items-center justify-center gap-1">
                      <RotateCcw className="w-3.5 h-3.5" /> Return
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table view */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-muted/50 text-left">
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Student</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Matric No</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Course</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-20">CA</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-20">Exam</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-20">Total</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16">Grade</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lecturer</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGroup.map(s => {
                  const { grade } = calcGrade(s.total);
                  return (
                    <tr key={`${s.studentId}-${s.courseCode}`} className="border-t border-border hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{s.studentName}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.matricNo}</td>
                      <td className="px-4 py-3 text-sm font-mono text-foreground">{s.courseCode}</td>
                      <td className="px-4 py-3 text-sm font-mono">{s.ca}</td>
                      <td className="px-4 py-3 text-sm font-mono">{s.exam}</td>
                      <td className="px-4 py-3 text-sm font-mono font-bold">{s.total}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${gradeBg(grade)}`}>{grade}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{s.submittedBy || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleApprove(s)} className="text-emerald-700 hover:text-emerald-900 p-1.5 rounded-lg hover:bg-emerald-50 transition-colors" title="Forward to Registrar">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => setRejectTarget(s)} className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Return to Lecturer">
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {selectedCourse && courseGroups.has(selectedCourse) && (
            <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-border bg-muted/20">
              <button onClick={handleRejectAll}
                className="flex items-center gap-2 border border-red-300 text-red-600 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-red-50 transition-colors">
                <RotateCcw className="w-4 h-4" /> Return All to Lecturer
              </button>
              <button onClick={handleApproveAll}
                className="flex items-center gap-2 bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-emerald-800 transition-colors">
                <Check className="w-4 h-4" /> Forward All to Registrar
              </button>
            </div>
          )}
        </div>
      )}

      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setRejectTarget(null)}>
          <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground font-[Outfit] mb-2">Return Result</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Return <strong>{rejectTarget.studentName}</strong>'s {rejectTarget.courseCode} result to the lecturer for revision.
            </p>
            <textarea
              value={rejectNote}
              onChange={e => setRejectNote(e.target.value)}
              className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 mb-4"
              placeholder="Optional: Reason for returning (shown to lecturer)..."
              rows={3}
            />
            <div className="flex gap-3">
              <button onClick={() => { setRejectTarget(null); setRejectNote(""); }} className="flex-1 bg-muted text-foreground font-semibold py-2.5 rounded-lg hover:bg-muted/80 transition-colors text-sm">
                Cancel
              </button>
              <button onClick={handleReject} className="flex-1 bg-red-600 text-white font-semibold py-2.5 rounded-lg hover:bg-red-700 transition-colors text-sm">
                Return to Lecturer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
