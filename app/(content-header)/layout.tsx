// app/(content-header)/layout.tsx (서버컴포넌트)
import type { ReactNode } from "react";
import { cookies } from "next/headers";

import type { NavItem } from '../../types/nav';
import HeaderNav from '../../components/HeaderNav';
import ContentLayout from "../../components/ContentLayout";

async function loadMenus(): Promise<NavItem[]> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${encodeURIComponent(c.value)}`)
    .join("; ");

  const res = await fetch(`${process.env.NEXT_PUBLIC_ORIGIN ?? "http://localhost:3000"}/api/menus`, {
    method: "GET",
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    cache: "no-store",
  });

  if (!res.ok) return [];

  const data = await res.json();
  return (data.items ?? []) as NavItem[];
}

export default async function MainSectionLayout({ children }: { children: ReactNode }) {
  const menus = await loadMenus();

  return (
    <ContentLayout
      scrollMode="page"
      header={<HeaderNav items={menus} />}
    >
      {children}
    </ContentLayout>
  );
}
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
