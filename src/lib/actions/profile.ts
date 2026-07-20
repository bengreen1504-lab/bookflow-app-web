"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/data/session";

export async function updateNotificationPrefsAction(formData: FormData) {
  const { supabase, user } = await requireUser();

  await supabase
    .from("profiles")
    .update({
      push_notifications: formData.get("push_notifications") === "on",
      email_reminders: formData.get("email_reminders") === "on",
      promotional_offers: formData.get("promotional_offers") === "on",
    })
    .eq("id", user.id);

  revalidatePath("/app/profile");
}
