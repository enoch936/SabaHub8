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
        String details = (String) body.get("details");

        List<String> evidence = null;
        Object e = body.get("evidenceAssetIds");
        if (e instanceof List<?> list) {
            @SuppressWarnings("unchecked")
            List<String> cast = (List<String>) list;
            evidence = cast;
        }

        return ResponseEntity.ok(disputeService.openDispute(contractId, reason, details, evidence));
    }

    @GetMapping("/disputes")
    public ResponseEntity<List<Dispute>> list() {
        return ResponseEntity.ok(disputeService.listMyDisputes());
    }

    @PatchMapping("/admin/disputes/{id}")
    public ResponseEntity<Dispute> adminUpdate(@PathVariable String id, @RequestBody Map<String, Object> body) {
        Dispute.Status status = null;
        Object st = body.get("status");
        if (st instanceof String s && !s.isBlank()) {
            status = Dispute.Status.valueOf(s.trim().toUpperCase());
        }
        String note = (String) body.get("adminNote");
        return ResponseEntity.ok(disputeService.adminUpdateDispute(id, status, note));
    }

    @PostMapping("/admin/disputes/{id}/messages")
    public ResponseEntity<Dispute> adminSendMessage(@PathVariable String id, @RequestBody Map<String, Object> body) {
        Dispute.MessageTarget target = null;
        Object rawTarget = body.get("target");
        if (rawTarget instanceof String s && !s.isBlank()) {
            target = Dispute.MessageTarget.valueOf(s.trim().toUpperCase());
        }
        String content = (String) body.get("content");
        return ResponseEntity.ok(disputeService.adminSendMessage(id, target, content));
    }

    @PostMapping("/admin/disputes/{id}/controls")
    public ResponseEntity<Dispute> adminControlParticipant(@PathVariable String id, @RequestBody Map<String, Object> body) {
        String subject = (String) body.get("subject");
        Dispute.RestrictionAction action = null;
        Object rawAction = body.get("action");
        if (rawAction instanceof String s && !s.isBlank()) {
            action = Dispute.RestrictionAction.valueOf(s.trim().toUpperCase());
        }
        String note = (String) body.get("adminNote");
        return ResponseEntity.ok(disputeService.adminUpdateParticipantControl(id, subject, action, note));
    }

    @PostMapping("/admin/disputes/{id}/settlement")
    public ResponseEntity<Dispute> adminApplySettlement(@PathVariable String id, @RequestBody Map<String, Object> body) {
        double employerPercent = number(body.get("employerPercent"));
        double freelancerPercent = number(body.get("freelancerPercent"));
        double adminPercent = number(body.get("adminPercent"));
        String reserveRecipientUserId = (String) body.get("reserveRecipientUserId");
        String note = (String) body.get("note");
        return ResponseEntity.ok(disputeService.adminApplySettlement(
                id,
                employerPercent,
                freelancerPercent,
                adminPercent,
                reserveRecipientUserId,
                note
        ));
    }

    private double number(Object value) {
        return value instanceof Number n ? n.doubleValue() : 0.0d;
    }
}
