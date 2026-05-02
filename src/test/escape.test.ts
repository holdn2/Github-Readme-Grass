import { describe, expect, test } from "vitest";
import { escapeSvgText } from "../render/escape";

describe("escapeSvgText", () => {
  test("escapes XML-sensitive characters", () => {
    expect(escapeSvgText(`<tag attr="x">Tom & Jerry's</tag>`)).toBe(
      "&lt;tag attr=&quot;x&quot;&gt;Tom &amp; Jerry&apos;s&lt;/tag&gt;"
    );
  });
});
