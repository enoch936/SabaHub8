package com.sabahub.web;

import com.sabahub.domain.Contract;
import com.sabahub.service.EscrowService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class EscrowController {

    private final EscrowService escrowService;

    public EscrowController(EscrowService escrowService) {
        this.escrowService = escrowService;
    }

    @PostMapping("/escrow/fund")
    public ResponseEntity<Contract> fund(@RequestBody Map<String, Object> body) {
        String contractId = (String) body.get("contractId");
        double amount = body.get("amount") == null ? 0.0 : ((Number) body.get("amount")).doubleValue();
        String currency = (String) body.getOrDefault("currency", "ETB");
        return ResponseEntity.ok(escrowService.fundEscrow(contractId, amount, currency));
    }

    @PostMapping("/escrow/release")
    public ResponseEntity<Contract> release(@RequestBody Map<String, Object> body) {
        String contractId = (String) body.get("contractId");
        double amount = body.get("amount") == null ? 0.0 : ((Number) body.get("amount")).doubleValue();
        Double fee = body.get("platformFeeAmount") == null ? null : ((Number) body.get("platformFeeAmount")).doubleValue();
        return ResponseEntity.ok(escrowService.releaseEscrow(contractId, amount, fee));
    }

    @PostMapping("/escrow/refund")
    public ResponseEntity<Contract> refund(@RequestBody Map<String, Object> body) {
        String contractId = (String) body.get("contractId");
        double amount = body.get("amount") == null ? 0.0 : ((Number) body.get("amount")).doubleValue();
        return ResponseEntity.ok(escrowService.refundEscrow(contractId, amount));
    }
}
