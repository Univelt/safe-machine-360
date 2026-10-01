import { runSafeRoute } from "@/lib/action-errors";
import { NextResponse } from "next/server";
import { COMPANY_CONTEXT_COOKIE, SESSION_COOKIE } from "@/lib/auth/session";

async function handlePOST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  response.cookies.set(COMPANY_CONTEXT_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}

export async function POST(...args: Parameters<typeof handlePOST>) { return runSafeRoute("POST /api/auth/logout", () => handlePOST(...args)); }
