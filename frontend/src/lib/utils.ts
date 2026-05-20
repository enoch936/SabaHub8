/**
 * Formatting utilities for the marketplace
 */

export function formatCurrencyRange(min?: number, max?: number, currency?: string) {
  if (typeof min !== "number" && typeof max !== "number") {
    return "Budget on request";
  }

  const resolvedCurrency = currency ?? "USD";
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: resolvedCurrency,
    maximumFractionDigits: 0,
  });

  if (typeof min === "number" && typeof max === "number") {
    return `${formatter.format(min)} - ${formatter.format(max)}`;
  }

  if (typeof min === "number") {
    return `From ${formatter.format(min)}`;
  }

  return `Up to ${formatter.format(max ?? 0)}`;
}

export function formatPrice(value?: number, currency?: string) {
  if (typeof value !== "number") {
    return "Custom pricing";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency ?? "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
