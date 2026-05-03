import { escapeSvgText } from "./escape";

export type ContributionDay = {
  date: string;
  count: number;
  level: number;
  weekday: number;
};

export type ContributionWeek = {
  days: ContributionDay[];
};

export type GrassSvgInput = {
  username: string;
  weeks: ContributionWeek[];
  generatedAt?: Date;
};

const TILE_SIZE = 12;
const TILE_GAP = 1;
const PLOT_LEFT = 28;
const PLOT_TOP = 62;
const TITLE_TOP = 19;
const MONTH_LABEL_TOP = 48;
const LEGEND_TOP_PADDING = 24;
const PIXEL_SIZE = 3;
const BACKGROUND_RADIUS = 8;

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SOIL = "#9b6a3a";
const SOIL_DARK = "#7c4f2b";
const SOIL_LIGHT = "#b77a44";
const SOIL_MID = "#8f5d34";
const FIELD_BACKGROUND = "#edf1df";
const GRASS_BASE = ["", "#86c95a", "#5bad41", "#358a31", "#358a31"];
const GRASS_DARK = ["", "#64a844", "#3a7c2d", "#226823", "#226823"];
const GRASS_LIGHT = ["", "#a9df73", "#78c955", "#4da640", "#4da640"];
const GRASS_PIXEL_COUNTS = [0, 2, 7, 14, 14];
const FLOWER_PETAL = "#f7a8c9";
const FLOWER_CENTER = "#ffe66d";
const FLOWER_PIXEL_SIZE = 2;
const FLOWER_ACCENT_PIXEL_SIZE = 1;
const FLOWER_PIXEL_COUNT = 6;

function monthLabel(dateValue: string): string {
  const monthIndex = Number(dateValue.slice(5, 7)) - 1;
  return MONTH_LABELS[monthIndex] ?? "";
}

function clampLevel(level: number): number {
  if (!Number.isFinite(level)) return 0;
  return Math.min(4, Math.max(0, Math.round(level)));
}

function clampWeekday(weekday: number): number {
  if (!Number.isFinite(weekday)) return 0;
  return Math.min(6, Math.max(0, Math.round(weekday)));
}

function tileSeed(x: number, y: number, level: number): number {
  return Math.abs(x * 31 + y * 17 + level * 13);
}

function renderGrassTile(x: number, y: number, level: number, weekIndex?: number, weekday?: number): string {
  const normalizedLevel = clampLevel(level);
  const seed = tileSeed(x, y, normalizedLevel);
  const surface = normalizedLevel === 0 ? "dirt" : "grass";
  const grassPixels = GRASS_PIXEL_COUNTS[normalizedLevel];
  const flowerPixels = normalizedLevel === 4 ? FLOWER_PIXEL_COUNT : 0;
  const data = weekIndex === undefined || weekday === undefined
    ? ""
    : ` data-week="${weekIndex}" data-weekday="${weekday}" data-x="${x}" data-y="${y}"`;
  const baseClass = normalizedLevel === 0 ? "tile-base tile-dirt" : "tile-base tile-grass";
  const baseFill = normalizedLevel === 0 ? SOIL : GRASS_BASE[normalizedLevel];
  const pixels = normalizedLevel === 0
    ? renderDirtPixels(x, y, seed)
    : `${renderGrassPixels(x, y, normalizedLevel, seed)}${renderFlowerPixels(x, y, normalizedLevel, seed)}`;

  return [
    `<g class="grass-tile level-${normalizedLevel}" data-level="${normalizedLevel}" data-surface="${surface}" data-grass-pixels="${grassPixels}" data-flower-pixels="${flowerPixels}"${data}>`,
    `<rect class="${baseClass} level-${normalizedLevel}" x="${x}" y="${y}" width="${TILE_SIZE}" height="${TILE_SIZE}" fill="${baseFill}"/>`,
    pixels,
    "</g>"
  ].join("");
}

function renderDirtPixels(x: number, y: number, seed: number): string {
  const fills = [SOIL_DARK, SOIL_LIGHT, SOIL_MID, SOIL_DARK, SOIL_LIGHT];

  return fills
    .map((fill, index) => {
      const cell = (seed + index * 5) % 16;
      const column = cell % 4;
      const row = Math.floor(cell / 4);
      const opacity = index % 2 === 0 ? "0.44" : "0.36";

      return `<rect class="dirt-pixel" x="${x + column * PIXEL_SIZE}" y="${y + row * PIXEL_SIZE}" width="${PIXEL_SIZE}" height="${PIXEL_SIZE}" fill="${fill}" opacity="${opacity}"/>`;
    })
    .join("");
}

function renderGrassPixels(x: number, y: number, level: number, seed: number): string {
  const count = GRASS_PIXEL_COUNTS[level];

  return Array.from({ length: count }, (_, index) => {
    const cell = (seed + index * 7) % 16;
    const column = cell % 4;
    const row = Math.floor(cell / 4);
    const fill = index % 3 === 0 ? GRASS_LIGHT[level] : GRASS_DARK[level];
    const opacity = Math.min(0.88, 0.38 + level * 0.1 + (index % 2) * 0.08).toFixed(2);

    return `<rect class="grass-pixel level-${level}" data-level="${level}" x="${x + column * PIXEL_SIZE}" y="${y + row * PIXEL_SIZE}" width="${PIXEL_SIZE}" height="${PIXEL_SIZE}" fill="${fill}" opacity="${opacity}"/>`;
  }).join("");
}

function renderFlowerPixels(x: number, y: number, level: number, seed: number): string {
  if (level !== 4) return "";

  const centerPairs = [
    [[4, 4], [8, 8]],
    [[4, 7], [8, 3]],
    [[3, 4], [8, 7]],
    [[5, 3], [9, 8]]
  ] as const;
  const centers = centerPairs[seed % centerPairs.length];
  const [flowerCenter, accentCenter] = centers;
  const [centerX, centerY] = flowerCenter;
  const [accentX, accentY] = accentCenter;
  const pixels = [
    [centerX, centerY - 2, FLOWER_PETAL],
    [centerX - 2, centerY, FLOWER_PETAL],
    [centerX, centerY, FLOWER_CENTER],
    [centerX + 2, centerY, FLOWER_PETAL],
    [centerX, centerY + 2, FLOWER_PETAL]
  ] as const;

  return [
    ...pixels.map(([offsetX, offsetY, fill], pixelIndex) =>
      `<rect class="flower-pixel level-4" data-level="4" data-flower="0" data-flower-pixel="${pixelIndex}" x="${x + offsetX}" y="${y + offsetY}" width="${FLOWER_PIXEL_SIZE}" height="${FLOWER_PIXEL_SIZE}" fill="${fill}"/>`
    ),
    `<rect class="flower-pixel level-4" data-level="4" data-flower="1" data-flower-pixel="0" x="${x + accentX}" y="${y + accentY}" width="${FLOWER_ACCENT_PIXEL_SIZE}" height="${FLOWER_ACCENT_PIXEL_SIZE}" fill="${FLOWER_PETAL}"/>`
  ].join("");
}

function renderMonthLabels(weeks: ContributionWeek[]): string {
  const labels: string[] = [];
  const seenYearMonths = new Set<string>();

  weeks.forEach((week, weekIndex) => {
    const firstOfMonth = week.days.find((day) => day.date.endsWith("-01"));
    if (!firstOfMonth) return;

    const yearMonth = firstOfMonth.date.slice(0, 7);
    const label = monthLabel(firstOfMonth.date);
    if (!label || seenYearMonths.has(yearMonth)) return;

    seenYearMonths.add(yearMonth);
    const x = PLOT_LEFT + weekIndex * (TILE_SIZE + TILE_GAP);
    labels.push(`<text x="${x}" y="${MONTH_LABEL_TOP}" class="label">${label}</text>`);
  });

  return labels.join("");
}

function renderTiles(weeks: ContributionWeek[]): string {
  return weeks
    .map((week, weekIndex) =>
      week.days
        .map((day) => {
          const weekday = clampWeekday(day.weekday);
          const x = PLOT_LEFT + weekIndex * (TILE_SIZE + TILE_GAP);
          const y = PLOT_TOP + weekday * (TILE_SIZE + TILE_GAP);

          return renderGrassTile(x, y, day.level, weekIndex, weekday);
        })
        .join("")
    )
    .join("");
}

function renderLegend(y: number): string {
  const swatches = [0, 1, 2, 3, 4]
    .map((level, index) => {
      const x = 76 + index * (TILE_SIZE + 5);
      const tileY = y - 10;

      return renderGrassTile(x, tileY, level);
    })
    .join("");

  return `<g class="legend"><text x="28" y="${y}" class="label">Less</text>${swatches}<text x="168" y="${y}" class="label">More</text></g>`;
}

export function renderGrassSvg(input: GrassSvgInput): string {
  const safeTitle = `${escapeSvgText(input.username)}&apos;s GitHub grass`;
  const plotWidth = input.weeks.length * (TILE_SIZE + TILE_GAP) - TILE_GAP;
  const width = Math.max(240, PLOT_LEFT + plotWidth + 18);
  const plotHeight = 7 * TILE_SIZE + 6 * TILE_GAP;
  const legendY = PLOT_TOP + plotHeight + LEGEND_TOP_PADDING;
  const height = legendY + 18;
  const generatedAt = input.generatedAt?.toISOString();
  const generated = generatedAt ? `<desc>Generated at ${escapeSvgText(generatedAt)}</desc>` : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title" shape-rendering="crispEdges"><title id="title">${safeTitle}</title>${generated}<style>.title{font:600 14px system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;fill:#2f3328}.label{font:10px system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;fill:#596150}</style><rect width="100%" height="100%" rx="${BACKGROUND_RADIUS}" ry="${BACKGROUND_RADIUS}" fill="${FIELD_BACKGROUND}"/><text x="28" y="${TITLE_TOP}" class="title">${safeTitle}</text>${renderMonthLabels(input.weeks)}<g>${renderTiles(input.weeks)}</g>${renderLegend(legendY)}</svg>`;
}
