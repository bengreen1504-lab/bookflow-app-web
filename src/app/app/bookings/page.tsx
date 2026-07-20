import Link from "next/link";
import { requireUser } from "@/lib/data/session";
import { money } from "@/lib/format";
import { StatusPill } from "@/components/dashboard/status-pill";

export default async function CustomerBookingsPage() {
  const { supabase, user } = await requireUser();
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, booking_date, booking_time, status, total_price_cents, businesses(name), booking_services(name_snapshot)")
    .eq("customer_id", user.id)
    .order("booking_date", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink mb-6">My Bookings</h1>
      <div className="flex flex-col gap-3">
        {(bookings ?? []).map((b) => (
          <Link
            key={b.id}
            href={`/app/bookings/${b.id}`}
            className="border border-border rounded-2xl p-4 flex items-center justify-between hover:border-teal"
          >
            <div>
              <div className="text-sm font-bold text-ink">{b.businesses?.name}</div>
              <div className="text-xs text-gray mt-0.5">
                {b.booking_services?.map((s) => s.name_snapshot).join(", ")}
              </div>
              <div className="text-xs text-gray mt-0.5">
                {b.booking_date} · {b.booking_time} · {money(b.total_price_cents)}
              </div>
            </div>
            <StatusPill status={b.status} />
          </Link>
        ))}
        {(bookings ?? []).length === 0 && (
          <p className="text-gray text-[13.5px]">No bookings yet — go find something to book.</p>
        )}
      </div>
    </div>
  );
}
