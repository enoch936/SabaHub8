package com.sabahub.web;

import com.sabahub.service.WalletService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class WalletController {

    private final WalletService walletService;

    public WalletController(WalletService walletService) {
        this.walletService = walletService;
    }

    @GetMapping("/wallet")
    public ResponseEntity<Map<String, Object>> getWallet() {
        try {
            return ResponseEntity.ok(walletService.getWallet());
        } catch (IllegalStateException e) {
            // Return empty wallet for unauthenticated users (development mode)
            Map<String, Object> emptyWallet = new HashMap<>();
            emptyWallet.put("userId", null);
            emptyWallet.put("balance", 0.0);
            emptyWallet.put("availableBalance", 0.0);
            emptyWallet.put("currency", "ETB");
            emptyWallet.put("escrowHeld", 0.0);
            emptyWallet.put("pendingPayouts", 0.0);
            emptyWallet.put("holds", 0.0);
            emptyWallet.put("pendingLocalTopups", 0);
            emptyWallet.put("entries", new java.util.ArrayList<>());
            emptyWallet.put("transactions", new java.util.ArrayList<>());
            return ResponseEntity.ok(emptyWallet);
        }
    }
}
