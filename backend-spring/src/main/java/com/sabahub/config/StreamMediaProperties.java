package com.sabahub.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.streaming.media")
public class StreamMediaProperties {

    private String hlsPublicBaseUrl = "http://localhost:8081/hls";
    private String rtmpIngestBaseUrl = "rtmp://localhost:1935/live";
    private String ingestCallbackSecret = "";

    public String getHlsPublicBaseUrl() {
        return hlsPublicBaseUrl;
    }

    public void setHlsPublicBaseUrl(String hlsPublicBaseUrl) {
        this.hlsPublicBaseUrl = hlsPublicBaseUrl;
    }

    public String getRtmpIngestBaseUrl() {
        return rtmpIngestBaseUrl;
    }

    public void setRtmpIngestBaseUrl(String rtmpIngestBaseUrl) {
        this.rtmpIngestBaseUrl = rtmpIngestBaseUrl;
    }

    public String getIngestCallbackSecret() {
        return ingestCallbackSecret;
    }

    public void setIngestCallbackSecret(String ingestCallbackSecret) {
        this.ingestCallbackSecret = ingestCallbackSecret;
    }
}
