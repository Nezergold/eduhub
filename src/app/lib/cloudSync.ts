import { getSupabase } from "./supabaseClient";
import { isCloudEnabled } from "./config";

export const CLOUD_USERS_KEY = "wawuhub_users";
export const CLOUD_DATA_KEY = "wawuhub_data";
export const CLOUD_SETTINGS_KEY = "wawuhub_settings";
const SYNC_META_KEY = "wawuhub_sync_meta";

const PASSWORD_FIELD_NAMES = new Set([
  "password",
  "passwordhash",
  "password_hash",
  "passhash",
  "pass_hash",
]);

let pushTimer: ReturnType<typeof setTimeout> | null = null;
let realtimeChannel: ReturnType<NonNullable<ReturnType<typeof getSupabase>>["channel"]> | null = null;
let lastPushCompletedAt = 0;

export type SyncStatus = "idle" | "syncing" | "synced" | "error" | "offline" | "needs_setup";

let syncStatus: SyncStatus = isCloudEnabled() ? "idle" : "offline";
const statusListeners = new Set<(s: SyncStatus) => void>();

interface SyncMeta {
  usersAt?: string;
  dataAt?: string;
  settingsAt?: string;
}

interface CloudUserAccount {
  user: { id: string; email: string; username: string; [key: string]: unknown };
  passwordHash?: string | null;
  password?: string | null;
  [key: string]: unknown;
}

interface CloudUserStore {
  version?: number;
  accounts?: CloudUserAccount[];
}

interface CloudDataStore {
  version?: number;
  courses?: Array<{ id: string; [key: string]: unknown }>;
  registrations?: Array<{ id: string; [key: string]: unknown }>;
  scores?: Array<{ studentId: string; courseCode: string; [key: string]: unknown }>;
  departments?: Array<{ id: string; [key: string]: unknown }>;
  semesterResults?: Record<string, unknown[]>;
  notifications?: Array<{ id: string; [key: string]: unknown }>;
  courseApprovalSubmissions?: Array<{ id: string; [key: string]: unknown }>;
}

function emptyCloudData(): CloudDataStore {
  return {
    version: 7,
    courses: [],
    registrations: [],
    scores: [],
    departments: [],
    semesterResults: {},
    notifications: [],
    courseApprovalSubmissions: [],
  };
}

function normalizeCloudData(raw: string): CloudDataStore {
  try {
    const parsed = JSON.parse(raw) as CloudDataStore;
    const empty = emptyCloudData();
    return {
      version: parsed.version ?? empty.version,
      courses: Array.isArray(parsed.courses) ? parsed.courses : empty.courses,
      registrations: Array.isArray(parsed.registrations) ? parsed.registrations : empty.registrations,
      scores: Array.isArray(parsed.scores) ? parsed.scores : empty.scores,
      departments: Array.isArray(parsed.departments) ? parsed.departments : empty.departments,
      semesterResults: parsed.semesterResults ?? empty.semesterResults,
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : empty.notifications,
      courseApprovalSubmissions: Array.isArray(parsed.courseApprovalSubmissions)
        ? parsed.courseApprovalSubmissions
        : empty.courseApprovalSubmissions,
    };
  } catch {
    return emptyCloudData();
  }
}

function mergeArrayById<T extends { id: string }>(local: T[] | undefined, remote: T[] | undefined): T[] {
  const map = new Map<string, T>();
  for (const item of local ?? []) map.set(item.id, item);
  for (const item of remote ?? []) map.set(item.id, item);
  return Array.from(map.values());
}

function mergeScores(
  local: CloudDataStore["scores"],
  remote: CloudDataStore["scores"]
): CloudDataStore["scores"] {
  const map = new Map<string, NonNullable<CloudDataStore["scores"]>[number]>();
  const keyOf = (score: NonNullable<CloudDataStore["scores"]>[number]) =>
    `${score.studentId}::${score.courseCode}`;
  for (const item of local ?? []) map.set(keyOf(item), item);
  for (const item of remote ?? []) map.set(keyOf(item), item);
  return Array.from(map.values());
}

function mergeSemesterResults(
  local: CloudDataStore["semesterResults"],
  remote: CloudDataStore["semesterResults"]
): CloudDataStore["semesterResults"] {
  return { ...(local ?? {}), ...(remote ?? {}) };
}

export function mergeDataBlob(local: CloudDataStore | null, remote: unknown): CloudDataStore {
  const remoteSource =
    typeof remote === "string"
      ? (JSON.parse(remote || "{}") as Record<string, unknown>)
      : ((remote ?? {}) as Record<string, unknown>);
  const remoteStore = normalizeCloudData(JSON.stringify(remoteSource));
  if (!local) return remoteStore;

  const pickMerged = <K extends keyof CloudDataStore>(
    key: K,
    mergeFn: (
      localValue: CloudDataStore[K],
      remoteValue: CloudDataStore[K]
    ) => CloudDataStore[K]
  ): CloudDataStore[K] => {
    if (!Array.isArray(remoteSource[key as string]) && key !== "semesterResults") {
      return local[key] ?? remoteStore[key];
    }
    if (key === "semesterResults") {
      return Object.prototype.hasOwnProperty.call(remoteSource, "semesterResults")
        ? mergeFn(local.semesterResults, remoteStore.semesterResults)
        : (local.semesterResults ?? {});
    }
    return mergeFn(local[key], remoteStore[key]);
  };

  return {
    version: Math.max(local.version ?? 0, remoteStore.version ?? 0),
    courses: pickMerged("courses", mergeArrayById) as CloudDataStore["courses"],
    registrations: pickMerged("registrations", mergeArrayById) as CloudDataStore["registrations"],
    scores: pickMerged("scores", mergeScores) as CloudDataStore["scores"],
    departments: pickMerged("departments", mergeArrayById) as CloudDataStore["departments"],
    semesterResults: pickMerged("semesterResults", mergeSemesterResults) as CloudDataStore["semesterResults"],
    notifications: pickMerged("notifications", mergeArrayById) as CloudDataStore["notifications"],
    courseApprovalSubmissions: pickMerged(
      "courseApprovalSubmissions",
      mergeArrayById
    ) as CloudDataStore["courseApprovalSubmissions"],
  };
}

/** Strip any password-related fields from a roster account before cloud I/O. */
export function sanitizeRosterAccount(account: CloudUserAccount): CloudUserAccount {
  const clean: CloudUserAccount = { user: { ...account.user } };
  for (const [key, value] of Object.entries(account)) {
    if (key === "user") continue;
    if (PASSWORD_FIELD_NAMES.has(key.toLowerCase())) continue;
    clean[key] = value;
  }
  // Also strip any password fields that may have leaked into the user sub-object
  for (const field of Object.keys(clean.user)) {
    if (PASSWORD_FIELD_NAMES.has(field.toLowerCase())) {
      delete (clean.user as Record<string, unknown>)[field];
    }
  }
  return clean;
}

/** Remove password material from a full roster blob (defense in depth on pull). */
export function stripPasswordMaterialFromUsers(raw: unknown): CloudUserStore {
  const store = (typeof raw === "string" ? JSON.parse(raw) : raw) as CloudUserStore;
  if (!store?.accounts) return store ?? { version: 3, accounts: [] };
  return {
    ...store,
    accounts: store.accounts.map(acc => sanitizeRosterAccount(acc)),
  };
}

function setSyncStatus(status: SyncStatus) {
  syncStatus = status;
  statusListeners.forEach(fn => fn(status));
}

export function getSyncStatus(): SyncStatus {
  return syncStatus;
}

export function onSyncStatusChange(listener: (status: SyncStatus) => void): () => void {
  statusListeners.add(listener);
  listener(syncStatus);
  return () => statusListeners.delete(listener);
}

function dispatchLocalRefresh() {
  window.dispatchEvent(new CustomEvent("wawuhub:data-changed"));
  window.dispatchEvent(new CustomEvent("wawuhub:users-changed"));
  window.dispatchEvent(new CustomEvent("wawuhub:settings-changed"));
}

function readSyncMeta(): SyncMeta {
  try {
    return JSON.parse(localStorage.getItem(SYNC_META_KEY) || "{}") as SyncMeta;
  } catch {
    return {};
  }
}

function writeSyncMeta(partial: Partial<SyncMeta>) {
  localStorage.setItem(SYNC_META_KEY, JSON.stringify({ ...readSyncMeta(), ...partial }));
}

function shouldApplyRemote(remoteAt: string | undefined, localAt?: string): boolean {
  if (!remoteAt) return true;
  if (!localAt) return true;
  return new Date(remoteAt).getTime() > new Date(localAt).getTime();
}

const DEFAULT_CLOUD_TIMEOUT_MS = 8_000;

function withTimeout<T>(promise: Promise<T>, ms: number, onTimeout: () => T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>(resolve => setTimeout(() => resolve(onTimeout()), ms)),
  ]);
}

/** Merge remote roster with local while keeping password hashes strictly local-only. */
export function mergeUsersBlob(localRaw: string | null, remote: unknown): string {
  const local: CloudUserStore = localRaw
    ? (JSON.parse(localRaw) as CloudUserStore)
    : { version: 3, accounts: [] };
  const remoteStore = stripPasswordMaterialFromUsers(remote);
  if (!remoteStore?.accounts?.length) {
    return localRaw || JSON.stringify({ version: 3, accounts: [] });
  }

  const byId = new Map<string, CloudUserAccount>();
  for (const acc of local.accounts ?? []) {
    byId.set(acc.user.id, acc);
  }
  for (const acc of remoteStore.accounts) {
    const existing = byId.get(acc.user.id);
    if (!existing) {
      byId.set(acc.user.id, { user: acc.user, passwordHash: null });
    } else {
      byId.set(acc.user.id, {
        user: acc.user,
        passwordHash: existing.passwordHash ?? null,
      });
    }
  }

  return JSON.stringify({
    ...local,
    version: Math.max(local.version ?? 3, remoteStore.version ?? 3),
    accounts: Array.from(byId.values()),
  });
}

/** Sync only public roster metadata; password hashes never leave local storage. */
export function prepareUsersForCloud(raw: string): unknown {
  const store = JSON.parse(raw) as CloudUserStore;
  if (!store.accounts) return store;
  return {
    ...store,
    accounts: store.accounts.map(a => sanitizeRosterAccount(a)),
  };
}

async function applyUsersRow(value: unknown, remoteAt?: string): Promise<boolean> {
  const sanitized = stripPasswordMaterialFromUsers(value);
  const merged = mergeUsersBlob(localStorage.getItem(CLOUD_USERS_KEY), sanitized);
  localStorage.setItem(CLOUD_USERS_KEY, merged);
  writeSyncMeta({ usersAt: remoteAt });
  return true;
}

/**
 * Pull the public roster (metadata only) before authentication.
 * Anonymous clients may only read the wawuhub_users row per RLS.
 */
export async function pullPublicRoster(timeoutMs = DEFAULT_CLOUD_TIMEOUT_MS): Promise<boolean> {
  return withTimeout(pullPublicRosterImpl(), timeoutMs, () => false);
}

async function pullPublicRosterImpl(): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  try {
    const { data, error } = await sb
      .from("app_sync")
      .select("key, value, updated_at")
      .eq("key", CLOUD_USERS_KEY)
      .maybeSingle();

    if (error) {
      const msg = error.message?.toLowerCase() ?? "";
      const code = (error as { code?: string }).code;
      if (code === "PGRST205" || msg.includes("does not exist") || msg.includes("schema cache")) {
        setSyncStatus("needs_setup");
        return false;
      }
      return false;
    }

    if (!data?.value) return false;
    await applyUsersRow(data.value, data.updated_at as string | undefined);
    dispatchLocalRefresh();
    return true;
  } catch {
    return false;
  }
}

/**
 * Pull institutional data from Supabase into localStorage.
 * Roster is readable pre-auth; portal data and settings require a session.
 */
export async function pullCloudStores(timeoutMs = DEFAULT_CLOUD_TIMEOUT_MS): Promise<boolean> {
  return withTimeout(pullCloudStoresImpl(), timeoutMs, () => {
    // Only set error if we haven't recently pushed successfully
    if (syncStatus === "syncing" && Date.now() - lastPushCompletedAt > 3000) setSyncStatus("error");
    return false;
  });
}

async function pullCloudStoresImpl(): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  setSyncStatus("syncing");
  try {
    const { data: sessionData } = await sb.auth.getSession();
    const isAuthenticated = Boolean(sessionData.session);

    const keys = isAuthenticated
      ? [CLOUD_USERS_KEY, CLOUD_DATA_KEY, CLOUD_SETTINGS_KEY]
      : [CLOUD_USERS_KEY];

    const { data, error } = await sb
      .from("app_sync")
      .select("key, value, updated_at")
      .in("key", keys);

    if (error) {
      const msg = error.message?.toLowerCase() ?? "";
      const code = (error as { code?: string }).code;
      if (code === "PGRST205" || msg.includes("does not exist") || msg.includes("schema cache")) {
        setSyncStatus("needs_setup");
        return false;
      }
      if (msg.includes("jwt") || msg.includes("unauthorized") || msg.includes("auth")) {
        setSyncStatus("offline");
        return false;
      }
      throw error;
    }

    const meta = readSyncMeta();
    let pulled = false;

    for (const row of data ?? []) {
      if (!row?.key || row.value === undefined || row.value === null) continue;
      const remoteAt = row.updated_at as string | undefined;

      if (row.key === CLOUD_USERS_KEY) {
        await applyUsersRow(row.value, remoteAt);
        pulled = true;
      } else if (row.key === CLOUD_DATA_KEY && shouldApplyRemote(remoteAt, meta.dataAt)) {
        const localRaw = localStorage.getItem(row.key);
        const local = localRaw ? normalizeCloudData(localRaw) : null;
        const remote = typeof row.value === "string" ? JSON.parse(row.value) : row.value;
        const merged = mergeDataBlob(local, remote);
        localStorage.setItem(row.key, JSON.stringify(merged));
        writeSyncMeta({ dataAt: remoteAt });
        pulled = true;
      } else if (row.key === CLOUD_SETTINGS_KEY && shouldApplyRemote(remoteAt, meta.settingsAt)) {
        const serialized =
          typeof row.value === "string" ? row.value : JSON.stringify(row.value);
        localStorage.setItem(row.key, serialized);
        writeSyncMeta({ settingsAt: remoteAt });
        pulled = true;
      }
    }

    if (pulled) dispatchLocalRefresh();
    setSyncStatus("synced");
    return pulled;
  } catch (err) {
    const e = err as { code?: string; message?: string };
    const msg = e.message?.toLowerCase() ?? "";
    if (e.code === "PGRST205" || msg.includes("does not exist") || msg.includes("schema cache")) {
      setSyncStatus("needs_setup");
    } else {
      setSyncStatus("error");
    }
    return false;
  }
}

/** Push local institutional data to Supabase (debounced after writes). */
export async function pushCloudStores(timeoutMs = DEFAULT_CLOUD_TIMEOUT_MS): Promise<boolean> {
  return withTimeout(pushCloudStoresImpl(), timeoutMs, () => {
    if (syncStatus === "syncing" && Date.now() - lastPushCompletedAt > 3000) setSyncStatus("error");
    return false;
  });
}

async function pushCloudStoresImpl(): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  const { data: sessionData } = await sb.auth.getSession();
  if (!sessionData.session) return false;

  setSyncStatus("syncing");
  try {
    const now = new Date().toISOString();
    const rows = [CLOUD_USERS_KEY, CLOUD_DATA_KEY, CLOUD_SETTINGS_KEY]
      .map(key => {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const value =
          key === CLOUD_USERS_KEY ? prepareUsersForCloud(raw) : (JSON.parse(raw) as unknown);
        return { key, value, updated_at: now };
      })
      .filter(Boolean) as { key: string; value: unknown; updated_at: string }[];

    if (!rows.length) {
      setSyncStatus("synced");
      return true;
    }

    const { error } = await sb.from("app_sync").upsert(rows, { onConflict: "key" });
    if (error) {
      const msg = error.message?.toLowerCase() ?? "";
      const code = (error as { code?: string }).code;
      if (code === "PGRST205" || msg.includes("does not exist") || msg.includes("schema cache")) {
        setSyncStatus("needs_setup");
        return false;
      }
      throw error;
    }

    const metaPatch: Partial<SyncMeta> = {};
    for (const row of rows) {
      if (row.key === CLOUD_USERS_KEY) metaPatch.usersAt = now;
      if (row.key === CLOUD_DATA_KEY) metaPatch.dataAt = now;
      if (row.key === CLOUD_SETTINGS_KEY) metaPatch.settingsAt = now;
    }
    writeSyncMeta(metaPatch);

    lastPushCompletedAt = Date.now();
    setSyncStatus("synced");
    return true;
  } catch {
    setSyncStatus("error");
    return false;
  }
}

export function cancelScheduledCloudPush(): void {
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
}

export function scheduleCloudPush(delayMs = 200): void {
  if (!isCloudEnabled()) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    void pushCloudStores();
  }, delayMs);
}

/** Push roster immediately (e.g. right after registrar enrolls a user). */
export async function pushUsersRosterNow(): Promise<boolean> {
  if (!isCloudEnabled()) return false;
  cancelScheduledCloudPush();
  return pushCloudStores();
}

/** Live updates when another device changes institutional data. */
export function subscribeCloudRealtime(onRemoteChange?: () => void): () => void {
  const sb = getSupabase();
  if (!sb) return () => {};

  if (realtimeChannel) {
    void sb.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }

  realtimeChannel = sb
    .channel("app_sync_changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "app_sync" },
      () => {
        // Skip pull if we just pushed — avoids push/pull race causing false "Sync issue"
        if (Date.now() - lastPushCompletedAt < 3000) return;
        void pullCloudStores().then(() => onRemoteChange?.());
      }
    )
    .subscribe();

  return () => {
    if (realtimeChannel) {
      void sb.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
  };
}

/** Keep sessions alive across tabs/devices; pull fresh data on token refresh. */
export function subscribeAuthStateChange(
  onChange: (event: string, hasSession: boolean) => void
): () => void {
  const sb = getSupabase();
  if (!sb) return () => {};

  const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
    onChange(event, Boolean(session));
    if (session && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
      void pullCloudStores();
    }
  });

  return () => subscription.unsubscribe();
}

export async function ensureCloudAuthSession(): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { data } = await sb.auth.getSession();
  return Boolean(data.session);
}
