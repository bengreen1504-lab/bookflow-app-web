import { notFound } from "next/navigation";
import { requireUser } from "@/lib/data/session";
import { money } from "@/lib/format";
import { StatusPill } from "@/components/dashboard/status-pill";
import { cancelBookingAction } from "@/lib/actions/booking";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireUser();

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, booking_date, booking_time, status, total_price_cents, businesses(name, address), booking_services(name_snapshot, price_cents_snapshot)")
    .eq("id", id)
    .eq("customer_id", user.id)
    .single();

  if (!booking) notFound();

  return (
    <div className="max-w-[480px] mx-auto">
      <div className="border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-extrabold text-ink">{booking.businesses?.name}</div>
          <StatusPill status={booking.status} />
        </div>
        <div className="text-sm text-gray mb-4">{booking.businesses?.address}</div>
        <div className="flex flex-col gap-1.5 border-t border-border pt-3">
          {booking.booking_services?.map((s, i) => (
            <div key={i} className="flex justify-between text-[13.5px]">
              <span>{s.name_snapshot}</span>
              <span>{money(s.price_cents_snapshot)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-base font-extrabold text-ink border-t border-border mt-3 pt-3">
          <span>{booking.booking_date} · {booking.booking_time}</span>
          <span>{money(booking.total_price_cents)}</span>
        </div>
      </div>

      {booking.status === "upcoming" && (
        <form action={cancelBookingAction} className="mt-4">
          <input type="hidden" name="id" value={booking.id} />
          <button className="w-full py-3.5 rounded-xl border border-error text-error font-bold text-sm">
            Cancel Booking
          </button>
        </form>
      )}
    </div>
  );
}
