package com.sabahub.service;

import com.sabahub.domain.Contract;
import com.sabahub.domain.User;
import com.sabahub.repository.ContractRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ContractService {

    private final ContractRepository contractRepository;
    private final CurrentUserService currentUserService;

    public ContractService(ContractRepository contractRepository, CurrentUserService currentUserService) {
        this.contractRepository = contractRepository;
        this.currentUserService = currentUserService;
    }

    public List<Contract> listMyContracts() {
        User me = currentUserService.requireUser();
        List<Contract> result = new ArrayList<>();

        if (currentUserService.hasRole(me, "EMPLOYER")) {
            result.addAll(contractRepository.findByEmployerId(me.getId()));
        }
        if (currentUserService.hasRole(me, "FREELANCER")) {
            result.addAll(contractRepository.findByFreelancerId(me.getId()));
        }

        // Admin could list all via separate admin endpoint (later)
        return result;
    }

    public Contract getContract(String id) {
        User me = currentUserService.requireUser();
        Contract contract = contractRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Contract not found"));

        boolean allowed = currentUserService.hasRole(me, "ADMIN")
                || me.getId().equals(contract.getEmployerId())
                || me.getId().equals(contract.getFreelancerId());

        if (!allowed) {
            throw new IllegalStateException("Forbidden");
        }

        return contract;
    }

    public Contract deliver(String contractId, String note, String deliveryAssetId) {
        User me = currentUserService.requireUser();
        currentUserService.requireRole(me, "FREELANCER");

        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new IllegalArgumentException("Contract not found"));

        if (!me.getId().equals(contract.getFreelancerId())) {
            throw new IllegalStateException("Forbidden");
        }

        if (contract.getStatus() != Contract.Status.ACTIVE) {
            throw new IllegalStateException("Contract not active");
        }

        contract.setDeliveryNote(note);
        contract.setDeliveryAssetId(deliveryAssetId);
        contract.setStatus(Contract.Status.DELIVERED);
        return contractRepository.save(contract);
    }

    public Contract complete(String contractId) {
        User me = currentUserService.requireUser();
        currentUserService.requireRole(me, "EMPLOYER");

        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new IllegalArgumentException("Contract not found"));

        if (!me.getId().equals(contract.getEmployerId())) {
            throw new IllegalStateException("Forbidden");
        }

        if (contract.getStatus() != Contract.Status.DELIVERED) {
            throw new IllegalStateException("Contract not delivered");
        }

        // Escrow release will be handled by Payment/Escrow module (next steps)
        contract.setStatus(Contract.Status.COMPLETED);
        return contractRepository.save(contract);
    }
}
