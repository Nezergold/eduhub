import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ClipboardList, CheckCircle, Search, Filter, AlertCircle } from "lucide-react";
import { useAppData } from "../context/AppContext";
import { getDepartmentsByFaculty, getFacultyForDepartment, ACADEMIC_LEVELS, formatCourseFee } from "../lib/types";

export function DeanCourseAssignment() {
  const { user, registrations, getFacultyCourses, getFacultyStudents, getFacultyRegistrations, deanAssignStudent, refresh } = useAppData();
  const faculty = user.faculty || "";

  const facultyCourses = useMemo(() => getFacultyCourses(faculty), [getFacultyCourses, faculty]);
  const facultyStudents = useMemo(() => getFacultyStudents(faculty), [getFacultyStudents, faculty]);
  const facultyDepts = useMemo(() => getDepartmentsByFaculty(faculty), [faculty]);
  const facultyRegs = useMemo(() => getFacultyRegistrations(faculty), [getFacultyRegistrations, faculty]);

  const [selectedDept, setSelectedDept] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

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

  function handleAssign() {
    setAssigning(true);
    setErrorMsg("");
    setSuccessMsg("");

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

  const assignedRegs = useMemo(() => {
    return facultyRegs.filter(r => r.status === "pending").slice(0, 10);
  }, [facultyRegs]);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-900 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-[Outfit]">Course Assignment</h2>
            <p className="text-emerald-100 text-sm">Assign courses to students in {faculty}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-bold text-foreground font-[Outfit] mb-4">Assign Student to Course</h3>

          <div className="grid grid-cols-2 gap-3 mb-4">
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

          <div className="space-y-3">
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
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-2 text-emerald-700 text-sm bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mt-3">
              <CheckCircle className="w-4 h-4 flex-shrink-0" /> {successMsg}
            </div>
          )}

          <button onClick={handleAssign} disabled={!selectedStudent || !selectedCourse || assigning}
            className="mt-4 w-full bg-emerald-700 text-white font-semibold py-2.5 rounded-lg hover:bg-emerald-800 transition-colors disabled:opacity-50 text-sm">
            {assigning ? "Assigning..." : "Assign Course to Student"}
          </button>

          <p className="text-xs text-muted-foreground mt-3">
            The registration will be created with status "pending". After the student pays the course fee ({formatCourseFee(1000)}), the assigned lecturer will confirm payment and approve the registration.
          </p>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-bold text-foreground font-[Outfit] mb-4 flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-700" /> Pending Registrations ({assignedRegs.length})
          </h3>
          {assignedRegs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No pending registrations in your faculty.</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {assignedRegs.map(r => (
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
