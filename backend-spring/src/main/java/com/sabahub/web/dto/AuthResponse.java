package com.sabahub.web.dto;

public record AuthResponse(String token, String email, String fullName) {
}
