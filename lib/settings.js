import { query } from "./db";

export const LIFETIME_OPTIONS = [10, 30, 60, 120, 1440];

const DEFAULTS = {
  linkLifetimeMinutes: 10,
  baseUrl: "",
  orgName: "",
  geocodingEnabled: true,
};

export async function getSettings() {
  const { rows } = await query("select key, value from settings");
  const m = Object.fromEntries(rows.map(r => [r.key, r.value]));
  const minutes = Number(m.link_lifetime_minutes);
  return {
    linkLifetimeMinutes: LIFETIME_OPTIONS.includes(minutes) ? minutes : DEFAULTS.linkLifetimeMinutes,
    baseUrl: m.base_url ?? DEFAULTS.baseUrl,
    orgName: m.org_name ?? DEFAULTS.orgName,
    geocodingEnabled: m.geocoding_enabled ? m.geocoding_enabled === "true" : DEFAULTS.geocodingEnabled,
  };
}

// Validates and saves; returns { settings } or { error }.
export async function updateSettings(input) {
  const out = {};
  if (input.linkLifetimeMinutes !== undefined) {
    const n = Number(input.linkLifetimeMinutes);
    if (!LIFETIME_OPTIONS.includes(n)) return { error: "Invalid link lifetime." };
    out.link_lifetime_minutes = String(n);
  }
  if (input.baseUrl !== undefined) {
    const v = String(input.baseUrl).trim().replace(/\/+$/, "");
    if (v) {
      try {
        const u = new URL(v);
        if (!/^https?:$/.test(u.protocol)) throw new Error();
      } catch {
        return { error: "Public URL must start with http:// or https://" };
      }
    }
    out.base_url = v;
  }
  if (input.orgName !== undefined) out.org_name = String(input.orgName).trim().slice(0, 60);
  if (input.geocodingEnabled !== undefined) out.geocoding_enabled = input.geocodingEnabled ? "true" : "false";

  for (const [key, value] of Object.entries(out)) {
    await query(
      `insert into settings (key, value) values ($1, $2)
       on conflict (key) do update set value = excluded.value`,
      [key, value]
    );
  }
  return { settings: await getSettings() };
}
