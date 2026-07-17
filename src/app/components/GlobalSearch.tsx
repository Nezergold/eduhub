import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, BookOpen, Users, Building2, Award, FileText, ClipboardList, BarChart2, Settings, UserCheck, LayoutDashboard } from "lucide-react";
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandShortcut } from "./ui/command";
import { useAppData } from "../context/AppContext";
import { FACULTY_STRUCTURE, getFacultyForDepartment, isDeanRole, isRegistrarRole } from "../lib/types";
import type { View } from "../lib/types";

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  icon: typeof BookOpen;
  view: View;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { courses, departments, registrations, scores, allUsers, user } = useAppData();
  const isDean = isDeanRole(user?.role);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    const items: SearchResult[] = [];

    if (isDean) {
      const deanNavItems: { match: string; title: string; subtitle: string; view: View }[] = [
        { match: "dashboard", title: "Faculty Dashboard", subtitle: "Overview of your faculty", view: "dean-overview" },
        { match: "student", title: "Student Management", subtitle: "View and manage faculty students", view: "dean-students" },
        { match: "course", title: "Course Assignment", subtitle: "Assign courses to students", view: "dean-courses" },
        { match: "lecturer", title: "Lecturer Management", subtitle: "Assign lecturers to departments", view: "dean-lecturers" },
        { match: "analytic", title: "Faculty Analytics", subtitle: "View faculty statistics", view: "dean-analytics" },
        { match: "setting", title: "Account Settings", subtitle: "Manage your profile", view: "settings" },
      ];
      for (const nav of deanNavItems) {
        if (nav.match.includes(q) || q.includes(nav.match)) {
          items.push({
            id: `nav-${nav.view}`,
            title: nav.title,
            subtitle: nav.subtitle,
            category: "Quick Navigation",
            icon: LayoutDashboard,
            view: nav.view,
          });
        }
      }
    }

    for (const c of courses) {
      if (
        c.code.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.department.toLowerCase().includes(q) ||
        c.faculty.toLowerCase().includes(q) ||
        c.lecturer.toLowerCase().includes(q)
      ) {
        items.push({
          id: `course-${c.id}`,
          title: `${c.code} — ${c.title}`,
          subtitle: `${c.department} · ${c.faculty} · ${c.lecturer} · Level ${c.level}`,
          category: "Courses",
          icon: BookOpen,
          view: isDean ? "dean-courses" : "course-mgmt",
        });
      }
    }

    for (const d of departments) {
      if (
        d.name.toLowerCase().includes(q) ||
        d.faculty.toLowerCase().includes(q)
      ) {
        items.push({
          id: `dept-${d.id}`,
          title: d.name,
          subtitle: `Faculty: ${d.faculty}`,
          category: "Departments",
          icon: Building2,
          view: "departments",
        });
      }
    }

    for (const f of FACULTY_STRUCTURE) {
      if (f.faculty.toLowerCase().includes(q) || f.dean.toLowerCase().includes(q)) {
        items.push({
          id: `faculty-${f.id}`,
          title: f.faculty,
          subtitle: `Dean: ${f.dean} · ${f.departments.length} department(s)`,
          category: "Faculties",
          icon: Building2,
          view: "departments",
        });
      }
    }

    for (const u of allUsers) {
      if (
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.matricNo || "").toLowerCase().includes(q) ||
        (u.staffId || "").toLowerCase().includes(q) ||
        (u.department || "").toLowerCase().includes(q)
      ) {
        const userCategory = u.role === "student" ? "Students"
          : u.role === "lecturer" ? "Lecturers"
          : u.role === "dean" ? "Deans"
          : "Registrars";
        items.push({
          id: `user-${u.id}`,
          title: u.name,
          subtitle: `${u.username} · ${u.email} · ${u.role}${u.matricNo ? ` · ${u.matricNo}` : ""}${u.staffId ? ` · ${u.staffId}` : ""}${u.faculty ? ` · ${u.faculty}` : ""}`,
          category: userCategory,
          icon: Users,
          view: isDean && u.role === "lecturer" ? "dean-lecturers" : "users",
        });
      }
    }

    for (const r of registrations) {
      if (
        r.courseCode.toLowerCase().includes(q) ||
        r.courseTitle.toLowerCase().includes(q) ||
        r.studentName.toLowerCase().includes(q) ||
        r.matricNo.toLowerCase().includes(q)
      ) {
        items.push({
          id: `reg-${r.id}`,
          title: `${r.courseCode} — ${r.studentName}`,
          subtitle: `${r.matricNo} · ${r.status} · ${r.courseTitle}`,
          category: "Registrations",
          icon: ClipboardList,
          view: "approvals",
        });
      }
    }

    for (const s of scores) {
      if (
        s.courseCode.toLowerCase().includes(q) ||
        (s.courseTitle || "").toLowerCase().includes(q) ||
        s.studentName.toLowerCase().includes(q) ||
        s.matricNo.toLowerCase().includes(q)
      ) {
        items.push({
          id: `score-${s.studentId}-${s.courseCode}`,
          title: `${s.courseCode} — ${s.studentName}`,
          subtitle: `${s.matricNo} · Total: ${s.total} · Grade: ${s.grade} · ${s.published ? "Published" : "Draft"}`,
          category: "Scores",
          icon: Award,
          view: "result-reviews",
        });
      }
    }

    return items.slice(0, 30);
  }, [query, courses, departments, registrations, scores, allUsers]);

  const grouped = useMemo(() => {
    const map = new Map<string, SearchResult[]>();
    for (const r of results) {
      const list = map.get(r.category) || [];
      list.push(r);
      map.set(r.category, list);
    }
    return map;
  }, [results]);

  const handleSelect = useCallback((result: SearchResult) => {
    setOpen(false);
    // Navigate by dispatching a custom event that App.tsx listens for
    window.dispatchEvent(new CustomEvent("wawuhub:navigate", { detail: { view: result.view } }));
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-xs text-muted-foreground bg-input-background border border-border rounded-lg px-3 py-1.5 hover:border-accent/50 hover:text-foreground transition-colors"
        title="Search (Ctrl+K)"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden md:inline-flex items-center gap-0.5 text-[10px] text-muted-foreground/70 border border-border rounded px-1 py-0.5 font-mono">
          <span className="text-[9px]">Ctrl</span>
          <span>K</span>
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen} title="Global Search" description="Search courses, departments, users, registrations, and scores">
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Search courses, departments, users..."
        />
        <CommandList>
          <CommandEmpty>
            {query ? "No results found." : "Type to search across the entire system."}
          </CommandEmpty>
          {Array.from(grouped.entries()).map(([category, items]) => (
            <CommandGroup key={category} heading={category}>
              {items.map(item => (
                <CommandItem
                  key={item.id}
                  value={`${item.title} ${item.subtitle}`}
                  onSelect={() => handleSelect(item)}
                  className="cursor-pointer"
                >
                  <item.icon className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>
                  </div>
                  <CommandShortcut className="text-[10px] opacity-60">{item.view}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
