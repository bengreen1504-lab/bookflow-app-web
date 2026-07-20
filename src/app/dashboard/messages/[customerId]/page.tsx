import { notFound } from "next/navigation";
import { requireBusiness } from "@/lib/data/session";
import { sendMessageAction } from "@/lib/actions/chat";

export default async function MessageThreadPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  const { supabase, business } = await requireBusiness();

  const { data: customer } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", customerId)
    .single();
  if (!customer) notFound();

  const { data: messages } = await supabase
    .from("messages")
    .select("sender, body, created_at")
    .eq("business_id", business.id)
    .eq("customer_id", customerId)
    .order("created_at");

  return (
    <div className="max-w-[560px] flex flex-col h-[calc(100vh-64px)]">
      <h1 className="text-lg font-extrabold text-ink mb-4">{customer.full_name}</h1>

      <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 mb-4">
        {(messages ?? []).map((m, i) => (
          <div
            key={i}
            className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-[13.5px] ${
              m.sender === "business"
                ? "self-end bg-teal text-white"
                : "self-start bg-black/[0.04] text-ink"
            }`}
          >
            {m.body}
          </div>
        ))}
        {(messages ?? []).length === 0 && (
          <p className="text-gray text-[13.5px] text-center mt-8">No messages yet.</p>
        )}
      </div>

      <form action={sendMessageAction} className="flex gap-2">
        <input type="hidden" name="business_id" value={business.id} />
        <input type="hidden" name="customer_id" value={customerId} />
        <input
          name="body"
          placeholder="Reply…"
          required
          className="flex-1 px-3.5 py-3 rounded-xl border border-border text-[14px] outline-none focus:border-teal"
        />
        <button className="w-11 h-11 rounded-full bg-teal text-white flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path
              d="M2 10h16M18 10l-7-7M18 10l-7 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </form>
    </div>
  );
}
