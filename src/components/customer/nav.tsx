"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/lib/actions/auth";

const LINKS = [
  { href: "/app/home", label: "Browse" },
  { href: "/app/bookings", label: "Bookings" },
  { href: "/app/notifications", label: "Alerts" },
  { href: "/app/profile", label: "Profile" },
];

export function CustomerNav({ unreadCount }: { unreadCount: number }) {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border bg-white sticky top-0 z-10">
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 h-[64px] flex items-center justify-between gap-3">
        <Link href="/app/home" className="font-black tracking-tight text-ink shrink-0">
          BOOKFLOW
        </Link>
        <div className="flex items-center gap-3 sm:gap-5 overflow-x-auto">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`relative shrink-0 whitespace-nowrap text-[13px] sm:text-sm font-bold ${
                pathname.startsWith(l.href) ? "text-teal" : "text-gray"
              }`}
            >
              {l.label}
              {l.href === "/app/notifications" && unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 w-2 h-2 rounded-full bg-error" />
              )}
            </Link>
          ))}
          <form action={signOutAction} className="shrink-0">
            <button className="whitespace-nowrap text-[13px] sm:text-sm font-bold text-error">
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
