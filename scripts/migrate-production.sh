#!/usr/bin/env bash
# ============================================================
# Supabase Production Migration Script
# 用途：將所有 migrations 套用到 production Supabase 專案
# 用法：bash scripts/migrate-production.sh
# ============================================================

set -euo pipefail

echo "=============================="
echo " ClientSpace Production Migration"
echo "=============================="

# 檢查必要環境變數
if [ -z "${SUPABASE_PROJECT_REF:-}" ]; then
  echo "❌ 錯誤：請設定 SUPABASE_PROJECT_REF 環境變數"
  echo "   可在 Supabase Dashboard > Project Settings > General 取得"
  exit 1
fi

if [ -z "${SUPABASE_DB_PASSWORD:-}" ]; then
  echo "❌ 錯誤：請設定 SUPABASE_DB_PASSWORD 環境變數"
  echo "   可在 Supabase Dashboard > Project Settings > Database 取得"
  exit 1
fi

echo ""
echo "📋 Project Ref: $SUPABASE_PROJECT_REF"
echo ""

# 確認用戶真的想繼續
read -rp "⚠️  這將套用 migrations 到 Production 數據庫，確認繼續？(yes/no) " confirm
if [ "$confirm" != "yes" ]; then
  echo "已取消"
  exit 0
fi

echo ""
echo "🔗 連接到 Production Supabase..."

# 使用 Supabase CLI 連接並執行 migration
npx supabase link --project-ref "$SUPABASE_PROJECT_REF"

echo ""
echo "📦 推送所有 migrations..."
npx supabase db push

echo ""
echo "✅ Migration 完成！"
echo ""
echo "建議在 Supabase Dashboard 確認以下表格存在："
echo "  - workspaces"
echo "  - clients"
echo "  - projects"
echo "  - deliverables"
echo "  - files"
echo "  - messages"
echo "  - subscriptions"
echo "  - invoices"
echo "  - deliverable_reviews"
echo "  - notification_preferences"
