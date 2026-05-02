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
const TILE_GAP = 3;
const PLOT_LEFT = 28;
const PLOT_TOP = 34;
const MONTH_LABEL_TOP = 25;
const LEGEND_TOP_PADDING = 24;

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SOIL = "#9b6a3a";
const SOIL_EDGE = "#744a27";
const GRASS = ["", "#8bcf5a", "#62b947", "#3f9d35", "#237a2a"];

function monthLabel(dateValue: string): string {
  const monthIndex = Number(dateValue.slice(5, 7)) - 1;
  return MONTH_LABELS[monthIndex] ?? "";
}

function clampLevel(level: number): number {
  if (!Number.isFinite(level)) return 0;
  return Math.min(4, Math.max(0, Math.round(level)));
}

function renderGrassOverlay(x: number, y: number, level: number): string {
  const normalizedLevel = clampLevel(level);

  if (normalizedLevel === 0) {
    return "";
  }

  const color = GRASS[normalizedLevel];
  const coverageByLevel = [0, 4, 7, 10, 12];
  const coverage = coverageByLevel[normalizedLevel];
  const top = y + TILE_SIZE - coverage;
  const blades = normalizedLevel >= 3
    ? `<path d="M${x + 3} ${top + 1}l2 -3 2 3M${x + 8} ${top + 2}l1 -4 2 4" stroke="#d6f5a3" stroke-width="0.8" stroke-linecap="round" fill="none"/>`
    : "";

  return `<rect x="${x + 1}" y="${top}" width="${TILE_SIZE - 2}" height="${coverage}" rx="1" fill="${color}"/>${blades}`;
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
          const x = PLOT_LEFT + weekIndex * (TILE_SIZE + TILE_GAP);
          const y = PLOT_TOP + day.weekday * (TILE_SIZE + TILE_GAP);

          return [
            `<rect x="${x}" y="${y}" width="${TILE_SIZE}" height="${TILE_SIZE}" rx="2" fill="${SOIL}"/>`,
            `<path d="M${x} ${y + TILE_SIZE - 3}h${TILE_SIZE}v3h-${TILE_SIZE}z" fill="${SOIL_EDGE}" opacity="0.45"/>`,
            renderGrassOverlay(x, y, day.level)
          ].join("");
        })
        .join("")
    )
    .join("");
}

function renderLegend(y: number): string {
  const swatches = [0, 1, 2, 3, 4]
    .map((level, index) => {
      const x = 76 + index * (TILE_SIZE + 5);
      const overlay = renderGrassOverlay(x, y - 10, level);

      return `<rect x="${x}" y="${y - 10}" width="${TILE_SIZE}" height="${TILE_SIZE}" rx="2" fill="${SOIL}"/>${overlay}`;
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

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title" shape-rendering="geometricPrecision"><title id="title">${safeTitle}</title>${generated}<style>.title{font:600 14px system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;fill:#2f3328}.label{font:10px system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;fill:#596150}</style><rect width="100%" height="100%" fill="#f6f8f2"/><text x="28" y="17" class="title">${safeTitle}</text>${renderMonthLabels(input.weeks)}<g>${renderTiles(input.weeks)}</g>${renderLegend(legendY)}</svg>`;
}
