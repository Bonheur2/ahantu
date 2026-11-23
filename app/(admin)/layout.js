import Sidebar from "@/components/Sidebar";
import LiveRefresh from "@/components/LiveRefresh";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }) {
  return (
    <div>
      <Sidebar />
      <main className="main">
        <header className="topbar"><h1>Location sharing administration</h1></header>
        <div className="content">{children}</div>
      </main>
      <LiveRefresh />
    </div>
  );
}
