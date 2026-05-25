package com.sabahub.service;

import com.sabahub.web.dto.admin.AdminCommandCenterDTOs;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AdminAIAssistantService {

    private final PythonAiBridgeService pythonAiBridgeService;
    private final AdminCommandCenterService adminCommandCenterService;

    public Map<String, Object> processCommand(String command) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("command", command);

        // Enrich with platform data if the command suggests a need for context
        String lower = command.toLowerCase();
        if (lower.contains("summary") || lower.contains("analyze") || lower.contains("anomaly") || lower.contains("platform")) {
            AdminCommandCenterDTOs.OverviewResponse overview = adminCommandCenterService.getOverview();
            Map<String, Object> stats = new HashMap<>();
            overview.metrics().forEach(m -> {
                stats.put(m.id(), parseValue(m.value()));
            });
            payload.put("data", stats);
        }

        Optional<Map<String, Object>> response = pythonAiBridgeService.adminAssist(payload);
        
        if (response.isPresent()) {
            return response.get();
        }

        // Fallback local logic if Python is down
        return getLocalFallback(command);
    }

    private Object parseValue(String val) {
        if (val == null) return 0;
        try {
            return Double.parseDouble(val.replace("%", "").replace("$", "").replace(",", ""));
        } catch (Exception e) {
            return val;
        }
    }

    private Map<String, Object> getLocalFallback(String command) {
        Map<String, Object> res = new HashMap<>();
        res.put("answer", "I'm having trouble connecting to the advanced AI engine, but I can still help with basic queries. Ask me about platform status or recent metrics.");
        res.put("confidence", 0.3);
        res.put("engine", "local-fallback");
        return res;
    }
}
