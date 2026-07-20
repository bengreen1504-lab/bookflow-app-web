import { requireProfile } from "@/lib/data/session";
import { initial } from "@/lib/format";
import { NotificationToggles } from "@/components/customer/notification-toggles";

export default async function ProfilePage() {
  const { profile } = await requireProfile();

  return (
    <div className="max-w-[440px] mx-auto">
      <div className="border border-border rounded-2xl p-5 flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-ink text-white font-extrabold flex items-center justify-center shrink-0">
          {initial(profile.full_name)}
        </div>
        <div>
          <div className="text-sm font-bold text-ink">{profile.full_name}</div>
          <div className="text-xs text-gray">{profile.email}</div>
        </div>
      </div>

      <div className="text-xs font-bold text-gray uppercase tracking-wide mb-3">Notifications</div>
      <NotificationToggles
        values={{
          push_notifications: profile.push_notifications,
          email_reminders: profile.email_reminders,
          promotional_offers: profile.promotional_offers,
        }}
      />
    </div>
  );
}
