import { redirect } from "next/navigation";

import { getUserServer } from "@/lib/session";

export default async function RootPage() {
  const user = await getUserServer();
  redirect(user ? "/main" : "/login");
}
