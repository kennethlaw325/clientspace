/**
 * Deliverable 審批流程端到端測試
 * 測試 createReview、updateReviewStatusByToken（approve/revision_requested）、
 * addReviewComment、generateReviewToken server actions
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

const mockUser = { id: "user-123" };

const mockSupabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
  },
  from: vi.fn(),
  storage: {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: null }),
      createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: "https://signed.url" } }),
    }),
  },
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
        data: { user: { email: "freelancer@test.com" } },
      }),
    },
  },
};

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn().mockReturnValue(mockAdminSupabase),
}));

// ─── Mock email ────────────────────────────────────────────────────────────
vi.mock("@/lib/email", () => ({
  sendReviewNotification: vi.fn().mockResolvedValue(undefined),
  sendNotification: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/notifications", () => ({
  sendDeliverableApprovedEmail: vi.fn().mockResolvedValue(undefined),
  sendRevisionRequestedEmail: vi.fn().mockResolvedValue(undefined),
  sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
}));

const {
  createReview,
  updateReviewStatusByToken,
  addReviewComment,
  generateReviewToken,
} = await import("@/lib/actions/reviews");

describe("createReview", () => {
  beforeEach(() => vi.clearAllMocks());

  it("未登入時返回錯誤", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });

    const fd = new FormData();
    fd.set("title", "Homepage design");

    const result = await createReview("proj-1", fd);
    expect(result).toEqual({ error: "未登入" });
  });

  it("缺少 title 時返回錯誤", async () => {
    const fd = new FormData();
    fd.set("title", "  ");

    const result = await createReview("proj-1", fd);
    expect(result).toEqual({ error: "標題為必填" });
  });

  it("成功建立 review 並生成 token", async () => {
    const newReview = { id: "rev-1", title: "Homepage design", project_id: "proj-1" };

    const insertReviewBuilder = makeQueryBuilder({ data: newReview, error: null });
    const tokenSelectBuilder = makeQueryBuilder({ data: null }); // 無現有 token
    const tokenInsertBuilder = makeQueryBuilder({ data: { token: "tok-abc123" } });

    mockSupabase.from
      .mockReturnValueOnce(insertReviewBuilder)
      .mockReturnValueOnce(tokenSelectBuilder)
      .mockReturnValueOnce(tokenInsertBuilder);

    const fd = new FormData();
    fd.set("title", "Homepage design");
    fd.set("description", "Check the homepage");

    const result = await createReview("proj-1", fd);
    expect(result).toEqual({
      data: newReview,
      token: "tok-abc123",
    });
  });
});

describe("generateReviewToken", () => {
  beforeEach(() => vi.clearAllMocks());

  it("已有 token 時直接返回現有 token", async () => {
    const existingTokenBuilder = makeQueryBuilder({ data: { token: "existing-token" } });
    mockSupabase.from.mockReturnValueOnce(existingTokenBuilder);

    const result = await generateReviewToken("rev-1");
    expect(result).toEqual({ token: "existing-token" });
  });

  it("無 token 時建立新 token", async () => {
    const noTokenBuilder = makeQueryBuilder({ data: null });
    const insertTokenBuilder = makeQueryBuilder({ data: { token: "new-token-xyz" } });

    mockSupabase.from
      .mockReturnValueOnce(noTokenBuilder)
      .mockReturnValueOnce(insertTokenBuilder);

    const result = await generateReviewToken("rev-1");
    expect(result).toEqual({ token: "new-token-xyz" });
  });
});

describe("updateReviewStatusByToken（客戶 approve / revision_requested）", () => {
  beforeEach(() => vi.clearAllMocks());

  it("無效 token 時返回錯誤", async () => {
    const tokenBuilder = makeQueryBuilder({ data: null });
    mockAdminSupabase.from.mockReturnValueOnce(tokenBuilder);

    const result = await updateReviewStatusByToken("invalid-token", "approved", "", "Alice");
    expect(result).toEqual({ error: "無效的連結" });
  });

  it("過期 token 時返回錯誤", async () => {
    const expiredToken = {
      review_id: "rev-1",
      expires_at: "2020-01-01T00:00:00Z", // 已過期
    };
    const tokenBuilder = makeQueryBuilder({ data: expiredToken });
    mockAdminSupabase.from.mockReturnValueOnce(tokenBuilder);

    const result = await updateReviewStatusByToken("expired-token", "approved", "", "Alice");
    expect(result).toEqual({ error: "連結已過期" });
  });

  it("成功批核（approved）並觸發 email 通知", async () => {
    const validToken = { review_id: "rev-1", expires_at: null };
    const tokenBuilder = makeQueryBuilder({ data: validToken });
    const updateBuilder = makeQueryBuilder({ error: null });
    const commentBuilder = makeQueryBuilder({ error: null });
    const reviewSelectBuilder = makeQueryBuilder({
      data: {
        title: "Homepage",
        project: {
          name: "Web Project",
          workspace: { name: "My WS", owner_id: "user-123" },
          client: { name: "Alice", email: "alice@example.com", portal_token: "tok-portal" },
        },
      },
    });

    mockAdminSupabase.from
      .mockReturnValueOnce(tokenBuilder)
      .mockReturnValueOnce(updateBuilder)
      .mockReturnValueOnce(commentBuilder)
      .mockReturnValueOnce(reviewSelectBuilder);

    const result = await updateReviewStatusByToken(
      "valid-token",
      "approved",
      "Looks great!",
      "Alice"
    );
    expect(result).toEqual({ success: true });

    const { sendDeliverableApprovedEmail } = await import("@/lib/notifications");
    expect(sendDeliverableApprovedEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        clientName: "Alice",
      })
    );
  });

  it("成功請求修改（revision_requested）並觸發 email 通知", async () => {
    const validToken = { review_id: "rev-1", expires_at: null };
    const tokenBuilder = makeQueryBuilder({ data: validToken });
    const updateBuilder = makeQueryBuilder({ error: null });
    const commentBuilder = makeQueryBuilder({ error: null });
    const reviewSelectBuilder = makeQueryBuilder({
      data: {
        title: "Logo",
        project: {
          name: "Branding",
          workspace: { name: "My WS", owner_id: "user-123" },
          client: { name: "Bob" },
        },
      },
    });

    mockAdminSupabase.from
      .mockReturnValueOnce(tokenBuilder)
      .mockReturnValueOnce(updateBuilder)
      .mockReturnValueOnce(commentBuilder)
      .mockReturnValueOnce(reviewSelectBuilder);

    const result = await updateReviewStatusByToken(
      "valid-token",
      "revision_requested",
      "Please change the color",
      "Bob"
    );
    expect(result).toEqual({ success: true });

    const { sendRevisionRequestedEmail } = await import("@/lib/notifications");
    expect(sendRevisionRequestedEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        clientComment: "Please change the color",
      })
    );
  });
});

describe("addReviewComment", () => {
  beforeEach(() => vi.clearAllMocks());

  it("未登入時返回錯誤", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });

    const result = await addReviewComment("rev-1", "Great work!", "Freelancer");
    expect(result).toEqual({ error: "未登入" });
  });

  it("空評論時返回錯誤", async () => {
    const result = await addReviewComment("rev-1", "  ", "Freelancer");
    expect(result).toEqual({ error: "評論不能為空" });
  });

  it("成功新增評論", async () => {
    const newComment = { id: "cmt-1", body: "Great work!", author_type: "freelancer" };
    const insertBuilder = makeQueryBuilder({ data: newComment, error: null });
    mockSupabase.from.mockReturnValueOnce(insertBuilder);

    const result = await addReviewComment("rev-1", "Great work!", "Freelancer");
    expect(result).toEqual({ data: newComment });
  });
});
