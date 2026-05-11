package com.sabahub.service;

import java.util.Locale;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public final class TwoFactorMethodNormalizer {

    private static final List<String> FACTOR_ORDER = List.of(
            "EMAIL",
            "PHONE",
            "AUTHENTICATOR",
            "PIN"
    );

    private static final Set<String> AUTHENTICATOR_ALIASES = Set.of(
            "AUTHENTICATOR",
            "TOTP",
            "AUTHENTICATOR_TOTP",
            "GOOGLE_AUTHENTICATOR",
            "AUTH_APP",
            "APP"
    );

    private static final Set<String> PIN_ALIASES = Set.of(
            "PIN",
            "PINCODE",
            "PIN_CODE",
            "PINCODE_PASSWORD",
            "PIN_PASSWORD",
            "PIN_OR_PASSWORD",
            "PASSCODE",
            "PASSWORD"
    );

    private TwoFactorMethodNormalizer() {
    }

    public static String normalize(String method) {
        List<String> factors = normalizeFactors(method);
        if (factors.isEmpty()) {
            return "";
        }
        return String.join("+", factors);
    }

    public static String normalizeOrDefault(String method, String defaultMethod) {
        String normalized = normalize(method);
        if (!normalized.isBlank()) {
            return normalized;
        }

        String fallback = normalize(defaultMethod);
        return fallback.isBlank() ? "" : fallback;
    }

    public static List<String> normalizeFactors(String method) {
        String normalized = normalizeOptional(method);
        if (normalized == null) {
            return List.of();
        }

        LinkedHashSet<String> factors = new LinkedHashSet<>();
        String[] rawTokens = normalized.split("[+,;|]");
        if (rawTokens.length == 0) {
            return List.of();
        }

        for (String rawToken : rawTokens) {
            String token = normalizeToken(rawToken);
            if (token.isBlank()) {
                continue;
            }

            if ("BOTH".equals(token)) {
                factors.add("EMAIL");
                factors.add("PHONE");
                continue;
            }
            if ("EMAIL".equals(token)) {
                factors.add("EMAIL");
                continue;
            }
            if ("PHONE".equals(token)) {
                factors.add("PHONE");
                continue;
            }
            if (AUTHENTICATOR_ALIASES.contains(token)) {
                factors.add("AUTHENTICATOR");
                continue;
            }
            if (PIN_ALIASES.contains(token)) {
                factors.add("PIN");
            }
        }

        return FACTOR_ORDER.stream()
                .filter(factors::contains)
                .collect(Collectors.toList());
    }

    public static boolean usesEmailFactor(String method) {
        return normalizeFactors(method).contains("EMAIL");
    }

    public static boolean usesPhoneFactor(String method) {
        return normalizeFactors(method).contains("PHONE");
    }

    public static boolean isAuthenticatorFactor(String method) {
        return normalizeFactors(method).contains("AUTHENTICATOR");
    }

    public static boolean isPinFactor(String method) {
        return normalizeFactors(method).contains("PIN");
    }

    private static String normalizeToken(String method) {
        if (method == null) {
            return "";
        }

        String normalized = method.trim().toUpperCase(Locale.ROOT);
        if (normalized.isBlank()) {
            return "";
        }

        return normalized
                .replace('-', '_')
                .replace(' ', '_')
                .replace('/', '_');
    }

    private static String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }
}
