-- 為發票系統新增定期發票（Recurring Invoice）支援

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS recurring_frequency TEXT CHECK (recurring_frequency IN ('monthly', 'quarterly', 'yearly')),
  ADD COLUMN IF NOT EXISTS recurring_next_date DATE,
  ADD COLUMN IF NOT EXISTS recurring_end_date DATE,
  ADD COLUMN IF NOT EXISTS recurring_parent_id UUID REFERENCES invoices(id) ON DELETE SET NULL;

-- Index for generate-recurring query performance
CREATE INDEX IF NOT EXISTS invoices_recurring_next_date_idx
  ON invoices(recurring_next_date)
  WHERE is_recurring = TRUE;

-- Index for fetching children of a parent invoice
CREATE INDEX IF NOT EXISTS invoices_recurring_parent_id_idx
  ON invoices(recurring_parent_id);
