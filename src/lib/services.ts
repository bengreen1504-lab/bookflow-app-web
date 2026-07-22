import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// Shared by chargePosAction and both branches of /api/stripe/create-intent:
// re-fetches real name/price/duration for a set of service ids scoped to the
// stated business, rather than trusting whatever a client-supplied cart
// claims — a tampered (or just stale) client price must never make it into
// a charge amount or a receipt line item. Returns null if any requested id
// doesn't actually belong to that business.
export async function fetchOwnedServices(
  supabase: SupabaseClient<Database>,
  businessId: string,
  serviceIds: string[]
) {
  const uniqueIds = [...new Set(serviceIds)];
  const { data: services } = await supabase
    .from("services")
    .select("id, name, price_cents, duration_minutes")
    .eq("business_id", businessId)
    .in("id", uniqueIds);

  if (!services || services.length !== uniqueIds.length) return null;
  return services;
}
