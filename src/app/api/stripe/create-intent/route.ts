import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

// Creates a Stripe PaymentIntent for either a customer booking checkout or an
// in-person POS sale. The booking/sale row itself is only written by the
// webhook once Stripe confirms the charge — never optimistically here — so a
// customer closing the tab mid-payment never leaves a phantom "paid" record.
export async function POST(request: Request) {
  const body = await request.json();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  if (body.kind === "booking") {
    const { businessId, serviceIds, date, time } = body as {
      businessId: string;
      serviceIds: string[];
      date: string;
      time: string;
    };
    if (!businessId || !serviceIds?.length || !date || !time) {
      return NextResponse.json({ error: "Missing booking details" }, { status: 400 });
    }

    const { data: services } = await supabase
      .from("services")
      .select("price_cents")
      .in("id", serviceIds);
    const amount = (services ?? []).reduce((sum, s) => sum + s.price_cents, 0);
    if (amount <= 0) return NextResponse.json({ error: "Invalid services" }, { status: 400 });

    const intent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        kind: "booking",
        customer_id: user.id,
        business_id: businessId,
        service_ids: serviceIds.join(","),
        booking_date: date,
        booking_time: time,
      },
    });

    return NextResponse.json({ clientSecret: intent.client_secret });
  }

  if (body.kind === "pos") {
    const { businessId, method, items } = body as {
      businessId: string;
      method: string;
      items: { serviceId: string; qty: number }[];
    };
    if (!businessId || !items?.length) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", businessId)
      .eq("owner_id", user.id)
      .maybeSingle();
    if (!business) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

    const { data: services } = await supabase
      .from("services")
      .select("id, price_cents")
      .in(
        "id",
        items.map((i) => i.serviceId)
      );
    const amount = items.reduce((sum, i) => {
      const svc = (services ?? []).find((s) => s.id === i.serviceId);
      return sum + (svc ? svc.price_cents * i.qty : 0);
    }, 0);
    if (amount <= 0) return NextResponse.json({ error: "Invalid cart" }, { status: 400 });

    const intent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        kind: "pos",
        business_id: businessId,
        method,
        items: items.map((i) => `${i.serviceId}:${i.qty}`).join(","),
      },
    });

    return NextResponse.json({ clientSecret: intent.client_secret });
  }

  return NextResponse.json({ error: "Unknown kind" }, { status: 400 });
}
