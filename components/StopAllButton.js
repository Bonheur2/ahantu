"use client";
import { useRouter } from "next/navigation";

export default function StopAllButton() {
  const router = useRouter();
  return (
    <button className="btn danger" onClick={async () => { await fetch("/api/stop-all", { method: "POST" }); router.refresh(); }}>
      Stop all sharing
    </button>
  );
}
