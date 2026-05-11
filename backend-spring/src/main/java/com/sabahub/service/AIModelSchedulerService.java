package com.sabahub.service;

import com.sabahub.config.AIEngineProperties;
import com.sabahub.config.AIModelSchedulerProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class AIModelSchedulerService {
    private static final Logger log = LoggerFactory.getLogger(AIModelSchedulerService.class);

    private final AIModelSchedulerProperties schedulerProperties;
    private final AIEngineProperties aiEngineProperties;
    private final AIModelOpsService aiModelOpsService;

    public AIModelSchedulerService(AIModelSchedulerProperties schedulerProperties,
                                   AIEngineProperties aiEngineProperties,
                                   AIModelOpsService aiModelOpsService) {
        this.schedulerProperties = schedulerProperties;
        this.aiEngineProperties = aiEngineProperties;
        this.aiModelOpsService = aiModelOpsService;
    }

    @Scheduled(cron = "${ai.model.scheduler.cron:0 0 3 * * *}")
    public void scheduledRetrain() {
        if (!schedulerProperties.isEnabled()) {
            return;
        }
        if (!aiEngineProperties.shouldUsePythonBridge()) {
            log.warn("Skipping scheduled AI retrain: Python bridge is disabled");
            return;
        }

        Map<String, Object> result = aiModelOpsService.trainModelByScheduler(
                schedulerProperties.isActivateAfterTrain(),
                "scheduler"
        );
        Object ok = result.get("ok");
        if (Boolean.TRUE.equals(ok)) {
            log.info("Scheduled AI retrain completed: {}", result);
        } else {
            log.error("Scheduled AI retrain failed: {}", result);
        }
    }
}
