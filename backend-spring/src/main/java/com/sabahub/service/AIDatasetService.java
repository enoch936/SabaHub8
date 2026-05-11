package com.sabahub.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sabahub.config.AIEngineProperties;
import com.sabahub.domain.AIDatasetRecord;
import com.sabahub.domain.User;
import com.sabahub.repository.AIDatasetRecordRepository;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class AIDatasetService {
    private final AIDatasetRecordRepository repository;
    private final CurrentUserService currentUserService;
    private final AIEngineProperties aiEngineProperties;
    private final ObjectMapper objectMapper;

    public AIDatasetService(AIDatasetRecordRepository repository,
                            CurrentUserService currentUserService,
                            AIEngineProperties aiEngineProperties,
                            ObjectMapper objectMapper) {
        this.repository = repository;
        this.currentUserService = currentUserService;
        this.aiEngineProperties = aiEngineProperties;
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> importLocalDataset(String datasetType, String path, String format, String delimiter, Integer maxRows) {
        requireAdmin();

        if (!aiEngineProperties.isAllowDatasetImport()) {
            throw new IllegalStateException("Local dataset import is disabled by configuration");
        }
        if (path == null || path.isBlank()) {
            throw new IllegalArgumentException("Path is required");
        }
        Path input = Path.of(path).normalize();
        if (!Files.exists(input) || !Files.isRegularFile(input)) {
            throw new IllegalArgumentException("Dataset file not found: " + input);
        }

        int hardCap = Math.max(1, aiEngineProperties.getDatasetImportMaxRows());
        int rowCap = Math.min(hardCap, maxRows == null ? hardCap : Math.max(1, maxRows));
        String normalizedFormat = format == null ? inferFormat(input) : format.trim().toUpperCase(Locale.ROOT);
        String normalizedType = datasetType == null || datasetType.isBlank() ? "generic" : datasetType.trim().toLowerCase(Locale.ROOT);
        String batchId = "batch-" + Instant.now().toEpochMilli() + "-" + UUID.randomUUID().toString().substring(0, 8);

        int imported;
        if ("JSONL".equals(normalizedFormat)) {
            imported = importJsonl(input, normalizedType, batchId, rowCap);
        } else if ("CSV".equals(normalizedFormat)) {
            imported = importCsv(input, normalizedType, batchId, rowCap, delimiter == null || delimiter.isBlank() ? "," : delimiter);
        } else {
            throw new IllegalArgumentException("Unsupported format. Use CSV or JSONL.");
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("ok", true);
        result.put("batchId", batchId);
        result.put("datasetType", normalizedType);
        result.put("format", normalizedFormat);
        result.put("sourcePath", input.toString());
        result.put("importedRows", imported);
        result.put("engineMode", aiEngineProperties.getMode());
        return result;
    }

    public Map<String, Object> datasetStats() {
        requireAdmin();

        long total = repository.count();
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRecords", total);
        response.put("jobsRecords", repository.countByDatasetType("jobs"));
        response.put("freelancersRecords", repository.countByDatasetType("freelancers"));
        response.put("transactionsRecords", repository.countByDatasetType("transactions"));
        response.put("genericRecords", repository.countByDatasetType("generic"));
        response.put("mode", aiEngineProperties.getMode());
        return response;
    }

    private User requireAdmin() {
        User user = currentUserService.requireUser();
        boolean allowed = currentUserService.hasRole(user, "ADMIN")
                || currentUserService.hasRole(user, "SUPER_ADMIN");
        if (!allowed) {
            throw new IllegalStateException("Forbidden");
        }
        return user;
    }

    private int importJsonl(Path input, String datasetType, String batchId, int rowCap) {
        List<AIDatasetRecord> chunk = new ArrayList<>();
        int imported = 0;
        try (BufferedReader reader = Files.newBufferedReader(input)) {
            String line;
            while ((line = reader.readLine()) != null && imported < rowCap) {
                String trimmed = line.trim();
                if (trimmed.isBlank()) continue;
                Map<String, Object> payload = objectMapper.readValue(trimmed, new TypeReference<>() {});
                chunk.add(buildRecord(datasetType, input.toString(), batchId, payload));
                imported++;
                if (chunk.size() >= 500) {
                    repository.saveAll(chunk);
                    chunk.clear();
                }
            }
            if (!chunk.isEmpty()) {
                repository.saveAll(chunk);
            }
        } catch (IOException e) {
            throw new IllegalStateException("Failed to import JSONL dataset: " + e.getMessage(), e);
        }
        return imported;
    }

    private int importCsv(Path input, String datasetType, String batchId, int rowCap, String delimiter) {
        List<AIDatasetRecord> chunk = new ArrayList<>();
        int imported = 0;
        try (BufferedReader reader = Files.newBufferedReader(input)) {
            String headerLine = reader.readLine();
            if (headerLine == null || headerLine.isBlank()) return 0;
            String[] headers = splitCsv(headerLine, delimiter);

            String line;
            while ((line = reader.readLine()) != null && imported < rowCap) {
                if (line.trim().isBlank()) continue;
                String[] cols = splitCsv(line, delimiter);
                Map<String, Object> payload = new LinkedHashMap<>();
                for (int i = 0; i < headers.length; i++) {
                    String key = headers[i] == null ? "" : headers[i].trim();
                    if (key.isBlank()) continue;
                    payload.put(key, i < cols.length ? cols[i] : "");
                }
                chunk.add(buildRecord(datasetType, input.toString(), batchId, payload));
                imported++;
                if (chunk.size() >= 500) {
                    repository.saveAll(chunk);
                    chunk.clear();
                }
            }
            if (!chunk.isEmpty()) {
                repository.saveAll(chunk);
            }
        } catch (IOException e) {
            throw new IllegalStateException("Failed to import CSV dataset: " + e.getMessage(), e);
        }
        return imported;
    }

    private AIDatasetRecord buildRecord(String datasetType, String sourcePath, String batchId, Map<String, Object> payload) {
        AIDatasetRecord rec = new AIDatasetRecord();
        rec.setDatasetType(datasetType);
        rec.setSourcePath(sourcePath);
        rec.setBatchId(batchId);
        rec.setPayload(payload);
        return rec;
    }

    private String inferFormat(Path input) {
        String name = input.getFileName().toString().toLowerCase(Locale.ROOT);
        if (name.endsWith(".jsonl")) return "JSONL";
        if (name.endsWith(".csv")) return "CSV";
        return "CSV";
    }

    private String[] splitCsv(String line, String delimiter) {
        String sep = delimiter == null || delimiter.isEmpty() ? "," : delimiter;
        List<String> out = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;

        for (int i = 0; i < line.length(); i++) {
            char ch = line.charAt(i);
            if (ch == '"') {
                inQuotes = !inQuotes;
                continue;
            }
            if (!inQuotes && line.startsWith(sep, i)) {
                out.add(current.toString().trim());
                current.setLength(0);
                i += sep.length() - 1;
                continue;
            }
            current.append(ch);
        }
        out.add(current.toString().trim());
        return out.toArray(new String[0]);
    }
}
