package com.sabahub.config;

import io.github.cdimascio.dotenv.Dotenv;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.lang.NonNull;

import java.util.HashMap;
import java.util.Map;

/**
 * Loads environment variables from .env file before Spring Boot starts
 * This allows using .env file for local development configuration
 */
@Slf4j
public class DotenvConfig implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    @Override
    public void initialize(@NonNull ConfigurableApplicationContext applicationContext) {
        try {
            // Load .env file from the project root
            Dotenv dotenv = Dotenv.configure()
                    .ignoreIfMissing()  // Don't fail if .env doesn't exist
                    .load();

            // Convert dotenv entries to a Map
            Map<String, Object> dotenvProperties = new HashMap<>();
            dotenv.entries().forEach(entry -> {
                dotenvProperties.put(entry.getKey(), entry.getValue());
            });

            // Normalize MongoDB URI env var names (support both legacy and Spring-standard keys)
            String springMongoUri = toTrimmedString(dotenvProperties.get("SPRING_DATA_MONGODB_URI"));
            String legacyMongoUri = toTrimmedString(dotenvProperties.get("MONGODB_URI"));
            if (isBlank(springMongoUri) && !isBlank(legacyMongoUri)) {
                dotenvProperties.put("SPRING_DATA_MONGODB_URI", legacyMongoUri);
                log.info("ℹ️ Mapped MONGODB_URI -> SPRING_DATA_MONGODB_URI");
            } else if (isBlank(legacyMongoUri) && !isBlank(springMongoUri)) {
                dotenvProperties.put("MONGODB_URI", springMongoUri);
                log.info("ℹ️ Mapped SPRING_DATA_MONGODB_URI -> MONGODB_URI");
            } else if (!isBlank(springMongoUri) && !isBlank(legacyMongoUri) && !springMongoUri.equals(legacyMongoUri)) {
                log.warn("⚠️ Both SPRING_DATA_MONGODB_URI and MONGODB_URI are set and differ. SPRING_DATA_MONGODB_URI will be used.");
            }

            // Add to Spring environment with high priority
            ConfigurableEnvironment environment = applicationContext.getEnvironment();
            environment.getPropertySources().addFirst(
                    new MapPropertySource("dotenvProperties", dotenvProperties)
            );

            log.info("✅ Loaded {} properties from .env file", dotenvProperties.size());
            
            // Log loaded email configuration (without sensitive data)
            if (dotenvProperties.containsKey("SMTP_USERNAME")) {
                log.info("✅ SMTP_USERNAME configured: {}", dotenvProperties.get("SMTP_USERNAME"));
            }
            if (dotenvProperties.containsKey("TWILIO_ACCOUNT_SID")) {
                log.info("✅ TWILIO_ACCOUNT_SID configured");
            }
            
        } catch (Exception e) {
            log.warn("⚠️ Failed to load .env file: {}. Using system environment variables.", e.getMessage());
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private static String toTrimmedString(Object value) {
        if (value == null) {
            return null;
        }
        String str = String.valueOf(value);
        return str.trim().isEmpty() ? null : str.trim();
    }
}
