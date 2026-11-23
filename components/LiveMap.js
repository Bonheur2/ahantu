"use client";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";

const SAT = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const STREET = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

// Interactive map that follows a moving person: marker, accuracy circle and a trail of the path.
export default function LiveMap({ latitude, longitude, accuracy, satellite }) {
  const el = useRef(null);
  const s = useRef({});            // leaflet objects
  const latest = useRef({ latitude, longitude, accuracy, satellite });
  const [following, setFollowing] = useState(true);
  latest.current = { latitude, longitude, accuracy, satellite };

  function apply() {
    const { L, map, marker, circle, trail, layers } = s.current;
    if (!map) return;
    const { latitude: lat, longitude: lng, accuracy: acc, satellite: sat } = latest.current;
    const pos = [lat, lng];
    marker.setLatLng(pos);
    circle.setLatLng(pos);
    circle.setRadius(acc ?? 0);
    const pts = trail.getLatLngs();
    const last = pts[pts.length - 1];
    if (!last || map.distance(last, pos) > 3) trail.addLatLng(pos); // ignore GPS jitter
    if (s.current.following) map.panTo(pos, { animate: true, duration: 1 });
    const want = sat ? layers.sat : layers.street;
    const other = sat ? layers.street : layers.sat;
    if (!map.hasLayer(want)) { map.addLayer(want); map.removeLayer(other); }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !el.current) return;
      const { latitude: lat, longitude: lng } = latest.current;
      const map = L.map(el.current, { zoomControl: true, attributionControl: true }).setView([lat, lng], 18);
      const layers = {
        sat: L.tileLayer(SAT, { maxZoom: 19, attribution: "Tiles &copy; Esri" }),
        street: L.tileLayer(STREET, { maxZoom: 19, attribution: "&copy; OpenStreetMap contributors" }),
      };
      layers.sat.addTo(map);
      const circle = L.circle([lat, lng], { radius: 0, weight: 1, color: "#ffc107", fillColor: "#ffc107", fillOpacity: 0.15 }).addTo(map);
      const trail = L.polyline([], { color: "#ffc107", weight: 4, opacity: 0.9 }).addTo(map);
      const icon = L.divIcon({ className: "live-dot", html: "<span></span>", iconSize: [22, 22], iconAnchor: [11, 11] });
      const marker = L.marker([lat, lng], { icon, interactive: false }).addTo(map);
      map.on("dragstart", () => { s.current.following = false; setFollowing(false); });
      s.current = { L, map, marker, circle, trail, layers, following: true };
      apply();
    })();
    return () => {
      cancelled = true;
      s.current.map?.remove();
      s.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(apply, [latitude, longitude, accuracy, satellite]);

  function recenter() {
    s.current.following = true;
    setFollowing(true);
    s.current.map?.panTo([latest.current.latitude, latest.current.longitude]);
  }

  return (
    <>
      <div ref={el} className="d-map" />
      {!following && <button type="button" className="recenter" onClick={recenter}>Follow</button>}
    </>
  );
}
