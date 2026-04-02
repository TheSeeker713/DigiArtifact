"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useAuth } from "@/lib/admin/useAuth";

const NAV_ITEMS = [
  { href: "/admin/today", label: "Today" },
  { href: "/admin/week", label: "Week" },
  { href: "/admin/streaks", label: "Streaks" },
  { href: "/admin/chores", label: "Chores" },
  { href: "/admin/plan", label: "Plan" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!user && !isLoginPage) {
      router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (user?.mustChangePassword && !isLoginPage) {
      router.replace("/admin/login?mustChange=1");
    }
  }, [isLoginPage, loading, pathname, router, user]);

  const activeTitle = useMemo(() => {
    if (pathname.startsWith("/admin/week")) return "Week";
    if (pathname.startsWith("/admin/streaks")) return "Streaks";
    if (pathname.startsWith("/admin/chores")) return "Chores";
    if (pathname.startsWith("/admin/plan")) return "Plan";
    if (pathname.startsWith("/admin/login")) return "Login";
    return "Today";
  }, [pathname]);

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-[#1a1812] text-[#e8e2d4]">
        {children}
      </div>
    );
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1a1812] text-[#c9a84c]">
        Loading admin dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1812] text-[#e8e2d4]">
      <header className="sticky top-0 z-10 border-b border-[#3a3628] bg-[#1a1812]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#c9a84c]">KAIA Admin</p>
            <p className="text-sm text-[#9b9484]">{activeTitle}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{user.displayName}</p>
            <button
              onClick={() => void logout().then(() => router.replace("/admin/login"))}
              className="text-xs text-[#c9a84c] hover:text-[#e8e2d4]"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-4">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-[#3a3628] bg-[#23211a]">
        <div className="mx-auto grid w-full max-w-5xl grid-cols-5">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-2 py-3 text-center text-xs ${
                  active ? "text-[#c9a84c]" : "text-[#9b9484] hover:text-[#e8e2d4]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
