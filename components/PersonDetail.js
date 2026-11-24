"use client";
import { ArrowLeft, Link2, MapPin, Pencil, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ConfirmDeleteDialog from "./ConfirmDeleteDialog";
import LiveMap from "./LiveMap";
import { shareUrl } from "./PersonActions";

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join("").toUpperCase();
}

function fmt(iso) {
  return iso ? new Date(iso).toLocaleString() : "-";
}

function Field({ label, children }) {
  return (
    <div className="d-field">
      <span>{label}</span>
      <strong>{children}</strong>
    </div>
  );
}

export default function PersonDetail({ person, baseUrl, mapsKey }) {
  const router = useRouter();
  const [name, setName] = useState(person.name);
  const [memberNo, setMemberNo] = useState(person.memberNo);
  const [msg, setMsg] = useState(null);
  const [copied, setCopied] = useState(false);
  const [link, setLink] = useState("");
  const [now, setNow] = useState(null);
  const [satellite, setSatellite] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const loc = person.location;
  const dirty = name !== person.name || memberNo !== person.memberNo;
  const expired = now !== null && new Date(person.expiresAt).getTime() <= now;
  const minsLeft = now === null ? null : Math.max(0, Math.ceil((new Date(person.expiresAt).getTime() - now) / 60000));

  useEffect(() => {
    setLink(shareUrl(person.shareToken, baseUrl));
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(t);
  }, [person.shareToken, baseUrl]);

  async function save() {
    const res = await fetch(`/api/people/${person.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, memberNo }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setMsg({ type: "err", text: data.error || "Could not save." });
    setMsg({ type: "ok", text: "Details saved." });
    router.refresh();
  }

  async function post(path) {
    const res = await fetch(`/api/people/${person.id}/${path}`, { method: "POST" });
    router.refresh();
    return res.json().catch(() => ({}));
  }

  async function remove() {
    const res = await fetch(`/api/people/${person.id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("delete failed");
    router.push("/people");
    router.refresh();
  }

  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="detail">
      <Link href="/people" className="back"><ArrowLeft size={16} /> Back to people</Link>

      <section className="s-card d-hero">
        <span className="avatar big">{initials(person.name)}</span>
        <div className="d-hero-copy">
          <h1>{person.name}</h1>
          <span>{person.memberNo}</span>
        </div>
        <span className={"badge " + (person.sharing ? "live" : "offline")}>{person.sharing ? "Sharing" : loc ? "Last seen" : "Inactive"}</span>
      </section>

      <div className="detail-grid">
        <section className="s-card">
          <div className="s-head"><div className="s-icon"><MapPin size={20} /></div><div><h2>Current location</h2><p>{person.sharing ? "Shared with consent, updating live." : loc ? "Not live. Showing the last known position." : "Nothing is being shared right now."}</p></div></div>
          {loc ? (
            <>
              <div className="d-map-wrap">
                <LiveMap apiKey={mapsKey} latitude={loc.latitude} longitude={loc.longitude} accuracy={loc.accuracy} satellite={satellite} />
                <div className="map-toggle">
                  <button type="button" className={satellite ? "on" : ""} onClick={() => setSatellite(true)}>Satellite</button>
                  <button type="button" className={!satellite ? "on" : ""} onClick={() => setSatellite(false)}>Map</button>
                </div>
              </div>
              <div className="d-fields">
                <Field label="Place">{loc.placeName ?? "Place name unavailable"}</Field>
                <Field label="Coordinates">{loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}</Field>
                <Field label="Accuracy">{loc.accuracy != null ? `±${Math.round(loc.accuracy)} m` : "-"}</Field>
                <Field label={person.sharing ? "Last update" : "Last seen"}><span suppressHydrationWarning>{fmt(loc.at)}</span></Field>
              </div>
              <div className="d-actions">
                <a className="btn" target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}>Open in Google Maps</a>
                <button className="btn danger" onClick={() => post("stop")}>{person.sharing ? "Stop sharing" : "Clear last location"}</button>
              </div>
            </>
          ) : (
            <p className="empty" style={{ padding: "8px 22px 22px" }}>
              Send the consent link below. Location appears here after {person.name} confirms and approves the browser prompt.
            </p>
          )}
        </section>

        <div className="d-col">
          <section className="s-card">
            <div className="s-head"><div className="s-icon"><Pencil size={20} /></div><div><h2>Details</h2><p>Edit how this person appears.</p></div></div>
            <div style={{ padding: "6px 22px 18px" }}>
              <label className="field">Full name<input className="s-input" value={name} maxLength={50} onChange={e => { setName(e.target.value); setMsg(null); }} /></label>
              <label className="field">Member number<input className="s-input" value={memberNo} maxLength={30} onChange={e => { setMemberNo(e.target.value); setMsg(null); }} /></label>
              <div className="d-actions" style={{ padding: 0 }}>
                <button className="btn primary" disabled={!dirty || !name.trim() || !memberNo.trim()} onClick={save}>Save details</button>
                {msg && <span className={"msg " + msg.type} style={{ fontSize: 13, fontWeight: 700, color: msg.type === "ok" ? "#168947" : "#d92d3f" }}>{msg.text}</span>}
              </div>
            </div>
          </section>

          <section className="s-card">
            <div className="s-head"><div className="s-icon"><Link2 size={20} /></div><div><h2>Consent link</h2><p>{now === null ? " " : expired ? "Expired - renew to send a new one." : `Expires in ${minsLeft} min`}</p></div></div>
            <div style={{ padding: "6px 22px 18px" }}>
              <input className="s-input" readOnly value={link} onFocus={e => e.target.select()} />
              <div className="d-actions" style={{ padding: "14px 0 0" }}>
                <button className="btn" onClick={copy}>{copied ? "Copied" : "Copy link"}</button>
                <button className="btn" onClick={() => post("renew")}>Renew link</button>
                <a className="btn" href={link} target="_blank" rel="noreferrer">Open</a>
              </div>
            </div>
          </section>

          <section className="s-card danger">
            <div className="s-head"><div className="s-icon"><TriangleAlert size={20} /></div><div><h2>Delete person</h2><p>Deletes this person and their link permanently.</p></div></div>
            <div style={{ padding: "6px 22px 20px" }}><button className="btn danger" onClick={() => setConfirmOpen(true)}>Delete {person.name}</button>
              <ConfirmDeleteDialog open={confirmOpen} name={person.name} onConfirm={remove} onClose={() => setConfirmOpen(false)} /></div>
          </section>
        </div>
      </div>
    </div>
  );
}
