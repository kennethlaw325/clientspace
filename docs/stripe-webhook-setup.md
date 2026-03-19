# Stripe Webhook 配置指引（Production）

## 概覽

ClientSpace 使用 Stripe Webhook 處理訂閱事件，包括付款成功、訂閱更新、訂閱取消等。

## 第一步：建立 Webhook Endpoint

1. 登入 [Stripe Dashboard](https://dashboard.stripe.com)
2. 前往 **Developers > Webhooks**
3. 點擊 **Add endpoint**
4. 填入以下資訊：
   - **Endpoint URL**: `https://your-domain.com/api/stripe/webhooks`
   - **Description**: ClientSpace Production Webhook

## 第二步：選擇監聽事件

選擇以下必需事件：

| 事件類型 | 用途 |
|---------|------|
| `checkout.session.completed` | 新訂閱或一次性付款完成 |
| `customer.subscription.updated` | 訂閱狀態更新（upgrade/downgrade/trial 結束等） |
| `customer.subscription.deleted` | 訂閱取消 |
| `invoice.paid` | 付款成功（新訂閱及每月續費） |
| `invoice.payment_failed` | 付款失敗（訂閱標記為 past_due） |
| `payment_intent.succeeded` | 一次性發票付款成功 |

> **注意**：Stripe 使用 `invoice.paid`，不是 `invoice.payment_succeeded`（後者為過時事件名稱）。

## 第三步：取得 Webhook Signing Secret

1. Webhook 建立後，點擊進入 Webhook 詳情頁
2. 在 **Signing secret** 欄位點擊 **Reveal**
3. 複製 `whsec_...` 開頭的密鑰
4. 設定到環境變數：
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your-signing-secret
   ```

## 第四步：Production API Keys

### 取得 Production Keys
1. 在 Stripe Dashboard 右上角確認已切換到 **Live mode**
2. 前往 **Developers > API Keys**
3. 複製以下兩個 key：
   - **Publishable key**: `pk_live_...` → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key**: `sk_live_...` → `STRIPE_SECRET_KEY`

### 取得 Price IDs
1. 前往 **Products** 頁面
2. 為每個方案找到對應的 Price ID（`price_...`）：
   - Starter 方案 → `STRIPE_STARTER_PRICE_ID`
   - Pro 方案 → `STRIPE_PRO_PRICE_ID`

## 第五步：在 Vercel 設定環境變數

```bash
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add STRIPE_STARTER_PRICE_ID
vercel env add STRIPE_PRO_PRICE_ID
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

## 測試 Webhook（Staging 環境）

使用 Stripe CLI 在本地測試：

```bash
# 安裝 Stripe CLI
brew install stripe/stripe-cli/stripe

# 登入
stripe login

# 轉發 webhook 到本地
stripe listen --forward-to localhost:3000/api/stripe/webhooks

# 觸發測試事件
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
```

## 注意事項

- **切勿**將 Test mode keys 用於 Production
- Webhook Signing Secret 每個 Endpoint 都不同，請確保使用正確的那一個
- 如果 Webhook 收不到事件，檢查 Vercel Functions 的 timeout 設定（預設 30s）
