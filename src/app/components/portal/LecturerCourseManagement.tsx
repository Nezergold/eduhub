import { useState } from "react";
import { BookOpen, Plus, Trash2 } from "lucide-react";
import { useAppData } from "../../context/AppContext";
import { ACADEMIC_LEVELS, MAX_LECTURER_COURSES } from "../../lib/types";
import { countApprovedStudents } from "../../lib/store";

export function LecturerCourseManagement() {
  const { user, getMyCourses, addMyCourse, removeMyCourse } = useAppData();
  const myCourses = getMyCourses();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ code: "", title: "", units: "3", level: "100", semester: "1" });

  const profileComplete = Boolean(user.faculty && user.department);
  const slotsLeft = MAX_LECTURER_COURSES - myCourses.length;

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      addMyCourse({
        code: form.code.toUpperCase(),
        title: form.title,
        units: Number(form.units),
        department: user.department!,
        faculty: user.faculty!,
        level: form.level,
        semester: Number(form.semester),
      });
      setForm({ code: "", title: "", units: "3", level: "100", semester: "1" });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add course.");
    }
  }

  function handleRemove(courseId: string) {
    setError("");
    try {
      removeMyCourse(courseId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove course.");
    }
  }

  return (
    <div className="space-y-4">
      {!profileComplete && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Complete your <strong>Faculty</strong> and <strong>Department</strong> in Settings before adding courses you teach.
        </div>
      )}

      <div className="bg-card rounded-lg border border-border p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-bold font-[Outfit]">My Teaching Courses</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {user.faculty || "—"} · {user.department || "—"} · {myCourses.length}/{MAX_LECTURER_COURSES} courses
            </p>
          </div>
          {slotsLeft > 0 && profileComplete && (
            <button
              type="button"
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center justify-center gap-1.5 text-xs bg-accent text-white px-3 py-2 rounded-lg font-semibold hover:bg-accent/90"
            >
              <Plus className="w-3.5 h-3.5" /> Add Course
            </button>
          )}
        </div>

        {error && <p className="text-sm text-destructive mb-3">{error}</p>}

        {showForm && (
          <form onSubmit={handleAdd} className="mb-5 bg-muted/30 border border-border rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div>
              <label className="text-xs font-semibold block mb-1">Course Code</label>
              <input required value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))}
                className="w-full bg-input-background border border-border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent" placeholder="CSC301" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold block mb-1">Title</label>
              <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className="w-full bg-input-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Units</label>
              <input required type="number" min={1} max={6} value={form.units} onChange={e => setForm(p => ({ ...p, units: e.target.value }))}
                className="w-full bg-input-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Level</label>
              <select value={form.level} onChange={e => setForm(p => ({ ...p, level: e.target.value }))}
                className="w-full bg-input-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent">
                {ACADEMIC_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Semester</label>
              <select value={form.semester} onChange={e => setForm(p => ({ ...p, semester: e.target.value }))}
                className="w-full bg-input-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent">
                <option value="1">1</option>
                <option value="2">2</option>
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-5 flex flex-wrap gap-2">
              <button type="submit" className="text-xs bg-accent text-white px-4 py-2 rounded-lg font-semibold">Save Course</button>
              <button type="button" onClick={() => setShowForm(false)} className="text-xs border border-border px-4 py-2 rounded-lg font-semibold hover:bg-muted/50">Cancel</button>
            </div>
          </form>
        )}

        {myCourses.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-10">
            No courses yet. Add up to {MAX_LECTURER_COURSES} courses you teach this semester.
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myCourses.map(c => {
            const approved = countApprovedStudents(c.id);
            return (
              <div key={c.id} className="rounded-lg border border-border bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-bold text-foreground">{c.code}</p>
                    <p className="text-sm text-foreground mt-0.5">{c.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {c.units} units · Level {c.level} · Sem {c.semester}
                    </p>
                  </div>
                  <div className="text-center flex-shrink-0 bg-accent/10 border border-accent/20 rounded-lg px-3 py-2">
                    <p className="text-lg font-bold text-accent leading-none">{approved}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Approved</p>
                  </div>
                </div>
                <div className="flex justify-end mt-3 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => handleRemove(c.id)}
                    className="text-xs text-red-700 border border-red-200 bg-red-50 px-2.5 py-1 rounded-lg font-semibold hover:bg-red-100 inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
