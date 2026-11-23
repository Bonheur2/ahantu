import Link from "next/link";
import { listPeople } from "@/lib/people";
import PageHeader from "@/components/PageHeader";
import Avatar from "@/components/Avatar";
import TimeAgo from "@/components/TimeAgo";
import StopAllButton from "@/components/StopAllButton";

export const metadata = { title: "Location activity - Locate" };

function Card({ p }) {
  const loc = p.location;
  return (
    <div className={"act-card" + (p.sharing ? " live" : "")}>
      <div className="act-top">
        <Avatar name={p.name} />
        <Link href={`/people/${p.id}`}><strong>{p.name}</strong><small>{p.memberNo}</small></Link>
        {p.sharing ? <span className="status-pill live">Live</span> : <span className="status-pill off">{loc ? "Last seen" : "Inactive"}</span>}
      </div>
      {loc ? (
        <>
          <div className="act-place">{loc.placeName ?? "Place name unavailable"}</div>
          <div className="act-meta">
            <span>{p.sharing ? "Updated" : "Last seen"} <b><TimeAgo iso={loc.at} /></b></span>
            <span>Accuracy <b>{loc.accuracy != null ? `±${Math.round(loc.accuracy)} m` : "-"}</b></span>
            <span><b>{loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}</b></span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link className="btn" href={`/people/${p.id}`}>Details</Link>
            <a className="btn" target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}>Google Maps</a>
          </div>
        </>
      ) : (
        <div className="act-meta"><span>Not sharing a location</span></div>
      )}
    </div>
  );
}

export default async function ActivityPage() {
  const people = await listPeople();
  const live = people
    .filter(p => p.sharing)
    .sort((a, b) => new Date(b.location.at ?? 0) - new Date(a.location.at ?? 0));
  const idle = people.filter(p => !p.sharing);

  return (
    <>
      <PageHeader title="Location activity" subtitle="Live view of shared locations, newest first.">
        <StopAllButton />
      </PageHeader>

      <div className="act-section">
        <span className={live.length ? "pulse" : ""} />
        <h2>Sharing now</h2><span className="eyebrow">{live.length}</span>
      </div>
      {live.length === 0
        ? <div className="s-card"><div className="empty-state">Nobody is sharing right now.</div></div>
        : <div className="act-grid">{live.map(p => <Card key={p.id} p={p} />)}</div>}

      {idle.length > 0 && (
        <>
          <div className="act-section"><h2>Not sharing</h2><span className="eyebrow">{idle.length}</span></div>
          <div className="act-grid">{idle.map(p => <Card key={p.id} p={p} />)}</div>
        </>
      )}
    </>
  );
}
