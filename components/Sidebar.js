"use client";
import { LayoutDashboard, LogOut, MapPin, Radio, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const items = [
  { href: "/", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/people", label: "People", Icon: Users },
  { href: "/activity", label: "Location activity", Icon: Radio },
  { href: "/settings", label: "Settings", Icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="rail">
      <div className="brand-row">
        <div className="brand-mark"><MapPin size={22} strokeWidth={1.8} /></div>
        <div className="brand-copy"><strong>Ahantu</strong><span>Consent sharing</span></div>
      </div>
      <nav className="rail-nav">
        {items.map(item => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} title={item.label} className={"rail-button" + (active ? " active" : "")}>
              <span className="nav-icon"><item.Icon size={21} strokeWidth={1.7} /></span>
              <span className="nav-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="account">
        <div className="account-avatar">LS</div>
        <div className="account-copy"><strong>Location Sender</strong><span>Sharing account</span></div>
        <button className="icon-btn logout" title="Sign out" aria-label="Sign out" onClick={logout}><LogOut size={18} /></button>
      </div>
    </aside>
  );
}
