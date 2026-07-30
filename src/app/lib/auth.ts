import type { AccountLookupResult, AuthResult, RegisterInput, RegisterOptions, Role, UpdateUserInput, User } from "./types";
import { isRegistrarRole, portalRole } from "./types";
import { getFacultyForDepartment } from "./types";
import { isCloudEnabled } from "./config";
import { getSupabase } from "./supabaseClient";
import {
  cancelScheduledCloudPush,
  ensureCloudAuthSession,
  pullCloudStores,
  pullPublicRoster,
  pushCloudStores,
  pushUsersRosterNow,
  scheduleCloudPush,
} from "./cloudSync";
import { INSTITUTION_LECTURERS, REGISTRAR_PROFILE } from "./institution";

const AUTH_CLOUD_TIMEOUT_MS = 8_000;

function withAuthTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>(resolve => setTimeout(() => resolve(null), ms)),
  ]);
}

const USERS_KEY = "wawuhub_users";
const SESSION_KEY = "wawuhub_session";
const STORE_VERSION = 4;

interface StoredAccount {
  user: User;
  passwordHash: string | null;
}

interface UserStore {
  version: number;
  accounts: StoredAccount[];
}

type SeedUser = { user: Omit<User, "id"> & { id: string }; password?: string };

const SEED_STUDENTS: SeedUser[] = [
  { user: { id: "STU001", name: "Adaeze Okonkwo", username: "adaeze.ok", email: "adaeze@stu.edu", role: "student", matricNo: "CSC/2024/001", department: "Computer Science", faculty: "Science & Technology", level: "100", semester: 2, createdAt: "2024-01-01T00:00:00.000Z" } },
  { user: { id: "STU002", name: "Emeka Chukwu", username: "emeka.ch", email: "emeka@stu.edu", role: "student", matricNo: "BIO/2024/001", department: "Bioscience", faculty: "Science & Technology", level: "200", semester: 1, createdAt: "2024-01-01T00:00:00.000Z" } },
  { user: { id: "STU003", name: "Fatima Bello", username: "fatima.b", email: "fatima@stu.edu", role: "student", matricNo: "HRM/2024/001", department: "Human Resource Management", faculty: "Business Administration", level: "200", semester: 2, createdAt: "2024-01-01T00:00:00.000Z" } },
];

const SEED_LECTURERS: SeedUser[] = INSTITUTION_LECTURERS.map(lecturer => ({
  user: {
    id: lecturer.id,
    name: lecturer.name,
    username: lecturer.username,
    email: lecturer.email,
    role: "lecturer",
    staffId: lecturer.staffId,
    department: lecturer.department,
    faculty: getFacultyForDepartment(lecturer.department),
    createdAt: "2024-01-01T00:00:00.000Z",
  },
}));

const BUILTIN_SEED_IDS = new Set<string>([
  ...SEED_STUDENTS.map(seed => seed.user.id),
  ...SEED_LECTURERS.map(seed => seed.user.id),
  REGISTRAR_PROFILE.id,
]);

const SEED_REGISTRAR: SeedUser = {
  user: {
    id: REGISTRAR_PROFILE.id,
    name: REGISTRAR_PROFILE.name,
    username: REGISTRAR_PROFILE.username,
    email: REGISTRAR_PROFILE.email,
    role: "registrar",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  password: REGISTRAR_PROFILE.password,
};

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(`${password}:wawuhub:v1`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function deriveUsername(email: string, used: Set<string>): string {
  let base = email.split("@")[0].toLowerCase().replace(/[^a-z0-9._]/g, "") || "user";
  let candidate = base;
  let n = 1;
  while (used.has(candidate)) {
    candidate = `${base}${n++}`;
  }
  return candidate;
}

function readStore(): UserStore {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return { version: STORE_VERSION, accounts: [] };
    const parsed = JSON.parse(raw) as Partial<UserStore>;
    if (!Array.isArray(parsed.accounts)) {
      return { version: STORE_VERSION, accounts: [] };
    }
    return {
      version: typeof parsed.version === "number" ? parsed.version : STORE_VERSION,
      accounts: parsed.accounts,
    };
  } catch {
    return { version: STORE_VERSION, accounts: [] };
  }
}

function writeStore(store: UserStore): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(store));
  window.dispatchEvent(new CustomEvent("wawuhub:users-changed"));
  scheduleCloudPush();
}

/** Cloud auth errors that should not block local registrar onboarding */
function isNonBlockingCloudAuthError(message: string | undefined): boolean {
  if (!message) return true;
  const msg = message.toLowerCase();
  return (
    msg.includes("rate limit") ||
    msg.includes("too many requests") ||
    msg.includes("email not confirmed") ||
    msg.includes("network") ||
    msg.includes("fetch") ||
    msg.includes("timeout") ||
    msg.includes("503") ||
    msg.includes("502")
  );
}

function friendlyCloudAuthError(message: string): string {
  const msg = message.toLowerCase();
  if (msg.includes("rate limit")) {
    return "Cloud sign-up is temporarily rate-limited. Your registrar account was created on this device - sign in with the same credentials. Multi-device sync will connect when Supabase allows it (usually within an hour).";
  }
  if (msg.includes("email not confirmed")) {
    return 'Check your email to confirm your address, or disable "Confirm email" in Supabase Auth settings. You can sign in on this device now.';
  }
  if (msg.includes("already") || msg.includes("registered")) {
    return "This email is already registered in the cloud. Sign in with your password, or use a different email.";
  }
  return message;
}

function isInvalidCloudCredentials(message: string | undefined): boolean {
  const msg = message?.toLowerCase() ?? "";
  return msg.includes("invalid login") || msg.includes("invalid credentials");
}

function firstLoginCloudMismatchError(email: string): string {
  return `Cloud sign-in for ${email} is already linked to a different password. Use that existing cloud password, or ask the registrar to assign a different email before creating your first password.`;
}

async function establishCloudSession(
  email: string,
  password: string,
  user: User,
  options?: { allowSignUp?: boolean }
): Promise<void> {
  const sb = getSupabase();
  if (!sb || !isCloudEnabled()) return;

  const normalizedEmail = normalizeEmail(email);
  const role = portalRole(user.role);

  try {
    const signInResult = await withAuthTimeout(
      sb.auth.signInWithPassword({ email: normalizedEmail, password }),
      AUTH_CLOUD_TIMEOUT_MS
    );
    if (!signInResult) return;

    let signInError = signInResult.error;

    if (signInError && options?.allowSignUp) {
      const signInMsg = signInError.message.toLowerCase();
      if (!signInMsg.includes("rate limit") && !signInMsg.includes("too many")) {
        const signUpResult = await withAuthTimeout(
          sb.auth.signUp({
            email: normalizedEmail,
            password,
            options: {
              data: { username: user.username, full_name: user.name, role },
            },
          }),
          AUTH_CLOUD_TIMEOUT_MS
        );

        if (signUpResult && !signUpResult.error) {
          await withAuthTimeout(
            sb.auth.signInWithPassword({ email: normalizedEmail, password }),
            AUTH_CLOUD_TIMEOUT_MS
          );
        } else if (signUpResult?.error) {
          const msg = signUpResult.error.message.toLowerCase();
          if (msg.includes("already") || msg.includes("registered")) {
            await withAuthTimeout(
              sb.auth.signInWithPassword({ email: normalizedEmail, password }),
              AUTH_CLOUD_TIMEOUT_MS
            );
          }
        }
      }
    }

    void pullCloudStores();
    void pushCloudStores();
  } catch {
    /* cloud link is best-effort - local session already saved */
  }
}

/**
 * Prevent first-login password drift by requiring Supabase to accept or create
 * the same password before it is saved locally.
 */
async function ensureCloudPasswordAlignment(user: User, password: string): Promise<string | null> {
  if (!isCloudEnabled() || !user.email) return null;

  const sb = getSupabase();
  if (!sb) return null;

  const email = normalizeEmail(user.email);
  const role = portalRole(user.role);

  try {
    const signInResult = await withAuthTimeout(
      sb.auth.signInWithPassword({ email, password }),
      AUTH_CLOUD_TIMEOUT_MS
    );
    if (!signInResult) {
      return "Cloud sign-in timed out. Try again so your first password stays synced across devices.";
    }

    if (signInResult.data.session) return null;

    const signInMessage = signInResult.error?.message ?? "";
    const signInMsg = signInMessage.toLowerCase();

    if (signInMsg.includes("email not confirmed")) {
      return null;
    }

    if (!isInvalidCloudCredentials(signInMessage)) {
      return friendlyCloudAuthError(signInMessage || "Cloud sign-in is unavailable right now.");
    }

    const signUpResult = await withAuthTimeout(
      sb.auth.signUp({
        email,
        password,
        options: {
          data: { username: user.username, full_name: user.name, role },
        },
      }),
      AUTH_CLOUD_TIMEOUT_MS
    );
    if (!signUpResult) {
      return "Cloud sign-up timed out. Try again so your first password stays synced across devices.";
    }

    const identities = signUpResult.data.user?.identities;
    if (!signUpResult.error) {
      if (Array.isArray(identities) && identities.length === 0) {
        return firstLoginCloudMismatchError(email);
      }
      return null;
    }

    const signUpMsg = signUpResult.error.message.toLowerCase();
    if (signUpMsg.includes("already") || signUpMsg.includes("registered") || signUpMsg.includes("exists")) {
      return firstLoginCloudMismatchError(email);
    }
    return friendlyCloudAuthError(signUpResult.error.message);
  } catch {
    return "Cloud sign-in is unavailable right now. Try again so your first password stays synced across devices.";
  }
}

/** Persist session and best-effort cloud link after local auth succeeds. */
async function finalizeAuthSuccess(user: User, password: string): Promise<AuthResult> {
  saveSession(user);
  if (isCloudEnabled() && user.email) {
    void establishCloudSession(user.email, password, user, { allowSignUp: true });
  }
  return { success: true, user };
}

async function cloudSignUpRegistrar(
  email: string,
  password: string,
  username: string,
  name: string
): Promise<AuthResult | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const normalizedEmail = normalizeEmail(email);

  // Prefer sign-in when the cloud account already exists (avoids extra signUp calls)
  const { data: existing, error: signInError } = await sb.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });
  if (existing.session) return null;

  const signInMsg = signInError?.message?.toLowerCase() ?? "";
  if (signInMsg.includes("rate limit") || signInMsg.includes("too many")) {
    return { success: false, error: signInError!.message };
  }
  if (signInMsg.includes("invalid login") || signInMsg.includes("invalid credentials")) {
    const { error: signUpError } = await sb.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: { username, full_name: name, role: "registrar" },
      },
    });
    if (!signUpError) {
      await sb.auth.signInWithPassword({ email: normalizedEmail, password }).catch(() => {});
      return null;
    }
    const upMsg = signUpError.message.toLowerCase();
    if (upMsg.includes("already") || upMsg.includes("registered")) {
      const retry = await sb.auth.signInWithPassword({ email: normalizedEmail, password });
      if (!retry.error) return null;
      return { success: false, error: retry.error.message };
    }
    return { success: false, error: signUpError.message };
  }

  if (signInError) return { success: false, error: signInError.message };
  return null;
}

export async function restoreCloudSession(): Promise<User | null> {
  const localUser = loadSessionUser();
  if (!isCloudEnabled()) return localUser;

  const sb = getSupabase();
  if (!sb) return localUser;

  try {
    const sessionResult = await withAuthTimeout(sb.auth.getSession(), 4_000);
    if (!sessionResult) return localUser;

    const { data } = sessionResult;
    if (!data.session?.user?.email) return localUser;

    await pullCloudStores();

    const cloudUser = getUserByEmail(data.session.user.email);
    if (cloudUser) {
      saveSession(cloudUser);
      return cloudUser;
    }
  } catch {
    /* fall back to local session */
  }

  return localUser;
}

function findAccountByLogin(loginId: string, store: UserStore): StoredAccount | undefined {
  const trimmed = loginId.trim();
  const normalizedEmail = normalizeEmail(trimmed);
  const normalizedUsername = normalizeUsername(trimmed);
  return store.accounts.find(a =>
    normalizeEmail(a.user.email) === normalizedEmail ||
    normalizeUsername(a.user.username) === normalizedUsername
  );
}

function resolveEmailForLogin(loginId: string, store: UserStore): string | null {
  const trimmed = loginId.trim();
  if (trimmed.includes("@")) return normalizeEmail(trimmed);
  return findAccountByLogin(trimmed, store)?.user.email ?? null;
}

async function tryVerifyCloudPassword(email: string, password: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb || !isCloudEnabled()) return false;

  const result = await withAuthTimeout(
    sb.auth.signInWithPassword({ email: normalizeEmail(email), password }),
    AUTH_CLOUD_TIMEOUT_MS
  );
  return Boolean(result?.data?.session);
}

/** When Supabase auth succeeds but roster row is missing locally (new device). */
async function provisionLocalAccountFromCloud(
  loginId: string,
  password: string,
  role: Role
): Promise<StoredAccount | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const sessionResult = await withAuthTimeout(sb.auth.getSession(), AUTH_CLOUD_TIMEOUT_MS);
  const sessionUser = sessionResult?.data?.session?.user;
  if (!sessionUser?.email) return null;

  const email = normalizeEmail(sessionUser.email);
  const loginEmail = resolveEmailForLogin(loginId, readStore());
  if (loginEmail && loginEmail !== email) return null;

  const meta = sessionUser.user_metadata ?? {};
  const accountRole = portalRole(String(meta.role || role));
  if (portalRole(accountRole) !== portalRole(role)) return null;

  const used = new Set(readStore().accounts.map(a => normalizeUsername(a.user.username)));
  const user: User = {
    id: generateId(accountRole),
    name: String(meta.full_name || meta.name || email.split("@")[0]),
    email,
    username: normalizeUsername(String(meta.username || deriveUsername(email, used))),
    role: accountRole,
    department: typeof meta.department === "string" ? meta.department : undefined,
    faculty: typeof meta.faculty === "string" ? meta.faculty : undefined,
    createdAt: new Date().toISOString(),
    ...(accountRole === "student"
      ? {
          matricNo: typeof meta.matric_no === "string" ? meta.matric_no : generateMatricNo(),
          level: typeof meta.level === "string" ? meta.level : "100",
          semester: typeof meta.semester === "number" ? meta.semester : 1,
        }
      : {}),
    ...(accountRole === "lecturer" && typeof meta.staff_id === "string"
      ? { staffId: meta.staff_id }
      : accountRole === "lecturer"
        ? { staffId: generateStaffId() }
        : {}),
  };

  const account: StoredAccount = {
    user,
    passwordHash: await hashPassword(password),
  };

  const store = readStore();
  if (store.accounts.some(a => normalizeEmail(a.user.email) === email)) return null;
  store.accounts.push(account);
  writeStore(store);
  return account;
}

async function syncBuiltInAccounts(store: UserStore): Promise<boolean> {
  const seedEntries: SeedUser[] = [...SEED_STUDENTS, ...SEED_LECTURERS, SEED_REGISTRAR];
  let changed = false;

  const filtered = store.accounts.filter(account => {
    if (!/^(STU|LEC|REG)\d{3}$/.test(account.user.id)) return true;
    return BUILTIN_SEED_IDS.has(account.user.id);
  });
  if (filtered.length !== store.accounts.length) {
    store.accounts = filtered;
    changed = true;
  }

  for (const seed of seedEntries) {
    const existing = store.accounts.find(account => account.user.id === seed.user.id);
    if (existing) {
      const nextUser: User = {
        ...existing.user,
        ...(seed.user as User),
        avatar: existing.user.avatar,
      };
      if (JSON.stringify(existing.user) !== JSON.stringify(nextUser)) {
        existing.user = nextUser;
        changed = true;
      }
      if (seed.password && !existing.passwordHash) {
        existing.passwordHash = await hashPassword(seed.password);
        changed = true;
      }
      continue;
    }

    if (store.accounts.some(account => normalizeEmail(account.user.email) === normalizeEmail(seed.user.email))) {
      continue;
    }
    if (store.accounts.some(account => normalizeUsername(account.user.username) === normalizeUsername(seed.user.username))) {
      continue;
    }

    store.accounts.push({
      user: seed.user as User,
      passwordHash: seed.password ? await hashPassword(seed.password) : null,
    });
    changed = true;
  }

  return changed;
}

async function migrateStore(store: UserStore): Promise<boolean> {
  let changed = false;
  const usedUsernames = new Set<string>();

  store.accounts.forEach(a => {
    if (a.user.username) usedUsernames.add(normalizeUsername(a.user.username));
  });

  for (const account of store.accounts) {
    if (!account.user.username) {
      account.user.username = deriveUsername(account.user.email, usedUsernames);
      usedUsernames.add(account.user.username);
      changed = true;
    }
  }

  if (store.version < STORE_VERSION) {
    for (const account of store.accounts) {
      if ((account.user.role as string) === "admin") {
        account.user.role = "registrar";
        changed = true;
      }
      if (account.user.id === "ADM001") {
        account.user.id = "REG001";
        account.user.role = "registrar";
        changed = true;
      }
    }
    if (await syncBuiltInAccounts(store)) {
      changed = true;
    }
    store.version = STORE_VERSION;
    changed = true;
  }

  return changed;
}

async function seedIfEmpty(): Promise<void> {
  const store = readStore();
  if (store.accounts.length > 0) {
    if (await migrateStore(store)) writeStore(store);
    return;
  }

  const allSeeds: SeedUser[] = [...SEED_STUDENTS, ...SEED_LECTURERS, SEED_REGISTRAR];
  const accounts: StoredAccount[] = [];
  for (const entry of allSeeds) {
    accounts.push({
      user: entry.user as User,
      passwordHash: entry.password ? await hashPassword(entry.password) : null,
    });
  }
  writeStore({ version: STORE_VERSION, accounts });
}

let initialized = false;

export async function initAuth(): Promise<void> {
  if (initialized) return;
  await seedIfEmpty();
  initialized = true;
}

export function getAllUsers(): User[] {
  return readStore().accounts.map(a => a.user);
}

export function getUserById(id: string): User | undefined {
  return getAllUsers().find(u => u.id === id);
}

export function getUserByEmail(email: string): User | undefined {
  const normalized = normalizeEmail(email);
  return readStore().accounts.find(a => normalizeEmail(a.user.email) === normalized)?.user;
}

export function getUserByUsername(username: string): User | undefined {
  const normalized = normalizeUsername(username);
  return readStore().accounts.find(a => normalizeUsername(a.user.username) === normalized)?.user;
}

function generateId(role: Role): string {
  const prefix = role === "student" ? "STU" : role === "lecturer" ? "LEC" : role === "dean" ? "DEAN" : "REG";
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

function generateMatricNo(): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 900) + 100;
  return `GEN/${year}/${seq}`;
}

function generateStaffId(): string {
  return `STF/${Math.floor(Math.random() * 9000) + 1000}`;
}

function validateUsername(username: string): string | null {
  const u = normalizeUsername(username);
  if (u.length < 3) return "Username must be at least 3 characters.";
  if (u.length > 30) return "Username must be 30 characters or fewer.";
  if (!/^[a-z0-9._]+$/.test(u)) return "Username may only contain lowercase letters, numbers, dots, and underscores.";
  return null;
}

function buildUser(input: RegisterInput): User {
  const faculty = input.faculty?.trim() || getFacultyForDepartment(input.department || "") || "General";
  const base: User = {
    id: generateId(input.role),
    name: input.name.trim(),
    email: normalizeEmail(input.email),
    username: normalizeUsername(input.username),
    role: input.role,
    department: input.department?.trim() || undefined,
    faculty,
    phone: input.phone?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };

  if (input.role === "student") {
    return {
      ...base,
      matricNo: input.matricNo || generateMatricNo(),
      level: input.level || "100",
      semester: input.semester ?? 1,
    };
  }

  if (input.role === "lecturer" || input.role === "dean") {
    return { ...base, staffId: input.staffId || generateStaffId() };
  }

  return base;
}

function isUsernameTaken(username: string, excludeUserId?: string): boolean {
  const normalized = normalizeUsername(username);
  return readStore().accounts.some(
    a => normalizeUsername(a.user.username) === normalized && a.user.id !== excludeUserId
  );
}

function isEmailTaken(email: string, excludeUserId?: string): boolean {
  const normalized = normalizeEmail(email);
  return readStore().accounts.some(
    a => normalizeEmail(a.user.email) === normalized && a.user.id !== excludeUserId
  );
}

export async function lookupAccountForLogin(loginId: string, role: Role): Promise<AccountLookupResult> {
  await initAuth();

  if (!loginId.trim()) {
    return { found: false, needsPassword: false, error: "Enter your email or username." };
  }

  if (isCloudEnabled()) {
    const hasSession = await ensureCloudAuthSession();
    if (hasSession) {
      await pullCloudStores();
    } else {
      await pullPublicRoster();
    }
  }

  const account = findAccountByLogin(loginId, readStore());
  if (!account) {
    return {
      found: false,
      needsPassword: false,
      error: "No account found. Use the username or email assigned by the registrar, or contact them to create your account.",
    };
  }

  if (portalRole(account.user.role) !== portalRole(role)) {
    return {
      found: false,
      needsPassword: false,
      error: `This account is registered as a ${portalRole(account.user.role)}. Please select the correct role.`,
    };
  }

  return {
    found: true,
    needsPassword: !account.passwordHash,
    user: account.user,
  };
}

export async function register(input: RegisterInput, options?: RegisterOptions): Promise<AuthResult> {
  await initAuth();

  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const username = normalizeUsername(input.username);
  const password = input.password?.trim() || "";

  if (!name) return { success: false, error: "Full name is required." };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Please enter a valid email address." };
  }
  const usernameError = validateUsername(username);
  if (usernameError) return { success: false, error: usernameError };
  if (isRegistrarRole(input.role) && password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters." };
  }
  if (isCloudEnabled()) {
    const hasSession = await ensureCloudAuthSession();
    if (hasSession) await pullCloudStores();
    else await pullPublicRoster();
  }
  if (isEmailTaken(email)) {
    return { success: false, error: "An account with this email already exists." };
  }
  if (isUsernameTaken(username)) {
    return { success: false, error: "This username is already taken. Choose a different one." };
  }

  const user = buildUser({ ...input, email, name, username });
  const passwordHash = password ? await hashPassword(password) : null;

  let cloudWarning: string | undefined;

  if (isCloudEnabled() && isRegistrarRole(input.role) && password) {
    const cloudErr = await cloudSignUpRegistrar(email, password, username, name);
    if (cloudErr && !cloudErr.success) {
      if (isNonBlockingCloudAuthError(cloudErr.error)) {
        cloudWarning = friendlyCloudAuthError(cloudErr.error!);
      } else {
        return { success: false, error: friendlyCloudAuthError(cloudErr.error!) };
      }
    }
  }

  const store = readStore();
  store.accounts.push({ user, passwordHash });
  writeStore(store);

  const establishSession = options?.establishSession ?? true;
  if (establishSession) {
    saveSession(user);
  }

  let syncWarning = cloudWarning;
  if (isCloudEnabled()) {
    if (establishSession && isRegistrarRole(input.role) && password && !cloudWarning) {
      void establishCloudSession(email, password, user, { allowSignUp: true }).then(() => {
        void pushCloudStores();
      });
    } else if (!establishSession) {
      // Ensure cloud session is active before pushing new user roster
      const hasSession = await ensureCloudAuthSession();
      if (!hasSession) {
        // Try to establish a session using the registrar's existing credentials
        const sb = getSupabase();
        if (sb) {
          const { data: sessionData } = await sb.auth.getSession();
          if (!sessionData.session) {
            syncWarning = syncWarning ?? "Account saved locally. Sign in as registrar with cloud sync enabled to share the roster with other devices.";
          }
        }
      }
      const pushed = await pushUsersRosterNow();
      if (!pushed) {
        // Retry once after a short delay in case of transient failure
        await new Promise(r => setTimeout(r, 500));
        const retried = await pushUsersRosterNow();
        if (!retried && (await ensureCloudAuthSession())) {
          syncWarning = syncWarning ?? "Account saved locally but cloud roster sync failed. Try again while signed in as registrar.";
        } else if (!retried) {
          syncWarning = syncWarning ?? "Account saved on this device. Sign in as registrar with cloud sync enabled to share the roster with other devices.";
        }
      }
    } else {
      void pushCloudStores();
    }
  }

  return { success: true, user, warning: syncWarning };
}

export async function preregisterUser(input: Omit<RegisterInput, "password" | "role"> & { role: "student" | "lecturer" | "dean" }): Promise<AuthResult> {
  return register({ ...input, password: "" }, { establishSession: false });
}

export async function login(loginId: string, password: string, role: Role): Promise<AuthResult> {
  await initAuth();

  if (!loginId.trim()) {
    return { success: false, error: "Enter your email or username." };
  }

  if (isCloudEnabled()) {
    const hasSession = await ensureCloudAuthSession();
    if (hasSession) await pullCloudStores();
    else await pullPublicRoster();
  }

  let store = readStore();
  let account = findAccountByLogin(loginId, store);

  if (!account && isCloudEnabled()) {
    const email = resolveEmailForLogin(loginId, store) ?? (loginId.includes("@") ? normalizeEmail(loginId) : null);
    if (email && (await tryVerifyCloudPassword(email, password))) {
      await pullCloudStores();
      store = readStore();
      account = findAccountByLogin(loginId, store);
      if (!account) {
        account = await provisionLocalAccountFromCloud(loginId, password, role) ?? undefined;
        if (account) store = readStore();
      }
    }
  }

  if (!account) {
    return {
      success: false,
      error: "No account found. Use the username or email assigned by the registrar, or contact them to create your account.",
    };
  }

  if (portalRole(account.user.role) !== portalRole(role)) {
    return {
      success: false,
      error: `This account is registered as a ${portalRole(account.user.role)}. Please select the correct role.`,
    };
  }

  if (!account.passwordHash) {
    const nextPassword = password.trim();
    if (nextPassword.length < 6) {
      return {
        success: false,
        error: "Create a personal password (minimum 6 characters). This is not provided by the registrar.",
      };
    }

    if (isCloudEnabled()) {
      const cloudAlignmentError = await ensureCloudPasswordAlignment(account.user, nextPassword);
      if (cloudAlignmentError) {
        return { success: false, error: cloudAlignmentError };
      }
    }

    account.passwordHash = await hashPassword(nextPassword);
    writeStore(store);
    return finalizeAuthSuccess(account.user, nextPassword);
  }

  const passwordHash = await hashPassword(password);
  if (account.passwordHash !== passwordHash) {
    const email = account.user.email;
    if (isCloudEnabled() && email && (await tryVerifyCloudPassword(email, password))) {
      account.passwordHash = passwordHash;
      const idx = store.accounts.findIndex(a => a.user.id === account!.user.id);
      if (idx >= 0) {
        store.accounts[idx].passwordHash = passwordHash;
        writeStore(store);
      }
      return finalizeAuthSuccess(account.user, password);
    }
    return { success: false, error: "Incorrect password. Please try again." };
  }

  return finalizeAuthSuccess(account.user, password);
}

export async function updateUser(userId: string, input: UpdateUserInput): Promise<AuthResult> {
  await initAuth();
  const store = readStore();
  const idx = store.accounts.findIndex(a => a.user.id === userId);
  if (idx < 0) return { success: false, error: "User not found." };

  const account = store.accounts[idx];
  const user = { ...account.user };

  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) return { success: false, error: "Name cannot be empty." };
    user.name = name;
  }
  if (input.email !== undefined) {
    const email = normalizeEmail(input.email);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: "Invalid email address." };
    }
    if (isEmailTaken(email, userId)) return { success: false, error: "Email already in use." };
    user.email = email;
  }
  if (input.username !== undefined) {
    const usernameError = validateUsername(input.username);
    if (usernameError) return { success: false, error: usernameError };
    const username = normalizeUsername(input.username);
    if (isUsernameTaken(username, userId)) return { success: false, error: "Username already taken." };
    user.username = username;
  }
  if (input.department !== undefined) user.department = input.department.trim() || undefined;
  if (input.faculty !== undefined) user.faculty = input.faculty.trim() || undefined;
  if (input.level !== undefined) user.level = input.level;
  if (input.semester !== undefined) user.semester = input.semester;
  if (input.staffId !== undefined) user.staffId = input.staffId.trim() || undefined;
  if (input.matricNo !== undefined) user.matricNo = input.matricNo.trim() || undefined;
  if (input.avatar !== undefined) user.avatar = input.avatar || undefined;
  if (input.phone !== undefined) user.phone = input.phone.trim() || undefined;

  store.accounts[idx].user = user;

  if (input.password && input.password.length >= 6) {
    store.accounts[idx].passwordHash = await hashPassword(input.password);
  } else if (input.password && input.password.length > 0) {
    return { success: false, error: "Password must be at least 6 characters." };
  }

  writeStore(store);

  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const session = JSON.parse(raw) as { userId?: string };
      if (session.userId === userId) saveSession(user);
    }
  } catch {
    /* ignore */
  }

  if (isCloudEnabled() && input.password && input.password.length >= 6 && user.email) {
    void establishCloudSession(user.email, input.password, user, { allowSignUp: false });
  }

  return { success: true, user };
}

export async function deleteUser(userId: string): Promise<AuthResult> {
  await initAuth();
  const store = readStore();
  const account = store.accounts.find(a => a.user.id === userId);
  if (!account) return { success: false, error: "User not found." };
  if (isRegistrarRole(account.user.role)) {
    return { success: false, error: "Registrar accounts cannot be deleted." };
  }

  store.accounts = store.accounts.filter(a => a.user.id !== userId);
  writeStore(store);

  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const session = JSON.parse(raw) as { userId?: string };
      if (session.userId === userId) void clearSession();
    }
  } catch {
    /* ignore */
  }

  return { success: true, user: account.user };
}

export function saveSession(user: User): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    userId: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    savedAt: new Date().toISOString(),
  }));
}

export function loadSessionUser(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { userId } = JSON.parse(raw);
    return getUserById(userId) ?? null;
  } catch {
    return null;
  }
}

export function resolveSessionUser(currentUser: User | null): User | null {
  const found = loadSessionUser();
  if (!found) return null;
  if (!currentUser || currentUser.id === found.id) return found;
  return currentUser;
}

export async function clearSession(): Promise<void> {
  cancelScheduledCloudPush();
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem("wawuhub_sync_meta");
  window.dispatchEvent(new CustomEvent("wawuhub:session-cleared"));
  try {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut({ scope: "local" });
  } catch {
    /* Supabase sign-out is best-effort — local session is already cleared */
  }
}

export { SESSION_KEY };
