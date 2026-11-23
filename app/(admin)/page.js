import { Bell, Clock, PieChart, Radio, TriangleAlert, Users } from "lucide-react";
import Link from "next/link";
import { listPeople } from "@/lib/people";
import PageHeader from "@/components/PageHeader";
import Avatar from "@/components/Avatar";
import TimeAgo from "@/components/TimeAgo";
import AddPersonButton from "@/components/AddPersonButton";
import StopAllButton from "@/components/StopAllButton";

export const metadata = { title: "Dashboard - Locate" };

export default async function DashboardPage() {
  const people = await listPeople();
  const now = Date.now();
  const sharing = people.filter(p => p.sharing);
  const lost = people.filter(p => p.location && !p.sharing);
  const linkActive = p => new Date(p.expiresAt).getTime() > now;
  const awaiting = people.filter(p => !p.location && linkActive(p));
  const expired = people.filter(p => !p.location && !linkActive(p));
  const rate = people.length ? Math.round((sharing.length / people.length) * 100) : 0;

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Who is sharing their location right now.">
        <AddPersonButton />
        <StopAllButton />
      </PageHeader>

      <div className="kpis">
        <div className="kpi"><div className="kpi-icon blue"><Users size={22} /></div><div><strong>{people.length}</strong><span>People</span></div></div>
        <div className="kpi"><div className="kpi-icon green"><Radio size={22} /></div><div><strong>{sharing.length}</strong><span>Sharing now</span></div></div>
        <div className="kpi"><div className="kpi-icon"><Clock size={22} /></div><div><strong>{awaiting.length}</strong><span>Awaiting response</span></div></div>
        <div className="kpi"><div className="kpi-icon red"><TriangleAlert size={22} /></div><div><strong>{expired.length}</strong><span>Expired links</span></div></div>
      </div>

      <div className="dash-grid">
        <section className="s-card">
          <div className="s-head">
            <div className="s-icon"><Radio size={20} /></div>
            <div className="grow"><h2>Live now</h2><p>People currently sharing a location.</p></div>
            <span className="eyebrow">{sharing.length}</span>
          </div>
          {sharing.length === 0 && <div className="empty-state">Nobody is sharing right now.</div>}
          {sharing.map(p => (
            <Link key={p.id} href={`/people/${p.id}`} className="list-row">
              <span className="pulse" />
              <Avatar name={p.name} />
              <div className="grow">
                <strong>{p.name}</strong>
                <small>{p.location.placeName ?? `${p.location.latitude.toFixed(4)}, ${p.location.longitude.toFixed(4)}`}</small>
              </div>
              <small style={{ flex: "none" }}><TimeAgo iso={p.location.at} /></small>
            </Link>
          ))}
        </section>

        <div className="dash-col">
          <section className="s-card">
            <div className="s-head"><div className="s-icon"><PieChart size={20} /></div><div><h2>Participation</h2><p>{sharing.length} of {people.length} people are sharing.</p></div></div>
            <div style={{ padding: "14px 0 18px" }}>
              <div className="progress"><div style={{ width: `${rate}%` }} /></div>
              <div className="s-hint" style={{ padding: "6px 22px 0" }}>{rate}% participation</div>
            </div>
          </section>

          <section className="s-card">
            <div className="s-head">
              <div className="s-icon"><Bell size={20} /></div>
              <div className="grow"><h2>Needs attention</h2><p>Links that have not led to sharing yet.</p></div>
            </div>
            {lost.length + awaiting.length + expired.length === 0 && <div className="empty-state">Everything is up to date.</div>}
            {[...lost.map(p => ({ p, label: "Last seen" })), ...expired.map(p => ({ p, label: "Link expired", bad: true })), ...awaiting.map(p => ({ p, label: "Awaiting" }))].slice(0, 6).map(({ p, label, bad }) => (
              <Link key={p.id} href={`/people/${p.id}`} className="list-row">
                <Avatar name={p.name} />
                <div className="grow"><strong>{p.name}</strong><small>{p.memberNo}</small></div>
                <span className={"status-pill " + (bad ? "bad" : "off")}>{label}</span>
              </Link>
            ))}
          </section>
        </div>
      </div>
    </>
  );
}
