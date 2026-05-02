import { renderErrorSvg } from "../../../src/api/error-svg";
import {
  fetchContributionCalendar,
  GitHubContributionError
} from "../../../src/github/contributions";
import { renderGrassSvg } from "../../../src/render/svg";
import { validateGithubUsername } from "../../../src/validation/username";

const SUCCESS_SVG_HEADERS = {
  "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
  "Content-Type": "image/svg+xml; charset=utf-8"
};

const ERROR_SVG_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "image/svg+xml; charset=utf-8"
};

function svgResponse(svg: string): Response {
  return new Response(svg, {
    status: 200,
    headers: SUCCESS_SVG_HEADERS
  });
}

function errorResponse(status: number, title: string, message: string): Response {
  return new Response(renderErrorSvg(title, message), {
    status: 200,
    headers: {
      ...ERROR_SVG_HEADERS,
      "X-GitHub-Real-Grass-Status": String(status)
    }
  });
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const validation = validateGithubUsername(url.searchParams.get("username"));

  if (!validation.ok) {
    return errorResponse(400, "Invalid GitHub username", validation.message);
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return errorResponse(500, "GitHub token missing", "Server configuration is missing GITHUB_TOKEN.");
  }

  try {
    const calendar = await fetchContributionCalendar(validation.username, token);
    const svg = renderGrassSvg({
      username: validation.username,
      weeks: calendar.weeks
    });

    return svgResponse(svg);
  } catch (error) {
    if (error instanceof GitHubContributionError && error.code === "not_found") {
      return errorResponse(404, "GitHub user not found", `${validation.username} was not found on GitHub.`);
    }

    return errorResponse(500, "Could not load GitHub grass", "GitHub contribution data could not be loaded.");
  }
}
