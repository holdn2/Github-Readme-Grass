function fallbackLevel(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

export function countToLevels(counts: number[]): number[] {
  const nonZeroCounts = counts.filter((count) => count > 0);

  if (nonZeroCounts.length < 4) {
    return counts.map(fallbackLevel);
  }

  const sorted = [...nonZeroCounts].sort((a, b) => a - b);

  return counts.map((count) => {
    if (count <= 0) return 0;

    const firstIndex = sorted.findIndex((sortedCount) => sortedCount >= count);
    const bucket = Math.floor((firstIndex * 4) / sorted.length) + 1;

    return Math.min(4, Math.max(1, bucket));
  });
}
