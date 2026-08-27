import assert from "node:assert/strict";
import test from "node:test";

import {
  PREFIX,
  VERBS,
  acceptHandshake,
  createHandshake,
  decodeEnvelope,
  encodeEnvelope,
} from "../src/sigil.js";

const envelope = (verb, body = {}) => ({
  sigil: "1",
  sender: "atlas.agent",
  seq: 7,
  verb,
  body,
});

test("all six verbs survive a wire round trip", () => {
  for (const verb of VERBS) {
    assert.deepEqual(decodeEnvelope(encodeEnvelope(envelope(verb))), envelope(verb));
  }
});

test("encoding is deterministic for differently ordered body keys", () => {
  const first = envelope("INFORM", { z: 1, nested: { beta: true, alpha: true }, a: 2 });
  const second = envelope("INFORM", { a: 2, nested: { alpha: true, beta: true }, z: 1 });
  assert.equal(encodeEnvelope(first), encodeEnvelope(second));
});

test("three different agent pairs complete handshake exchanges", () => {
  const pairs = [
    ["atlas.agent", "orbit.agent"],
    ["scout:one", "forge:two"],
    ["lumen-3", "cobalt-4"],
  ];

  pairs.forEach(([initiator, receiver], index) => {
    const hello = createHandshake(initiator, index);
    const decodedHello = decodeEnvelope(hello);
    assert.equal(decodedHello.body.type, "handshake");
    assert.deepEqual(decodedHello.body.accepts, VERBS);

    const reply = decodeEnvelope(acceptHandshake(hello, receiver, index));
    assert.equal(reply.verb, "ACK");
    assert.equal(reply.body.receivedFrom, initiator);
    assert.equal(reply.body.receivedSeq, index);
  });
});

test("an independent spec-only decoder can read the canonical message", () => {
  const wire = encodeEnvelope(envelope("REQUEST", { task: "summarize" }));
  const payload = wire.slice(PREFIX.length).replaceAll("-", "+").replaceAll("_", "/");
  const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
  const decoded = JSON.parse(Buffer.from(padded, "base64").toString("utf8"));

  assert.equal(decoded.sender, "atlas.agent");
  assert.equal(decoded.seq, 7);
  assert.equal(decoded.verb, "REQUEST");
  assert.deepEqual(decoded.body, { task: "summarize" });
});

test("invalid versions, fields, senders, sequences, verbs, and bodies are rejected", () => {
  assert.throws(() => encodeEnvelope({ ...envelope("ACK"), sigil: "2" }), /version/);
  assert.throws(() => encodeEnvelope({ ...envelope("ACK"), extra: true }), /exactly/);
  assert.throws(() => encodeEnvelope({ ...envelope("ACK"), sender: "bad sender" }), /sender/);
  assert.throws(() => encodeEnvelope({ ...envelope("ACK"), seq: -1 }), /seq/);
  assert.throws(() => encodeEnvelope(envelope("EXECUTE")), /verb/);
  assert.throws(() => encodeEnvelope({ ...envelope("ACK"), body: [] }), /body/);
  assert.throws(() => decodeEnvelope("not-sigil"), /start with/);
  assert.throws(() => decodeEnvelope(`${PREFIX}***`), /base64url/);
});

test("a non-handshake INFORM cannot be acknowledged as a handshake", () => {
  const wire = encodeEnvelope(envelope("INFORM", { status: "ready" }));
  assert.throws(() => acceptHandshake(wire, "orbit.agent"), /not a SIGIL\/1 handshake/);
});
