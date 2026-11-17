/** Stable React list key for media rows that may share the same url. */
export function mediaListKey(
  item: { id?: string | null; url: string },
  index: number,
): string {
  return item.id ?? `${item.url}-${index}`;
}
