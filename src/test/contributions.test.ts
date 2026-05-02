import { describe, expect, test } from "vitest";
import {
  fetchContributionCalendar,
  GitHubContributionError
} from "../github/contributions";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

describe("fetchContributionCalendar", () => {
  test("sends a GraphQL request and normalizes contribution weeks", async () => {
    const calls: Array<[string, RequestInit | undefined]> = [];
    const fetchImpl = async (url: string, init?: RequestInit) => {
      calls.push([url, init]);
      return jsonResponse({
        data: {
          user: {
            contributionsCollection: {
              contributionCalendar: {
                weeks: [
                  {
                    contributionDays: [
                      { date: "2026-01-01", contributionCount: 0, weekday: 4 },
                      { date: "2026-01-02", contributionCount: 5, weekday: 5 }
                    ]
                  }
                ]
              }
            }
          }
        }
      });
    };

    const result = await fetchContributionCalendar("octocat", "token", fetchImpl);

    expect(calls[0][0]).toBe("https://api.github.com/graphql");
    expect(calls[0][1]?.headers).toMatchObject({ Authorization: "Bearer token" });
    expect(String(calls[0][1]?.body)).toContain("octocat");
    expect(result.weeks[0].days).toEqual([
      { date: "2026-01-01", count: 0, level: 0, weekday: 4 },
      { date: "2026-01-02", count: 5, level: 3, weekday: 5 }
    ]);
  });

  test("throws not_found when GitHub returns a null user", async () => {
    const fetchImpl = async () => jsonResponse({ data: { user: null } });

    await expect(fetchContributionCalendar("missing", "token", fetchImpl)).rejects.toMatchObject({
      code: "not_found"
    });
  });

  test("throws not_found when GitHub returns errors with a null user", async () => {
    const fetchImpl = async () =>
      jsonResponse({
        data: { user: null },
        errors: [{ message: "Could not resolve to a User with the login of 'missing'." }]
      });

    await expect(fetchContributionCalendar("missing", "token", fetchImpl)).rejects.toMatchObject({
      code: "not_found"
    });
  });

  test("throws github_error when GraphQL returns errors", async () => {
    const fetchImpl = async () => jsonResponse({ errors: [{ message: "bad credentials" }] });

    await expect(fetchContributionCalendar("octocat", "token", fetchImpl)).rejects.toBeInstanceOf(
      GitHubContributionError
    );
  });

  test.each([
    ["weeks is not an array", { data: { user: { contributionsCollection: { contributionCalendar: { weeks: {} } } } } }],
    [
      "contributionDays is not an array",
      {
        data: {
          user: {
            contributionsCollection: {
              contributionCalendar: {
                weeks: [{ contributionDays: {} }]
              }
            }
          }
        }
      }
    ],
    [
      "date is not a valid date string",
      {
        data: {
          user: {
            contributionsCollection: {
              contributionCalendar: {
                weeks: [{ contributionDays: [{ date: "not-a-date", contributionCount: 1, weekday: 1 }] }]
              }
            }
          }
        }
      }
    ],
    [
      "weekday is not a number",
      {
        data: {
          user: {
            contributionsCollection: {
              contributionCalendar: {
                weeks: [{ contributionDays: [{ date: "2026-01-01", contributionCount: 1, weekday: "1" }] }]
              }
            }
          }
        }
      }
    ],
    [
      "contributionCount is not a number",
      {
        data: {
          user: {
            contributionsCollection: {
              contributionCalendar: {
                weeks: [{ contributionDays: [{ date: "2026-01-01", contributionCount: "1", weekday: 1 }] }]
              }
            }
          }
        }
      }
    ]
  ])("throws github_error when %s", async (_caseName, body) => {
    const fetchImpl = async () => jsonResponse(body);

    await expect(fetchContributionCalendar("octocat", "token", fetchImpl)).rejects.toMatchObject({
      code: "github_error"
    });
  });
});
