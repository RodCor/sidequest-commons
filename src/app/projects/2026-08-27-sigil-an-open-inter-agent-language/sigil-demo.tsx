"use client";

import { useState } from "react";
import {
  VERSION,
  VERBS,
  acceptHandshake,
  createHandshake,
  decodeEnvelope,
  encodeEnvelope,
  type SigilVerb,
} from "../../../../projects/2026-08-27-sigil-an-open-inter-agent-language/src/sigil.js";
import styles from "./sigil.module.css";

type DemoResult = { label: string; wire: string; decoded: string; reply?: string };

export function SigilDemo() {
  const [sender, setSender] = useState("atlas.agent");
  const [receiver, setReceiver] = useState("orbit.agent");
  const [sequence, setSequence] = useState("0");
  const [verb, setVerb] = useState<SigilVerb>("INFORM");
  const [body, setBody] = useState('{"status":"ready"}');
  const [result, setResult] = useState<DemoResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function encodeMessage() {
    try {
      const wire = encodeEnvelope({
        sigil: VERSION,
        sender,
        seq: Number(sequence),
        verb,
        body: JSON.parse(body) as Record<string, never>,
      });
      setResult({ label: "Encoded envelope", wire, decoded: JSON.stringify(decodeEnvelope(wire), null, 2) });
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not encode this envelope.");
    }
  }

  function runHandshake() {
    try {
      const hello = createHandshake(sender, Number(sequence));
      const reply = acceptHandshake(hello, receiver, Number(sequence));
      setResult({
        label: "Handshake completed",
        wire: hello,
        decoded: JSON.stringify(decodeEnvelope(hello), null, 2),
        reply: JSON.stringify(decodeEnvelope(reply), null, 2),
      });
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not complete the handshake.");
    }
  }

  async function copyWire() {
    if (!result) return;
    await navigator.clipboard.writeText(result.wire);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <section className={styles.lab} id="demo" aria-labelledby="demo-title">
      <div className={styles.labHeading}>
        <p className={styles.kicker}>04 · LIVE CODEC</p>
        <h2 id="demo-title">Make two agents speak.</h2>
        <p>Runs entirely in your browser with the same dependency-free codec tested in the repository.</p>
      </div>

      <div className={styles.console}>
        <div className={styles.fields}>
          <label>Sender<input value={sender} maxLength={64} onChange={(event) => setSender(event.target.value)} /></label>
          <label>Receiver<input value={receiver} maxLength={64} onChange={(event) => setReceiver(event.target.value)} /></label>
          <label>Sequence<input type="number" min="0" step="1" value={sequence} onChange={(event) => setSequence(event.target.value)} /></label>
          <label>Verb<select value={verb} onChange={(event) => setVerb(event.target.value as SigilVerb)}>{VERBS.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className={styles.full}>Body JSON<textarea rows={4} value={body} onChange={(event) => setBody(event.target.value)} /></label>
        </div>
        <div className={styles.actions}>
          <button type="button" onClick={encodeMessage}>Encode envelope</button>
          <button type="button" onClick={runHandshake}>Run full handshake</button>
        </div>
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
      </div>

      <div className={styles.result} aria-live="polite">
        <div className={styles.resultHeader}><span>{result?.label ?? "OUTPUT WAITING"}</span><button type="button" disabled={!result} onClick={copyWire}>{copied ? "Copied" : "Copy wire"}</button></div>
        {result ? (
          <>
            <p className={styles.wire}>{result.wire}</p>
            <div className={styles.decodedGrid}>
              <div><span>INITIATOR · DECODED</span><pre>{result.decoded}</pre></div>
              <div><span>{result.reply ? "RECEIVER · ACK" : "WHAT HAPPENED"}</span><pre>{result.reply ?? "The canonical JSON was encoded as UTF-8, converted to unpadded base64url, and prefixed with SIGIL1."}</pre></div>
            </div>
          </>
        ) : <p className={styles.placeholder}>Encode a message or run a handshake to inspect the wire and decoded envelopes.</p>}
      </div>
    </section>
  );
}
