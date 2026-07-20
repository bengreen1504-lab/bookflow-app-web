"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/types";

export type AuthActionState = { error?: string } | null;

export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const fullName = String(formData.get("full_name") || "").trim();
  const role = String(formData.get("role") || "customer") as UserRole;

  if (!email || !password || !fullName) {
    return { error: "Fill in your name, email, and password." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role, full_name: fullName } },
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.session) {
    // Email confirmation is required by this Supabase project's auth settings.
    return {
      error:
        "Check your email to confirm your account, then sign in. (For local testing, you can disable email confirmation in Supabase Auth settings.)",
    };
  }

  redirect(role === "business_owner" ? "/onboarding" : "/app/home");
}

export async function signInAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: "Incorrect email or password." };
  }

  if (next) {
    redirect(next);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  redirect(profile?.role === "business_owner" ? "/dashboard/overview" : "/app/home");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}
