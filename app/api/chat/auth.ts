import { getUserFromToken } from "@/lib/session";

export type JwtPayload = {
  id: string;
  sub: string | null;
  email: string;
  username: string;
  roles?: string[] | null;
  provider?: string | null;
};

export function verifyToken(token?: string): JwtPayload | null {
  const user = getUserFromToken(token);

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    sub: user.sub,
    email: user.email,
    username: user.username ?? user.nickname ?? user.email,
    roles: user.roles ?? ["user"],
    provider: user.provider ?? "sso",
  };
}
