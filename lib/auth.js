import crypto from "node:crypto";

export const SESSION_COOKIE = "locate_session";
export const SESSION_MAX_AGE = 7 * 24 * 3600; // seconds

// Changing ADMIN_PASSWORD (or SESSION_SECRET) signs everyone out.
function secret() {
  return process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

function sign(value) {
  return crypto.createHmac("sha256", secret()).update(value).digest("base64url");
}

export function createSession() {
  const exp = String(Math.floor(Date.now() / 1000) + SESSION_MAX_AGE);
  return `${exp}.${sign(exp)}`;
}

export function verifySession(token) {
  if (!token || !secret()) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(exp));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function digest(v) {
  return crypto.createHash("sha256").update(String(v)).digest();
}

export function checkCredentials(username, password) {
  const expectedUser = process.env.ADMIN_USERNAME || "admin";
  const expectedPass = process.env.ADMIN_PASSWORD || "";
  if (!expectedPass) return false;
  const userOk = crypto.timingSafeEqual(digest(username), digest(expectedUser));
  const passOk = crypto.timingSafeEqual(digest(password), digest(expectedPass));
  return userOk && passOk;
}
