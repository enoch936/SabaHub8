package com.sabahub.config;

import io.github.cdimascio.dotenv.Dotenv;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.util.HashMap;
import java.util.Map;

/**
 * Loads environment variables from .env file before Spring Boot starts
 * This allows using .env file for local development configuration
 */
@Slf4j
public class DotenvConfig implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
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
}
