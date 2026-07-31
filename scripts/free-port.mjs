import { execSync } from "node:child_process";

const port = Number(process.argv[2] || 5173);
let freed = false;

try {
  const out = execSync("netstat -ano -p tcp").toString();
  const rows = out.split(/\r?\n/).filter(line => {
    const parts = line.trim().split(/\s+/);
    return parts[1]?.endsWith(`:${port}`) && parts[3] === "LISTENING";
  });
  for (const row of rows) {
    const pid = Number(row.trim().split(/\s+/).pop());
    if (!pid || pid === process.pid) continue;
    try {
      process.kill(pid, "SIGKILL");
      console.log(`[free-port] Killed PID ${pid} occupying port ${port}.`);
      freed = true;
    } catch {
      // process already gone
    }
  }
} catch {
  // netstat unavailable; let the dev server handle it
}

if (freed) {
  // wait briefly so the port is fully released before vite binds
  await new Promise(resolve => setTimeout(resolve, 800));
}
