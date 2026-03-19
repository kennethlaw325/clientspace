-- Subscriptions table for Stripe billing
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  stripe_customer_id text unique not null,
  stripe_subscription_id text unique,
  stripe_price_id text,
  plan text not null default 'free' check (plan in ('free', 'starter', 'pro')),
  status text not null default 'active' check (status in ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'unpaid')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One subscription per workspace
create unique index subscriptions_workspace_id_idx on public.subscriptions(workspace_id);

-- RLS
alter table public.subscriptions enable row level security;

create policy "Workspace owner can read subscription"
  on public.subscriptions for select
  using (
    workspace_id in (
      select id from public.workspaces where owner_id = auth.uid()
    )
  );

-- Trigger to update updated_at
create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute procedure moddatetime(updated_at);
