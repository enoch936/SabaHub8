package com.sabahub.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class WalletCurrencyService {

    public static final String ETB = "ETB";
    public static final String USD = "USD";

    private final double usdToEtb;
    private final String provider;
    private final String generatedAt;

    public WalletCurrencyService(
            @Value("${wallet.fx.usd-to-etb:140.00}") double usdToEtb,
            @Value("${wallet.fx.provider:CONFIGURED}") String provider,
            @Value("${wallet.fx.generated-at:}") String generatedAt
    ) {
        this.usdToEtb = usdToEtb > 0 ? usdToEtb : 140.00;
        this.provider = provider == null || provider.isBlank() ? "CONFIGURED" : provider.trim();
        this.generatedAt = generatedAt == null || generatedAt.isBlank() ? Instant.now().toString() : generatedAt.trim();
    }

    public List<String> supportedCurrencies() {
        return List.of(ETB, USD);
    }

    public boolean isSupported(String currency) {
        if (currency == null || currency.isBlank()) {
            return false;
        }
        String normalized = currency.trim().toUpperCase(Locale.ROOT);
        return ETB.equals(normalized) || USD.equals(normalized);
    }

    public String normalizeSupportedCurrency(String value, String fallback) {
        String normalizedFallback = fallback == null || fallback.isBlank()
                ? ETB
                : fallback.trim().toUpperCase(Locale.ROOT);

        if (value == null || value.isBlank()) {
            if (!isSupported(normalizedFallback)) {
                throw new IllegalArgumentException("currency must be ETB or USD");
            }
            return normalizedFallback;
        }

        String normalized = value.trim().toUpperCase(Locale.ROOT);
        if (!isSupported(normalized)) {
            throw new IllegalArgumentException("currency must be ETB or USD");
        }
        return normalized;
    }

    public double convert(double amount, String fromCurrency, String toCurrency) {
        String from = normalizeSupportedCurrency(fromCurrency, ETB);
        String to = normalizeSupportedCurrency(toCurrency, ETB);

        if (amount <= 0) {
            return 0.0;
        }
        if (from.equals(to)) {
            return round2(amount);
        }
        if (USD.equals(from) && ETB.equals(to)) {
            return round2(amount * usdToEtb);
        }
        if (ETB.equals(from) && USD.equals(to)) {
            return round2(amount / usdToEtb);
        }
        throw new IllegalArgumentException("Unsupported wallet conversion");
    }

    public double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    public Map<String, Object> fxSnapshot() {
        Map<String, Object> rates = new LinkedHashMap<>();
        rates.put("USD_ETB", round2(usdToEtb));
        rates.put("ETB_USD", Math.round((1.0 / usdToEtb) * 1_000_000.0) / 1_000_000.0);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("provider", provider);
        payload.put("generatedAt", generatedAt);
        payload.put("supportedCurrencies", supportedCurrencies());
        payload.put("rates", rates);
        return payload;
    }
}
