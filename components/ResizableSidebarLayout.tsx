"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useStore } from "@/store";
import { ExpandIcon, CollapseIcon } from "./Icons";

type SiderbarProps = {
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  children: React.ReactNode;
};

export default function ResizableSidebarLayout({
  header,
  sidebar,
  children,
}: SiderbarProps) {
  const router = useRouter();
  const user = useStore((s: any) => s.user);
  const authChecked = useStore((s: any) => s.authChecked);
  const logout = useStore((s: any) => s.logout);
  const backend = useStore((s: any) => s.backend);
  const sidebarCollapsed = useStore((s: any) => s.adminSidebarCollapsed);
  const setAdminSidebarCollapsed = useStore((s: any) => s.setAdminSidebarCollapsed);

  useEffect(() => {
    if (!authChecked) return;

    if (!user) {
      router.push("/login");
    }
  }, [authChecked, user, router]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [sidebarW, setSidebarW] = useState<number>(200);
  const [dragging, setDragging] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
  }

  useEffect(() => {
    localStorage.setItem("sidebar:w", String(sidebarW));
  }, [sidebarW]);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging || !containerRef.current) return;
      const left = containerRef.current.getBoundingClientRect().left;
      setSidebarW(clamp(e.clientX - left, 200, 300));
    };

    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging]);

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  const handleGoMenu = (type: string) => {
    switch (type) {
      case "menu":
        router.push("/admin/menu");
        break;
      case "settings":
        router.push("/admin/settings");
        break;
      case "shortcut":
        router.push("/admin/chatbot-shortcut-menu");
        break;
      default:
        break;
    }

    setMenuOpen(false);
  };

  const handleCollapse = () => {
    setAdminSidebarCollapsed(true);
    setMenuOpen(false);
  };

  if (!authChecked) {
    return (
      <div className="h-screen flex items-center justify-center">
        <span className="text-sm text-gray-500">Checking authentication...</span>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 text-gray-900">
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

      <div ref={containerRef} className="flex flex-1 w-full relative overflow-hidden">
        <aside
          style={{ width: sidebarCollapsed ? "32px" : `${sidebarW}px` }}
          className="relative bg-white min-w-0 overflow-y-auto"
        >
          <div className="flex items-center justify-between px-3 py-2">
            {sidebarCollapsed ? (
              <button
                onClick={() => setAdminSidebarCollapsed(false)}
                className="size-7 grid place-items-center rounded-md hover:bg-gray-100 cursor-pointer"
              >
                <span className="text-xl">
                  <ExpandIcon />
                </span>
              </button>
            ) : (
              <>
                <div className="text-sm font-semibold">MENU</div>
                <div className="relative">
                  <button
                    className="size-7 grid place-items-center rounded-md hover:bg-gray-100 cursor-pointer"
                    onClick={() => setMenuOpen((v: boolean) => !v)}
                  >
                    <span className="leading-none text-xl">...</span>
                  </button>
                  {menuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-44 rounded-xl bg-white shadow-xl ring-1 ring-black/5 p-1 z-50"
                      onMouseLeave={() => setMenuOpen(false)}
                    >
                      <button
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50"
                        style={{ cursor: "pointer" }}
                        onClick={() => handleGoMenu("menu")}
                      >
                        Menu
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50"
                        style={{ cursor: "pointer" }}
                        onClick={() => handleGoMenu("shortcut")}
                      >
                        Shortcut Menu
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50"
                        style={{ cursor: "pointer" }}
                        onClick={() => handleGoMenu("settings")}
                      >
                        Settings
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                        style={{ cursor: "pointer" }}
                        onClick={handleCollapse}
                      >
                        <CollapseIcon /> Collapse
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {!sidebarCollapsed &&
            (sidebar ?? (
              <nav className="p-3 text-sm">
                <div className="mb-3 font-semibold">Menu</div>
                <ul className="space-y-1">
                  <li>
                    <a
                      className="block rounded px-2 py-1 hover:bg-gray-100"
                      href="/admin/user-info?path_ids=admin>user-info&depth=0"
                    >
                      User Info
                    </a>
                  </li>
                </ul>
              </nav>
            ))}
        </aside>

        <div
          onMouseDown={onMouseDown}
          className="relative w-3 cursor-col-resize select-none"
          title="Resize menu"
        >
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-neutral-300" />
          <div className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-3 opacity-0 hover:opacity-100" />
        </div>

        <main className="relative flex-1 min-w-0 overflow-hidden bg-gray-50">
          <div className="h-full min-h-0 p-2 overflow-hidden">{children}</div>
        </main>
      </div>
    </div>
  );
}
