import Link from "next/link";
import { requireBusiness } from "@/lib/data/session";
import { money } from "@/lib/format";
import { StatusPill } from "@/components/dashboard/status-pill";
import type { BookingStatus } from "@/lib/supabase/types";

const TABS: { key: BookingStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeTab = (status as BookingStatus | undefined) ?? "all";
  const { supabase, business } = await requireBusiness();

  let query = supabase
    .from("bookings")
    .select("id, booking_date, booking_time, status, total_price_cents, profiles(full_name), booking_services(name_snapshot)")
    .eq("business_id", business.id)
    .order("booking_date", { ascending: false });

  if (activeTab !== "all") query = query.eq("status", activeTab);

  const { data: bookings } = await query;

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink mb-5">Bookings</h1>

      <div className="flex gap-2 mb-4.5">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === "all" ? "/dashboard/bookings" : `/dashboard/bookings?status=${t.key}`}
            className={`px-4 py-2 rounded-full text-[13px] font-bold ${
              activeTab === t.key ? "bg-teal text-white" : "bg-black/[0.03] text-gray"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="border border-border rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[1.4fr_1.6fr_1fr_1fr_0.7fr_0.9fr] px-4 py-3 bg-black/[0.02] text-xs font-bold text-gray">
          <span>Customer</span>
          <span>Service</span>
          <span>Date</span>
          <span>Time</span>
          <span>Price</span>
          <span>Status</span>
        </div>
        {(bookings ?? []).map((b) => (
          <div
            key={b.id}
            className="grid grid-cols-[1.4fr_1.6fr_1fr_1fr_0.7fr_0.9fr] px-4 py-3 border-t border-border text-[13.5px] items-center"
          >
            <span>{b.profiles?.full_name ?? "—"}</span>
            <span className="truncate">{b.booking_services?.map((s) => s.name_snapshot).join(", ") || "—"}</span>
            <span>{b.booking_date}</span>
            <span>{b.booking_time}</span>
            <span>{money(b.total_price_cents)}</span>
            <StatusPill status={b.status} />
          </div>
        ))}
        {(bookings ?? []).length === 0 && (
          <div className="text-center text-gray text-[13.5px] py-8">No bookings here.</div>
        )}
      </div>
    </div>
  );
}
