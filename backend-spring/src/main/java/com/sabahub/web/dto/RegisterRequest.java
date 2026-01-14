package com.sabahub.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Email String email,
        String fullName,
        String firstName,
        String lastName,
        @NotBlank @Size(min = 8, max = 128) String password,
        String role
) {
    public String resolvedFullName() {
        if (fullName != null && !fullName.isBlank()) {
            return fullName.trim();
        }
        String fn = firstName != null ? firstName.trim() : "";
        String ln = lastName != null ? lastName.trim() : "";
        String combined = (fn + " " + ln).trim();
        return combined.isEmpty() ? null : combined;
    }
}
