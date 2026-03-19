"use client";

import { useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateNotificationPreference } from "@/lib/actions/notifications";
import type { NotificationPreference } from "@/lib/actions/notifications";
import { ALL_EVENT_TYPES } from "@/lib/notification-config";
import type { NotificationEventType } from "@/lib/notifications";

interface NotificationPreferencesProps {
  preferences: NotificationPreference[];
}

export function NotificationPreferences({ preferences }: NotificationPreferencesProps) {
  const [isPending, startTransition] = useTransition();

  function handleToggle(eventType: NotificationEventType, checked: boolean) {
    startTransition(async () => {
      await updateNotificationPreference(eventType, checked);
    });
  }

  const prefMap = new Map(preferences.map((p) => [p.event_type, p.email_enabled]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Notifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {ALL_EVENT_TYPES.map(({ type, label, description }) => (
          <div key={type} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
            <div>
              <p className="text-sm font-medium text-slate-800">{label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                type="checkbox"
                className="sr-only peer"
                defaultChecked={prefMap.get(type) ?? true}
                disabled={isPending}
                onChange={(e) => handleToggle(type, e.target.checked)}
              />
              <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:bg-indigo-600 peer-disabled:opacity-50 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
            </label>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
