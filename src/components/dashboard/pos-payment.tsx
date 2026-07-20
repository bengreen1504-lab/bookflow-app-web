"use client";

import { useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe-client";
import { money } from "@/lib/format";

function ConfirmButton({ total, onDone }: { total: number; onDone: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (!stripe || !elements) return;
    setPending(true);
    setError(null);

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed.");
      setPending(false);
      return;
    }
    if (paymentIntent?.status === "succeeded") {
      onDone();
    } else {
      setPending(false);
    }
  }

  return (
    <div className="mt-4">
      {error && <p className="text-sm text-error mb-2">{error}</p>}
      <button
        onClick={handleConfirm}
        disabled={pending || !stripe}
        className="w-full py-3.5 rounded-[10px] bg-teal text-white font-bold text-sm disabled:opacity-60"
      >
        {pending ? "Charging…" : `Charge ${money(total)}`}
      </button>
    </div>
  );
}

export function PosPayment({
  clientSecret,
  total,
  onDone,
}: {
  clientSecret: string;
  total: number;
  onDone: () => void;
}) {
  return (
    <Elements stripe={getStripe()} options={{ clientSecret }}>
      <PaymentElement />
      <ConfirmButton total={total} onDone={onDone} />
    </Elements>
  );
}
