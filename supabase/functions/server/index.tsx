import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

app.use("*", logger(console.log));
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

app.get("/make-server-626d5b05/health", (c) => c.json({ status: "ok" }));

// ─── Registrations ────────────────────────────────────────────────────────────

app.get("/make-server-626d5b05/registrations", async (c) => {
  const data = await kv.get("registrations");
  return c.json(data ? JSON.parse(data) : []);
});

app.post("/make-server-626d5b05/registrations", async (c) => {
  const body = await c.req.json();
  const current = await kv.get("registrations");
  const regs = current ? JSON.parse(current) : [];
  regs.push(body);
  await kv.set("registrations", JSON.stringify(regs));
  return c.json({ success: true, data: body });
});

app.put("/make-server-626d5b05/registrations/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const current = await kv.get("registrations");
  const regs = current ? JSON.parse(current) : [];
  const updated = regs.map((r: any) => r.id === id ? { ...r, ...body } : r);
  await kv.set("registrations", JSON.stringify(updated));
  return c.json({ success: true });
});

app.delete("/make-server-626d5b05/registrations/:id", async (c) => {
  const id = c.req.param("id");
  const current = await kv.get("registrations");
  const regs = current ? JSON.parse(current) : [];
  const filtered = regs.filter((r: any) => r.id !== id);
  await kv.set("registrations", JSON.stringify(filtered));
  return c.json({ success: true });
});

// ─── Scores ───────────────────────────────────────────────────────────────────

app.get("/make-server-626d5b05/scores", async (c) => {
  const data = await kv.get("scores");
  return c.json(data ? JSON.parse(data) : []);
});

app.post("/make-server-626d5b05/scores", async (c) => {
  const body = await c.req.json();
  const current = await kv.get("scores");
  const scores = current ? JSON.parse(current) : [];
  const idx = scores.findIndex((s: any) => s.studentId === body.studentId && s.courseCode === body.courseCode);
  if (idx >= 0) scores[idx] = body;
  else scores.push(body);
  await kv.set("scores", JSON.stringify(scores));
  return c.json({ success: true, data: body });
});

// ─── Users ────────────────────────────────────────────────────────────────────

app.get("/make-server-626d5b05/users", async (c) => {
  const data = await kv.get("users");
  return c.json(data ? JSON.parse(data) : []);
});

app.post("/make-server-626d5b05/users", async (c) => {
  const body = await c.req.json();
  const current = await kv.get("users");
  const users = current ? JSON.parse(current) : [];
  users.push(body);
  await kv.set("users", JSON.stringify(users));
  return c.json({ success: true, data: body });
});

// ─── Courses ──────────────────────────────────────────────────────────────────

app.get("/make-server-626d5b05/courses", async (c) => {
  const data = await kv.get("courses");
  return c.json(data ? JSON.parse(data) : []);
});

app.post("/make-server-626d5b05/courses", async (c) => {
  const body = await c.req.json();
  const current = await kv.get("courses");
  const courses = current ? JSON.parse(current) : [];
  courses.push(body);
  await kv.set("courses", JSON.stringify(courses));
  return c.json({ success: true, data: body });
});

Deno.serve(app.fetch);
