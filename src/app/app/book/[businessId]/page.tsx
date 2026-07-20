import { createClient } from "@/lib/supabase/server";
import { BookingPicker } from "@/components/customer/booking-picker";

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessId: string }>;
  searchParams: Promise<{ services?: string }>;
}) {
  const { businessId } = await params;
  const { services: serviceIds } = await searchParams;
  const supabase = await createClient();

  const [{ data: business }, { data: existingBookings }] = await Promise.all([
    supabase.from("businesses").select("name").eq("id", businessId).single(),
    supabase
      .from("bookings")
      .select("booking_date, booking_time")
      .eq("business_id", businessId)
      .neq("status", "cancelled"),
  ]);

  const bookedSlotsByDate: Record<string, string[]> = {};
  (existingBookings ?? []).forEach((b) => {
    bookedSlotsByDate[b.booking_date] = [...(bookedSlotsByDate[b.booking_date] ?? []), b.booking_time];
  });

  return (
    <div>
      <div className="border border-border rounded-2xl p-4 mb-6">
        <div className="text-sm font-bold text-ink">{business?.name}</div>
        <div className="text-xs text-gray mt-0.5">Central Time</div>
      </div>
      <BookingPicker
        businessId={businessId}
        serviceIds={serviceIds ?? ""}
        bookedSlotsByDate={bookedSlotsByDate}
      />
    </div>
  );
}
