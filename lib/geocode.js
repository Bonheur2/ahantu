// Reverse geocoding via Google Maps Geocoding API (server-side only).
// Enable "Geocoding API" in Google Cloud and set GOOGLE_MAPS_API_KEY.

export function distanceMeters(a, b) {
  const R = 6371000, rad = x => (x * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude), dLon = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export async function reverseGeocode(latitude, longitude) {
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
