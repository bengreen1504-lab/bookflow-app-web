"use server";

import { requireUser } from "@/lib/data/session";

export async function cancelBookingAction(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id"));
  await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
}
