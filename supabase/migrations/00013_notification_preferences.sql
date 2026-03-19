-- notification_preferences 表：用戶通知偏好設定
create table if not exists notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  email_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, event_type)
);

-- RLS：用戶只能讀寫自己的偏好設定
alter table notification_preferences enable row level security;

create policy "Users can view own notification preferences"
  on notification_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert own notification preferences"
  on notification_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update own notification preferences"
  on notification_preferences for update
  using (auth.uid() = user_id);

create policy "Users can delete own notification preferences"
  on notification_preferences for delete
  using (auth.uid() = user_id);

-- updated_at 自動更新
create or replace function update_notification_preferences_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger notification_preferences_updated_at
  before update on notification_preferences
  for each row
  execute function update_notification_preferences_updated_at();
