"use server";

import { revalidatePath } from "next/cache";
import { requireBusiness } from "@/lib/data/session";
import type { PosMethod } from "@/lib/supabase/types";

export type CartLine = { serviceId: string; name: string; priceCents: number; qty: number };

export async function chargePosAction(method: PosMethod, cart: CartLine[]) {
  const { supabase, business } = await requireBusiness();
  if (cart.length === 0) return { error: "Cart is empty" };

  const total = cart.reduce((sum, l) => sum + l.priceCents * l.qty, 0);

  // Card-present flows (Tap to Pay / reader) will route through Stripe Terminal
  // in a follow-up; the sale ledger and cart/checkout flow are wired end-to-end
  // for all three methods today, cash included.
  const { data: sale, error } = await supabase
    .from("pos_sales")
    .insert({ business_id: business.id, method, total_cents: total })
    .select()
    .single();

  if (error || !sale) return { error: error?.message ?? "Could not start sale" };

  const { error: itemsError } = await supabase.from("pos_sale_items").insert(
    cart.map((l) => ({
      pos_sale_id: sale.id,
      service_id: l.serviceId,
      name_snapshot: l.name,
      price_cents_snapshot: l.priceCents,
      qty: l.qty,
    }))
  );

  if (itemsError) return { error: itemsError.message };

  revalidatePath("/dashboard/pos");
  revalidatePath("/dashboard/overview");
  revalidatePath("/dashboard/analytics");
  return { success: true, total };
}
