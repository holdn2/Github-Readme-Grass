import { describe, expect, test } from "vitest";
import { countToLevels } from "../render/levels";

describe("countToLevels", () => {
  test("maps zero counts to bare soil", () => {
    expect(countToLevels([0, 0, 0])).toEqual([0, 0, 0]);
  });

  test("uses fallback thresholds when fewer than four non-zero days exist", () => {
    expect(countToLevels([0, 1, 2, 4, 7])).toEqual([0, 1, 2, 3, 4]);
  });

  test("uses percentile-like buckets for normal contribution ranges", () => {
    expect(countToLevels([0, 1, 2, 3, 4, 5, 6, 7])).toEqual([0, 1, 1, 2, 2, 3, 3, 4]);
  });
});
