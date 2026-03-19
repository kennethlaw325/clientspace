/**
 * Invoice 流程端到端測試
 * 測試 createInvoice、sendInvoice（含 Stripe payment link）、
 * markInvoicePaid、deleteInvoice server actions
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock next/navigation ──────────────────────────────────────────────────
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

// ─── Mock next/cache ───────────────────────────────────────────────────────
const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

// ─── Mock next/headers ────────────────────────────────────────────────────
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: vi.fn().mockReturnValue([]),
    set: vi.fn(),
  }),
}));

// ─── Supabase query builder mock 工廠 ─────────────────────────────────────
function makeQueryBuilder(result: unknown) {
  const builder: Record<string, unknown> = {};
  const methods = [
    "select", "eq", "is", "order", "insert", "update", "delete",
    "single", "limit", "gte", "lte", "head",
  ];
  methods.forEach((m) => {
    builder[m] = vi.fn().mockReturnValue(builder);
  });
  builder.then = (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve);
  return builder;
}

const mockWorkspace = { id: "ws-1", name: "Test Workspace", plan: "pro", owner_id: "user-123" };
const mockUser = { id: "user-123" };

const mockSupabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
  },
  from: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}));

// ─── Mock admin client ─────────────────────────────────────────────────────
const mockAdminSupabase = {
  from: vi.fn(),
  auth: {
    admin: {
      getUserById: vi.fn().mockResolvedValue({
        data: { user: { email: "owner@test.com" } },
      }),
    },
  },
};

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn().mockReturnValue(mockAdminSupabase),
}));

// ─── Mock getWorkspace ─────────────────────────────────────────────────────
vi.mock("@/lib/actions/workspaces", () => ({
  getWorkspace: vi.fn().mockResolvedValue(mockWorkspace),
}));

// ─── Mock Stripe ───────────────────────────────────────────────────────────
const mockStripe = {
  paymentLinks: {
    create: vi.fn().mockResolvedValue({ url: "https://buy.stripe.com/test_link" }),
  },
};

vi.mock("@/lib/stripe", () => ({
  getStripe: vi.fn().mockReturnValue(mockStripe),
}));

// ─── Mock notifications ────────────────────────────────────────────────────
vi.mock("@/lib/notifications", () => ({
  sendInvoiceSentEmail: vi.fn().mockResolvedValue(undefined),
  sendPaymentReceivedEmail: vi.fn().mockResolvedValue(undefined),
  sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/email", () => ({
  sendNotification: vi.fn().mockResolvedValue(undefined),
}));

const {
  createInvoice,
  sendInvoice,
  deleteInvoice,
  markInvoicePaid,
} = await import("@/lib/actions/invoices");

// ─── Helpers ──────────────────────────────────────────────────────────────
function makeInvoiceFormData(overrides: Record<string, string> = {}) {
  const fd = new FormData();
  fd.set("client_id", overrides.client_id ?? "c-1");
  fd.set("project_id", overrides.project_id ?? "p-1");
  fd.set("due_date", overrides.due_date ?? "2026-04-30");
  fd.set("tax_rate", overrides.tax_rate ?? "0");
  fd.set("notes", overrides.notes ?? "");
  fd.set(
    "items",
    overrides.items ??
      JSON.stringify([
        { description: "Design work", quantity: 1, unit_price: 500, sort_order: 0 },
      ])
  );
  return fd;
}

describe("createInvoice", () => {
  beforeEach(() => vi.clearAllMocks());

  it("缺少 client_id 時返回錯誤", async () => {
    const fd = makeInvoiceFormData({ client_id: "" });
    const result = await createInvoice(fd);
    expect(result).toEqual({ error: "Client is required" });
  });

  it("items 為空陣列時返回錯誤", async () => {
    const fd = makeInvoiceFormData({ items: JSON.stringify([]) });
    const result = await createInvoice(fd);
    expect(result).toEqual({ error: "At least one line item is required" });
  });

  it("無效 JSON items 時返回錯誤", async () => {
    const fd = makeInvoiceFormData({ items: "not-json" });
    const result = await createInvoice(fd);
    expect(result).toEqual({ error: "Invalid line items" });
  });

  it("成功建立 invoice", async () => {
    const newInvoice = {
      id: "inv-1",
      invoice_number: "INV-0001",
      total_amount: 500,
    };

    // nextInvoiceNumber 用 admin client
    const countBuilder = makeQueryBuilder({ count: 0, data: null });
    mockAdminSupabase.from.mockReturnValueOnce(countBuilder);

    // insert invoice
    const insertInvoiceBuilder = makeQueryBuilder({ data: newInvoice, error: null });
    mockSupabase.from.mockReturnValueOnce(insertInvoiceBuilder);

    // insert invoice_items
    const insertItemsBuilder = makeQueryBuilder({ data: [], error: null });
    mockSupabase.from.mockReturnValueOnce(insertItemsBuilder);

    const fd = makeInvoiceFormData();
    const result = await createInvoice(fd);

    expect(result).toEqual({ data: newInvoice });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/invoices");
  });

  it("Supabase 錯誤時返回 error", async () => {
    const countBuilder = makeQueryBuilder({ count: 0 });
    mockAdminSupabase.from.mockReturnValueOnce(countBuilder);

    const insertBuilder = makeQueryBuilder({
      data: null,
      error: { message: "DB constraint error" },
    });
    mockSupabase.from.mockReturnValueOnce(insertBuilder);

    const fd = makeInvoiceFormData();
    const result = await createInvoice(fd);
    expect(result).toEqual({ error: "DB constraint error" });
  });
});

describe("sendInvoice（Stripe payment link 生成）", () => {
  beforeEach(() => vi.clearAllMocks());

  const mockInvoice = {
    id: "inv-1",
    invoice_number: "INV-0001",
    total_amount: 500,
    status: "draft",
    stripe_payment_link: null,
    due_date: "2026-04-30",
    clients: { name: "Alice", email: "alice@example.com", company: "Acme" },
    projects: { name: "Logo Design" },
    invoice_items: [],
  };

  it("無 workspace 時返回錯誤", async () => {
    const { getWorkspace } = await import("@/lib/actions/workspaces");
    vi.mocked(getWorkspace).mockResolvedValueOnce(null);

    const result = await sendInvoice("inv-1");
    expect(result).toEqual({ error: "No workspace found" });
  });

  it("成功發送 invoice 並建立 Stripe payment link", async () => {
    // getInvoice → select from invoices
    const invoiceBuilder = makeQueryBuilder({ data: mockInvoice });
    mockSupabase.from.mockReturnValueOnce(invoiceBuilder);

    // update stripe_payment_link + status
    const updateBuilder = makeQueryBuilder({ error: null });
    mockSupabase.from.mockReturnValueOnce(updateBuilder);

    const result = await sendInvoice("inv-1");
    expect(result).toEqual({ success: true });

    // 確認 Stripe 被呼叫
    expect(mockStripe.paymentLinks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ invoice_id: "inv-1" }),
      })
    );

    // 確認 email 被發送
    const { sendInvoiceSentEmail } = await import("@/lib/notifications");
    expect(sendInvoiceSentEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "alice@example.com",
        invoiceNumber: "INV-0001",
        paymentLink: "https://buy.stripe.com/test_link",
      })
    );
  });

  it("已有 payment link 時不重新建立 Stripe link", async () => {
    const invoiceWithLink = {
      ...mockInvoice,
      stripe_payment_link: "https://buy.stripe.com/existing",
    };
    const invoiceBuilder = makeQueryBuilder({ data: invoiceWithLink });
    mockSupabase.from.mockReturnValueOnce(invoiceBuilder);

    const updateBuilder = makeQueryBuilder({ error: null });
    mockSupabase.from.mockReturnValueOnce(updateBuilder);

    await sendInvoice("inv-1");

    // Stripe 不應被呼叫
    expect(mockStripe.paymentLinks.create).not.toHaveBeenCalled();
  });
});

describe("markInvoicePaid", () => {
  beforeEach(() => vi.clearAllMocks());

  it("成功標記為已付款", async () => {
    const updateBuilder = makeQueryBuilder({ error: null });
    mockAdminSupabase.from.mockReturnValueOnce(updateBuilder);

    // 通知相關查詢
    const invoiceSelectBuilder = makeQueryBuilder({
      data: {
        invoice_number: "INV-0001",
        total_amount: 500,
        clients: { name: "Alice" },
        projects: { name: "Logo" },
        workspaces: { name: "My WS", owner_id: "user-123" },
      },
    });
    mockAdminSupabase.from.mockReturnValueOnce(invoiceSelectBuilder);

    const result = await markInvoicePaid("inv-1");
    expect(result).toEqual({ success: true });
  });
});

describe("deleteInvoice", () => {
  beforeEach(() => vi.clearAllMocks());

  it("成功刪除 invoice", async () => {
    const deleteBuilder = makeQueryBuilder({ error: null });
    mockSupabase.from.mockReturnValueOnce(deleteBuilder);

    const result = await deleteInvoice("inv-1");
    expect(result).toEqual({ success: true });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/invoices");
  });
});
