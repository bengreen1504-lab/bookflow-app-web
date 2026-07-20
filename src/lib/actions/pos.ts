"use server";

import { revalidatePath } from "next/cache";
import { requireBusiness } from "@/lib/data/session";
import type { PosMethod } from "@/lib/supabase/types";

export type ChargeItem = { serviceId: string; qty: number };

export async function chargePosAction(method: PosMethod, cart: ChargeItem[]) {
  const { supabase, business } = await requireBusiness();
  if (cart.length === 0) return { error: "Cart is empty" };

  // Re-fetch real names/prices from the DB rather than trusting whatever the
  // client sent — a tampered client-side cart must not be able to record an
  // arbitrary price for a real service.
  const { data: services } = await supabase
    .from("services")
    .select("id, name, price_cents")
    .eq("business_id", business.id)
    .in(
      "id",
      cart.map((l) => l.serviceId)
    );

  if (!services || services.length !== cart.length) {
    return { error: "Those services don't all belong to this business" };
  }

  const total = cart.reduce((sum, l) => {
    const svc = services.find((s) => s.id === l.serviceId)!;
    return sum + svc.price_cents * l.qty;
  }, 0);

  // Card-present flows (Tap to Pay / reader) route through Stripe (see
  // /api/stripe/create-intent); cash is the one method that never touches
  // Stripe, so it's recorded straight away here.
  const { data: sale, error } = await supabase
    .from("pos_sales")
    .insert({ business_id: business.id, method, total_cents: total })
    .select()
    .single();

  if (error || !sale) return { error: error?.message ?? "Could not start sale" };

  const { error: itemsError } = await supabase.from("pos_sale_items").insert(
    cart.map((l) => {
      const svc = services.find((s) => s.id === l.serviceId)!;
      return {
        pos_sale_id: sale.id,
        service_id: svc.id,
        name_snapshot: svc.name,
        price_cents_snapshot: svc.price_cents,
        qty: l.qty,
      };
    })
  );

  if (itemsError) return { error: itemsError.message };

  revalidatePath("/dashboard/pos");
  revalidatePath("/dashboard/overview");
  revalidatePath("/dashboard/analytics");
  return { success: true, total };
}
