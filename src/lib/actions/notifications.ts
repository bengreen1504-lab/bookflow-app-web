"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/data/session";

export async function openNotificationAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id"));
  const targetType = String(formData.get("target_type") || "");
  const targetId = String(formData.get("target_id") || "");

  await supabase.from("notifications").update({ read: true }).eq("id", id).eq("user_id", user.id);

  if (targetType === "booking" && targetId) redirect(`/app/bookings/${targetId}`);
  if (targetType === "chat" && targetId) redirect(`/app/chat/${targetId}`);
  redirect("/app/notifications");
}
