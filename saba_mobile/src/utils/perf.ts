export function keyExtractor<T extends { id?: string | number }>(item: T, index: number) {
  if (item.id !== undefined && item.id !== null) {
    return String(item.id);
  }
  return `row-${index}`;
}

export const listPerfConfig = {
  windowSize: 10,
  initialNumToRender: 12,
  maxToRenderPerBatch: 10,
  removeClippedSubviews: true,
} as const;
