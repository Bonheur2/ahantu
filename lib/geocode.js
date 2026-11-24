// Reverse geocoding via Google Maps Geocoding API (server-side only).
// Enable "Geocoding API" in Google Cloud and set GOOGLE_MAPS_API_KEY.

export function distanceMeters(a, b) {
  const R = 6371000, rad = x => (x * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude), dLon = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Ahantu (https://api.ahantu.rw): official Rwandan Village, Cell, Sector, District.
// Server-side secret key only (AHANTU_API_KEY, starts with ahk_). Returns null outside Rwanda.
async function ahantuReverse(latitude, longitude) {
  const key = process.env.AHANTU_API_KEY;
  if (!key) return null;
  try {
    const url = new URL("https://api.ahantu.rw/v1/reverse");
    url.searchParams.set("lat", String(latitude));
    url.searchParams.set("lng", String(longitude));
    url.searchParams.set("lang", "en");
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) {
      // 404 outside_rwanda is normal; anything else is worth logging.
      if (res.status !== 404) console.error("Ahantu lookup failed:", res.status);
      return null;
    }
    const d = await res.json();
    const parts = [d.village?.name, d.cell?.name, d.sector?.name, d.district?.name].filter(Boolean);
    return parts.length ? parts.join(", ") : null;
  } catch (err) {
    console.error("Ahantu error:", err.message);
    return null;
  }
}

export async function reverseGeocode(latitude, longitude) {
  return (await ahantuReverse(latitude, longitude)) ?? (await googleReverse(latitude, longitude));
}

async function googleReverse(latitude, longitude) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return null;
  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("latlng", `${latitude},${longitude}`);
    url.searchParams.set("key", key);
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    const data = await res.json();
    if (data.status !== "OK") {
      console.error("Geocoding failed:", data.status, data.error_message ?? "");
      return null;
    }
    return data.results[0]?.formatted_address ?? null;
  } catch (err) {
    console.error("Geocoding error:", err.message);
    return null;
  }
}
