# ClientSpace Agent 指引

## 每次 Heartbeat 開始前
1. **先 pull 最新 code**：`git pull origin main`
2. 檢查有冇 merge conflict，有就解決先再繼續

## 專案背景
- ClientSpace 係一個簡單嘅 client portal，畀 freelancer 用嚟同客戶分享檔案、追蹤進度、管理修改、收款
- Tech stack: Next.js 15 + TypeScript + Tailwind + ShadCN UI + Supabase + Stripe

## 語言規範
- 所有 plan、task description、comment、commit message 用**繁體中文**
- Code、variable names、technical identifiers 用英文
- Commit message 格式：`<type>: <繁體中文描述>`（例如 `feat: 新增客戶檔案上傳功能`）

## 開發規範
- 用 `npm` 做 package manager（唔係 pnpm）
- 跑 `npm run dev` 啟動 dev server（port 3000）
- 改完 code 記得 commit 同 push
- 唔好改 `.env` 或者 credentials 相關嘅檔案
