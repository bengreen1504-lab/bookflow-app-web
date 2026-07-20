import { createClient } from "@/lib/supabase/server";
import { ServicePicker } from "@/components/customer/service-picker";
import { initial } from "@/lib/format";

export default async function BusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: business }, { data: services }, { data: reviews }] = await Promise.all([
    supabase.from("businesses").select("*").eq("id", id).single(),
    supabase.from("services").select("id, name, duration_minutes, price_cents").eq("business_id", id),
    supabase
      .from("reviews")
      .select("rating, body, created_at, profiles(full_name)")
      .eq("business_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!business) {
    return <p className="text-gray">This business could not be found.</p>;
  }

  const reviewCount = reviews?.length ?? 0;
  const avgRating = reviewCount
    ? (reviews!.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1)
    : null;

  return (
    <div>
      <div className="w-full h-40 rounded-2xl bg-black/[0.04] mb-5" />
      <h1 className="text-2xl font-extrabold text-ink">{business.name}</h1>
      <p className="text-sm text-gray mt-1">{business.address}</p>
      <p className="text-sm text-gray mt-0.5">{business.hours}</p>
      {avgRating && (
        <a href="#reviews" className="inline-flex items-center gap-1.5 text-sm mt-2">
          <span className="text-warning">★</span>
          <span className="font-bold text-ink">{avgRating}</span>
          <span className="text-gray">
            ({reviewCount} review{reviewCount === 1 ? "" : "s"})
          </span>
        </a>
      )}

      <div className="text-xs font-bold text-gray uppercase tracking-wide mt-7 mb-3">Services</div>
      <ServicePicker businessId={business.id} services={services ?? []} />

      {reviewCount > 0 && (
        <div id="reviews" className="mt-8 pb-24">
          <div className="text-xs font-bold text-gray uppercase tracking-wide mb-3">
            Reviews ({reviewCount})
          </div>
          <div className="flex flex-col gap-4">
            {reviews!.map((r, i) => (
              <div key={i} className="border-b border-border pb-4">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-8 h-8 rounded-full bg-teal-soft text-teal-dark font-extrabold text-xs flex items-center justify-center shrink-0">
                    {initial(r.profiles?.full_name ?? "?")}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-ink">{r.profiles?.full_name}</div>
                    <div className="text-warning text-xs">{"★".repeat(r.rating)}</div>
                  </div>
                </div>
                <p className="text-[13.5px] text-ink">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
