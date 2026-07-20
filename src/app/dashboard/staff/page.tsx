import { requireBusiness } from "@/lib/data/session";
import { addStaffAction, removeStaffAction, updateStaffAction } from "@/lib/actions/business";
import { StaffCard } from "@/components/dashboard/staff-card";

export default async function StaffPage() {
  const { supabase, business } = await requireBusiness();
  const { data: staff } = await supabase
    .from("staff")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at");

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink mb-7">Staff</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {(staff ?? []).map((s) => (
          <StaffCard
            key={s.id}
            member={s}
            updateAction={updateStaffAction}
            removeAction={removeStaffAction}
          />
        ))}
      </div>
      {(staff ?? []).length === 0 && (
        <p className="text-gray text-[13.5px] mb-4">No staff yet — invite your first team member.</p>
      )}

      <form action={addStaffAction} className="flex flex-wrap gap-2 items-end">
        <input
          name="name"
          placeholder="Name"
          required
          className="px-3 py-2.5 rounded-lg border border-border text-[13.5px] outline-none"
        />
        <input
          name="role"
          placeholder="Role"
          defaultValue="Staff"
          className="px-3 py-2.5 rounded-lg border border-border text-[13.5px] outline-none"
        />
        <button className="px-5 py-2.5 rounded-lg bg-teal-soft text-teal-dark font-bold text-[13.5px]">
          + Invite Staff
        </button>
      </form>
    </div>
  );
}
