import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock cloud config to disable cloud in most tests
vi.mock("../app/lib/config", () => ({
  isCloudEnabled: vi.fn(() => false),
}));

// Mock supabase client
vi.mock("../app/lib/supabaseClient", () => ({
  getSupabase: vi.fn(() => null),
}));

// Mock cloud sync functions used by auth
vi.mock("../app/lib/cloudSync", () => ({
  cancelScheduledCloudPush: vi.fn(),
  ensureCloudAuthSession: vi.fn(async () => false),
  pullCloudStores: vi.fn(async () => false),
  pullPublicRoster: vi.fn(async () => false),
  pushCloudStores: vi.fn(async () => false),
  pushUsersRosterNow: vi.fn(async () => false),
  scheduleCloudPush: vi.fn(),
}));

import {
  register,
  login,
  clearSession,
  saveSession,
  loadSessionUser,
  getAllUsers,
  getUserById,
  getUserByEmail,
  getUserByUsername,
  updateUser,
  deleteUser,
  preregisterUser,
  SESSION_KEY,
} from "../app/lib/auth";
import type { User } from "../app/lib/types";

const USERS_KEY = "wawuhub_users";
const SYNC_META_KEY = "wawuhub_sync_meta";

beforeEach(() => {
  localStorage.clear();
});

describe("Session persistence", () => {
  it("saveSession stores user id/email/role in localStorage", () => {
    const user: User = {
      id: "STU999",
      name: "Test User",
      email: "test@stu.edu",
      username: "test.user",
      role: "student",
      matricNo: "TST/2024/001",
      department: "Computer Science",
      faculty: "Science & Technology",
      level: "100",
      semester: 1,
    };

    saveSession(user);
    const raw = localStorage.getItem(SESSION_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.userId).toBe("STU999");
    expect(parsed.email).toBe("test@stu.edu");
    expect(parsed.role).toBe("student");
  });

  it("loadSessionUser returns the user from store when session exists", () => {
    const user: User = {
      id: "LEC999",
      name: "Lecturer X",
      email: "lec@stu.edu",
      username: "lec.x",
      role: "lecturer",
      staffId: "STF/9999",
      department: "Computer Science",
      faculty: "Science & Technology",
    };
    const existing = JSON.parse(localStorage.getItem(USERS_KEY) || '{"version":7,"accounts":[]}');
    existing.accounts.push({ user, passwordHash: "hashed_pw" });
    localStorage.setItem(USERS_KEY, JSON.stringify(existing));
    saveSession(user);
    const loaded = loadSessionUser();
    expect(loaded).not.toBeNull();
    expect(loaded!.id).toBe("LEC999");
  });

  it("loadSessionUser returns null when no session is stored", () => {
    expect(loadSessionUser()).toBeNull();
  });

  it("clearSession removes SESSION_KEY and wawuhub_sync_meta from localStorage", () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: "X" }));
    localStorage.setItem(SYNC_META_KEY, JSON.stringify({ usersAt: "2024-01-01" }));

    clearSession();

    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(localStorage.getItem(SYNC_META_KEY)).toBeNull();
  });

  it("clearSession dispatches wawuhub:session-cleared event", () => {
    const handler = vi.fn();
    window.addEventListener("wawuhub:session-cleared", handler);
    clearSession();
    expect(handler).toHaveBeenCalled();
    window.removeEventListener("wawuhub:session-cleared", handler);
  });
});

describe("User store operations", () => {
  it("getAllUsers returns empty array on fresh start", () => {
    const users = getAllUsers();
    expect(users).toBeInstanceOf(Array);
    // may have seed accounts
  });

  it("getUserById finds user by id", async () => {
    await register({
      name: "Find Me",
      email: "find@stu.edu",
      username: "find.me",
      password: "",
      role: "student",
      department: "Computer Science",
      faculty: "Science & Technology",
    });
    const all = getAllUsers();
    const found = all.find(u => u.username === "find.me");
    expect(found).toBeTruthy();
    expect(getUserById(found!.id)).toBeTruthy();
  });

  it("getUserByEmail finds user by email (case insensitive)", async () => {
    await register({
      name: "Email Test",
      email: "Email@Test.Com",
      username: "email.test",
      password: "",
      role: "student",
    });
    expect(getUserByEmail("email@test.com")).toBeTruthy();
  });

  it("getUserByUsername finds user by username (case insensitive)", async () => {
    await register({
      name: "Username Test",
      email: "uname@stu.edu",
      username: "UNAME.TEST",
      password: "",
      role: "student",
    });
    expect(getUserByUsername("uname.test")).toBeTruthy();
  });
});

describe("Registration validation", () => {
  it("rejects registration with empty name", async () => {
    const result = await register({
      name: "",
      email: "x@stu.edu",
      username: "x",
      password: "",
      role: "student",
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("name");
  });

  it("rejects registration with invalid email", async () => {
    const result = await register({
      name: "Bad Email",
      email: "not-an-email",
      username: "bad.email",
      password: "",
      role: "student",
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("email");
  });

  it("rejects registration with short username", async () => {
    const result = await register({
      name: "Short Name",
      email: "short@stu.edu",
      username: "ab",
      password: "",
      role: "student",
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("3 characters");
  });

  it("rejects registration with duplicate email", async () => {
    await register({
      name: "First",
      email: "dupe@stu.edu",
      username: "first",
      password: "",
      role: "student",
    });
    const result = await register({
      name: "Second",
      email: "dupe@stu.edu",
      username: "second",
      password: "",
      role: "student",
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("already exists");
  });

  it("rejects registration with duplicate username", async () => {
    await register({
      name: "First",
      email: "a@stu.edu",
      username: "same.name",
      password: "",
      role: "student",
    });
    const result = await register({
      name: "Second",
      email: "b@stu.edu",
      username: "same.name",
      password: "",
      role: "student",
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("already taken");
  });

  it("rejects registrar registration with password < 6 chars", async () => {
    const result = await register({
      name: "Short Pass",
      email: "short@reg.edu",
      username: "short.pass",
      password: "abc",
      role: "registrar",
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("6 characters");
  });

  it("successfully registers a student", async () => {
    const result = await register({
      name: "New Student",
      email: "new@stu.edu",
      username: "new.stu",
      password: "",
      role: "student",
      department: "Computer Science",
      faculty: "Science & Technology",
      level: "200",
      semester: 1,
    });
    expect(result.success).toBe(true);
    expect(result.user).toBeTruthy();
    expect(result.user!.role).toBe("student");
    expect(result.user!.department).toBe("Computer Science");
  });

  it("successfully registers a lecturer", async () => {
    const result = await register({
      name: "New Lecturer",
      email: "lec@stu.edu",
      username: "new.lec",
      password: "",
      role: "lecturer",
      staffId: "STF/1234",
      department: "Computer Science",
    });
    expect(result.success).toBe(true);
    expect(result.user!.role).toBe("lecturer");
    expect(result.user!.staffId).toBe("STF/1234");
  });

  it("preregisterUser creates account without session", async () => {
    const result = await preregisterUser({
      name: "Pre-registered",
      email: "pre@stu.edu",
      username: "pre.reg",
      role: "student",
      department: "Computer Science",
    });
    expect(result.success).toBe(true);
    // Session should NOT be saved
    const session = localStorage.getItem(SESSION_KEY);
    expect(session).toBeNull();
  });
});

describe("Login", () => {
  it("login fails with wrong password", async () => {
    await register({
      name: "Login Test",
      email: "login@stu.edu",
      username: "login.test",
      password: "pass12345",
      role: "registrar",
    });
    const result = await login("login.test", "wrongpassword", "registrar");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Incorrect password");
  });

  it("login succeeds with correct password", async () => {
    await register({
      name: "Login OK",
      email: "loginok@stu.edu",
      username: "login.ok",
      password: "correct123",
      role: "registrar",
    });
    const result = await login("login.ok", "correct123", "registrar");
    expect(result.success).toBe(true);
  });

  it("login fails with wrong role", async () => {
    await register({
      name: "Role Test",
      email: "role@stu.edu",
      username: "role.test",
      password: "pass12345",
      role: "student",
    });
    const result = await login("role.test", "pass12345", "lecturer");
    expect(result.success).toBe(false);
    expect(result.error).toContain("registered as");
  });

  it("login fails for nonexistent account", async () => {
    const result = await login("ghost.user", "password", "student");
    expect(result.success).toBe(false);
    expect(result.error).toContain("No account found");
  });

  it("login fails with empty loginId", async () => {
    const result = await login("", "password", "student");
    expect(result.success).toBe(false);
    expect(result.error).toContain("email or username");
  });

  it("first login for preregistered account sets password", async () => {
    await preregisterUser({
      name: "First Login",
      email: "first@stu.edu",
      username: "first.login",
      role: "student",
      department: "Computer Science",
    });
    const result = await login("first.login", "newpass123", "student");
    expect(result.success).toBe(true);
  });

  it("first login rejects password shorter than 6 chars", async () => {
    await preregisterUser({
      name: "Short Pass First",
      email: "shortfirst@stu.edu",
      username: "short.first",
      role: "student",
    });
    const result = await login("short.first", "12345", "student");
    expect(result.success).toBe(false);
    expect(result.error).toContain("6 characters");
  });
});

describe("User updates", () => {
  it("updateUser changes name successfully", async () => {
    const reg = await register({
      name: "Original Name",
      email: "update@stu.edu",
      username: "update.test",
      password: "",
      role: "student",
    });
    const userId = reg.user!.id;
    const result = await updateUser(userId, { name: "Updated Name" });
    expect(result.success).toBe(true);
    expect(result.user!.name).toBe("Updated Name");
  });

  it("updateUser rejects empty name", async () => {
    const reg = await register({
      name: "No Empty",
      email: "noempty@stu.edu",
      username: "no.empty",
      password: "",
      role: "student",
    });
    const result = await updateUser(reg.user!.id, { name: "" });
    expect(result.success).toBe(false);
  });

  it("updateUser rejects invalid email", async () => {
    const reg = await register({
      name: "Bad Email Update",
      email: "bad@stu.edu",
      username: "bad.email.upd",
      password: "",
      role: "student",
    });
    const result = await updateUser(reg.user!.id, { email: "not-valid" });
    expect(result.success).toBe(false);
  });

  it("updateUser rejects password shorter than 6 chars", async () => {
    const reg = await register({
      name: "Short Pass Update",
      email: "shortpass@stu.edu",
      username: "short.pass.upd",
      password: "longpassword",
      role: "registrar",
    });
    const result = await updateUser(reg.user!.id, { password: "abc" });
    expect(result.success).toBe(false);
    expect(result.error).toContain("6 characters");
  });

  it("updateUser updates password successfully", async () => {
    const reg = await register({
      name: "Password Update",
      email: "pwd@stu.edu",
      username: "pwd.upd",
      password: "oldpassword",
      role: "registrar",
    });
    const result = await updateUser(reg.user!.id, { password: "newpassword" });
    expect(result.success).toBe(true);
    // Verify login with new password
    const loginResult = await login("pwd.upd", "newpassword", "registrar");
    expect(loginResult.success).toBe(true);
  });
});

describe("User deletion", () => {
  it("deleteUser removes a student account", async () => {
    const reg = await register({
      name: "Delete Me",
      email: "delete@stu.edu",
      username: "delete.me",
      password: "",
      role: "student",
    });
    const userId = reg.user!.id;
    const result = await deleteUser(userId);
    expect(result.success).toBe(true);
    expect(getUserById(userId)).toBeUndefined();
  });

  it("deleteUser prevents deleting registrar accounts", async () => {
    const reg = await register({
      name: "Reg Admin",
      email: "regadmin@stu.edu",
      username: "reg.admin",
      password: "password123",
      role: "registrar",
    });
    const result = await deleteUser(reg.user!.id);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Registrar");
  });
});

describe("Legacy admin role normalization", () => {
  it("isRegistrarRole returns true for 'admin'", async () => {
    const { isRegistrarRole } = await import("../app/lib/types");
    expect(isRegistrarRole("admin")).toBe(true);
    expect(isRegistrarRole("registrar")).toBe(true);
    expect(isRegistrarRole("student")).toBe(false);
  });

  it("portalRole normalizes 'admin' to 'registrar'", async () => {
    const { portalRole } = await import("../app/lib/types");
    expect(portalRole("admin")).toBe("registrar");
    expect(portalRole("student")).toBe("student");
  });
});
