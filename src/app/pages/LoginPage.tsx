import { useState } from "react";
import { motion } from "motion/react";
import { GraduationCap, BookOpen, Settings, UserPlus, Eye, EyeOff, AlertCircle, ArrowLeft, ArrowRight, Compass, ShieldCheck, Workflow, CheckCircle2, School } from "lucide-react";
import { Logo } from "../components/Logo";
import { CloudConfigBanner } from "../components/CloudConfigBanner";
import { RegistrarSignUpForm } from "../components/RegistrarSignUpForm";
import {
  LoginHeroEffects, LoginHeroHeader,
  LoginFeaturesSection, LoginHeroTagline, ROLE_STYLES,
} from "../components/LoginLanding";
import type { Role, User } from "../lib/types";
import { login as authLogin, lookupAccountForLogin } from "../lib/auth";

interface LoginPageProps {
  onLogin: (user: User) => void;
}

type AuthStep = "identify" | "signin" | "setup-password";

export function LoginPage({ onLogin }: LoginPageProps) {
  const [stage, setStage] = useState<"overview" | "auth">("overview");
  const [panel, setPanel] = useState<"signin" | "create">("signin");
  const [authStep, setAuthStep] = useState<AuthStep>("identify");
  const [identifiedUser, setIdentifiedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role>("student");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function resetAuthFlow() {
    setAuthStep("identify");
    setIdentifiedUser(null);
    setPassword("");
    setConfirmPassword("");
    setError("");
  }

  function goToAuth(role?: Role, tab: "signin" | "create" = "signin") {
    if (role) setSelectedRole(role);
    setPanel(tab);
    resetAuthFlow();
    setStage("auth");
  }

  async function handleIdentify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await lookupAccountForLogin(loginId, selectedRole);
    if (!result.found || !result.user) {
      setError(result.error || "Account not found.");
      setLoading(false);
      return;
    }
    setIdentifiedUser(result.user);
    setAuthStep(result.needsPassword ? "setup-password" : "signin");
    setPassword("");
    setConfirmPassword("");
    setLoading(false);
  }

  async function handleSetupPassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }
    setLoading(true);
    setError("");
    const result = await authLogin(loginId, password, selectedRole);
    if (result.success && result.user) {
      onLogin(result.user);
    } else {
      setError(result.error || "Could not save your password. Please try again.");
    }
    setLoading(false);
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await authLogin(loginId, password, selectedRole);
    if (result.success && result.user) {
      onLogin(result.user);
    } else {
      setError(result.error || "Sign in failed.");
    }
    setLoading(false);
  }

  const roles: { key: Role; label: string; icon: typeof GraduationCap; hint: string }[] = [
    { key: "student", label: "Student", icon: GraduationCap, hint: "Username or email" },
    { key: "lecturer", label: "Lecturer", icon: BookOpen, hint: "Username or email" },
    { key: "registrar", label: "Registrar", icon: Settings, hint: "Username or email" },
    { key: "dean", label: "Dean", icon: School, hint: "Username or email" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {stage === "overview" ? (
        <div className="flex flex-col">
          <section className="relative bg-wine-dark text-white pt-8 pb-12 sm:pt-12 sm:pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
            <LoginHeroEffects />
            <div className="absolute inset-0 opacity-25 pointer-events-none"
              style={{ backgroundImage: "radial-gradient(circle at 20% 80%, #c9a227 0%, transparent 45%), radial-gradient(circle at 80% 15%, #5c1a2e 0%, transparent 50%)" }} />

            <div className="relative z-10 max-w-6xl mx-auto">
              <div className="flex justify-center mb-6 sm:mb-8">
                <Logo
                  size="xl"
                  light
                  onClick={() => {
                    window.history.replaceState(null, "", "/");
                  }}
                  className="scale-100 sm:scale-105"
                />
              </div>
              <LoginHeroHeader />
            </div>
          </section>

          <section className="px-4 sm:px-6 lg:px-8 py-12">
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="text-lg font-bold font-[Outfit] text-foreground mb-4 flex items-center gap-2">
                    <Compass className="w-5 h-5 text-accent" /> How to navigate
                  </h3>
                  <div className="space-y-3">
                    {[
                      "Choose your role: Student, Lecturer, Dean, or Registrar.",
                      "Students and Lecturers: sign in with your assigned username or email, then create a personal password on first sign-in.",
                      "Deans manage their faculty: assign courses to students, assign lecturers to departments.",
                      "Registrars manage enrollment, approvals, assignments, and analytics.",
                    ].map((text) => (
                      <div key={text} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                        <span>{text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="text-lg font-bold font-[Outfit] text-foreground mb-4">System overview</h3>
                  <div className="space-y-3">
                    {[
                      { icon: Workflow, label: "Connected workflow", desc: "Data syncs across Student, Lecturer, and Admin portals in real time." },
                      { icon: ShieldCheck, label: "Role-based security", desc: "Each role sees only what is relevant to their responsibility." },
                      { icon: CheckCircle2, label: "Result lifecycle", desc: "Scores become visible to students only after publication." },
                    ].map(item => (
                      <div key={item.label} className="flex items-start gap-3 py-2 px-3 rounded-lg bg-muted/30">
                        <item.icon className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => goToAuth(selectedRole, "signin")}
                  className="inline-flex items-center gap-2 bg-wine hover:bg-wine-dark text-white font-semibold px-8 py-3.5 rounded-xl transition-colors shadow-lg shadow-wine/20 text-sm"
                >
                  Get Started <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : (
        <section className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-muted/40 to-background min-h-screen">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <button
                type="button"
                onClick={() => setStage("overview")}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to System Overview
              </button>
              <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-primary" />
                Authentication Portal
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-6 items-start">
              <div className="bg-wine-dark text-white rounded-2xl border border-white/10 p-6 sm:p-7 relative overflow-hidden">
                <LoginHeroEffects />
                <div className="relative z-10">
                  <Logo size="md" light />
                  <h2 className="text-2xl font-bold font-[Outfit] mt-5">Secure Access Portal</h2>
                  <p className="text-sm text-white/70 mt-2 leading-relaxed">
                    Continue with your assigned role credentials. New registrars can create an account, then enroll and manage users.
                  </p>
                  <div className="mt-5 space-y-2 text-xs text-white/75">
                    <p className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-gold-light" /> Username or email based authentication</p>
                    <p className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-gold-light" /> Role-specific access control</p>
                    <p className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-gold-light" /> Real-time synchronized operations</p>
                  </div>
                </div>
              </div>

              <div className="max-w-lg mx-auto w-full">
                <div className="flex rounded-xl border border-border p-1 mb-6 bg-card shadow-sm">
                  <button
                    type="button"
                    onClick={() => { setPanel("signin"); resetAuthFlow(); }}
                    className={`flex-1 py-2.5 sm:py-3 text-sm font-semibold rounded-lg transition-all min-h-[44px] ${panel === "signin" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPanel("create"); setError(""); }}
                    className={`flex-1 py-2.5 sm:py-3 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 min-h-[44px] ${panel === "create" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <UserPlus className="w-4 h-4 shrink-0" /> Registrar Sign Up
                  </button>
                </div>

                <div className="bg-card border border-border rounded-2xl p-5 sm:p-7 shadow-lg">
                  <CloudConfigBanner />
                  {panel === "signin" ? (
                    <>
                      <h2 className="text-xl sm:text-2xl font-bold font-[Outfit] text-foreground mb-1">Sign in</h2>
                      <p className="text-muted-foreground text-sm mb-6">
                        Use the <strong className="text-foreground font-medium">username</strong> or email your registrar assigned. First-time users create a personal password in the next step — the registrar does not know it.
                      </p>

                      {authStep === "identify" && (
                      <>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
                        {roles.map(r => {
                          const styles = ROLE_STYLES[r.key];
                          const active = selectedRole === r.key;
                          return (
                          <button key={r.key} type="button" onClick={() => setSelectedRole(r.key)}
                            className={`flex flex-col items-center gap-1 py-3 px-1.5 sm:px-2 rounded-xl border-2 transition-all duration-300 text-center min-h-[72px] ${active ? styles.authActive : "border-border bg-muted/30 hover:border-border"}`}>
                            <r.icon className={`w-5 h-5 ${active ? styles.authIcon : "text-muted-foreground"}`} />
                            <span className={`text-[11px] sm:text-xs font-semibold leading-tight ${active ? styles.authLabel : "text-muted-foreground"}`}>{r.label}</span>
                            <span className="text-[8px] sm:text-[9px] text-muted-foreground/80 leading-tight hidden xs:block">{r.hint}</span>
                          </button>
                          );
                        })}
                      </div>

                      <form onSubmit={handleIdentify} className="space-y-4">
                        <div>
                          <label className="text-sm font-semibold text-foreground block mb-1.5">Username or Email</label>
                          <input type="text" value={loginId} onChange={e => setLoginId(e.target.value)}
                            className="w-full bg-input-background border border-border rounded-xl px-3.5 py-3 text-sm text-foreground focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all min-h-[44px]"
                            placeholder="e.g. adaeze.ok" required autoComplete="username" />
                        </div>

                        {error && (
                          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-2 text-destructive text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                          </motion.div>
                        )}

                        <motion.button type="submit" disabled={loading}
                          whileHover={{ scale: loading ? 1 : 1.01 }} whileTap={{ scale: loading ? 1 : 0.98 }}
                          className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-md min-h-[48px]">
                          {loading ? (
                            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Please wait...</>
                          ) : "Continue"}
                        </motion.button>
                      </form>
                      </>
                      )}

                      {authStep === "setup-password" && identifiedUser && (
                      <>
                      <button type="button" onClick={resetAuthFlow}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back
                      </button>

                      <div className="rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 mb-5">
                        <p className="text-sm font-semibold text-foreground">Welcome, {identifiedUser.name}</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          Your account was created by the registrar. Set a <strong className="text-foreground font-medium">personal password</strong> only you will know — it is not shared with the registrar and will be saved for future sign-ins.
                        </p>
                      </div>

                      <form onSubmit={handleSetupPassword} className="space-y-4">
                        <div>
                          <label className="text-sm font-semibold text-foreground block mb-1.5">Create your password</label>
                          <div className="relative">
                            <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                              className="w-full bg-input-background border border-border rounded-xl px-3.5 py-3 text-sm text-foreground focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all pr-11 min-h-[44px]"
                              placeholder="Minimum 6 characters" required minLength={6} autoComplete="new-password" />
                            <button type="button" onClick={() => setShowPass(!showPass)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1">
                              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-foreground block mb-1.5">Confirm your password</label>
                          <div className="relative">
                            <input type={showConfirmPass ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                              className="w-full bg-input-background border border-border rounded-xl px-3.5 py-3 text-sm text-foreground focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all pr-11 min-h-[44px]"
                              placeholder="Re-enter your password" required minLength={6} autoComplete="new-password" />
                            <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1">
                              {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {error && (
                          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-2 text-destructive text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                          </motion.div>
                        )}

                        <motion.button type="submit" disabled={loading}
                          whileHover={{ scale: loading ? 1 : 1.01 }} whileTap={{ scale: loading ? 1 : 0.98 }}
                          className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-md min-h-[48px]">
                          {loading ? (
                            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                          ) : "Save password & sign in"}
                        </motion.button>
                      </form>
                      </>
                      )}

                      {authStep === "signin" && identifiedUser && (
                      <>
                      <button type="button" onClick={resetAuthFlow}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back
                      </button>

                      <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 mb-5">
                        <p className="text-sm font-semibold text-foreground">{identifiedUser.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{identifiedUser.username} · {identifiedUser.email}</p>
                      </div>

                      <form onSubmit={handleSignIn} className="space-y-4">
                        <div>
                          <label className="text-sm font-semibold text-foreground block mb-1.5">Your password</label>
                          <div className="relative">
                            <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                              className="w-full bg-input-background border border-border rounded-xl px-3.5 py-3 text-sm text-foreground focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all pr-11 min-h-[44px]"
                              placeholder="Enter your personal password" required autoComplete="current-password" />
                            <button type="button" onClick={() => setShowPass(!showPass)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1">
                              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {error && (
                          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-2 text-destructive text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                          </motion.div>
                        )}

                        <motion.button type="submit" disabled={loading}
                          whileHover={{ scale: loading ? 1 : 1.01 }} whileTap={{ scale: loading ? 1 : 0.98 }}
                          className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-md min-h-[48px]">
                          {loading ? (
                            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Please wait...</>
                          ) : "Sign In"}
                        </motion.button>
                      </form>
                      </>
                      )}

                      <p className="text-center text-xs text-muted-foreground mt-5">
                        New registrar?{" "}
                        <button type="button" onClick={() => goToAuth("registrar", "create")} className="text-accent font-semibold hover:underline">
                          Create your account
                        </button>
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-xl sm:text-2xl font-bold font-[Outfit] text-foreground mb-1">Create Registrar Account</h2>
                      <p className="text-muted-foreground text-sm mb-5">
                        Set up your profile once — use the same credentials to sign in, then enroll students and lecturers.
                      </p>
                      <RegistrarSignUpForm onRegistered={onLogin} />
                      <p className="text-center text-xs text-muted-foreground mt-5">
                        Already registered?{" "}
                        <button type="button" onClick={() => goToAuth("registrar", "signin")} className="text-accent font-semibold hover:underline">
                          Sign In as Registrar
                        </button>
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
