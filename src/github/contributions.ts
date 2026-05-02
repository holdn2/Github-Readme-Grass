import type { ContributionWeek } from "../render/svg";
import { countToLevels } from "../render/levels";

const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";

export type ContributionCalendar = {
  weeks: ContributionWeek[];
};

type ContributionFetch = (url: string, init?: RequestInit) => Promise<Response>;

type GitHubContributionErrorCode = "not_found" | "github_error";

export class GitHubContributionError extends Error {
  code: GitHubContributionErrorCode;

  constructor(code: GitHubContributionErrorCode, message: string) {
    super(message);
    this.name = "GitHubContributionError";
    this.code = code;
  }
}

type GitHubContributionDay = {
  date: string;
  contributionCount: number;
  weekday: number;
};

type GitHubContributionWeek = {
  contributionDays: GitHubContributionDay[];
};

type GitHubContributionResponse = {
  data?: {
    user?: null | {
      contributionsCollection?: {
        contributionCalendar?: {
          weeks?: GitHubContributionWeek[];
        };
      };
    };
  };
  errors?: Array<{ message?: string }>;
};

const CONTRIBUTION_CALENDAR_QUERY = `
  query ContributionCalendar($username: String!) {
    user(login: $username) {
      contributionsCollection {
        contributionCalendar {
          weeks {
            contributionDays {
              date
              contributionCount
              weekday
            }
          }
        }
      }
    }
  }
`;

function githubError(message: string): GitHubContributionError {
  return new GitHubContributionError("github_error", message);
}

function isValidDateString(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(timestamp);
}

function isValidContributionDay(value: unknown): value is GitHubContributionDay {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const day = value as Record<string, unknown>;

  return (
    isValidDateString(day.date) &&
    typeof day.weekday === "number" &&
    Number.isFinite(day.weekday) &&
    typeof day.contributionCount === "number" &&
    Number.isFinite(day.contributionCount)
  );
}

function assertValidWeeks(value: unknown): asserts value is GitHubContributionWeek[] {
  if (!Array.isArray(value)) {
    throw githubError("GitHub response contribution weeks were invalid.");
  }

  for (const week of value) {
    if (typeof week !== "object" || week === null) {
      throw githubError("GitHub response contribution week was invalid.");
    }

    const contributionDays = (week as Record<string, unknown>).contributionDays;
    if (!Array.isArray(contributionDays)) {
      throw githubError("GitHub response contribution days were invalid.");
    }

    if (!contributionDays.every(isValidContributionDay)) {
      throw githubError("GitHub response contribution day was invalid.");
    }
  }
}

export async function fetchContributionCalendar(
  username: string,
  token: string,
  fetchImpl: ContributionFetch = globalThis.fetch.bind(globalThis) as ContributionFetch
): Promise<ContributionCalendar> {
  const response = await fetchImpl(GITHUB_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      query: CONTRIBUTION_CALENDAR_QUERY,
      variables: { username }
    })
  });

  if (!response.ok) {
    throw githubError(`GitHub returned HTTP ${response.status}.`);
  }

  const payload = (await response.json()) as GitHubContributionResponse;

  if (payload.data?.user === null) {
    throw new GitHubContributionError("not_found", "GitHub user was not found.");
  }

  if (payload.errors?.length) {
    throw githubError(payload.errors[0]?.message ?? "GitHub GraphQL returned an error.");
  }

  const weeks = payload.data?.user?.contributionsCollection?.contributionCalendar?.weeks;
  assertValidWeeks(weeks);

  const counts = weeks.flatMap((week) =>
    week.contributionDays.map((day) => day.contributionCount)
  );
  const levels = countToLevels(counts);
  let levelIndex = 0;

  return {
    weeks: weeks.map((week) => ({
      days: week.contributionDays.map((day) => ({
        date: day.date,
        count: day.contributionCount,
        weekday: day.weekday,
        level: levels[levelIndex++] ?? 0
      }))
    }))
  };
}
