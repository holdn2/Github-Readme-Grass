import { describe, expect, test } from "vitest";
import { renderErrorSvg } from "../api/error-svg";

describe("renderErrorSvg", () => {
  test("renders an escaped SVG error image", () => {
    const svg = renderErrorSvg("Bad <Title>", `Invalid "name" & token`);

    expect(svg).toMatch(/^<svg/);
    expect(svg).toContain("Bad &lt;Title&gt;");
    expect(svg).toContain("Invalid &quot;name&quot; &amp; token");
    expect(svg).not.toContain("Bad <Title>");
  });
});
