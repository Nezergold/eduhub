import { useMemo, useState } from "react";
import { UserCheck, CheckCircle, AlertCircle, BookOpen, Building2, Search, Edit3, X, Trash2, Users, Plus, Save } from "lucide-react";
import { useAppData } from "../context/AppContext";
import { getDepartmentsByFaculty, getFacultyForDepartment, ACADEMIC_LEVELS } from "../lib/types";
import type { User, Course } from "../lib/types";

export function DeanLecturerManagement() {
  const { user, getFacultyCourses, getFacultyLecturers, assignLecturer, updateUser, deleteLecturer, createCourse, updateCourse, deleteCourse, refresh } = useAppData();
  const faculty = user.faculty || "";

  const facultyCourses = useMemo(() => getFacultyCourses(faculty), [getFacultyCourses, faculty]);
  const facultyLecturers = useMemo(() => getFacultyLecturers(faculty), [getFacultyLecturers, faculty]);
  const facultyDepts = useMemo(() => getDepartmentsByFaculty(faculty), [faculty]);

  const [selectedLecturer, setSelectedLecturer] = useState("");
  const [assignDeptToLecturer, setAssignDeptToLecturer] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [assignCourseLecturer, setAssignCourseLecturer] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", username: "", phone: "", department: "", staffId: "" });
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const emptyCourseForm = { code: "", title: "", department: "", level: "100", semester: 1, units: 3 };
  const [courseForm, setCourseForm] = useState(emptyCourseForm);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deleteCourseConfirm, setDeleteCourseConfirm] = useState<Course | null>(null);
  const [courseSearch, setCourseSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return facultyLecturers;
    const q = search.toLowerCase();
    return facultyLecturers.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q) ||
      l.username.toLowerCase().includes(q) ||
      (l.staffId || "").toLowerCase().includes(q) ||
      (l.department || "").toLowerCase().includes(q)
    );
  }, [facultyLecturers, search]);

  const filteredCourses = useMemo(() => {
    if (!courseSearch) return facultyCourses;
    const q = courseSearch.toLowerCase();
    return facultyCourses.filter(c =>
      c.code.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      (c.department || "").toLowerCase().includes(q) ||
      (c.lecturer || "").toLowerCase().includes(q)
    );
  }, [facultyCourses, courseSearch]);

  function handleCreateCourse() {
    if (!courseForm.code.trim() || !courseForm.title.trim()) {
      setMsg({ type: "err", text: "Course code and title are required." });
      return;
    }
    if (!courseForm.department) {
      setMsg({ type: "err", text: "Select a department for the course." });
      return;
    }
    const existing = facultyCourses.find(c => c.code.toUpperCase() === courseForm.code.toUpperCase());
    if (existing) {
      setMsg({ type: "err", text: `Course ${courseForm.code.toUpperCase()} already exists.` });
      return;
    }
    createCourse({
      code: courseForm.code.toUpperCase(),
      title: courseForm.title.trim(),
      units: courseForm.units,
      department: courseForm.department,
      faculty,
      level: courseForm.level,
      semester: courseForm.semester,
      lecturer: "Unassigned",
      subjects: [],
    });
    setMsg({ type: "ok", text: `${courseForm.code.toUpperCase()} — ${courseForm.title} created.` });
    setCourseForm(emptyCourseForm);
    refresh();
  }

  function openEditCourse(course: Course) {
    setEditingCourse(course);
    setCourseForm({
      code: course.code,
      title: course.title,
      department: course.department || "",
      level: course.level || "100",
      semester: course.semester || 1,
      units: course.units || 3,
    });
  }

  function handleSaveEditCourse() {
    if (!editingCourse) return;
    if (!courseForm.code.trim() || !courseForm.title.trim()) {
      setMsg({ type: "err", text: "Course code and title are required." });
      return;
    }
    updateCourse(editingCourse.id, {
      code: courseForm.code.toUpperCase(),
      title: courseForm.title.trim(),
      units: courseForm.units,
      department: courseForm.department,
      level: courseForm.level,
      semester: courseForm.semester,
    });
    setMsg({ type: "ok", text: `${courseForm.code.toUpperCase()} updated successfully.` });
    setEditingCourse(null);
    setCourseForm(emptyCourseForm);
    refresh();
  }

  function handleDeleteCourse(course: Course) {
    const ok = deleteCourse(course.id);
    if (ok) {
      setMsg({ type: "ok", text: `${course.code} has been deleted.` });
      setDeleteCourseConfirm(null);
    } else {
      setMsg({ type: "err", text: `Cannot delete ${course.code} — it has active student enrollments.` });
    }
  }

  function handleAssignDept() {
    if (!selectedLecturer || !assignDeptToLecturer) {
      setMsg({ type: "err", text: "Select a lecturer and a department." });
      return;
    }
    const lecturer = facultyLecturers.find(l => l.id === selectedLecturer);
    if (!lecturer) return;

    updateUser(lecturer.id, {
      department: assignDeptToLecturer,
      faculty: getFacultyForDepartment(assignDeptToLecturer) || faculty,
    }).then(result => {
      if (result.success) {
        setMsg({ type: "ok", text: `${lecturer.name} has been assigned to ${assignDeptToLecturer}.` });
        setSelectedLecturer("");
        setAssignDeptToLecturer("");
        refresh();
      } else {
        setMsg({ type: "err", text: result.error || "Failed to update lecturer." });
      }
    });
  }

  function handleAssignCourse() {
    if (!selectedCourse) {
      setMsg({ type: "err", text: "Select a course." });
      return;
    }
    const course = facultyCourses.find(c => c.id === selectedCourse);
    if (!course) return;

    const lecturerId = assignCourseLecturer;
    const lecturer = facultyLecturers.find(l => l.id === lecturerId);

    assignLecturer(selectedCourse, lecturerId, lecturer?.name || "Unassigned");
    setMsg({ type: "ok", text: `${course.code} has been assigned to ${lecturer?.name || "Unassigned"}.` });
    setSelectedCourse("");
    setAssignCourseLecturer("");
    refresh();
  }

  function openEdit(lecturer: User) {
    setEditing(lecturer);
    setEditForm({
      name: lecturer.name,
      email: lecturer.email,
      username: lecturer.username,
      phone: lecturer.phone || "",
      department: lecturer.department || "",
      staffId: lecturer.staffId || "",
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
      staffId: editForm.staffId.trim() || undefined,
    }).then(result => {
      if (result.success) {
        setMsg({ type: "ok", text: `${editForm.name}'s details updated. Changes sync to all devices.` });
        setEditing(null);
        refresh();
      } else {
        setMsg({ type: "err", text: result.error || "Failed to update lecturer." });
      }
    });
  }

  function handleDelete(lecturer: User) {
    deleteLecturer(lecturer.id).then(result => {
      if (result.success) {
        setMsg({ type: "ok", text: `${lecturer.name} has been removed.` });
        setDeleteConfirm(null);
        refresh();
      } else {
        setMsg({ type: "err", text: result.error || "Failed to delete lecturer." });
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-900 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-[Outfit]">Lecturer & Department Management</h2>
            <p className="text-emerald-100 text-sm">Manage departments, lecturers, and course assignments in {faculty}</p>
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
        <h3 className="text-sm font-bold text-foreground font-[Outfit] mb-4 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-700" /> Departments in {faculty}
        </h3>
        {facultyDepts.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {facultyDepts.map(d => (
              <span key={d} className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg font-medium">{d}</span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-bold text-foreground font-[Outfit] mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-700" /> Assign Lecturer to Department
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Lecturer ({facultyLecturers.length} in faculty)</label>
              <select value={selectedLecturer} onChange={e => setSelectedLecturer(e.target.value)}
                className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
                <option value="">Select lecturer...</option>
                {facultyLecturers.map(l => (
                  <option key={l.id} value={l.id}>{l.name} — {l.department || "No dept"} ({l.staffId})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Department</label>
              <select value={assignDeptToLecturer} onChange={e => setAssignDeptToLecturer(e.target.value)}
                className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
                <option value="">Select department...</option>
                {facultyDepts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <button onClick={handleAssignDept} disabled={!selectedLecturer || !assignDeptToLecturer}
              className="w-full bg-emerald-700 text-white font-semibold py-2.5 rounded-lg hover:bg-emerald-800 transition-colors disabled:opacity-50 text-sm">
              Assign to Department
            </button>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-bold text-foreground font-[Outfit] mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-700" /> Course Management
          </h3>

          <div className="flex gap-2 mb-4">
            <button type="button" onClick={() => { setEditingCourse(null); setCourseForm(emptyCourseForm); }}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-all ${!editingCourse ? "bg-emerald-700 text-white border-emerald-700" : "border-border text-muted-foreground hover:border-emerald-500/50"}`}>
              <Plus className="w-3.5 h-3.5" /> Create
            </button>
            <button type="button" onClick={() => { setEditingCourse(null); }}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-all ${editingCourse ? "bg-emerald-700 text-white border-emerald-700" : "border-border text-muted-foreground hover:border-emerald-500/50"}`}>
              <Users className="w-3.5 h-3.5" /> Allocate ({facultyCourses.length})
            </button>
          </div>

          {!editingCourse && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Course Code *</label>
                  <input value={courseForm.code} onChange={e => setCourseForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. CSC401" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Units</label>
                  <input type="number" min={1} max={6} value={courseForm.units} onChange={e => setCourseForm(f => ({ ...f, units: Number(e.target.value) || 3 }))}
                    className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Course Title *</label>
                <input value={courseForm.title} onChange={e => setCourseForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Database Systems" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Department *</label>
                  <select value={courseForm.department} onChange={e => setCourseForm(f => ({ ...f, department: e.target.value }))}
                    className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
                    <option value="">Select...</option>
                    {facultyDepts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Level</label>
                  <select value={courseForm.level} onChange={e => setCourseForm(f => ({ ...f, level: e.target.value }))}
                    className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
                    {ACADEMIC_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Semester</label>
                  <select value={courseForm.semester} onChange={e => setCourseForm(f => ({ ...f, semester: Number(e.target.value) }))}
                    className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
                    <option value={1}>Sem 1</option>
                    <option value={2}>Sem 2</option>
                  </select>
                </div>
              </div>
              <button onClick={handleCreateCourse}
                className="w-full bg-emerald-700 text-white font-semibold py-2.5 rounded-lg hover:bg-emerald-800 transition-colors text-sm flex items-center justify-center gap-1.5">
                <Plus className="w-4 h-4" /> Create Course
              </button>
            </div>
          )}

          {editingCourse && (
            <div className="space-y-3 border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">Editing: <strong className="font-mono">{editingCourse.code}</strong></p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Course Code</label>
                  <input value={courseForm.code} onChange={e => setCourseForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Units</label>
                  <input type="number" min={1} max={6} value={courseForm.units} onChange={e => setCourseForm(f => ({ ...f, units: Number(e.target.value) || 3 }))}
                    className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Course Title</label>
                <input value={courseForm.title} onChange={e => setCourseForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Department</label>
                  <select value={courseForm.department} onChange={e => setCourseForm(f => ({ ...f, department: e.target.value }))}
                    className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
                    <option value="">Select...</option>
                    {facultyDepts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Level</label>
                  <select value={courseForm.level} onChange={e => setCourseForm(f => ({ ...f, level: e.target.value }))}
                    className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
                    {ACADEMIC_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Semester</label>
                  <select value={courseForm.semester} onChange={e => setCourseForm(f => ({ ...f, semester: Number(e.target.value) }))}
                    className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
                    <option value={1}>Sem 1</option>
                    <option value={2}>Sem 2</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditingCourse(null); setCourseForm(emptyCourseForm); }}
                  className="flex-1 bg-muted text-foreground font-semibold py-2.5 rounded-lg hover:bg-muted/80 transition-colors text-sm">
                  Cancel
                </button>
                <button onClick={handleSaveEditCourse}
                  className="flex-1 bg-emerald-700 text-white font-semibold py-2.5 rounded-lg hover:bg-emerald-800 transition-colors text-sm flex items-center justify-center gap-1.5">
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </div>
          )}

          {!editingCourse && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input value={courseSearch} onChange={e => setCourseSearch(e.target.value)}
                    className="w-full bg-input-background border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500"
                    placeholder="Search courses..." />
                </div>
              </div>
              {filteredCourses.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No courses yet. Create one above.</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {filteredCourses.map(c => {
                    const assigned = facultyLecturers.find(l => l.id === c.lecturerId);
                    return (
                      <div key={c.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-mono font-semibold text-foreground">{c.code} <span className="font-normal text-muted-foreground">— {c.title}</span></p>
                          <p className="text-[11px] text-muted-foreground">{c.department} · Level {c.level} · Sem {c.semester} · {c.units} units · {assigned ? assigned.name : <span className="text-amber-600">Unassigned</span>}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => openEditCourse(c)} className="text-emerald-700 hover:text-emerald-900 p-1.5 rounded-lg hover:bg-emerald-50 transition-colors" title="Edit">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteCourseConfirm(c)} className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-bold text-foreground font-[Outfit] flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-700" /> Faculty Lecturers ({filtered.length})
          </h3>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-input-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              placeholder="Search lecturers..."
            />
          </div>
        </div>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No lecturers found.</p>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 text-left">
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Staff ID</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Department</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Courses</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(l => {
                    const lCourses = facultyCourses.filter(c => c.lecturerId === l.id);
                    return (
                      <tr key={l.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-foreground">{l.name}</p>
                          <p className="text-xs text-muted-foreground">{l.email}</p>
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{l.staffId || "—"}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{l.department || "—"}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {lCourses.length > 0 ? lCourses.map(c => c.code).join(", ") : <span className="text-amber-600">None assigned</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEdit(l)} className="text-emerald-700 hover:text-emerald-900 p-1.5 rounded-lg hover:bg-emerald-50 transition-colors" title="Edit">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDeleteConfirm(l)} className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="md:hidden space-y-3">
              {filtered.map(l => {
                const lCourses = facultyCourses.filter(c => c.lecturerId === l.id);
                return (
                  <div key={l.id} className="border border-border rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{l.name}</p>
                        <p className="text-xs text-muted-foreground">{l.staffId || "No ID"} · {l.department || "No dept"}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(l)} className="text-emerald-700 hover:text-emerald-900 p-1.5 rounded-lg hover:bg-emerald-50">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteConfirm(l)} className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {lCourses.length > 0 ? lCourses.map(c => c.code).join(", ") : "No courses assigned"}
                    </p>
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
              <h3 className="text-lg font-bold text-foreground font-[Outfit]">Edit Lecturer</h3>
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
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Staff ID</label>
                <input value={editForm.staffId} onChange={e => setEditForm(f => ({ ...f, staffId: e.target.value }))}
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

      {deleteCourseConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeleteCourseConfirm(null)}>
          <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground font-[Outfit] mb-2">Delete Course</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Are you sure you want to delete <strong className="font-mono">{deleteCourseConfirm.code}</strong> — {deleteCourseConfirm.title}? Students assigned to this course will be unlinked.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteCourseConfirm(null)} className="flex-1 bg-muted text-foreground font-semibold py-2.5 rounded-lg hover:bg-muted/80 transition-colors text-sm">
                Cancel
              </button>
              <button onClick={() => handleDeleteCourse(deleteCourseConfirm)} className="flex-1 bg-red-600 text-white font-semibold py-2.5 rounded-lg hover:bg-red-700 transition-colors text-sm">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground font-[Outfit] mb-2">Delete Lecturer</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Are you sure you want to remove <strong>{deleteConfirm.name}</strong>? Their assigned courses will be unlinked.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-muted text-foreground font-semibold py-2.5 rounded-lg hover:bg-muted/80 transition-colors text-sm">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-600 text-white font-semibold py-2.5 rounded-lg hover:bg-red-700 transition-colors text-sm">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
