import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

// Resolves the calling user for either the web app (cookie session, via
// createClient()) or a native client (Supabase access token sent as a Bearer
// header, since there's no browser cookie jar to read). The bearer branch
// uses a plain anon-key client with the token forwarded as the Authorization
// header, so RLS still evaluates auth.uid() as that user for any subsequent
// queries made with the returned client.
async function resolveUser(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length);
    const supabase = createSupabaseClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
    const {
      data: { user },
    } = await supabase.auth.getUser(token);
    return { supabase, user };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

// Creates a Stripe PaymentIntent for either a customer booking checkout or an
// in-person POS sale. The booking/sale row itself is only written by the
// webhook once Stripe confirms the charge — never optimistically here — so a
// customer closing the tab mid-payment never leaves a phantom "paid" record.
export async function POST(request: Request) {
  const body = await request.json();
  const { supabase, user } = await resolveUser(request);
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
      .eq("business_id", businessId)
      .in("id", serviceIds);
    if (!services || services.length !== serviceIds.length) {
      return NextResponse.json({ error: "Those services don't all belong to this business" }, { status: 400 });
    }
    const amount = services.reduce((sum, s) => sum + s.price_cents, 0);
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
      .eq("business_id", businessId)
      .in(
        "id",
        items.map((i) => i.serviceId)
      );
    if (!services || services.length !== items.length) {
      return NextResponse.json({ error: "Those services don't all belong to this business" }, { status: 400 });
    }
    const amount = items.reduce((sum, i) => {
      const svc = services.find((s) => s.id === i.serviceId);
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
