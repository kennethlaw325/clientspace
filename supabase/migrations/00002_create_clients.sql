CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  avatar_url TEXT,
  portal_token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, email)
);

CREATE INDEX idx_clients_workspace ON clients(workspace_id);
CREATE INDEX idx_clients_portal_token ON clients(portal_token);
