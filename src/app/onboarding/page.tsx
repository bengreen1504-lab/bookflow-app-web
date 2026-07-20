import { redirect } from "next/navigation";
import { requireUser } from "@/lib/data/session";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const { supabase, user } = await requireUser();

  const { data: existingBusiness } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (existingBusiness) redirect("/dashboard/overview");

  return <OnboardingForm />;
}
