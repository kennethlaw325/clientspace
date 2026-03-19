/**
 * Auth flow 端到端測試
 * 測試 signUp、signIn、signOut server actions
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock next/navigation ──────────────────────────────────────────────────
const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

// ─── Mock next/cache ───────────────────────────────────────────────────────
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// ─── Mock notifications ────────────────────────────────────────────────────
vi.mock("@/lib/notifications", () => ({
  sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
}));

// ─── Mock Supabase server client ───────────────────────────────────────────
const mockSupabase = {
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}));

// ─── Mock next/headers ────────────────────────────────────────────────────
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: vi.fn().mockReturnValue([]),
    set: vi.fn(),
  }),
}));

// 動態 import（避免 mock 時序問題）
const { signUp, signIn, signOut } = await import("@/lib/actions/auth");

describe("signUp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("缺少 email/password 時返回錯誤", async () => {
    const formData = new FormData();
    const result = await signUp(formData);
    expect(result).toEqual({ error: "Email and password are required" });
  });

  it("Supabase 返回錯誤時傳遞錯誤訊息", async () => {
    mockSupabase.auth.signUp.mockResolvedValue({
      error: { message: "User already registered" },
    });

    const formData = new FormData();
    formData.set("email", "test@example.com");
    formData.set("password", "password123");

    const result = await signUp(formData);
    expect(result).toEqual({ error: "User already registered" });
  });

  it("成功 signUp 返回 success 訊息", async () => {
    mockSupabase.auth.signUp.mockResolvedValue({ error: null });

    const formData = new FormData();
    formData.set("email", "new@example.com");
    formData.set("password", "password123");

    const result = await signUp(formData);
    expect(result).toEqual({ success: "Check your email to confirm your account" });
  });

  it("signUp 成功後呼叫 sendWelcomeEmail", async () => {
    mockSupabase.auth.signUp.mockResolvedValue({ error: null });

    const { sendWelcomeEmail } = await import("@/lib/notifications");
    const formData = new FormData();
    formData.set("email", "new@example.com");
    formData.set("password", "password123");

    await signUp(formData);
    expect(sendWelcomeEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "new@example.com" })
    );
  });
});

describe("signIn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("缺少 email/password 時返回錯誤", async () => {
    const formData = new FormData();
    const result = await signIn(formData);
    expect(result).toEqual({ error: "Email and password are required" });
  });

  it("憑證錯誤時返回錯誤", async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      error: { message: "Invalid login credentials" },
    });

    const formData = new FormData();
    formData.set("email", "test@example.com");
    formData.set("password", "wrongpassword");

    const result = await signIn(formData);
    expect(result).toEqual({ error: "Invalid login credentials" });
  });

  it("登入成功後 redirect 到 /projects", async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: null });

    const formData = new FormData();
    formData.set("email", "test@example.com");
    formData.set("password", "correctpassword");

    try {
      await signIn(formData);
    } catch {
      // redirect throws in test env
    }

    expect(mockRedirect).toHaveBeenCalledWith("/projects");
  });
});

describe("signOut", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("登出後 redirect 到 /login", async () => {
    mockSupabase.auth.signOut.mockResolvedValue({});

    try {
      await signOut();
    } catch {
      // redirect throws in test env
    }

    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });
});
