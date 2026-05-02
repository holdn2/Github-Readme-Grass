const SVG_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;"
};

export function escapeSvgText(value: string): string {
  return value.replace(/[&<>"']/g, (character) => SVG_ESCAPE_MAP[character]);
}
