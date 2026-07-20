"use client";

import type { Database } from "@/lib/supabase/types";
import { initial } from "@/lib/format";

type Staff = Database["public"]["Tables"]["staff"]["Row"];

export function StaffCard({
  member,
  updateAction,
  removeAction,
}: {
  member: Staff;
  updateAction: (formData: FormData) => void;
  removeAction: (formData: FormData) => void;
}) {
  return (
    <form action={updateAction} className="border border-border rounded-2xl p-4">
      <input type="hidden" name="id" value={member.id} />
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className="w-9 h-9 rounded-full bg-success-bg text-success font-extrabold text-[13px] flex items-center justify-center shrink-0">
          {initial(member.name)}
        </div>
        <button formAction={removeAction} className="ml-auto text-error text-xs">
          Remove
        </button>
      </div>
      <input
        name="name"
        defaultValue={member.name}
        onBlur={(e) => e.currentTarget.form?.requestSubmit()}
        className="w-full text-sm font-bold text-ink outline-none mb-1"
      />
      <input
        name="role"
        defaultValue={member.role}
        onBlur={(e) => e.currentTarget.form?.requestSubmit()}
        className="w-full text-xs text-gray outline-none"
      />
    </form>
  );
}
