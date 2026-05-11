package com.sabahub.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TwoFactorMethodNormalizerTest {

    @Test
    void normalize_flattensAliasesAndCombinationsIntoCanonicalOrder() {
        assertThat(TwoFactorMethodNormalizer.normalize("totp + both + password"))
                .isEqualTo("EMAIL+PHONE+AUTHENTICATOR+PIN");
    }

    @Test
    void normalizeFactors_returnsOrderedUniqueFactors() {
        assertThat(TwoFactorMethodNormalizer.normalizeFactors("PHONE+EMAIL+PHONE+PIN"))
                .containsExactly("EMAIL", "PHONE", "PIN");
    }

    @Test
    void factorHelpers_detectIncludedFactorsAcrossCombinations() {
        String method = "EMAIL+AUTHENTICATOR+PIN";

        assertThat(TwoFactorMethodNormalizer.usesEmailFactor(method)).isTrue();
        assertThat(TwoFactorMethodNormalizer.usesPhoneFactor(method)).isFalse();
        assertThat(TwoFactorMethodNormalizer.isAuthenticatorFactor(method)).isTrue();
        assertThat(TwoFactorMethodNormalizer.isPinFactor(method)).isTrue();
    }
}
