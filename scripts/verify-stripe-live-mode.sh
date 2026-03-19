#!/usr/bin/env bash
# ============================================================
# Stripe Live Mode 切換驗證腳本
# 用途：確認所有 Stripe 相關環境變數已正確設定為 live mode
# 使用方法：bash scripts/verify-stripe-live-mode.sh
# ============================================================

set -euo pipefail

PASS=0
FAIL=0
WARN=0

green() { echo -e "\033[32m✓ $1\033[0m"; }
red()   { echo -e "\033[31m✗ $1\033[0m"; }
yellow(){ echo -e "\033[33m⚠ $1\033[0m"; }

echo "======================================"
echo " Stripe Live Mode 環境變數驗證"
echo "======================================"
echo ""

# 載入 .env.local
if [ -f ".env.local" ]; then
  export $(grep -v '^#' .env.local | grep -v '^$' | xargs)
  echo "載入 .env.local"
else
  red ".env.local 不存在"
  exit 1
fi

echo ""
echo "--- 必須環境變數 ---"

check_required() {
  local var="$1"
  local value="${!var:-}"
  if [ -z "$value" ]; then
    red "$var 未設定"
    FAIL=$((FAIL+1))
  else
    green "$var 已設定"
    PASS=$((PASS+1))
  fi
}

check_live_key() {
  local var="$1"
  local prefix="$2"
  local value="${!var:-}"
  if [ -z "$value" ]; then
    red "$var 未設定"
    FAIL=$((FAIL+1))
  elif [[ "$value" == ${prefix}* ]]; then
    green "$var 已設定（live mode）"
    PASS=$((PASS+1))
  elif [[ "$value" == *"test"* ]]; then
    red "$var 是 TEST mode key！請換成 live mode key"
    FAIL=$((FAIL+1))
  else
    yellow "$var 已設定但格式無法辨認"
    WARN=$((WARN+1))
  fi
}

check_live_key "STRIPE_SECRET_KEY" "sk_live_"
check_live_key "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "pk_live_"
check_required "STRIPE_WEBHOOK_SECRET"
check_required "STRIPE_STARTER_PRICE_ID"
check_required "STRIPE_PRO_PRICE_ID"

echo ""
echo "--- Webhook Secret 格式 ---"

WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET:-}"
if [[ "$WEBHOOK_SECRET" == whsec_* ]]; then
  green "STRIPE_WEBHOOK_SECRET 格式正確（whsec_...）"
  PASS=$((PASS+1))
elif [ -n "$WEBHOOK_SECRET" ]; then
  red "STRIPE_WEBHOOK_SECRET 格式錯誤，應以 whsec_ 開頭"
  FAIL=$((FAIL+1))
fi

echo ""
echo "--- Price ID 格式 ---"

check_price_id() {
  local var="$1"
  local value="${!var:-}"
  if [ -n "$value" ] && [[ "$value" == price_* ]]; then
    green "$var 格式正確（price_...）"
    PASS=$((PASS+1))
  elif [ -n "$value" ]; then
    red "$var 格式錯誤，應以 price_ 開頭（當前：$value）"
    FAIL=$((FAIL+1))
  fi
}

check_price_id "STRIPE_STARTER_PRICE_ID"
check_price_id "STRIPE_PRO_PRICE_ID"

echo ""
echo "--- App URL ---"

APP_URL="${NEXT_PUBLIC_APP_URL:-}"
if [ -z "$APP_URL" ]; then
  red "NEXT_PUBLIC_APP_URL 未設定"
  FAIL=$((FAIL+1))
elif [[ "$APP_URL" == https://* ]]; then
  green "NEXT_PUBLIC_APP_URL 使用 HTTPS（$APP_URL）"
  PASS=$((PASS+1))
elif [[ "$APP_URL" == http://localhost* ]]; then
  yellow "NEXT_PUBLIC_APP_URL 仍是 localhost，請更新為 production URL"
  WARN=$((WARN+1))
else
  yellow "NEXT_PUBLIC_APP_URL 未使用 HTTPS，建議使用 https://"
  WARN=$((WARN+1))
fi

echo ""
echo "======================================"
echo " 結果：✓ $PASS 通過  ✗ $FAIL 失敗  ⚠ $WARN 警告"
echo "======================================"

if [ $FAIL -gt 0 ]; then
  echo ""
  red "驗證未通過，請修正以上錯誤再進行 live mode 切換"
  exit 1
elif [ $WARN -gt 0 ]; then
  echo ""
  yellow "驗證通過（有警告），請確認以上警告項目"
  exit 0
else
  echo ""
  green "所有驗證通過！可以安全切換到 Stripe live mode"
  exit 0
fi
