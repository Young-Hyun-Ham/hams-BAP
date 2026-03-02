// app/api/menus/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getMenusByBackend } from "@/lib/services";
import { getUserServer } from "@/lib/session";

export async function GET(req: NextRequest) {
  const backend = (process.env.NEXT_PUBLIC_BACKEND as "postgres" | "firebase" | undefined) ?? "firebase";
  const user = await getUserServer();
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const isAdmin = roles.includes("admin");

  const items = await getMenusByBackend(backend);

  const filteredItems = isAdmin
    ? items
    : items.filter((item) => {
        const menuId = String(item.menu_id ?? "").toLowerCase();
        const href = String(item.href ?? "").toLowerCase();
        return menuId !== "admin" && !href.startsWith("/admin");
      });

  return NextResponse.json({ items: filteredItems });
}
export const runtime = "nodejs";