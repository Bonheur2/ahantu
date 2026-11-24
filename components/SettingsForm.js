"use client";
import { Link2, MapPin, Server, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import StopAllButton from "./StopAllButton";

function lifetimeLabel(m) {
  if (m < 60) return `${m} min`;
  if (m < 1440) return `${m / 60} hr`;
  return "24 hr";
}

function Card({ icon, title, desc, className = "", children }) {
  return (
    <section className={"s-card " + className}>
      <div className="s-head">
        <div className="s-icon">{icon}</div>
        <div><h2>{title}</h2><p>{desc}</p></div>
      </div>
      {children}
    </section>
  );
}

function Row({ label, hint, children }) {
  return (
    <div className="s-row">
      <div><div className="s-label">{label}</div>{hint && <div className="s-hint">{hint}</div>}</div>
      <div>{children}</div>
    </div>
  );
}

function Tile({ ok, label, hint }) {
  return (
    <div className="status-tile">
      <span className={"dot " + (ok ? "ok" : "bad")}>{ok ? "Connected" : "Not set"}</span>
      <strong>{label}</strong>
      <small>{hint}</small>
    </div>
  );
}

export default function SettingsForm({ settings, options, status }) {
  const router = useRouter();
  const [saved, setSaved] = useState(settings);
  const [form, setForm] = useState(settings);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setMsg(null); };

  async function save() {
    setBusy(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setMsg({ type: "err", text: data.error || "Could not save settings." });
    setSaved(data.settings);
    setForm(data.settings);
    setMsg({ type: "ok", text: "Settings saved." });
    router.refresh();
  }

  function discard() { setForm(saved); setMsg(null); }

  return (
    <div className="settings">
      <div className="settings-intro">
        <h1>Settings</h1>
        <p>Control how consent links work and how locations are shown.</p>
      </div>

      <Card icon={<Link2 size={20} />} title="Consent links" desc="What people see and how long their link works.">
        <Row label="Organization name" hint="Shown on the consent page so people know who is asking.">
          <input className="s-input" value={form.orgName} maxLength={60} placeholder="e.g. University of Rwanda" onChange={e => set("orgName", e.target.value)} />
        </Row>
        <Row label="Link lifetime" hint="Applies to links created or renewed from now on.">
          <div className="chips">
            {options.map(o => (
              <button key={o} type="button" className={"chip" + (form.linkLifetimeMinutes === o ? " on" : "")} onClick={() => set("linkLifetimeMinutes", o)}>
                {lifetimeLabel(o)}
              </button>
            ))}
          </div>
        </Row>
        <Row label="Public app URL" hint="Used in the links you copy. Leave empty to use the current address.">
          <input className="s-input" value={form.baseUrl} placeholder="https://your-app.onrender.com" onChange={e => set("baseUrl", e.target.value)} />
        </Row>
      </Card>

      <Card icon={<MapPin size={20} />} title="Location" desc="How shared coordinates are turned into places.">
        <Row label="Place names" hint={status.geocoding ? "Shows the village, cell and sector (Ahantu), or the street address (Google) next to the coordinates." : "Add AHANTU_API_KEY (Rwanda) or GOOGLE_MAPS_API_KEY on the server to use this."}>
          <button type="button" role="switch" aria-checked={form.geocodingEnabled} aria-label="Place names" className={"switch" + (form.geocodingEnabled ? " on" : "")} onClick={() => set("geocodingEnabled", !form.geocodingEnabled)} />
        </Row>
      </Card>

      <Card icon={<Server size={20} />} title="System status" desc="Server configuration, read from environment variables.">
        <div className="status-grid">
          <Tile ok={status.database} label="Database" hint="Postgres on Neon" />
          <Tile ok={status.ahantu} label="Ahantu key" hint="AHANTU_API_KEY - Rwanda place names" />
          <Tile ok={status.google} label="Google Maps key" hint="GOOGLE_MAPS_API_KEY - fallback" />
          <Tile ok={status.adminPassword} label="Admin password" hint="ADMIN_PASSWORD" />
        </div>
      </Card>

      <Card className="danger" icon={<TriangleAlert size={20} />} title="Danger zone" desc="Actions that take effect immediately.">
        <Row label="Stop all sharing" hint="Clears every shared location and place name right now.">
          <StopAllButton />
        </Row>
      </Card>

      {(dirty || msg) && (
        <div className="savebar">
          <span className={"msg " + (msg ? msg.type : "dirty")}>{msg ? msg.text : "You have unsaved changes."}</span>
          {dirty && <button type="button" className="btn" onClick={discard} disabled={busy}>Discard</button>}
          {dirty && <button type="button" className="btn primary" onClick={save} disabled={busy}>{busy ? "Saving..." : "Save changes"}</button>}
        </div>
      )}
    </div>
  );
}
