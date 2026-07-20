import type { BookingStatus } from "@/lib/supabase/types";

const STYLES: Record<BookingStatus, string> = {
  upcoming: "bg-teal-soft text-teal",
  completed: "bg-success-bg text-success",
  cancelled: "bg-error-bg text-error",
};

export function StatusPill({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`inline-block w-fit text-[11px] font-bold px-2.5 py-1 rounded-lg capitalize ${STYLES[status]}`}
    >
      {status}
    </span>
  );
}
