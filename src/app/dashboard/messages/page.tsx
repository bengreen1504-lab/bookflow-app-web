import Link from "next/link";
import { requireBusiness } from "@/lib/data/session";
import { initial } from "@/lib/format";

export default async function MessagesInboxPage() {
  const { supabase, business } = await requireBusiness();

  const { data: messages } = await supabase
    .from("messages")
    .select("customer_id, sender, body, created_at, profiles(full_name)")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  const messageList = messages ?? [];
  const byCustomer = new Map<string, (typeof messageList)[number]>();
  messageList.forEach((m) => {
    if (!byCustomer.has(m.customer_id)) byCustomer.set(m.customer_id, m);
  });
  const conversations = [...byCustomer.values()];

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink mb-6">Messages</h1>
      <div className="flex flex-col">
        {conversations.map((m) => (
          <Link
            key={m.customer_id}
            href={`/dashboard/messages/${m.customer_id}`}
            className="flex items-center gap-3 py-3.5 border-b border-border"
          >
            <div className="w-9 h-9 rounded-full bg-teal-soft text-teal-dark font-extrabold text-xs flex items-center justify-center shrink-0">
              {initial(m.profiles?.full_name ?? "?")}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-ink">{m.profiles?.full_name}</div>
              <div className="text-xs text-gray truncate">
                {m.sender === "business" ? "You: " : ""}
                {m.body}
              </div>
            </div>
          </Link>
        ))}
        {conversations.length === 0 && (
          <p className="text-gray text-[13.5px] py-4">No messages yet.</p>
        )}
      </div>
    </div>
  );
}
