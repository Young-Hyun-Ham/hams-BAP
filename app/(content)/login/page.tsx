import { redirect } from "next/navigation";

import { normalizeReturnTo } from "@/lib/sso";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo } = await searchParams;

  redirect(`/api/sso/login?returnTo=${encodeURIComponent(normalizeReturnTo(returnTo))}`);
}
