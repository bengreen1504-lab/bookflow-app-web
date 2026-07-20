import { requireBusiness } from "@/lib/data/session";
import { DashboardNav } from "@/components/dashboard/nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { business } = await requireBusiness();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      <DashboardNav businessName={business.name} />
      <div className="flex-1 min-w-0 overflow-auto p-4 md:p-8">{children}</div>
    </div>
  );
}
