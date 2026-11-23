import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

// Public: login page, auth API, recipient consent page + its location API, health check.
const PUBLIC = [/^\/login$/, /^\/api\/auth\//, /^\/share\//, /^\/api\/location\//, /^\/api\/health$/];

export function proxy(req) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some(re => re.test(pathname))) return NextResponse.next();

  if (!process.env.ADMIN_PASSWORD) {
    if (process.env.NODE_ENV === "production") {
      return new NextResponse("ADMIN_PASSWORD is not configured.", { status: 503 });
    }
    return NextResponse.next();
  }

  if (verifySession(req.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  if (pathname !== "/") url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico).*)"],
};
