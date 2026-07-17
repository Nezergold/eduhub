import { useState } from "react";
import { UserPlus, CheckCircle } from "lucide-react";
import type { Role } from "../lib/types";
import { DEPARTMENT_NAMES as DEPARTMENTS, FACULTIES, ACADEMIC_LEVELS, getDepartmentsByFaculty } from "../lib/types";
import { preregisterUser } from "../lib/auth";
import { welcomeUser } from "../lib/store";

const EMPTY_FORM = {
  name: "",
  username: "",
  email: "",
  role: "student" as Role,
  faculty: "",
  department: "",
  level: "100",
  semester: "1",
};

interface AdminEnrollFormProps {
  onSuccess?: (credentials: { username: string; email: string; name: string; role: Role }) => void;
  compact?: boolean;
  embedded?: boolean;
}

export function AdminEnrollForm({ onSuccess, compact = false, embedded = false }: AdminEnrollFormProps) {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const deptOptions = form.faculty ? getDepartmentsByFaculty(form.faculty) : DEPARTMENTS;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSuccess("");
    if (!form.faculty) {
      setFormError("Select a faculty.");
      return;
    }
    if (form.role !== "dean" && !form.department) {
      setFormError("Select a department.");
      return;
    }
    if (!form.username.trim()) {
      setFormError("Username is required — this is what the user signs in with.");
      return;
    }
    setLoading(true);
    const result = await preregisterUser({
      name: form.name,
      username: form.username,
      email: form.email,
      role: form.role as "student" | "lecturer" | "dean",
      department: form.role === "dean" ? undefined : form.department,
      faculty: form.faculty,
      level: form.role === "student" ? form.level : undefined,
      semester: form.role === "student" ? Number(form.semester) : undefined,
    });
    setLoading(false);
    if (result.success && result.user) {
      welcomeUser(result.user);
      setSuccess(
        `${result.user.role === "dean" ? "Dean" : "Account"} created for ${result.user.name}. They can sign in with "${result.user.username}" or "${result.user.email}", then create their own personal password on first sign-in.`
      );
      onSuccess?.({
        username: result.user.username,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
      });
      setForm({ ...EMPTY_FORM });
    } else {
      setFormError(result.error || "Failed to create account.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className={embedded ? "space-y-4" : `bg-muted/30 border border-border rounded-xl p-4 ${compact ? "" : "p-5"}`}>
      {!embedded && (
        <>
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-bold text-foreground font-[Outfit]">Create Account</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Register a unique <strong>username</strong> and <strong>email</strong>. The user creates their own personal password on first sign-in — you will not know or set it.
          </p>
        </>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-semibold text-foreground block mb-1">Full Name</label>
          <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" placeholder="Adaeze Okonkwo" />
        </div>
        <div>
          <label className="text-xs font-semibold text-foreground block mb-1">Username <span className="text-accent">*</span></label>
          <input required value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value.toLowerCase() }))}
            className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent"
            placeholder="adaeze.ok" pattern="[a-z0-9._]{3,30}" title="3–30 chars: lowercase letters, numbers, dots, underscores" />
        </div>
        <div>
          <label className="text-xs font-semibold text-foreground block mb-1">Email</label>
          <input required type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" placeholder="user@email.com" />
        </div>
        <div>
          <label className="text-xs font-semibold text-foreground block mb-1">Role</label>
          <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as Role, department: e.target.value === "dean" ? "" : p.department }))}
            className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent">
            <option value="student">Student</option>
            <option value="lecturer">Lecturer</option>
            <option value="dean">Dean</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-foreground block mb-1">Faculty</label>
          <select required value={form.faculty} onChange={e => setForm(p => ({ ...p, faculty: e.target.value, department: "" }))}
            className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent">
            <option value="">Select faculty...</option>
            {FACULTIES.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        {form.role !== "dean" && (
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">Department</label>
            <select required value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
              className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent">
              <option value="">Select department...</option>
              {deptOptions.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        )}
        {form.role === "student" && (
          <>
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Level</label>
              <select value={form.level} onChange={e => setForm(p => ({ ...p, level: e.target.value }))}
                className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent">
                {ACADEMIC_LEVELS.map(l => <option key={l} value={l}>{l} Level</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Semester</label>
              <select value={form.semester} onChange={e => setForm(p => ({ ...p, semester: e.target.value }))}
                className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent">
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
              </select>
            </div>
          </>
        )}
      </div>
      {formError && <p className="text-xs text-destructive bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-3">{formError}</p>}
      {success && (
        <div className="flex items-start gap-2 text-xs text-primary bg-primary/5 border border-primary/15 rounded-lg px-3 py-2 mt-3">
          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {success}
        </div>
      )}
      <div className="mt-4">
        <button type="submit" disabled={loading}
          className="text-sm bg-accent text-white px-5 py-2 rounded-lg font-semibold hover:bg-accent/90 disabled:opacity-60">
          {loading ? "Creating..." : "Create Account"}
        </button>
      </div>
    </form>
  );
}
