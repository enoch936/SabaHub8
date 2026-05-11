package com.sabahub.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "ai.engine")
public class AIEngineProperties {
    /**
     * SPRING_LOCAL | HYBRID | PYTHON_LOCAL
     */
    private String mode = "SPRING_LOCAL";
    private boolean pythonEnabled = false;
    private String pythonBaseUrl = "http://localhost:8090";
    private int connectTimeoutMs = 1200;
    private int readTimeoutMs = 1800;
    private double pythonBlendWeight = 0.35d;
    private boolean pythonJobsEnabled = true;
    private boolean pythonFreelancersEnabled = true;
    private boolean pythonFraudEnabled = true;
    private boolean pythonChatEnabled = true;
    private double pythonJobsBlendWeight = 0.40d;
    private double pythonFreelancersBlendWeight = 0.45d;
    private double pythonFraudBlendWeight = 0.55d;
    private double pythonChatBlendWeight = 0.65d;
    private boolean strictPython = false;
    private boolean allowDatasetImport = true;
    private int datasetImportMaxRows = 100000;

    public String getMode() {
        return mode;
    }

    public void setMode(String mode) {
        this.mode = mode;
    }

    public boolean isPythonEnabled() {
        return pythonEnabled;
    }

    public void setPythonEnabled(boolean pythonEnabled) {
        this.pythonEnabled = pythonEnabled;
    }

    public String getPythonBaseUrl() {
        return pythonBaseUrl;
    }

    public void setPythonBaseUrl(String pythonBaseUrl) {
        this.pythonBaseUrl = pythonBaseUrl;
    }

    public int getConnectTimeoutMs() {
        return connectTimeoutMs;
    }

    public void setConnectTimeoutMs(int connectTimeoutMs) {
        this.connectTimeoutMs = connectTimeoutMs;
    }

    public int getReadTimeoutMs() {
        return readTimeoutMs;
    }

    public void setReadTimeoutMs(int readTimeoutMs) {
        this.readTimeoutMs = readTimeoutMs;
    }

    public double getPythonBlendWeight() {
        return pythonBlendWeight;
    }

    public void setPythonBlendWeight(double pythonBlendWeight) {
        this.pythonBlendWeight = pythonBlendWeight;
    }

    public boolean isPythonJobsEnabled() {
        return pythonJobsEnabled;
    }

    public void setPythonJobsEnabled(boolean pythonJobsEnabled) {
        this.pythonJobsEnabled = pythonJobsEnabled;
    }

    public boolean isPythonFreelancersEnabled() {
        return pythonFreelancersEnabled;
    }

    public void setPythonFreelancersEnabled(boolean pythonFreelancersEnabled) {
        this.pythonFreelancersEnabled = pythonFreelancersEnabled;
    }

    public boolean isPythonFraudEnabled() {
        return pythonFraudEnabled;
    }

    public void setPythonFraudEnabled(boolean pythonFraudEnabled) {
        this.pythonFraudEnabled = pythonFraudEnabled;
    }

    public boolean isPythonChatEnabled() {
        return pythonChatEnabled;
    }

    public void setPythonChatEnabled(boolean pythonChatEnabled) {
        this.pythonChatEnabled = pythonChatEnabled;
    }

    public double getPythonJobsBlendWeight() {
        return pythonJobsBlendWeight;
    }

    public void setPythonJobsBlendWeight(double pythonJobsBlendWeight) {
        this.pythonJobsBlendWeight = pythonJobsBlendWeight;
    }

    public double getPythonFreelancersBlendWeight() {
        return pythonFreelancersBlendWeight;
    }

    public void setPythonFreelancersBlendWeight(double pythonFreelancersBlendWeight) {
        this.pythonFreelancersBlendWeight = pythonFreelancersBlendWeight;
    }

    public double getPythonFraudBlendWeight() {
        return pythonFraudBlendWeight;
    }

    public void setPythonFraudBlendWeight(double pythonFraudBlendWeight) {
        this.pythonFraudBlendWeight = pythonFraudBlendWeight;
    }

    public double getPythonChatBlendWeight() {
        return pythonChatBlendWeight;
    }

    public void setPythonChatBlendWeight(double pythonChatBlendWeight) {
        this.pythonChatBlendWeight = pythonChatBlendWeight;
    }

    public boolean isStrictPython() {
        return strictPython;
    }

    public void setStrictPython(boolean strictPython) {
        this.strictPython = strictPython;
    }

    public boolean isAllowDatasetImport() {
        return allowDatasetImport;
    }

    public void setAllowDatasetImport(boolean allowDatasetImport) {
        this.allowDatasetImport = allowDatasetImport;
    }

    public int getDatasetImportMaxRows() {
        return datasetImportMaxRows;
    }

    public void setDatasetImportMaxRows(int datasetImportMaxRows) {
        this.datasetImportMaxRows = datasetImportMaxRows;
    }

    public boolean isHybridMode() {
        return "HYBRID".equalsIgnoreCase(mode);
    }

    public boolean isPythonLocalMode() {
        return "PYTHON_LOCAL".equalsIgnoreCase(mode);
    }

    public boolean shouldUsePythonBridge() {
        return pythonEnabled && (isHybridMode() || isPythonLocalMode());
    }

    public boolean shouldUsePythonJobs() {
        return shouldUsePythonBridge() && pythonJobsEnabled;
    }

    public boolean shouldUsePythonFreelancers() {
        return shouldUsePythonBridge() && pythonFreelancersEnabled;
    }

    public boolean shouldUsePythonFraud() {
        return shouldUsePythonBridge() && pythonFraudEnabled;
    }

    public boolean shouldUsePythonChat() {
        return shouldUsePythonBridge() && pythonChatEnabled;
    }
}
