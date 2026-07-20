import { requireBusiness } from "@/lib/data/session";
import { money } from "@/lib/format";

export default async function AnalyticsPage() {
  const { supabase, business } = await requireBusiness();

  const { data: bookings } = await supabase
    .from("bookings")
    .select("customer_id, status, payment_status, total_price_cents, booking_services(name_snapshot)")
    .eq("business_id", business.id);

  const rows = bookings ?? [];
  const total = rows.length;
  const cancelled = rows.filter((b) => b.status === "cancelled").length;
  const paidRevenue = rows
    .filter((b) => b.payment_status === "paid")
    .reduce((sum, b) => sum + b.total_price_cents, 0);
  const paidCount = rows.filter((b) => b.payment_status === "paid").length;

  const byCustomer = new Map<string, number>();
  rows.forEach((b) => byCustomer.set(b.customer_id, (byCustomer.get(b.customer_id) ?? 0) + 1));
  const repeatCustomers = [...byCustomer.values()].filter((n) => n > 1).length;
  const repeatRate = byCustomer.size ? Math.round((repeatCustomers / byCustomer.size) * 100) : 0;
  const cancellationRate = total ? Math.round((cancelled / total) * 100) : 0;
  const avgBookingValue = paidCount ? Math.round(paidRevenue / paidCount) : 0;

  const serviceCounts = new Map<string, number>();
  rows.forEach((b) =>
    b.booking_services?.forEach((s) =>
      serviceCounts.set(s.name_snapshot, (serviceCounts.get(s.name_snapshot) ?? 0) + 1)
    )
  );
  const popularServices = [...serviceCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxCount = Math.max(...popularServices.map(([, c]) => c), 1);

  const stats = [
    { label: "Repeat Customers", value: `${repeatRate}%` },
    { label: "Cancellation Rate", value: `${cancellationRate}%` },
    { label: "Avg Booking Value", value: money(avgBookingValue) },
    { label: "Total Revenue (paid)", value: money(paidRevenue) },
  ];

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink mb-7">Analytics</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {stats.map((s) => (
          <div key={s.label} className="border border-border rounded-2xl p-4.5">
            <div className="text-xs text-gray font-semibold">{s.label}</div>
            <div className="text-2xl font-extrabold text-ink mt-1.5">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="text-[13px] font-bold text-gray mb-3">Popular Services</div>
      <div className="flex flex-col gap-2.5">
        {popularServices.map(([name, count]) => (
          <div key={name} className="flex items-center gap-3">
            <div className="w-36 text-[13.5px] font-semibold text-ink shrink-0 truncate">{name}</div>
            <div className="flex-1 h-2.5 rounded-full bg-black/[0.05] overflow-hidden">
              <div
                className="h-full bg-teal rounded-full"
                style={{ width: `${Math.round((count / maxCount) * 100)}%` }}
              />
            </div>
            <div className="w-9 text-right text-[12.5px] text-gray">{count}</div>
          </div>
        ))}
        {popularServices.length === 0 && <p className="text-gray text-[13.5px]">No bookings yet.</p>}
      </div>
    </div>
  );
}
