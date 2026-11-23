"use client";
import { Copy, ExternalLink, RefreshCw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function shareUrl(token, baseUrl) {
  return `${baseUrl || window.location.origin}/share/${token}`;
}

export default function PersonActions({ person, baseUrl }) {
  const router = useRouter();

  async function remove() {
    if (!confirm(`Remove ${person.name}?`)) return;
    await fetch(`/api/people/${person.id}`, { method: "DELETE" });
    router.refresh();
  }
  async function renew() {
    await fetch(`/api/people/${person.id}/renew`, { method: "POST" });
    router.refresh();
  }

  return (
    <div className="row-actions">
      <a className="icon-btn" href={`/share/${person.shareToken}`} target="_blank" rel="noreferrer" title="Open sharing link"><ExternalLink size={16} /></a>
      <button className="icon-btn" title="Copy link" onClick={() => navigator.clipboard.writeText(shareUrl(person.shareToken, baseUrl))}><Copy size={16} /></button>
      <button className="icon-btn" title="Renew link (new token, resets expiry)" onClick={renew}><RefreshCw size={16} /></button>
      <button className="icon-btn danger" title="Remove" onClick={remove}><Trash2 size={16} /></button>
    </div>
  );
}
