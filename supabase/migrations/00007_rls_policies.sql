-- Enable RLS on all tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Workspaces: owner full access
CREATE POLICY "workspace_owner_all" ON workspaces
  FOR ALL USING (owner_id = auth.uid());

-- Clients: workspace owner access
CREATE POLICY "workspace_owner_clients" ON clients
  FOR ALL USING (
    workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
  );

-- Projects: workspace owner access
CREATE POLICY "workspace_owner_projects" ON projects
  FOR ALL USING (
    workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
  );

-- Deliverables: via project's workspace
CREATE POLICY "workspace_owner_deliverables" ON deliverables
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE owner_id = auth.uid()
      )
    )
  );

-- Files: via project's workspace
CREATE POLICY "workspace_owner_files" ON files
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE owner_id = auth.uid()
      )
    )
  );

-- Messages: via project's workspace
CREATE POLICY "workspace_owner_messages" ON messages
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE owner_id = auth.uid()
      )
    )
  );
