"use client";

import { useActionState } from "react";
import { updateBusinessProfileAction, type ActionState } from "@/lib/actions/business";
import type { Database } from "@/lib/supabase/types";

type Business = Database["public"]["Tables"]["businesses"]["Row"];

export function BusinessProfileForm({ business }: { business: Business }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateBusinessProfileAction,
    null
  );

  return (
    <form action={formAction} className="max-w-[520px] flex flex-col gap-4">
      <div>
        <label className="block text-xs font-bold text-gray mb-1.5">Business Name</label>
        <input
          name="name"
          defaultValue={business.name}
          className="w-full px-3 py-3 rounded-[10px] border border-border text-sm outline-none focus:border-teal"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-gray mb-1.5">Address</label>
        <input
          name="address"
          defaultValue={business.address}
          className="w-full px-3 py-3 rounded-[10px] border border-border text-sm outline-none focus:border-teal"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-gray mb-1.5">Hours</label>
        <input
          name="hours"
          defaultValue={business.hours}
          className="w-full px-3 py-3 rounded-[10px] border border-border text-sm outline-none focus:border-teal"
        />
      </div>
      {state?.error && <p className="text-sm text-error">{state.error}</p>}
      <button
        disabled={pending}
        className="w-40 py-3 rounded-[10px] bg-teal text-white font-bold text-sm disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save Changes"}
      </button>
    </form>
  );
}
