import crypto from "crypto";
import { query } from "./db";
import { getSettings } from "./settings";
import { distanceMeters, reverseGeocode } from "./geocode";


const LIVE_WINDOW_MS = 90 * 1000;

function toPerson(row) {
  // location = last known position (kept while the link is valid).
  // live = the phone reported within the last 90s. The share page sends a heartbeat
  // every 10s, so a closed tab / backgrounded phone flips to "last seen" quickly.
  const valid = new Date(row.expires_at) > new Date();
  const hasLocation = row.latitude != null && valid;
  const live = hasLocation && row.located_at && Date.now() - row.located_at.getTime() < LIVE_WINDOW_MS;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    memberNo: row.member_no,
    shareToken: row.share_token,
    expiresAt: row.expires_at.toISOString(),
    sharing: Boolean(live),
    location: hasLocation
      ? { latitude: row.latitude, longitude: row.longitude, accuracy: row.accuracy, at: row.located_at?.toISOString() ?? null, placeName: row.place_name }
      : null,
  };
}

async function getLifetimeMinutes() {
  return (await getSettings()).linkLifetimeMinutes;
}

export async function listPeople() {
  const { rows } = await query("select * from people order by id");
  return rows.map(toPerson);
}

export async function createPerson({ name, memberNo }) {
  const minutes = await getLifetimeMinutes();
  const token = crypto.randomBytes(16).toString("hex");
  const { rows } = await query(
    `insert into people (name, member_no, share_token, expires_at)
     values ($1, $2, $3, now() + make_interval(mins => $4))
     returning *`,
    [name, memberNo || "pending", token, minutes]
  );
  let row = rows[0];
  if (!memberNo) {
    const upd = await query("update people set member_no = $2 where id = $1 returning *", [
      row.id,
      "KT-" + String(row.id).padStart(3, "0"),
    ]);
    row = upd.rows[0];
  }
  return toPerson(row);
}

export async function deletePerson(id) {
  await query("delete from people where id = $1", [id]);
}

// New token + fresh expiry; clears any previous location.
export async function renewLink(id) {
  const minutes = await getLifetimeMinutes();
  const token = crypto.randomBytes(16).toString("hex");
  const { rows } = await query(
    `update people set share_token = $2, expires_at = now() + make_interval(mins => $3),
       latitude = null, longitude = null, accuracy = null, located_at = null, place_name = null
     where id = $1 returning *`,
    [id, token, minutes]
  );
  return rows[0] ? toPerson(rows[0]) : null;
}

export async function getPersonByToken(token) {
  const { rows } = await query(
    "select * from people where share_token = $1 and expires_at > now()",
    [token]
  );
  return rows[0] ? toPerson(rows[0]) : null;
}

export async function saveLocation(token, { latitude, longitude, accuracy }) {
  // Only call the geocoder when the person is new to sharing or has moved ~100m,
  // so we don't burn Google API quota on every GPS tick.
  const prev = (await query(
    "select latitude, longitude, place_name from people where share_token = $1 and expires_at > now()",
    [token]
  )).rows[0];
  if (!prev) return false;
  let placeName = prev.place_name;
  const moved = prev.latitude == null || distanceMeters(prev, { latitude, longitude }) > 100;
  if ((await getSettings()).geocodingEnabled && (!placeName || moved)) placeName = (await reverseGeocode(latitude, longitude)) ?? placeName;
  const { rowCount } = await query(
    `update people set latitude = $2, longitude = $3, accuracy = $4, located_at = now(), place_name = $5
     where share_token = $1 and expires_at > now()`,
    [token, latitude, longitude, accuracy ?? null, placeName ?? null]
  );
  return rowCount > 0;
}

export async function clearLocation(token) {
  await query(
    `update people set latitude = null, longitude = null, accuracy = null, located_at = null, place_name = null
     where share_token = $1`,
    [token]
  );
}

export async function clearAllLocations() {
  await query("update people set latitude = null, longitude = null, accuracy = null, located_at = null, place_name = null");
}

export async function getPersonById(id) {
  const { rows } = await query("select * from people where id = $1", [id]);
  return rows[0] ? toPerson(rows[0]) : null;
}

export async function updatePerson(id, { name, memberNo }) {
  const { rows } = await query(
    "update people set name = $2, member_no = $3 where id = $1 returning *",
    [id, name, memberNo]
  );
  return rows[0] ? toPerson(rows[0]) : null;
}

export async function clearLocationById(id) {
  await query(
    `update people set latitude = null, longitude = null, accuracy = null, located_at = null, place_name = null
     where id = $1`,
    [id]
  );
}
