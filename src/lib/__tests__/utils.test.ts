import { describe, it, expect } from "vitest";
import { formatFileSize, generateSlug } from "../utils";

describe("formatFileSize", () => {
  it("formats bytes", () => {
    expect(formatFileSize(500)).toBe("500 B");
  });
  it("formats KB", () => {
    expect(formatFileSize(1536)).toBe("1.5 KB");
  });
  it("formats MB", () => {
    expect(formatFileSize(2621440)).toBe("2.5 MB");
  });
});

describe("generateSlug", () => {
  it("converts to lowercase kebab-case", () => {
    expect(generateSlug("My Cool Agency")).toBe("my-cool-agency");
  });
  it("strips special characters", () => {
    expect(generateSlug("Test & Co.")).toBe("test-co");
  });
});
