"use client";
import { useEffect, useRef, useState } from "react";

let loader = null;
function loadGoogleMaps(key) {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.google?.maps?.Map) return Promise.resolve(window.google.maps);
  if (!loader) {
    loader = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly`;
      s.async = true;
      s.onload = () => resolve(window.google.maps);
      s.onerror = () => { loader = null; reject(new Error("Could not load Google Maps")); };
      document.head.appendChild(s);
    });
  }
  return loader;
}

// Google map that follows a moving person: marker, accuracy circle and a trail of the path.
export default function LiveMap({ apiKey, latitude, longitude, accuracy, satellite }) {
  const el = useRef(null);
  const s = useRef({});
  const latest = useRef({ latitude, longitude, accuracy, satellite });
  const [following, setFollowing] = useState(true);
  const [error, setError] = useState("");
  latest.current = { latitude, longitude, accuracy, satellite };

  function apply() {
    const { map, marker, circle, trail } = s.current;
    if (!map) return;
    const { latitude: lat, longitude: lng, accuracy: acc, satellite: sat } = latest.current;
    const pos = { lat, lng };
    marker.setPosition(pos);
    circle.setCenter(pos);
    circle.setRadius(acc ?? 0);
    const path = trail.getPath();
    const last = path.getLength() ? path.getAt(path.getLength() - 1) : null;
    const g = window.google.maps;
    const movedMeters = last
      ? Math.hypot((last.lat() - lat) * 111320, (last.lng() - lng) * 111320 * Math.cos((lat * Math.PI) / 180))
      : Infinity;
    if (movedMeters > 3) path.push(new g.LatLng(lat, lng)); // ignore GPS jitter under ~3 m
    if (s.current.following) map.panTo(pos);
    map.setMapTypeId(sat ? "hybrid" : "roadmap");
  }

  useEffect(() => {
    if (!apiKey) { setError("Google Maps key is not configured."); return; }
    let cancelled = false;
    window.gm_authFailure = () =>
      setError("Google Maps rejected the key. Enable \"Maps JavaScript API\" for it in Google Cloud.");
    loadGoogleMaps(apiKey)
      .then(g => {
        if (cancelled || !el.current) return;
        const { latitude: lat, longitude: lng, satellite: sat } = latest.current;
        const center = { lat, lng };
        const map = new g.Map(el.current, {
          center, zoom: 18, mapTypeId: sat ? "hybrid" : "roadmap",
          streetViewControl: false, fullscreenControl: false, mapTypeControl: false, clickableIcons: false,
        });
        const marker = new g.Marker({
          map, position: center,
          icon: { path: g.SymbolPath.CIRCLE, scale: 9, fillColor: "#2f80ed", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 3 },
        });
        const circle = new g.Circle({ map, center, radius: 0, strokeColor: "#ffc107", strokeWeight: 1, fillColor: "#ffc107", fillOpacity: 0.15 });
        const trail = new g.Polyline({ map, path: [], strokeColor: "#ffc107", strokeWeight: 4, strokeOpacity: 0.9 });
        map.addListener("dragstart", () => { s.current.following = false; setFollowing(false); });
        s.current = { map, marker, circle, trail, following: true };
        apply();
      })
      .catch(e => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
      const { marker, circle, trail } = s.current;
      marker?.setMap(null); circle?.setMap(null); trail?.setMap(null);
      s.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  useEffect(apply, [latitude, longitude, accuracy, satellite]);

  function recenter() {
    s.current.following = true;
    setFollowing(true);
    s.current.map?.panTo({ lat: latest.current.latitude, lng: latest.current.longitude });
  }

  if (error) {
    return (
      <div className="d-map map-error">
        <p>{error}</p>
        <a className="btn" target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${latitude},${longitude}`}>Open in Google Maps</a>
      </div>
    );
  }

  return (
    <>
      <div ref={el} className="d-map" />
      {!following && <button type="button" className="recenter" onClick={recenter}>Follow</button>}
    </>
  );
}
