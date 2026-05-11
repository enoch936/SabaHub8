package com.sabahub.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AuthRequest(
        @NotBlank String identifier,
        @NotBlank @Size(min = 8, max = 128) String password
) {
}
