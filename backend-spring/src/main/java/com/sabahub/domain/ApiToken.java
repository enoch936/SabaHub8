package com.sabahub.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "api_tokens")
public class ApiToken {
    @Id
    private String id;
    private String userId;
    private String name;
    private String token; // Hashed or encrypted
    private String prefix; // First few characters for identification
    private List<String> scopes;
    private boolean active;
    
    @CreatedDate
    private Instant createdAt;
    private Instant expiresAt;
    private Instant lastUsedAt;
}
