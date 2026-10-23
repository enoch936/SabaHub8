package com.sabahub.service;

import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class AIAssistantService {

    public Map<String, Object> processCommand(String command, Map<String, Object> context) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("command", command);
        result.put("status", "processed");
        result.put("response", "AI assistant processed: " + command);
        return result;
    }

    public Map<String, Object> getSuggestions(String userId, String category) {
        return Map.of(
                "userId", userId,
                "category", category != null ? category : "general",
                "suggestions", List.of()
        );
    }
}
