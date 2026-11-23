import { NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_MAX_AGE, checkCredentials, createSession } from "@/lib/auth";

// Simple in-memory brute-force guard: 5 failures per IP per 15 minutes.
const g = globalThis;
const failures = (g.__loginFailures ??= new Map());
const WINDOW = 15 * 60 * 1000;

export async function POST(req) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const now = Date.now();
  const entry = failures.get(ip);
  if (entry && now - entry.first < WINDOW && entry.count >= 5) {
    return NextResponse.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  if (!checkCredentials(String(body.username ?? ""), String(body.password ?? ""))) {
    const fresh = entry && now - entry.first < WINDOW ? entry : { first: now, count: 0 };
    fresh.count++;
    failures.set(ip, fresh);
    return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });
  }

  failures.delete(ip);
  const res = NextResponse.json({ status: "ok" });
  res.cookies.set(SESSION_COOKIE, createSession(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
