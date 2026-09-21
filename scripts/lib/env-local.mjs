// Tiny, dependency-free .env.local reader/writer for the setup helpers.
// The helpers run straight from `node`/`npm run` — no install needed.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export const ENV_LOCAL = path.join(process.cwd(), ".env.local");

const LINE = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/;

export function readEnvLocal(file = ENV_LOCAL) {
  const values = {};
  if (!existsSync(file)) return values;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(LINE);
    if (!match || line.trimStart().startsWith("#")) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[match[1]] = value;
  }
  return values;
}

/** process.env wins, then .env.local */
export function loadEnv(file = ENV_LOCAL) {
  const local = readEnvLocal(file);
  return (name) => process.env[name] || local[name] || "";
}

/** set keys in .env.local in place (keeps comments/order; appends new keys) */
export function upsertEnvLocal(updates, file = ENV_LOCAL) {
  const lines = existsSync(file) ? readFileSync(file, "utf8").split(/\r?\n/) : [];
  const pending = new Map(Object.entries(updates).filter(([, value]) => value));
  const next = lines.map((line) => {
    const match = line.match(LINE);
    if (!match || line.trimStart().startsWith("#") || !pending.has(match[1])) return line;
    const value = pending.get(match[1]);
    pending.delete(match[1]);
    return `${match[1]}=${value}`;
  });
  while (next.length && next[next.length - 1] === "") next.pop();
  if (pending.size) {
    if (next.length) next.push("");
    for (const [key, value] of pending) next.push(`${key}=${value}`);
  }
  writeFileSync(file, `${next.join("\n")}\n`, { mode: 0o600 });
}
