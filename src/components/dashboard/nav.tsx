"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/lib/actions/auth";

const NAV_ITEMS = [
  { href: "/dashboard/overview", label: "Overview" },
  { href: "/dashboard/calendar", label: "Calendar" },
  { href: "/dashboard/bookings", label: "Bookings" },
  { href: "/dashboard/clients", label: "Clients" },
  { href: "/dashboard/pos", label: "Point of Sale" },
  { href: "/dashboard/services", label: "Manage Services" },
  { href: "/dashboard/staff", label: "Staff" },
  { href: "/dashboard/analytics", label: "Analytics" },
  { href: "/dashboard/profile", label: "Business Profile" },
];

export function DashboardNav({ businessName }: { businessName: string }) {
  const pathname = usePathname();

  return (
    <div className="w-[232px] shrink-0 border-r border-border flex flex-col p-4">
      <div className="font-black tracking-tight text-ink px-2">BOOKFLOW</div>
      <div className="text-xs text-gray px-2 mt-0.5 mb-5 truncate">{businessName}</div>
      <nav className="flex flex-col gap-0.5 flex-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-[10px] px-2.5 py-2.5 text-[13.5px] font-semibold ${
                active ? "bg-teal-soft text-teal-dark" : "text-ink hover:bg-black/[0.03]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <form action={signOutAction}>
        <button className="text-left px-2.5 py-2.5 text-[13.5px] font-semibold text-error w-full">
          Sign Out
        </button>
      </form>
    </div>
  );
}
