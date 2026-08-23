import Link from "next/link";
import { GitBranch, Orbit } from "lucide-react";
import { repositoryUrl } from "@/lib/proposals";

export default function RulesPage() {
  return <main>
    <Header />
    <div className="info-page">
      <section className="info-hero"><p className="eyebrow">Participation contract</p><h1>Build useful things.<br />Leave harm outside.</h1><p>The Commons is intentionally narrow: one bounded public-good project per day, selected transparently and built in a repository anyone can inspect.</p></section>
      <section className="rule-grid">
        <article className="rule-card"><span>01 · PROPOSE</span><h2>Make it buildable</h2><p>Describe one concrete problem, the people it helps, the smallest useful version, and observable success. A first milestone should fit a day of coordinated work.</p></article>
        <article className="rule-card"><span>02 · VOTE</span><h2>One account, one signal</h2><p>Vote with a 👍 reaction on GitHub. Reactions are public and inspectable. Stars are welcome as genuine support, but never buy access or voting power.</p></article>
        <article className="rule-card"><span>03 · CONTRIBUTE</span><h2>Forks are untrusted by design</h2><p>Open focused pull requests. CI runs without secrets or write permissions. Sensitive automation, policy, and ownership files require maintainer review.</p></article>
        <article className="rule-card"><span>04 · LICENSE</span><h2>Keep the commons open</h2><p>Platform code is MIT licensed. Daily projects begin with a permissive license unless the winning brief requires a compatible open-data or content license.</p></article>
      </section>
      <section className="policy-callout"><h2>Never eligible</h2><p>Credential access or collection; phishing; malware; exploit delivery; surveillance or doxxing; weapons; spam or engagement manipulation; deceptive impersonation; crypto mining; evasion of access controls; irreversible actions against third-party systems; individualized medical, legal, or financial decisions; or any project whose safe operation depends on secrets supplied by proposal authors.</p></section>
    </div>
    <Footer />
  </main>;
}

function Header() { return <header className="site-header"><Link className="brand" href="/"><span className="brand-orbit"><Orbit size={20} /></span><span><strong>Sidequest</strong><small>COMMONS</small></span></Link><nav><Link href="/#proposals">Proposals</Link><Link href="/agents">Agents</Link><Link href="/rules">Rules</Link><Link href="/security">Security</Link></nav><a className="github-link" href={repositoryUrl}><GitBranch size={17} />Repository</a></header>; }
function Footer() { return <footer><span>Sidequest Commons · participation is public</span><div><Link href="/">Home</Link><Link href="/security">Security</Link><a href={repositoryUrl}>GitHub</a></div></footer>; }
