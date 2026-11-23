"use client";
import { Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import Avatar from "./Avatar";
import TimeAgo from "./TimeAgo";
import PersonActions from "./PersonActions";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "sharing", label: "Sharing" },
  { key: "inactive", label: "Inactive" },
];

export default function PeopleTable({ people, baseUrl }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [now, setNow] = useState(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(t);
  }, []);

  const counts = {
    all: people.length,
    sharing: people.filter(p => p.sharing).length,
    inactive: people.filter(p => !p.sharing).length,
  };

  const shown = people.filter(p => {
    if (filter === "sharing" && !p.sharing) return false;
    if (filter === "inactive" && p.sharing) return false;
    return (p.name + " " + p.memberNo).toLowerCase().includes(q.toLowerCase());
  });

  function linkState(p) {
    if (now === null) return { cls: "off", text: "-" };
    const left = new Date(p.expiresAt).getTime() - now;
    if (left <= 0) return { cls: "bad", text: "Expired" };
    return { cls: "live", text: `${Math.max(1, Math.ceil(left / 60000))} min left` };
  }

  return (
    <>
      <div className="toolbar">
        <div className="search">
          <span><Search size={16} /></span>
          <input placeholder="Search by name or member no..." value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="chips">
          {FILTERS.map(f => (
            <button key={f.key} type="button" className={"chip" + (filter === f.key ? " on" : "")} onClick={() => setFilter(f.key)}>
              {f.label}<small>{counts[f.key]}</small>
            </button>
          ))}
        </div>
      </div>

      <section className="table-card">
        <table>
          <thead><tr><th>Person</th><th>Status</th><th>Location</th><th>Consent link</th><th>Actions</th></tr></thead>
          <tbody>
            {shown.map(p => {
              const ls = linkState(p);
              return (
                <tr key={p.id}>
                  <td>
                    <div className="member">
                      <Link href={`/people/${p.id}`} style={{ textDecoration: "none" }}><Avatar name={p.name} /></Link>
                      <div className="person-cell">
                        <Link href={`/people/${p.id}`} style={{ color: "inherit", textDecoration: "none" }}><strong>{p.name}</strong></Link>
                        <small>{p.memberNo}</small>
                      </div>
                    </div>
                  </td>
                  <td><span className={"status-pill " + (p.sharing ? "live" : "off")}>{p.sharing ? "Sharing" : p.location ? "Last seen" : "Inactive"}</span></td>
                  <td className="location-cell">
                    {p.location
                      ? (<>{p.location.placeName ?? "Place name unavailable"}<br /><small>{p.sharing ? "" : <>Last seen <TimeAgo iso={p.location.at} /> &middot; </>}{p.location.latitude.toFixed(5)}, {p.location.longitude.toFixed(5)}</small></>)
                      : <span className="empty">No consent response</span>}
                  </td>
                  <td><span className={"status-pill " + ls.cls}>{ls.text}</span></td>
                  <td><PersonActions person={p} baseUrl={baseUrl} /></td>
                </tr>
              );
            })}
            {shown.length === 0 && (
              <tr><td colSpan={5}><div className="empty-state">{people.length === 0 ? "No people yet. Add your first person to get started." : "No people match your search."}</div></td></tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}
