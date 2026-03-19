-- 00012_deliverable_reviews.sql
-- 建立可交付成果審核系統所需的三個資料表

-- 1. 可交付成果審核主表
CREATE TABLE deliverable_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_type TEXT, -- 'image', 'pdf', 'link', 'other'
  status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review', 'approved', 'revision_requested')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 審核評論表
CREATE TABLE review_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES deliverable_reviews(id) ON DELETE CASCADE,
  author_type TEXT NOT NULL CHECK (author_type IN ('freelancer', 'client')),
  author_name TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. 審核 Token 表（客戶無需登入的存取憑證）
CREATE TABLE review_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES deliverable_reviews(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 建立索引
CREATE INDEX deliverable_reviews_project_id_idx ON deliverable_reviews(project_id);
CREATE INDEX review_comments_review_id_idx ON review_comments(review_id);
CREATE INDEX review_tokens_token_idx ON review_tokens(token);
CREATE INDEX review_tokens_review_id_idx ON review_tokens(review_id);

-- 啟用 Row Level Security
ALTER TABLE deliverable_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_tokens ENABLE ROW LEVEL SECURITY;

-- Freelancer 可以完整管理自己工作區的審核
CREATE POLICY "freelancers_manage_reviews" ON deliverable_reviews
  FOR ALL USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspaces w ON p.workspace_id = w.id
      WHERE w.owner_id = auth.uid()
    )
  );

CREATE POLICY "freelancers_manage_review_comments" ON review_comments
  FOR ALL USING (
    review_id IN (
      SELECT dr.id FROM deliverable_reviews dr
      JOIN projects p ON dr.project_id = p.id
      JOIN workspaces w ON p.workspace_id = w.id
      WHERE w.owner_id = auth.uid()
    )
  );

CREATE POLICY "freelancers_manage_review_tokens" ON review_tokens
  FOR ALL USING (
    review_id IN (
      SELECT dr.id FROM deliverable_reviews dr
      JOIN projects p ON dr.project_id = p.id
      JOIN workspaces w ON p.workspace_id = w.id
      WHERE w.owner_id = auth.uid()
    )
  );

-- 自動更新 updated_at
CREATE OR REPLACE FUNCTION update_deliverable_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deliverable_reviews_updated_at
  BEFORE UPDATE ON deliverable_reviews
  FOR EACH ROW EXECUTE FUNCTION update_deliverable_reviews_updated_at();
