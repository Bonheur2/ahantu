"use client";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export default function LoginForm() {
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      setBusy(false);
      setError((await res.json().catch(() => ({}))).error || "Could not sign in.");
      return;
    }
    const next = new URLSearchParams(window.location.search).get("next");
    // Only allow same-site relative redirects.
    window.location.href = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  }

  return (
    <main className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <h1>Welcome back</h1>
        <p className="login-sub">Sign in to manage location sharing.</p>

        <label className="login-field">
          <span>Username</span>
          <div className="login-input"><input name="username" autoComplete="username" autoFocus required placeholder="admin" /></div>
        </label>
        <label className="login-field">
          <span>Password</span>
          <div className="login-input">
            
            <input name="password" type={show ? "text" : "password"} autoComplete="current-password" required placeholder="Your password" />
            <button type="button" className="icon-btn" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(s => !s)}>
              {show ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </label>

        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn primary login-btn" type="submit" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
      </form>
    </main>
  );
}
