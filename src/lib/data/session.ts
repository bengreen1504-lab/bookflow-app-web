import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  return { supabase, user };
}

export async function requireProfile() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/sign-in");
  return { supabase, user, profile };
}

// Business owners have exactly one business in this MVP. Redirects to
// /onboarding if they haven't created one yet.
export async function requireBusiness() {
  const { supabase, user, profile } = await requireProfile();
  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!business) redirect("/onboarding");
  return { supabase, user, profile, business };
}
