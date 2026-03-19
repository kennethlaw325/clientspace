-- Storage bucket for project files (50MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('project-files', 'project-files', false, 52428800);

-- Storage RLS: workspace owner can upload/read/delete
CREATE POLICY "workspace_owner_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'project-files' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "workspace_owner_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'project-files' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "workspace_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'project-files' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM workspaces WHERE owner_id = auth.uid()
    )
  );
