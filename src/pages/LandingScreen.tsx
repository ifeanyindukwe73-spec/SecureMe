import secureImg from "../assets/man2.png";
import BrandMark from "../components/BrandMark";

interface Props {
  onReport: () => void;
  onDashboard: () => void;
  onTrends: () => void;
}

const STEPS = [
  { number: "1", icon: "▤", text: "Select the incident type and severity" },
  { number: "2", icon: "⌖", text: "Add location and optional details" },
  { number: "3", icon: "♧", text: "Choose your privacy level and submit" },
];

const STATS = [
  { label: "INCIDENTS TODAY", value: "3" },
  { label: "AVG RESPONSE", value: "2m 14s" },
  { label: "RESOLVED", value: "94%" },
];

export default function LandingScreen({ onReport, onDashboard, onTrends }: Props) {
  return (
    <main className="landing former-landing">
      <nav className="former-nav" aria-label="Main navigation">
        <BrandMark />
        <button className="button button-outline former-login" onClick={onDashboard}>
          Response Team Demo <span aria-hidden="true">→</span>
        </button>
      </nav>

      <div className="former-hero">
        <section className="former-image-panel" aria-label="SafeCircle introduction">
          <img src={secureImg} alt="A student walking through a school corridor" />
          <div className="former-image-shade" />
          <div className="former-intro animate-fade-in">
            <div className="former-status"><span className="status-dot" /> SYSTEM ACTIVE · LINCOLN HIGH SCHOOL</div>
            <h1>See something.<br /><span>Say something.</span><br />Stay safe.</h1>
            <p>SafeCircle helps get your report to the right people — with control over your privacy.</p>
          </div>
        </section>

        <section className="former-actions-panel">
          <div className="former-action-content animate-slide-up">
            <section className="former-report-block">
              <h2>Report an incident</h2>
              <button className="button button-danger former-report-button" onClick={onReport}>
                <span aria-hidden="true">🚨</span>
                <span>Report an incident</span>
                <span aria-hidden="true">→</span>
              </button>
              <p className="former-reassurance">CHOOSE YOUR PRIVACY LEVEL · TAKES ABOUT A MINUTE</p>
            </section>

            <div className="former-divider"><span />HOW IT WORKS<span /></div>
            <div className="former-steps">
              {STEPS.map(step => (
                <div className="former-step" key={step.number}>
                  <span className="former-step-number">{step.number}</span>
                  <span className="former-step-icon" aria-hidden="true">{step.icon}</span>
                  <span>{step.text}</span>
                </div>
              ))}
            </div>

            <button className="former-trends-link" onClick={onTrends}>
              <span className="former-trends-icon" aria-hidden="true">▥</span>
              <span><strong>Explore community trends</strong><small>See anonymized patterns by time and place</small></span>
              <span className="former-arrow" aria-hidden="true">→</span>
            </button>

            <button className="former-team-card" onClick={onDashboard}>
              <span className="former-team-art" aria-hidden="true"><span>◉</span></span>
              <span className="former-team-copy"><strong>Response Team Dashboard</strong><small>STAFF &amp; ADMIN DEMO ACCESS ONLY</small></span>
              <span className="former-arrow" aria-hidden="true">→</span>
            </button>
          </div>
        </section>
      </div>

      <div className="former-stat-bar" aria-label="Sample school safety statistics">
        {STATS.map(stat => (
          <div className="former-stat" key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
        <span className="former-stat-note">SAMPLE DATA</span>
      </div>
      <p className="former-emergency-note">For immediate danger, contact emergency services or a trusted adult.</p>
    </main>
  );
}
