import type { Role } from "./types";

import { scheduleCloudPush } from "./cloudSync";

const SETTINGS_KEY = "wawuhub_settings";

export type NotificationFrequency = "instant" | "daily" | "weekly" | "off";

export interface UserSettings {
  profile: {
    phone?: string;
  };
  preferences: {
    notificationFrequency: NotificationFrequency;
  };
  security: {
    twoFactorEnabled: boolean;
    activeSessions: Array<{ id: string; createdAt: string; lastSeenAt: string; userAgent?: string }>;
  };
  meta: {
    role: Role;
    updatedAt: string;
  };
}

type SettingsStore = Record<string, UserSettings>;

function readStore(): SettingsStore {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as SettingsStore;
  } catch {
    return {};
  }
}

function writeStore(store: SettingsStore): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(store));
  window.dispatchEvent(new CustomEvent("wawuhub:data-changed"));
  window.dispatchEvent(new CustomEvent("wawuhub:settings-changed"));
  scheduleCloudPush();
}

export function defaultSettings(role: Role): UserSettings {
  const now = new Date().toISOString();
  return {
    profile: {},
    preferences: {
      notificationFrequency: role === "student" ? "instant" : "daily",
    },
    security: {
      twoFactorEnabled: false,
      activeSessions: [],
    },
    meta: { role, updatedAt: now },
  };
}

export function getUserSettings(userId: string, role: Role): UserSettings {
  const store = readStore();
  const existing = store[userId];
  if (existing) return existing;
  const created = defaultSettings(role);
  store[userId] = created;
  writeStore(store);
  return created;
}

export function updateUserSettings(userId: string, role: Role, patch: Partial<UserSettings>): UserSettings {
  const store = readStore();
  const current = store[userId] ?? defaultSettings(role);
  const merged: UserSettings = {
    ...current,
    ...patch,
    profile: { ...current.profile, ...(patch.profile ?? {}) },
    preferences: { ...current.preferences, ...(patch.preferences ?? {}) },
    security: { ...current.security, ...(patch.security ?? {}) },
    meta: { role, updatedAt: new Date().toISOString() },
  };
  store[userId] = merged;
  writeStore(store);
  return merged;
}

