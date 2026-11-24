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

function bearing(lat1, lng1, lat2, lng2) {
  const r = d => (d * Math.PI) / 180;
  const y = Math.sin(r(lng2 - lng1)) * Math.cos(r(lat2));
  const x = Math.cos(r(lat1)) * Math.sin(r(lat2)) - Math.sin(r(lat1)) * Math.cos(r(lat2)) * Math.cos(r(lng2 - lng1));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

// Google map that follows a moving person: marker, accuracy circle and a trail of the path.
export default function LiveMap({ apiKey, latitude, longitude, accuracy, mode = "satellite", onNoStreetView }) {
  const el = useRef(null);
  const s = useRef({});
  const latest = useRef({ latitude, longitude, accuracy, mode, onNoStreetView });
  const [following, setFollowing] = useState(true);
  const [error, setError] = useState("");
  latest.current = { latitude, longitude, accuracy, mode, onNoStreetView };

  function apply() {
    const { map, marker, circle, trail } = s.current;
    if (!map) return;
    const { latitude: lat, longitude: lng, accuracy: acc, mode: m } = latest.current;
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
    if (movedMeters > 5 && last) s.current.heading = bearing(last.lat(), last.lng(), lat, lng);
    if (m !== "street" && s.current.following) map.panTo(pos);
    const pano = map.getStreetView();

    if (m === "street") {
      // Street View panorama of the person's position; refresh when they move >15 m.
      const at = s.current.panoAt;
      const dist = at
        ? Math.hypot((at.lat - lat) * 111320, (at.lng - lng) * 111320 * Math.cos((lat * Math.PI) / 180))
        : Infinity;
      if (dist > 15 && !s.current.svBusy) {
        s.current.svBusy = true;
        s.current.sv.getPanorama({ location: pos, radius: 80, source: g.StreetViewSource.OUTDOOR }, (data, status) => {
          s.current.svBusy = false;
          if (status === "OK" && data?.location?.pano) {
            s.current.panoAt = pos;
            pano.setPano(data.location.pano);
            pano.setPov({ heading: s.current.heading ?? 0, pitch: 0 });
            pano.setVisible(true);
          } else if (!s.current.panoAt) {
            latest.current.onNoStreetView?.();
          }
        });
      } else if (s.current.panoAt && !pano.getVisible()) {
        pano.setVisible(true);
      }
    } else {
      s.current.panoAt = null;
      if (pano.getVisible()) pano.setVisible(false);
      map.setMapTypeId(m === "map" ? "roadmap" : "hybrid");
    }
  }

  useEffect(() => {
    if (!apiKey) { setError("Google Maps key is not configured."); return; }
    let cancelled = false;
    window.gm_authFailure = () =>
      setError("Google Maps rejected the key. Enable \"Maps JavaScript API\" for it in Google Cloud.");
    loadGoogleMaps(apiKey)
      .then(g => {
        if (cancelled || !el.current) return;
        const { latitude: lat, longitude: lng } = latest.current;
        const center = { lat, lng };
        const map = new g.Map(el.current, {
          center, zoom: 18, mapTypeId: "hybrid",
          streetViewControl: false, fullscreenControl: false, mapTypeControl: false, clickableIcons: false,
        });
        const marker = new g.Marker({
          map, position: center,
          icon: { path: g.SymbolPath.CIRCLE, scale: 9, fillColor: "#2f80ed", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 3 },
        });
        const circle = new g.Circle({ map, center, radius: 0, strokeColor: "#ffc107", strokeWeight: 1, fillColor: "#ffc107", fillOpacity: 0.15 });
        const trail = new g.Polyline({ map, path: [], strokeColor: "#ffc107", strokeWeight: 4, strokeOpacity: 0.9 });
        map.addListener("dragstart", () => { s.current.following = false; setFollowing(false); });
        map.getStreetView().setOptions({ addressControl: false, fullscreenControl: false, enableCloseButton: false, motionTracking: false, linksControl: true, zoomControl: true });
        s.current = { map, marker, circle, trail, following: true, sv: new g.StreetViewService() };
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

  useEffect(apply, [latitude, longitude, accuracy, mode]);

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
      {mode !== "street" && !following && <button type="button" className="recenter" onClick={recenter}>Follow</button>}
    </>
  );
}
