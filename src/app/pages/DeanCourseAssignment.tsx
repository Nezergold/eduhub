import { useMemo, useState } from "react";
import { ClipboardList, CheckCircle, AlertCircle, UserPlus, Search, Filter, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useAppData } from "../context/AppContext";
import { getDepartmentsByFaculty, ACADEMIC_LEVELS, formatCourseFee } from "../lib/types";

export function DeanCourseAssignment() {
  const { user, registrations, getFacultyCourses, getFacultyStudents, getFacultyRegistrations, deanAssignStudent, deanCreateStudentAndAssign, refresh } = useAppData();
  const faculty = user.faculty || "";

  const facultyCourses = useMemo(() => getFacultyCourses(faculty), [getFacultyCourses, faculty]);
  const facultyStudents = useMemo(() => getFacultyStudents(faculty), [getFacultyStudents, faculty]);
  const facultyDepts = useMemo(() => getDepartmentsByFaculty(faculty), [faculty]);
  const facultyRegs = useMemo(() => getFacultyRegistrations(faculty), [getFacultyRegistrations, faculty]);

  const [tab, setTab] = useState<"new" | "existing">("new");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showAllRegs, setShowAllRegs] = useState(false);

  const [newStudent, setNewStudent] = useState({
    name: "", email: "", username: "", matricNo: "", phone: "", department: "", level: "1",
  });

  const filteredStudents = useMemo(() => {
    return facultyStudents.filter(s => {
      if (selectedDept && s.department !== selectedDept) return false;
      if (selectedLevel && s.level !== selectedLevel) return false;
      return true;
    });
  }, [facultyStudents, selectedDept, selectedLevel]);

  const filteredCourses = useMemo(() => {
    return facultyCourses.filter(c => {
      if (selectedDept && c.department !== selectedDept) return false;
      if (selectedLevel && c.level !== selectedLevel) return false;
      return true;
    });
  }, [facultyCourses, selectedDept, selectedLevel]);

  const newStudentCourses = useMemo(() => {
    if (!newStudent.department) return facultyCourses;
    return facultyCourses.filter(c => c.department === newStudent.department);
  }, [facultyCourses, newStudent.department]);

  function clearMessages() {
    setSuccessMsg("");
    setErrorMsg("");
  }

  async function handleCreateAndAssign() {
    setAssigning(true);
    clearMessages();

    if (!newStudent.name.trim() || !newStudent.email.trim() || !newStudent.username.trim() || !newStudent.matricNo.trim()) {
      setErrorMsg("Name, email, username, and matric number are required.");
      setAssigning(false);
      return;
    }
    if (!selectedCourse) {
      setErrorMsg("Select a course to assign the student to.");
      setAssigning(false);
      return;
    }
    if (!newStudent.department) {
      setErrorMsg("Assign the student to a department first.");
      setAssigning(false);
      return;
    }

    const course = facultyCourses.find(c => c.id === selectedCourse);
    if (!course) {
      setErrorMsg("Selected course not found.");
      setAssigning(false);
      return;
    }

    const result = await deanCreateStudentAndAssign({
      name: newStudent.name.trim(),
      email: newStudent.email.trim(),
      username: newStudent.username.trim(),
      matricNo: newStudent.matricNo.trim(),
      phone: newStudent.phone.trim(),
      department: newStudent.department,
      faculty,
      level: newStudent.level,
    }, selectedCourse);

    if (result.success) {
      setSuccessMsg(`${newStudent.name} has been created and assigned to ${course.code}. The lecturer will see this student on their Fee Verification page. The student needs to set a password on first login.`);
      setNewStudent({ name: "", email: "", username: "", matricNo: "", phone: "", department: "", level: "1" });
      setSelectedCourse("");
      refresh();
    } else {
      setErrorMsg(result.error || "Failed to create student. Please try again.");
    }
    setAssigning(false);
  }

  function handleAssignExisting() {
    setAssigning(true);
    clearMessages();

    const student = facultyStudents.find(s => s.id === selectedStudent);
    const course = facultyCourses.find(c => c.id === selectedCourse);

    if (!student || !course) {
      setErrorMsg("Select both a student and a course.");
      setAssigning(false);
      return;
    }

    if (student.department && course.department !== student.department) {
      setErrorMsg(`Student is in ${student.department} but course belongs to ${course.department}.`);
      setAssigning(false);
      return;
    }

    const existing = facultyRegs.find(
      r => r.studentId === student.id && r.courseId === course.id && r.status !== "rejected"
    );
    if (existing) {
      setErrorMsg(`${student.name} is already registered for ${course.code} (status: ${existing.status}).`);
      setAssigning(false);
      return;
    }

    const reg = deanAssignStudent(student.id, course.id, course.subjects.map(s => s.title));
    if (reg) {
      setSuccessMsg(`${student.name} has been assigned to ${course.code}. Registration is pending lecturer approval after fee payment (${formatCourseFee(1000)}).`);
      setSelectedStudent("");
      setSelectedCourse("");
      refresh();
    } else {
      setErrorMsg("Failed to assign student. Please try again.");
    }
    setAssigning(false);
  }

  const pendingRegs = useMemo(() => {
    const regs = showAllRegs ? facultyRegs.filter(r => r.status === "pending") : facultyRegs.filter(r => r.status === "pending").slice(0, 8);
    return regs;
  }, [facultyRegs, showAllRegs]);

  const totalPendingCount = useMemo(() => facultyRegs.filter(r => r.status === "pending").length, [facultyRegs]);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-900 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-[Outfit]">Course Assignment</h2>
            <p className="text-emerald-100 text-sm">Create students and assign courses in {faculty}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex gap-2 mb-5">
            <button type="button" onClick={() => { setTab("new"); clearMessages(); }}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-all ${tab === "new" ? "bg-emerald-700 text-white border-emerald-700" : "border-border text-muted-foreground hover:border-emerald-500/50"}`}>
              <UserPlus className="w-3.5 h-3.5" /> New Student
            </button>
            <button type="button" onClick={() => { setTab("existing"); clearMessages(); }}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-all ${tab === "existing" ? "bg-emerald-700 text-white border-emerald-700" : "border-border text-muted-foreground hover:border-emerald-500/50"}`}>
              <Search className="w-3.5 h-3.5" /> Existing Student
            </button>
          </div>

          {tab === "new" && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-foreground font-[Outfit]">Create New Student & Assign to Course</h3>
              <p className="text-xs text-muted-foreground bg-muted/40 border border-border rounded-lg px-3 py-2">
                Enter student information below. The student account will be created and immediately assigned to the selected course. The student must set a password on first login.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Full Name *</label>
                  <input value={newStudent.name} onChange={e => setNewStudent(p => ({ ...p, name: e.target.value }))}
                    className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. John Smith" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Email *</label>
                  <input type="email" value={newStudent.email} onChange={e => setNewStudent(p => ({ ...p, email: e.target.value }))}
                    className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="student@email.com" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Username *</label>
                  <input value={newStudent.username} onChange={e => setNewStudent(p => ({ ...p, username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, "") }))}
                    className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-emerald-500"
                    placeholder="jsmith" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Matric Number *</label>
                  <input value={newStudent.matricNo} onChange={e => setNewStudent(p => ({ ...p, matricNo: e.target.value }))}
                    className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. SCI/2024/001" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Phone</label>
                  <input value={newStudent.phone} onChange={e => setNewStudent(p => ({ ...p, phone: e.target.value }))}
                    className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. 6XX XXX XXX" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Department *</label>
                  <select value={newStudent.department} onChange={e => setNewStudent(p => ({ ...p, department: e.target.value }))}
                    className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
                    <option value="">Select department...</option>
                    {facultyDepts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Level *</label>
                  <select value={newStudent.level} onChange={e => setNewStudent(p => ({ ...p, level: e.target.value }))}
                    className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
                    {ACADEMIC_LEVELS.map(l => <option key={l} value={l}>Level {l}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Assign to Course ({newStudentCourses.length} available)</label>
                <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
                  className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
                  <option value="">Select course...</option>
                  {newStudentCourses.map(c => (
                    <option key={c.id} value={c.id}>{c.code} — {c.title} (Level {c.level})</option>
                  ))}
                </select>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="flex items-center gap-2 text-emerald-700 text-sm bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" /> {successMsg}
                </div>
              )}

              <button onClick={handleCreateAndAssign} disabled={assigning}
                className="w-full bg-emerald-700 text-white font-semibold py-2.5 rounded-lg hover:bg-emerald-800 transition-colors disabled:opacity-50 text-sm flex items-center justify-center gap-2">
                {assigning ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><UserPlus className="w-4 h-4" /> Create Student & Assign to Course</>}
              </button>
            </div>
          )}

          {tab === "existing" && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-foreground font-[Outfit]">Assign Existing Student to Course</h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Department</label>
                  <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)}
                    className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
                    <option value="">All Departments</option>
                    {facultyDepts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Level</label>
                  <select value={selectedLevel} onChange={e => setSelectedLevel(e.target.value)}
                    className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
                    <option value="">All Levels</option>
                    {ACADEMIC_LEVELS.map(l => <option key={l} value={l}>Level {l}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Student ({filteredStudents.length} found)</label>
                <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}
                  className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
                  <option value="">Select student...</option>
                  {filteredStudents.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.matricNo || s.username}) — {s.department || "No dept"}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Course ({filteredCourses.length} found)</label>
                <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
                  className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
                  <option value="">Select course...</option>
                  {filteredCourses.map(c => (
                    <option key={c.id} value={c.id}>{c.code} — {c.title} (Level {c.level}, {c.department})</option>
                  ))}
                </select>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="flex items-center gap-2 text-emerald-700 text-sm bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" /> {successMsg}
                </div>
              )}

              <button onClick={handleAssignExisting} disabled={!selectedStudent || !selectedCourse || assigning}
                className="w-full bg-emerald-700 text-white font-semibold py-2.5 rounded-lg hover:bg-emerald-800 transition-colors disabled:opacity-50 text-sm">
                {assigning ? "Assigning..." : "Assign Course to Student"}
              </button>

              <p className="text-xs text-muted-foreground">
                The registration will be created with status "pending". After the student pays the course fee ({formatCourseFee(1000)}), the assigned lecturer will confirm payment and approve the registration.
              </p>
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-bold text-foreground font-[Outfit] mb-4 flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-700" /> Pending Registrations ({totalPendingCount})
          </h3>
          {totalPendingCount === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No pending registrations in your faculty.</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {pendingRegs.map(r => (
                <div key={r.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{r.studentName}</p>
                    <p className="text-xs text-muted-foreground">{r.courseCode} · {r.matricNo} · {r.department}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">Pending</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{r.paymentStatus === "paid" ? "Fee paid" : "Awaiting payment"}</p>
                  </div>
                </div>
              ))}
              {totalPendingCount > 8 && (
                <button type="button" onClick={() => setShowAllRegs(!showAllRegs)}
                  className="w-full text-xs text-emerald-700 font-semibold py-2 hover:bg-emerald-50 rounded-lg flex items-center justify-center gap-1">
                  {showAllRegs ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show all {totalPendingCount} pending</>}
                </button>
              )}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              <strong>How it works:</strong> Dean creates/assigns students to courses → Student pays fee at bursary → Lecturer confirms payment on Fee Verification page → Student is approved and can access the course.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
