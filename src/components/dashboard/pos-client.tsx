"use client";

import { useState, useTransition } from "react";
import { money } from "@/lib/format";
import { chargePosAction, type CartLine } from "@/lib/actions/pos";
import { PosPayment } from "@/components/dashboard/pos-payment";
import type { PosMethod } from "@/lib/supabase/types";

type Service = { id: string; name: string; price_cents: number };

const METHODS: { key: PosMethod; label: string }[] = [
  { key: "tap", label: "Tap to Pay" },
  { key: "reader", label: "Card Reader" },
  { key: "cash", label: "Cash" },
];

export function PosClient({ businessId, services }: { businessId: string; services: Service[] }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [method, setMethod] = useState<PosMethod>("tap");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [preparingPayment, setPreparingPayment] = useState(false);

  const total = cart.reduce((sum, l) => sum + l.priceCents * l.qty, 0);

  function addToCart(s: Service) {
    setCart((prev) => {
      const existing = prev.find((l) => l.serviceId === s.id);
      if (existing) {
        return prev.map((l) => (l.serviceId === s.id ? { ...l, qty: l.qty + 1 } : l));
      }
      return [...prev, { serviceId: s.id, name: s.name, priceCents: s.price_cents, qty: 1 }];
    });
  }

  function removeFromCart(serviceId: string) {
    setCart((prev) => prev.filter((l) => l.serviceId !== serviceId));
  }

  function flash(text: string) {
    setMessage(text);
    setTimeout(() => setMessage(null), 2500);
  }

  function resetSale() {
    setCart([]);
    setClientSecret(null);
    flash("Payment received");
  }

  async function charge() {
    if (cart.length === 0) {
      flash("Cart is empty");
      return;
    }

    if (method === "cash") {
      startTransition(async () => {
        const result = await chargePosAction(method, cart);
        if (result.error) flash(result.error);
        else {
          setCart([]);
          flash("Payment received");
        }
      });
      return;
    }

    // Tap to Pay / Card Reader route through a real Stripe PaymentIntent.
    setPreparingPayment(true);
    try {
      const res = await fetch("/api/stripe/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "pos",
          businessId,
          method,
          items: cart.map((l) => ({ serviceId: l.serviceId, qty: l.qty })),
        }),
      });
      const data = await res.json();
      if (data.error) flash(data.error);
      else setClientSecret(data.clientSecret);
    } catch {
      flash("Could not start payment");
    } finally {
      setPreparingPayment(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 items-start">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {services.map((s) => (
          <button
            key={s.id}
            onClick={() => addToCart(s)}
            className="text-left border border-border rounded-xl p-4 hover:border-teal"
          >
            <div className="text-sm font-bold text-ink">{s.name}</div>
            <div className="text-[13px] text-teal-dark font-bold mt-1.5">{money(s.price_cents)}</div>
          </button>
        ))}
      </div>

      <div className="border border-border rounded-2xl p-4.5">
        <div className="text-[13px] font-bold text-gray mb-3">Cart</div>
        <div className="flex flex-col gap-2.5 mb-4 min-h-6">
          {cart.map((l) => (
            <div key={l.serviceId} className="flex justify-between items-center">
              <div className="text-[13.5px] text-ink">
                {l.name} × {l.qty}
              </div>
              <div className="flex items-center gap-2.5">
                <div className="text-[13.5px] font-bold text-ink">{money(l.priceCents * l.qty)}</div>
                {!clientSecret && (
                  <button onClick={() => removeFromCart(l.serviceId)} className="text-error text-xs">
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
          {cart.length === 0 && <div className="text-gray text-[13px]">Click a service to add it.</div>}
        </div>

        <div className="text-xs font-bold text-gray mb-2">
          Payment Method · <span className="text-stripe font-bold">Stripe</span>
        </div>
        <div className="flex gap-1.5 mb-3.5">
          {METHODS.map((m) => (
            <button
              key={m.key}
              onClick={() => {
                setMethod(m.key);
                setClientSecret(null);
              }}
              disabled={!!clientSecret}
              className={`flex-1 py-2 rounded-lg text-xs font-bold disabled:opacity-50 ${
                method === m.key ? "bg-stripe text-white" : "bg-black/[0.03] text-ink"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex justify-between text-base font-extrabold text-ink border-t border-border pt-3.5 mb-3.5">
          <span>Total</span>
          <span>{money(total)}</span>
        </div>

        {clientSecret ? (
          <PosPayment clientSecret={clientSecret} total={total} onDone={resetSale} />
        ) : (
          <button
            onClick={charge}
            disabled={pending || preparingPayment}
            className="w-full py-3.5 rounded-[10px] bg-teal text-white font-bold text-sm disabled:opacity-60"
          >
            {pending || preparingPayment ? "Preparing…" : `Charge ${money(total)}`}
          </button>
        )}
        {message && <p className="text-center text-xs text-gray mt-2.5">{message}</p>}
      </div>
    </div>
  );
}
