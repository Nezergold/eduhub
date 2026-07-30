import { useState } from "react";
import { Shield, CheckCircle, Eye, EyeOff } from "lucide-react";
import { register as authRegister } from "../lib/auth";
import { isCloudEnabled } from "../lib/config";
import type { User } from "../lib/types";

interface RegistrarSignUpFormProps {
  onRegistered: (user: User) => void;
}

export function RegistrarSignUpForm({ onRegistered }: RegistrarSignUpFormProps) {
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const result = await authRegister({
      name: form.name,
      username: form.username,
      email: form.email,
      password: form.password,
      role: "registrar",
    });
    setLoading(false);
    if (result.success && result.user) {
      if (result.warning) {
        setSuccess(`Account created for ${result.user.name}. ${result.warning}`);
        setTimeout(() => onRegistered(result.user!), 1200);
      } else {
        setSuccess(`Account created for ${result.user.name}. Signing you in.`);
        setTimeout(() => onRegistered(result.user!), 600);
      }
    } else {
      setError(result.error || "Could not create registrar account.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/15">
        <Shield className="w-5 h-5 text-primary flex-shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Create your <strong className="text-foreground">Registrar</strong> account once.
          {isCloudEnabled()
            ? " Sign in with the same email and password on any phone, tablet, or computer — your portal data stays in sync."
            : " Use the same username or email and password to sign in anytime."}
          {" "}After sign-in you can enroll students and lecturers.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-foreground block mb-1">Full Name</label>
          <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            className="w-full bg-input-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            placeholder="Registrar Office" autoComplete="name" />
        </div>
        <div>
          <label className="text-xs font-semibold text-foreground block mb-1">Username <span className="text-accent">*</span></label>
          <input required value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value.toLowerCase() }))}
            className="w-full bg-input-background border border-border rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            placeholder="registrar.office" pattern="[a-z0-9._]{3,30}" autoComplete="username" />
        </div>
        <div>
          <label className="text-xs font-semibold text-foreground block mb-1">Email</label>
          <input required type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            className="w-full bg-input-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            placeholder="registrar@wauu.edu" autoComplete="email" />
        </div>
        <div>
          <label className="text-xs font-semibold text-foreground block mb-1">Password</label>
          <div className="relative">
            <input required type={showPass ? "text" : "password"} value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              className="w-full bg-input-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 pr-10"
              placeholder="Min. 6 characters" minLength={6} autoComplete="new-password" />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-foreground block mb-1">Confirm Password</label>
          <input required type={showPass ? "text" : "password"} value={form.confirm}
            onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
            className="w-full bg-input-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            placeholder="Re-enter password" autoComplete="new-password" />
        </div>
      </div>

      {error && <p className="text-xs text-destructive bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}
      {success && (
        <div className="flex items-start gap-2 text-xs text-primary bg-primary/5 border border-primary/15 rounded-xl px-3 py-2.5">
          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span className="leading-relaxed">{success}</span>
        </div>
      )}

      <button type="submit" disabled={loading}
        className="w-full bg-primary text-primary-foreground font-semibold py-2.5 rounded-xl hover:bg-primary/90 transition-all disabled:opacity-60 text-sm">
        {loading ? "Creating account…" : "Create Registrar Account"}
      </button>
    </form>
  );
}
