CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  deliverable_id UUID REFERENCES deliverables(id) ON DELETE SET NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('freelancer', 'client')),
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_project ON messages(project_id);
CREATE INDEX idx_messages_parent ON messages(parent_id);
