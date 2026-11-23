"use client";
import { UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export default function AddPersonButton({ label = "Add person", primary = true }) {
  const dialog = useRef(null);
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setBusy(true);
    setError("");
    const res = await fetch("/api/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error || "Could not create person.");
      return;
    }
    form.reset();
    dialog.current.close();
    router.refresh();
  }

  return (
    <>
      <button className={"btn" + (primary ? " primary" : "")} onClick={() => dialog.current.showModal()}>{primary && <UserPlus size={16} />}{label}</button>
      <dialog ref={dialog}>
        <form onSubmit={submit}>
          <div className="dialog-head"><h2>Add person</h2><button className="icon-btn" type="button" onClick={() => dialog.current.close()}><X size={18} /></button></div>
          <div className="dialog-body">
            <label className="field">Full name<input name="name" required maxLength={50} placeholder="Person name" /></label>
            <label className="field">Member number<input name="memberNo" maxLength={30} placeholder="KT-001" /></label>
            <div className="consent">This creates an opt-in consent entry only. It does not create an email account or share location without browser permission.</div>
            {error && <p className="error" style={{ marginTop: 12 }}>{error}</p>}
          </div>
          <div className="dialog-actions">
            <button className="btn" type="button" onClick={() => dialog.current.close()}>Cancel</button>
            <button className="btn primary" type="submit" disabled={busy}>Create person</button>
          </div>
        </form>
      </dialog>
    </>
  );
}
