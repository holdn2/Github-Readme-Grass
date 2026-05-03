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

function findTextY(svg: string, className: string, text: string): number {
  const match = svg.match(new RegExp(`<text x="\\d+" y="(\\d+)" class="${className}">${text}</text>`));
  if (!match) {
    throw new Error(`Could not find ${className} text for ${text}`);
  }

  return Number(match[1]);
}

function findTile(svg: string, level: number): string {
  const match = svg.match(new RegExp(`<g class="grass-tile level-${level}"[^>]*data-level="${level}"[^>]*>`));
  if (!match) {
    throw new Error(`Could not find tile for level ${level}`);
  }

  return match[0];
}

function findGraphTile(svg: string, level: number, weekday: number): string {
  const match = svg.match(new RegExp(`<g class="grass-tile level-${level}"[^>]*data-level="${level}"[^>]*data-week="0"[^>]*data-weekday="${weekday}"[^>]*>[\\s\\S]*?</g>`));
  if (!match) {
    throw new Error(`Could not find graph tile for level ${level}`);
  }

  return match[0];
}

function findLegendTile(svg: string, level: number): string {
  const match = svg.match(new RegExp(`<g class="grass-tile level-${level}"[^>]*data-level="${level}"[^>]*data-flower-pixels="\\d+">[\\s\\S]*?</g>`));
  if (!match) {
    throw new Error(`Could not find legend tile for level ${level}`);
  }

  return match[0];
}

function readNumericAttribute(element: string, attribute: string): number {
  const match = element.match(new RegExp(`${attribute}="(\\d+)"`));
  if (!match) {
    throw new Error(`Could not find ${attribute} on ${element}`);
  }

  return Number(match[1]);
}

function tileYValues(svg: string): number[] {
  return [...svg.matchAll(/class="grass-tile level-\d+"[^>]*data-y="(\d+)"/g)].map((match) => Number(match[1]));
}

function tileXValues(svg: string): number[] {
  return [...svg.matchAll(/class="grass-tile level-\d+"[^>]*data-x="(\d+)"/g)].map((match) => Number(match[1]));
}

function tileWeekdays(svg: string): number[] {
  return [...svg.matchAll(/class="grass-tile level-\d+"[^>]*data-weekday="(\d+)"/g)].map((match) => Number(match[1]));
}

function grassPixelPositions(svg: string, level: number): string[] {
  return [...svg.matchAll(new RegExp(`<rect class="grass-pixel level-${level}"[^>]*x="(\\d+)" y="(\\d+)"`, "g"))]
    .map((match) => `${match[1]},${match[2]}`);
}

function flowerPixels(svg: string, level: number): string[] {
  return [...svg.matchAll(new RegExp(`<rect class="flower-pixel level-${level}"[^>]*data-flower-pixel="(\\d+)"`, "g"))]
    .map((match) => match[1]);
}

function flowerIndexes(svg: string): string[] {
  return [...svg.matchAll(/<rect class="flower-pixel level-4"[^>]*data-flower="(\d+)"/g)]
    .map((match) => match[1]);
}

function flowerRects(svg: string): Array<{ flower: string; pixel: string; width: number; height: number }> {
  return [...svg.matchAll(/<rect class="flower-pixel level-4"[^>]*data-flower="(\d+)"[^>]*data-flower-pixel="(\d+)"[^>]*width="(\d+)" height="(\d+)"/g)]
    .map((match) => ({
      flower: match[1],
      pixel: match[2],
      width: Number(match[3]),
      height: Number(match[4])
    }));
}

function baseFill(tile: string, level: number): string {
  const match = tile.match(new RegExp(`<rect class="tile-base tile-grass level-${level}"[^>]*fill="([^"]+)"`));
  if (!match) {
    throw new Error(`Could not find base fill for level ${level}`);
  }

  return match[1];
}

function grassPixelFills(tile: string, level: number): string[] {
  return [...tile.matchAll(new RegExp(`<rect class="grass-pixel level-${level}"[^>]*fill="([^"]+)"`, "g"))]
    .map((match) => match[1]);
}

function grassPixelOpacities(tile: string, level: number): number[] {
  return [...tile.matchAll(new RegExp(`<rect class="grass-pixel level-${level}"[^>]*opacity="([^"]+)"`, "g"))]
    .map((match) => Number(match[1]));
}

function colorDistance(firstHex: string, secondHex: string): number {
  const first = rgb(firstHex);
  const second = rgb(secondHex);

  return Math.sqrt(
    (first[0] - second[0]) ** 2 +
    (first[1] - second[1]) ** 2 +
    (first[2] - second[2]) ** 2
  );
}

function rgb(hex: string): [number, number, number] {
  const match = hex.match(/^#([0-9a-f]{6})$/i);
  if (!match) {
    throw new Error(`Invalid hex color ${hex}`);
  }

  const value = Number.parseInt(match[1], 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function brightness(hex: string): number {
  const [red, green, blue] = rgb(hex);

  return red * 0.299 + green * 0.587 + blue * 0.114;
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

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

  test("rounds only the warm full SVG background panel", () => {
    const svg = renderGrassSvg({ username: "octocat", weeks });
    const backgroundRect = svg.match(/<rect width="100%" height="100%"[^>]*>/)?.[0];
    const tileBaseRects = [...svg.matchAll(/<rect class="tile-base [^"]+"[^>]*>/g)].map((match) => match[0]);

    expect(backgroundRect).toContain('fill="#edf1df"');
    expect(backgroundRect).toContain('rx="8"');
    expect(backgroundRect).toContain('ry="8"');
    expect(tileBaseRects.length).toBeGreaterThan(0);
    expect(tileBaseRects.every((rect) => !/\sr[xy]=/.test(rect))).toBe(true);
    expect(svg).not.toContain('fill="#f6f8f2"');
  });

  test("escapes usernames before inserting them into SVG", () => {
    const svg = renderGrassSvg({ username: `<script>alert("x")</script>`, weeks });

    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
  });

  test("keeps title spacing while pulling month labels closer to the plot", () => {
    const svg = renderGrassSvg({ username: "octocat", weeks });
    const titleY = findTextY(svg, "title", "octocat&apos;s GitHub grass");
    const monthY = findTextY(svg, "label", "Feb");
    const firstTileMatch = svg.match(/<g class="grass-tile level-4"[^>]*data-week="1"[^>]*data-weekday="0"[^>]*data-y="(\d+)"/);

    expect(titleY).toBe(19);
    expect(monthY).toBe(48);
    expect(monthY - titleY).toBe(29);
    expect(firstTileMatch).not.toBeNull();

    const firstTileY = Number(firstTileMatch?.[1]);
    expect(firstTileY).toBe(62);
    expect(firstTileY - monthY).toBeLessThan(20);
  });

  test("renders a top-down pixel field using rectangles instead of slabs or blades", () => {
    const svg = renderGrassSvg({ username: "octocat", weeks });

    expect(svg).toContain('class="grass-tile level-0"');
    expect(svg).toContain('class="grass-tile level-4"');
    expect(svg).toContain('class="tile-base tile-dirt level-0"');
    expect(svg).toContain('class="tile-base tile-grass level-4"');
    expect(svg).not.toContain("slab-top");
    expect(svg).not.toContain("slab-front");
    expect(svg).not.toContain("slab-side");
    expect(svg).not.toContain("grass-blade");
    expect(svg).not.toContain("<path");
    expect(svg).not.toContain("<circle");
    expect(svg).not.toContain("<image");
  });

  test("uses a small tile gap so adjacent days read as a connected field", () => {
    const svg = renderGrassSvg({ username: "octocat", weeks });
    const xValues = tileXValues(svg);
    const yValues = tileYValues(svg);

    expect(xValues[3] - xValues[0]).toBeLessThanOrEqual(13);
    expect(yValues[1] - yValues[0]).toBeLessThanOrEqual(13);
  });

  test("renders dirt for level zero and separates level one through three grass density", () => {
    const svg = svgForLevels();
    const dirtTile = renderGrassSvg({
      username: "octocat",
      weeks: [{ days: [{ date: "2026-01-01", count: 0, level: 0, weekday: 0 }] }]
    });
    const levelOnePixels = readNumericAttribute(findTile(svg, 1), "data-grass-pixels");
    const levelTwoPixels = readNumericAttribute(findTile(svg, 2), "data-grass-pixels");
    const levelThreePixels = readNumericAttribute(findTile(svg, 3), "data-grass-pixels");
    const levelFourPixels = readNumericAttribute(findTile(svg, 4), "data-grass-pixels");

    expect(dirtTile).toContain('class="tile-base tile-dirt level-0"');
    expect(dirtTile).toContain('data-surface="dirt"');
    expect(dirtTile).toContain('class="dirt-pixel"');
    expect(levelOnePixels).toBeLessThan(levelTwoPixels);
    expect(levelTwoPixels).toBeLessThan(levelThreePixels);
    expect([levelOnePixels, levelTwoPixels, levelThreePixels]).toEqual([2, 7, 14]);
    expect(levelTwoPixels - levelOnePixels).toBeGreaterThanOrEqual(5);
    expect(levelThreePixels - levelTwoPixels).toBeGreaterThanOrEqual(7);
    expect(levelThreePixels).toBe(14);
    expect(levelFourPixels).toBe(14);
  });

  test("uses the same deep grass palette for levels three and four", () => {
    const svg = svgForGraphLevels();
    const levelThreeTile = findGraphTile(svg, 3, 3);
    const levelFourTile = findGraphTile(svg, 4, 4);

    expect(baseFill(levelThreeTile, 3)).toBe(baseFill(levelFourTile, 4));
    expect(new Set(grassPixelFills(levelThreeTile, 3))).toEqual(new Set(grassPixelFills(levelFourTile, 4)));
  });

  test("separates levels one through three with visible color and opacity contrast", () => {
    const svg = svgForGraphLevels();
    const levelOneTile = findGraphTile(svg, 1, 1);
    const levelTwoTile = findGraphTile(svg, 2, 2);
    const levelThreeTile = findGraphTile(svg, 3, 3);
    const levelOneBase = baseFill(levelOneTile, 1);
    const levelTwoBase = baseFill(levelTwoTile, 2);
    const levelThreeBase = baseFill(levelThreeTile, 3);
    const levelOneOpacity = average(grassPixelOpacities(levelOneTile, 1));
    const levelTwoOpacity = average(grassPixelOpacities(levelTwoTile, 2));
    const levelThreeOpacity = average(grassPixelOpacities(levelThreeTile, 3));

    expect(colorDistance(levelOneBase, levelTwoBase)).toBeGreaterThanOrEqual(45);
    expect(colorDistance(levelTwoBase, levelThreeBase)).toBeGreaterThanOrEqual(45);
    expect(new Set(grassPixelFills(levelOneTile, 1))).not.toEqual(new Set(grassPixelFills(levelTwoTile, 2)));
    expect(new Set(grassPixelFills(levelTwoTile, 2))).not.toEqual(new Set(grassPixelFills(levelThreeTile, 3)));
    expect(levelTwoOpacity - levelOneOpacity).toBeGreaterThanOrEqual(0.08);
    expect(levelThreeOpacity - levelTwoOpacity).toBeGreaterThanOrEqual(0.08);
  });

  test("darkens the level two grass palette while preserving level three contrast", () => {
    const svg = svgForGraphLevels();
    const levelOneTile = findGraphTile(svg, 1, 1);
    const levelTwoTile = findGraphTile(svg, 2, 2);
    const levelThreeTile = findGraphTile(svg, 3, 3);
    const levelTwoPixelFills = [...new Set(grassPixelFills(levelTwoTile, 2))]
      .sort((first, second) => brightness(second) - brightness(first));
    const levelTwoPalette = [
      baseFill(levelTwoTile, 2),
      ...levelTwoPixelFills
    ];

    expect(levelTwoPalette).not.toEqual(["#5fb044", "#82cf5c", "#3f852f"]);
    expect(brightness(levelTwoPalette[0])).toBeLessThan(brightness("#5fb044"));
    expect(brightness(levelTwoPalette[1])).toBeLessThan(brightness("#82cf5c"));
    expect(brightness(levelTwoPalette[2])).toBeLessThan(brightness("#3f852f"));
    expect(brightness(baseFill(levelTwoTile, 2))).toBeLessThan(brightness(baseFill(levelOneTile, 1)));
    expect(brightness(baseFill(levelThreeTile, 3))).toBeLessThan(brightness(baseFill(levelTwoTile, 2)) - 30);
  });

  test("adds one tiny flower plus one single-pixel flower accent only to level four graph tiles", () => {
    const svg = svgForGraphLevels();
    const levelZeroTile = findGraphTile(svg, 0, 0);
    const levelOneTile = findGraphTile(svg, 1, 1);
    const levelTwoTile = findGraphTile(svg, 2, 2);
    const levelThreeTile = findGraphTile(svg, 3, 3);
    const levelFourTile = findGraphTile(svg, 4, 4);
    const levelFourLegendTile = findLegendTile(svg, 4);
    const levelFourFlowers = flowerRects(levelFourTile);
    const levelFourLegendFlowers = flowerRects(levelFourLegendTile);

    expect(flowerIndexes(levelFourTile)).toEqual(["0", "0", "0", "0", "0", "1"]);
    expect(flowerPixels(levelFourTile, 4)).toEqual(["0", "1", "2", "3", "4", "0"]);
    expect(levelFourFlowers.filter((pixel) => pixel.flower === "0").map((pixel) => `${pixel.width}x${pixel.height}`)).toEqual(["2x2", "2x2", "2x2", "2x2", "2x2"]);
    expect(levelFourFlowers.filter((pixel) => pixel.flower === "1")).toEqual([{ flower: "1", pixel: "0", width: 1, height: 1 }]);
    expect(levelFourTile).toContain('data-flower-pixels="6"');
    expect(levelFourLegendFlowers.filter((pixel) => pixel.flower === "0").map((pixel) => `${pixel.width}x${pixel.height}`)).toEqual(["2x2", "2x2", "2x2", "2x2", "2x2"]);
    expect(levelFourLegendFlowers.filter((pixel) => pixel.flower === "1")).toEqual([{ flower: "1", pixel: "0", width: 1, height: 1 }]);
    expect(levelZeroTile).toContain('data-flower-pixels="0"');
    expect(levelOneTile).toContain('data-flower-pixels="0"');
    expect(levelTwoTile).toContain('data-flower-pixels="0"');
    expect(levelThreeTile).toContain('data-flower-pixels="0"');
    expect(levelZeroTile).not.toContain('class="flower-pixel');
    expect(levelOneTile).not.toContain('class="flower-pixel');
    expect(levelTwoTile).not.toContain('class="flower-pixel');
    expect(levelThreeTile).not.toContain('class="flower-pixel');
  });

  test("places each grass pixel in a distinct cell within a tile", () => {
    const svg = renderGrassSvg({
      username: "octocat",
      weeks: [{ days: [{ date: "2026-01-01", count: 4, level: 4, weekday: 0 }] }]
    });
    const positions = grassPixelPositions(svg, 4);
    const graphTilePositions = positions.slice(0, readNumericAttribute(findTile(svg, 4), "data-grass-pixels"));

    expect(new Set(graphTilePositions).size).toBe(graphTilePositions.length);
  });

  test("does not emit invalid numbers for non-finite levels", () => {
    const svg = renderGrassSvg({
      username: "octocat",
      weeks: [
        {
          days: [
            { date: "2026-01-01", count: 0, level: Number.NaN, weekday: 0 },
            { date: "2026-01-02", count: 0, level: Number.POSITIVE_INFINITY, weekday: 1 }
          ]
        }
      ]
    });

    expect(svg).not.toContain("NaN");
    expect(svg).not.toContain("Infinity");
  });

  test("sanitizes invalid weekdays before rendering tile positions", () => {
    const svg = renderGrassSvg({
      username: "octocat",
      weeks: [
        {
          days: [
            { date: "2026-01-01", count: 1, level: 1, weekday: Number.NaN },
            { date: "2026-01-02", count: 2, level: 2, weekday: Number.POSITIVE_INFINITY },
            { date: "2026-01-03", count: 3, level: 3, weekday: -3 },
            { date: "2026-01-04", count: 4, level: 4, weekday: 9 }
          ]
        }
      ]
    });

    expect(svg).not.toContain("NaN");
    expect(svg).not.toContain("Infinity");
    expect(tileWeekdays(svg)).toEqual([0, 0, 0, 6]);
    expect(tileYValues(svg)).toEqual([62, 62, 62, 140]);
  });
});

function svgForLevels(): string {
  return renderGrassSvg({
    username: "octocat",
    weeks: [
      {
        days: [
          { date: "2026-01-01", count: 1, level: 1, weekday: 0 },
          { date: "2026-01-02", count: 2, level: 2, weekday: 1 },
          { date: "2026-01-03", count: 3, level: 3, weekday: 2 },
          { date: "2026-01-04", count: 4, level: 4, weekday: 3 }
        ]
      }
    ]
  });
}

function svgForGraphLevels(): string {
  return renderGrassSvg({
    username: "octocat",
    weeks: [
      {
        days: [
          { date: "2026-01-01", count: 0, level: 0, weekday: 0 },
          { date: "2026-01-02", count: 1, level: 1, weekday: 1 },
          { date: "2026-01-03", count: 2, level: 2, weekday: 2 },
          { date: "2026-01-04", count: 3, level: 3, weekday: 3 },
          { date: "2026-01-05", count: 4, level: 4, weekday: 4 }
        ]
      }
    ]
  });
}
