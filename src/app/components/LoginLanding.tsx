import { motion } from "motion/react";
import {
  GraduationCap, BookOpen, Shield, School,
  Fingerprint, FileText, TrendingUp, Building2, Users, Clock,
  CheckCircle, LogIn,
} from "lucide-react";
import type { Role } from "../lib/types";
import { INSTITUTION_NAME, PORTAL_NAME } from "../lib/types";

const DROPS = [
  { left: "5%", delay: 0, duration: 7, size: 10 },
  { left: "18%", delay: 1.2, duration: 8.5, size: 14 },
  { left: "32%", delay: 0.4, duration: 6.5, size: 8 },
  { left: "48%", delay: 2.1, duration: 9, size: 12 },
  { left: "62%", delay: 0.8, duration: 7.5, size: 9 },
  { left: "78%", delay: 1.6, duration: 8, size: 11 },
  { left: "92%", delay: 3, duration: 10, size: 7 },
];

const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  top: `${10 + (i * 17) % 78}%`,
  left: `${5 + (i * 23) % 90}%`,
  delay: (i * 0.4) % 4,
  size: i % 3 === 0 ? 3 : 2,
}));

export const ROLE_STYLES: Record<Role, {
  title: string;
  hint: string;
  cardAccent: string;
  btnClass: string;
  authActive: string;
  authIcon: string;
  authLabel: string;
}> = {
  student: {
    title: "text-accent",
    hint: "text-accent/80",
    cardAccent: "border-accent/30 hover:border-accent/60",
    btnClass: "bg-accent hover:bg-accent/90 text-accent-foreground",
    authActive: "border-accent bg-accent/10 shadow-sm",
    authIcon: "text-accent",
    authLabel: "text-accent",
  },
  lecturer: {
    title: "text-lecturer",
    hint: "text-lecturer-muted",
    cardAccent: "border-lecturer/30 hover:border-lecturer/50",
    btnClass: "bg-lecturer hover:bg-lecturer/90 text-white",
    authActive: "border-lecturer bg-lecturer-light shadow-sm",
    authIcon: "text-lecturer",
    authLabel: "text-lecturer",
  },
  registrar: {
    title: "text-primary",
    hint: "text-primary/80",
    cardAccent: "border-primary/40 hover:border-primary/70",
    btnClass: "bg-primary hover:bg-primary/90 text-primary-foreground",
    authActive: "border-primary bg-primary/10 shadow-sm",
    authIcon: "text-primary",
    authLabel: "text-primary",
  },
  dean: {
    title: "text-emerald-700",
    hint: "text-emerald-600/80",
    cardAccent: "border-emerald-400/40 hover:border-emerald-500/60",
    btnClass: "bg-emerald-700 hover:bg-emerald-800 text-white",
    authActive: "border-emerald-500 bg-emerald-50 shadow-sm",
    authIcon: "text-emerald-700",
    authLabel: "text-emerald-700",
  },
};

export const FEATURES = [
  {
    icon: FileText,
    title: "Digital Registration Workflow",
    desc: "Handle course registration and registrar approvals in one coordinated process with less manual paperwork.",
    color: "text-primary bg-primary/10 border-primary/20",
  },
  {
    icon: Building2,
    title: "Academic Structure Management",
    desc: "Manage faculties, departments, courses, and enrollments with clear organization across the institution.",
    color: "text-accent bg-accent/15 border-accent/30",
  },
  {
    icon: TrendingUp,
    title: "Results Processing Lifecycle",
    desc: "Lecturers save drafts and publish results, while students see only approved scores and feedback.",
    color: "text-primary bg-primary/10 border-primary/20",
  },
  {
    icon: Users,
    title: "Role-Based Access",
    desc: "Student, Lecturer, Dean, and Registrar portals stay synchronized with secure role-specific permissions.",
    color: "text-lecturer bg-lecturer-light border-lecturer/20",
  },
  {
    icon: Clock,
    title: "Real-Time Updates",
    desc: "Changes to enrollments, courses, and scores reflect instantly across all connected dashboards.",
    color: "text-primary bg-primary/10 border-primary/20",
  },
  {
    icon: Fingerprint,
    title: "Personalised Settings",
    desc: "Each user manages profile, security, and notification preferences from a unified account settings area.",
    color: "text-primary bg-primary/10 border-primary/20",
  },
];

const PORTAL_ROLES: {
  role: Role;
  label: string;
  loginHint: string;
  icon: typeof GraduationCap;
  btnLabel: string;
}[] = [
  {
    role: "student",
    label: "Student",
    loginHint: "Login with username or email",
    icon: GraduationCap,
    btnLabel: "Login as Student",
  },
  {
    role: "lecturer",
    label: "Lecturer",
    loginHint: "Login with username or email",
    icon: BookOpen,
    btnLabel: "Login as Lecturer",
  },
  {
    role: "registrar",
    label: "Registrar",
    loginHint: "Login with username or email",
    icon: Shield,
    btnLabel: "Registrar Panel",
  },
  {
    role: "dean",
    label: "Dean",
    loginHint: "Login with username or email",
    icon: School,
    btnLabel: "Dean Portal",
  },
];

export function LoginHeroEffects() {
  return (
    <>
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        {DROPS.map((d, i) => (
          <span
            key={i}
            className="hero-water-drop absolute rounded-full"
            style={{
              left: d.left,
              width: d.size,
              height: d.size * 1.35,
              animationDelay: `${d.delay}s`,
              animationDuration: `${d.duration}s`,
            }}
          />
        ))}
      </div>
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        {PARTICLES.map(p => (
          <motion.span
            key={p.id}
            className="absolute rounded-full bg-white/15"
            style={{ top: p.top, left: p.left, width: p.size, height: p.size }}
            animate={{ opacity: [0.1, 0.45, 0.1] }}
            transition={{ duration: 3 + (p.id % 2), delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-32 sm:h-40 pointer-events-none overflow-hidden" aria-hidden>
        <div className="hero-ripple absolute bottom-[-20%] left-[8%] w-40 sm:w-48 h-40 sm:h-48 rounded-full border border-gold/10" />
        <div className="hero-ripple absolute bottom-[-30%] right-[10%] w-52 sm:w-64 h-52 sm:h-64 rounded-full border border-white/5" style={{ animationDelay: "1.5s" }} />
      </div>
    </>
  );
}

export function LoginRolePortalCards({ onSelectRole }: { onSelectRole: (role: Role) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 w-full max-w-5xl mx-auto">
      {PORTAL_ROLES.map((r, i) => {
        const styles = ROLE_STYLES[r.role];
        return (
          <motion.div
            key={r.role}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.1, duration: 0.45 }}
            className={`group flex flex-col bg-white/95 backdrop-blur-sm rounded-2xl p-5 sm:p-6 border-2 shadow-lg shadow-black/10 ${styles.cardAccent} transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
          >
            <div className="w-12 h-12 rounded-xl bg-muted/80 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <r.icon className="w-6 h-6 text-foreground" />
            </div>
            <h3 className={`text-lg font-bold font-[Outfit] mb-1 ${styles.title}`}>
              {r.label}
            </h3>
            <p className={`text-xs mb-5 ${styles.hint}`}>
              {r.loginHint}
            </p>
            <button
              type="button"
              onClick={() => onSelectRole(r.role)}
              className={`mt-auto w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${styles.btnClass}`}
            >
              <LogIn className="w-4 h-4" />
              {r.btnLabel}
            </button>
          </motion.div>
        );
      })}
    </div>
  );
}

export function LoginFeaturesSection() {
  return (
    <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-xl sm:text-2xl font-bold font-[Outfit] tracking-tight text-foreground">
            Everything you need in one portal
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">
            Built for {INSTITUTION_NAME} streamlined academic management from registration to results.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.06 }}
              className="bg-card rounded-2xl border border-border p-5 sm:p-6 hover:border-accent/30 hover:shadow-md transition-all duration-300"
            >
              <div className={`w-11 h-11 rounded-xl border flex items-center justify-center mb-4 ${f.color}`}>
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-foreground font-[Outfit] mb-2">{f.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LoginHeroHeader() {
  return (
    <div className="text-center mb-10 sm:mb-12 space-y-3">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 border border-white/15"
      >
        <School className="w-8 h-8 sm:w-9 sm:h-9 text-gold-light" />
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-3xl sm:text-4xl md:text-5xl font-semibold sm:font-bold font-[Outfit] text-white tracking-tight leading-snug px-2"
      >
        Course Registration And Result Processing System
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-white/60 text-sm sm:text-base mt-1 sm:mt-2 max-w-2xl mx-auto leading-relaxed"
      >
        Integrated academic operations from enrollment to published results
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.28 }}
        className="text-gold-light/80 text-xs sm:text-sm mt-1 font-medium"
      >
        {INSTITUTION_NAME} · {PORTAL_NAME}
      </motion.p>
    </div>
  );
}

export function LoginHeroTagline() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55 }}
      className="mt-10 sm:mt-12 flex items-center justify-center px-5 py-3 rounded-lg bg-white/6 border border-white/10 backdrop-blur-sm max-w-md mx-auto"
    >
      <span className="w-1 h-4 rounded-full bg-gold-light/70 mr-3 flex-shrink-0" aria-hidden />
      <p className="text-xs sm:text-sm text-white/70 font-medium">Integrated Academic Management Platform</p>
    </motion.div>
  );
}
