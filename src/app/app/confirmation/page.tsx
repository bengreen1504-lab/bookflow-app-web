import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { money } from "@/lib/format";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ payment_intent?: string; redirect_status?: string }>;
}) {
  const { payment_intent: paymentIntentId, redirect_status } = await searchParams;
  const supabase = await createClient();

  let booking = null;
  if (paymentIntentId) {
    // The booking is written by the Stripe webhook, which can land a beat
    // after Stripe redirects the browser back here — give it a couple of
    // short retries before giving up.
    for (let attempt = 0; attempt < 4 && !booking; attempt++) {
      const { data } = await supabase
        .from("bookings")
        .select("booking_date, booking_time, total_price_cents, businesses(name)")
        .eq("stripe_payment_intent_id", paymentIntentId)
        .maybeSingle();
      booking = data;
      if (!booking) await wait(1000);
    }
  }

  const failed = redirect_status === "failed";

  return (
    <div className="max-w-[440px] mx-auto text-center py-10">
      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto text-3xl font-black ${
          failed ? "bg-error-bg text-error" : "bg-success-bg text-success"
        }`}
      >
        {failed ? "!" : "✓"}
      </div>
      <h1 className="text-2xl font-extrabold text-ink mt-5">
        {failed ? "Payment Failed" : booking ? "Booking Confirmed" : "Finishing up…"}
      </h1>
      {!failed && !booking && (
        <p className="text-sm text-gray mt-2">
          Your payment went through — just a moment while we finalize the booking.
        </p>
      )}

      {booking && (
        <div className="border border-border rounded-2xl p-4.5 mt-6 text-left">
          <div className="text-sm font-bold text-ink">{booking.businesses?.name}</div>
          <div className="text-xs text-gray mt-1">
            {booking.booking_date} · {booking.booking_time}
          </div>
          <div className="flex justify-between text-sm font-bold text-ink border-t border-border mt-3 pt-3">
            <span>Total</span>
            <span>{money(booking.total_price_cents)}</span>
          </div>
        </div>
      )}

      <Link
        href="/app/home"
        className="block w-full py-4 rounded-xl bg-teal text-white font-bold text-[15px] mt-7"
      >
        Done
      </Link>
    </div>
  );
}
