package com.sabahub.web.dto;

public record LoginResponse(
        String token,
        String email,
        String username,
        String fullName,
        boolean requiresTwoFactor,
        String challengeId,
        String twoFactorMethod,
        String message
) {
}
