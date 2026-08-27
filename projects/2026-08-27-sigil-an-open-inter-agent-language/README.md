# SIGIL/1

SIGIL is a tiny, auditable wire convention for text-capable agents. It gives an
agent enough information to identify the sender, order messages, understand the
intent, and either acknowledge or refuse it. The entire normative specification
is below; a browser-friendly copy and live codec are in `index.html`.

## Envelope

A decoded SIGIL/1 envelope is a JSON object with exactly these fields, emitted
in this order:

```json
{
  "sigil": "1",
  "sender": "atlas.agent",
  "seq": 0,
  "verb": "INFORM",
  "body": { "status": "ready" }
}
```

| Field | Rule |
| --- | --- |
| `sigil` | The string `"1"`. |
| `sender` | 1–64 ASCII letters, digits, `.`, `_`, `:`, or `-`; starts alphanumeric. |
| `seq` | A non-negative safe integer, increasing for each sender. |
| `verb` | Exactly one of the six uppercase verbs below. |
| `body` | A JSON object. Its meaning is determined by `verb`; keys are canonically sorted. |

Unknown envelope fields are invalid. Receivers must reject malformed envelopes,
unsupported versions, and repeated or decreasing sequence numbers for a sender.
Sequence tracking is a receiver responsibility because SIGIL is transport-neutral.

## Six verbs

| Verb | Meaning | Expected response |
| --- | --- | --- |
| `REQUEST` | Ask the receiver to provide information or perform an optional action. | `ACK`, `REFUSE`, or an `INFORM` followed by `ACK`. |
| `INFORM` | Provide facts or state without commanding an action. | `ACK` when receipt matters. |
| `ORDER` | Direct an action under authority already established outside SIGIL. | `ACK` or `REFUSE`. SIGIL never grants authority. |
| `ACK` | Confirm receipt and acceptance of a specific message. | None unless the dialogue continues. |
| `REFUSE` | Decline a specific message, with a machine-readable reason when possible. | None or a revised `REQUEST`. |
| `CLOSE` | End the conversation cleanly. | Optional final `ACK`. |

`ACK` means the message was accepted, not that an action completed. Agents must
apply their own authorization and safety policies before acting on any verb.

## Wire form

1. Validate the envelope.
2. Recursively sort all object keys. Serialize as compact UTF-8 JSON.
3. Encode the bytes as unpadded base64url (RFC 4648 URL alphabet).
4. Prefix the result with `SIGIL1.`.

In compact notation:

```text
SIGIL1.<base64url(UTF-8(canonical JSON envelope))>
```

The prefix makes SIGIL visible in logs and lets a receiver refuse unsupported
versions before decoding opaque content. Do not treat base64url as encryption.

## One-turn handshake

An initiator sends one `INFORM` envelope whose body is:

```json
{
  "accepts": ["REQUEST", "INFORM", "ORDER", "ACK", "REFUSE", "CLOSE"],
  "protocol": "SIGIL/1",
  "type": "handshake"
}
```

A compatible receiver answers with `ACK` and this body:

```json
{
  "protocol": "SIGIL/1",
  "receivedFrom": "atlas.agent",
  "receivedSeq": 0,
  "type": "handshake-ack"
}
```

That exchange proves both sides can decode the same envelope and identify the
message being acknowledged. An incompatible or unauthorized receiver sends
`REFUSE` when possible, or ignores the message according to its local policy.

## Reference implementation

The dependency-free module in `src/sigil.js` exports `encodeEnvelope`,
`decodeEnvelope`, `createHandshake`, `acceptHandshake`, `validateEnvelope`, and
the `VERBS` list. It runs in modern browsers and Node.js.

```js
import { acceptHandshake, createHandshake, decodeEnvelope } from "./src/sigil.js";

const hello = createHandshake("atlas.agent", 0);
const reply = acceptHandshake(hello, "orbit.agent", 0);
console.log(decodeEnvelope(reply));
```

Run the three example exchanges and all codec checks with:

```text
npm test
```

## Success criteria status

- Three pairs of agents complete a full handshake exchange in automated tests.
- A deliberately independent decoder reconstructs a message using only the wire
  rules above in automated tests.
- The under-ten-minute read remains a maintainer review check; the automated
  builder does not contact external maintainers.

## Security

SIGIL defines syntax, not identity, authentication, confidentiality, authority,
or transport. Treat decoded text as untrusted data. Authenticate peers and apply
local authorization, replay protection, size limits, and rate limits before
acting. Never execute a decoded body as code.
