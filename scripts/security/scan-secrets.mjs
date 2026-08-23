import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const tracked = execFileSync("git", ["ls-files", "-co", "--exclude-standard", "-z"], { cwd: root, encoding: "utf8" }).split("\0").filter(Boolean);
const textExtensions = new Set([".js", ".mjs", ".cjs", ".ts", ".tsx", ".json", ".yml", ".yaml", ".md", ".css", ".html", ".toml", ".txt"]);
const knownPatterns = [
  ["GitHub token", new RegExp(["gh", "p_[A-Za-z0-9]{36,}"].join(""), "g")],
  ["GitHub OAuth token", new RegExp(["gh", "o_[A-Za-z0-9]{36,}"].join(""), "g")],
  ["OpenAI key", new RegExp(["sk-", "[A-Za-z0-9_-]{40,}"].join(""), "g")],
  ["AWS access key", new RegExp(["AK", "IA[0-9A-Z]{16}"].join(""), "g")],
  ["Private key", new RegExp(["-----BEGIN ", "(?:RSA |EC |OPENSSH )?PRIVATE KEY-----"].join(""), "g")],
  ["Assigned secret", /(?:token|secret|password|api[_-]?key)\s*[:=]\s*["'][A-Za-z0-9_./+=-]{20,}["']/gi],
];

const findings = [];
for (const relative of tracked) {
  const normalized = relative.replace(/\\/g, "/");
  if (normalized === "scripts/security/scan-secrets.mjs" || normalized.endsWith("pnpm-lock.yaml")) continue;
  if (/^\.env(?:\.|$)/.test(path.basename(normalized)) && !normalized.endsWith(".example")) {
    findings.push(`${normalized}: tracked environment file`);
    continue;
  }
  const absolute = path.join(root, relative);
  if (!existsSync(absolute)) continue;
  if (!textExtensions.has(path.extname(relative).toLowerCase()) || statSync(absolute).size > 1_000_000) continue;
  const content = readFileSync(absolute, "utf8");
  for (const [name, pattern] of knownPatterns) {
    pattern.lastIndex = 0;
    if (pattern.test(content)) findings.push(`${normalized}: ${name}`);
  }
}

if (findings.length) {
  console.error("Credential boundary failed:\n" + findings.map((finding) => `- ${finding}`).join("\n"));
  process.exit(1);
}
console.log(`Credential boundary passed across ${tracked.length} repository files.`);
