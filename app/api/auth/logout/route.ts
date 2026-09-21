import { NextResponse } from "next/server";
import { COMPANY_CONTEXT_COOKIE, SESSION_COOKIE } from "@/lib/auth/session";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  response.cookies.set(COMPANY_CONTEXT_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
