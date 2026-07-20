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
  // A business owner replies into a specific customer's thread; a customer
  // only ever has one thread with a given business (their own).
  const customerId = sender === "customer" ? user.id : String(formData.get("customer_id"));

  await supabase.from("messages").insert({
    business_id: businessId,
    customer_id: customerId,
    sender,
    body,
  });

  revalidatePath(`/app/chat/${businessId}`);
  revalidatePath(`/dashboard/messages/${customerId}`);
  revalidatePath("/dashboard/messages");
}
