import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${(err as Error).message}` },
      { status: 400 }
    );
  }

  // Postgres unique-violation code. bookings/pos_sales both have a partial
  // unique index on stripe_payment_intent_id (see migration 0003), so a
  // redelivered event (Stripe retries at-least-once) hits this instead of
  // silently inserting a second row for the same payment.
  const UNIQUE_VIOLATION = "23505";

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const meta = intent.metadata;
    const supabase = createServiceRoleClient();

    if (meta.kind === "booking") {
      const serviceLines = meta.service_snapshot
        .split("|")
        .filter(Boolean)
        .map((entry) => {
          const [serviceId, encodedName, priceCents, durationMinutes] = entry.split(":");
          return {
            serviceId,
            name: decodeURIComponent(encodedName),
            priceCents: Number(priceCents),
            durationMinutes: Number(durationMinutes),
          };
        });

      const { data: booking, error } = await supabase
        .from("bookings")
        .insert({
          business_id: meta.business_id,
          customer_id: meta.customer_id,
          booking_date: meta.booking_date,
          booking_time: meta.booking_time,
          total_price_cents: intent.amount,
          payment_status: "paid",
          stripe_payment_intent_id: intent.id,
        })
        .select()
        .single();

      if (error?.code === UNIQUE_VIOLATION) {
        if (error.message.includes("bookings_stripe_payment_intent_id_key")) {
          // A redelivered webhook event for a payment we already recorded —
          // truly a no-op.
          return NextResponse.json({ received: true, note: "already processed" });
        }
        // Otherwise it's the double-booking guard (bookings_no_double_booking):
        // two customers paid for the same slot and this one lost the race.
        // The charge already succeeded on Stripe's side, so this customer
        // has paid with no booking on file — surface it loudly rather than
        // claiming success, since it needs a manual refund.
        console.error(
          `Booking conflict after successful payment ${intent.id}: slot ${meta.business_id}/${meta.booking_date}/${meta.booking_time} already booked. Customer ${meta.customer_id} paid but has no booking — needs a manual refund.`
        );
        return NextResponse.json({ received: true, note: "booking conflict — needs manual refund" });
      }

      if (!error && booking) {
        await supabase.from("booking_services").insert(
          serviceLines.map((s) => ({
            booking_id: booking.id,
            service_id: s.serviceId,
            name_snapshot: s.name,
            price_cents_snapshot: s.priceCents,
            duration_minutes_snapshot: s.durationMinutes,
          }))
        );
      }
    }

    if (meta.kind === "pos") {
      const itemLines = meta.item_snapshot
        .split("|")
        .filter(Boolean)
        .map((entry) => {
          const [serviceId, encodedName, priceCents, qty] = entry.split(":");
          return {
            serviceId,
            name: decodeURIComponent(encodedName),
            priceCents: Number(priceCents),
            qty: Number(qty),
          };
        });

      const { data: sale, error } = await supabase
        .from("pos_sales")
        .insert({
          business_id: meta.business_id,
          method: meta.method as "tap" | "reader",
          total_cents: intent.amount,
          stripe_payment_intent_id: intent.id,
        })
        .select()
        .single();

      if (error?.code === UNIQUE_VIOLATION) {
        return NextResponse.json({ received: true, note: "already processed" });
      }

      if (!error && sale) {
        await supabase.from("pos_sale_items").insert(
          itemLines.map((i) => ({
            pos_sale_id: sale.id,
            service_id: i.serviceId,
            name_snapshot: i.name,
            price_cents_snapshot: i.priceCents,
            qty: i.qty,
          }))
        );
      }
    }
  }

  return NextResponse.json({ received: true });
}
