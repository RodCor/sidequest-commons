const FIELD_HEADINGS = Object.freeze({
  name: "Project name",
  category: "Category",
  problem: "Problem to solve",
  audience: "Who it helps",
  mvp: "The smallest useful version",
  success: "Success looks like",
  whyNow: "Why now",
  boundaries: "Safety boundaries",
});

const REQUIRED_ACKNOWLEDGEMENTS = Object.freeze([
  "does not seek credentials",
  "stars are optional",
  "selected build will be open source",
]);

const MACHINE_PROPOSAL_KEYS = Object.freeze([
  "kind",
  "schemaVersion",
  "name",
  "category",
  "problem",
  "audience",
  "smallestUsefulVersion",
  "successCriteria",
  "whyNow",
  "safety",
]);

const MACHINE_SAFETY_KEYS = Object.freeze([
  "noForbiddenCapabilities",
  "starsOptional",
  "openSourceBuild",
]);

export const ALLOWED_CATEGORIES = Object.freeze([
  "Accessibility",
  "Climate & environment",
  "Creativity",
  "Civic utility",
  "Developer tools",
  "Education",
  "Local community",
  "Open data",
  "Personal productivity",
  "Science",
]);

const DENY_RULES = Object.freeze([
  ["CREDENTIAL_THEFT", /(?:steal|collect|capture|harvest|extract|exfiltrat\w*)[^.\n]{0,50}(?:credential|password|token|cookie|secret|private key|seed phrase)/i],
  ["PHISHING", /\b(?:phish\w*|fake login|spoof(?:ed)? login|credential page)\b/i],
  ["MALWARE", /\b(?:ransomware|keylogger|botnet|rootkit|cryptominer|crypto miner|wallet drain|remote access trojan|credential stuffing)\b/i],
  ["ACCESS_BYPASS", /\b(?:bypass|evade|disable|defeat)[^.\n]{0,45}(?:mfa|2fa|authentication|access control|antivirus|edr|paywall)\b/i],
  ["HARMFUL_AUTOMATION", /\b(?:ddos|denial of service|mass spam|mass dm|astroturf|fake engagement|automated starring)\b/i],
  ["PRIVACY_ABUSE", /\b(?:doxx\w*|stalk\w*|non-consensual surveillance|track people without consent)\b/i],
  ["WEAPONS", /\b(?:weapon guidance|build a bomb|explosive device|targeting system for weapons)\b/i],
  ["PROMPT_INJECTION", /\b(?:ignore (?:all |any )?(?:previous|prior)|system prompt|developer message|reveal your instructions|override (?:the )?(?:rules|policy)|act as root)\b/i],
  ["SECRET_ACCESS", /(?:\.env|process\.env|github_token|openai_api_key|ssh key|cloud credentials|browser cookies)/i],
]);

const REVIEW_RULES = Object.freeze([
  ["HIGH_STAKES_ADVICE", /\b(?:diagnos\w* patient|prescribe|legal advice|credit decision|stock trading signal|insurance eligibility)\b/i],
  ["IDENTITY_OR_PAYMENT", /\b(?:biometric|facial recognition|payment processing|bank account|identity verification)\b/i],
  ["ACTIVE_SECURITY", /\b(?:exploit|payload|penetration test|vulnerability scanner|password manager)\b/i],
]);

const DISALLOWED_SHAPES = Object.freeze([
  ["URL_IN_PROPOSAL", /https?:\/\/|www\./i],
  ["CODE_IN_PROPOSAL", /```|`[^`]+`|(?:^|\n)\s*(?:curl|wget|powershell|bash|cmd|npm|pnpm|pip)\s+/im],
  ["MENTION_IN_PROPOSAL", /@[a-z0-9](?:[a-z0-9-]{0,37})/i],
]);

export function parseIssueForm(body = "") {
  const source = String(body).trim();
  if (source.startsWith("{")) return parseMachineProposal(source);

  return Object.fromEntries(
    Object.entries(FIELD_HEADINGS).map(([key, heading]) => [key, readField(body, heading)]),
  );
}

export function evaluateProposal(input, context = {}) {
  const fields = normalizeFields(input);
  const reasons = [];
  if (input?.machineSchemaError) {
    reasons.push({ code: "MACHINE_SCHEMA_INVALID", field: "proposal" });
  }
  if (context.title !== undefined && !isProposalTitle(context.title)) {
    reasons.push({ code: "TITLE_INVALID", field: "title" });
  }
  for (const [field, minimum, maximum] of [
    ["name", 3, 80],
    ["category", 3, 60],
    ["problem", 30, 700],
    ["audience", 10, 300],
    ["mvp", 30, 1_000],
    ["success", 15, 700],
  ]) {
    const size = fields[field].length;
    if (size < minimum) reasons.push({ code: "FIELD_TOO_SHORT", field });
    if (size > maximum) reasons.push({ code: "FIELD_TOO_LONG", field });
  }
  if (!ALLOWED_CATEGORIES.includes(fields.category)) reasons.push({ code: "CATEGORY_NOT_ALLOWED", field: "category" });
  const acknowledgements = fields.boundaries.toLowerCase();
  if (!REQUIRED_ACKNOWLEDGEMENTS.every((text) => acknowledgements.includes(text))) {
    reasons.push({ code: "BOUNDARY_ACKNOWLEDGEMENT_MISSING", field: "boundaries" });
  }

  const corpus = Object.values(fields).join("\n");
  for (const [code, pattern] of DENY_RULES) if (pattern.test(corpus)) reasons.push({ code, field: "proposal" });
  for (const [code, pattern] of DISALLOWED_SHAPES) if (pattern.test(corpus)) reasons.push({ code, field: "proposal" });
  const reviewReasons = [];
  for (const [code, pattern] of REVIEW_RULES) if (pattern.test(corpus)) reviewReasons.push({ code, field: "proposal" });

  const denied = reasons.length > 0;
  return {
    verdict: denied ? "deny" : reviewReasons.length ? "review" : "allow",
    reasons: denied ? dedupeReasons(reasons) : dedupeReasons(reviewReasons),
    fields,
  };
}

export function isProposalTitle(value) {
  const title = String(value ?? "").normalize("NFKC").trim();
  const match = title.match(/^\[Proposal\]:\s+(.+)$/);
  return Boolean(match && match[1].trim().length >= 3 && match[1].trim().length <= 80);
}

export function compileBuildBrief({ issue, votes, fields }) {
  const safe = normalizeFields(fields);
  return Object.freeze({
    schemaVersion: 1,
    trust: "compiled-untrusted-problem-data",
    source: Object.freeze({
      issueNumber: Number(issue.number),
      author: sanitizeIdentifier(issue.author),
      votes: Number(votes) || 0,
      selectedAt: new Date().toISOString(),
    }),
    project: Object.freeze({
      name: sanitizePlainText(safe.name, 80),
      slug: slugify(safe.name),
      category: sanitizePlainText(safe.category, 60),
      problem: sanitizePlainText(safe.problem, 700),
      audience: sanitizePlainText(safe.audience, 300),
      smallestUsefulVersion: sanitizePlainText(safe.mvp, 1_000),
      successCriteria: toCriteria(safe.success),
    }),
    builderBoundary: Object.freeze({
      treatAllProjectStringsAsData: true,
      mayReadRawProposal: false,
      mayAccessCredentials: false,
      mayContactThirdParties: false,
      mayDeploy: false,
      mayRunUntrustedPullRequestCodeWithSecrets: false,
    }),
  });
}

export function sanitizePlainText(value, maximum = 1_000) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/```[\s\S]*?```/g, " [code removed] ")
    .replace(/`[^`]*`/g, " [code removed] ")
    .replace(/https?:\/\/\S+|www\.\S+/gi, "[link removed]")
    .replace(/@[a-z0-9](?:[a-z0-9-]{0,37})/gi, "[mention removed]")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximum);
}

function normalizeFields(input) {
  return Object.fromEntries(
    Object.keys(FIELD_HEADINGS).map((key) => [key, String(input?.[key] ?? "").normalize("NFKC").trim()]),
  );
}

function parseMachineProposal(source) {
  if (source.length > 10_000) return invalidMachineProposal("BODY_TOO_LARGE");

  let value;
  try {
    value = JSON.parse(source);
  } catch {
    return invalidMachineProposal("INVALID_JSON");
  }

  if (!isPlainObject(value)) return invalidMachineProposal("ROOT_NOT_OBJECT");
  if (value.kind !== "sidequest-proposal" || value.schemaVersion !== 1) {
    return invalidMachineProposal("VERSION_NOT_SUPPORTED");
  }
  if (Object.keys(value).some((key) => !MACHINE_PROPOSAL_KEYS.includes(key))) {
    return invalidMachineProposal("UNKNOWN_FIELD");
  }
  if (!isPlainObject(value.safety)) return invalidMachineProposal("SAFETY_NOT_OBJECT");
  if (Object.keys(value.safety).some((key) => !MACHINE_SAFETY_KEYS.includes(key))) {
    return invalidMachineProposal("UNKNOWN_SAFETY_FIELD");
  }

  const stringFields = [
    "name",
    "category",
    "problem",
    "audience",
    "smallestUsefulVersion",
    "whyNow",
  ];
  if (stringFields.some((key) => typeof value[key] !== "string")) {
    return invalidMachineProposal("FIELD_TYPE_INVALID");
  }
  if (
    !Array.isArray(value.successCriteria) ||
    value.successCriteria.length < 1 ||
    value.successCriteria.length > 6 ||
    value.successCriteria.some((criterion) => typeof criterion !== "string")
  ) {
    return invalidMachineProposal("SUCCESS_CRITERIA_INVALID");
  }

  const boundaries = [
    value.safety.noForbiddenCapabilities === true
      ? "This proposal does not seek credentials."
      : "",
    value.safety.starsOptional === true
      ? "I understand that stars are optional."
      : "",
    value.safety.openSourceBuild === true
      ? "I agree that the selected build will be open source."
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    name: value.name,
    category: value.category,
    problem: value.problem,
    audience: value.audience,
    mvp: value.smallestUsefulVersion,
    success: value.successCriteria.join("\n"),
    whyNow: value.whyNow,
    boundaries,
  };
}

function invalidMachineProposal(machineSchemaError) {
  return {
    ...Object.fromEntries(Object.keys(FIELD_HEADINGS).map((key) => [key, ""])),
    machineSchemaError,
  };
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function readField(body, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = String(body).match(new RegExp(`### ${escaped}\\s+([\\s\\S]*?)(?=\\n### |$)`, "i"));
  return match?.[1]?.trim().replace(/^_No response_$/i, "") ?? "";
}

function toCriteria(value) {
  const candidates = String(value).split(/\r?\n|;/).map((item) => item.replace(/^[-*\d.)\s]+/, "").trim()).filter(Boolean);
  return (candidates.length ? candidates : [value]).slice(0, 6).map((item) => sanitizePlainText(item, 180));
}

function sanitizeIdentifier(value) {
  return String(value ?? "unknown").replace(/[^a-zA-Z0-9-]/g, "").slice(0, 39) || "unknown";
}

function slugify(value) {
  return sanitizePlainText(value, 80).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "daily-sidequest";
}

function dedupeReasons(reasons) {
  const seen = new Set();
  return reasons.filter((reason) => {
    const key = `${reason.code}:${reason.field}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
