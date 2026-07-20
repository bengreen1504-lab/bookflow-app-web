"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/data/session";

export async function sendMessageAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const businessId = String(formData.get("business_id"));
  const body = String(formData.get("body") || "").trim();
  if (!body) return;

  const { data: business } = await supabase
    .from("businesses")
    .select("owner_id")
    .eq("id", businessId)
    .single();

  const sender = business?.owner_id === user.id ? "business" : "customer";

  // When the business owner sends a message, `customer_id` must be supplied
  // separately (a business can have many customer threads); this action is
  // only wired up on the customer side for now, so it's always the current
  // user's own thread with the business.
  await supabase.from("messages").insert({
    business_id: businessId,
    customer_id: sender === "customer" ? user.id : String(formData.get("customer_id")),
    sender,
    body,
  });

  revalidatePath(`/app/chat/${businessId}`);
}
