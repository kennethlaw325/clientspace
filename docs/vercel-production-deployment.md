# Vercel Production 部署指引

> **最後更新：** 2026-03-20
> **狀態：** Production 就緒

## 概覽

本文檔說明如何將 ClientSpace 部署到 Vercel production 環境，包括環境變數配置、自定義域名設定及部署驗證。

---

## 前置條件

- [ ] GitHub repository 已建立（`kennethlaw325/clientspace`）
- [ ] Vercel 帳號已創建並連接 GitHub
- [ ] Supabase production project 已建立
- [ ] Stripe 帳號已啟用 live mode
- [ ] Resend 帳號已完成域名驗證
- [ ] 自定義域名已購買（可選）

---

## Step 1：連接 GitHub Repo 到 Vercel

1. 登入 [Vercel Dashboard](https://vercel.com/dashboard)
2. 點擊 **Add New... > Project**
3. Import `kennethlaw325/clientspace`
4. Framework 選擇 **Next.js**（Vercel 會自動偵測）
5. Build & Output Settings：
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

> ⚠️ 首次部署會失敗（因為環境變數未設定），這是正常的，繼續 Step 2。

---

## Step 2：設定 Production 環境變數

喺 Vercel Dashboard > Project > Settings > Environment Variables 新增以下變數：

### Supabase

| 變數名稱 | 說明 | 取得方式 |
|---------|------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production project URL | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/Public Key | Supabase Dashboard > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role Key（保密！） | Supabase Dashboard > Settings > API |

### Stripe

| 變數名稱 | 說明 | 取得方式 |
|---------|------|---------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Live Publishable Key（`pk_live_...`） | Stripe Dashboard > Developers > API Keys |
| `STRIPE_SECRET_KEY` | Live Secret Key（`sk_live_...`，保密！） | Stripe Dashboard > Developers > API Keys |
| `STRIPE_WEBHOOK_SECRET` | Webhook Signing Secret（`whsec_...`） | 見 Stripe Webhook 設定指引 |
| `STRIPE_STARTER_PRICE_ID` | Starter plan Price ID | Stripe Dashboard > Products |
| `STRIPE_PRO_PRICE_ID` | Pro plan Price ID | Stripe Dashboard > Products |

### Resend（電子郵件）

| 變數名稱 | 說明 | 取得方式 |
|---------|------|---------|
| `RESEND_API_KEY` | API Key（`re_...`） | Resend Dashboard > API Keys |
| `RESEND_FROM_EMAIL` | 發件人郵箱（需已驗證域名） | 例：`noreply@yourdomain.com` |
| `RESEND_FROM_NAME` | 發件人名稱 | 例：`ClientSpace` |

### 應用程式設定

| 變數名稱 | 說明 | 範例值 |
|---------|------|-------|
| `NEXT_PUBLIC_APP_URL` | Production URL（含 https） | `https://app.yourdomain.com` |

> ⚠️ **重要：** 所有含 `NEXT_PUBLIC_` 的變數會暴露在前端，其餘變數僅在 server 端使用。

---

## Step 3：配置自定義域名

### 3.1 在 Vercel 新增域名

1. Vercel Dashboard > Project > Settings > **Domains**
2. 輸入你的域名（例：`app.yourdomain.com`）
3. 點擊 **Add**

### 3.2 更新 DNS 記錄

根據 Vercel 提示，在你的 DNS provider 新增記錄：

**Apex domain（如 `yourdomain.com`）：**
```
Type: A
Name: @
Value: 76.76.21.21
```

**Subdomain（如 `app.yourdomain.com`）：**
```
Type: CNAME
Name: app
Value: cname.vercel-dns.com
```

### 3.3 等待 DNS 傳播

- 通常需要 5-30 分鐘
- 可用 `dig app.yourdomain.com` 驗證
- Vercel 會自動頒發 SSL 憑證（Let's Encrypt）

---

## Step 4：設定 GitHub Secrets（CI/CD）

喺 GitHub Repository > Settings > Secrets and variables > Actions 新增：

| Secret 名稱 | 說明 |
|------------|------|
| `VERCEL_TOKEN` | Vercel API Token（Vercel Dashboard > Settings > Tokens） |
| `VERCEL_ORG_ID` | Vercel Org/User ID（`vercel env pull` 可取得） |
| `VERCEL_PROJECT_ID` | Vercel Project ID（`.vercel/project.json` 或 dashboard） |
| `NEXT_PUBLIC_APP_URL` | Production URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL（供 build 使用） |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Publishable Key |

### 取得 Vercel Project ID 和 Org ID

```bash
# 安裝 Vercel CLI
npm i -g vercel

# 在 clientspace 目錄執行
cd /path/to/clientspace
vercel link

# 查看 .vercel/project.json
cat .vercel/project.json
# {
#   "orgId": "team_xxxx",
#   "projectId": "prj_xxxx"
# }
```

---

## Step 5：配置 Stripe Webhook

Production webhook URL：`https://app.yourdomain.com/api/stripe/webhooks`

詳細設定步驟請參考：[Stripe Webhook 設定指引](./stripe-webhook-setup.md)

---

## Step 6：執行 Database Migration

```bash
# 確保已安裝 Supabase CLI
npm install -g supabase

# 設定環境變數
export SUPABASE_DB_URL="postgresql://postgres:[password]@[host]:5432/postgres"

# 執行 migration
cd /path/to/clientspace
chmod +x scripts/migrate-production.sh
./scripts/migrate-production.sh
```

---

## Step 7：驗證部署

### 7.1 健康檢查

```bash
curl https://app.yourdomain.com/api/health
```

預期回應：
```json
{
  "status": "ok",
  "timestamp": "2026-03-20T00:00:00.000Z",
  "version": "0.1.0",
  "environment": "production",
  "checks": {
    "database": "ok",
    "stripe": "ok",
    "email": "ok"
  }
}
```

### 7.2 功能驗證清單

- [ ] 主頁 (`/`) 正常顯示
- [ ] 定價頁 (`/pricing`) 正常顯示
- [ ] 登入 (`/login`) 和 註冊 (`/signup`) 功能正常
- [ ] Auth 回調 (`/auth/callback`) 正常
- [ ] Dashboard (`/dashboard/projects`) 需要登入後可訪問
- [ ] Stripe Checkout 可正常啟動
- [ ] Stripe Webhook 可接收（用 Stripe CLI 測試）
- [ ] 電子郵件通知可正常發送

### 7.3 SSL 驗證

```bash
# 確認 SSL 憑證
curl -I https://app.yourdomain.com
# 應顯示 HTTP/2 200
```

---

## 部署架構

```
GitHub (main branch)
    │
    ├─ Push → CI/CD (.github/workflows/ci.yml)
    │         - TypeScript check
    │         - Lint
    │         - Tests
    │         - Build check
    │
    └─ Pass → Deploy (.github/workflows/deploy.yml)
              - Vercel production deploy
              - Health check (30s delay)
```

### Vercel 配置（vercel.json）

- **Regions:** `hkg1`（Hong Kong）、`sin1`（Singapore）— 針對亞太地區優化
- **Stripe Webhook timeout:** 30s
- **Invoice PDF timeout:** 30s
- **Security headers:** X-Content-Type-Options、X-Frame-Options、X-XSS-Protection

---

## 常見問題

### Build 失敗：缺少環境變數

```
Error: NEXT_PUBLIC_SUPABASE_URL is not defined
```

**解決：** 確認所有環境變數已在 Vercel 設定，且 scope 包含 Production。

### Stripe Webhook 收不到事件

1. 確認 webhook URL 正確：`https://app.yourdomain.com/api/stripe/webhooks`
2. 確認 `STRIPE_WEBHOOK_SECRET` 是 **live** webhook 的 secret（不是 test 的）
3. 確認 webhook 已啟用正確的 events（見 stripe-webhook-setup.md）

### Auth 回調失敗

確認 Supabase Dashboard > Authentication > URL Configuration 已加入：
- Site URL: `https://app.yourdomain.com`
- Redirect URLs: `https://app.yourdomain.com/auth/callback`

---

## 相關文件

- [Stripe Webhook 設定指引](./stripe-webhook-setup.md)
- [Resend 域名驗證](./resend-domain-verification.md)
- [環境變數範例](./.env.example)
- [Production Migration Script](../scripts/migrate-production.sh)
