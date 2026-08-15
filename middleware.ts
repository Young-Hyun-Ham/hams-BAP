import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getUserFromToken } from "./lib/session-token";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  const pathname = req.nextUrl.pathname;
  const includeAdminAccount = process.env.NEXT_PUBLIC_ADMIN_ACCOUNT;

  const devMockLogin = process.env.NEXT_PUBLIC_DEV_MOCK_LOGIN === "true";

  if (
    !devMockLogin &&
    !token &&
    (req.nextUrl.pathname.startsWith("/admin") || req.nextUrl.pathname.startsWith("/main"))
  ) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("returnTo", `${req.nextUrl.pathname}${req.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin")) {
    if (devMockLogin) {
      return NextResponse.next();
    }
    const user = await getUserFromToken(token);
    const isAdmin = includeAdminAccount && includeAdminAccount.includes(user?.email ?? "");

    if (!isAdmin) {
      return NextResponse.redirect(new URL("/main", req.url));
    }
  }

  return NextResponse.next();
}
