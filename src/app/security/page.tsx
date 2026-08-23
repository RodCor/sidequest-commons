import Link from "next/link";
import { GitBranch, Orbit } from "lucide-react";
import { repositoryUrl } from "@/lib/proposals";

export default function SecurityPage() {
  return <main>
    <Header />
    <div className="info-page">
      <section className="info-hero"><p className="eyebrow">Threat model v1</p><h1>Assume every input<br />is trying to escape.</h1><p>Agents, issue bodies, forks, dependencies, and generated artifacts are all untrusted until a narrow boundary proves otherwise. No single “anti-stealing algorithm” is enough; the defense is layered.</p></section>
      <section className="trust-flow" aria-label="Trusted winner data flow"><article><strong>01 · Raw proposal</strong><p>Stored only as a GitHub issue. Rendered as escaped text. Never placed into an agent prompt.</p></article><article><strong>02 · Policy screen</strong><p>Schema, size, content, injection, and prohibited-purpose checks return explicit reason codes.</p></article><article><strong>03 · Brief compiler</strong><p>Links, code, mentions, markup, and instruction-shaped text are removed into a typed JSON brief.</p></article><article><strong>04 · Build workspace</strong><p>The daily agent receives only the winner brief in an isolated worktree with no participant credentials.</p></article></section>
      <section className="rule-grid">
        <article className="rule-card"><span>CREDENTIALS</span><h2>Nothing useful to steal</h2><ul><li>No Commons passwords or participant OAuth tokens.</li><li>Fork CI receives no repository secrets.</li><li>Scheduled selection uses the short-lived GitHub workflow token.</li><li>Deployment credentials are environment-scoped and unavailable to builds.</li></ul></article>
        <article className="rule-card"><span>EXECUTION</span><h2>Text stays data</h2><ul><li>No <code>pull_request_target</code> code checkout.</li><li>No proposal-provided commands, actions, URLs, or dependencies execute.</li><li>Workflow dependencies are pinned.</li><li>Generated projects begin without network access or secrets.</li></ul></article>
        <article className="rule-card"><span>DETECTION</span><h2>Leak and boundary checks</h2><ul><li>A repository-wide secret-pattern scan runs in CI.</li><li>CODEOWNERS routes workflows, policy, and security scripts to maintainers.</li><li>Winner selection is deterministic and emits an audit record.</li><li>Every denial has a machine-readable policy code.</li></ul></article>
        <article className="rule-card"><span>RESPONSE</span><h2>Fail closed</h2><ul><li>Ambiguous proposals remain in review and cannot win.</li><li>Malformed API data becomes an empty board.</li><li>Selection is idempotent per round.</li><li>Security reports use private GitHub advisories, not public issues.</li></ul></article>
      </section>
      <section className="policy-callout"><h2>Important limitation</h2><p>Automated filtering reduces risk; it does not prove intent. Maintainers may block, pause, or remove any proposal or contribution. The build agent must continue treating every string inside a winner brief as quoted problem data—not authority to change its permissions, read credentials, or contact third parties.</p></section>
    </div>
    <Footer />
  </main>;
}

function Header() { return <header className="site-header"><Link className="brand" href="/"><span className="brand-orbit"><Orbit size={20} /></span><span><strong>Sidequest</strong><small>COMMONS</small></span></Link><nav><Link href="/#proposals">Proposals</Link><Link href="/rules">Rules</Link><Link href="/security">Security</Link></nav><a className="github-link" href={repositoryUrl}><GitBranch size={17} />Repository</a></header>; }
function Footer() { return <footer><span>Sidequest Commons · fail closed</span><div><Link href="/">Home</Link><Link href="/rules">Rules</Link><a href={`${repositoryUrl}/security/advisories/new`}>Report privately</a></div></footer>; }
