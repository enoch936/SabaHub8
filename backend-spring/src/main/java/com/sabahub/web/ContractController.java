package com.sabahub.web;

import com.sabahub.domain.Contract;
import com.sabahub.service.ContractService;
import jakarta.validation.constraints.Size;
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

    @GetMapping("/contracts/{id}")
    public ResponseEntity<Contract> getContract(@PathVariable String id) {
        return ResponseEntity.ok(contractService.getContract(id));
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
