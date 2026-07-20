"use client";

import { useEffect, useState } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe-client";

function PayButton() {
  const stripe = useStripe();
  const elements = useElements();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    if (!stripe || !elements) return;
    setPending(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/app/confirmation`,
      },
    });

    if (submitError) {
      setError(submitError.message ?? "Payment failed. Try again.");
      setPending(false);
    }
  }

  return (
    <div>
      {error && <p className="text-sm text-error mb-3">{error}</p>}
      <button
        onClick={handlePay}
        disabled={pending || !stripe}
        className="w-full py-4 rounded-xl bg-teal text-white font-bold text-[15px] disabled:opacity-60"
      >
        {pending ? "Processing…" : "Pay & Confirm Booking"}
      </button>
      <div className="flex items-center justify-center gap-1.5 mt-3 text-gray text-xs">
        <span>Payments secured by</span>
        <span className="font-bold text-stripe">Stripe</span>
      </div>
    </div>
  );
}

export function StripeCheckout({
  businessId,
  serviceIds,
  date,
  time,
}: {
  businessId: string;
  serviceIds: string[];
  date: string;
  time: string;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/stripe/create-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "booking", businessId, serviceIds, date, time }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setClientSecret(data.clientSecret);
      })
      .catch(() => setError("Could not start checkout."));
  }, [businessId, serviceIds, date, time]);

  if (error) return <p className="text-sm text-error">{error}</p>;
  if (!clientSecret) return <p className="text-sm text-gray">Loading payment form…</p>;

  return (
    <Elements stripe={getStripe()} options={{ clientSecret }}>
      <PaymentElement />
      <div className="mt-5">
        <PayButton />
      </div>
    </Elements>
  );
}
