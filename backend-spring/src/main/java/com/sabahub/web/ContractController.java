package com.sabahub.web;

import com.sabahub.domain.Contract;
import com.sabahub.service.ContractService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ContractController {

    private final ContractService contractService;

    public ContractController(ContractService contractService) {
        this.contractService = contractService;
    }

    @GetMapping("/contracts")
    public ResponseEntity<List<Contract>> listMyContracts() {
        return ResponseEntity.ok(contractService.listMyContracts());
    }

    @PostMapping("/contracts")
    public ResponseEntity<Contract> createContract(@RequestBody Contract contract) {
        return ResponseEntity.ok(contractService.createDraftContract(contract));
    }

    @GetMapping("/contracts/{id}")
    public ResponseEntity<Contract> getContract(@PathVariable String id) {
        return ResponseEntity.ok(contractService.getContract(id));
    }

    @PostMapping("/contracts/{id}/accept")
    public ResponseEntity<Contract> acceptContract(@PathVariable String id) {
        return ResponseEntity.ok(contractService.acceptContract(id));
    }

    @PostMapping("/contracts/{id}/milestones")
    public ResponseEntity<Contract> addMilestone(@PathVariable String id, @RequestBody Contract.PaymentMilestone milestone) {
        return ResponseEntity.ok(contractService.addMilestone(id, milestone));
    }

    @PostMapping("/contracts/{contractId}/milestones/{milestoneId}/submit")
    public ResponseEntity<Contract> submitMilestone(
            @PathVariable String contractId,
            @PathVariable String milestoneId,
            @RequestBody(required = false) Map<String, String> body
    ) {
        String note = body == null ? null : body.get("note");
        return ResponseEntity.ok(contractService.submitMilestone(contractId, milestoneId, note));
    }

    @PostMapping("/contracts/{contractId}/milestones/{milestoneId}/approve")
    public ResponseEntity<Contract> approveMilestone(
            @PathVariable String contractId,
            @PathVariable String milestoneId,
            @RequestBody(required = false) Map<String, String> body
    ) {
        String feedback = body == null ? null : body.get("feedback");
        return ResponseEntity.ok(contractService.approveMilestone(contractId, milestoneId, feedback));
    }

    @PostMapping("/contracts/{id}/deliver")
    public ResponseEntity<Contract> deliver(
            @PathVariable String id,
            @RequestBody Map<String, String> body
    ) {
        String note = body.getOrDefault("note", "");
        String deliveryAssetId = body.get("deliveryAssetId");
        return ResponseEntity.ok(contractService.deliver(id, note, deliveryAssetId));
    }

    @PostMapping("/contracts/{id}/complete")
    public ResponseEntity<Contract> complete(@PathVariable String id) {
        return ResponseEntity.ok(contractService.complete(id));
    }
}
