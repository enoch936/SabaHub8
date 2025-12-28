package com.sabahub.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "rate.limit")
public class RateLimitProperties {
    private int windowSeconds = 60;
    private int chapaInitPerMinute = 5;
    private int localRequestPerMinute = 5;
    private int adminVerifyPerMinute = 20;
    private int webhookPerMinutePerIp = 60;

    public int getWindowSeconds() { return windowSeconds; }
    public void setWindowSeconds(int windowSeconds) { this.windowSeconds = windowSeconds; }

    public int getChapaInitPerMinute() { return chapaInitPerMinute; }
    public void setChapaInitPerMinute(int chapaInitPerMinute) { this.chapaInitPerMinute = chapaInitPerMinute; }

    public int getLocalRequestPerMinute() { return localRequestPerMinute; }
    public void setLocalRequestPerMinute(int localRequestPerMinute) { this.localRequestPerMinute = localRequestPerMinute; }

    public int getAdminVerifyPerMinute() { return adminVerifyPerMinute; }
    public void setAdminVerifyPerMinute(int adminVerifyPerMinute) { this.adminVerifyPerMinute = adminVerifyPerMinute; }

    public int getWebhookPerMinutePerIp() { return webhookPerMinutePerIp; }
    public void setWebhookPerMinutePerIp(int webhookPerMinutePerIp) { this.webhookPerMinutePerIp = webhookPerMinutePerIp; }
}