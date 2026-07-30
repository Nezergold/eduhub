import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from "recharts";
import {
  GraduationCap, BookOpen, Users, LayoutDashboard, ClipboardList,
  FileText, Settings, LogOut, ChevronRight, Menu, X, Bell,
  Plus, Search, Upload, Check, AlertCircle, TrendingUp, Award,
  BookMarked, UserCheck, Layers, BarChart2, ChevronDown,
  Building2, FlaskConical, Download, CheckCircle, Clock, XCircle,
  UserPlus, Edit2, Trash2, Filter, ArrowUpDown, Wallet, School, ClipboardCheck
} from "lucide-react";
import { Logo, PrintBranding } from "./components/Logo";
import { NotificationBell } from "./components/NotificationBell";
import { AdminEnrollForm } from "./components/AdminEnrollForm";
import { AccountSettings } from "./components/AccountSettings";
import { ExportButton } from "./components/ExportButton";
import { CourseSwitcher } from "./components/CourseSwitcher";
import { ReviewStatusBadge } from "./components/ReviewStatusBadge";
import { LecturerCourseApprovals } from "./components/portal/LecturerCourseApprovals";
import { LecturerFeePayments } from "./components/portal/LecturerFeePayments";
import { AdminResultReviews } from "./components/portal/AdminResultReviews";
import { CourseFeeNotice } from "./components/CourseFeeNotice";
import { CloudSyncIndicator } from "./components/CloudSyncIndicator";
import { GlobalSearch } from "./components/GlobalSearch";
import { LoginPage } from "./pages/LoginPage";
import { AppDataProvider, useAppData } from "./context/AppContext";
import { LecturerCourseManagement } from "./components/portal/LecturerCourseManagement";
import { DeanOverview } from "./pages/DeanOverview";
import { DeanCourseAssignment } from "./pages/DeanCourseAssignment";
import { DeanLecturerManagement } from "./pages/DeanLecturerManagement";
import { DeanStudentManagement } from "./pages/DeanStudentManagement";
import { DeanScoreReview } from "./pages/DeanScoreReview";
import { DeanAnalytics } from "./pages/DeanAnalytics";
import { exportOfficialCourseForm } from "./lib/courseFormPdf";
import type { Role, User, View, Course, ReviewStatus } from "./lib/types";
import { DEPARTMENT_NAMES as DEPARTMENTS, FACULTIES, FACULTY_STRUCTURE, INSTITUTION_NAME, ACADEMIC_LEVELS, getDepartmentsByFaculty, getFacultyForDepartment, formatCourseFee, computeCourseFee, portalRole, isRegistrarRole, isDeanRole } from "./lib/types";
import {
  studentExportRows, lecturerExportRows, scoreExportRows, registrationExportRows,
  STUDENT_EXPORT_COLUMNS, LECTURER_EXPORT_COLUMNS, SCORE_EXPORT_COLUMNS, REGISTRATION_EXPORT_COLUMNS,
} from "./lib/exportPresets";
import {
  initAuth,
  loadSessionUser, saveSession, clearSession, restoreCloudSession,
  getAllUsers, getUserById,
  SESSION_KEY,
} from "./lib/auth";
import { initStore } from "./lib/store";
import { subscribeCloudRealtime, subscribeAuthStateChange, pullCloudStores } from "./lib/cloudSync";
import { isCloudEnabled } from "./lib/config";
import {
  calcGPA, calcCGPA, calcGrade, gradeBg, statusBadge, paymentBadge, CHART_WINE, CHART_GOLD,
} from "./lib/utils";

// ─── Sub-Components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, accent, delay = 0 }: {
  label: string; value: string | number; sub?: string; icon: any; accent?: string; delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-card rounded-xl border border-border p-4 sm:p-5 flex items-start gap-3 sm:gap-4 shadow-sm hover:shadow-md hover:border-accent/30 transition-shadow"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accent || "bg-primary/10"}`}>
        <Icon className={`w-5 h-5 ${accent ? "text-white" : "text-primary"}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs sm:text-sm text-muted-foreground font-medium">{label}</p>
        <p className="text-xl sm:text-2xl font-bold text-foreground font-[Outfit]">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

function UserAvatar({ user, className = "w-8 h-8" }: { user: User; className?: string }) {
  const initials = user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  if (user.avatar) {
    return <img src={user.avatar} alt="" className={`${className} rounded-full object-cover flex-shrink-0`} />;
  }
  return (
    <div className={`${className} rounded-full bg-accent flex items-center justify-center text-accent-foreground text-xs font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-bold text-foreground font-[Outfit]">{title}</h2>
      {action}
    </div>
  );
}

function StudentPortalFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-0">
      <CourseFeeNotice />
      {children}
    </div>
  );
}

// ─── Sidebar ───────────────────────────────────────────────────────────────────

const NAV_ITEMS: Record<Role, { label: string; view: View; icon: any }[]> = {
  student: [
    { label: "Dashboard", view: "dashboard", icon: LayoutDashboard },
    { label: "My Profile", view: "profile", icon: Users },
    { label: "Course Registration", view: "registration", icon: ClipboardList },
    { label: "My Results", view: "results", icon: Award },
    { label: "Settings", view: "settings", icon: Settings },
  ],
  lecturer: [
    { label: "Dashboard", view: "dashboard", icon: LayoutDashboard },
    { label: "Manage Courses", view: "courses", icon: BookOpen },
    { label: "Students", view: "students", icon: Users },
    { label: "Course Approvals", view: "course-approvals", icon: CheckCircle },
    { label: "Fee Verification", view: "fee-payments", icon: Wallet },
    { label: "Upload Scores", view: "scores", icon: Upload },
    { label: "Settings", view: "settings", icon: Settings },
  ],
  registrar: [
    { label: "Dashboard", view: "dashboard", icon: LayoutDashboard },
    { label: "User Management", view: "users", icon: Users },
    { label: "Departments", view: "departments", icon: Building2 },
    { label: "Course Management", view: "course-mgmt", icon: BookMarked },
    { label: "Lecturer Assignment", view: "assignments", icon: UserCheck },
    { label: "Lecturers by Course", view: "lecturers-by-course", icon: UserCheck },
    { label: "Approvals", view: "approvals", icon: CheckCircle },
    { label: "Result Reviews", view: "result-reviews", icon: FileText },
    { label: "Analytics", view: "analytics", icon: BarChart2 },
    { label: "Dean Mgmt", view: "dean-management", icon: School },
    { label: "Settings", view: "settings", icon: Settings },
  ],
  dean: [
    { label: "Faculty Dashboard", view: "dean-overview", icon: LayoutDashboard },
    { label: "Student Management", view: "dean-students", icon: Users },
    { label: "Lecturer Management", view: "dean-lecturers", icon: UserCheck },
    { label: "Course Assignment", view: "dean-courses", icon: ClipboardList },
    { label: "Score Review", view: "dean-reviews", icon: ClipboardCheck },
    { label: "Faculty Analytics", view: "dean-analytics", icon: BarChart2 },
    { label: "Settings", view: "settings", icon: Settings },
  ],
};

function Sidebar({ user, activeView, onNavigate, collapsed, onToggle, onLogout, onHome, mobileOpen, onMobileClose }: {
  user: User; activeView: View; onNavigate: (v: View) => void;
  collapsed: boolean; onToggle: () => void; onLogout: () => void;
  onHome: () => void; mobileOpen: boolean; onMobileClose: () => void;
}) {
  const items = NAV_ITEMS[portalRole(user.role)];
  const initials = user.name.split(" ").map(n => n[0]).join("").slice(0, 2);

  function handleNav(view: View) {
    onNavigate(view);
    onMobileClose();
  }

  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onMobileClose}
          />
        )}
      </AnimatePresence>
      <aside className={`
        flex flex-col bg-wine-dark text-white transition-all duration-300 flex-shrink-0 z-50
        fixed inset-y-0 left-0 lg:relative
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        ${collapsed ? "w-16 lg:w-16" : "w-64 lg:w-56"}
      `}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10">
          {!collapsed ? (
            <Logo size="sm" light showText onClick={onHome} className="flex-1 min-w-0" />
          ) : (
            <Logo size="sm" light showText={false} onClick={onHome} className="mx-auto" />
          )}
          <button onClick={onMobileClose} className="lg:hidden text-white/60 hover:text-white transition-colors ml-auto">
            <X className="w-5 h-5" />
          </button>
          {!collapsed && (
            <button onClick={onToggle} className="hidden lg:block text-white/40 hover:text-white transition-colors">
              <Menu className="w-4 h-4" />
            </button>
          )}
        </div>

        {collapsed && (
          <button onClick={onToggle} className="hidden lg:flex justify-center py-3 text-white/40 hover:text-white transition-colors border-b border-white/10">
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Role badge */}
        {!collapsed && (
          <div className="px-4 py-3 border-b border-white/10">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gold-light/70">
              {user.role === "student" ? "Student Portal" : user.role === "lecturer" ? "Lecturer Portal" : isDeanRole(user.role) ? "Dean Portal" : "Registrar Portal"}
            </span>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
          {items.map((item, i) => (
            <motion.button
              key={item.view}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleNav(item.view)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${activeView === item.view ? "bg-white/15 text-white font-semibold border-l-2 border-gold" : "text-white/60 hover:bg-white/8 hover:text-white"}`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </motion.button>
          ))}
        </nav>

        {/* User + Sign Out */}
        <div className="border-t border-white/10 p-3 space-y-2">
          <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
            <UserAvatar user={user} />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{user.name.split(" ")[0]}</p>
                <p className="text-[10px] text-white/40 truncate capitalize">{portalRole(user.role)}</p>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gold-light text-wine font-semibold border-0 rounded-xl py-2 px-3 text-xs transition-all duration-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          )}
          {collapsed && (
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center bg-white hover:bg-gold-light text-wine border-0 rounded-xl py-2 transition-all duration-200"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

// ─── Top Bar ───────────────────────────────────────────────────────────────────

function TopBar({ user, title, onMenuToggle, onCloudRefresh, onLogout, onNavigate }: { user: User; title: string; onMenuToggle?: () => void; onCloudRefresh?: () => void; onLogout?: () => void; onNavigate?: (v: View) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="h-14 sm:h-16 bg-card border-b border-border flex items-center px-4 sm:px-6 gap-3 sm:gap-4 flex-shrink-0 relative">
      {onMenuToggle && (
        <button onClick={onMenuToggle} className="lg:hidden text-muted-foreground hover:text-foreground transition-colors p-1">
          <Menu className="w-5 h-5" />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="text-sm sm:text-base font-bold text-foreground font-[Outfit] truncate">{title}</h1>
        {user.matricNo && <p className="text-[10px] sm:text-xs text-muted-foreground font-mono truncate">{user.matricNo}</p>}
        {user.staffId && <p className="text-[10px] sm:text-xs text-muted-foreground font-mono truncate">{user.staffId}</p>}
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <GlobalSearch />
        <CloudSyncIndicator onRefresh={onCloudRefresh} />
        <NotificationBell />
        <div className="relative">
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-border hover:bg-muted/50 rounded-lg py-1 pr-1 transition-colors cursor-pointer"
          >
            <UserAvatar user={user} className="w-8 h-8 bg-wine text-white" />
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-foreground">{user.name}</p>
              <p className="text-[10px] text-muted-foreground capitalize">{user.department || user.role}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 bg-card rounded-xl border border-border shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-wine text-white">
                  <p className="text-sm font-bold">{user.name}</p>
                  <p className="text-xs text-white/70 capitalize">{user.department || user.faculty || user.role}</p>
                  {user.matricNo && <p className="text-[10px] text-white/50 font-mono mt-0.5">{user.matricNo}</p>}
                  {user.staffId && <p className="text-[10px] text-white/50 font-mono mt-0.5">{user.staffId}</p>}
                </div>
                <div className="py-1">
                  <button
                    onClick={() => { setMenuOpen(false); onNavigate?.("settings"); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    Account Settings
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

// ─── Student Views ──────────────────────────────────────────────────────────────

function StudentDashboard() {
  const { user, courses, getMyScores, getMyRegistrations, getMySemesterResults } = useAppData();
  const userScores = getMyScores();
  const hasPublishedScores = userScores.length > 0;
  const currentGPA = calcGPA(userScores, user.id, courses);
  const pastResults = getMySemesterResults();
  const cgpa = hasPublishedScores ? (pastResults.length ? calcCGPA(pastResults) : currentGPA) : 0;
  const registered = getMyRegistrations().filter(r => r.status === "approved");
  const chartData = pastResults.length ? pastResults : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Current GPA" value={hasPublishedScores ? currentGPA.toFixed(2) : "Pending"} sub={hasPublishedScores ? "This semester" : "Pending first evaluation"} icon={TrendingUp} accent="bg-accent" />
        <StatCard label="CGPA" value={hasPublishedScores ? cgpa.toFixed(2) : "Pending"} sub={hasPublishedScores ? "Cumulative" : "No published results yet"} icon={Award} />
        <StatCard label="Registered Courses" value={registered.length} sub="Approved" icon={BookOpen} />
        <StatCard label="Credit Units" value={registered.reduce((a, r) => a + (courses.find(c => c.id === r.courseId)?.units || 0), 0)} sub="This semester" icon={Layers} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border border-border p-5">
          <SectionHeader title="GPA Trend" />
          {!hasPublishedScores ? (
            <div className="h-[180px] flex items-center justify-center text-center">
              <div>
                <p className="text-sm font-semibold text-foreground">No exam data available yet</p>
                <p className="text-xs text-muted-foreground mt-1">GPA trend appears after your first published evaluation.</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gpaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_WINE} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={CHART_WINE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e9f4" />
                <XAxis dataKey="semester" tick={{ fontSize: 10, fill: "#5b6e8a" }} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: "#5b6e8a" }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Area type="monotone" dataKey="gpa" stroke={CHART_WINE} fill="url(#gpaGrad)" strokeWidth={2} dot={{ r: 3, fill: CHART_WINE }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <SectionHeader title="Current Semester Scores" />
          <div className="space-y-3">
            {userScores.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No results published yet.</p>}
            {userScores.map(s => (
              <div key={s.courseCode} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-semibold text-foreground font-mono">{s.courseCode}</p>
                  <p className="text-xs text-muted-foreground">CA: {s.ca} / Exam: {s.exam} / Total: {s.total}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${gradeBg(s.grade)}`}>{s.grade}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentProfile() {
  const { user, getMySemesterResults, getMyScores, courses } = useAppData();
  const pastResults = getMySemesterResults();
  const userScores = getMyScores();
  const hasPublishedScores = userScores.length > 0;
  const cgpa = hasPublishedScores && pastResults.length > 0 ? calcCGPA(pastResults) : (hasPublishedScores ? calcGPA(userScores, user.id, courses) : 0);
  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary to-accent" />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-10 mb-4">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="w-20 h-20 rounded-xl border-4 border-card object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-primary border-4 border-card flex items-center justify-center text-primary-foreground text-2xl font-bold font-[Outfit]">
                {user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
            )}
            <div className="pb-1">
              <h2 className="text-xl font-bold font-[Outfit] text-foreground">{user.name}</h2>
              <p className="text-sm text-muted-foreground font-mono">{user.matricNo}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "Department", value: user.department },
              { label: "Faculty", value: user.faculty },
              { label: "Level", value: `${user.level} Level` },
              { label: "Semester", value: `Semester ${user.semester}` },
              { label: "Email", value: user.email },
              { label: "Status", value: "Active" },
            ].map(f => (
              <div key={f.label} className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-0.5">{f.label}</p>
                <p className="text-sm font-semibold text-foreground">{f.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-5">
        <SectionHeader title="Academic Summary" />
        {pastResults.length === 0 ? (
          <div className="rounded-lg border border-border bg-muted/20 p-5 text-center">
            <p className="text-sm font-semibold text-foreground">Pending first evaluation</p>
            <p className="text-xs text-muted-foreground mt-1">Semester history will appear after your first published result.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {pastResults.map(r => (
              <div key={r.semester} className="bg-muted/30 rounded-lg p-3 border border-border">
                <p className="text-xs text-muted-foreground font-mono">{r.semester}</p>
                <p className="text-xl font-bold font-[Outfit] text-foreground mt-1">{r.gpa.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">{r.units} units</p>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-lg p-3">
          <Award className="w-5 h-5 text-accent" />
          <div>
            <p className="text-sm font-bold text-foreground">CGPA: {hasPublishedScores ? cgpa.toFixed(2) : "Pending"}</p>
            <p className="text-xs text-muted-foreground">Cumulative Grade Point Average</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentRegistration() {
  const { user, courses, registrations, registerForCourse, dropMyRegistration } = useAppData();
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [pickingCourse, setPickingCourse] = useState<Course | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const regs = registrations.filter(r => r.studentId === user.id);
  const registered = regs.map(r => r.courseId);
  const studentDept = user.department || "";
  const q = search.toLowerCase();
  const deptCourses = courses.filter(c => !studentDept || c.department === studentDept);
  const available = deptCourses.filter(c => {
    if (registered.includes(c.id)) return false;
    if (!q) return true;
    return (
      c.code.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.lecturer.toLowerCase().includes(q)
    );
  });
  const approvedRegs = regs.filter(r => r.status === "approved");

  function openSubjectPicker(course: Course) {
    setPickingCourse(course);
    setSelectedSubjects(course.subjects.map(s => s.title));
    setError("");
  }

  function toggleSubject(title: string) {
    setSelectedSubjects(prev =>
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  }

  function confirmRegister() {
    if (!pickingCourse) return;
    if (selectedSubjects.length === 0) {
      setError("Select at least one subject.");
      return;
    }
    try {
      registerForCourse(pickingCourse, selectedSubjects);
      setPickingCourse(null);
      setSelectedSubjects([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed.");
    }
  }

  function drop(regId: string) {
    dropMyRegistration(regId);
  }

  function formatTs(iso: string) {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border border-border p-5">
        <SectionHeader
          title="Registered Courses"
          action={
            <div className="flex flex-wrap items-center gap-2">
              {approvedRegs.length > 0 && (
                <button
                  type="button"
                  onClick={() => exportOfficialCourseForm(user, regs)}
                  className="inline-flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-semibold hover:opacity-90"
                >
                  <Download className="w-3.5 h-3.5" /> Print Course Form
                </button>
              )}
              <ExportButton
                compact
                options={{
                  title: "My Course Registrations",
                  filename: "my_registrations",
                  columns: REGISTRATION_EXPORT_COLUMNS,
                  rows: registrationExportRows(regs),
                }}
              />
            </div>
          }
        />
        {error && !pickingCourse && <p className="text-sm text-destructive mb-3">{error}</p>}
        {regs.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No courses registered yet.</p>}
        <div className="space-y-2">
          {regs.map(r => {
            const course = courses.find(c => c.id === r.courseId);
            return (
              <div key={r.id} className="py-3 px-4 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-sm font-semibold text-foreground">{r.courseCode}</span>
                    <span className="text-sm text-muted-foreground truncate">{r.courseTitle}</span>
                    {course && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded font-mono flex-shrink-0">{course.units}u</span>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${statusBadge(r.status)}`}>{r.status}</span>
                    {r.status === "pending" && (
                      <button onClick={() => drop(r.id)} className="text-xs text-red-600 hover:text-red-800 font-medium transition-colors">Drop</button>
                    )}
                  </div>
                </div>
                {r.subjects.length > 0 && (
                  <p className="text-[11px] text-muted-foreground mt-2">
                    <span className="font-semibold">Subjects:</span> {r.subjects.join(" · ")}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] text-muted-foreground">
                  <span><span className="font-semibold">Lecturer:</span> {r.lecturerName || course?.lecturer || "—"}</span>
                  <span><span className="font-semibold">Fee:</span> {formatCourseFee(r.courseFee ?? computeCourseFee())}</span>
                  <span className={`px-2 py-0.5 rounded border font-semibold capitalize ${paymentBadge(r.paymentStatus)}`}>
                    {r.paymentStatus === "paid" ? "Fee paid" : "Fee unpaid"}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground/70 mt-1">Registered: {formatTs(r.registeredAt)}</p>
              </div>
            );
          })}
        </div>
      </div>

      {pickingCourse && (
        <div className="bg-card rounded-lg border border-accent/30 p-5 shadow-md">
          <SectionHeader title={`Select Subjects — ${pickingCourse.code}`} />
          <p className="text-sm text-muted-foreground mb-1">{pickingCourse.title}</p>
          <p className="text-xs text-muted-foreground mb-4">
            Lecturer: <span className="font-semibold text-foreground">{pickingCourse.lecturer}</span>
            {" · "}Course fee: <span className="font-semibold text-foreground">{formatCourseFee(computeCourseFee())}</span>
          </p>
          {error && <p className="text-sm text-destructive mb-3">{error}</p>}
          <div className="space-y-2 mb-4">
            {pickingCourse.subjects.map(s => (
              <label key={s.id} className="flex items-center gap-3 py-2 px-3 rounded-lg border border-border hover:bg-muted/30 cursor-pointer">
                <input type="checkbox" checked={selectedSubjects.includes(s.title)}
                  onChange={() => toggleSubject(s.title)}
                  className="rounded border-border text-accent focus:ring-accent" />
                <div>
                  <p className="text-sm font-medium text-foreground">{s.title}</p>
                  <p className="text-xs font-mono text-muted-foreground">{s.code}</p>
                </div>
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={confirmRegister} className="text-xs bg-accent text-white px-4 py-2 rounded-lg font-semibold hover:bg-accent/90">Confirm Registration</button>
            <button onClick={() => { setPickingCourse(null); setError(""); }} className="text-xs border border-border px-4 py-2 rounded-lg font-semibold hover:bg-muted/50">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-card rounded-lg border border-border p-5">
        <SectionHeader title={`Department Courses — ${studentDept || "your department"}`}
          action={
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-input-background border border-border rounded-lg focus:outline-none focus:border-accent w-48"
                placeholder="Search courses..." />
            </div>
          }
        />
        <p className="text-xs text-muted-foreground mb-4">
          Apply for active courses in your department ({studentDept || "set department in profile"}). {deptCourses.length} course(s) available.
        </p>
        {!studentDept && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
            Your department is not set. Contact the registrar to update your profile before registering.
          </p>
        )}
        {available.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No matching courses in your department.</p>}
        <div className="space-y-2">
          {available.map(c => (
            <div key={c.id} className="flex items-center justify-between py-3 px-4 rounded-lg border border-border hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-sm font-semibold text-foreground">{c.code}</span>
                <div className="min-w-0">
                  <p className="text-sm text-foreground">{c.title}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground/80">{c.faculty}</span>
                    {" · "}{c.department} · Level {c.level}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <span className="font-semibold text-foreground/80">Lecturer: {c.lecturer}</span>
                    {" · "}{c.units} units · {formatCourseFee(computeCourseFee())}
                  </p>
                </div>
              </div>
              <button onClick={() => openSubjectPicker(c)}
                className="flex items-center gap-1.5 text-xs bg-accent text-white px-3 py-1.5 rounded-lg hover:bg-accent/90 transition-colors font-semibold flex-shrink-0">
                <Plus className="w-3 h-3" /> Register
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StudentResults() {
  const { user, courses, getMyScores, getMySemesterResults } = useAppData();
  const userScores = getMyScores();
  const hasPublishedScores = userScores.length > 0;
  const gpa = calcGPA(userScores, user.id, courses);
  const pastResults = getMySemesterResults();
  const cgpa = hasPublishedScores ? (pastResults.length ? calcCGPA(pastResults) : gpa) : 0;
  const displayResults = pastResults;
  const totalUnits = userScores.reduce((a, s) => a + (courses.find(c => c.code === s.courseCode)?.units || 3), 0);
  const level = user.level || "100";
  const semester = user.semester ?? 1;

  return (
    <div className="space-y-6 print:space-y-4">
      <PrintBranding />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 print:hidden">
        <StatCard label="Semester GPA" value={hasPublishedScores ? gpa.toFixed(2) : "Pending"} icon={TrendingUp} accent="bg-accent" />
        <StatCard label="CGPA" value={hasPublishedScores ? cgpa.toFixed(2) : "Pending"} icon={Award} />
        <StatCard label="Credit Units Earned" value={totalUnits} sub="This semester" icon={Layers} />
      </div>

      {!hasPublishedScores && (
        <div className="bg-card rounded-xl border border-border p-5 text-center">
          <p className="text-sm font-semibold text-foreground">No exam data available yet</p>
          <p className="text-xs text-muted-foreground mt-1">Published results from your lecturers will appear here automatically.</p>
        </div>
      )}

      <div className="bg-card rounded-xl border border-border overflow-hidden print:border-gray-300">
        <div className="px-4 sm:px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 print:border-gray-300">
          <div>
            <h2 className="font-bold text-foreground font-[Outfit] text-sm sm:text-base">Result Sheet — {level} Level, Semester {semester}</h2>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">{user.name} · {user.matricNo}</p>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <ExportButton
              compact
              options={{
                title: `Result Slip — ${user.name}`,
                filename: `results_${user.matricNo || user.id}`,
                columns: SCORE_EXPORT_COLUMNS,
                rows: scoreExportRows(userScores),
              }}
            />
            <button type="button" onClick={() => window.print()}
              className="flex items-center gap-1.5 text-xs text-accent border border-accent/30 px-3 py-1.5 rounded-lg hover:bg-accent/5 transition-colors font-semibold">
              <Download className="w-3.5 h-3.5" /> Print
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="bg-muted/50 text-left">
              <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Course</th>
              <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Title</th>
              <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">Units</th>
              <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">CA</th>
              <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">Exam</th>
              <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">Total</th>
              <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Grade</th>
              <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">GP</th>
            </tr>
          </thead>
          <tbody>
            {userScores.length === 0 && (
              <tr><td colSpan={8} className="text-center py-10 text-sm text-muted-foreground">Pending first evaluation.</td></tr>
            )}
            {userScores.map(s => {
              const course = courses.find(c => c.code === s.courseCode);
              return (
                <tr key={s.courseCode} className="border-t border-border hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3 font-mono text-sm font-semibold text-foreground">{s.courseCode}</td>
                  <td className="px-5 py-3 text-sm text-foreground">{course?.title}</td>
                  <td className="px-5 py-3 text-sm font-mono text-center text-muted-foreground">{course?.units}</td>
                  <td className="px-5 py-3 text-sm font-mono text-center text-foreground">{s.ca}</td>
                  <td className="px-5 py-3 text-sm font-mono text-center text-foreground">{s.exam}</td>
                  <td className="px-5 py-3 text-sm font-mono text-center font-bold text-foreground">{s.total}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${gradeBg(s.grade)}`}>{s.grade}</span>
                  </td>
                  <td className="px-5 py-3 text-sm font-mono text-center font-bold text-foreground">{s.gradePoint.toFixed(1)}</td>
                </tr>
              );
            })}
          </tbody>
          {userScores.length > 0 && (
            <tfoot>
              <tr className="bg-primary/5 border-t-2 border-primary/20">
                <td colSpan={2} className="px-5 py-3 text-sm font-bold text-foreground">Semester GPA</td>
                <td colSpan={6} className="px-5 py-3 text-right text-lg font-bold text-accent font-[Outfit] font-mono">{gpa.toFixed(2)}</td>
              </tr>
            </tfoot>
          )}
        </table>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-5">
        <SectionHeader title="Academic History" />
        {displayResults.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No semester records available yet.</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="text-left">
                <th className="pb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Session/Semester</th>
                <th className="pb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Units</th>
                <th className="pb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">GPA</th>
                <th className="pb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Standing</th>
              </tr>
            </thead>
            <tbody>
              {displayResults.map(r => (
                <tr key={r.semester} className="border-t border-border">
                  <td className="py-3 font-mono text-sm text-foreground">{r.semester}</td>
                  <td className="py-3 text-sm text-muted-foreground">{r.units}</td>
                  <td className="py-3 text-sm font-bold font-mono text-foreground">{r.gpa.toFixed(2)}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${r.gpa >= 4.5 ? "bg-green-50 text-green-700 border border-green-200" : r.gpa >= 3.5 ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                      {r.gpa >= 4.5 ? "First Class" : r.gpa >= 3.5 ? "Second Class Upper" : "Second Class Lower"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
}

// ─── Lecturer Views ────────────────────────────────────────────────────────────

function LecturerDashboard() {
  const { getMyCourses, registrations, scores, recentScores } = useAppData();
  const myCourses = getMyCourses();
  const myStudents = registrations.filter(r => myCourses.some(c => c.id === r.courseId) && r.status === "approved");
  const submitted = scores.filter(s => myCourses.some(c => c.code === s.courseCode));
  const myRecentScores = recentScores.filter(s => myCourses.some(c => c.code === s.courseCode));

  function formatTs(iso?: string) {
    if (!iso) return "—";
    try { return new Date(iso).toLocaleString(); } catch { return iso; }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Assigned Courses" value={myCourses.length} icon={BookOpen} accent="bg-accent" />
        <StatCard label="Total Students" value={myStudents.length} icon={Users} />
        <StatCard label="Scores Submitted" value={submitted.length} icon={Upload} />
        <StatCard label="Pending Uploads" value={Math.max(0, myStudents.length - submitted.length)} sub="Awaiting" icon={Clock} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border border-border p-5">
          <SectionHeader title="My Courses" />
          <div className="space-y-3">
            {myCourses.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No courses assigned yet.</p>}
            {myCourses.map(c => {
              const students = registrations.filter(r => r.courseId === c.id && r.status === "approved");
              return (
                <div key={c.id} className="flex items-center justify-between py-3 px-4 rounded-lg bg-muted/30 border border-border">
                  <div>
                    <p className="font-mono text-sm font-semibold text-foreground">{c.code}</p>
                    <p className="text-xs text-muted-foreground">{c.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{students.length}</p>
                    <p className="text-xs text-muted-foreground">approved roster</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <SectionHeader title="Score Submission Status" />
          <div className="space-y-3">
            {myCourses.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No courses assigned yet.</p>}
            {myCourses.map(c => {
              const students = registrations.filter(r => r.courseId === c.id && r.status === "approved");
              const submittedForCourse = scores.filter(s => s.courseCode === c.code);
              return (
                <div key={c.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-semibold text-foreground">{c.code}</span>
                    <span className="text-xs text-muted-foreground">{submittedForCourse.length}/{students.length}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${students.length > 0 ? Math.round((submittedForCourse.length / students.length) * 100) : 0}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-5">
        <SectionHeader title="Enrolled Students (Live)" />
        {myStudents.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No students enrolled yet.</p>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            {myStudents.length > 0 && (
              <thead>
                <tr className="bg-muted/50 text-left">
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Student</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Matric No.</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Course</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Subjects</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Registered</th>
                </tr>
              </thead>
            )}
            <tbody>
              {myStudents.map(r => (
                <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3 text-sm font-medium">{r.studentName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.matricNo}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-semibold">{r.courseCode}</span>
                    <p className="text-[11px] text-muted-foreground">{r.courseTitle}</p>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-muted-foreground max-w-[200px]">{r.subjects.join(" · ")}</td>
                  <td className="px-4 py-3 text-[11px] text-muted-foreground whitespace-nowrap">{formatTs(r.registeredAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-5">
        <SectionHeader title="Recently Submitted Results" />
        {myRecentScores.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No results submitted yet.</p>}
        <div className="space-y-2">
          {myRecentScores.map(s => (
            <div key={`${s.studentId}-${s.courseCode}`} className="flex items-center justify-between py-2.5 px-4 rounded-lg bg-muted/30 border border-border">
              <div>
                <p className="text-sm font-semibold">{s.studentName} <span className="font-mono text-xs text-muted-foreground">({s.matricNo})</span></p>
                <p className="text-xs text-muted-foreground">{s.courseCode} — {s.courseTitle}</p>
              </div>
              <div className="text-right">
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${gradeBg(s.grade)}`}>{s.total} — {s.grade}</span>
                <p className="text-[10px] text-muted-foreground mt-1">{formatTs(s.submittedAt)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LecturerCourses() {
  return <LecturerCourseManagement />;
}

function LecturerStudents() {
  const { getMyCourses, registrations, courses, scores } = useAppData();
  const myCourses = getMyCourses();
  const [selectedCourse, setSelectedCourse] = useState(myCourses[0]?.id || "");
  const students = registrations.filter(r => r.courseId === selectedCourse && r.status === "approved");
  const selectedCode = courses.find(c => c.id === selectedCourse)?.code;

  if (!myCourses.length) return <p className="text-sm text-muted-foreground text-center py-12">No courses assigned yet.</p>;

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-lg border border-border p-5">
        <SectionHeader title="Students by Course" />
        <div className="flex gap-2 flex-wrap mb-5">
          {myCourses.map(c => (
            <button key={c.id} onClick={() => setSelectedCourse(c.id)}
              className={`text-xs font-mono font-semibold px-3 py-1.5 rounded-lg border transition-all ${selectedCourse === c.id ? "bg-accent text-white border-accent" : "border-border text-muted-foreground hover:border-accent/50"}`}>
              {c.code}
            </button>
          ))}
        </div>
        {students.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No students registered for this course.</p>}
        <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          {students.length > 0 && (
            <thead>
              <tr className="bg-muted/50 text-left">
                <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Matric No.</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subjects</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Score</th>
              </tr>
            </thead>
          )}
          <tbody>
            {students.map((r, i) => {
              const student = getUserById(r.studentId);
              const score = scores.find(s => s.studentId === r.studentId && s.courseCode === selectedCode);
              return (
                <tr key={r.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{r.studentName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.matricNo || student?.matricNo || "—"}</td>
                  <td className="px-4 py-3 text-[11px] text-muted-foreground max-w-[180px]">{r.subjects?.join(" · ") || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded border font-medium capitalize ${paymentBadge(r.paymentStatus)}`}>
                      {r.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200 font-medium">Registered</span>
                  </td>
                  <td className="px-4 py-3">
                    {score ? (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${gradeBg(score.grade)}`}>{score.total} — {score.grade}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Pending</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

function LecturerScores() {
  const { getMyCourses, registrations, courses, scores, allUsers, submitScores, deleteScore } = useAppData();
  const myCourses = getMyCourses();
  const [selectedCourse, setSelectedCourse] = useState(myCourses[0]?.id || "");
  const [filterLevel, setFilterLevel] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const course = courses.find(c => c.id === selectedCourse);
  const students = registrations.filter(r => {
    if (r.courseId !== selectedCourse || r.status !== "approved") return false;
    const student = allUsers.find(u => u.id === r.studentId);
    if (filterLevel && student?.level !== filterLevel) return false;
    if (filterSemester && String(course?.semester) !== filterSemester) return false;
    return true;
  });

  const [scoreInputs, setScoreInputs] = useState<Record<string, { ca: string; exam: string }>>({});
  const [saved, setSaved] = useState(false);
  const [submitInfo, setSubmitInfo] = useState("");

  useEffect(() => {
    const init: Record<string, { ca: string; exam: string }> = {};
    scores.forEach(s => {
      if (course && s.courseCode === course.code) {
        init[s.studentId] = { ca: String(s.ca), exam: String(s.exam) };
      }
    });
    setScoreInputs(init);
  }, [selectedCourse, course?.code, scores]);

  function handleSave() {
    if (!course) return;
    try {
      const entries = students.map(r => {
        const student = getUserById(r.studentId);
        return {
          studentId: r.studentId,
          studentName: r.studentName,
          matricNo: student?.matricNo || "—",
          ca: Number(scoreInputs[r.studentId]?.ca || 0),
          exam: Number(scoreInputs[r.studentId]?.exam || 0),
        };
      }).filter(e => e.ca > 0 || e.exam > 0);
      submitScores(course, entries, { publish: false });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setSubmitInfo(e instanceof Error ? e.message : "Could not save scores.");
      setTimeout(() => setSubmitInfo(""), 3000);
    }
  }

  function handleSubmitForReview() {
    if (!course) return;
    try {
      const entries = students.map(r => {
      const student = getUserById(r.studentId);
      return {
        studentId: r.studentId,
        studentName: r.studentName,
        matricNo: student?.matricNo || "—",
        ca: Number(scoreInputs[r.studentId]?.ca || 0),
        exam: Number(scoreInputs[r.studentId]?.exam || 0),
      };
    }).filter(e => e.ca > 0 || e.exam > 0);
    if (!entries.length) {
      setSubmitInfo("Enter at least one score before submitting.");
      setTimeout(() => setSubmitInfo(""), 3000);
      return;
    }
    submitScores(course, entries, { publish: true });
    setSubmitInfo(`Grade sheet submitted to dean for ${course.code}. Scores are now locked.`);
    setTimeout(() => setSubmitInfo(""), 3000);
    } catch (e) {
      setSubmitInfo(e instanceof Error ? e.message : "Submission failed.");
      setTimeout(() => setSubmitInfo(""), 3000);
    }
  }

  const exportRows = students.map(r => {
    const s = scores.find(sc => sc.studentId === r.studentId && sc.courseCode === course?.code);
    const ca = Number(scoreInputs[r.studentId]?.ca || 0);
    const exam = Number(scoreInputs[r.studentId]?.exam || 0);
    return {
      studentName: r.studentName,
      matricNo: r.matricNo,
      courseCode: course?.code || "",
      level: getUserById(r.studentId)?.level || "—",
      semester: course?.semester ?? "—",
      ca: s?.ca ?? ca,
      exam: s?.exam ?? exam,
      total: (s?.total ?? ca + exam) || "—",
      grade: s?.grade || "—",
      reviewStatus: s?.reviewStatus || "draft",
    };
  });

  if (!myCourses.length) return <p className="text-sm text-muted-foreground text-center py-12">No courses assigned yet.</p>;

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-lg border border-border p-5">
        <SectionHeader
          title="Score Sheet"
          action={
            <ExportButton
              options={{
                title: `Score Sheet — ${course?.code || ""}`,
                filename: `scores_${course?.code || "course"}`,
                columns: [
                  ...SCORE_EXPORT_COLUMNS.slice(0, 3),
                  { key: "level", header: "Level" },
                  { key: "semester", header: "Semester" },
                  ...SCORE_EXPORT_COLUMNS.slice(3),
                ],
                rows: exportRows,
              }}
            />
          }
        />
        <CourseSwitcher courses={myCourses} selectedId={selectedCourse} onSelect={setSelectedCourse} className="mb-4" />

        <div className="flex flex-wrap gap-3 mb-4">
          <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)}
            className="text-xs bg-input-background border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:border-accent">
            <option value="">All Levels</option>
            {ACADEMIC_LEVELS.map(l => <option key={l} value={l}>{l} Level</option>)}
          </select>
          <select value={filterSemester} onChange={e => setFilterSemester(e.target.value)}
            className="text-xs bg-input-background border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:border-accent">
            <option value="">All Semesters</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
          </select>
        </div>

        {course && (
          <div className="mb-4 bg-muted/30 rounded-lg px-4 py-3 border border-border flex flex-wrap items-center gap-4 text-xs">
            <span className="font-mono font-bold text-foreground">{course.code}</span>
            <span className="text-muted-foreground">{course.title}</span>
            <span className="text-muted-foreground">{course.level} Level — Semester {course.semester}</span>
            <span className="ml-auto text-muted-foreground">CA max: <b>40</b> — Exam max: <b>60</b></span>
          </div>
        )}

        <div className="overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="bg-muted/50 text-left">
              <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Student</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Matric No.</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-28">CA (40)</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-28">Exam (60)</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-20">Total</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16">Grade</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-24">Status</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16">Action</th>
            </tr>
          </thead>
          <tbody>
            {students.map(r => {
              const student = getUserById(r.studentId);
              const ca = Number(scoreInputs[r.studentId]?.ca || 0);
              const exam = Number(scoreInputs[r.studentId]?.exam || 0);
              const total = ca + exam;
              const { grade } = calcGrade(total);
              const existing = course ? scores.find(s => s.studentId === r.studentId && s.courseCode === course.code) : undefined;
              const reviewStatus = (existing?.reviewStatus || "draft") as ReviewStatus;
              return (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{r.studentName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{student?.matricNo || "—"}</td>
                  <td className="px-4 py-3">
                    <input type="number" min={0} max={40} disabled={existing?.locked || reviewStatus === "pending" || reviewStatus === "dean_review" || reviewStatus === "approved"}
                      value={scoreInputs[r.studentId]?.ca || ""}
                      onChange={e => setScoreInputs(p => ({ ...p, [r.studentId]: { ...p[r.studentId], ca: e.target.value } }))}
                      className="w-20 text-sm font-mono text-center bg-input-background border border-border rounded px-2 py-1.5 focus:outline-none focus:border-accent disabled:opacity-60" />
                  </td>
                  <td className="px-4 py-3">
                    <input type="number" min={0} max={60} disabled={existing?.locked || reviewStatus === "pending" || reviewStatus === "dean_review" || reviewStatus === "approved"}
                      value={scoreInputs[r.studentId]?.exam || ""}
                      onChange={e => setScoreInputs(p => ({ ...p, [r.studentId]: { ...p[r.studentId], exam: e.target.value } }))}
                      className="w-20 text-sm font-mono text-center bg-input-background border border-border rounded px-2 py-1.5 focus:outline-none focus:border-accent disabled:opacity-60" />
                  </td>
                  <td className="px-4 py-3 font-mono text-sm font-bold text-foreground">{total || "—"}</td>
                  <td className="px-4 py-3">
                    {total > 0 && <span className={`text-xs font-bold px-2 py-0.5 rounded ${gradeBg(grade)}`}>{grade}</span>}
                  </td>
                  <td className="px-4 py-3">
                    {existing ? <ReviewStatusBadge status={reviewStatus} /> : (
                      <span className="text-[11px] text-muted-foreground">Not saved</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {existing && !existing.locked && reviewStatus !== "pending" && reviewStatus !== "dean_review" && reviewStatus !== "approved" && (
                      <button onClick={() => {
                        if (confirm(`Delete score for ${r.studentName}?`)) {
                          deleteScore(r.studentId, course?.code || "");
                          const newInputs = { ...scoreInputs };
                          delete newInputs[r.studentId];
                          setScoreInputs(newInputs);
                        }
                      }} className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-colors text-xs">
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>

        <div className="mt-4 flex items-center justify-end gap-3 pt-4 border-t border-border flex-wrap">
          {saved && (
            <div className="flex items-center gap-1.5 text-primary text-sm">
              <CheckCircle className="w-4 h-4" /> Draft saved
            </div>
          )}
          {submitInfo && <p className="text-xs text-primary font-medium">{submitInfo}</p>}
          <button onClick={handleSave}
            className="flex items-center gap-2 border border-accent text-accent text-sm font-semibold px-4 py-2 rounded-lg hover:bg-accent/5 transition-colors">
            <Upload className="w-4 h-4" /> Save Draft
          </button>
          <button onClick={handleSubmitForReview}
            className="flex items-center gap-2 bg-accent text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors">
            <Check className="w-4 h-4" /> Submit to Dean
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Views ───────────────────────────────────────────────────────────────

function AdminDashboard() {
  const { adminStats, enrollData, gradeDistribution, registrations, scores, recentScores, registrationSummary, allUsers, refresh, approveRegistration, rejectRegistration } = useAppData();
  const pending = registrations.filter(r => r.status === "pending").slice(0, 4);
  const lecturerCount = allUsers.filter(u => u.role === "lecturer").length;
  const stats = [
    { label: "Total Students", value: adminStats.totalStudents, icon: GraduationCap, accent: "bg-accent" },
    { label: "Total Lecturers", value: lecturerCount, icon: Users },
    { label: "Active Courses", value: adminStats.activeCourses, icon: BookOpen },
    { label: "Pending Approvals", value: adminStats.pendingApprovals, icon: Clock },
    { label: "Departments", value: adminStats.departments, icon: Building2 },
    { label: "Avg. CGPA", value: adminStats.avgGpa.toFixed(2), icon: TrendingUp },
    { label: "Pass Rate", value: `${adminStats.passRate}%`, icon: CheckCircle },
    { label: "Registered This Semester", value: adminStats.registeredThisSemester, icon: ClipboardList },
  ];

  return (
    <div className="space-y-6">
      <AdminEnrollForm onSuccess={() => refresh()} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border border-border p-5">
          <SectionHeader title="Enrollment by Faculty" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={enrollData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e9f4" />
              <XAxis dataKey="faculty" tick={{ fontSize: 10, fill: "#5b6e8a" }} />
              <YAxis tick={{ fontSize: 10, fill: "#5b6e8a" }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="students" fill={CHART_WINE} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <SectionHeader title="Grade Distribution" />
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="60%" height={200}>
              <PieChart>
                <Pie data={gradeDistribution} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {gradeDistribution.map(entry => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {gradeDistribution.map(d => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-xs text-muted-foreground">{d.name}</span>
                  <span className="text-xs font-bold text-foreground ml-auto font-mono">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-5">
        <SectionHeader title="Student Registrations (Live Sync)" />
        {registrationSummary.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No registrations yet.</p>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            {registrationSummary.length > 0 && (
              <thead>
                <tr className="bg-muted/50 text-left">
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Student</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">ID / Matric</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Faculty / Dept</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Courses & Subjects</th>
                </tr>
              </thead>
            )}
            <tbody>
              {registrationSummary.map(s => (
                <tr key={s.studentId} className="border-t border-border align-top hover:bg-muted/20">
                  <td className="px-4 py-3 text-sm font-medium">{s.studentName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.matricNo}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    <p>{s.faculty}</p>
                    <p className="text-[11px]">{s.department}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-2">
                      {s.courses.map((c, i) => (
                        <div key={i} className="text-xs">
                          <span className="font-mono font-semibold">{c.code}</span>
                          <span className="text-muted-foreground"> — {c.title}</span>
                          <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] capitalize ${statusBadge(c.status)}`}>{c.status}</span>
                          <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] capitalize ${paymentBadge(c.paymentStatus)}`}>{c.paymentStatus}</span>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Lecturer: {c.lecturerName} · Fee: {formatCourseFee(c.courseFee)}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Subjects: {c.subjects.join(", ")}</p>
                          <p className="text-[10px] text-muted-foreground/70">{new Date(c.registeredAt).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-5">
        <SectionHeader title="Recent Results Submitted" />
        {recentScores.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No results submitted yet.</p>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            {recentScores.length > 0 && (
              <thead>
                <tr className="bg-muted/50 text-left">
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Student</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Course</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Score</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Submitted By</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Date</th>
                </tr>
              </thead>
            )}
            <tbody>
              {recentScores.map(s => (
                <tr key={`${s.studentId}-${s.courseCode}`} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3 text-sm font-medium">{s.studentName}<br /><span className="font-mono text-xs text-muted-foreground">{s.matricNo}</span></td>
                  <td className="px-4 py-3"><span className="font-mono text-xs font-semibold">{s.courseCode}</span><p className="text-[11px] text-muted-foreground">{s.courseTitle}</p></td>
                  <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-0.5 rounded ${gradeBg(s.grade)}`}>{s.total} — {s.grade}</span></td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] px-2 py-0.5 rounded border font-semibold ${s.published ? "bg-primary/10 text-primary border-primary/30" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                      {s.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{s.submittedBy || "—"}</td>
                  <td className="px-4 py-3 text-[11px] text-muted-foreground whitespace-nowrap">{s.submittedAt ? new Date(s.submittedAt).toLocaleString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-3">Total results on record: {scores.length}</p>
      </div>

      <div className="bg-card rounded-lg border border-border p-5">
        <SectionHeader title="Recent Pending Approvals" />
        {pending.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No pending approvals.</p>}
        <div className="space-y-2">
          {pending.map(r => (
            <div key={r.id} className="flex items-center justify-between py-2.5 px-4 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-amber-200 rounded-full flex items-center justify-center text-amber-700 text-xs font-bold">
                  {r.studentName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{r.studentName}</p>
                  <p className="text-xs text-muted-foreground font-mono">{r.courseCode} — {r.courseTitle}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => approveRegistration(r.id)} className="text-xs text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded font-medium hover:bg-green-100 transition-colors">Approve</button>
                <button onClick={() => rejectRegistration(r.id)} className="text-xs text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded font-medium hover:bg-red-100 transition-colors">Reject</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminUsers() {
  const { allUsers, courses, refresh, updateUser, deleteLecturer } = useAppData();
  const [tab, setTab] = useState<"all" | "students" | "lecturers" | "deans">("lecturers");
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [editForm, setEditForm] = useState({ name: "", username: "", email: "", faculty: "", department: "", phone: "", matricNo: "", staffId: "", level: "" });
  const [editError, setEditError] = useState("");
  const [viewingProfile, setViewingProfile] = useState<User | null>(null);

  const students = allUsers.filter(u => u.role === "student");
  const lecturers = allUsers.filter(u => u.role === "lecturer");
  const deans = allUsers.filter(u => u.role === "dean");
  const list = tab === "students" ? students : tab === "lecturers" ? lecturers : tab === "deans" ? deans : allUsers.filter(u => !isRegistrarRole(u.role));

  const filtered = list.filter(u =>
    (levelFilter === "" || u.level === levelFilter) &&
    (u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.matricNo || u.staffId || "").toLowerCase().includes(search.toLowerCase()))
  );

  function openEdit(user: User) {
    setEditing(user);
    setEditForm({
      name: user.name,
      username: user.username,
      email: user.email,
      faculty: user.faculty || "",
      department: user.department || "",
      phone: user.phone || "",
      matricNo: user.matricNo || "",
      staffId: user.staffId || "",
      level: user.level || "",
    });
    setEditError("");
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setEditError("");
    const result = await updateUser(editing.id, {
      name: editForm.name,
      username: editForm.username,
      email: editForm.email,
      faculty: editForm.faculty,
      department: editForm.department,
      phone: editForm.phone,
      matricNo: editing.role === "student" ? editForm.matricNo : undefined,
      staffId: editing.role === "lecturer" ? editForm.staffId : undefined,
      level: editing.role === "student" ? editForm.level : undefined,
    });
    if (result.success) {
      setEditing(null);
      refresh();
    } else {
      setEditError(result.error || "Update failed.");
    }
  }

  function openDelete(user: User) {
    setDeleting(user);
    setDeleteError("");
  }

  async function handleDeleteConfirm() {
    if (!deleting) return;
    setDeleteLoading(true);
    setDeleteError("");
    const result = await deleteLecturer(deleting.id);
    setDeleteLoading(false);
    if (result.success) {
      setDeleting(null);
      if (editing?.id === deleting.id) setEditing(null);
      refresh();
    } else {
      setDeleteError(result.error || "Could not delete lecturer.");
    }
  }

  function lecturerCourseCount(lecturerId: string) {
    return courses.filter(c => c.lecturerId === lecturerId).length;
  }

  function userInitials(name: string) {
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  }

  const roleColors: Record<string, string> = {
    student: "bg-blue-100 text-blue-700",
    lecturer: "bg-amber-100 text-amber-700",
    dean: "bg-emerald-100 text-emerald-700",
    registrar: "bg-purple-100 text-purple-700",
    admin: "bg-purple-100 text-purple-700",
  };

  function roleBadge(role: string) {
    return roleColors[role] || "bg-gray-100 text-gray-700";
  }

  return (
    <div className="space-y-4">
      {showForm && (
        <AdminEnrollForm onSuccess={() => { refresh(); setShowForm(false); }} />
      )}

      <div className="bg-card rounded-lg border border-border p-5">
        <SectionHeader title="User Management"
          action={
            <div className="flex items-center gap-2 flex-wrap">
              {tab === "students" && (
                <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)}
                  className="text-xs bg-input-background border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-accent">
                  <option value="">All Levels</option>
                  {ACADEMIC_LEVELS.map(l => <option key={l} value={l}>{l} Level</option>)}
                </select>
              )}
              <ExportButton
                compact
                options={{
                  title: tab === "students" ? "Student Directory" : tab === "lecturers" ? "Lecturer Directory" : "User Directory",
                  filename: tab === "students" ? "students" : tab === "lecturers" ? "lecturers" : "users",
                  columns: tab === "lecturers" ? LECTURER_EXPORT_COLUMNS : STUDENT_EXPORT_COLUMNS,
                  rows: tab === "lecturers"
                    ? lecturerExportRows(filtered, courses)
                    : studentExportRows(filtered),
                }}
              />
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-input-background border border-border rounded-lg focus:outline-none focus:border-accent w-44"
                  placeholder="Search users..." />
              </div>
              <button onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-1.5 text-xs bg-accent text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-accent/90 transition-colors">
                <UserPlus className="w-3.5 h-3.5" /> {showForm ? "Hide Form" : "Enroll User"}
              </button>
            </div>
          }
        />

        <div className="flex gap-2 mb-4 flex-wrap">
          {([
            { key: "lecturers" as const, label: `Lecturers (${lecturers.length})` },
            { key: "students" as const, label: `Students (${students.length})` },
            { key: "deans" as const, label: `Deans (${deans.length})` },
            { key: "all" as const, label: "All Users" },
          ]).map(t => (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${tab === t.key ? "bg-accent text-white border-accent" : "border-border text-muted-foreground hover:border-accent/50"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "lecturers" && (
          <p className="text-xs text-muted-foreground mb-4 bg-muted/40 border border-border rounded-lg px-3 py-2">
            {lecturers.length} lecturers on staff. Use <strong>Edit</strong> to update details or <strong>Delete</strong> to remove lecturers no longer needed. Assigned courses are unassigned automatically.
          </p>
        )}

        {tab === "deans" && (
          <p className="text-xs text-muted-foreground mb-4 bg-muted/40 border border-border rounded-lg px-3 py-2">
            {deans.length} dean{deans.length !== 1 ? "s" : ""} configured. Each dean oversees one faculty. Use <strong>Edit</strong> to change faculty assignment or <strong>Delete</strong> to remove.
          </p>
        )}

        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No users match your search.</p>
        )}

        {/* Mobile / tablet card list */}
        <div className="md:hidden space-y-3">
          {filtered.map(u => {
            const courseCount = u.role === "lecturer" ? lecturerCourseCount(u.id) : 0;
            return (
              <div key={u.id} className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  {u.avatar ? (
                    <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full object-cover border border-border flex-shrink-0" />
                  ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${roleBadge(u.role)}`}>
                      {userInitials(u.name)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{u.name}</p>
                    <p className="text-xs font-mono text-accent mt-0.5">@{u.username}</p>
                    <p className="text-[11px] text-muted-foreground font-mono mt-0.5 break-all">{u.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>
                    <span className="font-semibold text-foreground/70 block">ID</span>
                    {u.matricNo || u.staffId || "—"}
                  </div>
                  <div>
                    <span className="font-semibold text-foreground/70 block">Role</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${roleBadge(u.role)}`}>{u.role}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-semibold text-foreground/70 block">Faculty / Dept</span>
                    {u.faculty || "—"} · {u.department || "—"}
                  </div>
                  {u.phone && (
                    <div>
                      <span className="font-semibold text-foreground/70 block">Phone</span>
                      {u.phone}
                    </div>
                  )}
                  {u.level && (
                    <div>
                      <span className="font-semibold text-foreground/70 block">Level</span>
                      {u.level}
                    </div>
                  )}
                  {u.role === "lecturer" && courseCount > 0 && (
                    <div className="col-span-2 text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                      Assigned to {courseCount} course{courseCount !== 1 ? "s" : ""}
                    </div>
                  )}
                  {u.role === "dean" && (
                    <div className="col-span-2 text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-2 py-1">
                      Dean of {u.faculty || "—"}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button type="button" onClick={() => setViewingProfile(u)}
                    className="flex-1 min-w-[90px] text-xs text-muted-foreground border border-border px-3 py-2 rounded-lg font-semibold hover:bg-muted/50 flex items-center justify-center gap-1">
                    View Profile
                  </button>
                  <button type="button" onClick={() => openEdit(u)}
                    className="flex-1 min-w-[90px] text-xs text-accent border border-accent/30 px-3 py-2 rounded-lg font-semibold hover:bg-accent/5 flex items-center justify-center gap-1">
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  {(u.role === "lecturer" || u.role === "dean") && (
                    <button type="button" onClick={() => openDelete(u)}
                      className="flex-1 min-w-[90px] text-xs text-red-700 border border-red-200 bg-red-50 px-3 py-2 rounded-lg font-semibold hover:bg-red-100 flex items-center justify-center gap-1">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="bg-muted/50 text-left">
              <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">ID</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Faculty / Dept</th>
              {tab === "lecturers" && (
                <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Courses</th>
              )}
              <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[180px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => {
              const courseCount = u.role === "lecturer" ? lecturerCourseCount(u.id) : 0;
              return (
              <tr key={u.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {u.avatar ? (
                      <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover border border-border flex-shrink-0" />
                    ) : (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${roleBadge(u.role)}`}>
                        {userInitials(u.name)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                      <p className="text-[11px] font-mono text-accent">@{u.username}</p>
                      <p className="text-[11px] text-muted-foreground font-mono truncate">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{u.matricNo || u.staffId || "—"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{u.phone || "—"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  <p>{u.faculty || "—"}</p>
                  <p className="text-[11px]">{u.department || "—"}</p>
                </td>
                {tab === "lecturers" && (
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {courseCount > 0 ? (
                      <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-medium">{courseCount}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                )}
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <button type="button" onClick={() => setViewingProfile(u)}
                      className="text-xs text-muted-foreground border border-border px-2 py-1 rounded font-semibold hover:bg-muted/50">
                      View
                    </button>
                    <button type="button" onClick={() => openEdit(u)}
                      className="text-xs text-accent border border-accent/30 px-2 py-1 rounded font-semibold hover:bg-accent/5 flex items-center gap-1">
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    {u.role === "lecturer" || u.role === "dean" ? (
                      <button type="button" onClick={() => openDelete(u)}
                        className="text-xs text-red-700 border border-red-200 bg-red-50 px-2 py-1 rounded font-semibold hover:bg-red-100 flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-card border border-border rounded-xl p-5 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold font-[Outfit] mb-1">Edit {editing.role}</h3>
            <p className="text-xs text-muted-foreground mb-4">{editing.name}</p>
            <form onSubmit={handleEditSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-semibold block mb-1">Full Name</label>
                  <input required value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">Username</label>
                  <input required value={editForm.username} onChange={e => setEditForm(p => ({ ...p, username: e.target.value.toLowerCase() }))}
                    className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">Email</label>
                  <input required type="email" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">Faculty</label>
                  <select value={editForm.faculty} onChange={e => setEditForm(p => ({ ...p, faculty: e.target.value, department: "" }))}
                    className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent">
                    <option value="">—</option>
                    {FACULTIES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">Department</label>
                  <select value={editForm.department} onChange={e => setEditForm(p => ({ ...p, department: e.target.value }))}
                    className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent">
                    <option value="">—</option>
                    {(editForm.faculty ? getDepartmentsByFaculty(editForm.faculty) : DEPARTMENTS).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">Phone</label>
                  <input value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" placeholder="Phone number" />
                </div>
                {editing.role === "student" && (
                  <>
                    <div>
                      <label className="text-xs font-semibold block mb-1">Matric No</label>
                      <input value={editForm.matricNo} onChange={e => setEditForm(p => ({ ...p, matricNo: e.target.value }))}
                        className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold block mb-1">Level</label>
                      <select value={editForm.level} onChange={e => setEditForm(p => ({ ...p, level: e.target.value }))}
                        className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent">
                        <option value="">—</option>
                        {ACADEMIC_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                  </>
                )}
                {editing.role === "lecturer" && (
                  <div>
                    <label className="text-xs font-semibold block mb-1">Staff ID</label>
                    <input value={editForm.staffId} onChange={e => setEditForm(p => ({ ...p, staffId: e.target.value }))}
                      className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent" />
                  </div>
                )}
              </div>
              {editError && <p className="text-xs text-destructive">{editError}</p>}
              <div className="flex gap-2 pt-2">
                <button type="submit" className="text-sm bg-accent text-white px-4 py-2 rounded-lg font-semibold hover:bg-accent/90">Save Changes</button>
                <button type="button" onClick={() => setEditing(null)} className="text-sm border border-border px-4 py-2 rounded-lg font-semibold hover:bg-muted/50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !deleteLoading && setDeleting(null)}>
          <div className="bg-card border border-border rounded-xl p-5 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 border border-red-200 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-700" />
              </div>
              <div>
                <h3 className="text-base font-bold font-[Outfit] text-foreground">Delete lecturer?</h3>
                <p className="text-sm text-muted-foreground mt-1">{deleting.name}</p>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{deleting.staffId || deleting.username}</p>
              </div>
            </div>
            {lecturerCourseCount(deleting.id) > 0 && (
              <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                This lecturer is assigned to {lecturerCourseCount(deleting.id)} course(s). Those courses will be set to <strong>Unassigned</strong>.
              </p>
            )}
            <p className="text-xs text-muted-foreground mb-4">
              This permanently removes the lecturer account. They will no longer be able to sign in. This cannot be undone.
            </p>
            {deleteError && <p className="text-xs text-destructive mb-3">{deleteError}</p>}
            <div className="flex flex-col-reverse sm:flex-row gap-2">
              <button type="button" disabled={deleteLoading} onClick={() => setDeleting(null)}
                className="flex-1 text-sm border border-border px-4 py-2 rounded-lg font-semibold hover:bg-muted/50 disabled:opacity-50">
                Cancel
              </button>
              <button type="button" disabled={deleteLoading} onClick={handleDeleteConfirm}
                className="flex-1 text-sm bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50">
                {deleteLoading ? "Deleting…" : "Delete Lecturer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingProfile && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewingProfile(null)}>
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-4 mb-5">
              {viewingProfile.avatar ? (
                <img src={viewingProfile.avatar} alt={viewingProfile.name} className="w-16 h-16 rounded-full object-cover border-2 border-border flex-shrink-0" />
              ) : (
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0 ${roleBadge(viewingProfile.role)}`}>
                  {userInitials(viewingProfile.name)}
                </div>
              )}
              <div className="min-w-0">
                <h3 className="text-lg font-bold font-[Outfit] text-foreground truncate">{viewingProfile.name}</h3>
                <p className="text-sm font-mono text-accent">@{viewingProfile.username}</p>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize mt-1 inline-block ${roleBadge(viewingProfile.role)}`}>
                  {viewingProfile.role}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-muted/30 rounded-lg px-4 py-3 border border-border">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Email</span>
                <p className="text-sm font-mono text-foreground">{viewingProfile.email}</p>
              </div>

              {viewingProfile.phone && (
                <div className="bg-muted/30 rounded-lg px-4 py-3 border border-border">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Phone</span>
                  <p className="text-sm text-foreground">{viewingProfile.phone}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {viewingProfile.matricNo && (
                  <div className="bg-muted/30 rounded-lg px-4 py-3 border border-border">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Matric No</span>
                    <p className="text-sm font-mono text-foreground">{viewingProfile.matricNo}</p>
                  </div>
                )}
                {viewingProfile.staffId && (
                  <div className="bg-muted/30 rounded-lg px-4 py-3 border border-border">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Staff ID</span>
                    <p className="text-sm font-mono text-foreground">{viewingProfile.staffId}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/30 rounded-lg px-4 py-3 border border-border">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Faculty</span>
                  <p className="text-sm text-foreground">{viewingProfile.faculty || "—"}</p>
                </div>
                <div className="bg-muted/30 rounded-lg px-4 py-3 border border-border">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Department</span>
                  <p className="text-sm text-foreground">{viewingProfile.department || "—"}</p>
                </div>
              </div>

              {viewingProfile.level && (
                <div className="bg-muted/30 rounded-lg px-4 py-3 border border-border">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Level</span>
                  <p className="text-sm text-foreground">Level {viewingProfile.level}</p>
                </div>
              )}

              {viewingProfile.role === "lecturer" && (
                <div className="bg-muted/30 rounded-lg px-4 py-3 border border-border">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Assigned Courses</span>
                  <p className="text-sm text-foreground">{lecturerCourseCount(viewingProfile.id)} course(s)</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-5">
              <button type="button" onClick={() => { setViewingProfile(null); openEdit(viewingProfile); }}
                className="flex-1 text-sm bg-accent text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-accent/90 flex items-center justify-center gap-1.5">
                <Edit2 className="w-3.5 h-3.5" /> Edit Profile
              </button>
              <button type="button" onClick={() => setViewingProfile(null)}
                className="text-sm border border-border px-4 py-2.5 rounded-lg font-semibold hover:bg-muted/50">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminDepartments() {
  const { departments, courses, allUsers } = useAppData();

  return (
    <div className="space-y-6">
      {FACULTY_STRUCTURE.map(f => {
        const facultyDepts = departments.filter(d => d.faculty === f.faculty);
        return (
          <div key={f.faculty} className="bg-card rounded-lg border border-border p-5">
            <SectionHeader title={f.faculty} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {facultyDepts.map(d => {
                const deptCourses = courses.filter(c => c.department === d.name).length;
                const deptStudents = allUsers.filter(u => u.role === "student" && u.department === d.name).length;
                const deptLecturers = allUsers.filter(u => u.role === "lecturer" && u.department === d.name).length;
                return (
                  <div key={d.id} className="border border-border rounded-lg p-4 hover:border-accent/40 transition-colors">
                    <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center mb-2">
                      <Building2 className="w-4 h-4 text-accent" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">{d.name}</h3>
                    <div className="flex gap-3 text-xs mt-2 text-muted-foreground">
                      <span>{deptCourses} courses</span>
                      <span>{deptStudents} students</span>
                      <span>{deptLecturers} lecturers</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AdminCourses() {
  const { courses, createCourse, faculties, createFaculty, removeFaculty, editFaculty } = useAppData();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: "", title: "", units: "3", department: "", level: "100", semester: "1" });
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);
  const [showManage, setShowManage] = useState(false);

  const grouped = useMemo(() => {
    const map: Record<string, typeof courses> = {};
    FACULTY_STRUCTURE.forEach(f => { map[f.faculty] = []; });
    faculties.forEach(f => { if (!map[f.name]) map[f.name] = []; });
    courses.forEach(c => {
      const faculty = c.faculty || getFacultyForDepartment(c.department);
      if (map[faculty]) map[faculty].push(c);
      else map[faculty] = [c];
    });
    return map;
  }, [courses, faculties]);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.department) return;
    createCourse({
      code: form.code.toUpperCase(), title: form.title, units: Number(form.units),
      department: form.department,
      faculty: getFacultyForDepartment(form.department),
      lecturer: "Unassigned", level: form.level, semester: Number(form.semester),
      subjects: [],
    });
    setShowForm(false);
    setForm({ code: "", title: "", units: "3", department: "", level: "100", semester: "1" });
  }

  const allFaculties = useMemo(() => {
    const seen = new Set<string>();
    const list: { name: string; departments: string[]; isBuiltin: boolean }[] = [];
    FACULTY_STRUCTURE.forEach(f => {
      seen.add(f.faculty);
      list.push({ name: f.faculty, departments: f.departments, isBuiltin: true });
    });
    faculties.forEach(f => {
      if (!seen.has(f.name)) {
        seen.add(f.name);
        list.push({ name: f.name, departments: f.departments, isBuiltin: false });
      }
    });
    return list;
  }, [faculties]);

  if (showManage) {
    return <FacultyManager
      allFaculties={allFaculties}
      grouped={grouped}
      faculties={faculties}
      createFaculty={createFaculty}
      editFaculty={editFaculty}
      removeFaculty={removeFaculty}
      onSelectFaculty={(name) => { setSelectedFaculty(name); setShowManage(false); }}
      onBack={() => setShowManage(false)}
    />;
  }

  if (selectedFaculty) {
    const facultyCourses = grouped[selectedFaculty] || [];
    const isCustom = !FACULTY_STRUCTURE.some(f => f.faculty === selectedFaculty);
    const allDepts = allFaculties.find(f => f.name === selectedFaculty)?.departments || [];
    return (
      <div className="space-y-4">
        <button onClick={() => { setSelectedFaculty(null); setShowForm(false); }}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronDown className="w-4 h-4 rotate-90" /> Back to Faculty Overview
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold font-[Outfit] text-foreground">{selectedFaculty}</h2>
            <span className="text-xs bg-accent/10 text-accent px-2.5 py-1 rounded font-semibold">{facultyCourses.length} courses</span>
            {isCustom && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">Custom</span>}
          </div>
          <div className="flex items-center gap-2">
            {isCustom && (
              <button onClick={() => { setSelectedFaculty(null); setShowManage(true); }}
                className="flex items-center gap-1.5 text-xs border border-border px-3 py-1.5 rounded-lg font-semibold hover:bg-muted/50 transition-colors">
                <Building2 className="w-3.5 h-3.5" /> Edit Faculty
              </button>
            )}
            <button onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1.5 text-xs bg-accent text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-accent/90 transition-colors">
              <Plus className="w-3.5 h-3.5" /> {showForm ? "Cancel" : "Create Course"}
            </button>
          </div>
        </div>
        {showForm && (
          <form onSubmit={handleAdd} className="bg-card border border-border rounded-lg p-4 grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Code</label>
              <input required value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))}
                className="w-full bg-input-background border border-border rounded px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-accent" placeholder="CSC401" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-foreground block mb-1">Title</label>
              <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className="w-full bg-input-background border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Department</label>
              <select value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                className="w-full bg-input-background border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-accent">
                <option value="">Select...</option>
                {allDepts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="flex gap-2 items-end">
              <div className="w-16">
                <label className="text-xs font-semibold text-foreground block mb-1">Units</label>
                <input type="number" min={1} max={6} value={form.units} onChange={e => setForm(p => ({ ...p, units: e.target.value }))}
                  className="w-full bg-input-background border border-border rounded px-3 py-1.5 text-sm text-center focus:outline-none focus:border-accent" />
              </div>
              <button type="submit" className="text-xs bg-accent text-white px-4 py-1.5 rounded-lg font-semibold hover:bg-accent/90">Add</button>
            </div>
          </form>
        )}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="bg-muted/50 text-left">
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Code</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Title</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dept.</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Level</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Units</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lecturer</th>
                </tr>
              </thead>
              <tbody>
                {facultyCourses.map(c => (
                  <tr key={c.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-sm font-semibold text-foreground">{c.code}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{c.title}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.department}</td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{c.level}</td>
                    <td className="px-4 py-3 text-xs font-mono text-center text-foreground">{c.units}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.lecturer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader title="Course Management" />
        <div className="flex items-center gap-2">
          <button onClick={() => setShowManage(true)}
            className="flex items-center gap-1.5 text-xs border border-border px-3 py-1.5 rounded-lg font-semibold hover:bg-muted/50 transition-colors">
            <Building2 className="w-3.5 h-3.5" /> Manage Faculties
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 text-xs bg-accent text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-accent/90 transition-colors">
            <Plus className="w-3.5 h-3.5" /> {showForm ? "Cancel" : "Create Course"}
          </button>
        </div>
      </div>
      {showForm && (
        <form onSubmit={handleAdd} className="bg-card border border-border rounded-lg p-4 grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">Code</label>
            <input required value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))}
              className="w-full bg-input-background border border-border rounded px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-accent" placeholder="CSC401" />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-semibold text-foreground block mb-1">Title</label>
            <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="w-full bg-input-background border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-accent" />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">Department</label>
            <select value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
              className="w-full bg-input-background border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-accent">
              <option value="">Select...</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex gap-2 items-end">
            <div className="w-16">
              <label className="text-xs font-semibold text-foreground block mb-1">Units</label>
              <input type="number" min={1} max={6} value={form.units} onChange={e => setForm(p => ({ ...p, units: e.target.value }))}
                className="w-full bg-input-background border border-border rounded px-3 py-1.5 text-sm text-center focus:outline-none focus:border-accent" />
            </div>
            <button type="submit" className="text-xs bg-accent text-white px-4 py-1.5 rounded-lg font-semibold hover:bg-accent/90">Add</button>
          </div>
        </form>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allFaculties.map(f => {
          const fc = grouped[f.name] || [];
          const deptSet = new Set(fc.map(c => c.department));
          return (
            <button key={f.name} type="button" onClick={() => setSelectedFaculty(f.name)}
              className="bg-card rounded-lg border border-border p-5 text-left hover:border-accent/50 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <BookMarked className="w-5 h-5 text-accent" />
                  </div>
                  {!f.isBuiltin && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">Custom</span>}
                </div>
                <ChevronDown className="w-5 h-5 -rotate-90 text-muted-foreground group-hover:text-accent transition-colors" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">{f.name}</h3>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                <span className="font-semibold text-accent">{fc.length} courses</span>
                <span>{f.departments.length} departments</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {f.departments.slice(0, 4).map(d => (
                  <span key={d} className="text-[10px] bg-muted/50 text-muted-foreground px-1.5 py-0.5 rounded">{d}</span>
                ))}
                {f.departments.length > 4 && <span className="text-[10px] text-muted-foreground">+{f.departments.length - 4} more</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FacultyManager({ allFaculties, grouped, faculties, createFaculty, editFaculty, removeFaculty, onSelectFaculty, onBack }: {
  allFaculties: { name: string; departments: string[]; isBuiltin: boolean }[];
  grouped: Record<string, any[]>;
  faculties: any[];
  createFaculty: (name: string, departments: string[], dean?: string) => any;
  editFaculty: (id: string, patch: any) => any;
  removeFaculty: (id: string) => boolean;
  onSelectFaculty: (name: string) => void;
  onBack: () => void;
}) {
  const [newName, setNewName] = useState("");
  const [newDepts, setNewDepts] = useState("");
  const [newDean, setNewDean] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDepts, setEditDepts] = useState("");

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const name = newName.trim();
    if (!name) { setError("Faculty name is required."); return; }
    const depts = newDepts.split(",").map(d => d.trim()).filter(Boolean);
    if (depts.length === 0) { setError("Enter at least one department."); return; }
    try {
      createFaculty(name, depts, newDean.trim() || undefined);
      setNewName(""); setNewDepts(""); setNewDean("");
    } catch (err: any) {
      setError(err.message);
    }
  }

  function startEdit(f: typeof faculties[0]) {
    setEditingId(f.id);
    setEditName(f.name);
    setEditDepts(f.departments.join(", "));
  }

  function saveEdit(id: string) {
    const name = editName.trim();
    if (!name) return;
    const depts = editDepts.split(",").map(d => d.trim()).filter(Boolean);
    editFaculty(id, { name, departments: depts });
    setEditingId(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronDown className="w-4 h-4 rotate-90" /> Back to Course Management
        </button>
      </div>
      <SectionHeader title="Manage Faculties" />
      <form onSubmit={handleCreate} className="bg-card border border-border rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Add New Faculty</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">Faculty Name</label>
            <input value={newName} onChange={e => setNewName(e.target.value)}
              className="w-full bg-input-background border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-accent" placeholder="e.g. Engineering" />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">Departments (comma-separated)</label>
            <input value={newDepts} onChange={e => setNewDepts(e.target.value)}
              className="w-full bg-input-background border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-accent" placeholder="Civil Eng, Electrical Eng, Mechanical Eng" />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">Dean (optional)</label>
            <input value={newDean} onChange={e => setNewDean(e.target.value)}
              className="w-full bg-input-background border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-accent" placeholder="Dean name" />
          </div>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button type="submit" className="text-xs bg-accent text-white px-4 py-1.5 rounded-lg font-semibold hover:bg-accent/90 transition-colors">
          <Plus className="w-3.5 h-3.5 inline mr-1" /> Add Faculty
        </button>
      </form>
      <div className="space-y-3">
        {allFaculties.map(f => {
          const fc = grouped[f.name] || [];
          const stored = faculties.find(sf => sf.name === f.name);
          return (
            <div key={f.name} className="bg-card rounded-lg border border-border overflow-hidden">
              {editingId === stored?.id ? (
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1">Name</label>
                      <input value={editName} onChange={e => setEditName(e.target.value)}
                        className="w-full bg-input-background border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-accent" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1">Departments (comma-separated)</label>
                      <input value={editDepts} onChange={e => setEditDepts(e.target.value)}
                        className="w-full bg-input-background border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-accent" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(stored!.id)}
                      className="text-xs bg-accent text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-accent/90">Save</button>
                    <button onClick={() => setEditingId(null)}
                      className="text-xs border border-border px-3 py-1.5 rounded-lg font-semibold hover:bg-muted/50">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-accent" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{f.name}</h3>
                        <p className="text-xs text-muted-foreground">{f.departments.length} departments · {fc.length} courses</p>
                      </div>
                      {f.isBuiltin && <span className="text-[10px] bg-muted/50 text-muted-foreground px-1.5 py-0.5 rounded font-semibold">System</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => onSelectFaculty(f.name)}
                        className="text-xs border border-border px-2.5 py-1 rounded-lg hover:bg-muted/50 transition-colors">
                        View Courses
                      </button>
                      {!f.isBuiltin && stored && (
                        <>
                          <button onClick={() => startEdit(stored)}
                            className="flex items-center gap-1 text-xs border border-border px-2.5 py-1 rounded-lg hover:bg-muted/50 transition-colors">
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                          <button onClick={() => { if (confirm(`Delete "${f.name}"?`)) removeFaculty(stored.id); }}
                            className="flex items-center gap-1 text-xs text-red-600 border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors">
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="px-5 py-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Departments</p>
                    <div className="flex flex-wrap gap-1.5">
                      {f.departments.map(d => (
                        <span key={d} className="text-xs bg-muted/50 text-muted-foreground px-2 py-1 rounded">{d}</span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LecturersByCourse() {
  const { courses, allUsers } = useAppData();
  const lecturers = allUsers.filter(u => u.role === "lecturer");

  return (
    <div className="space-y-4">
      <SectionHeader title="Lecturers by Course Assignment" />
      {lecturers.map(lecturer => {
        const assignedCourses = courses.filter(c => c.lecturerId === lecturer.id || c.lecturer === lecturer.name);
        return (
          <div key={lecturer.id} className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border bg-muted/10">
              <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-accent" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{lecturer.name}</h3>
                <p className="text-xs text-muted-foreground">{lecturer.staffId} · {lecturer.department} · {lecturer.faculty}</p>
              </div>
              <span className="ml-auto text-xs bg-accent/10 text-accent px-2.5 py-1 rounded font-semibold">{assignedCourses.length} courses</span>
            </div>
            {assignedCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
                {assignedCourses.map(c => (
                  <div key={c.id} className="border border-border rounded-lg p-3 hover:border-accent/40 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-bold text-foreground">{c.code}</span>
                      <span className="text-[10px] bg-muted/50 text-muted-foreground px-1.5 py-0.5 rounded font-mono">{c.level}</span>
                    </div>
                    <p className="text-sm text-foreground">{c.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{c.department} · {c.semester === 1 ? "1st" : "2nd"} Sem · {c.units} {(c.units as number) > 1 ? "units" : "unit"}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No courses assigned yet.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AdminAssignments() {
  const { courses, allUsers, assignLecturer } = useAppData();
  const lecturers = allUsers.filter(u => u.role === "lecturer");
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState<Record<string, string>>({});

  function handleSave() {
    Object.entries(pending).forEach(([courseId, lecturerId]) => {
      const lecturer = lecturers.find(l => l.id === lecturerId);
      assignLecturer(courseId, lecturerId, lecturer?.name || "Unassigned");
    });
    setPending({});
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="bg-card rounded-lg border border-border p-5">
      <SectionHeader title="Assign Lecturers to Courses" />
      <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] mb-4">
        <thead>
          <tr className="bg-muted/50 text-left">
            <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Course</th>
            <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Title</th>
            <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assigned Lecturer</th>
          </tr>
        </thead>
        <tbody>
          {courses.map(c => {
            const assignedId = pending[c.id] ?? c.lecturerId ?? "";
            return (
              <tr key={c.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-mono text-sm font-semibold text-foreground">{c.code}</td>
                <td className="px-4 py-3 text-sm text-foreground">{c.title}</td>
                <td className="px-4 py-3">
                  <select value={assignedId} onChange={e => setPending(p => ({ ...p, [c.id]: e.target.value }))}
                    className="bg-input-background border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-accent w-52 transition-colors">
                    <option value="">Unassigned</option>
                    {lecturers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
        {saved && <div className="flex items-center gap-1.5 text-green-600 text-sm"><CheckCircle className="w-4 h-4" /> Assignments saved</div>}
        <button onClick={handleSave} disabled={Object.keys(pending).length === 0}
          className="flex items-center gap-2 bg-accent text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50">
          <Check className="w-4 h-4" /> Save Assignments
        </button>
      </div>
    </div>
  );
}

function AdminApprovals() {
  const { registrations, approveRegistration, rejectRegistration } = useAppData();
  const pending = registrations.filter(r => r.status === "pending" && r.submittedToAdmin);
  const processed = registrations.filter(r => r.status === "approved" || r.status === "rejected");

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border border-border p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-lg font-bold font-[Outfit] text-foreground">Pending Approvals</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded font-semibold">{pending.length} pending</span>
            <ExportButton
              compact
              options={{
                title: "Course Registration Records",
                filename: "registrations",
                columns: REGISTRATION_EXPORT_COLUMNS,
                rows: registrationExportRows(registrations),
              }}
            />
          </div>
        </div>
        {pending.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">All registrations processed.</p>}
        <div className="space-y-2">
          {pending.map(r => (
            <div key={r.id} className="flex items-center justify-between py-3 px-4 rounded-lg bg-amber-50 border border-amber-200">
              <div>
                <p className="text-sm font-semibold text-foreground">{r.studentName} <span className="font-mono text-xs text-muted-foreground">({r.matricNo})</span></p>
                <p className="text-xs text-muted-foreground font-mono">{r.courseCode} — {r.courseTitle}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Lecturer: {r.lecturerName} · Fee: {formatCourseFee(r.courseFee)}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Payment:{" "}
                  <span className={`px-1.5 py-0.5 rounded text-[10px] capitalize font-semibold ${paymentBadge(r.paymentStatus)}`}>
                    {r.paymentStatus}
                  </span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Subjects: {r.subjects.join(", ")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Requested: {new Date(r.registeredAt).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => approveRegistration(r.id)} className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg font-semibold hover:bg-green-100 transition-colors">
                  <CheckCircle className="w-3.5 h-3.5" /> Approve
                </button>
                <button onClick={() => rejectRegistration(r.id)} className="flex items-center gap-1 text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg font-semibold hover:bg-red-100 transition-colors">
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-5">
        <SectionHeader title="Processed Registrations" />
        <div className="space-y-2">
          {processed.map(r => (
            <div key={r.id} className={`flex items-center justify-between py-2.5 px-4 rounded-lg border ${r.status === "approved" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
              <div>
                <p className="text-sm font-semibold text-foreground">{r.studentName}</p>
                <p className="text-xs text-muted-foreground font-mono">{r.courseCode} — {r.courseTitle}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{r.lecturerName} · {formatCourseFee(r.courseFee)} · {r.paymentStatus}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
              <span className={`text-xs px-2 py-0.5 rounded font-semibold capitalize ${r.status === "approved" ? "text-green-700" : "text-red-700"}`}>{r.status}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded capitalize ${paymentBadge(r.paymentStatus)}`}>{r.paymentStatus}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminAnalytics() {
  const { adminStats, passFailData, gpaTrend, enrollData, gradeDistribution } = useAppData();
  const atRisk = Math.max(0, Math.round(adminStats.totalStudents * 0.08));
  const firstClass = Math.max(0, Math.round(adminStats.totalStudents * 0.12));
  const failCourses = [...passFailData].sort((a, b) => b.fail - a.fail).slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Overall Pass Rate" value={`${adminStats.passRate}%`} icon={CheckCircle} accent="bg-green-600" />
        <StatCard label="Average GPA" value={adminStats.avgGpa.toFixed(2)} icon={TrendingUp} />
        <StatCard label="Students at Risk" value={atRisk} sub="GPA below 2.0" icon={AlertCircle} />
        <StatCard label="First Class" value={firstClass} sub="CGPA 4.5+" icon={Award} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border border-border p-5">
          <SectionHeader title="Pass / Fail Rate by Course" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={passFailData} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e9f4" />
              <XAxis dataKey="course" tick={{ fontSize: 10, fill: "#5b6e8a", fontFamily: "JetBrains Mono" }} />
              <YAxis tick={{ fontSize: 10, fill: "#5b6e8a" }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="pass" name="Pass %" fill={CHART_WINE} radius={[3, 3, 0, 0]} />
              <Bar dataKey="fail" name="Fail %" fill="#9b1c31" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <SectionHeader title="Average GPA Trend" />
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={gpaTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e9f4" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#5b6e8a" }} />
              <YAxis domain={[2.5, 4.5]} tick={{ fontSize: 10, fill: "#5b6e8a" }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Line type="monotone" dataKey="avgGPA" name="Avg. GPA" stroke={CHART_WINE} strokeWidth={2.5} dot={{ r: 4, fill: CHART_WINE }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <SectionHeader title="Enrollment by Faculty" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={enrollData} layout="vertical" barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e9f4" />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#5b6e8a" }} />
              <YAxis dataKey="faculty" type="category" width={80} tick={{ fontSize: 10, fill: "#5b6e8a" }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="students" fill={CHART_GOLD} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <SectionHeader title="Grade Distribution" />
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="55%" height={220}>
              <PieChart>
                <Pie data={gradeDistribution} dataKey="value" cx="50%" cy="50%" innerRadius={55} outerRadius={88} paddingAngle={3}>
                  {gradeDistribution.map(entry => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 flex-1">
              {gradeDistribution.map(d => (
                <div key={d.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                      <span className="text-xs text-muted-foreground">{d.name}</span>
                    </div>
                    <span className="text-xs font-bold font-mono text-foreground">{d.value}%</span>
                  </div>
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${d.value}%`, background: d.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold font-[Outfit] text-foreground">Management Report Summary</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "System Overview", items: [`${adminStats.totalStudents} active students`, `${adminStats.totalLecturers} lecturers on staff`, `${adminStats.activeCourses} courses running`] },
            { title: "Courses with Highest Failure Rate", items: failCourses.length ? failCourses.map(c => `${c.course} — ${c.fail}% failure`) : ["No score data yet"] },
            { title: "Recommended Actions", items: adminStats.pendingApprovals > 0 ? [`Review ${adminStats.pendingApprovals} pending registration(s)`, "Follow up on score submissions", "Monitor at-risk students"] : ["All registrations processed", "Encourage lecturers to submit scores", "Review department enrollment"] },
          ].map(section => (
            <div key={section.title} className="bg-muted/30 rounded-lg p-4 border border-border">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">{section.title}</h3>
              <ul className="space-y-2">
                {section.items.map(item => (
                  <li key={item} className="text-xs text-muted-foreground flex items-start gap-2">
                    <ChevronRight className="w-3 h-3 text-accent flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminDeanManagement() {
  const { allUsers, updateUser, deleteLecturer, refresh } = useAppData();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", username: "", faculty: "" });
  const [editing, setEditing] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", username: "", faculty: "" });
  const [deleting, setDeleting] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const deans = allUsers.filter(u => u.role === "dean");

  const filtered = search
    ? deans.filter(d =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.email.toLowerCase().includes(search.toLowerCase()) ||
        d.username.toLowerCase().includes(search.toLowerCase()) ||
        (d.faculty || "").toLowerCase().includes(search.toLowerCase())
      )
    : deans;

  const facultyOptions = FACULTY_STRUCTURE.map(f => f.faculty);

  function resetForm() {
    setForm({ name: "", email: "", username: "", faculty: "" });
    setShowForm(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!form.name.trim() || !form.email.trim() || !form.username.trim() || !form.faculty) {
      setMsg({ type: "err", text: "All fields are required." });
      return;
    }
    const exists = allUsers.find(u => u.username === form.username.trim() || u.email === form.email.trim());
    if (exists) {
      setMsg({ type: "err", text: `User "${form.username}" already exists.` });
      return;
    }
    const { preregisterUser } = await import("./lib/auth");
    const result = await preregisterUser({
      name: form.name.trim(),
      email: form.email.trim(),
      username: form.username.trim(),
      role: "dean",
      faculty: form.faculty,
    });
    if (result.success) {
      setMsg({ type: "ok", text: `Dean "${form.name}" created for ${form.faculty}.` });
      resetForm();
      refresh();
    } else {
      setMsg({ type: "err", text: result.error || "Failed to create dean." });
    }
  }

  function openEdit(d: User) {
    setEditing(d);
    setEditForm({ name: d.name, email: d.email, username: d.username, faculty: d.faculty || "" });
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setMsg(null);
    const result = await updateUser(editing.id, {
      name: editForm.name,
      email: editForm.email,
      username: editForm.username,
      faculty: editForm.faculty,
    });
    if (result.success) {
      setMsg({ type: "ok", text: `Dean "${editForm.name}" updated.` });
      setEditing(null);
      refresh();
    } else {
      setMsg({ type: "err", text: result.error || "Update failed." });
    }
  }

  function openDelete(d: User) {
    setDeleting(d);
  }

  async function handleDeleteConfirm() {
    if (!deleting) return;
    setDeleteLoading(true);
    setMsg(null);
    const result = await deleteLecturer(deleting.id);
    setDeleteLoading(false);
    if (result.success) {
      setMsg({ type: "ok", text: `Dean "${deleting.name}" removed.` });
      setDeleting(null);
      refresh();
    } else {
      setMsg({ type: "err", text: result.error || "Delete failed." });
    }
  }

  return (
    <div className="space-y-4">
      {msg && (
        <div className={`flex items-center gap-2 p-3 rounded-lg border text-sm ${msg.type === "ok" ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-800 border-red-200"}`}>
          {msg.type === "ok" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {msg.text}
        </div>
      )}

      <div className="bg-card rounded-lg border border-border p-5">
        <SectionHeader title="Dean Management"
          action={
            <button onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1.5 text-xs bg-accent text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-accent/90">
              <Plus className="w-3.5 h-3.5" /> {showForm ? "Cancel" : "Add Dean"}
            </button>
          }
        />

        {showForm && (
          <form onSubmit={handleCreate} className="mb-5 bg-muted/30 border border-border rounded-lg p-4 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Full Name</label>
              <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full bg-input-background border border-border rounded px-3 py-1.5 text-sm" placeholder="e.g. Dr. Smith" />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Email</label>
              <input required type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="w-full bg-input-background border border-border rounded px-3 py-1.5 text-sm" placeholder="dean@univ.edu" />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Username</label>
              <input required value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                className="w-full bg-input-background border border-border rounded px-3 py-1.5 text-sm" placeholder="dean_username" />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Faculty</label>
              <select required value={form.faculty} onChange={e => setForm(p => ({ ...p, faculty: e.target.value }))}
                className="w-full bg-input-background border border-border rounded px-3 py-1.5 text-sm">
                <option value="">Select Faculty...</option>
                {facultyOptions.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <button type="submit" className="text-xs bg-accent text-white px-4 py-1.5 rounded-lg font-semibold hover:bg-accent/90">Create Dean</button>
          </form>
        )}

        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-input-background border border-border rounded-lg w-full focus:outline-none focus:border-accent"
              placeholder="Search deans..." />
          </div>
          <span className="text-xs text-muted-foreground">{filtered.length} dean{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No deans yet. Add one above.</p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="bg-muted/50 text-left">
                <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Username</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assigned Faculty</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => {
                const facultyDepts = FACULTY_STRUCTURE.find(f => f.faculty === d.faculty)?.departments || [];
                return (
                  <tr key={d.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-sm font-semibold text-foreground">{d.name}</td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">@{d.username}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{d.email}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        {d.faculty || "Not assigned"}
                      </span>
                      {facultyDepts.length > 0 && (
                        <p className="text-[10px] text-muted-foreground mt-1">{facultyDepts.length} departments</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(d)}
                          className="flex items-center gap-1 text-xs text-accent bg-accent/5 border border-accent/20 px-2.5 py-1 rounded-lg font-medium hover:bg-accent/10">
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                        <button onClick={() => openDelete(d)}
                          className="flex items-center gap-1 text-xs text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg font-medium hover:bg-red-100">
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-foreground mb-4">Edit Dean</h3>
            <form onSubmit={handleEditSave} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Name</label>
                <input required value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full bg-input-background border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Email</label>
                <input required value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full bg-input-background border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Username</label>
                <input required value={editForm.username} onChange={e => setEditForm(p => ({ ...p, username: e.target.value }))}
                  className="w-full bg-input-background border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Faculty</label>
                <select required value={editForm.faculty} onChange={e => setEditForm(p => ({ ...p, faculty: e.target.value }))}
                  className="w-full bg-input-background border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-accent">
                  <option value="">Select...</option>
                  {facultyOptions.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditing(null)}
                  className="text-xs text-muted-foreground px-4 py-1.5 rounded-lg border border-border hover:bg-muted/50">Cancel</button>
                <button type="submit" className="text-xs bg-accent text-white px-4 py-1.5 rounded-lg font-semibold hover:bg-accent/90">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleting && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDeleting(null)}>
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-foreground mb-2">Remove Dean?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to remove <strong>{deleting.name}</strong> as dean of <strong>{deleting.faculty || "N/A"}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleting(null)}
                className="text-xs text-muted-foreground px-4 py-1.5 rounded-lg border border-border hover:bg-muted/50">Cancel</button>
              <button onClick={handleDeleteConfirm} disabled={deleteLoading}
                className="flex items-center gap-1 text-xs bg-red-600 text-white px-4 py-1.5 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50">
                {deleteLoading ? "Removing..." : <><Trash2 className="w-3 h-3" /> Remove</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────

const VIEW_TITLES: Record<View, string> = {
  dashboard: "Dashboard",
  profile: "My Profile",
  registration: "Course Registration",
  results: "Academic Results",
  courses: "Manage Courses",
  students: "Students",
  scores: "Upload Scores",
  users: "User Management",
  departments: "Departments and Faculties",
  "course-mgmt": "Course Management",
  assignments: "Lecturer Assignments",
  approvals: "Registration Approvals",
  "result-reviews": "Result Reviews",
  "course-approvals": "Course Registration Review",
  "fee-payments": "Course Fee Verification",
  analytics: "Analytics and Reports",
  "dean-management": "Dean Management",
  "dean-overview": "Faculty Dashboard",
  "dean-courses": "Course Assignment",
  "dean-lecturers": "Lecturer Management",
  "dean-students": "Student Management",
  "dean-reviews": "Score Review",
  "dean-analytics": "Faculty Analytics",
  settings: "Account Settings",
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [cloudTick, setCloudTick] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await initAuth();
        initStore();
        const found = await restoreCloudSession();
        if (alive && found) setUser(found);
        if (isCloudEnabled()) void pullCloudStores();
      } catch (err) {
        console.error("Session restore failed:", err);
      } finally {
        if (alive) setSessionLoaded(true);
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!isCloudEnabled()) return;
    const unsub = subscribeAuthStateChange((event, hasSession) => {
      if (!hasSession && event === "SIGNED_OUT") {
        setUser(null);
        setView("dashboard");
        return;
      }
      if (!hasSession) return;
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setCloudTick(t => t + 1);
        setUser(prev => {
          const found = loadSessionUser();
          if (!found) return prev;
          if (!prev || prev.id === found.id) return found;
          return prev;
        });
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user || !isCloudEnabled()) return;
    const unsub = subscribeCloudRealtime(() => {
      setCloudTick(t => t + 1);
      setUser(prev => {
        const found = loadSessionUser();
        if (!found) return prev;
        if (!prev || prev.id === found.id) return found;
        return prev;
      });
    });
    return unsub;
  }, [user?.id]);

  useEffect(() => {
    function syncActiveUser() {
      setUser(prev => {
        const found = loadSessionUser();
        if (!found) return prev;
        if (!prev) return found;
        if (prev.id === found.id) return found;
        return prev;
      });
    }

    function onSessionCleared() {
      setUser(null);
      setView("dashboard");
    }

    const usersChangedHandler = () => syncActiveUser();
    const storageHandler = (event: StorageEvent) => {
      if (event.key === "wawuhub_users" || event.key === SESSION_KEY) {
        if (event.key === SESSION_KEY && event.newValue === null) {
          onSessionCleared();
          return;
        }
        syncActiveUser();
      }
    };

    window.addEventListener("wawuhub:users-changed", usersChangedHandler);
    window.addEventListener("wawuhub:session-cleared", onSessionCleared);
    window.addEventListener("storage", storageHandler);
    return () => {
      window.removeEventListener("wawuhub:users-changed", usersChangedHandler);
      window.removeEventListener("wawuhub:session-cleared", onSessionCleared);
      window.removeEventListener("storage", storageHandler);
    };
  }, []);

  function handleLogin(u: User) {
    setUser(u);
    setView("dashboard");
    saveSession(u);
  }

  function handleLogout() {
    setUser(null);
    setView("dashboard");
    void clearSession().catch(() => {});
  }

  function goHome() {
    setView("dashboard");
    setMobileNavOpen(false);
  }

  // Global search navigation listener
  useEffect(() => {
    function onNavigate(e: CustomEvent<{ view: View }>) {
      if (e.detail?.view) setView(e.detail.view);
    }
    window.addEventListener("wawuhub:navigate", onNavigate as EventListener);
    return () => window.removeEventListener("wawuhub:navigate", onNavigate as EventListener);
  }, []);

  if (!sessionLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Logo size="lg" />
          <span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage onLogin={handleLogin} />;

  function renderView() {
    if (!user) return null;
    if (user.role === "student") {
      if (view === "dashboard") return <StudentPortalFrame><StudentDashboard /></StudentPortalFrame>;
      if (view === "profile") return <StudentPortalFrame><StudentProfile /></StudentPortalFrame>;
      if (view === "registration") return <StudentPortalFrame><StudentRegistration /></StudentPortalFrame>;
      if (view === "results") return <StudentPortalFrame><StudentResults /></StudentPortalFrame>;
      if (view === "settings") return <StudentPortalFrame><AccountSettings user={user} /></StudentPortalFrame>;
    }
    if (user.role === "lecturer") {
      if (view === "dashboard") return <LecturerDashboard />;
      if (view === "courses") return <LecturerCourses />;
      if (view === "students") return <LecturerStudents />;
      if (view === "course-approvals") return <LecturerCourseApprovals />;
      if (view === "fee-payments") return <LecturerFeePayments />;
      if (view === "scores") return <LecturerScores />;
      if (view === "settings") return <AccountSettings user={user} />;
    }
    if (isRegistrarRole(user.role)) {
      if (view === "dashboard") return <AdminDashboard />;
      if (view === "users") return <AdminUsers />;
      if (view === "departments") return <AdminDepartments />;
      if (view === "course-mgmt") return <AdminCourses />;
      if (view === "lecturers-by-course") return <LecturersByCourse />;
      if (view === "assignments") return <AdminAssignments />;
      if (view === "approvals") return <AdminApprovals />;
      if (view === "result-reviews") return <AdminResultReviews />;
      if (view === "analytics") return <AdminAnalytics />;
      if (view === "dean-management") return <AdminDeanManagement />;
      if (view === "settings") return <AccountSettings user={user} />;
    }
    if (isDeanRole(user.role)) {
      if (view === "dashboard" || view === "dean-overview") return <DeanOverview />;
      if (view === "dean-students") return <DeanStudentManagement />;
      if (view === "dean-courses") return <DeanCourseAssignment />;
      if (view === "dean-lecturers") return <DeanLecturerManagement />;
      if (view === "dean-reviews") return <DeanScoreReview />;
      if (view === "dean-analytics") return <DeanAnalytics />;
      if (view === "settings") return <AccountSettings user={user} />;
    }
    return null;
  }

  return (
    <AppDataProvider key={cloudTick} user={user} onNavigate={setView}>
    <div className="flex h-screen bg-background overflow-hidden" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <Sidebar
        user={user}
        activeView={view}
        onNavigate={setView}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(c => !c)}
        onLogout={handleLogout}
        onHome={goHome}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar user={user} title={VIEW_TITLES[view]} onMenuToggle={() => setMobileNavOpen(true)} onCloudRefresh={() => setCloudTick(t => t + 1)} onLogout={handleLogout} onNavigate={setView} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 safe-bottom">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${view}-${cloudTick}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="portal-page"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
    </AppDataProvider>
  );
}
