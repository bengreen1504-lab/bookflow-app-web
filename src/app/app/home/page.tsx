import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const CATEGORY_LABELS: Record<string, string> = {
  barbers: "Barbershop",
  salons: "Salon",
  cleaners: "Cleaning",
  car_detailing: "Car Detailing",
};

export default async function BrowsePage() {
  const supabase = await createClient();
  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, category, address")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink mb-6">Nearby Providers</h1>
      <div className="grid grid-cols-2 gap-4">
        {(businesses ?? []).map((b) => (
          <Link
            key={b.id}
            href={`/app/business/${b.id}`}
            className="border border-border rounded-2xl p-4 flex gap-3 items-center hover:border-teal"
          >
            <div className="w-16 h-16 rounded-xl bg-black/[0.04] shrink-0" />
            <div className="min-w-0">
              <div className="text-[15px] font-bold text-ink truncate">{b.name}</div>
              <div className="text-xs text-gray mt-0.5">{CATEGORY_LABELS[b.category] ?? b.category}</div>
              <div className="text-xs text-gray mt-0.5 truncate">{b.address}</div>
            </div>
          </Link>
        ))}
        {(businesses ?? []).length === 0 && (
          <p className="text-gray text-[13.5px] col-span-2">
            No businesses have joined BookFlow yet — check back soon.
          </p>
        )}
      </div>
    </div>
  );
}
