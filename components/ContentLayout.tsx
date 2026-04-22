"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useStore } from "@/store";

type ContentProps = {
  header?: React.ReactNode;
  children: React.ReactNode;
  scrollMode?: "layout" | "page";
};

export default function ConnectLayout({ header, children }: ContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useStore((s: any) => s.user);
  const authChecked = useStore((s: any) => s.authChecked);
  const logout = useStore((s: any) => s.logout);
  const backend = useStore((s: any) => s.backend);

  const isPageScroll = useMemo(() => {
    if (!pathname) return false;

    return (
      pathname === "/board" ||
      pathname.startsWith("/board/") ||
      pathname === "/ai-chat" ||
      pathname.startsWith("/ai-chat/") ||
      pathname === "/link"
    );
  }, [pathname]);

  useEffect(() => {
    if (!authChecked) return;

    if (!user) {
      router.push("/login");
    }
  }, [authChecked, user, router]);

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  if (!authChecked) {
    return (
      <div className="h-screen flex items-center justify-center">
        <span className="text-sm text-gray-500">Checking authentication...</span>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gray-50 text-gray-900 flex flex-col overflow-hidden">
      <header className="sticky top-0 z-30 h-14 bg-white/90 backdrop-blur shadow-sm">
        <div className="h-full px-4 flex items-center justify-between">
          {header}
          <div className="flex items-center gap-3 text-sm">
            <span>{user?.email}</span>
            <span className="border-l pl-3">
              {user?.displayName ?? user?.name ?? user?.username}
              &nbsp;({backend})
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md hover:cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 w-full relative overflow-hidden">
        <main
          className={[
            "relative flex-1 min-w-0 bg-gray-50",
            isPageScroll ? "overflow-hidden" : "overflow-y-auto",
          ].join(" ")}
        >
          <div className={isPageScroll ? "h-full min-h-0 p-6 overflow-hidden" : "p-6"}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
