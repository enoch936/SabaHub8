package com.sabahub.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sabahub.config.WebPushProperties;
import com.sabahub.domain.Notification;
import com.sabahub.domain.User;
import com.sabahub.domain.WebPushSubscription;
import com.sabahub.repository.WebPushSubscriptionRepository;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.PushService;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.jose4j.lang.JoseException;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.security.Security;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@Service
@Slf4j
public class WebPushService {

    private final WebPushSubscriptionRepository subscriptionRepository;
    private final WebPushProperties properties;
    private final ObjectMapper objectMapper;

    static {
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
    }

    public WebPushService(WebPushSubscriptionRepository subscriptionRepository,
                          WebPushProperties properties,
                          ObjectMapper objectMapper) {
        this.subscriptionRepository = subscriptionRepository;
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    public boolean isConfigured() {
        return properties.isEnabled()
                && hasText(properties.getSubject())
                && hasText(properties.getPublicKey())
                && hasText(properties.getPrivateKey());
    }

    public String getPublicKey() {
        return isConfigured() ? properties.getPublicKey() : "";
    }

    public void saveSubscription(User user, String endpoint, String p256dh, String auth) {
        if (!isConfigured() || user == null || !hasText(user.getId())) {
            return;
        }

        WebPushSubscription subscription = subscriptionRepository
                .findByUserIdAndEndpoint(user.getId(), endpoint)
                .orElseGet(WebPushSubscription::new);

        subscription.setUserId(user.getId());
        subscription.setEndpoint(endpoint);
        subscription.setP256dh(p256dh);
        subscription.setAuth(auth);
        subscription.setUpdatedAt(Instant.now());

        subscriptionRepository.save(subscription);
    }

    public void removeSubscription(User user, String endpoint) {
        if (user == null || !hasText(user.getId()) || !hasText(endpoint)) {
            return;
        }

        subscriptionRepository.deleteByUserIdAndEndpoint(user.getId(), endpoint);
    }

    public void sendToUser(User user, Notification notification) {
        if (!isConfigured() || user == null || notification == null || !hasText(user.getId())) {
            return;
        }

        List<WebPushSubscription> subscriptions = subscriptionRepository.findByUserId(user.getId());
        if (subscriptions.isEmpty()) {
            return;
        }

        String body;
        try {
            body = objectMapper.writeValueAsString(toPushPayload(notification));
        } catch (JsonProcessingException e) {
            log.warn("Unable to serialize web push payload for notification {}", notification.getId(), e);
            return;
        }

        for (WebPushSubscription subscription : subscriptions) {
            sendToSubscription(subscription, body);
        }
    }

    private void sendToSubscription(WebPushSubscription subscription, String body) {
        try {
            PushService pushService = new PushService(
                    properties.getPublicKey(),
                    properties.getPrivateKey(),
                    properties.getSubject());

            nl.martijndwars.webpush.Notification pushNotification = new nl.martijndwars.webpush.Notification(
                    subscription.getEndpoint(),
                    subscription.getP256dh(),
                    subscription.getAuth(),
                    body
            );

            var response = pushService.send(pushNotification);
            int statusCode = response.getStatusLine().getStatusCode();

            if (statusCode == 404 || statusCode == 410) {
                subscriptionRepository.deleteById(subscription.getId());
            }
        } catch (GeneralSecurityException | IOException | JoseException | ExecutionException | InterruptedException e) {
            log.warn("Failed to deliver web push notification to endpoint {}", subscription.getEndpoint(), e);
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
        }
    }

    private Map<String, Object> toPushPayload(Notification notification) {
        String title = "SabaHub";
        String message = "You have a new notification";
        String route = "/jobs";

        if (notification.getPayload() != null) {
            Object payloadTitle = notification.getPayload().get("title");
            Object payloadMessage = notification.getPayload().get("message");
            Object payloadRoute = notification.getPayload().get("route");

            if (payloadTitle instanceof String value && !value.isBlank()) {
                title = value;
            }
            if (payloadMessage instanceof String value && !value.isBlank()) {
                message = value;
            }
            if (payloadRoute instanceof String value && !value.isBlank()) {
                route = value;
            }
        }

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("notificationId", notification.getId());
        data.put("type", notification.getType());
        data.put("route", route);
        data.put("createdAt", notification.getCreatedAt());

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("title", title);
        payload.put("body", message);
        payload.put("icon", "/next.svg");
        payload.put("badge", "/next.svg");
        payload.put("tag", "sabahub-notification-" + notification.getId());
        payload.put("data", data);

        return payload;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
