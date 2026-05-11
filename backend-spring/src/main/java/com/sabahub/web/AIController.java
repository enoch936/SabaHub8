package com.sabahub.web;

import com.sabahub.service.AIInsightsService;
import com.sabahub.service.AIModelOpsService;
import com.sabahub.service.AIDatasetService;
import com.sabahub.service.AITaxonomyService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@Validated
public class AIController {

    private final AIInsightsService aiInsightsService;
    private final AIDatasetService aiDatasetService;
    private final AIModelOpsService aiModelOpsService;
    private final AITaxonomyService aiTaxonomyService;

    public AIController(AIInsightsService aiInsightsService,
                        AIDatasetService aiDatasetService,
                        AIModelOpsService aiModelOpsService,
                        AITaxonomyService aiTaxonomyService) {
        this.aiInsightsService = aiInsightsService;
        this.aiDatasetService = aiDatasetService;
        this.aiModelOpsService = aiModelOpsService;
        this.aiTaxonomyService = aiTaxonomyService;
    }

    @GetMapping("/engine/status")
    public ResponseEntity<Map<String, Object>> engineStatus() {
        return ResponseEntity.ok(aiInsightsService.engineStatus());
    }

    @GetMapping("/recommend/jobs")
    public ResponseEntity<List<Map<String, Object>>> recommendJobs(
            @RequestParam(defaultValue = "8") @Min(1) @Max(50) int limit) {
        return ResponseEntity.ok(aiInsightsService.recommendJobsForCurrentUser(limit));
    }

    @GetMapping("/match/freelancers/{jobId}")
    public ResponseEntity<List<Map<String, Object>>> matchFreelancers(
            @PathVariable String jobId,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int limit) {
        return ResponseEntity.ok(aiInsightsService.matchFreelancersForJob(jobId, limit));
    }

    @PostMapping("/fraud/check")
    public ResponseEntity<Map<String, Object>> checkFraudRisk(@RequestBody FraudRiskRequest request) {
        return ResponseEntity.ok(aiInsightsService.evaluateFraudRisk(
                request.amount(),
                request.currency(),
                request.paymentMethod(),
                request.recipientCountry()));
    }

    @PostMapping("/chatbot/assist")
    public ResponseEntity<Map<String, Object>> chatbotAssist(@RequestBody ChatbotRequest request) {
        return ResponseEntity.ok(aiInsightsService.assistChatbot(
                request.prompt(),
                request.contextType(),
                request.contextId()));
    }

    @PostMapping("/dataset/import-local")
    public ResponseEntity<Map<String, Object>> importLocalDataset(@RequestBody DatasetImportRequest request) {
        return ResponseEntity.ok(aiDatasetService.importLocalDataset(
                request.datasetType(),
                request.path(),
                request.format(),
                request.delimiter(),
                request.maxRows()));
    }

    @GetMapping("/dataset/stats")
    public ResponseEntity<Map<String, Object>> datasetStats() {
        return ResponseEntity.ok(aiDatasetService.datasetStats());
    }

    @GetMapping("/taxonomy/learning")
    public ResponseEntity<Map<String, Object>> taxonomyLearningSummary() {
        return ResponseEntity.ok(aiTaxonomyService.learningSummary());
    }

    @PostMapping("/model/train")
    public ResponseEntity<Map<String, Object>> trainModel(@RequestBody(required = false) TrainModelRequest request) {
        boolean activate = request == null || request.activate() == null || request.activate();
        return ResponseEntity.ok(aiModelOpsService.trainModel(activate));
    }

    @GetMapping("/model/versions")
    public ResponseEntity<Map<String, Object>> modelVersions() {
        return ResponseEntity.ok(aiModelOpsService.listModelVersions());
    }

    @PostMapping("/model/activate")
    public ResponseEntity<Map<String, Object>> activateModel(@RequestBody ActivateModelRequest request) {
        return ResponseEntity.ok(aiModelOpsService.activateModelVersion(request.version()));
    }

    @PostMapping("/model/rollback")
    public ResponseEntity<Map<String, Object>> rollbackModel(@RequestBody(required = false) RollbackModelRequest request) {
        int steps = request == null || request.steps() == null ? 1 : request.steps();
        return ResponseEntity.ok(aiModelOpsService.rollbackModelVersion(steps));
    }

    @PostMapping("/model/reload")
    public ResponseEntity<Map<String, Object>> reloadModels() {
        return ResponseEntity.ok(aiModelOpsService.reloadModels());
    }

    public record FraudRiskRequest(
            @Min(0) double amount,
            String currency,
            String paymentMethod,
            String recipientCountry
    ) {
    }

    public record ChatbotRequest(
            @NotBlank String prompt,
            String contextType,
            String contextId
    ) {
    }

    public record DatasetImportRequest(
            @NotBlank String datasetType,
            @NotBlank String path,
            String format,
            String delimiter,
            Integer maxRows
    ) {
    }

    public record TrainModelRequest(Boolean activate) {
    }

    public record ActivateModelRequest(@NotBlank String version) {
    }

    public record RollbackModelRequest(@Min(1) @Max(20) Integer steps) {
    }
}
