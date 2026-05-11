export function formatDateTime(value?: string | number | null) {
  if (!value) {
    return "";
  }
  const date = typeof value === "number" ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleString();
}

export function formatViewerCount(count?: number | null) {
  if (!count) {
    return "0";
  }
  return new Intl.NumberFormat().format(count);
}
