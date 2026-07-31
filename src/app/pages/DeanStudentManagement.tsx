import { useMemo, useState } from "react";
import { Users, Search, Edit3, X, CheckCircle, AlertCircle, GraduationCap } from "lucide-react";
import { useAppData } from "../context/AppContext";
import { getDepartmentsByFaculty } from "../lib/types";
import type { User } from "../lib/types";

export function DeanStudentManagement() {
  const { user, allUsers, registrations, scores, getFacultyStudents, updateUser, refresh } = useAppData();
  const faculty = user.faculty || "";

  const facultyStudents = useMemo(() => getFacultyStudents(faculty), [getFacultyStudents, faculty]);
  const facultyDepts = useMemo(() => getDepartmentsByFaculty(faculty), [faculty]);

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [editing, setEditing] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", username: "", phone: "", department: "", level: "", matricNo: "" });
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const filtered = useMemo(() => {
    return facultyStudents.filter(s => {
      if (deptFilter && s.department !== deptFilter) return false;
      if (levelFilter && s.level !== levelFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.username.toLowerCase().includes(q) ||
          (s.matricNo || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [facultyStudents, deptFilter, levelFilter, search]);

  function getStudentCourseCount(studentId: string) {
    return registrations.filter(r => r.studentId === studentId && r.status !== "rejected").length;
  }

  function getStudentAvgScore(studentId: string) {
    const studentScores = scores.filter(s => s.studentId === studentId && s.score != null);
    if (studentScores.length === 0) return null;
    const avg = studentScores.reduce((sum, s) => sum + (s.score || 0), 0) / studentScores.length;
    return avg.toFixed(1);
  }

  function openEdit(student: User) {
    setEditing(student);
    setEditForm({
      name: student.name,
      email: student.email,
      username: student.username,
      phone: student.phone || "",
      department: student.department || "",
      level: student.level || "",
      matricNo: student.matricNo || "",
    });
  }

  function handleEditSave() {
    if (!editing) return;
    if (!editForm.name.trim()) {
      setMsg({ type: "err", text: "Name is required." });
      return;
    }
    updateUser(editing.id, {
      name: editForm.name.trim(),
      email: editForm.email.trim(),
      username: editForm.username.trim(),
      phone: editForm.phone.trim() || undefined,
      department: editForm.department || undefined,
      level: editForm.level || undefined,
      matricNo: editForm.matricNo.trim() || undefined,
    }).then(result => {
      if (result.success) {
        setMsg({ type: "ok", text: `${editForm.name}'s details updated. Changes sync to all devices.` });
        setEditing(null);
        refresh();
      } else {
        setMsg({ type: "err", text: result.error || "Failed to update student." });
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-900 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-[Outfit]">Student Management</h2>
            <p className="text-emerald-100 text-sm">View and manage all students in {faculty}</p>
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
              placeholder="Search by name, email, username, or matric number..."
            />
          </div>
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
            className="bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
            <option value="">All Departments</option>
            {facultyDepts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)}
            className="bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
            <option value="">All Levels</option>
            {["100", "200", "300", "400", "500"].map(l => <option key={l} value={l}>Level {l}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-foreground font-[Outfit] flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-700" /> Faculty Students ({filtered.length})
          </h3>
        </div>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No students found.</p>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 text-left">
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Matric No</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Department</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Level</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Courses</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Score</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => {
                    const courseCount = getStudentCourseCount(s.id);
                    const avg = getStudentAvgScore(s.id);
                    return (
                      <tr key={s.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-foreground">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.email}</p>
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{s.matricNo || "—"}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{s.department || "—"}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{s.level || "—"}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{courseCount}</td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {avg !== null ? <span className={Number(avg) >= 50 ? "text-emerald-600" : "text-red-600"}>{avg}%</span> : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => openEdit(s)} className="text-emerald-700 hover:text-emerald-900 p-1.5 rounded-lg hover:bg-emerald-50 transition-colors">
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="md:hidden space-y-3">
              {filtered.map(s => {
                const courseCount = getStudentCourseCount(s.id);
                const avg = getStudentAvgScore(s.id);
                return (
                  <div key={s.id} className="border border-border rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.matricNo || "No matric"} · {s.department || "No dept"}</p>
                      </div>
                      <button onClick={() => openEdit(s)} className="text-emerald-700 hover:text-emerald-900 p-1.5 rounded-lg hover:bg-emerald-50">
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>Level {s.level || "—"}</span>
                      <span>{courseCount} course{courseCount !== 1 ? "s" : ""}</span>
                      {avg !== null && <span className={Number(avg) >= 50 ? "text-emerald-600" : "text-red-600"}>Avg: {avg}%</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditing(null)}>
          <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground font-[Outfit]">Edit Student</h3>
              <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Full Name</label>
                <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Email</label>
                <input value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Username</label>
                <input value={editForm.username} onChange={e => setEditForm(f => ({ ...f, username: e.target.value }))}
                  className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Phone</label>
                <input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" placeholder="Optional" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Matric Number</label>
                <input value={editForm.matricNo} onChange={e => setEditForm(f => ({ ...f, matricNo: e.target.value }))}
                  className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Department</label>
                <select value={editForm.department} onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))}
                  className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
                  <option value="">Select department...</option>
                  {facultyDepts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Level</label>
                <select value={editForm.level} onChange={e => setEditForm(f => ({ ...f, level: e.target.value }))}
                  className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
                  <option value="">Select level...</option>
                  {["100", "200", "300", "400", "500"].map(l => <option key={l} value={l}>Level {l}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditing(null)} className="flex-1 bg-muted text-foreground font-semibold py-2.5 rounded-lg hover:bg-muted/80 transition-colors text-sm">
                Cancel
              </button>
              <button onClick={handleEditSave} className="flex-1 bg-emerald-700 text-white font-semibold py-2.5 rounded-lg hover:bg-emerald-800 transition-colors text-sm">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
