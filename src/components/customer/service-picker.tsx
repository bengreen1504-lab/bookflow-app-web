"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { money } from "@/lib/format";

type Service = { id: string; name: string; duration_minutes: number; price_cents: number };

export function ServicePicker({ businessId, services }: { businessId: string; services: Service[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const router = useRouter();

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  const total = services
    .filter((s) => selected.includes(s.id))
    .reduce((sum, s) => sum + s.price_cents, 0);

  return (
    <div>
      <div className="flex flex-col gap-2.5 mb-24">
        {services.map((s) => {
          const active = selected.includes(s.id);
          return (
            <button
              key={s.id}
              onClick={() => toggle(s.id)}
              className={`w-full flex items-center justify-between text-left border rounded-xl px-4 py-3.5 ${
                active ? "border-teal bg-teal-soft" : "border-border"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                    active ? "bg-teal border-teal" : "border-border"
                  }`}
                >
                  {active && <span className="text-white text-xs">✓</span>}
                </div>
                <div>
                  <div className="text-sm font-bold text-ink">{s.name}</div>
                  <div className="text-xs text-gray">{s.duration_minutes} min</div>
                </div>
              </div>
              <div className="text-sm font-bold text-ink">{money(s.price_cents)}</div>
            </button>
          );
        })}
        {services.length === 0 && (
          <p className="text-gray text-[13.5px]">This business hasn&apos;t added services yet.</p>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border px-6 py-4">
        <div className="max-w-[900px] mx-auto">
          <button
            disabled={selected.length === 0}
            onClick={() =>
              router.push(`/app/book/${businessId}?services=${selected.join(",")}`)
            }
            className="w-full py-4 rounded-xl bg-teal text-white font-bold text-[15px] disabled:opacity-40"
          >
            {selected.length === 0 ? "Select a service to continue" : `Continue · ${money(total)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
