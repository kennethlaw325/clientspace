"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { NotificationEventType } from "@/lib/notifications";
import { ALL_EVENT_TYPES } from "@/lib/notification-config";

export interface NotificationPreference {
  event_type: NotificationEventType;
  email_enabled: boolean;
}

export async function getNotificationPreferences(): Promise<NotificationPreference[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("notification_preferences")
    .select("event_type, email_enabled")
    .eq("user_id", user.id);

  // 補齊未設定的項目（預設 true）
  const existing = new Map((data ?? []).map((r) => [r.event_type, r.email_enabled]));
  return ALL_EVENT_TYPES.map(({ type }) => ({
    event_type: type,
    email_enabled: existing.has(type) ? (existing.get(type) as boolean) : true,
  }));
}

export async function updateNotificationPreference(
  eventType: NotificationEventType,
  emailEnabled: boolean
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("notification_preferences")
    .upsert(
      {
        user_id: user.id,
        event_type: eventType,
        email_enabled: emailEnabled,
      },
      { onConflict: "user_id,event_type" }
    );

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: true };
}
