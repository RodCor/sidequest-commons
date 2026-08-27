import type { Metadata } from "next";
import Link from "next/link";
import { repositoryUrl } from "@/lib/proposals";
import { SigilDemo } from "./sigil-demo";
import styles from "./sigil.module.css";

const projectPath = "projects/2026-08-27-sigil-an-open-inter-agent-language";

export const metadata: Metadata = {
  title: "SIGIL/1 — Open inter-agent language",
  description: "Try the SIGIL/1 deterministic envelope, six verbs, and one-turn handshake for text-capable agents.",
};

export default function SigilPage() {
  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/" className={styles.wordmark}>⌁ SIGIL/1 <span>BY SIDEQUEST COMMONS</span></Link>
        <nav aria-label="SIGIL navigation"><a href="#spec">Spec</a><a href="#verbs">Verbs</a><a href="#demo">Live demo</a></nav>
        <a href={`${repositoryUrl}/tree/main/${projectPath}`} target="_blank" rel="noreferrer">Source ↗</a>
      </header>

      <section className={styles.hero}>
        <div>
          <p className={styles.kicker}>OPEN PROTOCOL · VERSION 1</p>
          <h1>Agents should know<br /><em>what each other mean.</em></h1>
          <p className={styles.lede}>A deterministic envelope, six verbs, and a one-turn handshake—small enough to audit in under ten minutes.</p>
          <a className={styles.primary} href="#demo">Run the handshake ↓</a>
        </div>
        <div className={styles.envelope} aria-label="Example SIGIL envelope">
          <span>sender</span><strong>atlas.agent</strong>
          <span>seq</span><strong>007</strong>
          <span>verb</span><strong className={styles.accent}>INFORM</strong>
          <span>body</span><strong>{'{ status: "ready" }'}</strong>
        </div>
      </section>

      <section className={styles.spec} id="spec">
        <div><p className={styles.kicker}>01 · ENVELOPE</p><h2>Five fields.<br />No hidden meaning.</h2></div>
        <div className={styles.specBody}>
          <p>Every SIGIL/1 message contains exactly a protocol version, sender, sequence number, verb, and JSON body. Unknown fields are invalid.</p>
          <pre>{`{
  "sigil": "1",
  "sender": "atlas.agent",
  "seq": 0,
  "verb": "INFORM",
  "body": { "status": "ready" }
}`}</pre>
          <dl>
            <div><dt>sender</dt><dd>1–64 safe ASCII characters; starts alphanumeric.</dd></div>
            <div><dt>seq</dt><dd>A non-negative integer increasing per sender.</dd></div>
            <div><dt>wire</dt><dd><code>SIGIL1.&lt;base64url(canonical JSON)&gt;</code></dd></div>
          </dl>
        </div>
      </section>

      <section className={styles.verbs} id="verbs">
        <p className={styles.kicker}>02 · VOCABULARY</p><h2>Six verbs are enough.</h2>
        <div className={styles.verbGrid}>
          <article><span>01</span><h3>REQUEST</h3><p>Ask for information or an optional action.</p></article>
          <article><span>02</span><h3>INFORM</h3><p>Provide facts or state without commanding.</p></article>
          <article><span>03</span><h3>ORDER</h3><p>Direct an action under pre-existing authority.</p></article>
          <article><span>04</span><h3>ACK</h3><p>Confirm receipt and acceptance—not completion.</p></article>
          <article><span>05</span><h3>REFUSE</h3><p>Decline with a machine-readable reason.</p></article>
          <article><span>06</span><h3>CLOSE</h3><p>End the conversation cleanly.</p></article>
        </div>
        <p className={styles.notice}>SIGIL describes intent. It never grants identity, trust, or authority.</p>
      </section>

      <section className={styles.steps}>
        <div><p className={styles.kicker}>03 · HANDSHAKE</p><h2>One message in.<br />One acknowledgment out.</h2></div>
        <ol>
          <li><b>Canonicalize</b><span>Sort object keys and serialize compact UTF-8 JSON.</span></li>
          <li><b>Encode</b><span>Use unpadded base64url. Visible encoding is not encryption.</span></li>
          <li><b>Prefix</b><span>Expose SIGIL/1 before any opaque payload is decoded.</span></li>
          <li><b>Acknowledge</b><span>Return the sender and sequence received.</span></li>
        </ol>
      </section>

      <SigilDemo />

      <section className={styles.safety}>
        <p className={styles.kicker}>SAFETY BOUNDARY</p>
        <h2>Syntax is not security.</h2>
        <p>Authenticate peers, reject replayed sequence numbers, enforce size and rate limits, and never execute decoded bodies as code.</p>
      </section>
      <footer className={styles.footer}><Link href="/">← Sidequest Commons</Link><span>Open specification · MIT licensed</span></footer>
    </main>
  );
}
