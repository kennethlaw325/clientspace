/**
 * Email notification 端到端測試
 * 測試 sendInvoiceSentEmail、sendWelcomeEmail 等函數
 * 使用 mock Resend API 驗證 email 觸發邏輯
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock React Email render ───────────────────────────────────────────────
vi.mock("@react-email/components", () => ({
  render: vi.fn().mockResolvedValue("<html>Mock Email HTML</html>"),
}));

// ─── Mock email template components ───────────────────────────────────────
vi.mock("@/components/emails/invoice-sent", () => ({
  InvoiceSentEmail: vi.fn().mockReturnValue(null),
}));
vi.mock("@/components/emails/payment-received", () => ({
  PaymentReceivedEmail: vi.fn().mockReturnValue(null),
}));
vi.mock("@/components/emails/welcome", () => ({
  WelcomeEmail: vi.fn().mockReturnValue(null),
}));
vi.mock("@/components/emails/deliverable-approved", () => ({
  DeliverableApprovedEmail: vi.fn().mockReturnValue(null),
}));
vi.mock("@/components/emails/revision-requested", () => ({
  RevisionRequestedEmail: vi.fn().mockReturnValue(null),
}));
vi.mock("@/components/emails/review-requested", () => ({
  ReviewRequestedEmail: vi.fn().mockReturnValue(null),
}));

// ─── Mock Resend ───────────────────────────────────────────────────────────
// 使用 vi.hoisted 確保 mock 在 hoisting 後仍可存取
const { mockEmailsSend } = vi.hoisted(() => {
  const mockEmailsSend = vi.fn().mockResolvedValue({ data: { id: "email-123" }, error: null });
  return { mockEmailsSend };
});

vi.mock("resend", () => ({
  Resend: class MockResend {
    emails = { send: mockEmailsSend };
  },
}));

// 設置 RESEND_API_KEY 環境變數
vi.stubEnv("RESEND_API_KEY", "re_test_key");
vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");

// ─── Mock Supabase admin（notification preferences）───────────────────────
const mockAdminSupabase = {
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    then: (resolve: (v: unknown) => unknown) =>
      Promise.resolve({ data: null }).then(resolve), // 預設通知偏好：未設定（= 開啟）
  }),
};

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn().mockReturnValue(mockAdminSupabase),
}));

const {
  sendInvoiceSentEmail,
  sendWelcomeEmail,
  sendDeliverableApprovedEmail,
  sendRevisionRequestedEmail,
} = await import("@/lib/notifications");

describe("sendInvoiceSentEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEmailsSend.mockResolvedValue({ data: { id: "email-123" }, error: null });
  });

  it("呼叫 Resend API 發送 invoice email", async () => {
    await sendInvoiceSentEmail({
      to: "client@example.com",
      recipientName: "Alice",
      workspaceName: "Acme Studio",
      invoiceNumber: "INV-0001",
      amount: "$500.00",
      paymentLink: "https://buy.stripe.com/test",
      dueDate: "2026-04-30",
    });

    expect(mockEmailsSend).toHaveBeenCalledOnce();
    const callArgs = mockEmailsSend.mock.calls[0][0];
    expect(callArgs.to).toBe("client@example.com");
    expect(callArgs.subject).toContain("INV-0001");
    expect(callArgs.from).toContain("Acme Studio");
  });

  it("不含 paymentLink 時仍能正常發送", async () => {
    await sendInvoiceSentEmail({
      to: "client@example.com",
      recipientName: "Bob",
      workspaceName: "My Studio",
      invoiceNumber: "INV-0002",
      amount: "$200.00",
    });

    expect(mockEmailsSend).toHaveBeenCalledOnce();
  });
});

describe("sendWelcomeEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEmailsSend.mockResolvedValue({ data: { id: "email-456" }, error: null });
  });

  it("呼叫 Resend API 發送 welcome email", async () => {
    await sendWelcomeEmail({
      to: "newuser@example.com",
      appUrl: "http://localhost:3000",
    });

    expect(mockEmailsSend).toHaveBeenCalledOnce();
    const callArgs = mockEmailsSend.mock.calls[0][0];
    expect(callArgs.to).toBe("newuser@example.com");
    expect(callArgs.subject).toBe("Welcome to ClientSpace");
    expect(callArgs.from).toContain("ClientSpace");
  });
});

describe("sendDeliverableApprovedEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEmailsSend.mockResolvedValue({ data: { id: "email-789" }, error: null });
  });

  it("通知偏好開啟時發送 email", async () => {
    // 預設通知偏好為 null（= 開啟），見上方 mock
    await sendDeliverableApprovedEmail({
      userId: "user-123",
      to: "freelancer@example.com",
      recipientName: "John",
      workspaceName: "JD Studio",
      reviewTitle: "Homepage Design v2",
      projectName: "Client Website",
      clientName: "Alice Corp",
      reviewUrl: "http://localhost:3000/reviews/tok-123",
    });

    expect(mockEmailsSend).toHaveBeenCalledOnce();
    const callArgs = mockEmailsSend.mock.calls[0][0];
    expect(callArgs.to).toBe("freelancer@example.com");
  });

  it("通知偏好關閉時不發送 email", async () => {
    // 設定通知偏好為關閉
    mockAdminSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      then: (resolve: (v: unknown) => unknown) =>
        Promise.resolve({ data: { email_enabled: false } }).then(resolve),
    });

    await sendDeliverableApprovedEmail({
      userId: "user-123",
      to: "freelancer@example.com",
      recipientName: "John",
      workspaceName: "JD Studio",
      reviewTitle: "Homepage",
      projectName: "Website",
      clientName: "Alice",
      reviewUrl: "http://localhost:3000/reviews/tok-123",
    });

    expect(mockEmailsSend).not.toHaveBeenCalled();
  });
});

describe("sendRevisionRequestedEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEmailsSend.mockResolvedValue({ data: { id: "email-rev" }, error: null });
  });

  it("成功發送 revision requested email", async () => {
    await sendRevisionRequestedEmail({
      userId: "user-123",
      to: "freelancer@example.com",
      recipientName: "John",
      workspaceName: "JD Studio",
      reviewTitle: "Logo Design",
      projectName: "Branding",
      clientName: "Bob Corp",
      reviewUrl: "http://localhost:3000/reviews/tok-456",
      clientComment: "Please change the color to blue",
    });

    expect(mockEmailsSend).toHaveBeenCalledOnce();
    const callArgs = mockEmailsSend.mock.calls[0][0];
    expect(callArgs.to).toBe("freelancer@example.com");
  });
});

describe("RESEND_API_KEY 未設定時拋出錯誤", () => {
  it("呼叫 getResend() 時拋出錯誤", async () => {
    vi.unstubAllEnvs();
    // 重新 import 以觸發新的 env 狀態
    vi.resetModules();
    vi.stubEnv("RESEND_API_KEY", "");

    // 嘗試調用任意 email 函數，預期拋出錯誤
    const { sendWelcomeEmail: freshSendWelcome } = await import("@/lib/notifications");
    await expect(
      freshSendWelcome({ to: "test@test.com", appUrl: "http://localhost:3000" })
    ).rejects.toThrow("RESEND_API_KEY is not set");

    // 恢復設定
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
  });
});
