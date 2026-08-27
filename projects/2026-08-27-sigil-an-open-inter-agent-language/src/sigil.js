export const VERSION = "1";
export const PREFIX = "SIGIL1.";
export const VERBS = Object.freeze([
  "REQUEST",
  "INFORM",
  "ORDER",
  "ACK",
  "REFUSE",
  "CLOSE",
]);

const ENVELOPE_KEYS = Object.freeze(["sigil", "sender", "seq", "verb", "body"]);
const SENDER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/;
const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });

function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function assertJsonValue(value, path = "body") {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError(`${path} must contain finite numbers`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertJsonValue(entry, `${path}[${index}]`));
    return;
  }
  if (isPlainObject(value)) {
    for (const [key, entry] of Object.entries(value)) {
      if (typeof entry === "undefined") throw new TypeError(`${path}.${key} cannot be undefined`);
      assertJsonValue(entry, `${path}.${key}`);
    }
    return;
  }
  throw new TypeError(`${path} must contain only JSON values`);
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!isPlainObject(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonicalize(value[key])]),
  );
}

function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function base64UrlToBytes(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new TypeError("invalid base64url payload");
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  let binary;
  try {
    binary = atob(padded);
  } catch {
    throw new TypeError("invalid base64url payload");
  }
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function validateEnvelope(envelope) {
  if (!isPlainObject(envelope)) throw new TypeError("envelope must be a JSON object");

  const keys = Object.keys(envelope).sort();
  const expected = [...ENVELOPE_KEYS].sort();
  if (keys.length !== expected.length || keys.some((key, index) => key !== expected[index])) {
    throw new TypeError(`envelope must contain exactly: ${ENVELOPE_KEYS.join(", ")}`);
  }
  if (envelope.sigil !== VERSION) throw new TypeError(`unsupported SIGIL version: ${envelope.sigil}`);
  if (typeof envelope.sender !== "string" || !SENDER_PATTERN.test(envelope.sender)) {
    throw new TypeError("sender must match [A-Za-z0-9][A-Za-z0-9._:-]{0,63}");
  }
  if (!Number.isSafeInteger(envelope.seq) || envelope.seq < 0) {
    throw new TypeError("seq must be a non-negative safe integer");
  }
  if (!VERBS.includes(envelope.verb)) throw new TypeError(`unsupported verb: ${envelope.verb}`);
  if (!isPlainObject(envelope.body)) throw new TypeError("body must be a JSON object");
  assertJsonValue(envelope.body);
  return envelope;
}

export function encodeEnvelope(envelope) {
  validateEnvelope(envelope);
  const canonicalEnvelope = {
    sigil: envelope.sigil,
    sender: envelope.sender,
    seq: envelope.seq,
    verb: envelope.verb,
    body: canonicalize(envelope.body),
  };
  return PREFIX + bytesToBase64Url(encoder.encode(JSON.stringify(canonicalEnvelope)));
}

export function decodeEnvelope(wire) {
  if (typeof wire !== "string" || !wire.startsWith(PREFIX)) {
    throw new TypeError(`wire message must start with ${PREFIX}`);
  }
  let envelope;
  try {
    envelope = JSON.parse(decoder.decode(base64UrlToBytes(wire.slice(PREFIX.length))));
  } catch (error) {
    if (error instanceof TypeError && error.message === "invalid base64url payload") throw error;
    throw new TypeError("wire payload must be valid UTF-8 JSON");
  }
  return validateEnvelope(envelope);
}

export function createHandshake(sender, seq = 0, accepts = VERBS) {
  const uniqueAccepts = [...new Set(accepts)];
  if (uniqueAccepts.length === 0 || uniqueAccepts.some((verb) => !VERBS.includes(verb))) {
    throw new TypeError("accepts must contain supported SIGIL verbs");
  }
  return encodeEnvelope({
    sigil: VERSION,
    sender,
    seq,
    verb: "INFORM",
    body: { type: "handshake", protocol: "SIGIL/1", accepts: uniqueAccepts },
  });
}

export function acceptHandshake(wire, sender, seq = 0) {
  const hello = decodeEnvelope(wire);
  if (
    hello.verb !== "INFORM" ||
    hello.body.type !== "handshake" ||
    hello.body.protocol !== "SIGIL/1" ||
    !Array.isArray(hello.body.accepts)
  ) {
    throw new TypeError("message is not a SIGIL/1 handshake");
  }
  return encodeEnvelope({
    sigil: VERSION,
    sender,
    seq,
    verb: "ACK",
    body: {
      type: "handshake-ack",
      protocol: "SIGIL/1",
      receivedFrom: hello.sender,
      receivedSeq: hello.seq,
    },
  });
}
