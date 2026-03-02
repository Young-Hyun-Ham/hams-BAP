import { cookies } from "next/headers";
import { verifyToken } from "./auth";
import { getUserServer } from "@/lib/session";

export async function requireUserId(req: Request): Promise<string> {
  const userFromCookie = await getUserServer();
  if (userFromCookie?.id) {
    return userFromCookie.id;
  }

  const auth = req.headers.get("authorization");
  let token = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;

  if (!token) {
    const store = await cookies();
    token = store.get("access_token")?.value;
  }

  const payload: any = token ? verifyToken(token) : null;
  const userId = payload?.uid ?? payload?.id ?? payload?.userId ?? payload?.sub;
  if (!userId) throw new Error("UNAUTHORIZED");
  return userId;
}
