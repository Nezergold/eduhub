import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Camera, KeyRound, Lock, Settings2, ShieldCheck, User } from "lucide-react";
import type { User as UserType } from "../lib/types";
import { isDeanRole } from "../lib/types";
import { getUserSettings, updateUserSettings, type NotificationFrequency } from "../lib/settings";
import { isCloudEnabled } from "../lib/config";
import { useAppData } from "../context/AppContext";
import { saveSession } from "../lib/auth";
import { portalInputClass } from "./portal/PortalUI";

type SettingsSectionId = "profile" | "security" | "preferences";

const SECTIONS: Array<{ id: SettingsSectionId; label: string; icon: typeof Camera }> = [
  { id: "profile", label: "Profile", icon: Camera },
  { id: "security", label: "Security", icon: Lock },
  { id: "preferences", label: "Preferences", icon: Settings2 },
];

function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export function AccountSettings({ user: userProp }: { user: UserType }) {
  const { user: ctxUser, updateUser, refresh } = useAppData();
  const user = ctxUser.id === userProp.id ? ctxUser : userProp;
  const [active, setActive] = useState<SettingsSectionId>("profile");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const settings = getUserSettings(user.id, user.role);

  const [profileForm, setProfileForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone ?? "",
    avatar: user.avatar ?? "",
    staffId: user.staffId ?? "",
    matricNo: user.matricNo ?? "",
  });

  const [securityForm, setSecurityForm] = useState({
    newPassword: "",
    enable2fa: settings.security.twoFactorEnabled,
  });

  const [prefsForm, setPrefsForm] = useState({
    notificationFrequency: settings.preferences.notificationFrequency as NotificationFrequency,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProfileForm({
      name: user.name,
      email: user.email,
      phone: user.phone ?? "",
      avatar: user.avatar ?? "",
      staffId: user.staffId ?? "",
      matricNo: user.matricNo ?? "",
    });
  }, [user.name, user.email, user.phone, user.avatar, user.staffId, user.matricNo]);

  function toastOk(msg: string) {
    setStatus({ type: "ok", msg });
    setTimeout(() => setStatus(null), 2400);
  }

  function toastErr(msg: string) {
    setStatus({ type: "err", msg });
    setTimeout(() => setStatus(null), 3200);
  }

  async function saveProfile() {
    setSaving(true);
    setStatus(null);
    try {
      const res = await updateUser(user.id, {
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone,
        avatar: profileForm.avatar || undefined,
        staffId: profileForm.staffId || undefined,
        matricNo: profileForm.matricNo || undefined,
      });
      if (!res.success) throw new Error(res.error || "Profile update failed.");
      if (res.user) saveSession(res.user);
      refresh();
      toastOk("Profile updated and synced.");
    } catch (e) {
      toastErr(e instanceof Error ? e.message : "Profile update failed.");
    } finally {
      setSaving(false);
    }
  }

  async function saveSecurity() {
    setSaving(true);
    setStatus(null);
    try {
      if (securityForm.newPassword && securityForm.newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters.");
      }
      if (securityForm.newPassword) {
        const res = await updateUser(user.id, { password: securityForm.newPassword });
        if (!res.success) throw new Error(res.error || "Password update failed.");
      }
      updateUserSettings(user.id, user.role, {
        security: {
          ...settings.security,
          twoFactorEnabled: securityForm.enable2fa,
        },
      });
      setSecurityForm(p => ({ ...p, newPassword: "" }));
      refresh();
      toastOk(securityForm.newPassword ? "Password and security settings saved." : "Security settings saved.");
    } catch (e) {
      toastErr(e instanceof Error ? e.message : "Security update failed.");
    } finally {
      setSaving(false);
    }
  }

  function savePreferences() {
    setSaving(true);
    setStatus(null);
    try {
      updateUserSettings(user.id, user.role, {
        preferences: { notificationFrequency: prefsForm.notificationFrequency },
      });
      toastOk("Preferences saved.");
    } catch {
      toastErr("Preferences update failed.");
    } finally {
      setSaving(false);
    }
  }

  async function onAvatarPicked(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toastErr("Please select an image file.");
    if (file.size > 2.5 * 1024 * 1024) return toastErr("Image is too large (max 2.5MB).");
    try {
      const url = await fileToDataUrl(file);
      setProfileForm(p => ({ ...p, avatar: url }));
    } catch {
      toastErr("Could not load image.");
    }
  }

  const isStaff = user.role === "lecturer" || user.role === "dean" || user.role === "registrar";
  const isStudent = user.role === "student";

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-bold font-[Outfit] text-foreground truncate">Account Settings</h2>
          <p className="text-xs text-muted-foreground truncate">Manage your profile, security, and portal preferences.</p>
        </div>
        {status && (
          <div className={`text-xs px-3 py-1.5 rounded-lg border font-semibold ${status.type === "ok" ? "bg-primary/5 border-primary/15 text-primary" : "bg-red-50 border-red-200 text-red-700"}`}>
            {status.msg}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="border-b lg:border-b-0 lg:border-r border-border bg-muted/20 p-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold overflow-hidden">
              {profileForm.avatar ? (
                <img src={profileForm.avatar} alt="" className="w-10 h-10 rounded-xl object-cover" />
              ) : (
                initials(user.name)
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
              <p className="text-[11px] text-muted-foreground truncate capitalize">{user.role}</p>
            </div>
          </div>

          <nav className="space-y-1">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActive(s.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${active === s.id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"}`}
              >
                <s.icon className="w-4 h-4" />
                {s.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="p-5 sm:p-6">
          {active === "profile" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm sm:text-base font-bold font-[Outfit] text-foreground">Profile Management</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Update your identity and contact details. Changes sync to all devices.</p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold border border-border px-3 py-2 rounded-lg hover:bg-muted/40 transition-colors flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" /> Upload Photo
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onAvatarPicked(e.target.files?.[0] ?? null)}
                />
              </div>

              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-accent" />
                  <p className="text-sm font-bold text-foreground">Account Info</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <p className="text-[11px] text-muted-foreground font-semibold">Role</p>
                    <p className="text-sm text-foreground capitalize font-medium">{user.role}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground font-semibold">Faculty</p>
                    <p className="text-sm text-foreground font-medium">{user.faculty || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground font-semibold">Department</p>
                    <p className="text-sm text-foreground font-medium">{user.department || (isDeanRole(user.role) ? "(Faculty-wide)" : "—")}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground font-semibold">Username</p>
                    <p className="text-sm text-foreground font-mono font-medium">{user.username}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground font-semibold">Account ID</p>
                    <p className="text-sm text-foreground font-mono font-medium text-xs">{user.id}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-foreground block mb-1">Full Name</label>
                  <input
                    value={profileForm.name}
                    onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                    className={portalInputClass}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Email</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))}
                    className={portalInputClass}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Phone Number</label>
                  <input
                    value={profileForm.phone}
                    onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                    className={portalInputClass}
                    placeholder="e.g. +234 800 000 0000"
                  />
                </div>
                {isStaff && (
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">Staff ID</label>
                    <input
                      value={profileForm.staffId}
                      onChange={e => setProfileForm(p => ({ ...p, staffId: e.target.value }))}
                      className={portalInputClass}
                      placeholder="e.g. LEC/001"
                    />
                  </div>
                )}
                {isStudent && (
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">Matric Number</label>
                    <input
                      value={profileForm.matricNo}
                      onChange={e => setProfileForm(p => ({ ...p, matricNo: e.target.value }))}
                      className={portalInputClass}
                      placeholder="e.g. CSC/2024/001"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <motion.button
                  whileHover={{ scale: saving ? 1 : 1.01 }}
                  whileTap={{ scale: saving ? 1 : 0.98 }}
                  disabled={saving}
                  onClick={saveProfile}
                  className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 disabled:opacity-60 flex items-center gap-2"
                >
                  {saving ? "Saving..." : "Save Profile"}
                </motion.button>
              </div>
            </div>
          )}

          {active === "security" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm sm:text-base font-bold font-[Outfit] text-foreground">Security & Authentication</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Manage password, 2FA and active sessions.</p>
              </div>

              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <KeyRound className="w-4 h-4 text-accent" />
                  <p className="text-sm font-bold text-foreground">Password reset</p>
                </div>
                <label className="text-xs font-semibold text-foreground block mb-1">New Password</label>
                <input
                  type="password"
                  value={securityForm.newPassword}
                  onChange={e => setSecurityForm(p => ({ ...p, newPassword: e.target.value }))}
                  className={portalInputClass}
                  placeholder="Minimum 6 characters"
                />
                <p className="text-[11px] text-muted-foreground mt-1">Leave blank to keep your current password.</p>
              </div>

              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-accent" /> Two-factor authentication (2FA)
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Enable an extra verification step for sign-in.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSecurityForm(p => ({ ...p, enable2fa: !p.enable2fa }))}
                    className={`text-xs font-semibold px-3 py-2 rounded-lg border transition-colors ${securityForm.enable2fa ? "bg-primary/5 border-primary/20 text-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"}`}
                  >
                    {securityForm.enable2fa ? "Enabled" : "Disabled"}
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <p className="text-sm font-bold text-foreground">Devices & sessions</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                  {isCloudEnabled()
                    ? "Your account can stay signed in on multiple devices at the same time. Sessions refresh automatically."
                    : "Local mode: sessions are stored on this browser only. Enable cloud mode for sign-in on any device."}
                </p>
                <div className="mt-3 text-xs text-muted-foreground space-y-2">
                  <div className="flex items-center justify-between py-2 border-b border-border/60 gap-3">
                    <span className="font-medium text-foreground">This device</span>
                    <span className="text-[11px] text-right">{new Date().toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 gap-3">
                    <span className="font-medium text-foreground">Cloud session</span>
                    <span className={`text-[11px] font-semibold ${isCloudEnabled() ? "text-green-700" : "text-muted-foreground"}`}>
                      {isCloudEnabled() ? "Multi-device enabled" : "Local only"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <motion.button
                  whileHover={{ scale: saving ? 1 : 1.01 }}
                  whileTap={{ scale: saving ? 1 : 0.98 }}
                  disabled={saving}
                  onClick={saveSecurity}
                  className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Security"}
                </motion.button>
              </div>
            </div>
          )}

          {active === "preferences" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm sm:text-base font-bold font-[Outfit] text-foreground">Portal Preferences</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Configure your portal experience.</p>
              </div>

              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <p className="text-sm font-bold text-foreground">Notifications</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {user.role === "student"
                    ? "Set how frequently you receive updates about registrations and results."
                    : "Set how frequently you receive system notifications."}
                </p>

                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(["instant", "daily", "weekly", "off"] as NotificationFrequency[]).map(freq => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setPrefsForm(p => ({ ...p, notificationFrequency: freq }))}
                      className={`text-xs font-semibold px-3 py-2 rounded-lg border transition-colors capitalize ${prefsForm.notificationFrequency === freq ? "bg-accent text-accent-foreground border-accent" : "bg-card border-border text-muted-foreground hover:text-foreground"}`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>

                <p className="text-[11px] text-muted-foreground mt-3">
                  This setting is stored globally for your account and applies across portals.
                </p>
              </div>

              <div className="flex justify-end">
                <motion.button
                  whileHover={{ scale: saving ? 1 : 1.01 }}
                  whileTap={{ scale: saving ? 1 : 0.98 }}
                  disabled={saving}
                  onClick={savePreferences}
                  className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Preferences"}
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
