package com.sabahub.web;

import com.sabahub.domain.Dispute;
import com.sabahub.service.DisputeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class DisputeController {

    private final DisputeService disputeService;

    public DisputeController(DisputeService disputeService) {
        this.disputeService = disputeService;
    }

    @PostMapping("/disputes")
    public ResponseEntity<Dispute> open(@RequestBody Map<String, Object> body) {
        String contractId = (String) body.get("contractId");
        String reason = (String) body.getOrDefault("reason", "");

        List<String> evidence = null;
        Object e = body.get("evidenceAssetIds");
        if (e instanceof List<?> list) {
            @SuppressWarnings("unchecked")
            List<String> cast = (List<String>) list;
            evidence = cast;
        }

        return ResponseEntity.ok(disputeService.openDispute(contractId, reason, evidence));
    }

    @GetMapping("/disputes")
    public ResponseEntity<List<Dispute>> list() {
        return ResponseEntity.ok(disputeService.listMyDisputes());
    }

    @PatchMapping("/admin/disputes/{id}")
    public ResponseEntity<Dispute> adminUpdate(@PathVariable String id, @RequestBody Map<String, Object> body) {
        Dispute.Status status = null;
        Object st = body.get("status");
        if (st instanceof String s) {
            status = Dispute.Status.valueOf(s);
        }
        String note = (String) body.get("adminNote");
        return ResponseEntity.ok(disputeService.adminUpdateDispute(id, status, note));
    }
}
