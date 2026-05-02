import { describe, expect, test } from "vitest";
import { renderGrassSvg, type ContributionWeek } from "../render/svg";

const weeks: ContributionWeek[] = [
  {
    days: [
      { date: "2026-01-01", count: 0, level: 0, weekday: 4 },
      { date: "2026-01-02", count: 1, level: 1, weekday: 5 },
      { date: "2026-01-03", count: 3, level: 2, weekday: 6 }
    ]
  },
  {
    days: [
      { date: "2026-02-01", count: 8, level: 4, weekday: 0 }
    ]
  }
];

describe("renderGrassSvg", () => {
  test("renders a complete grass SVG with labels and legend", () => {
    const svg = renderGrassSvg({ username: "octocat", weeks });

    expect(svg).toMatch(/^<svg/);
    expect(svg).toContain("octocat&apos;s GitHub grass");
    expect(svg).toContain(">Jan<");
    expect(svg).toContain(">Feb<");
    expect(svg).toContain("Less");
    expect(svg).toContain("More");
  });

  test("escapes usernames before inserting them into SVG", () => {
    const svg = renderGrassSvg({ username: `<script>alert("x")</script>`, weeks });

    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
  });
});
