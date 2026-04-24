import { NextRequest, NextResponse } from "next/server";

import { setAccessTokenCookie } from "@/lib/cookies";
import { createSessionToken } from "@/lib/session";
import { upsertSsoMemberProfile } from "@/lib/member-profile";
import { exchangeSsoCode, getAppBaseUrl } from "@/lib/sso";

const SSO_STATE_COOKIE = "hams_bap_sso_state";
const SSO_RETURN_TO_COOKIE = "hams_bap_sso_return_to";

function clearSsoCookies(response: NextResponse) {
  response.cookies.set(SSO_STATE_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(SSO_RETURN_TO_COOKIE, "", { path: "/", maxAge: 0 });
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")?.trim() ?? "";
  const state = request.nextUrl.searchParams.get("state")?.trim() ?? "";
  const storedState = request.cookies.get(SSO_STATE_COOKIE)?.value ?? "";
  const returnTo = request.cookies.get(SSO_RETURN_TO_COOKIE)?.value ?? "/main";

  if (!code || !state || !storedState || state !== storedState) {
    const response = NextResponse.redirect(new URL("/login?error=sso_state", getAppBaseUrl()));
    clearSsoCookies(response);
    return response;
  }

  try {
    const ssoUser = await exchangeSsoCode(code);
    await upsertSsoMemberProfile(ssoUser);

    const sessionToken = await createSessionToken({
      id: ssoUser.id,
      sub: ssoUser.id,
      email: ssoUser.email,
      username: ssoUser.nickname || ssoUser.loginId || ssoUser.email,
      name: ssoUser.nickname || ssoUser.loginId || ssoUser.email,
      nickname: ssoUser.nickname || ssoUser.loginId || ssoUser.email,
      loginId: ssoUser.loginId || "",
      loginIdLower: ssoUser.loginIdLower || ssoUser.loginId?.toLowerCase() || "",
      emailLower: ssoUser.emailLower || ssoUser.email?.toLowerCase() || "",
      roles: ["user"],
      provider: ssoUser.provider || "sso",
      providerSubject: ssoUser.providerSubject || null,
      phoneNumber: ssoUser.phoneNumber || null,
      aiEnabled: typeof ssoUser.aiEnabled === "boolean" ? ssoUser.aiEnabled : true,
      aiChatType: ssoUser.aiChatType || "gpt",
      chatModel: ssoUser.chatModel || "gpt-3.5-turbo",
      termsAcceptedAt: ssoUser.termsAcceptedAt || null,
      termsVersion: ssoUser.termsVersion || null,
      createdAt: ssoUser.createdAt,
      updatedAt: ssoUser.updatedAt,
    });

    const response = NextResponse.redirect(new URL(returnTo, getAppBaseUrl()));
    setAccessTokenCookie(request, response, sessionToken, {
      maxAgeSec: 60 * 60 * 24 * 7,
    });
    clearSsoCookies(response);
    return response;
  } catch {
    const response = NextResponse.redirect(new URL("/login?error=sso_exchange", getAppBaseUrl()));
    clearSsoCookies(response);
    return response;
  }
}
