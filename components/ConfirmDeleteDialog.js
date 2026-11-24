"use client";
import { Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Styled replacement for window.confirm when deleting a person.
export default function ConfirmDeleteDialog({ open, name, onConfirm, onClose }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      setError("");
      d.showModal();
    }
    if (!open && d.open) d.close();
  }, [open]);

  async function confirm() {
    setBusy(true);
    setError("");
    try {
      await onConfirm();
    } catch {
      setError("Could not delete. Please try again.");
    }
    setBusy(false);
  }

  return (
    <dialog
      ref={ref}
      className="confirm-dialog"
      onClose={onClose}
      onClick={e => { if (e.target === ref.current && !busy) onClose(); }} // click on backdrop
    >
      <div className="confirm-body">
        <div className="confirm-icon"><Trash2 size={24} strokeWidth={1.8} /></div>
        <h2>Delete {name}?</h2>
        <p>
          This permanently removes <b>{name}</b>, their consent link and their last known location.
          This can&apos;t be undone.
        </p>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="confirm-actions">
          <button type="button" className="btn" onClick={onClose} disabled={busy} autoFocus>Cancel</button>
          <button type="button" className="btn danger-solid" onClick={confirm} disabled={busy}>
            {busy ? "Deleting..." : "Delete person"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
