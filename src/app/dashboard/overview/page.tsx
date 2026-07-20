import { requireBusiness } from "@/lib/data/session";
import { money } from "@/lib/format";
import { StatusPill } from "@/components/dashboard/status-pill";

export default async function OverviewPage() {
  const { supabase, business } = await requireBusiness();

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 6);
  const weekAgoStr = weekAgo.toISOString().slice(0, 10);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);

  const [{ count: todaysBookings }, { data: monthBookings }, { count: staffCount }, { data: recent }, { data: weekBookings }] =
    await Promise.all([
      supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("business_id", business.id)
        .eq("booking_date", todayStr)
        .neq("status", "cancelled"),
      supabase
        .from("bookings")
        .select("total_price_cents")
        .eq("business_id", business.id)
        .eq("payment_status", "paid")
        .gte("booking_date", monthStart),
      supabase
        .from("staff")
        .select("*", { count: "exact", head: true })
        .eq("business_id", business.id),
      supabase
        .from("bookings")
        .select("id, booking_date, booking_time, status, total_price_cents, profiles(full_name), booking_services(name_snapshot)")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("bookings")
        .select("booking_date, total_price_cents")
        .eq("business_id", business.id)
        .eq("payment_status", "paid")
        .gte("booking_date", weekAgoStr),
    ]);

  const revenueMtd = (monthBookings ?? []).reduce((sum, b) => sum + b.total_price_cents, 0);

  const days: { label: string; date: string; total: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const total = (weekBookings ?? [])
      .filter((b) => b.booking_date === dateStr)
      .reduce((sum, b) => sum + b.total_price_cents, 0);
    days.push({ label: d.toLocaleDateString("en-US", { weekday: "short" }), date: dateStr, total });
  }
  const maxDay = Math.max(...days.map((d) => d.total), 1);

  const stats = [
    { label: "Today's Bookings", value: String(todaysBookings ?? 0) },
    { label: "Revenue (MTD)", value: money(revenueMtd) },
    { label: "Active Staff", value: String(staffCount ?? 0) },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-7">
        <h1 className="text-2xl font-extrabold text-ink">Overview</h1>
        <div className="bg-black/[0.03] rounded-[10px] px-3.5 py-2 text-[13.5px] font-bold text-ink">
          {money(revenueMtd)} earned this month
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="border border-border rounded-2xl p-4.5">
            <div className="text-xs text-gray font-semibold">{s.label}</div>
            <div className="text-2xl font-extrabold text-ink mt-1.5">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="border border-border rounded-2xl p-5 mb-6">
        <div className="text-[13px] font-bold text-gray mb-3.5">Revenue · Last 7 Days</div>
        <div className="grid grid-cols-7 gap-2.5 items-end h-[120px]">
          {days.map((d, i) => (
            <div
              key={d.date}
              className={`w-full rounded-md ${i === days.length - 1 ? "bg-teal" : "bg-teal-soft"}`}
              style={{ height: Math.round((d.total / maxDay) * 112) + 6 }}
            />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2.5 mt-1.5">
          {days.map((d) => (
            <div key={d.date} className="text-center text-[11.5px] text-gray/70">
              {d.label}
            </div>
          ))}
        </div>
      </div>

      <div className="text-[13px] font-bold text-gray mb-3">Recent Bookings</div>
      <div className="border border-border rounded-2xl overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-[1.4fr_1.6fr_1fr_0.7fr_0.9fr] px-4 py-3 bg-black/[0.02] text-xs font-bold text-gray">
            <span>Customer</span>
            <span>Service</span>
            <span>Date</span>
            <span>Price</span>
            <span>Status</span>
          </div>
          {(recent ?? []).map((b) => (
            <div
              key={b.id}
              className="grid grid-cols-[1.4fr_1.6fr_1fr_0.7fr_0.9fr] px-4 py-3 border-t border-border text-[13.5px] items-center"
            >
              <span>{b.profiles?.full_name ?? "—"}</span>
              <span className="truncate">
                {b.booking_services?.map((s) => s.name_snapshot).join(", ") || "—"}
              </span>
              <span>{b.booking_date}</span>
              <span>{money(b.total_price_cents)}</span>
              <StatusPill status={b.status} />
            </div>
          ))}
          {(recent ?? []).length === 0 && (
            <div className="text-center text-gray text-[13.5px] py-8">No bookings yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
