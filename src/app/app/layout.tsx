import { requireProfile } from "@/lib/data/session";
import { CustomerNav } from "@/components/customer/nav";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireProfile();
  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false);

  return (
    <div className="min-h-screen bg-white">
      <CustomerNav unreadCount={unreadCount ?? 0} />
      <main className="max-w-[900px] mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
