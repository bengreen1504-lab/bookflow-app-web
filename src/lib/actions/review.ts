"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/data/session";

export type ActionState = { error?: string } | null;

export async function submitReviewAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const bookingId = String(formData.get("booking_id"));
  const rating = Number(formData.get("rating"));
  const body = String(formData.get("body") || "").trim();

  if (!rating || rating < 1 || rating > 5) {
    return { error: "Pick a star rating." };
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, business_id, customer_id, status")
    .eq("id", bookingId)
    .single();

  if (!booking || booking.customer_id !== user.id || booking.status !== "completed") {
    return { error: "This booking can't be reviewed." };
  }

  const { error } = await supabase.from("reviews").insert({
    business_id: booking.business_id,
    customer_id: user.id,
    booking_id: booking.id,
    rating,
    body,
  });

  if (error) return { error: error.message };

  redirect(`/app/bookings/${bookingId}`);
}
