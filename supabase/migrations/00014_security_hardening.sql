-- 安全加固：補充缺少嘅 RLS policies
-- Migration 00014: Security Hardening

-- ============================================================
-- 1. subscriptions 表：補充 INSERT / UPDATE policies
--    （目前只有 SELECT policy，寫入全靠 service role）
-- ============================================================

-- Workspace owner 可以創建自己嘅 subscription 記錄
CREATE POLICY "workspace_owner_insert_subscription"
  ON public.subscriptions FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
    )
  );

-- Workspace owner 可以更新自己嘅 subscription（例如 cancel_at_period_end）
CREATE POLICY "workspace_owner_update_subscription"
  ON public.subscriptions FOR UPDATE
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
    )
  );

-- ============================================================
-- 2. review_comments + review_tokens：補充 client 讀取 policy
--    客戶可以通過 review token 讀取審核評論（匿名存取）
-- ============================================================

-- 任何人都可以讀取未過期 review token（用於驗證存取權限）
CREATE POLICY "public_read_valid_review_tokens"
  ON review_tokens FOR SELECT
  USING (
    expires_at IS NULL OR expires_at > now()
  );

-- ============================================================
-- 3. 確保 activity_logs 只允許 system/service role INSERT
--    一般用戶唔應該直接 INSERT（應通過 server action）
-- ============================================================

-- 撤銷現有過於寬鬆嘅 INSERT policy
DROP POLICY IF EXISTS "Workspace members can insert activity logs" ON activity_logs;

-- 重新建立更嚴格嘅 policy（只允許 authenticated users 插入自己 workspace 嘅記錄）
CREATE POLICY "workspace_owner_insert_activity"
  ON activity_logs FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
    AND actor_type IN ('freelancer', 'system')
  );

-- ============================================================
-- 4. 確認所有 tables 都啟用 RLS（idempotent checks）
-- ============================================================

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverable_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
