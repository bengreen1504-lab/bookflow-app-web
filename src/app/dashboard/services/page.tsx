import { requireBusiness } from "@/lib/data/session";
import { addServiceAction, removeServiceAction, updateServiceAction } from "@/lib/actions/business";
import { ServiceRow } from "@/components/dashboard/service-row";

export default async function ServicesPage() {
  const { supabase, business } = await requireBusiness();
  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at");

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink mb-7">Manage Services</h1>

      <div className="border border-border rounded-2xl overflow-hidden mb-4">
        <div className="grid grid-cols-[2fr_1fr_1fr_0.6fr] px-4 py-3 bg-black/[0.02] text-xs font-bold text-gray">
          <span>Service</span>
          <span>Duration</span>
          <span>Price</span>
          <span />
        </div>
        {(services ?? []).map((s) => (
          <ServiceRow
            key={s.id}
            service={s}
            updateAction={updateServiceAction}
            removeAction={removeServiceAction}
          />
        ))}
        {(services ?? []).length === 0 && (
          <div className="text-center text-gray text-[13.5px] py-8">
            No services yet — add your first one below.
          </div>
        )}
      </div>

      <form action={addServiceAction} className="flex flex-wrap gap-2 items-end">
        <input
          name="name"
          placeholder="Service name"
          required
          className="px-3 py-2.5 rounded-lg border border-border text-[13.5px] outline-none"
        />
        <input
          name="duration_minutes"
          type="number"
          placeholder="Duration (min)"
          defaultValue={30}
          className="px-3 py-2.5 rounded-lg border border-border text-[13.5px] outline-none w-36"
        />
        <input
          name="price"
          type="number"
          step="0.01"
          placeholder="Price"
          defaultValue={0}
          className="px-3 py-2.5 rounded-lg border border-border text-[13.5px] outline-none w-28"
        />
        <button className="px-5 py-2.5 rounded-lg bg-teal-soft text-teal-dark font-bold text-[13.5px]">
          + Add Service
        </button>
      </form>
    </div>
  );
}
