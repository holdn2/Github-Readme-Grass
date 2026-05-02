import { describe, expect, test } from "vitest";
import { validateGithubUsername } from "../validation/username";

describe("validateGithubUsername", () => {
  test("accepts valid GitHub usernames", () => {
    expect(validateGithubUsername("octocat")).toEqual({ ok: true, username: "octocat" });
    expect(validateGithubUsername("real-grass")).toEqual({ ok: true, username: "real-grass" });
    expect(validateGithubUsername("a".repeat(39))).toEqual({ ok: true, username: "a".repeat(39) });
  });

  test("rejects invalid GitHub usernames", () => {
    expect(validateGithubUsername(null).ok).toBe(false);
    expect(validateGithubUsername("").ok).toBe(false);
    expect(validateGithubUsername("real_grass").ok).toBe(false);
    expect(validateGithubUsername("-grass").ok).toBe(false);
    expect(validateGithubUsername("grass-").ok).toBe(false);
    expect(validateGithubUsername("real--grass").ok).toBe(false);
    expect(validateGithubUsername("a".repeat(40)).ok).toBe(false);
  });
});
