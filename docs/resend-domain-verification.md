# Resend Domain Verification 步驟文檔

## 概覽

ClientSpace 使用 Resend 發送交易型電子郵件（邀請通知、發票等）。生產環境需要驗證自定義域名，確保郵件送達率。

## 前置條件

- 擁有一個已購買的域名（例如 `clientspace.app`）
- 能訪問域名的 DNS 設定（Cloudflare、Namecheap 等）
- Resend 帳號

## 第一步：在 Resend 新增域名

1. 登入 [Resend Dashboard](https://resend.com/domains)
2. 點擊 **Add Domain**
3. 輸入你的域名（例如 `clientspace.app`）
4. 選擇 DNS Provider（或選 Other）
5. 點擊 **Add**

## 第二步：新增 DNS 記錄

Resend 會提供以下需要新增的 DNS 記錄：

### SPF 記錄
```
類型: TXT
名稱: @（或你的域名）
值: v=spf1 include:amazonses.com ~all
```

### DKIM 記錄（通常有 3 條）
```
類型: CNAME
名稱: resend._domainkey
值: [Resend 提供的 CNAME 值]
```

### DMARC 記錄（建議新增）
```
類型: TXT
名稱: _dmarc
值: v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
```

## 第三步：在各 DNS 提供商新增記錄

### Cloudflare
1. 登入 Cloudflare Dashboard
2. 選擇域名 → **DNS** → **Records**
3. 點擊 **Add record**，逐條新增上方記錄
4. **重要**：CNAME 記錄的 Proxy status 設為 **DNS only**（灰色雲朵）

### Namecheap
1. 登入 Namecheap → **Domain List**
2. 點擊域名的 **Manage** → **Advanced DNS**
3. 在 **Host Records** 新增對應記錄

### Google Domains / Squarespace
1. 進入 DNS 管理頁面
2. 在 Custom records 新增各條記錄

## 第四步：等待驗證

- DNS 傳播通常需要 **5–30 分鐘**，最長可達 48 小時
- 返回 Resend Dashboard，點擊 **Verify DNS Records**
- 看到所有記錄旁出現綠色勾號即為成功

## 第五步：設定發件人地址

驗證完成後，在 `.env.local` 設定：

```env
RESEND_API_KEY=re_your-api-key
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME=ClientSpace
```

## 第六步：取得 API Key

1. Resend Dashboard → **API Keys**
2. 點擊 **Create API Key**
3. 命名（例如 `clientspace-production`），選擇 **Full access**
4. 複製 key（只顯示一次）
5. 在 Vercel 設定：
   ```bash
   vercel env add RESEND_API_KEY
   vercel env add RESEND_FROM_EMAIL
   vercel env add RESEND_FROM_NAME
   ```

## 測試郵件發送

部署後可用以下方式測試：
- 邀請一個客戶查看 portal
- 生成並下載發票
- 查看 Resend Dashboard → **Emails** 確認送達狀態

## 常見問題

| 問題 | 解決方法 |
|------|---------|
| 記錄驗證失敗 | 確認 CNAME Proxy 已關閉（Cloudflare 灰色雲朵）|
| 郵件進垃圾桶 | 確認 DMARC 記錄已新增 |
| API 報錯 403 | 確認 API Key 有 Send 權限 |
| 域名未驗證 | 等待 DNS 傳播，最長 48 小時 |
