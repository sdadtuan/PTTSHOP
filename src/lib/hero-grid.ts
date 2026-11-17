/** Compute CSS background-position % for a cell in a cols×rows collage. */
export function heroCellBackgroundPosition(
  index: number,
  cols: number,
  rows: number,
): { x: number; y: number } {
  const col = index % cols;
  const row = Math.floor(index / cols);
  const x = cols <= 1 ? 50 : (col / (cols - 1)) * 100;
  const y = rows <= 1 ? 50 : (row / (rows - 1)) * 100;
  return { x, y };
}

export function heroCellCount(cols: number, rows: number) {
  return Math.max(1, cols) * Math.max(1, rows);
}
