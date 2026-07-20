"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBusiness, requireUser } from "@/lib/data/session";
import type { BusinessCategory } from "@/lib/supabase/types";

export type ActionState = { error?: string } | null;

export async function createBusinessAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "barbers") as BusinessCategory;
  const address = String(formData.get("address") || "").trim();
  const hours = String(formData.get("hours") || "").trim();

  if (!name) return { error: "Give your business a name." };

  const { error } = await supabase
    .from("businesses")
    .insert({ owner_id: user.id, name, category, address, hours });

  if (error) return { error: error.message };

  redirect("/dashboard/overview");
}

export async function updateBusinessProfileAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, business } = await requireBusiness();

  const name = String(formData.get("name") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const hours = String(formData.get("hours") || "").trim();

  const { error } = await supabase
    .from("businesses")
    .update({ name, address, hours })
    .eq("id", business.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard", "layout");
  return { error: undefined };
}

export async function addServiceAction(formData: FormData) {
  const { supabase, business } = await requireBusiness();
  const name = String(formData.get("name") || "New Service");
  const duration = Number(formData.get("duration_minutes") || 30);
  const price = Math.round(Number(formData.get("price") || 0) * 100);

  await supabase.from("services").insert({
    business_id: business.id,
    name,
    duration_minutes: duration,
    price_cents: price,
  });

  revalidatePath("/dashboard/services");
}

export async function updateServiceAction(formData: FormData) {
  const { supabase } = await requireBusiness();
  const id = String(formData.get("id"));
  const name = String(formData.get("name") || "");
  const duration = Number(formData.get("duration_minutes") || 30);
  const price = Math.round(Number(formData.get("price") || 0) * 100);

  await supabase
    .from("services")
    .update({ name, duration_minutes: duration, price_cents: price })
    .eq("id", id);

  revalidatePath("/dashboard/services");
}

export async function removeServiceAction(formData: FormData) {
  const { supabase } = await requireBusiness();
  const id = String(formData.get("id"));
  await supabase.from("services").delete().eq("id", id);
  revalidatePath("/dashboard/services");
}

export async function addStaffAction(formData: FormData) {
  const { supabase, business } = await requireBusiness();
  const name = String(formData.get("name") || "New Member");
  const role = String(formData.get("role") || "Staff");

  await supabase.from("staff").insert({ business_id: business.id, name, role });
  revalidatePath("/dashboard/staff");
}

export async function updateStaffAction(formData: FormData) {
  const { supabase } = await requireBusiness();
  const id = String(formData.get("id"));
  const name = String(formData.get("name") || "");
  const role = String(formData.get("role") || "");

  await supabase.from("staff").update({ name, role }).eq("id", id);
  revalidatePath("/dashboard/staff");
}

export async function removeStaffAction(formData: FormData) {
  const { supabase } = await requireBusiness();
  const id = String(formData.get("id"));
  await supabase.from("staff").delete().eq("id", id);
  revalidatePath("/dashboard/staff");
}
