import { createClient } from "@/lib/supabase/server";
import { ServicePicker } from "@/components/customer/service-picker";

export default async function BusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: business }, { data: services }] = await Promise.all([
    supabase.from("businesses").select("*").eq("id", id).single(),
    supabase.from("services").select("id, name, duration_minutes, price_cents").eq("business_id", id),
  ]);

  if (!business) {
    return <p className="text-gray">This business could not be found.</p>;
  }

  return (
    <div>
      <div className="w-full h-40 rounded-2xl bg-black/[0.04] mb-5" />
      <h1 className="text-2xl font-extrabold text-ink">{business.name}</h1>
      <p className="text-sm text-gray mt-1">{business.address}</p>
      <p className="text-sm text-gray mt-0.5">{business.hours}</p>

      <div className="text-xs font-bold text-gray uppercase tracking-wide mt-7 mb-3">Services</div>
      <ServicePicker businessId={business.id} services={services ?? []} />
    </div>
  );
}
