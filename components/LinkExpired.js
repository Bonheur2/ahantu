import { Clock } from "lucide-react";

// Shown on /share/[token] when the link has expired, been renewed, or the person was removed.
export default function LinkExpired({ orgName }) {
  return (
    <main className="login-wrap">
      <section className="login-card state-card">
        <div className="state-icon"><Clock size={28} strokeWidth={1.7} /></div>
        <h1>This link has expired</h1>
        <p className="login-sub">
         Ask {orgName || "the sender"} to send you a new link, then open it again.
        </p>
      </section>
    </main>
  );
}
