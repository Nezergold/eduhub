import { useMemo } from "react";
import { TrendingUp, BarChart3, BookOpen, Users, GraduationCap, AlertCircle } from "lucide-react";
import { useAppData } from "../context/AppContext";
import { getDepartmentsByFaculty, getFacultyForDepartment } from "../lib/types";

function HexagonStat({ label, value, color = "emerald" }: { label: string; value: number; color?: string }) {
  return (
    <div className="text-center p-4 rounded-xl bg-muted/30">
      <p className={`text-3xl font-bold font-[Outfit] text-${color}-700`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

export function DeanAnalytics() {
  const { user, courses, allUsers, registrations, scores, getFacultyCourses, getFacultyStudents, getFacultyLecturers, getFacultyRegistrations, getFacultyScores } = useAppData();
  const faculty = user.faculty || "";

  const facultyCourses = useMemo(() => getFacultyCourses(faculty), [getFacultyCourses, faculty]);
  const facultyStudents = useMemo(() => getFacultyStudents(faculty), [getFacultyStudents, faculty]);
  const facultyLecturers = useMemo(() => getFacultyLecturers(faculty), [getFacultyLecturers, faculty]);
  const facultyRegs = useMemo(() => getFacultyRegistrations(faculty), [getFacultyRegistrations, faculty]);
  const facultyScores = useMemo(() => getFacultyScores(faculty), [getFacultyScores, faculty]);
  const facultyDepts = useMemo(() => getDepartmentsByFaculty(faculty), [faculty]);

  const enrollmentByDept = useMemo(() => {
    return facultyDepts.map(dept => ({
      dept,
      count: facultyRegs.filter(r => r.department === dept && r.status === "approved").length,
    }));
  }, [facultyDepts, facultyRegs]);

  const gradeDistribution = useMemo(() => {
    const GRADES = ["A", "B", "C", "D", "F"] as const;
    const dist: Record<string, number> = {};
    GRADES.forEach(g => { dist[g] = 0; });
    facultyScores.forEach(s => {
      const grade = s.grade || "";
      if (dist[grade] !== undefined) dist[grade]++;
    });
    return Object.entries(dist).filter(([_, count]) => count > 0).sort((a, b) => b[1] - a[1]);
  }, [facultyScores]);

  const levelDistribution = useMemo(() => {
    const dist: Record<number, number> = {};
    facultyCourses.forEach(c => {
      dist[c.level] = (dist[c.level] || 0) + 1;
    });
    return Object.entries(dist).sort((a, b) => Number(a[0]) - Number(b[0]));
  }, [facultyCourses]);

  const passFailRates = useMemo(() => {
    const passCount = facultyScores.filter(s => (s.score || 0) >= 40).length;
    const failCount = facultyScores.filter(s => (s.score || 0) > 0 && (s.score || 0) < 40).length;
    const total = passCount + failCount;
    return {
      pass: total > 0 ? Math.round((passCount / total) * 100) : 0,
      fail: total > 0 ? Math.round((failCount / total) * 100) : 0,
      total,
    };
  }, [facultyScores]);

  const approvalRates = useMemo(() => {
    const approved = facultyRegs.filter(r => r.status === "approved").length;
    const pending = facultyRegs.filter(r => r.status === "pending").length;
    const rejected = facultyRegs.filter(r => r.status === "rejected").length;
    const total = approved + pending + rejected;
    return { approved, pending, rejected, total };
  }, [facultyRegs]);

  const feeCompliance = useMemo(() => {
    const paid = facultyRegs.filter(r => r.paymentStatus === "paid").length;
    const unpaid = facultyRegs.filter(r => r.paymentStatus === "unpaid").length;
    return { paid, unpaid, total: paid + unpaid };
  }, [facultyRegs]);

  const deptPerformance = useMemo(() => {
    return facultyDepts.map(dept => {
      const deptScores = facultyScores.filter(s => {
        const course = courses.find(c => c.id === s.courseId);
        return course?.department === dept;
      });
      const avg = deptScores.length > 0 ? Math.round(deptScores.reduce((sum, s) => sum + (s.score || 0), 0) / deptScores.length) : 0;
      return { dept, avg, count: deptScores.length };
    }).filter(d => d.count > 0).sort((a, b) => b.avg - a.avg);
  }, [facultyDepts, facultyScores, courses]);

  if (facultyCourses.length === 0 && facultyStudents.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-emerald-700 to-emerald-900 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-[Outfit]">Faculty Analytics</h2>
              <p className="text-emerald-100 text-sm">{faculty}</p>
            </div>
          </div>
        </div>
        <div className="text-center py-16 text-muted-foreground">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No Data Available</p>
          <p className="text-sm mt-2">Add courses, students, and scores to see analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-900 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-[Outfit]">Faculty Analytics</h2>
            <p className="text-emerald-100 text-sm">{faculty} — {facultyDepts.length} departments, {facultyCourses.length} courses</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <HexagonStat label="Total Registrations" value={approvalRates.total} />
        <HexagonStat label="Approved" value={approvalRates.approved} color="emerald" />
        <HexagonStat label="Pending" value={approvalRates.pending} color="amber" />
        <HexagonStat label="Total Scores" value={facultyScores.length} color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-bold text-foreground font-[Outfit] mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-700" /> Enrollment by Department
          </h3>
          {enrollmentByDept.filter(d => d.count > 0).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No approved registrations yet.</p>
          ) : (
            <div className="space-y-2">
              {enrollmentByDept.filter(d => d.count > 0).sort((a, b) => b.count - a.count).map(d => {
                const max = Math.max(...enrollmentByDept.map(x => x.count));
                const pct = max > 0 ? (d.count / max) * 100 : 0;
                return (
                  <div key={d.dept}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-foreground">{d.dept}</span>
                      <span className="text-muted-foreground">{d.count} student{d.count !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-bold text-foreground font-[Outfit] mb-4 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-emerald-700" /> Grade Distribution
          </h3>
          {gradeDistribution.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No scores recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {gradeDistribution.map(([cat, count]) => {
                const max = Math.max(...gradeDistribution.map(([_, c]) => c));
                const pct = max > 0 ? (count / max) * 100 : 0;
                const catColors: Record<string, string> = { A: "bg-emerald-500", B: "bg-blue-500", C: "bg-amber-500", D: "bg-orange-500", F: "bg-red-500" };
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-foreground">{cat}</span>
                      <span className="text-muted-foreground">{count} score{count !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${catColors[cat] || "bg-gray-400"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-bold text-foreground font-[Outfit] mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-700" /> Pass / Fail Rate
          </h3>
          <div className="text-center py-6">
            {passFailRates.total === 0 ? (
              <p className="text-sm text-muted-foreground">No graded scores yet.</p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                    <p className="text-3xl font-bold text-emerald-700 font-[Outfit]">{passFailRates.pass}%</p>
                    <p className="text-xs text-emerald-600 mt-1">Pass (≥40)</p>
                  </div>
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                    <p className="text-3xl font-bold text-red-700 font-[Outfit]">{passFailRates.fail}%</p>
                    <p className="text-xs text-red-600 mt-1">Fail (&lt;40)</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Based on {passFailRates.total} graded score{passFailRates.total !== 1 ? "s" : ""}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-bold text-foreground font-[Outfit] mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-700" /> Fee Compliance
          </h3>
          <div className="text-center py-6">
            {feeCompliance.total === 0 ? (
              <p className="text-sm text-muted-foreground">No registrations yet.</p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                    <p className="text-3xl font-bold text-emerald-700 font-[Outfit]">{feeCompliance.paid}</p>
                    <p className="text-xs text-emerald-600 mt-1">Fee Paid</p>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                    <p className="text-3xl font-bold text-amber-700 font-[Outfit]">{feeCompliance.unpaid}</p>
                    <p className="text-xs text-amber-600 mt-1">Awaiting Payment</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{feeCompliance.total} total registration{feeCompliance.total !== 1 ? "s" : ""}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {deptPerformance.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-bold text-foreground font-[Outfit] mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-700" /> Department Performance (Average Score)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {deptPerformance.map(d => (
              <div key={d.dept} className="text-center p-3 rounded-xl bg-muted/30">
                <p className="text-2xl font-bold text-emerald-700 font-[Outfit]">{d.avg}</p>
                <p className="text-xs font-medium text-foreground mt-1">{d.dept}</p>
                <p className="text-[10px] text-muted-foreground">{d.count} score{d.count !== 1 ? "s" : ""}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-bold text-foreground font-[Outfit] mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-700" /> Courses by Level
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {levelDistribution.map(([level, count]) => (
            <div key={level} className="text-center p-3 rounded-xl bg-muted/30">
              <p className="text-2xl font-bold text-emerald-700 font-[Outfit]">{count}</p>
              <p className="text-xs font-medium text-foreground mt-1">Level {level}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
