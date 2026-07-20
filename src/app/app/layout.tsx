import { requireProfile } from "@/lib/data/session";
import { CustomerNav } from "@/components/customer/nav";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  await requireProfile();
  return (
    <div className="min-h-screen bg-white">
      <CustomerNav />
      <main className="max-w-[900px] mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
