import { NextRequest, NextResponse } from "next/server";
import { readSessionToken, SESSION_COOKIE } from "@/lib/auth/session";

const publicPaths = ["/login", "/apresentacao"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await readSessionToken(token) : null;

  if (!session && !isPublic) {
    const login = new URL("/login", request.url);
    login.searchParams.set("from", pathname);
    return NextResponse.redirect(login);
  }

  if (session && pathname === "/login") {
    const home = session.role === "SUPER_ADMIN" ? "/" : "/cliente";
    return NextResponse.redirect(new URL(home, request.url));
  }

  if (session && session.role !== "SUPER_ADMIN" && (pathname === "/" || pathname.startsWith("/admin"))) {
    return NextResponse.redirect(new URL("/cliente", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
