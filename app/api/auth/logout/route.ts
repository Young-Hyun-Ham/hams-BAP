import { NextRequest, NextResponse } from "next/server";

import { clearTokenCookie } from "@/lib/cookies";
import { buildSsoLogoutUrl, normalizeReturnTo } from "@/lib/sso";

export async function GET(req: NextRequest) {
  const returnTo = normalizeReturnTo(req.nextUrl.searchParams.get("returnTo"));
  const res = NextResponse.redirect(buildSsoLogoutUrl(returnTo));
  clearTokenCookie(req, res, "access_token");
  return res;
}
