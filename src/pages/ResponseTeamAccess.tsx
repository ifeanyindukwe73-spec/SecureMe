import { useState, type FormEvent } from "react";
import BrandMark from "../components/BrandMark";
import PrototypeNotice from "../components/PrototypeNotice";

interface Props {
  onBack: () => void;
  onContinue: () => void;
}

const DEMO_EMAIL = "coordinator@demo.invalid";
const DEMO_PASSCODE = "sample-only";

export default function ResponseTeamAccess({ onBack, onContinue }: Props) {
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [passcode, setPasscode] = useState(DEMO_PASSCODE);
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (email.trim().toLowerCase() !== DEMO_EMAIL || passcode !== DEMO_PASSCODE) {
      setError("Use the fictional demo email and passcode shown on this page.");
      return;
    }
    setError("");
    onContinue();
  };

  return (
    <main className="access-page">
      <header className="access-nav"><button className="button button-quiet" onClick={onBack}>← Back to SafeCircle</button><BrandMark /></header>
      <section className="access-card">
        <div className="access-icon" aria-hidden="true">⌑</div>
        <span className="eyebrow">STAFF &amp; ADMIN ACCESS</span>
        <h1>Response team sign in</h1>
        <p>Production team dashboards should use your organization’s identity provider. This preview uses a fictional demo profile only.</p>
        <div className="demo-account">
          <div className="demo-account-avatar" aria-hidden="true">RC</div>
          <div className="demo-account-details">
            <span className="demo-account-label">DEMO ACCOUNT</span>
            <strong>Response coordinator</strong>
            <small>Sample incidents · local preview</small>
          </div>
          <span className="demo-account-status">READY</span>
        </div>
        <PrototypeNotice>Demo only: no identity provider is connected. Never enter real credentials; these fictional values only open sample dashboard data.</PrototypeNotice>
        <form className="demo-login-form" onSubmit={handleSubmit}>
          <label>
            Demo email
            <input type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="off" required />
          </label>
          <label>
            Demo passcode
            <input type="text" value={passcode} onChange={event => setPasscode(event.target.value)} autoComplete="off" required />
          </label>
          <small className="demo-login-hint">Sample values: {DEMO_EMAIL} / {DEMO_PASSCODE}</small>
          {error && <p className="demo-login-error" role="alert">{error}</p>}
          <button className="button button-primary access-continue" type="submit">Preview sample dashboard <span aria-hidden="true">→</span></button>
        </form>
        <small className="access-footnote">Production access requires server-side authentication, authorization, audit logging, and secure session management.</small>
      </section>
    </main>
  );
}
