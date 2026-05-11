package com.sabahub.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "ai.model.scheduler")
public class AIModelSchedulerProperties {
    private boolean enabled = false;
    private boolean activateAfterTrain = true;
    private String cron = "0 0 3 * * *";

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public boolean isActivateAfterTrain() {
        return activateAfterTrain;
    }

    public void setActivateAfterTrain(boolean activateAfterTrain) {
        this.activateAfterTrain = activateAfterTrain;
    }

    public String getCron() {
        return cron;
    }

    public void setCron(String cron) {
        this.cron = cron;
    }
}
