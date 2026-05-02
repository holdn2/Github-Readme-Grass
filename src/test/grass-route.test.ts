import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../github/contributions", () => {
  class GitHubContributionError extends Error {
    code: "not_found" | "github_error";

    constructor(code: "not_found" | "github_error", message: string) {
      super(message);
      this.name = "GitHubContributionError";
      this.code = code;
    }
  }

  return {
    fetchContributionCalendar: vi.fn(),
    GitHubContributionError
  };
});

import {
  fetchContributionCalendar,
  GitHubContributionError
} from "../github/contributions";
import { GET } from "../../app/api/grass/route";

const mockedFetchContributionCalendar = vi.mocked(fetchContributionCalendar);
const SUCCESS_CACHE = "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400";

describe("GET /api/grass", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    mockedFetchContributionCalendar.mockReset();
  });

  test("returns a visible SVG error with diagnostic status for invalid username", async () => {
    const response = await GET(new Request("https://example.com/api/grass?username=-bad"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/svg+xml; charset=utf-8");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-github-real-grass-status")).toBe("400");
    expect(await response.text()).toContain("Invalid GitHub username");
  });

  test("returns a no-store visible SVG error when the GitHub token is missing", async () => {
    const response = await GET(new Request("https://example.com/api/grass?username=octocat"));

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-github-real-grass-status")).toBe("500");
  });

  test("returns success SVG with public cache headers", async () => {
    vi.stubEnv("GITHUB_TOKEN", "token");
    mockedFetchContributionCalendar.mockResolvedValue({ weeks: [] });

    const response = await GET(new Request("https://example.com/api/grass?username=octocat"));

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe(SUCCESS_CACHE);
    expect(response.headers.get("x-github-real-grass-status")).toBeNull();
  });

  test("returns diagnostic 404 header for GitHub not found errors", async () => {
    vi.stubEnv("GITHUB_TOKEN", "token");
    mockedFetchContributionCalendar.mockRejectedValue(
      new GitHubContributionError("not_found", "missing")
    );

    const response = await GET(new Request("https://example.com/api/grass?username=missing"));

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-github-real-grass-status")).toBe("404");
  });
});
