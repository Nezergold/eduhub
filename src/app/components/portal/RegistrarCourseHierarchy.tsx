import { useMemo, useState } from "react";
import {
  ArrowLeft, BookMarked, BookOpen, Building2, CalendarDays,
  ChevronDown, ChevronRight, ClipboardCheck, Crown, GraduationCap, Info,
  Plus, School, Search, UserCheck, Users, Workflow,
} from "lucide-react";
import { useAppData } from "../../context/AppContext";
import type { Course, User } from "../../lib/types";
import { ACADEMIC_LEVELS, FACULTY_STRUCTURE, getFacultyForDepartment } from "../../lib/types";

type StatusCode = "C" | "E" | "R";
type Tab = "hierarchy" | "lecturers" | "deans" | "flowchart";

const STATUS_META: Record<StatusCode, { label: string; cls: string }> = {
  C: { label: "Compulsory", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  E: { label: "Elective", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  R: { label: "Required", cls: "bg-blue-50 text-blue-700 border-blue-200" },
};

function courseStatus(c: Course): StatusCode {
  const prefix = (c.code || "").toUpperCase().split(/[\s/0-9]/)[0];
  const SERVICE = new Set(["GST", "GNS", "ENT", "FRE", "FRN", "LSE", "GSS"]);
  if (SERVICE.has(prefix)) return "R";
  if (c.code.includes("/")) return "E";
  return "C";
}

function initials(name: string): string {
  return name.split(" ").filter(Boolean).map(n => n[0]).join("").slice(0, 2).toUpperCase() || "—";
}

function Avatar({ name, tone = "wine", className = "w-10 h-10 text-sm" }: { name: string; tone?: "wine" | "lecturer" | "gold"; className?: string }) {
  const tones = {
    wine: "bg-wine/10 border-wine/20 text-wine",
    lecturer: "bg-lecturer/10 border-lecturer/20 text-lecturer",
    gold: "bg-gold/20 border-gold/40 text-wine",
  };
  return (
    <div className={`${className} rounded-full border ${tones[tone]} flex items-center justify-center font-bold font-[Outfit] flex-shrink-0`}>
      {initials(name)}
    </div>
  );
}

function StatusBadge({ status }: { status: StatusCode }) {
  const meta = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${meta.cls}`}>
      <span className="font-mono">{status}</span>
      {meta.label}
    </span>
  );
}

function StatMini({ label, value, tone = "text-foreground" }: { label: string; value: number | string; tone?: string }) {
  return (
    <div className="bg-muted/40 rounded-lg px-2 py-2 text-center">
      <p className={`text-base sm:text-lg font-bold font-[Outfit] leading-none ${tone}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground mt-1 truncate">{label}</p>
    </div>
  );
}

function Breadcrumbs({ items }: { items: { label: string; onClick?: () => void }[] }) {
  return (
    <nav className="flex items-center flex-wrap gap-1 text-xs text-muted-foreground">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="w-3 h-3 flex-shrink-0" />}
          <button
            type="button"
            onClick={it.onClick}
            className={`inline-flex items-center gap-1 transition-colors ${it.onClick ? "hover:text-foreground" : "cursor-default font-semibold text-foreground"}`}
          >
            {i === 0 && <School className="w-3.5 h-3.5" />}
            {it.label}
          </button>
        </span>
      ))}
    </nav>
  );
}

function HierarchyPath() {
  const steps = ["Faculty", "Dean", "Department", "Level", "Semester", "Course", "Allocation", "Students"];
  return (
    <div className="bg-card rounded-xl border border-border p-4 flex items-center flex-wrap gap-x-2 gap-y-2">
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        <School className="w-3.5 h-3.5 text-wine" /> Registrar
      </span>
      {steps.map((s, i) => (
        <span key={s} className="flex items-center gap-2">
          <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
          <span className={`text-[11px] font-semibold px-2 py-1 rounded-full border ${i % 2 === 0 ? "bg-wine/5 border-wine/20 text-wine" : "bg-gold/10 border-gold/30 text-wine"}`}>
            {s}
          </span>
        </span>
      ))}
    </div>
  );
}

function LevelPills({ levels, active, onSelect }: { levels: string[]; active: string; onSelect: (l: string) => void }) {
  const all = ACADEMIC_LEVELS.map(String);
  const extra = levels.filter(l => !all.includes(l));
  const present = new Set(levels);
  return (
    <div className="flex flex-wrap gap-1.5">
      {[...all, ...extra].map(l => {
        const has = present.has(l);
        const activeNow = active === l;
        return (
          <button
            key={l}
            type="button"
            disabled={!has}
            onClick={() => onSelect(l)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all border ${
              activeNow
                ? "bg-wine text-white border-wine shadow-sm"
                : has
                  ? "bg-card border-border text-foreground hover:border-wine/40 hover:bg-wine/5"
                  : "bg-muted/40 border-border text-muted-foreground/50 cursor-not-allowed opacity-50"
            }`}
          >
            {l}
            {has && <span className="ml-1.5 text-[9px] font-semibold uppercase opacity-70 hidden sm:inline">Lvl</span>}
          </button>
        );
      })}
    </div>
  );
}

function SemesterTabs({ semester, onSelect }: { semester: number; onSelect: (s: number) => void }) {
  return (
    <div className="flex gap-1.5 p-1 bg-muted/50 border border-border rounded-xl w-fit max-w-full">
      {[1, 2].map(s => (
        <button
          key={s}
          type="button"
          onClick={() => onSelect(s)}
          className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            semester === s ? "bg-accent text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          {s === 1 ? "First Semester" : "Second Semester"}
        </button>
      ))}
    </div>
  );
}

export function RegistrarCourseHierarchy({
  initialFaculty,
  onManageFaculties,
}: {
  initialFaculty?: string;
  onManageFaculties?: () => void;
}) {
  const { courses, registrations, allUsers, faculties, onNavigate, createCourse } = useAppData();
  const [tab, setTab] = useState<Tab>("flowchart");
  const [facultyName, setFacultyName] = useState<string | null>(initialFaculty || null);
  const [deptName, setDeptName] = useState<string | null>(null);
  const [level, setLevel] = useState<string>("100");
  const [semester, setSemester] = useState<number>(1);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: "", title: "", units: "3" });
  const [formErr, setFormErr] = useState("");

  const lecturers = useMemo(() => allUsers.filter(u => u.role === "lecturer"), [allUsers]);
  const deans = useMemo(() => allUsers.filter(u => u.role === "dean"), [allUsers]);
  const students = useMemo(() => allUsers.filter(u => u.role === "student"), [allUsers]);

  const facultyList = useMemo(() => {
    const seen = new Set<string>();
    const list: { name: string; dean?: string; departments: string[]; isBuiltin: boolean }[] = [];
    FACULTY_STRUCTURE.forEach(f => {
      seen.add(f.faculty);
      list.push({ name: f.faculty, dean: f.dean, departments: f.departments, isBuiltin: true });
    });
    faculties.forEach(f => {
      if (!seen.has(f.name)) {
        seen.add(f.name);
        list.push({ name: f.name, dean: f.dean, departments: f.departments, isBuiltin: false });
      }
    });
    return list;
  }, [faculties]);

  function deanNameFor(name: string, storedDean?: string): string {
    const u = deans.find(d => d.faculty === name);
    return u?.name || storedDean || "Not assigned";
  }

  function coursesInFaculty(name: string): Course[] {
    const depts = new Set(facultyList.find(f => f.name === name)?.departments || []);
    return courses.filter(c => depts.has(c.department));
  }

  function lecturersInFaculty(name: string): User[] {
    const depts = new Set(facultyList.find(f => f.name === name)?.departments || []);
    return lecturers.filter(l => depts.has(l.department || "") || l.faculty === name);
  }

  function openFaculty(name: string) {
    setTab("hierarchy");
    setFacultyName(name);
    setDeptName(null);
    setLevel("100");
    setSemester(1);
    setSearch("");
    setExpanded(null);
    setShowForm(false);
  }

  function openDept(name: string) {
    setDeptName(name);
    setLevel("100");
    setSemester(1);
    setSearch("");
    setExpanded(null);
    setShowForm(false);
  }

  function goRoot() {
    setFacultyName(null);
    setDeptName(null);
    setLevel("100");
    setSemester(1);
    setSearch("");
    setExpanded(null);
    setShowForm(false);
  }

  // ─── Overview / Hierarchy tab ────────────────────────────────────────────────

  function renderOverview() {
    const totalDepts = facultyList.reduce((a, f) => a + f.departments.length, 0);
    const totalCourses = courses.length;
    const totalStudents = students.length;
    const assignedDeans = facultyList.filter(f => deanNameFor(f.name, f.dean) !== "Not assigned").length;
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold font-[Outfit] text-foreground">Course Management</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Full faculty hierarchy — drill down from a faculty to its departments, levels, semesters, courses and allocations.
            </p>
          </div>
          {onManageFaculties && (
            <button
              type="button"
              onClick={onManageFaculties}
              className="inline-flex items-center justify-center gap-1.5 text-xs border border-border px-3 py-2 rounded-lg font-semibold hover:bg-muted/50 transition-colors w-fit"
            >
              <Building2 className="w-3.5 h-3.5" /> Manage Faculties
            </button>
          )}
        </div>

        <HierarchyPath />

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <StatMini label="Faculties" value={facultyList.length} />
          <StatMini label="Departments" value={totalDepts} />
          <StatMini label="Courses" value={totalCourses} />
          <StatMini label="Lecturers" value={lecturers.length} />
          <StatMini label="Students" value={totalStudents} tone="text-accent" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {facultyList.map(f => {
            const fc = coursesInFaculty(f.name);
            const fl = lecturersInFaculty(f.name);
            const dean = deanNameFor(f.name, f.dean);
            const levels = [...new Set(fc.map(c => c.level))].sort((a, b) => Number(a) - Number(b));
            return (
              <div key={f.name} className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg hover:border-accent/40 transition-all flex flex-col">
                <div className="h-1.5 bg-gradient-to-r from-wine via-gold to-wine" />
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-11 h-11 rounded-xl bg-wine/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-wine" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                      Faculty {!f.isBuiltin && <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold normal-case">Custom</span>}
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-foreground leading-snug">{f.name}</h3>
                  <div className="mt-2 flex items-center gap-1.5 text-xs min-w-0">
                    <Crown className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                    <span className="text-muted-foreground flex-shrink-0">Dean:</span>
                    <span className={`font-semibold truncate ${dean === "Not assigned" ? "text-amber-700" : "text-foreground"}`}>{dean}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <StatMini label="Depts" value={f.departments.length} />
                    <StatMini label="Courses" value={fc.length} />
                    <StatMini label="Lecturers" value={fl.length} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {ACADEMIC_LEVELS.map(l => {
                      const has = levels.includes(String(l));
                      return (
                        <span key={l} className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${has ? "bg-accent/10 text-accent" : "bg-muted/40 text-muted-foreground/40"}`}>
                          {l}
                        </span>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => openFaculty(f.name)}
                    className="mt-4 w-full inline-flex items-center justify-center gap-1.5 text-xs bg-wine text-white px-3 py-2 rounded-lg font-semibold hover:bg-wine-dark transition-colors"
                  >
                    Open Faculty <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── Faculty view ────────────────────────────────────────────────────────────

  function renderFaculty() {
    const f = facultyList.find(x => x.name === facultyName);
    if (!f) return renderOverview();
    const dean = deanNameFor(f.name, f.dean);
    const fc = coursesInFaculty(f.name);
    const fl = lecturersInFaculty(f.name);
    const facultyDeptCourseIds = new Set(fc.map(c => c.id));
    const enrolled = new Set(
      registrations.filter(r => facultyDeptCourseIds.has(r.courseId) && r.status === "approved").map(r => r.studentId),
    ).size;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Breadcrumbs
            items={[
              { label: "Course Management", onClick: goRoot },
              { label: f.name },
            ]}
          />
          <button type="button" onClick={goRoot} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
        </div>

        {/* Dean banner — Faculty Head */}
        <div className="rounded-xl overflow-hidden border border-border bg-gradient-to-br from-wine via-wine to-wine-dark text-white">
          <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gold text-wine flex items-center justify-center text-xl font-bold font-[Outfit] flex-shrink-0">
              {initials(dean)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-gold-light/80 font-bold flex items-center gap-1">
                <Crown className="w-3.5 h-3.5" /> Faculty Head · Dean
              </p>
              <h2 className="text-lg sm:text-xl font-bold font-[Outfit] mt-0.5 truncate">{dean}</h2>
              <p className="text-xs text-white/70 mt-0.5">{f.name}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3 flex-shrink-0">
              <div className="bg-white/10 border border-white/15 rounded-lg px-3 py-2 text-center">
                <p className="text-base font-bold font-[Outfit] leading-none">{f.departments.length}</p>
                <p className="text-[10px] text-white/60 mt-1">Departments</p>
              </div>
              <div className="bg-white/10 border border-white/15 rounded-lg px-3 py-2 text-center">
                <p className="text-base font-bold font-[Outfit] leading-none">{fc.length}</p>
                <p className="text-[10px] text-white/60 mt-1">Courses</p>
              </div>
              <div className="bg-white/10 border border-white/15 rounded-lg px-3 py-2 text-center">
                <p className="text-base font-bold font-[Outfit] leading-none">{enrolled}</p>
                <p className="text-[10px] text-white/60 mt-1">Enrolled</p>
              </div>
            </div>
          </div>
        </div>

        {/* Department cards */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Departments under this Faculty</h3>
          <span className="text-xs text-muted-foreground">{f.departments.length} departments · {fl.length} lecturers</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {f.departments.map(dept => {
            const dc = courses.filter(c => c.department === dept);
            const dl = lecturers.filter(l => l.department === dept);
            const deptCourseIds = new Set(dc.map(c => c.id));
            const ds = new Set(
              registrations.filter(r => deptCourseIds.has(r.courseId) && r.status === "approved").map(r => r.studentId),
            ).size;
            const deptLevels = [...new Set(dc.map(c => c.level))].sort((a, b) => Number(a) - Number(b));
            const totalUnits = dc.reduce((a, c) => a + (c.units || 0), 0);
            return (
              <div key={dept} className="bg-card rounded-xl border border-border p-5 flex flex-col hover:border-wine/40 hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <BookMarked className="w-5 h-5 text-gold" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">{deptLevels.join(" · ")}</span>
                </div>
                <h4 className="mt-3 text-sm font-bold text-foreground leading-snug">{dept}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{f.name}</p>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  <StatMini label="Courses" value={dc.length} />
                  <StatMini label="Units" value={totalUnits} />
                  <StatMini label="Staff" value={dl.length} />
                  <StatMini label="Enrolled" value={ds} tone="text-accent" />
                </div>
                <button
                  type="button"
                  onClick={() => openDept(dept)}
                  className="mt-4 w-full inline-flex items-center justify-center gap-1.5 text-xs bg-accent text-white px-3 py-2 rounded-lg font-semibold hover:bg-accent/90 transition-colors"
                >
                  View Department <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── Department view ─────────────────────────────────────────────────────────

  function renderDepartment() {
    if (!deptName) return renderFaculty();
    const f = facultyList.find(x => x.name === facultyName);
    const faculty = f?.name || getFacultyForDepartment(deptName);
    const dc = courses.filter(c => c.department === deptName);
    const deptLecturers = lecturers.filter(l => l.department === deptName);
    const levelsForDept = (() => {
      const set = new Set(dc.map(c => c.level));
      const all = ACADEMIC_LEVELS.map(String);
      const extra = [...set].filter(l => !all.includes(l)).sort((a, b) => Number(a) - Number(b));
      return [...all, ...extra];
    })();

    const levelCourses = dc.filter(c => c.level === level);
    const semCourses = levelCourses.filter(c => c.semester === semester);
    const q = search.trim().toLowerCase();
    const filtered = q
      ? semCourses.filter(c =>
          c.code.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.lecturer.toLowerCase().includes(q))
      : semCourses;
    const totalUnits = filtered.reduce((a, c) => a + (c.units || 0), 0);
    const deptCourseIds = new Set(dc.map(c => c.id));
    const enrolledDept = new Set(
      registrations.filter(r => deptCourseIds.has(r.courseId) && r.status === "approved").map(r => r.studentId),
    ).size;

    function handleAdd(e: React.FormEvent) {
      e.preventDefault();
      setFormErr("");
      if (!deptName) return;
      if (courses.some(c => c.code.toUpperCase() === form.code.trim().toUpperCase())) {
        setFormErr("A course with this code already exists.");
        return;
      }
      createCourse({
        code: form.code.trim().toUpperCase(),
        title: form.title.trim(),
        units: Number(form.units) || 3,
        department: deptName,
        faculty,
        lecturer: "Unassigned",
        level,
        semester,
        subjects: [],
      });
      setShowForm(false);
      setForm({ code: "", title: "", units: "3" });
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Breadcrumbs
            items={[
              { label: "Course Management", onClick: goRoot },
              { label: facultyName || faculty, onClick: () => openFaculty(facultyName || faculty) },
              { label: deptName },
            ]}
          />
          <button type="button" onClick={() => openFaculty(facultyName || faculty)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-border">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-wine/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-wine" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold font-[Outfit] text-foreground truncate">{deptName}</h2>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> {faculty}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <StatMini label="Courses" value={dc.length} />
                <StatMini label="Units" value={dc.reduce((a, c) => a + (c.units || 0), 0)} />
                <StatMini label="Lecturers" value={deptLecturers.length} />
                <StatMini label="Enrolled" value={enrolledDept} tone="text-accent" />
              </div>
            </div>

            <div className="mt-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Academic Level</p>
                <LevelPills levels={levelsForDept} active={level} onSelect={l => { setLevel(l); setSemester(1); setExpanded(null); }} />
              </div>
              <div className="md:text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Semester</p>
                <SemesterTabs semester={semester} onSelect={s => { setSemester(s); setExpanded(null); }} />
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-accent" />
                  Level {level} — {semester === 1 ? "First" : "Second"} Semester
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {filtered.length} course{filtered.length !== 1 ? "s" : ""} · {totalUnits} credit unit{totalUnits !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-input-background border border-border rounded-lg w-full sm:w-56 focus:outline-none focus:border-accent"
                    placeholder="Search code, title, lecturer..."
                  />
                </div>
                <button
                  type="button"
                  onClick={() => { setShowForm(!showForm); setFormErr(""); }}
                  className="inline-flex items-center gap-1.5 text-xs bg-accent text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-accent/90 transition-colors whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" /> {showForm ? "Cancel" : "New Course"}
                </button>
              </div>
            </div>

            {showForm && (
              <form onSubmit={handleAdd} className="mb-4 bg-muted/30 border border-border rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="text-xs font-semibold block mb-1">Course Code</label>
                  <input required value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))}
                    className="w-full bg-input-background border border-border rounded px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-accent" placeholder="e.g. ACC 212" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold block mb-1">Title</label>
                  <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    className="w-full bg-input-background border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-accent" />
                </div>
                <div className="flex gap-2 items-end">
                  <div className="w-24">
                    <label className="text-xs font-semibold block mb-1">Units</label>
                    <input type="number" min={1} max={6} value={form.units} onChange={e => setForm(p => ({ ...p, units: e.target.value }))}
                      className="w-full bg-input-background border border-border rounded px-3 py-1.5 text-sm text-center focus:outline-none focus:border-accent" />
                  </div>
                  <button type="submit" className="text-xs bg-accent text-white px-4 py-1.5 rounded-lg font-semibold hover:bg-accent/90 whitespace-nowrap">Add Course</button>
                </div>
                {formErr && <p className="text-xs text-red-600 sm:col-span-4">{formErr}</p>}
              </form>
            )}

            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                <Info className="w-3 h-3" /> Status:
              </span>
              <StatusBadge status="C" />
              <StatusBadge status="E" />
              <StatusBadge status="R" />
            </div>

            <div className="rounded-lg border border-border overflow-hidden">
              {filtered.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <BookOpen className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                  <p className="text-sm font-semibold text-foreground mt-3">No courses found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {semCourses.length === 0
                      ? `No courses listed for Level ${level}, ${semester === 1 ? "First" : "Second"} Semester in ${deptName}.`
                      : "Try a different search term."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px]">
                    <thead>
                      <tr className="bg-muted/50 text-left">
                        <th className="px-4 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Course</th>
                        <th className="px-4 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">Units</th>
                        <th className="px-4 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="px-4 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Allocated Lecturer</th>
                        <th className="px-4 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">Students</th>
                        <th className="px-4 py-2.5 w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(c => {
                        const isOpen = expanded === c.id;
                        const enrolled = registrations.filter(r => r.courseId === c.id && r.status === "approved");
                        const lec = lecturers.find(l => l.id === c.lecturerId) || lecturers.find(l => l.name === c.lecturer);
                        return (
                          <CourseRow key={c.id} course={c} enrolled={enrolled} lecturer={lec} isOpen={isOpen} onToggle={() => setExpanded(isOpen ? null : c.id)} semester={semester} level={level} />
                        );
                      })}
                    </tbody>
                    {filtered.length > 0 && (
                      <tfoot>
                        <tr className="bg-wine/5 border-t-2 border-wine/20">
                          <td className="px-4 py-2.5 text-xs font-bold text-foreground">Total — {filtered.length} course{filtered.length !== 1 ? "s" : ""}</td>
                          <td className="px-4 py-2.5 text-xs font-bold font-mono text-center text-wine">{totalUnits}</td>
                          <td colSpan={4} className="px-4 py-2.5 text-[10px] text-muted-foreground text-right">{semester === 1 ? "First" : "Second"} Semester · Level {level}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Department lecturers panel */}
        <div className="bg-card rounded-xl border border-border p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-lecturer" />
              {deptName} Lecturers & Course Allocation
            </h3>
            <span className="text-xs bg-lecturer/10 text-lecturer px-2 py-1 rounded font-semibold">{deptLecturers.length} staff</span>
          </div>
          {deptLecturers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No lecturers assigned to this department yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {deptLecturers.map(l => {
                const lc = dc.filter(c => c.lecturerId === l.id || c.lecturer === l.name);
                return (
                  <div key={l.id} className="rounded-lg border border-border bg-muted/20 p-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={l.name} tone="lecturer" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-foreground truncate">{l.name}</p>
                        <p className="text-[11px] text-muted-foreground font-mono truncate">{l.staffId} · {l.email}</p>
                      </div>
                      <span className="text-xs bg-lecturer/10 text-lecturer px-2 py-0.5 rounded font-bold whitespace-nowrap">{lc.length} course{lc.length !== 1 ? "s" : ""}</span>
                    </div>
                    {lc.length > 0 ? (
                      <ul className="mt-3 space-y-1.5">
                        {lc.map(c => (
                          <li key={c.id} className="flex items-center justify-between gap-2 text-xs bg-card border border-border rounded-md px-2.5 py-1.5">
                            <span className="font-mono font-bold text-foreground flex-shrink-0">{c.code}</span>
                            <span className="text-muted-foreground truncate">{c.title}</span>
                            <span className="text-[10px] text-muted-foreground flex-shrink-0 font-mono">{c.level} · {c.semester === 1 ? "1st" : "2nd"} · {c.units}u</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-3">No courses allocated in this department yet.</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Lecturers tab ───────────────────────────────────────────────────────────

  function renderLecturers() {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold font-[Outfit] text-foreground">Lecturers & Assigned Courses</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {lecturers.length} lecturers grouped by faculty and department, with their allocated courses.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("assignments")}
            className="inline-flex items-center justify-center gap-1.5 text-xs border border-border px-3 py-2 rounded-lg font-semibold hover:bg-muted/50 transition-colors w-fit"
          >
            <UserCheck className="w-3.5 h-3.5" /> Go to Lecturer Assignment
          </button>
        </div>

        {facultyList.map(f => {
          const grouped = f.departments
            .map(d => ({ dept: d, list: lecturers.filter(l => l.department === d) }))
            .filter(g => g.list.length > 0);
          if (grouped.length === 0) return null;
          return (
            <div key={f.name} className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border bg-wine text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gold-light" />
                <h3 className="text-sm font-bold font-[Outfit]">{f.name}</h3>
                <span className="ml-auto text-[10px] bg-white/15 px-2 py-0.5 rounded font-semibold">{grouped.reduce((a, g) => a + g.list.length, 0)} lecturers</span>
              </div>
              <div className="p-4 space-y-4">
                {grouped.map(g => (
                  <div key={g.dept}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                      <BookMarked className="w-3 h-3 text-accent" /> {g.dept} <span className="text-muted-foreground/60 normal-case font-semibold">· {g.list.length}</span>
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      {g.list.map(l => {
                        const lc = courses.filter(c => c.lecturerId === l.id || c.lecturer === l.name);
                        return (
                          <div key={l.id} className="rounded-lg border border-border bg-muted/20 p-4">
                            <div className="flex items-center gap-3">
                              <Avatar name={l.name} tone="lecturer" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-foreground truncate">{l.name}</p>
                                <p className="text-[11px] text-muted-foreground font-mono truncate">{l.staffId}</p>
                              </div>
                              <span className="text-xs bg-lecturer/10 text-lecturer px-2 py-0.5 rounded font-bold whitespace-nowrap">{lc.length}</span>
                            </div>
                            {lc.length > 0 ? (
                              <ul className="mt-3 space-y-1">
                                {lc.map(c => (
                                  <li key={c.id} className="flex items-center justify-between gap-2 text-[11px] bg-card border border-border rounded-md px-2 py-1">
                                    <span className="font-mono font-bold text-foreground flex-shrink-0">{c.code}</span>
                                    <span className="text-muted-foreground truncate">{c.title}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs text-muted-foreground mt-3">No courses assigned yet.</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {lecturers.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-10">No lecturers available.</p>
        )}
      </div>
    );
  }

  // ─── Deans tab ───────────────────────────────────────────────────────────────

  function renderDeans() {
    const assigned = facultyList.filter(f => deanNameFor(f.name, f.dean) !== "Not assigned");
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold font-[Outfit] text-foreground">Deans — Faculty Heads</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              One dean heads each faculty and oversees every department under it.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("dean-management")}
            className="inline-flex items-center justify-center gap-1.5 text-xs border border-border px-3 py-2 rounded-lg font-semibold hover:bg-muted/50 transition-colors w-fit"
          >
            <UserCheck className="w-3.5 h-3.5" /> Manage Deans
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {facultyList.map(f => {
            const dean = deanNameFor(f.name, f.dean);
            const fc = coursesInFaculty(f.name);
            const fl = lecturersInFaculty(f.name);
            return (
              <div key={f.name} className="bg-card rounded-xl border border-border overflow-hidden flex flex-col">
                <div className="h-1.5 bg-gradient-to-r from-gold via-wine to-gold" />
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-wine text-white flex items-center justify-center font-bold font-[Outfit] flex-shrink-0">
                      {initials(dean)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-bold truncate ${dean === "Not assigned" ? "text-amber-700" : "text-foreground"}`}>{dean}</p>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Crown className="w-3 h-3 text-gold" /> Faculty Head
                      </p>
                    </div>
                  </div>
                  <h4 className="mt-3 text-sm font-bold text-foreground">{f.name}</h4>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {f.departments.map(d => (
                      <span key={d} className="text-[10px] bg-muted/50 text-muted-foreground px-1.5 py-0.5 rounded">{d}</span>
                    ))}
                  </div>
                  <div className="mt-auto pt-4 grid grid-cols-3 gap-2">
                    <StatMini label="Departments" value={f.departments.length} />
                    <StatMini label="Courses" value={fc.length} />
                    <StatMini label="Lecturers" value={fl.length} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {assigned.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center">
            <Crown className="w-8 h-8 text-amber-600 mx-auto" />
            <p className="text-sm font-semibold text-amber-900 mt-3">No deans assigned yet</p>
            <p className="text-xs text-amber-800 mt-1">Use the Dean Management section to assign a dean to each faculty.</p>
          </div>
        )}
      </div>
    );
  }

  // ─── Courses by Faculty (compartment view) ──────────────────────────────────

  function renderFlowchart() {
    const flowFaculties = facultyName
      ? facultyList.filter(f => f.name === facultyName)
      : facultyList;
    const q = search.trim().toLowerCase();

    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold font-[Outfit] text-foreground">Courses by Faculty</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Every faculty is organised into its departments — each department is a compartment listing all of its courses with codes, levels, semesters, units and allocated lecturers.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-input-background border border-border rounded-lg w-full sm:w-64 focus:outline-none focus:border-accent"
                placeholder="Search code, title or lecturer..."
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setFacultyName(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${!facultyName ? "bg-wine text-white border-wine shadow-sm" : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-wine/40"}`}
              >
                All Faculties
              </button>
              {facultyList.map(f => (
                <button
                  key={f.name}
                  type="button"
                  onClick={() => setFacultyName(f.name)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border truncate max-w-52 ${facultyName === f.name ? "bg-wine text-white border-wine shadow-sm" : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-wine/40"}`}
                >
                  {f.name}
                  <span className={`ml-1.5 text-[9px] font-mono ${facultyName === f.name ? "bg-white/15" : "bg-muted"} px-1 rounded`}>{coursesInFaculty(f.name).length}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {flowFaculties.map(f => {
          const fc = coursesInFaculty(f.name);
          const fl = lecturersInFaculty(f.name);
          const dean = deanNameFor(f.name, f.dean);
          const deptsWithCourses = f.departments.filter(d => courses.some(c => c.department === d));
          const fcUnits = fc.reduce((a, c) => a + (c.units || 0), 0);
          return (
            <section key={f.name} className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-wine via-wine to-wine-dark text-white flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-9 h-9 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-gold-light" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold font-[Outfit] truncate">{f.name}</h3>
                    <p className="text-[10px] text-white/70 flex items-center gap-1">
                      <Crown className="w-3 h-3 text-gold-light" /> {dean}
                    </p>
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-2 text-[10px]">
                  <span className="bg-white/15 border border-white/15 px-2 py-1 rounded font-semibold">{f.departments.length} Departments</span>
                  <span className="bg-white/15 border border-white/15 px-2 py-1 rounded font-semibold">{fc.length} Courses</span>
                  <span className="bg-white/15 border border-white/15 px-2 py-1 rounded font-semibold hidden sm:inline">{fcUnits} Units</span>
                  <span className="bg-white/15 border border-white/15 px-2 py-1 rounded font-semibold hidden md:inline">{fl.length} Lecturers</span>
                </div>
              </div>

              <div className="p-4 sm:p-5 grid grid-cols-1 xl:grid-cols-2 gap-4">
                {deptsWithCourses.length === 0 && (
                  <div className="col-span-full text-center py-10">
                    <BookOpen className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                    <p className="text-sm font-semibold text-foreground mt-3">No courses in this faculty yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Courses will appear here once they are created under this faculty.</p>
                  </div>
                )}
                {deptsWithCourses.map(dept => {
                  const dc = courses.filter(c => c.department === dept);
                  const deptLecturers = lecturers.filter(l => l.department === dept);
                  const deptUnits = dc.reduce((a, c) => a + (c.units || 0), 0);
                  const rows = q
                    ? dc.filter(c =>
                        c.code.toLowerCase().includes(q) ||
                        c.title.toLowerCase().includes(q) ||
                        c.lecturer.toLowerCase().includes(q))
                    : dc;
                  return (
                    <div key={dept} className="rounded-xl border border-border overflow-hidden bg-muted/10 flex flex-col">
                      <div className="px-4 py-3 bg-muted/40 border-b border-border flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">{dept}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {dc.length} courses · {deptUnits} credit units · {deptLecturers.length} lecturers
                          </p>
                        </div>
                        <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded font-bold whitespace-nowrap">{dc.length}</span>
                      </div>
                      <div className="flex-1">
                        {rows.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-8 px-4">No courses match "{search}".</p>
                        ) : (
                          <ul className="divide-y divide-border">
                            {rows.map(c => {
                              const lec = lecturers.find(l => l.id === c.lecturerId) || lecturers.find(l => l.name === c.lecturer);
                              return (
                                <li key={c.id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-muted/20 transition-colors">
                                  <span className="w-16 flex-shrink-0 font-mono text-[11px] font-bold text-wine">{c.code}</span>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs text-foreground font-medium truncate">{c.title}</p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                      {c.level} Level · {c.semester === 1 ? "First" : "Second"} Semester · {c.units} credit unit{c.units !== 1 ? "s" : ""}
                                    </p>
                                  </div>
                                  <StatusBadge status={courseStatus(c)} />
                                  <div className="hidden md:flex items-center gap-1.5 min-w-0 w-36">
                                    <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[8px] font-bold flex-shrink-0 ${lec ? "bg-lecturer/10 border-lecturer/20 text-lecturer" : "bg-muted/50 border-border text-muted-foreground"}`}>
                                      {lec ? initials(lec.name) : "—"}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground truncate">{c.lecturer}</span>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                      <div className="mt-auto px-4 py-2.5 border-t border-border bg-muted/20 flex items-center justify-between text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {rows.length} course{rows.length !== 1 ? "s" : ""} shown</span>
                        <button
                          type="button"
                          onClick={() => { setTab("hierarchy"); openDept(dept); }}
                          className="inline-flex items-center gap-0.5 text-accent hover:underline font-semibold"
                        >
                          Open Department <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  const tabs: { key: Tab; label: string; icon: any; count?: number }[] = [
    { key: "hierarchy", label: "Faculty Hierarchy", icon: School },
    { key: "lecturers", label: "Lecturers", icon: UserCheck, count: lecturers.length },
    { key: "deans", label: "Deans", icon: Crown, count: facultyList.filter(f => deanNameFor(f.name, f.dean) !== "Not assigned").length },
    { key: "flowchart", label: "Courses by Faculty", icon: Workflow },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 p-1 bg-muted/50 border border-border rounded-xl w-fit max-w-full overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => { setTab(t.key); setExpanded(null); }}
            className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              tab === t.key ? "bg-wine text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            {t.count !== undefined && (
              <span className={`text-[10px] font-mono font-bold px-1.5 rounded ${tab === t.key ? "bg-white/15" : "bg-muted"}`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "hierarchy" && (deptName ? renderDepartment() : facultyName ? renderFaculty() : renderOverview())}
      {tab === "lecturers" && renderLecturers()}
      {tab === "deans" && renderDeans()}
      {tab === "flowchart" && renderFlowchart()}
    </div>
  );
}

function CourseRow({ course, enrolled, lecturer, isOpen, onToggle, semester, level }: {
  course: Course;
  enrolled: { studentName: string; matricNo: string }[];
  lecturer?: User;
  isOpen: boolean;
  onToggle: () => void;
  semester: number;
  level: string;
}) {
  return (
    <>
      <tr className={`border-t border-border transition-colors ${isOpen ? "bg-wine/5" : "hover:bg-muted/20"}`}>
        <td className="px-4 py-3">
          <button type="button" onClick={onToggle} className="flex items-center gap-3 min-w-0 w-full text-left">
            <span className="font-mono text-sm font-bold text-foreground flex-shrink-0">{course.code}</span>
            <span className="text-sm text-foreground truncate hidden sm:block">{course.title}</span>
          </button>
          <p className="text-xs text-muted-foreground sm:hidden mt-1">{course.title}</p>
        </td>
        <td className="px-4 py-3 text-sm font-mono text-center text-foreground">{course.units}</td>
        <td className="px-4 py-3"><StatusBadge status={courseStatus(course)} /></td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-7 h-7 rounded-full border flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${lecturer ? "bg-lecturer/10 border-lecturer/20 text-lecturer" : "bg-muted/50 border-border text-muted-foreground"}`}>
              {lecturer ? initials(lecturer.name) : "—"}
            </span>
            <span className="text-xs text-foreground truncate">{course.lecturer}</span>
          </div>
        </td>
        <td className="px-4 py-3 text-center">
          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded ${enrolled.length > 0 ? "bg-accent/10 text-accent" : "bg-muted/40 text-muted-foreground"}`}>
            <Users className="w-3 h-3" /> {enrolled.length}
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          <ChevronDown className={`w-4 h-4 text-muted-foreground inline transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </td>
      </tr>
      {isOpen && (
        <tr className="border-t border-border bg-muted/10">
          <td colSpan={6} className="px-4 py-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Course Allocation */}
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                  <ClipboardCheck className="w-3.5 h-3.5 text-accent" /> Course Allocation
                </p>
                <div className="flex items-center gap-3">
                  <Avatar name={lecturer?.name || course.lecturer} tone="lecturer" className="w-10 h-10 text-xs" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{course.lecturer}</p>
                    <p className="text-[11px] text-muted-foreground font-mono truncate">{lecturer?.staffId || "—"}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{lecturer?.email || "No contact on file"}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                  <span><span className="font-semibold text-foreground">Session:</span> 2023/2024</span>
                  <span><span className="font-semibold text-foreground">Level:</span> {level}</span>
                  <span><span className="font-semibold text-foreground">Semester:</span> {semester === 1 ? "First" : "Second"}</span>
                  <span><span className="font-semibold text-foreground">Units:</span> {course.units}</span>
                </div>
              </div>
              {/* Enrolled Students */}
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-accent" /> Enrolled Students
                  </p>
                  <span className="text-xs font-bold text-accent">{enrolled.length}</span>
                </div>
                {enrolled.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">No students enrolled for this course yet.</p>
                ) : (
                  <ul className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {enrolled.map((r, i) => (
                      <li key={i} className="flex items-center justify-between gap-2 text-xs bg-muted/40 border border-border rounded-md px-2.5 py-1.5">
                        <span className="font-medium text-foreground truncate">{r.studentName}</span>
                        <span className="font-mono text-muted-foreground flex-shrink-0">{r.matricNo}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
