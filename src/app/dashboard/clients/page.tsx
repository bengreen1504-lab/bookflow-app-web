import { requireBusiness } from "@/lib/data/session";
import { money, initial } from "@/lib/format";

export default async function ClientsPage() {
  const { supabase, business } = await requireBusiness();
  const { data: clients } = await supabase
    .from("business_clients")
    .select("*")
    .eq("business_id", business.id)
    .order("lifetime_spend_cents", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink mb-7">Clients</h1>

      <div className="border border-border rounded-2xl overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr_0.8fr] px-4 py-3 bg-black/[0.02] text-xs font-bold text-gray">
            <span>Client</span>
            <span>Visits</span>
            <span>Lifetime Spend</span>
            <span>Last Visit</span>
            <span>Marketing</span>
          </div>
          {(clients ?? []).map((c) => (
            <div
              key={c.customer_id}
              className="grid grid-cols-[1.6fr_1fr_1fr_1fr_0.8fr] px-4 py-3 border-t border-border text-[13.5px] items-center"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-teal-soft text-teal-dark font-extrabold text-xs flex items-center justify-center shrink-0">
                  {initial(c.full_name)}
                </div>
                <span className="font-semibold">{c.full_name}</span>
              </div>
              <span>{c.visits}</span>
              <span>{money(c.lifetime_spend_cents)}</span>
              <span>{c.last_visit ?? "—"}</span>
              <span className={c.marketing_opt_in ? "text-success font-bold" : "text-gray"}>
                {c.marketing_opt_in ? "Opted In" : "Opted Out"}
              </span>
            </div>
          ))}
          {(clients ?? []).length === 0 && (
            <div className="text-center text-gray text-[13.5px] py-8">
              No clients yet — they&apos;ll show up here after their first booking.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
