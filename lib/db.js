import pg from "pg";

const g = globalThis;

function getPool() {
  if (!g.__pgPool) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
    g.__pgPool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
      max: 5,
    });
  }
  return g.__pgPool;
}

const SCHEMA = `
create table if not exists people (
  id serial primary key,
  name text not null,
  email text,
  member_no text not null,
  type text not null default 'Student',
  share_token text not null unique,
  expires_at timestamptz not null,
  latitude double precision,
  longitude double precision,
  accuracy double precision,
  located_at timestamptz,
  created_at timestamptz not null default now()
);
alter table people add column if not exists place_name text;
alter table people alter column email drop not null;
create table if not exists settings (
  key text primary key,
  value text not null
);
`;

function ready() {
  if (!g.__pgReady) {
    g.__pgReady = getPool().query(SCHEMA).catch(err => {
      g.__pgReady = null;
      throw err;
    });
  }
  return g.__pgReady;
}

export async function query(text, params) {
  await ready();
  return getPool().query(text, params);
}
