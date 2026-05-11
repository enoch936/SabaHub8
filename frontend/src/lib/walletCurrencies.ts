"use client";

import type { WalletCurrencyCode, WalletFxSnapshot } from "./types";

export const WALLET_CURRENCY_OPTIONS: Array<{ code: WalletCurrencyCode; label: string }> = [
  { code: "ETB", label: "Ethiopian Birr (ETB)" },
  { code: "USD", label: "US Dollar (USD)" },
];

export function normalizeWalletCurrency(value?: string | null): WalletCurrencyCode {
  return value?.trim().toUpperCase() === "USD" ? "USD" : "ETB";
}

export function getWalletCurrencyLabel(currency: WalletCurrencyCode) {
  return WALLET_CURRENCY_OPTIONS.find((option) => option.code === currency)?.label ?? currency;
}

export function convertWalletAmount(
  amount: number,
  fromCurrency: WalletCurrencyCode,
  toCurrency: WalletCurrencyCode,
  fx?: WalletFxSnapshot | null,
) {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  if (fromCurrency === toCurrency) return round2(amount);

  const directRate = fx?.rates?.[`${fromCurrency}_${toCurrency}`];
  if (typeof directRate === "number" && Number.isFinite(directRate) && directRate > 0) {
    return round2(amount * directRate);
  }

  return 0;
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}
