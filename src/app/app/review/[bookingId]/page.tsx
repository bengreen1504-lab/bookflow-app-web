import { notFound } from "next/navigation";
import { requireUser } from "@/lib/data/session";
import { ReviewForm } from "@/components/customer/review-form";

export default async function WriteReviewPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const { supabase, user } = await requireUser();

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, status, customer_id, businesses(name)")
    .eq("id", bookingId)
    .single();

  if (!booking || booking.customer_id !== user.id) notFound();

  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id")
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (booking.status !== "completed") {
    return <p className="text-gray text-center">Only completed bookings can be reviewed.</p>;
  }
  if (existingReview) {
    return <p className="text-gray text-center">You already reviewed this booking — thank you!</p>;
  }

  return (
    <div className="max-w-[440px] mx-auto text-center">
      <h1 className="text-2xl font-extrabold text-ink mb-1">Write a Review</h1>
      <p className="text-sm text-gray mb-7">{booking.businesses?.name}</p>
      <ReviewForm bookingId={booking.id} />
    </div>
  );
}
