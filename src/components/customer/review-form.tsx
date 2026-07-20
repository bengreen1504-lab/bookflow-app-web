"use client";

import { useActionState, useState } from "react";
import { submitReviewAction, type ActionState } from "@/lib/actions/review";

export function ReviewForm({ bookingId }: { bookingId: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    submitReviewAction,
    null
  );
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="booking_id" value={bookingId} />
      <input type="hidden" name="rating" value={rating} />

      <div className="flex gap-1.5 justify-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className={`text-4xl leading-none ${
              (hovered || rating) >= star ? "text-warning" : "text-border"
            }`}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        name="body"
        rows={5}
        placeholder="How was it?"
        className="w-full px-3.5 py-3 rounded-xl border border-border text-[15px] outline-none focus:border-teal resize-none"
      />

      {state?.error && <p className="text-sm text-error">{state.error}</p>}

      <button
        disabled={pending || rating === 0}
        className="w-full py-4 rounded-xl bg-teal text-white font-bold text-[15px] disabled:opacity-40"
      >
        {pending ? "Submitting…" : "Submit Review"}
      </button>
    </form>
  );
}
