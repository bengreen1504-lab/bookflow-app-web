"use client";

import { useActionState } from "react";
import { createBusinessAction } from "@/lib/actions/business";

const CATEGORIES = [
  { value: "barbers", label: "Barbershop" },
  { value: "salons", label: "Salon" },
  { value: "cleaners", label: "Cleaning" },
  { value: "car_detailing", label: "Car Detailing" },
];

export default function OnboardingPage() {
  const [state, formAction, pending] = useActionState(createBusinessAction, null);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-[440px]">
        <h1 className="text-2xl font-extrabold text-ink text-center">Set up your business</h1>
        <p className="text-sm text-gray text-center mt-1">
          This takes about a minute — you can change everything later.
        </p>

        <form action={formAction} className="mt-7 flex flex-col gap-3.5">
          <div>
            <label className="block text-xs font-bold text-gray mb-1.5">Business name</label>
            <input
              name="name"
              required
              placeholder="Fade Masters Barbershop"
              className="w-full px-3.5 py-3 rounded-xl border border-border text-[15px] outline-none focus:border-teal"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray mb-1.5">Category</label>
            <select
              name="category"
              className="w-full px-3.5 py-3 rounded-xl border border-border text-[15px] outline-none focus:border-teal bg-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray mb-1.5">Address</label>
            <input
              name="address"
              placeholder="214 Elm St, Austin, TX"
              className="w-full px-3.5 py-3 rounded-xl border border-border text-[15px] outline-none focus:border-teal"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray mb-1.5">Hours</label>
            <input
              name="hours"
              placeholder="Mon–Sat · 9:00 AM–7:00 PM"
              className="w-full px-3.5 py-3 rounded-xl border border-border text-[15px] outline-none focus:border-teal"
            />
          </div>

          {state?.error && <p className="text-sm text-error">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="w-full py-4 rounded-xl bg-teal text-white font-bold text-[15.5px] mt-1 disabled:opacity-60"
          >
            {pending ? "Setting up…" : "Continue to dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}
