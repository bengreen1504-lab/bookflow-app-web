"use client";

import { updateNotificationPrefsAction } from "@/lib/actions/profile";

const TOGGLES = [
  { name: "push_notifications", label: "Push Notifications" },
  { name: "email_reminders", label: "Email Reminders" },
  { name: "promotional_offers", label: "Promotional Offers" },
] as const;

export function NotificationToggles({
  values,
}: {
  values: { push_notifications: boolean; email_reminders: boolean; promotional_offers: boolean };
}) {
  return (
    <form action={updateNotificationPrefsAction} className="flex flex-col gap-4">
      {TOGGLES.map((toggle) => (
        <label key={toggle.name} className="flex items-center justify-between">
          <span className="text-sm text-ink">{toggle.label}</span>
          <input
            type="checkbox"
            name={toggle.name}
            defaultChecked={values[toggle.name]}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            className="w-5 h-5 accent-teal"
          />
        </label>
      ))}
    </form>
  );
}
