"use client";

import type { Database } from "@/lib/supabase/types";

type Service = Database["public"]["Tables"]["services"]["Row"];

export function ServiceRow({
  service,
  updateAction,
  removeAction,
}: {
  service: Service;
  updateAction: (formData: FormData) => void;
  removeAction: (formData: FormData) => void;
}) {
  return (
    <form
      action={updateAction}
      className="grid grid-cols-[2fr_1fr_1fr_0.6fr] gap-2 px-4 py-2.5 border-t border-border items-center"
    >
      <input type="hidden" name="id" value={service.id} />
      <input
        name="name"
        defaultValue={service.name}
        onBlur={(e) => e.currentTarget.form?.requestSubmit()}
        className="text-[13.5px] font-semibold text-ink outline-none bg-transparent"
      />
      <input
        name="duration_minutes"
        type="number"
        defaultValue={service.duration_minutes}
        onBlur={(e) => e.currentTarget.form?.requestSubmit()}
        className="text-[12.5px] border border-border rounded-lg px-2 py-1.5 w-20 outline-none"
      />
      <input
        name="price"
        type="number"
        step="0.01"
        defaultValue={(service.price_cents / 100).toFixed(2)}
        onBlur={(e) => e.currentTarget.form?.requestSubmit()}
        className="text-[12.5px] border border-border rounded-lg px-2 py-1.5 w-24 outline-none"
      />
      <button formAction={removeAction} className="text-[12.5px] text-error text-left">
        Remove
      </button>
    </form>
  );
}
