package com.sabahub.service;

import com.sabahub.domain.User;
import com.sabahub.domain.UserProfile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class TwoFactorAuthService {

    private static final String TOTP_ALGORITHM = "HmacSHA1";
    private static final String BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    private static final int SECRET_BYTE_LENGTH = 20;
    private static final int TOTP_DIGITS = 6;
    private static final int TOTP_PERIOD_SECONDS = 30;
    private static final int TOTP_WINDOW = 1;
    private static final int RECOVERY_CODE_COUNT = 10;
    private static final int RECOVERY_CODE_LENGTH = 10;
    private static final String ISSUER = "SabaHub";

    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    public TwoFactorAuthService(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    public AuthenticatorSetup beginAuthenticatorSetup(User user) {
        UserProfile profile = requireProfile(user);
        String secret = generateBase32Secret();
        profile.setPendingAuthenticatorSecret(secret);
        return new AuthenticatorSetup(
                secret,
                buildOtpAuthUrl(user.getEmail(), secret),
                ISSUER,
                user.getEmail()
        );
    }

    public ActivationResult enable(User user, String method, String currentPassword, String authenticatorCode, String pinCode) {
        requireCurrentPassword(user, currentPassword);
        UserProfile profile = requireProfile(user);
        String normalizedMethod = TwoFactorMethodNormalizer.normalize(method);
        List<String> factors = TwoFactorMethodNormalizer.normalizeFactors(normalizedMethod);
        if (factors.isEmpty()) {
            throw new IllegalArgumentException("A valid 2-step method is required");
        }

        List<String> recoveryCodes = List.of();

        if (TwoFactorMethodNormalizer.isAuthenticatorFactor(normalizedMethod)) {
            String activeSecret = normalizeOptional(profile.getAuthenticatorSecret());
            String pendingSecret = normalizeOptional(profile.getPendingAuthenticatorSecret());
            String setupSecret = pendingSecret != null ? pendingSecret : activeSecret;
            boolean authenticatorReady = Boolean.TRUE.equals(profile.getAuthenticatorEnabled()) && activeSecret != null;

            if (setupSecret == null) {
                throw new IllegalArgumentException("Generate an authenticator QR code before enabling this method");
            }
            if (!authenticatorReady && !isValidTotpCode(setupSecret, authenticatorCode)) {
                throw new IllegalArgumentException("Invalid authenticator code");
            }
            if (authenticatorReady && normalizeDigits(authenticatorCode) != null && !isValidTotpCode(activeSecret, authenticatorCode)) {
                throw new IllegalArgumentException("Invalid authenticator code");
            }

            if (!authenticatorReady || pendingSecret != null) {
                profile.setAuthenticatorSecret(setupSecret);
                profile.setPendingAuthenticatorSecret(null);
                profile.setAuthenticatorEnabled(true);
                profile.setAuthenticatorVerifiedAt(Instant.now().toEpochMilli());
                recoveryCodes = generateRecoveryCodes();
                profile.setRecoveryCodeHashes(hashRecoveryCodes(recoveryCodes));
                profile.setRecoveryCodesRemaining(recoveryCodes.size());
                profile.setRecoveryCodesGeneratedAt(Instant.now().toEpochMilli());
            }
        }

        if (TwoFactorMethodNormalizer.isPinFactor(normalizedMethod)) {
            String normalizedPin = normalizePin(pinCode);
            if (normalizedPin != null) {
                profile.setPinChallengeEnabled(true);
                profile.setSecurityPinHash(passwordEncoder.encode(normalizedPin));
                profile.setSecurityPinUpdatedAt(Instant.now().toEpochMilli());
            } else if (!isPinReady(profile)) {
                throw new IllegalArgumentException("Enter a 4 to 8 digit PIN");
            }
        }

        profile.setTwoFactorEnabled(true);
        profile.setTwoFactorMethod(normalizedMethod);
        return new ActivationResult(recoveryCodes);
    }

    public void disable(User user, String currentPassword) {
        requireCurrentPassword(user, currentPassword);
        UserProfile profile = requireProfile(user);
        profile.setTwoFactorEnabled(false);
        profile.setTwoFactorMethod("");
        profile.setPendingAuthenticatorSecret(null);
        profile.setAuthenticatorEnabled(false);
        profile.setAuthenticatorSecret(null);
        profile.setAuthenticatorVerifiedAt(null);
        profile.setPinChallengeEnabled(false);
        profile.setSecurityPinHash(null);
        profile.setSecurityPinUpdatedAt(null);
        profile.setRecoveryCodeHashes(null);
        profile.setRecoveryCodesRemaining(0);
        profile.setRecoveryCodesGeneratedAt(null);
    }

    public ActivationResult regenerateRecoveryCodes(User user, String currentPassword, String authenticatorCode, String recoveryCode) {
        requireCurrentPassword(user, currentPassword);
        UserProfile profile = requireProfile(user);
        if (!Boolean.TRUE.equals(profile.getAuthenticatorEnabled())
                || normalizeOptional(profile.getAuthenticatorSecret()) == null) {
            throw new IllegalArgumentException("Authenticator 2-step is not enabled");
        }

        boolean verified = isValidTotpCode(profile.getAuthenticatorSecret(), authenticatorCode)
                || consumeRecoveryCode(profile, recoveryCode);
        if (!verified) {
            throw new IllegalArgumentException("Enter a valid authenticator or recovery code");
        }

        List<String> recoveryCodes = generateRecoveryCodes();
        profile.setRecoveryCodeHashes(hashRecoveryCodes(recoveryCodes));
        profile.setRecoveryCodesRemaining(recoveryCodes.size());
        profile.setRecoveryCodesGeneratedAt(Instant.now().toEpochMilli());
        return new ActivationResult(recoveryCodes);
    }

    public boolean verifyAuthenticatorChallenge(User user, String otpCode, String recoveryCode) {
        UserProfile profile = requireProfile(user);
        String secret = normalizeOptional(profile.getAuthenticatorSecret());
        if (!Boolean.TRUE.equals(profile.getAuthenticatorEnabled()) || secret == null) {
            throw new IllegalArgumentException("Authenticator 2-step is not enabled");
        }

        if (isValidTotpCode(secret, otpCode)) {
            return false;
        }

        boolean usedRecoveryCode = consumeRecoveryCode(profile, recoveryCode);
        if (!usedRecoveryCode) {
            throw new IllegalArgumentException("Invalid authenticator or recovery code");
        }
        return true;
    }

    public void verifyPinChallenge(User user, String pinCode) {
        UserProfile profile = requireProfile(user);
        String normalizedPin = normalizePin(pinCode);
        String pinHash = normalizeOptional(profile.getSecurityPinHash());
        if (!Boolean.TRUE.equals(profile.getPinChallengeEnabled()) || pinHash == null) {
            throw new IllegalArgumentException("PIN challenge is not enabled");
        }
        if (normalizedPin == null || !passwordEncoder.matches(normalizedPin, pinHash)) {
            throw new IllegalArgumentException("Invalid security PIN");
        }
    }

    public boolean verifyPassword(User user, String currentPassword) {
        String raw = normalizeOptional(currentPassword);
        String passwordHash = user != null ? normalizeOptional(user.getPasswordHash()) : null;
        return raw != null && passwordHash != null && passwordEncoder.matches(raw, passwordHash);
    }

    public boolean isAuthenticatorReady(UserProfile profile) {
        return profile != null
                && Boolean.TRUE.equals(profile.getAuthenticatorEnabled())
                && normalizeOptional(profile.getAuthenticatorSecret()) != null;
    }

    public boolean isPinReady(UserProfile profile) {
        return profile != null
                && Boolean.TRUE.equals(profile.getPinChallengeEnabled())
                && normalizeOptional(profile.getSecurityPinHash()) != null;
    }

    private void requireCurrentPassword(User user, String currentPassword) {
        if (!verifyPassword(user, currentPassword)) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
    }

    private UserProfile requireProfile(User user) {
        UserProfile profile = user != null ? user.getProfile() : null;
        if (profile == null) {
            profile = new UserProfile();
            user.setProfile(profile);
        }
        return profile;
    }

    private String buildOtpAuthUrl(String accountName, String secret) {
        String label = urlEncode(ISSUER + ":" + normalizeOptional(accountName));
        return "otpauth://totp/" + label
                + "?secret=" + secret
                + "&issuer=" + urlEncode(ISSUER)
                + "&algorithm=SHA1&digits=" + TOTP_DIGITS
                + "&period=" + TOTP_PERIOD_SECONDS;
    }

    private String urlEncode(String value) {
        return URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8);
    }

    private String generateBase32Secret() {
        byte[] bytes = new byte[SECRET_BYTE_LENGTH];
        secureRandom.nextBytes(bytes);
        return base32Encode(bytes);
    }

    private List<String> generateRecoveryCodes() {
        List<String> codes = new ArrayList<>();
        for (int index = 0; index < RECOVERY_CODE_COUNT; index++) {
            StringBuilder builder = new StringBuilder();
            for (int characterIndex = 0; characterIndex < RECOVERY_CODE_LENGTH; characterIndex++) {
                int alphabetIndex = secureRandom.nextInt(BASE32_ALPHABET.length());
                builder.append(BASE32_ALPHABET.charAt(alphabetIndex));
            }
            codes.add(builder.substring(0, 5) + "-" + builder.substring(5));
        }
        return codes;
    }

    private List<String> hashRecoveryCodes(List<String> codes) {
        List<String> hashes = new ArrayList<>();
        for (String code : codes) {
            hashes.add(passwordEncoder.encode(code));
        }
        return hashes;
    }

    private boolean consumeRecoveryCode(UserProfile profile, String recoveryCode) {
        String normalized = normalizeRecoveryCode(recoveryCode);
        if (normalized == null || profile.getRecoveryCodeHashes() == null || profile.getRecoveryCodeHashes().isEmpty()) {
            return false;
        }

        List<String> remainingHashes = new ArrayList<>();
        boolean matched = false;
        for (String hash : profile.getRecoveryCodeHashes()) {
            if (!matched && passwordEncoder.matches(normalized, hash)) {
                matched = true;
                continue;
            }
            remainingHashes.add(hash);
        }

        if (matched) {
            profile.setRecoveryCodeHashes(remainingHashes);
            profile.setRecoveryCodesRemaining(remainingHashes.size());
        }
        return matched;
    }

    private boolean isValidTotpCode(String secret, String code) {
        String normalizedCode = normalizeDigits(code);
        if (normalizedCode == null) {
            return false;
        }

        byte[] secretBytes = base32Decode(secret);
        long currentCounter = Instant.now().getEpochSecond() / TOTP_PERIOD_SECONDS;
        for (long offset = -TOTP_WINDOW; offset <= TOTP_WINDOW; offset++) {
            String expected = generateTotp(secretBytes, currentCounter + offset);
            if (normalizedCode.equals(expected)) {
                return true;
            }
        }
        return false;
    }

    private String generateTotp(byte[] secretBytes, long counter) {
        try {
            byte[] counterBytes = ByteBuffer.allocate(8).putLong(counter).array();
            Mac mac = Mac.getInstance(TOTP_ALGORITHM);
            mac.init(new SecretKeySpec(secretBytes, TOTP_ALGORITHM));
            byte[] hash = mac.doFinal(counterBytes);
            int offset = hash[hash.length - 1] & 0x0F;
            int binary = ((hash[offset] & 0x7F) << 24)
                    | ((hash[offset + 1] & 0xFF) << 16)
                    | ((hash[offset + 2] & 0xFF) << 8)
                    | (hash[offset + 3] & 0xFF);
            int otp = binary % 1_000_000;
            return String.format(Locale.ROOT, "%06d", otp);
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("Unable to generate authenticator code", exception);
        }
    }

    private String base32Encode(byte[] bytes) {
        StringBuilder builder = new StringBuilder();
        int buffer = 0;
        int bitsLeft = 0;
        for (byte current : bytes) {
            buffer = (buffer << 8) | (current & 0xFF);
            bitsLeft += 8;
            while (bitsLeft >= 5) {
                int index = (buffer >> (bitsLeft - 5)) & 0x1F;
                bitsLeft -= 5;
                builder.append(BASE32_ALPHABET.charAt(index));
            }
        }
        if (bitsLeft > 0) {
            int index = (buffer << (5 - bitsLeft)) & 0x1F;
            builder.append(BASE32_ALPHABET.charAt(index));
        }
        return builder.toString();
    }

    private byte[] base32Decode(String secret) {
        String normalized = normalizeOptional(secret);
        if (normalized == null) {
            return new byte[0];
        }

        int buffer = 0;
        int bitsLeft = 0;
        ByteBuffer output = ByteBuffer.allocate((normalized.length() * 5) / 8 + 1);
        for (char character : normalized.toUpperCase(Locale.ROOT).toCharArray()) {
            if (character == '=') {
                break;
            }
            int index = BASE32_ALPHABET.indexOf(character);
            if (index < 0) {
                continue;
            }
            buffer = (buffer << 5) | index;
            bitsLeft += 5;
            if (bitsLeft >= 8) {
                output.put((byte) ((buffer >> (bitsLeft - 8)) & 0xFF));
                bitsLeft -= 8;
            }
        }

        byte[] bytes = new byte[output.position()];
        output.flip();
        output.get(bytes);
        return bytes;
    }

    private String normalizeDigits(String value) {
        String normalized = normalizeOptional(value);
        if (normalized == null) {
            return null;
        }
        String digits = normalized.replaceAll("\\s+", "");
        return digits.matches("\\d{6}") ? digits : null;
    }

    private String normalizeRecoveryCode(String value) {
        String normalized = normalizeOptional(value);
        if (normalized == null) {
            return null;
        }
        String compact = normalized.replaceAll("[^A-Za-z2-7]", "").toUpperCase(Locale.ROOT);
        if (compact.length() != RECOVERY_CODE_LENGTH) {
            return null;
        }
        return compact.substring(0, 5) + "-" + compact.substring(5);
    }

    private String normalizePin(String value) {
        String normalized = normalizeOptional(value);
        if (normalized == null) {
            return null;
        }
        String digits = normalized.replaceAll("\\s+", "");
        return digits.matches("\\d{4,8}") ? digits : null;
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }

    public record AuthenticatorSetup(
            String secret,
            String otpAuthUrl,
            String issuer,
            String accountName
    ) {
    }

    public record ActivationResult(
            List<String> recoveryCodes
    ) {
    }
}
