import { createClient } from "@/lib/supabase/server";
import { money } from "@/lib/format";
import { StripeCheckout } from "@/components/customer/stripe-checkout";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ businessId?: string; services?: string; date?: string; time?: string }>;
}) {
  const { businessId, services: serviceIdsParam, date, time } = await searchParams;
  const serviceIds = (serviceIdsParam ?? "").split(",").filter(Boolean);

  if (!businessId || serviceIds.length === 0 || !date || !time) {
    return <p className="text-gray">Missing booking details — start over from a business page.</p>;
  }

  const supabase = await createClient();
  const [{ data: business }, { data: services }] = await Promise.all([
    supabase.from("businesses").select("name").eq("id", businessId).single(),
    supabase.from("services").select("id, name, price_cents").in("id", serviceIds),
  ]);

  const total = (services ?? []).reduce((sum, s) => sum + s.price_cents, 0);

  return (
    <div className="max-w-[520px] mx-auto">
      <h1 className="text-2xl font-extrabold text-ink mb-6">Checkout</h1>

      <div className="border border-border rounded-2xl p-4.5 mb-6">
        <div className="text-sm font-bold text-ink mb-1">{business?.name}</div>
        <div className="text-xs text-gray mb-3">
          {date} · {time}
        </div>
        <div className="flex flex-col gap-1.5 border-t border-border pt-3">
          {(services ?? []).map((s) => (
            <div key={s.id} className="flex justify-between text-[13.5px]">
              <span>{s.name}</span>
              <span>{money(s.price_cents)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-base font-extrabold text-ink border-t border-border mt-3 pt-3">
          <span>Total</span>
          <span>{money(total)}</span>
        </div>
      </div>

      <StripeCheckout businessId={businessId} serviceIds={serviceIds} date={date} time={time} />
    </div>
  );
}
