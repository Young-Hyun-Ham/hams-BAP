import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { buildSsoStartUrl, normalizeReturnTo } from "@/lib/sso";

const SSO_STATE_COOKIE = "hams_bap_sso_state";
const SSO_RETURN_TO_COOKIE = "hams_bap_sso_return_to";
const COOKIE_MAX_AGE_SEC = 60 * 10;

export async function GET(request: NextRequest) {
  const returnTo = normalizeReturnTo(request.nextUrl.searchParams.get("returnTo"));
  const state = randomUUID();
  const response = NextResponse.redirect(buildSsoStartUrl(state));

  response.cookies.set({
    name: SSO_STATE_COOKIE,
    value: state,
    httpOnly: true,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SEC,
  });

  response.cookies.set({
    name: SSO_RETURN_TO_COOKIE,
    value: returnTo,
    httpOnly: true,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SEC,
  });

  return response;
}
