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

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const meta = intent.metadata;
    const supabase = createServiceRoleClient();

    if (meta.kind === "booking") {
      const serviceIds = meta.service_ids.split(",").filter(Boolean);
      const { data: services } = await supabase
        .from("services")
        .select("id, name, price_cents, duration_minutes")
        .in("id", serviceIds);

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

      if (!error && booking && services) {
        await supabase.from("booking_services").insert(
          services.map((s) => ({
            booking_id: booking.id,
            service_id: s.id,
            name_snapshot: s.name,
            price_cents_snapshot: s.price_cents,
            duration_minutes_snapshot: s.duration_minutes,
          }))
        );
      }
    }

    if (meta.kind === "pos") {
      const itemPairs = meta.items.split(",").filter(Boolean).map((pair) => {
        const [serviceId, qty] = pair.split(":");
        return { serviceId, qty: Number(qty) };
      });
      const { data: services } = await supabase
        .from("services")
        .select("id, name, price_cents")
        .in(
          "id",
          itemPairs.map((i) => i.serviceId)
        );

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

      if (!error && sale && services) {
        const rows = itemPairs.flatMap((i) => {
          const svc = services.find((s) => s.id === i.serviceId);
          if (!svc) return [];
          return [
            {
              pos_sale_id: sale.id,
              service_id: svc.id,
              name_snapshot: svc.name,
              price_cents_snapshot: svc.price_cents,
              qty: i.qty,
            },
          ];
        });
        if (rows.length) await supabase.from("pos_sale_items").insert(rows);
      }
    }
  }

  return NextResponse.json({ received: true });
}
