package com.sabahub.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityEvent {
    private String id;
    private String type; // e.g., "USER_REGISTRATION", "PAYMENT", "MODERATION", "UPLOAD", "LOGIN", "DEPLOYMENT", "REPORT"
    private String message;
    private Instant timestamp;
    private String userId;
    private String username;
    private String avatarUrl;
    private String badge; // e.g., "new", "success", "warning", "info", "danger"
    private Map<String, Object> metadata;
}
