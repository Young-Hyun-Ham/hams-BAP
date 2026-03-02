// lib/session.ts
import "server-only";
import { cookies } from "next/headers";
import { jwtVerify, type JWTPayload  } from "jose";
import { User } from "@/types/user";

// 백엔드와 같은 시크릿을 프론트(.env.local)에 넣되, NEXT_PUBLIC로 시작하지 마세요!
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
type JwtUserPayload = JWTPayload & Partial<User> & { id?: string; uid?: string; userId?: string };

export async function getUserServer(): Promise<User | null> {
  const store = await cookies();
  const token = store.get("access_token")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET, {
      issuer: undefined, audience: undefined,
    });
    const p = payload as JwtUserPayload;
    const id = p.id ?? p.uid ?? p.userId;
    if (!id) return null;

    const user: User = {
      id: String(id),
      sub: String(p.sub ?? id),
      email: String(p.email ?? ""),
      username: String(p.username ?? ""),
      roles: Array.isArray(p.roles) ? p.roles : ["user"],
      provider: p.provider ?? "google",
    };
    return user;
  } catch {
    return null;
  }
}

