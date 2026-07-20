import { requireBusiness } from "@/lib/data/session";
import { PosClient } from "@/components/dashboard/pos-client";

export default async function PosPage() {
  const { supabase, business } = await requireBusiness();
  const { data: services } = await supabase
    .from("services")
    .select("id, name, price_cents")
    .eq("business_id", business.id)
    .order("created_at");

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink mb-7">Point of Sale</h1>
      <PosClient businessId={business.id} services={services ?? []} />
    </div>
  );
}
