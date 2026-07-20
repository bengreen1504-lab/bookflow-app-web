"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const TIME_SLOTS = [
  "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM",
  "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
];

export function BookingPicker({
  businessId,
  serviceIds,
  bookedSlotsByDate,
}: {
  businessId: string;
  serviceIds: string;
  bookedSlotsByDate: Record<string, string[]>;
}) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const upcomingDays = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push(d);
    }
    return days;
  }, []);

  const availableTimes = selectedDate
    ? TIME_SLOTS.filter((t) => !(bookedSlotsByDate[selectedDate] ?? []).includes(t))
    : [];

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {upcomingDays.map((d) => {
          const dateStr = d.toISOString().slice(0, 10);
          const active = selectedDate === dateStr;
          return (
            <button
              key={dateStr}
              onClick={() => {
                setSelectedDate(dateStr);
                setSelectedTime(null);
              }}
              className={`shrink-0 w-16 py-2.5 rounded-xl border text-center ${
                active ? "bg-teal text-white border-teal" : "border-border text-ink"
              }`}
            >
              <div className="text-[10px] font-bold uppercase opacity-80">
                {d.toLocaleDateString("en-US", { weekday: "short" })}
              </div>
              <div className="text-base font-extrabold mt-0.5">{d.getDate()}</div>
            </button>
          );
        })}
      </div>

      <div className="text-xs font-bold text-gray uppercase tracking-wide mb-3">Available Times</div>
      {!selectedDate && <p className="text-gray text-[13.5px]">Pick a date to see open times.</p>}
      <div className="flex flex-col gap-2 mb-24">
        {availableTimes.map((t) => (
          <button
            key={t}
            onClick={() => setSelectedTime(t)}
            className={`w-full py-3.5 rounded-xl border text-sm font-bold ${
              selectedTime === t ? "bg-teal text-white border-teal" : "border-border text-ink"
            }`}
          >
            {t}
          </button>
        ))}
        {selectedDate && availableTimes.length === 0 && (
          <p className="text-gray text-[13.5px]">No open times that day — try another date.</p>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border px-6 py-4">
        <div className="max-w-[900px] mx-auto">
          <button
            disabled={!selectedDate || !selectedTime}
            onClick={() =>
              router.push(
                `/app/checkout?businessId=${businessId}&services=${serviceIds}&date=${selectedDate}&time=${encodeURIComponent(
                  selectedTime ?? ""
                )}`
              )
            }
            className="w-full py-4 rounded-xl bg-teal text-white font-bold text-[15px] disabled:opacity-40"
          >
            Continue to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
