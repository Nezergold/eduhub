import { useMemo } from "react";
import { motion } from "motion/react";
import { LayoutDashboard, Building2, BookOpen, Users, UserCheck, ClipboardList, TrendingUp } from "lucide-react";
import { useAppData } from "../context/AppContext";
import { getDepartmentsByFaculty } from "../lib/types";

function StatCard({ label, value, icon: Icon, accent, delay = 0 }: {
  label: string; value: string | number; icon: any; accent?: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-card rounded-xl border border-border p-4 sm:p-5 flex items-start gap-3 sm:gap-4 shadow-sm hover:shadow-md hover:border-accent/30 transition-shadow"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accent || "bg-emerald-100"}`}>
        <Icon className={`w-5 h-5 ${accent ? "text-white" : "text-emerald-700"}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs sm:text-sm text-muted-foreground font-medium">{label}</p>
        <p className="text-xl sm:text-2xl font-bold text-foreground font-[Outfit]">{value}</p>
      </div>
    </motion.div>
  );
}

export function DeanOverview() {
  const { user, notifications, getFacultyCourses, getFacultyStudents, getFacultyLecturers, getFacultyRegistrations } = useAppData();
  const faculty = user.faculty || "";

  const facultyDepts = useMemo(() => getDepartmentsByFaculty(faculty), [faculty]);
  const facultyCourses = useMemo(() => getFacultyCourses(faculty), [getFacultyCourses, faculty]);
  const facultyStudents = useMemo(() => getFacultyStudents(faculty), [getFacultyStudents, faculty]);
  const facultyLecturers = useMemo(() => getFacultyLecturers(faculty), [getFacultyLecturers, faculty]);
  const facultyRegs = useMemo(() => getFacultyRegistrations(faculty), [getFacultyRegistrations, faculty]);
  const pendingRegs = useMemo(() => facultyRegs.filter(r => r.status === "pending"), [facultyRegs]);

  const recentNotifications = useMemo(() =>
    notifications.filter(n => n.type === "registration" || n.type === "score").slice(0, 6),
    [notifications]
  );

  const deptStats = useMemo(() => {
    return facultyDepts.map(dept => {
      const deptCourses = facultyCourses.filter(c => c.department === dept);
      const deptStudents = facultyStudents.filter(s => s.department === dept);
      const deptLecturers = facultyLecturers.filter(l => l.department === dept);
      return { name: dept, courses: deptCourses.length, students: deptStudents.length, lecturers: deptLecturers.length };
    });
  }, [facultyDepts, facultyCourses, facultyStudents, facultyLecturers]);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-900 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-[Outfit]">Faculty Dashboard</h2>
            <p className="text-emerald-100 text-sm">{faculty}</p>
          </div>
        </div>
        <p className="text-emerald-200 text-sm mt-2">
          Welcome back, {user.name}. Here is an overview of your faculty.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Departments" value={facultyDepts.length} icon={Building2} delay={0} />
        <StatCard label="Courses" value={facultyCourses.length} icon={BookOpen} delay={0.05} />
        <StatCard label="Students" value={facultyStudents.length} icon={Users} delay={0.1} />
        <StatCard label="Lecturers" value={facultyLecturers.length} icon={UserCheck} delay={0.15} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-bold text-foreground font-[Outfit] mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-700" /> Department Breakdown
          </h3>
          {deptStats.length === 0 ? (
            <p className="text-sm text-muted-foreground">No departments in this faculty.</p>
          ) : (
            <div className="space-y-3">
              {deptStats.map(d => (
                <div key={d.name} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                  <span className="text-sm font-medium text-foreground">{d.name}</span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{d.courses} course{d.courses !== 1 ? "s" : ""}</span>
                    <span>{d.students} student{d.students !== 1 ? "s" : ""}</span>
                    <span>{d.lecturers} lecturer{d.lecturers !== 1 ? "s" : ""}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-bold text-foreground font-[Outfit] mb-4 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-emerald-700" /> Recent Registrations
          </h3>
          {pendingRegs.length === 0 && facultyRegs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No registrations yet.</p>
          ) : (
            <div className="space-y-2">
              {(pendingRegs.length > 0 ? pendingRegs : facultyRegs).slice(0, 5).map(r => (
                <div key={r.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{r.studentName}</p>
                    <p className="text-xs text-muted-foreground">{r.courseCode} · {r.matricNo}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${r.status === "approved" ? "bg-green-50 text-green-700" : r.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-bold text-foreground font-[Outfit] mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-700" /> Faculty Summary
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <p className="text-2xl font-bold text-emerald-700">{facultyRegs.filter(r => r.status === "approved").length}</p>
            <p className="text-xs text-muted-foreground mt-1">Approved Registrations</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <p className="text-2xl font-bold text-amber-600">{pendingRegs.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Pending Registrations</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <p className="text-2xl font-bold text-emerald-700">{facultyCourses.filter(c => c.lecturerId).length}</p>
            <p className="text-xs text-muted-foreground mt-1">Assigned Courses</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <p className="text-2xl font-bold text-blue-600">{facultyCourses.filter(c => !c.lecturerId).length}</p>
            <p className="text-xs text-muted-foreground mt-1">Unassigned Courses</p>
          </div>
        </div>
      </div>
    </div>
  );
}
