"use client";
import { useEffect, useRef, useState } from "react";

const HEARTBEAT_MS = 10000; // re-send the last position so a stationary person still counts as live
const POOR_ACCURACY_M = 100;

export default function ShareClient({ token, name, orgName }) {
  const storeKey = `locate-consent-${token}`;
  const [consent, setConsent] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [canResume, setCanResume] = useState(false);
  const [status, setStatus] = useState("Sharing is stopped.");
  const [accuracy, setAccuracy] = useState(null);
  const watchId = useRef(null);
  const heartbeat = useRef(null);
  const lastPos = useRef(null);
  const lastSent = useRef(0);
  const wakeLock = useRef(null);
  const wanted = useRef(false); // true while the person wants sharing on

  async function send(location) {
    try {
      const res = await fetch(`/api/location/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(location),
        keepalive: true,
      });
      if (res.status === 410) {
        wanted.current = false;
        halt();
        setStatus("This link has expired. Sharing stopped.");
      }
    } catch {
      setStatus("Connection problem - retrying...");
    }
  }

  async function lockScreen() {
    try {
      if ("wakeLock" in navigator) wakeLock.current = await navigator.wakeLock.request("screen");
    } catch {}
  }

  function halt() {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    clearInterval(heartbeat.current);
    heartbeat.current = null;
    lastPos.current = null;
    wakeLock.current?.release?.().catch(() => {});
    wakeLock.current = null;
    setSharing(false);
  }

  function begin() {
    if (!navigator.geolocation) {
      setStatus("Geolocation is not supported.");
      return;
    }
    wanted.current = true;
    try { localStorage.setItem(storeKey, "1"); } catch {}
    setCanResume(false);
    setStatus("Requesting browser permission...");
    watchId.current = navigator.geolocation.watchPosition(
      position => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: position.coords.accuracy,
          timestamp: new Date().toISOString(),
        };
        const first = lastPos.current === null;
        lastPos.current = location;
        setSharing(true);
        setAccuracy(Math.round(position.coords.accuracy));
        setStatus(`${name} is actively sharing. Keep this page open.`);
        if (first || Date.now() - lastSent.current >= 2000) {
          lastSent.current = Date.now();
          send(location);
        }
        if (first) {
          lockScreen();
          heartbeat.current = setInterval(() => {
            if (lastPos.current) send({ ...lastPos.current, timestamp: new Date().toISOString() });
          }, HEARTBEAT_MS);
        }
      },
      error => {
        wanted.current = false;
        halt();
        setStatus(`Sharing stopped (${error.code}): ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }

  function stop() {
    wanted.current = false;
    try { localStorage.removeItem(storeKey); } catch {}
    halt();
    setAccuracy(null);
    setStatus("Sharing is stopped.");
    fetch(`/api/location/${token}`, { method: "DELETE" });
  }

  useEffect(() => {
    // Reopening the link: offer one-tap resume (browser permission still applies).
    try { if (localStorage.getItem(storeKey)) setCanResume(true); } catch {}

    // Coming back to the page: browsers freeze/drop location in the background, so restart it.
    const onVisible = () => {
      if (document.visibilityState !== "visible" || !wanted.current) return;
      lockScreen();
      const stale = !lastPos.current || Date.now() - new Date(lastPos.current.timestamp).getTime() > 15000;
      if (stale) {
        halt();
        begin();
      }
    };
    // Warn before the person navigates away: leaving the page stops tracking.
    const onBeforeUnload = e => {
      if (wanted.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("beforeunload", onBeforeUnload);
      wanted.current = false;
      halt();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20 }}>
      <section className="unit-card" style={{ width: "min(520px,100%)", margin: 0 }}>
        <div className="unit-header"><h1>{name}, share your location?</h1></div>
        <div style={{ padding: 20 }}>
          <div className="consent" style={{ marginBottom: 16 }}>
            {orgName ? `${orgName} is asking for your location. ` : ""}Precise browser location will be shared only after you confirm and approve browser permission.
            It updates live while this page stays open. You can stop sharing at any time.
          </div>

          {canResume && !sharing && (
            <div className="consent" style={{ marginBottom: 16, background: "#fff7e0" }}>
              You were sharing earlier. <button className="btn primary" style={{ marginLeft: 8, minHeight: 32 }} onClick={begin}>Resume sharing</button>
            </div>
          )}

          <label className="field" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" style={{ width: "auto", height: "auto", margin: 0 }} checked={consent} onChange={e => setConsent(e.target.checked)} />
            I confirm that I, {name}, consent to share my location.
          </label>
          <div className="actions" style={{ padding: 0 }}>
            <button className="btn primary" disabled={!consent || sharing} onClick={begin}>Start sharing</button>
            <button className="btn" disabled={!sharing} onClick={stop}>Stop sharing</button>
          </div>

          <p>{status}</p>
          {sharing && (
            <>
              <p style={{ fontSize: 13, color: "#667085" }}>
                Leaving this page, switching apps or locking the phone pauses sharing. Keep it open on screen.
              </p>
              {accuracy !== null && accuracy > POOR_ACCURACY_M && (
                <p style={{ fontSize: 13, color: "#b54708", background: "#fffaeb", padding: 10, borderRadius: 8 }}>
                  Your location is only accurate to about {accuracy} m. For a better reading, use a phone outdoors with Precise location allowed.
                </p>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
