package com.sabahub.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sabahub.config.AIEngineProperties;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class PythonAiBridgeService {
    private final AIEngineProperties aiEngineProperties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public PythonAiBridgeService(AIEngineProperties aiEngineProperties, ObjectMapper objectMapper) {
        this.aiEngineProperties = aiEngineProperties;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(Math.max(100, aiEngineProperties.getConnectTimeoutMs())))
                .build();
    }

    public boolean ping() {
        if (!aiEngineProperties.shouldUsePythonBridge()) {
            return false;
        }
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl() + "/health"))
                    .timeout(Duration.ofMillis(Math.max(200, aiEngineProperties.getReadTimeoutMs())))
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() >= 200 && response.statusCode() < 300;
        } catch (Exception ignored) {
            return false;
        }
    }

    public Optional<List<Map<String, Object>>> rerankJobRecommendations(Map<String, Object> payload) {
        return postForList("/score/jobs/recommend", payload, "items");
    }

    public Optional<List<Map<String, Object>>> rerankFreelancerMatches(Map<String, Object> payload) {
        return postForList("/score/freelancers/match", payload, "items");
    }

    public Optional<Map<String, Object>> scoreFraudRisk(Map<String, Object> payload) {
        return postForMap("/score/fraud", payload);
    }

    public Optional<Map<String, Object>> assistChatbot(Map<String, Object> payload) {
        return postForMap("/assist/chatbot", payload);
    }

    public Optional<Map<String, Object>> adminAssist(Map<String, Object> payload) {
        return postForMap("/admin/assist", payload);
    }

    public Optional<Map<String, Object>> classifyTaxonomy(Map<String, Object> payload) {
        return postForMap("/classify/taxonomy", payload);
    }

    public Optional<Map<String, Object>> taxonomyLearningSummary() {
        return getForMap("/classify/taxonomy/learning");
    }

    public Optional<Map<String, Object>> triggerTraining(boolean activate) {
        return postForMap("/admin/train", Map.of("activate", activate));
    }

    public Optional<Map<String, Object>> listModelVersions() {
        return getForMap("/admin/models");
    }

    public Optional<Map<String, Object>> activateModelVersion(String version) {
        return postForMap("/admin/models/activate", Map.of("version", version));
    }

    public Optional<Map<String, Object>> rollbackModelVersion(int steps) {
        return postForMap("/admin/models/rollback", Map.of("steps", steps));
    }

    public Optional<Map<String, Object>> reloadModels() {
        return postForMap("/admin/reload", Map.of());
    }

    private Optional<Map<String, Object>> getForMap(String path) {
        if (!aiEngineProperties.shouldUsePythonBridge()) {
            return Optional.empty();
        }
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl() + path))
                    .timeout(Duration.ofMillis(Math.max(300, aiEngineProperties.getReadTimeoutMs())))
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return Optional.empty();
            }
            Map<String, Object> mapped = objectMapper.readValue(response.body(), new TypeReference<>() {});
            return Optional.of(mapped);
        } catch (Exception ignored) {
            return Optional.empty();
        }
    }

    private Optional<List<Map<String, Object>>> postForList(String path, Map<String, Object> payload, String listField) {
        Optional<Map<String, Object>> response = postForMap(path, payload);
        if (response.isEmpty()) {
            return Optional.empty();
        }
        Object value = response.get().get(listField);
        if (!(value instanceof List<?> rawList)) {
            return Optional.empty();
        }
        List<Map<String, Object>> mapped = rawList.stream()
                .filter(item -> item instanceof Map<?, ?>)
                .map(item -> (Map<String, Object>) item)
                .toList();
        return Optional.of(mapped);
    }

    private Optional<Map<String, Object>> postForMap(String path, Map<String, Object> payload) {
        if (!aiEngineProperties.shouldUsePythonBridge()) {
            return Optional.empty();
        }
        try {
            String body = objectMapper.writeValueAsString(payload);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl() + path))
                    .timeout(Duration.ofMillis(Math.max(300, aiEngineProperties.getReadTimeoutMs())))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return Optional.empty();
            }
            Map<String, Object> mapped = objectMapper.readValue(response.body(), new TypeReference<>() {});
            return Optional.of(mapped);
        } catch (Exception ignored) {
            return Optional.empty();
        }
    }

    private String baseUrl() {
        String base = aiEngineProperties.getPythonBaseUrl();
        if (base == null || base.isBlank()) return "http://localhost:8090";
        return base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
    }
}
