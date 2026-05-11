package com.sabahub.web;

import com.sabahub.service.CurrentUserService;
import com.sabahub.service.WebPushService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/push")
@Validated
public class WebPushController {

    private final WebPushService webPushService;
    private final CurrentUserService currentUserService;

    public WebPushController(WebPushService webPushService,
                             CurrentUserService currentUserService) {
        this.webPushService = webPushService;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/public-key")
    public ResponseEntity<Map<String, String>> getPublicKey() {
        return ResponseEntity.ok(Map.of("publicKey", webPushService.getPublicKey()));
    }

    @PostMapping("/subscriptions")
    public ResponseEntity<Map<String, String>> upsertSubscription(@Valid @RequestBody PushSubscriptionRequest request) {
        webPushService.saveSubscription(
                currentUserService.requireUser(),
                request.endpoint(),
                request.keys().p256dh(),
                request.keys().auth()
        );

        return ResponseEntity.ok(Map.of("status", "saved"));
    }

    @DeleteMapping("/subscriptions")
    public ResponseEntity<Map<String, String>> deleteSubscription(@Valid @RequestBody DeleteSubscriptionRequest request) {
        webPushService.removeSubscription(currentUserService.requireUser(), request.endpoint());
        return ResponseEntity.ok(Map.of("status", "deleted"));
    }

    public record PushSubscriptionRequest(
            @NotBlank String endpoint,
            @NotNull @Valid SubscriptionKeys keys
    ) {}

    public record SubscriptionKeys(
            @NotBlank String p256dh,
            @NotBlank String auth
    ) {}

    public record DeleteSubscriptionRequest(
            @NotBlank String endpoint
    ) {}
}
