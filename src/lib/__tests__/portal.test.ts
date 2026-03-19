/**
 * Portal access 端到端測試
 * 測試 token-based 客戶入口存取驗證
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
  const methods = [
    "select", "eq", "is", "order", "insert", "update", "delete",
    "single", "limit", "gte", "lte",
  ];
  methods.forEach((m) => {
    builder[m] = vi.fn().mockReturnValue(builder);
  });
  builder.then = (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve);
  return builder;
}

// ─── Mock Supabase admin client ───────────────────────────────────────────
const mockAdminSupabase = {
  from: vi.fn(),
  storage: {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: null }),
      createSignedUrl: vi.fn().mockResolvedValue({
        data: { signedUrl: "https://storage.example.com/file.pdf" },
      }),
    }),
  },
};

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn().mockReturnValue(mockAdminSupabase),
}));

vi.mock("@/lib/email", () => ({
  sendNotification: vi.fn().mockResolvedValue(undefined),
  sendReviewNotification: vi.fn().mockResolvedValue(undefined),
}));

const { portalUploadFile, portalSendMessage } = await import("@/lib/actions/portal");

describe("portalUploadFile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("無效 token 時返回 error", async () => {
    const clientBuilder = makeQueryBuilder({ data: null });
    mockAdminSupabase.from.mockReturnValueOnce(clientBuilder);

    const formData = new FormData();
    const file = new File(["content"], "test.pdf", { type: "application/pdf" });
    formData.set("file", file);

    const result = await portalUploadFile("invalid-token", "proj-1", formData);
    expect(result).toEqual({ error: "Invalid portal access" });
  });

  it("project 不屬於此 client 時返回 error", async () => {
    const clientBuilder = makeQueryBuilder({
      data: { id: "c-1", workspace_id: { id: "ws-1" } },
    });
    const projectBuilder = makeQueryBuilder({ data: null });
    mockAdminSupabase.from
      .mockReturnValueOnce(clientBuilder)
      .mockReturnValueOnce(projectBuilder);

    const formData = new FormData();
    const file = new File(["content"], "test.pdf", { type: "application/pdf" });
    formData.set("file", file);

    const result = await portalUploadFile("valid-token", "wrong-proj", formData);
    expect(result).toEqual({ error: "Project not found or access denied" });
  });

  it("無 file 時返回 error", async () => {
    const clientBuilder = makeQueryBuilder({
      data: { id: "c-1", workspace_id: { id: "ws-1" } },
    });
    const projectBuilder = makeQueryBuilder({ data: { id: "proj-1" } });
    mockAdminSupabase.from
      .mockReturnValueOnce(clientBuilder)
      .mockReturnValueOnce(projectBuilder);

    const formData = new FormData();
    // 不設定 file

    const result = await portalUploadFile("valid-token", "proj-1", formData);
    expect(result).toEqual({ error: "No file selected" });
  });

  it("檔案超過 50MB 時返回 error", async () => {
    const clientBuilder = makeQueryBuilder({
      data: { id: "c-1", workspace_id: { id: "ws-1" } },
    });
    const projectBuilder = makeQueryBuilder({ data: { id: "proj-1" } });
    mockAdminSupabase.from
      .mockReturnValueOnce(clientBuilder)
      .mockReturnValueOnce(projectBuilder);

    // 建立一個 size > 50MB 的假 File
    const largeFile = new File(["x"], "big.pdf", { type: "application/pdf" });
    Object.defineProperty(largeFile, "size", { value: 60 * 1024 * 1024 });

    const formData = new FormData();
    formData.set("file", largeFile);

    const result = await portalUploadFile("valid-token", "proj-1", formData);
    expect(result).toEqual({ error: "File must be under 50MB" });
  });

  it("有效 token 及 project 時成功上傳", async () => {
    const clientBuilder = makeQueryBuilder({
      data: { id: "c-1", workspace_id: { id: "ws-1" } },
    });
    const projectBuilder = makeQueryBuilder({ data: { id: "proj-1" } });
    const insertBuilder = makeQueryBuilder({ error: null });
    mockAdminSupabase.from
      .mockReturnValueOnce(clientBuilder)
      .mockReturnValueOnce(projectBuilder)
      .mockReturnValueOnce(insertBuilder);

    const file = new File(["content"], "design.pdf", { type: "application/pdf" });
    const formData = new FormData();
    formData.set("file", file);

    const result = await portalUploadFile("valid-token", "proj-1", formData);
    expect(result).toEqual({ success: true });
  });
});

describe("portalSendMessage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("無效 token 時返回 error", async () => {
    const clientBuilder = makeQueryBuilder({ data: null });
    mockAdminSupabase.from.mockReturnValueOnce(clientBuilder);

    const formData = new FormData();
    formData.set("content", "Hello!");

    const result = await portalSendMessage("invalid-token", "proj-1", formData);
    expect(result).toEqual({ error: "Invalid portal access" });
  });

  it("成功傳送訊息", async () => {
    const clientBuilder = makeQueryBuilder({ data: { id: "c-1" } });
    const projectBuilder = makeQueryBuilder({ data: { id: "proj-1" } });
    const insertBuilder = makeQueryBuilder({ error: null });

    mockAdminSupabase.from
      .mockReturnValueOnce(clientBuilder)
      .mockReturnValueOnce(projectBuilder)
      .mockReturnValueOnce(insertBuilder);

    const formData = new FormData();
    formData.set("content", "Hello from client!");

    const result = await portalSendMessage("valid-token", "proj-1", formData);
    expect(result).toEqual({ success: true });
  });
});
