import { requireBusiness } from "@/lib/data/session";
import { BusinessProfileForm } from "@/components/dashboard/business-profile-form";

export default async function BusinessProfilePage() {
  const { business } = await requireBusiness();
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink mb-7">Business Profile</h1>
      <BusinessProfileForm business={business} />
    </div>
  );
}
