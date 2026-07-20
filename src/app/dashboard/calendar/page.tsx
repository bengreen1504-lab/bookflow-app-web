import Link from "next/link";
import { requireBusiness } from "@/lib/data/session";

const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17];

function fmtHour(h: number) {
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12} ${period}`;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const offset = Number(week ?? 0);
  const { supabase, business } = await requireBusiness();

  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay() + offset * 7);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
  const end = days[6];

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, booking_date, booking_time, profiles(full_name)")
    .eq("business_id", business.id)
    .gte("booking_date", days[0].toISOString().slice(0, 10))
    .lte("booking_date", end.toISOString().slice(0, 10))
    .neq("status", "cancelled");

  function bookingAt(date: Date, hour: number) {
    const dateStr = date.toISOString().slice(0, 10);
    return (bookings ?? []).find((b) => {
      if (b.booking_date !== dateStr) return false;
      const match = /(\d+):\d+\s*(AM|PM)/i.exec(b.booking_time);
      if (!match) return false;
      let h = parseInt(match[1], 10);
      if (/pm/i.test(match[2]) && h !== 12) h += 12;
      if (/am/i.test(match[2]) && h === 12) h = 0;
      return h === hour;
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4.5">
        <h1 className="text-[15.5px] font-extrabold text-ink">
          {days[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} –{" "}
          {end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </h1>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/calendar?week=${offset - 1}`}
            className="w-8 h-8 rounded-lg bg-black/[0.03] flex items-center justify-center"
          >
            ‹
          </Link>
          <Link
            href={`/dashboard/calendar?week=${offset + 1}`}
            className="w-8 h-8 rounded-lg bg-black/[0.03] flex items-center justify-center"
          >
            ›
          </Link>
        </div>
      </div>

      <div className="border border-border rounded-2xl overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="grid grid-cols-[70px_repeat(7,1fr)] border-b border-border">
            <div />
            {days.map((d) => (
              <div key={d.toISOString()} className="text-center py-2.5 border-l border-border">
                <div className="text-[11px] font-bold text-gray">
                  {d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}
                </div>
                <div className="text-sm font-extrabold text-ink mt-0.5">{d.getDate()}</div>
              </div>
            ))}
          </div>
          {HOURS.map((h) => (
            <div key={h} className="grid grid-cols-[70px_repeat(7,1fr)] border-b border-black/[0.04] min-h-[52px]">
              <div className="px-2.5 py-1.5 text-[11px] text-gray text-right">{fmtHour(h)}</div>
              {days.map((d) => {
                const b = bookingAt(d, h);
                return (
                  <div key={d.toISOString() + h} className="p-1 border-l border-black/[0.04]">
                    {b && (
                      <div className="bg-teal-soft text-teal-dark text-[11px] font-bold px-1.5 py-1 rounded-md h-full truncate">
                        {b.profiles?.full_name}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
