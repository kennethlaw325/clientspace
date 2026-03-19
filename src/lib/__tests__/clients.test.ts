/**
 * Client CRUD 端到端測試
 * 測試 createClientAction、updateClient、deleteClient、
 * archiveClient、unarchiveClient server actions
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock next/navigation ──────────────────────────────────────────────────
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

// ─── Mock next/cache ───────────────────────────────────────────────────────
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
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
  const methods = ["select", "eq", "is", "order", "insert", "update", "delete", "single", "limit"];
  methods.forEach((m) => {
    builder[m] = vi.fn().mockReturnValue(builder);
  });
  // 讓最後 await 解析成 result
  builder.then = (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve);
  return builder;
}

const mockUser = { id: "user-123", email: "freelancer@test.com" };
const mockWorkspace = {
  id: "ws-1",
  name: "Test Workspace",
  slug: "test-workspace",
  logo_url: null,
  brand_color: "#6366f1",
  plan: "pro" as const,
  owner_id: "user-123",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockSupabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
  },
  from: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}));

// ─── Mock activity logging ─────────────────────────────────────────────────
vi.mock("@/lib/actions/activity", () => ({
  logActivity: vi.fn().mockResolvedValue(undefined),
}));

// ─── Mock getWorkspace ─────────────────────────────────────────────────────
vi.mock("@/lib/actions/workspaces", () => ({
  getWorkspace: vi.fn().mockResolvedValue(mockWorkspace),
}));

const {
  createClientAction,
  updateClient,
  deleteClient,
  archiveClient,
  unarchiveClient,
} = await import("@/lib/actions/clients");

describe("createClientAction", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // 預設 workspace 存在
    const { getWorkspace } = await import("@/lib/actions/workspaces");
    vi.mocked(getWorkspace).mockResolvedValue(mockWorkspace);
  });

  it("缺少 name/email 時返回錯誤", async () => {
    const formData = new FormData();
    formData.set("name", "");
    formData.set("email", "");

    const result = await createClientAction(formData);
    expect(result).toEqual({ error: "Name and email are required" });
  });

  it("無 workspace 時返回錯誤", async () => {
    const { getWorkspace } = await import("@/lib/actions/workspaces");
    vi.mocked(getWorkspace).mockResolvedValueOnce(null);

    const formData = new FormData();
    formData.set("name", "Alice");
    formData.set("email", "alice@example.com");

    const result = await createClientAction(formData);
    expect(result).toEqual({ error: "No workspace found" });
  });

  it("超出 plan 限制時返回錯誤", async () => {
    // free plan 限制 2 個 clients，模擬已有 2 個
    const { getWorkspace } = await import("@/lib/actions/workspaces");
    vi.mocked(getWorkspace).mockResolvedValueOnce({ ...mockWorkspace, plan: "free" });

    const countBuilder = makeQueryBuilder({ count: 2, data: null });
    mockSupabase.from.mockReturnValueOnce(countBuilder);

    const formData = new FormData();
    formData.set("name", "Bob");
    formData.set("email", "bob@example.com");

    const result = await createClientAction(formData);
    expect(result.error).toContain("free plan limit");
  });

  it("重複 email 時返回錯誤", async () => {
    // count = 0（未超限）
    const countBuilder = makeQueryBuilder({ count: 0, data: null });
    const insertBuilder = makeQueryBuilder({
      data: null,
      error: { code: "23505", message: "duplicate" },
    });
    mockSupabase.from
      .mockReturnValueOnce(countBuilder)
      .mockReturnValueOnce(insertBuilder);

    const formData = new FormData();
    formData.set("name", "Charlie");
    formData.set("email", "charlie@example.com");

    const result = await createClientAction(formData);
    expect(result).toEqual({ error: "A client with this email already exists" });
  });

  it("成功建立 client 並記錄 activity", async () => {
    const newClient = { id: "c-1", name: "Dave", email: "dave@example.com", company: "Acme" };
    const countBuilder = makeQueryBuilder({ count: 0, data: null });
    const insertBuilder = makeQueryBuilder({ data: newClient, error: null });

    mockSupabase.from
      .mockReturnValueOnce(countBuilder)
      .mockReturnValueOnce(insertBuilder);

    const formData = new FormData();
    formData.set("name", "Dave");
    formData.set("email", "dave@example.com");
    formData.set("company", "Acme");

    const result = await createClientAction(formData);
    expect(result).toEqual({ data: newClient });

    const { logActivity } = await import("@/lib/actions/activity");
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: "c-1",
        eventType: "client_created",
      })
    );
  });
});

describe("updateClient", () => {
  beforeEach(() => vi.clearAllMocks());

  it("成功更新 client", async () => {
    const updateBuilder = makeQueryBuilder({ error: null });
    mockSupabase.from.mockReturnValueOnce(updateBuilder);

    const formData = new FormData();
    formData.set("name", "Updated Name");
    formData.set("email", "updated@example.com");
    formData.set("company", "NewCo");

    const result = await updateClient("c-1", formData);
    expect(result).toEqual({ success: true });
  });

  it("Supabase 錯誤時返回 error", async () => {
    const updateBuilder = makeQueryBuilder({ error: { message: "update failed" } });
    mockSupabase.from.mockReturnValueOnce(updateBuilder);

    const formData = new FormData();
    formData.set("name", "Name");
    formData.set("email", "email@example.com");
    formData.set("company", "");

    const result = await updateClient("c-1", formData);
    expect(result).toEqual({ error: "update failed" });
  });
});

describe("deleteClient", () => {
  beforeEach(() => vi.clearAllMocks());

  it("成功刪除 client", async () => {
    const deleteBuilder = makeQueryBuilder({ error: null });
    mockSupabase.from.mockReturnValueOnce(deleteBuilder);

    const result = await deleteClient("c-1");
    expect(result).toEqual({ success: true });
  });

  it("刪除失敗時返回 error", async () => {
    const deleteBuilder = makeQueryBuilder({ error: { message: "delete failed" } });
    mockSupabase.from.mockReturnValueOnce(deleteBuilder);

    const result = await deleteClient("c-1");
    expect(result).toEqual({ error: "delete failed" });
  });
});

describe("archiveClient / unarchiveClient", () => {
  beforeEach(() => vi.clearAllMocks());

  it("成功 archive client", async () => {
    const selectBuilder = makeQueryBuilder({ data: { name: "Dave" } });
    const updateBuilder = makeQueryBuilder({ error: null });
    mockSupabase.from
      .mockReturnValueOnce(selectBuilder)
      .mockReturnValueOnce(updateBuilder)
      .mockReturnValueOnce(makeQueryBuilder({})); // logActivity 的 from call

    const result = await archiveClient("c-1");
    expect(result).toEqual({ success: true });
  });

  it("成功 unarchive client", async () => {
    const selectBuilder = makeQueryBuilder({ data: { name: "Dave" } });
    const updateBuilder = makeQueryBuilder({ error: null });
    mockSupabase.from
      .mockReturnValueOnce(selectBuilder)
      .mockReturnValueOnce(updateBuilder)
      .mockReturnValueOnce(makeQueryBuilder({}));

    const result = await unarchiveClient("c-1");
    expect(result).toEqual({ success: true });
  });
});
