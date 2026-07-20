"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/lib/actions/auth";

const LINKS = [
  { href: "/app/home", label: "Browse" },
  { href: "/app/bookings", label: "Bookings" },
  { href: "/app/profile", label: "Profile" },
];

export function CustomerNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border bg-white sticky top-0 z-10">
      <div className="max-w-[900px] mx-auto px-6 h-[64px] flex items-center justify-between">
        <Link href="/app/home" className="font-black tracking-tight text-ink">
          BOOKFLOW
        </Link>
        <div className="flex items-center gap-5">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-bold ${
                pathname.startsWith(l.href) ? "text-teal" : "text-gray"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <form action={signOutAction}>
            <button className="text-sm font-bold text-error">Sign Out</button>
          </form>
        </div>
      </div>
    </nav>
  );
}
