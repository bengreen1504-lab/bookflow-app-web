import { requireUser } from "@/lib/data/session";
import { openNotificationAction } from "@/lib/actions/notifications";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default async function NotificationsPage() {
  const { supabase, user } = await requireUser();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink mb-6">Notifications</h1>
      <div className="flex flex-col">
        {(notifications ?? []).map((n) => (
          <form key={n.id} action={openNotificationAction}>
            <input type="hidden" name="id" value={n.id} />
            <input type="hidden" name="target_type" value={n.target_type ?? ""} />
            <input type="hidden" name="target_id" value={n.target_id ?? ""} />
            <button className="w-full text-left flex items-center gap-3 py-3.5 border-b border-border">
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${n.read ? "bg-transparent" : "bg-teal"}`}
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-ink">{n.title}</div>
                <div className="text-xs text-gray truncate">{n.body}</div>
              </div>
              <div className="text-[11px] text-gray shrink-0">{timeAgo(n.created_at)}</div>
            </button>
          </form>
        ))}
        {(notifications ?? []).length === 0 && (
          <p className="text-gray text-[13.5px] py-4">You&apos;re all caught up.</p>
        )}
      </div>
    </div>
  );
}
