import { requireBusiness } from "@/lib/data/session";
import { DashboardNav } from "@/components/dashboard/nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, user, business } = await requireBusiness();
  const { count: unreadMessageCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("target_type", "chat")
    .eq("read", false);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      <DashboardNav businessName={business.name} unreadMessageCount={unreadMessageCount ?? 0} />
      <div className="flex-1 min-w-0 overflow-auto p-4 md:p-8">{children}</div>
    </div>
  );
}
